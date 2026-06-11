/**
 * mfAccountImportService.ts — MF勘定科目インポート処理（バックエンド）
 *
 * フロント（MockMasterAccountsPage.vue）に分散していたインポートの
 * MF取得・税区分照合・差分検知・マスタ保存処理をバックエンドに集約。
 * フロントはAPI呼び出しと結果表示のみ。
 *
 * ■ 科目照合: 名前で照合（MF IDは事業者固有のため名前照合が正しい）
 * ■ 税区分ID変換: MFのtax_id→MF税区分名→マスタ税区分ID の二段階変換
 *   - MFのtax_idは事業者固有IDなので直接マスタIDに変換不可
 *   - MFから税区分リストを取得し名前でマスタと照合する（2026-06-04修正）
 *
 * エンドポイント:
 *   POST /api/mf/import-master-accounts — マスタ勘定科目インポート（差分マージ）
 *
 * 準拠:
 *   - load_context.md: ★supabase移行できるようにすべてのロジックをapi化せよ
 *   - mfTaxImportService.ts と同じアーキテクチャ
 */

import { mcpFetchAccounts } from './mfMcpClient'
import { getAllAccounts, saveAllAccounts, getAllTaxCategories } from './accountMasterApi'
import { saveMfRawData } from './mfRawDataStore'
import { getById } from './clientsApi'
import { generateMasterId } from './generateMasterId'
import { isIndividualType } from '../../constants/clientOptions'
import {
  deriveMfAccountGroup,
  deriveTaxDetermination,
} from '../../data/master/mf-account-category-mapping'
import type { Account } from '../../types/shared-account'
import { DEFAULT_EFFECTIVE_FROM } from '../../constants/mfApiConstants'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 差分検知結果
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** MFとマスタの差分情報 */
export interface AccountImportDiff {
  /** 既存行のマッチ（名前照合で一致） */
  matched: Array<{ name: string }>
  /** 新規追加（MFにあってマスタにない） */
  added: Array<{ name: string; category: string }>
  /** 削除候補（マスタにあるがMFにない。source='mf'の行のみ） */
  deprecatedCandidates: Array<{ accountId: string; name: string }>
  /** 変更なし件数 */
  unchanged: number
}

/** インポート結果 */
export interface AccountImportResult {
  /** 処理成功 */
  success: boolean
  /** MFから取得した件数 */
  mfCount: number
  /** 差分情報 */
  diff: AccountImportDiff
  /** サマリーテキスト */
  summary: string
  /** レポート行（UI表示用） */
  reportLines: string[]
  /** 更新後のマスタ科目一覧 */
  updatedAccounts: Account[]
  /** 差分あり（追加 or 名前変更） */
  hasDiff: boolean
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// インポート処理本体
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * MFから勘定科目を取得して全社マスタと差分マージする
 *
 * 処理フロー:
 * 1. MFから勘定科目一覧を取得（mcpFetchAccounts）
 * 2. 税区分マスタを読み込み（mfTaxId→マスタID変換用）
 * 3. マスタの既存データと名前で照合（MF IDは事業者固有のため名前照合のみ）
 * 4. 差分検知（新規追加のみ。MFフィールドは全社マスタに書き込まない）
 * 5. 差分をマスタに適用して保存
 * 6. MF生データを保存
 *
 * @param clientId MF認証済みの顧問先ID（MCP tokenKeyとして使用）
 */
export async function importMasterAccounts(
  clientId: string,
): Promise<AccountImportResult> {
  // 1. MFから勘定科目取得
  const mfAccounts = await mcpFetchAccounts(clientId)

  // 2. 税区分マスタ読み込み + MFから税区分取得して名前照合
  //    MFのtax_idは事業者固有IDなので直接照合不可。
  //    MFの税区分リストから「tax_id→名前」を取得し、「名前→マスタID」で変換する。
  const taxCategories = getAllTaxCategories()
  const taxNameToMasterId = new Map<string, string>()
  for (const t of taxCategories) {
    taxNameToMasterId.set(t.name, t.taxCategoryId)
  }

  // MFから税区分リストを取得してtax_id→名前マップを構築
  const { mcpFetchTaxes } = await import('./mfMcpClient')
  const mfTaxes = await mcpFetchTaxes(clientId)
  const mfTaxIdToName = new Map<string, string>()
  for (const mt of mfTaxes) {
    mfTaxIdToName.set(mt.id, mt.name)
  }

  // MFのtax_id → MF税区分名 → マスタ税区分ID の二段階変換
  const mfTaxIdToMasterId = new Map<string, string>()
  for (const [mfTaxId, mfTaxName] of mfTaxIdToName) {
    const masterId = taxNameToMasterId.get(mfTaxName)
    if (masterId) mfTaxIdToMasterId.set(mfTaxId, masterId)
  }

  // 3. マスタのディープコピーを作成（元データ非破壊）
  //    顧問先の事業形態（法人/個人）でフィルタし、同名科目の誤マッチを防止
  const masterItems: Account[] = JSON.parse(JSON.stringify(getAllAccounts()))
  const client = getById(clientId)
  const clientType = isIndividualType(client?.type) ? 'individual' : 'corp'
  const nameToRow = new Map<string, Account>()
  for (const row of masterItems) {
    // 事業形態が一致する科目のみマップに追加（73件の同名科目対策）
    if (row.target === clientType) {
      nameToRow.set(row.name, row)
    }
  }

  // 4. 差分検知（名前照合のみ。MFフィールドは全社マスタに書き込まない）
  const diff: AccountImportDiff = {
    matched: [],
    added: [],
    deprecatedCandidates: [],
    unchanged: 0,
  }

  let maxSort = Math.max(...masterItems.map(a => a.sortOrder), 0)
  // 既存IDセット（重複チェック用）: ループ外で1回だけ構築
  const existingIds = new Set(masterItems.map(a => a.accountId))

  for (const mf of mfAccounts) {
    // 名前で照合（MF IDは事業者固有のため名前照合のみ）
    const existing = nameToRow.get(mf.name)

    const masterTaxId = mfTaxIdToMasterId.get(mf.tax_id)
    const mfAccountGroup = deriveMfAccountGroup(mf.account_group, mf.category)

    if (existing) {
      // 既存行とマッチ。全社マスタにはMFフィールドを書き込まない
      // （MF IDは事業者固有。全社テンプレートに特定1社のIDを持つのは不正）

      // デフォルト税区分をMCPの値で常に上書き（MCP実機が正確。手動設定は不正確）
      // 仕訳バリデーション・ヒント・AI生成で使われるため正確な値が必須
      if (masterTaxId) {
        existing.defaultTaxCategoryId = masterTaxId
      }

      diff.matched.push({ name: mf.name })
    } else {
      // 新規追加（MFにあってマスタにない）
      // Gemini 3.5-flashでローマ字IDを生成（データ駆動フォールバック）
      // 新規追加時のtargetは顧問先の事業形態を使う
      // deriveTarget()はMFカテゴリから推定するが法人/個人の判定には使えない
      maxSort++
      const target = clientType
      const suffix = target === 'individual' ? 'IND' : 'CORP'
      const accountId = await generateMasterId(mf.name, suffix, existingIds)
      existingIds.add(accountId) // 次の重複チェック用に追加
      const newAccount: Account = {
        accountId,
        name: mf.name,
        target,
        accountGroup: mfAccountGroup,
        category: mf.category,
        defaultTaxCategoryId: masterTaxId,
        taxDetermination: deriveTaxDetermination(mfAccountGroup),
        deprecated: false,
        effectiveFrom: DEFAULT_EFFECTIVE_FROM,
        effectiveTo: null,
        sortOrder: maxSort,
        isCustom: false,
        source: 'mf' as const,
        // 全社マスタにはMFフィールドを含めない
      }
      masterItems.push(newAccount)
      diff.added.push({ name: mf.name, category: mf.category })
    }
  }

  // 5. 削除候補検知（マスタにあるがMFにない行。source='mf'のみ対象）
  // deprecated=trueにすることで過去仕訳の参照先を保持しつつ選択肢から除外
  // ★ row.target === clientType で事業形態を限定（法人インポート時に個人科目を誤って非推奨化しない）
  const mfNameSet = new Set(mfAccounts.map(a => a.name))
  for (const row of masterItems) {
    if (row.source === 'mf' && row.target === clientType && !mfNameSet.has(row.name) && !row.deprecated) {
      row.deprecated = true
      diff.deprecatedCandidates.push({ accountId: row.accountId, name: row.name })
    }
  }

  // 6. マスタを保存
  saveAllAccounts(masterItems)

  // 7. MF生データを保存
  saveMfRawData({
    clientId,
    clientName: client?.companyName ?? client?.repName ?? '',
    pattern: 'master-accounts',
    importedAt: new Date().toISOString(),
    itemCount: mfAccounts.length,
    items: mfAccounts,
  })

  // 8. レポート生成
  const reportLines: string[] = []
  reportLines.push(`📥 MF勘定科目 ${mfAccounts.length}件を照合`)
  if (diff.matched.length > 0) {
    reportLines.push(`✅ 既存マッチ: ${diff.matched.length}件`)
  }
  if (diff.added.length > 0) {
    reportLines.push(`➕ 新規追加: ${diff.added.length}件`)
    for (const a of diff.added.slice(0, 5)) reportLines.push(`  ・${a.name}（${a.category}）`)
    if (diff.added.length > 5) reportLines.push(`  …他${diff.added.length - 5}件`)
  }

  const hasDiff = diff.added.length > 0 || diff.deprecatedCandidates.length > 0

  const summaryParts = [
    diff.matched.length > 0 ? `マッチ${diff.matched.length}` : '',
    diff.added.length > 0 ? `追加${diff.added.length}` : '',
    diff.deprecatedCandidates.length > 0 ? `非表示化${diff.deprecatedCandidates.length}` : '',
  ].filter(Boolean).join(', ')

  console.log(`[mfAccountImportService] マスタインポート完了: clientId=${clientId}, ${summaryParts || '差分なし'}`)

  return {
    success: true,
    mfCount: mfAccounts.length,
    diff,
    summary: summaryParts || '差分なし',
    reportLines,
    updatedAccounts: masterItems,
    hasDiff,
  }
}

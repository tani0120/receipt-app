/**
 * aiPatternMatcher.ts — パターンマッチ（高速パス。AIなし）
 *
 * レイヤー: aiCommandRoutes → ★service★
 * 責務: ユーザーの自然言語テキストからコマンドをキーワードマッチで判定
 *
 * コマンド定義はcommandCatalog.tsの唯一の真実を参照。
 * コマンド追加時はcommandCatalog.tsだけ修正すればここにも反映される。
 *
 * 準拠:
 *   - 35_parts_catalog.md: ルーティング（パターンマッチ高速パス）
 *   - 36_infra_ui.md §2-12: AI提案フロー
 */

import { COMMAND_CATALOG } from "./commandCatalog";
import { getById as getClientById } from "./clientStore";
import type { AiSuggestion } from "./aiSuggestService";
import { getAuthStatus } from "./mfAuthService";
import {
  mcpFetchAccounts,
  mcpFetchTaxes,
  mcpFetchJournals,
  mcpFetchTermSettings,
} from "./mfMcpClient";
import { importMfJournals, commitMfImport, discardMfImport } from "./mfJournalImporter";
import { saveClientAccounts, saveClientTaxCategories, getAllAccounts } from "./accountMasterStore";
import type { Account, AccountTarget, AccountGroup, TaxDetermination } from "../../types/shared-account";
import type { TaxCategory, TaxDirection } from "../../types/shared-tax-category";

/** パターンマッチ結果 */
export interface PatternMatchResult {
  type: "text" | "table" | "suggestions";
  content: string;
  suggestions?: AiSuggestion[];
}

/**
 * コマンド別のサブ選択肢定義
 * コマンドにパラメータや選択肢がある場合に返す
 */
const COMMAND_OPTIONS: Record<string, { content: string; suggestions: AiSuggestion[] }> = {
  // ===== 管理系 =====
  sync_mf_data: {
    content: "MFデータ取込 — 何を取り込みますか？",
    suggestions: [
      {
        command: "sync_mf_data",
        label: "全データ取込",
        description: "仕訳・科目・税区分・取引先をまとめて取込",
      },
      {
        command: "sync_mf_data",
        label: "仕訳データのみ",
        description: "仕訳一覧をMFから取得してDBに保存",
      },
      {
        command: "sync_mf_data",
        label: "科目マスタのみ",
        description: "勘定科目マスタをMFから取得",
      },
      {
        command: "sync_mf_data",
        label: "税区分マスタのみ",
        description: "税区分マスタをMFから取得",
      },
      {
        command: "sync_mf_data",
        label: "取引先マスタのみ",
        description: "取引先マスタをMFから取得",
      },
    ],
  },

  // ===== 仕訳系 =====
  bank_journal: {
    content: "銀行/カード明細の仕訳候補 — 資料の種類は？",
    suggestions: [
      {
        command: "bank_journal",
        label: "銀行明細から仕訳",
        description: "銀行口座の入出金明細を取り込み",
      },
      {
        command: "bank_journal",
        label: "カード明細から仕訳",
        description: "クレジットカード明細を取り込み",
      },
    ],
  },
  receipt_journal: {
    content: "領収書の仕訳候補 — 入力方法は？",
    suggestions: [
      {
        command: "receipt_journal",
        label: "領収書を撮影/アップロード",
        description: "PDF・画像ファイルから自動読み取り",
      },
      {
        command: "receipt_journal",
        label: "手入力で仕訳",
        description: "日付・金額・取引先を手動で入力",
      },
    ],
  },
  journal_confirm: {
    content: "仕訳✓（確認・選択） — 対象を選んでください",
    suggestions: [
      {
        command: "journal_confirm",
        label: "未確認の仕訳すべて",
        description: "未承認の仕訳候補を一覧表示",
      },
      {
        command: "journal_confirm",
        label: "要注意の仕訳のみ",
        description: "AIが注意フラグを付けた仕訳のみ表示",
      },
      { command: "journal_confirm", label: "今月分のみ", description: "当月の仕訳候補を表示" },
    ],
  },
  journal_post: {
    content: "仕訳投入（MFへ登録） — 対象を選んでください",
    suggestions: [
      {
        command: "journal_post",
        label: "確認済みを全件投入",
        description: "承認済みの仕訳をまとめてMFに投入",
      },
      { command: "journal_post", label: "選択して投入", description: "投入する仕訳を個別に選択" },
    ],
  },
  journal_cancel: {
    content: "仕訳取消（修正・削除） — 操作を選んでください",
    suggestions: [
      {
        command: "journal_cancel",
        label: "直近の投入を取消",
        description: "最後に投入した仕訳を取り消す",
      },
      {
        command: "journal_cancel",
        label: "仕訳IDを指定して取消",
        description: "特定の仕訳IDを指定して修正・削除",
      },
    ],
  },
  ar_matching: {
    content: "売掛消込リスト — 期間を選んでください",
    suggestions: [
      { command: "ar_matching", label: "今月の売掛消込", description: "当月の売掛金と入金を突合" },
      { command: "ar_matching", label: "先月の売掛消込", description: "前月の売掛金と入金を突合" },
      { command: "ar_matching", label: "未消込すべて", description: "未消込の売掛金をすべて表示" },
    ],
  },
  ap_matching: {
    content: "買掛消込リスト — 期間を選んでください",
    suggestions: [
      { command: "ap_matching", label: "今月の買掛消込", description: "当月の買掛金と出金を突合" },
      { command: "ap_matching", label: "先月の買掛消込", description: "前月の買掛金と出金を突合" },
      { command: "ap_matching", label: "未消込すべて", description: "未消込の買掛金をすべて表示" },
    ],
  },
  past_similar: {
    content: "過去同一取引の仕訳 — 検索方法を選んでください",
    suggestions: [
      {
        command: "past_similar",
        label: "摘要で検索",
        description: "摘要キーワードで過去仕訳を検索",
      },
      { command: "past_similar", label: "取引先で検索", description: "取引先名で過去仕訳を検索" },
      {
        command: "past_similar",
        label: "金額帯で検索",
        description: "金額範囲を指定して過去仕訳を検索",
      },
    ],
  },

  // ===== 分析系 =====
  sales_ranking: {
    content: "売上ランキング — 集計方法を選んでください",
    suggestions: [
      {
        command: "sales_ranking",
        label: "取引先別ランキング",
        description: "取引先ごとの売上合計でランキング",
      },
      {
        command: "sales_ranking",
        label: "科目別ランキング",
        description: "売上科目ごとの合計でランキング",
      },
      { command: "sales_ranking", label: "月別推移", description: "月ごとの売上推移を表示" },
    ],
  },
  expense_ranking: {
    content: "経費ランキング — 集計方法を選んでください",
    suggestions: [
      {
        command: "expense_ranking",
        label: "科目別ランキング",
        description: "経費科目ごとの合計でランキング",
      },
      {
        command: "expense_ranking",
        label: "取引先別ランキング",
        description: "取引先ごとの経費合計でランキング",
      },
      { command: "expense_ranking", label: "月別推移", description: "月ごとの経費推移を表示" },
    ],
  },
  monthly_variance: {
    content: "月次変動科目 — 比較方法を選んでください",
    suggestions: [
      {
        command: "monthly_variance",
        label: "前月比で検出",
        description: "前月と比較して異常な変動がある科目を検出",
      },
      {
        command: "monthly_variance",
        label: "前年同月比で検出",
        description: "前年同月と比較して変動を検出",
      },
      {
        command: "monthly_variance",
        label: "今期の月次推移",
        description: "今期全月の推移から変動科目を検出",
      },
    ],
  },
  partner_list: {
    content: "売上先・仕入先・外注先一覧 — 分類を選んでください",
    suggestions: [
      {
        command: "partner_list",
        label: "全取引先",
        description: "売上先・仕入先・外注先をまとめて表示",
      },
      { command: "partner_list", label: "売上先のみ", description: "売上計上のある取引先のみ表示" },
      { command: "partner_list", label: "仕入先のみ", description: "仕入計上のある取引先のみ表示" },
      {
        command: "partner_list",
        label: "外注先のみ",
        description: "外注費計上のある取引先のみ表示",
      },
    ],
  },
  payroll_trend: {
    content: "給与・役員報酬月次推移 — 表示範囲を選んでください",
    suggestions: [
      { command: "payroll_trend", label: "今期の推移", description: "当期の人件費月次推移を表示" },
      { command: "payroll_trend", label: "前期比", description: "前期と比較した人件費推移を表示" },
    ],
  },
  three_year_plan: {
    content: "過去3期計画 — 比較対象を選んでください",
    suggestions: [
      {
        command: "three_year_plan",
        label: "PL（損益）3期比較",
        description: "過去3期の損益計算書を比較",
      },
      {
        command: "three_year_plan",
        label: "BS（資産）3期比較",
        description: "過去3期の貸借対照表を比較",
      },
      {
        command: "three_year_plan",
        label: "主要指標の3期推移",
        description: "売上・利益率・人件費率等を3期で比較",
      },
    ],
  },
  sales_change: {
    content: "売上増減ランキング — 比較期間を選んでください",
    suggestions: [
      { command: "sales_change", label: "前期比", description: "前期と比較した売上増減ランキング" },
      { command: "sales_change", label: "前月比", description: "前月と比較した売上増減ランキング" },
    ],
  },

  // ===== データ取得系 =====
  journals_period: {
    content: "仕訳取得 — 期間を選んでください",
    suggestions: [
      { command: "journals_period", label: "今月の仕訳", description: "当月の仕訳一覧を取得" },
      { command: "journals_period", label: "先月の仕訳", description: "前月の仕訳一覧を取得" },
      { command: "journals_period", label: "今期の仕訳", description: "当期の全仕訳を取得" },
      {
        command: "journals_period",
        label: "期間を指定",
        description: "開始日・終了日を指定して取得",
      },
    ],
  },
  pl_trial: {
    content: "PL試算表 — 期間を選んでください",
    suggestions: [
      { command: "pl_trial", label: "今月", description: "当月のPL試算表を取得" },
      { command: "pl_trial", label: "先月", description: "前月のPL試算表を取得" },
      { command: "pl_trial", label: "今期累計", description: "当期累計のPL試算表を取得" },
    ],
  },
  bs_trial: {
    content: "BS試算表 — 期間を選んでください",
    suggestions: [
      { command: "bs_trial", label: "今月末時点", description: "当月末時点のBS試算表を取得" },
      { command: "bs_trial", label: "先月末時点", description: "前月末時点のBS試算表を取得" },
      { command: "bs_trial", label: "期末時点", description: "直近決算期末のBS試算表を取得" },
    ],
  },
  pl_transition: {
    content: "PL推移表 — 期間を選んでください",
    suggestions: [
      { command: "pl_transition", label: "今期の月次推移", description: "当期の月次PL推移を取得" },
      { command: "pl_transition", label: "前期の月次推移", description: "前期の月次PL推移を取得" },
    ],
  },
  bs_transition: {
    content: "BS推移表 — 期間を選んでください",
    suggestions: [
      { command: "bs_transition", label: "今期の月次推移", description: "当期の月次BS推移を取得" },
      { command: "bs_transition", label: "前期の月次推移", description: "前期の月次BS推移を取得" },
    ],
  },
};

/**
 * パターンマッチ（高速パス）
 * commandCatalog.tsのkeywordsを使って完全一致→部分一致
 * サブ選択肢ラベルもマッチ対象
 */
export async function matchPattern(
  text: string,
  clientId: string,
): Promise<PatternMatchResult | null> {
  const normalized = text.trim();

  // サブ選択肢ラベルのマッチ（実行フェーズ）
  const subMatch = await matchSubOption(normalized, clientId);
  if (subMatch) return subMatch;

  const withKeywords = COMMAND_CATALOG.filter((c) => c.keywords && c.keywords.length > 0);

  // 完全一致
  for (const cmd of withKeywords) {
    if (cmd.keywords!.includes(normalized) || cmd.name === normalized) {
      return buildResult(cmd.id, cmd.name, clientId);
    }
  }

  // 部分一致
  for (const cmd of withKeywords) {
    if (cmd.keywords!.some((kw) => normalized.includes(kw))) {
      return buildResult(cmd.id, cmd.name, clientId);
    }
  }

  return null;
}

/**
 * サブ選択肢ラベルのマッチ → 期間選択 or 実行
 * 1. __exec__:cmdId:subLabel:period → 実際にAPI実行
 * 2. COMMAND_OPTIONSのlabel → 期間選択肢を返す（MFデータ取込の場合）
 */
async function matchSubOption(text: string, clientId: string): Promise<PatternMatchResult | null> {
  /** 顧問先ラベル */
  let clientLabel = '';
  if (clientId === 'all') {
    clientLabel = '📊 全社一括';
  } else if (clientId && clientId !== 'default') {
    const client = getClientById(clientId);
    clientLabel = client?.companyName ?? clientId;
  }
  const targetLine = clientLabel ? `**対象:** ${clientLabel}\n\n` : '';

  // __commit__ プレフィックス → 人間承認後の保存
  if (text.startsWith('__commit__:')) {
    const parts = text.split(':');
    const action = parts[1] ?? ''; // 'approve' or 'discard'
    const batchId = parts[2] ?? '';

    if (action === 'approve') {
      const result = commitMfImport(batchId);
      if (!result) {
        return {
          type: 'text',
          content: `${targetLine}\u274c バッチID「${batchId}」が見つかりません。\n期限切れ（10分）の可能性があります。再度取込を実行してください。`,
        };
      }
      return {
        type: 'text',
        content: `${targetLine}\u2705 **承認完了** — ${result.added}件を過去仕訳CSVに保存しました。\n（重複${result.skipped}件スキップ）`,
      };
    }

    if (action === 'discard') {
      discardMfImport(batchId);
      return {
        type: 'text',
        content: `${targetLine}\uD83D\uDDD1\uFE0F **破棄しました** — 取込データを破棄しました。`,
      };
    }
  }

  // __exec__ プレフィックス → 実行フェーズ
  if (text.startsWith('__exec__:')) {
    const parts = text.split(':');
    const cmdId = parts[1] ?? '';
    const subLabel = parts[2] ?? '';
    const periodKey = parts[3] ?? 'current';

    if (cmdId === 'sync_mf_data') {
      return await executeMfSync(subLabel, clientId, targetLine, periodKey);
    }

    const cmd = COMMAND_CATALOG.find(c => c.id === cmdId);
    const cmdName = cmd?.name ?? cmdId;
    return {
      type: 'text',
      content: `${targetLine}⏳ **${cmdName}** → **${subLabel}** を実行しています...\n\n（DB基盤完成後に実データ処理に差し替えます）`,
    };
  }

  // サブ選択肢ラベルのマッチ
  for (const [cmdId, options] of Object.entries(COMMAND_OPTIONS)) {
    const matched = options.suggestions.find(s => s.label === text);
    if (!matched) continue;

    // MFデータ取込 → 期間選択肢を返す
    if (cmdId === 'sync_mf_data') {
      return {
        type: 'suggestions',
        content: `${targetLine}**${text}** — 取込期間を選んでください`,
        suggestions: [
          {
            command: `__exec__:sync_mf_data:${text}:latest`,
            label: '最新だけ取込',
            description: '進行期のデータのみ取込',
          },
          {
            command: `__exec__:sync_mf_data:${text}:three`,
            label: '3期分（直近2期分＋進行期）',
            description: '直近2期分と進行期のデータをまとめて取込',
          },
        ],
      };
    }

    const cmd = COMMAND_CATALOG.find(c => c.id === cmdId);
    const cmdName = cmd?.name ?? cmdId;
    return {
      type: 'text',
      content: `${targetLine}⏳ **${cmdName}** → **${text}** を実行しています...\n\n（DB基盤完成後に実データ処理に差し替えます）`,
    };
  }
  return null;
}

/**
 * MFデータ取込の実行（MCP API呼び出し + データ保存）
 * @param periodKey 'latest'=最新だけ, 'three'=3期分
 */
async function executeMfSync(
  subLabel: string,
  clientId: string,
  targetLine: string,
  periodKey: string = 'latest',
): Promise<PatternMatchResult> {
  // MF認証チェック
  const status = getAuthStatus(clientId);
  if (!status.authenticated) {
    return {
      type: 'text',
      content: `${targetLine}❌ MF未認証です。\n\n先に設定画面からマネーフォワード連携（OAuth認可）を完了してください。`,
    };
  }

  // 期間ラベル
  const periodLabels: Record<string, string> = {
    latest: '最新（進行期）',
    three: '3期分（直近2期＋進行期）',
  };
  const periodLabel = periodLabels[periodKey] ?? '最新';

  const results: string[] = [];

  try {
    if (subLabel === '全データ取込' || subLabel === '仕訳データのみ') {
      const termList = await mcpFetchTermSettings(undefined, clientId);
      const periodCount = periodKey === 'three' ? 3 : 1;

      // 全バッチのbatchIdを集約（承認ボタン用）
      const batchIds: string[] = [];
      let hasWarnings = false;

      for (let i = 0; i < periodCount; i++) {
        const selected = termList[i];
        if (!selected) break;

        const journals = await mcpFetchJournals(
          { start_date: selected.start_date, end_date: selected.end_date },
          clientId,
        );

        const importResult = await importMfJournals(journals, clientId);
        batchIds.push(importResult.batchId);

        // 結果表示
        if (importResult.committed) {
          // 警告なし→即座に保存済み
          results.push(
            `✅ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
            `${journals.length}件取得 → ${importResult.added}件追加, ${importResult.skipped}件スキップ（重複）`
          );
        } else {
          // 警告あり→承認待ち
          results.push(
            `⏳ 仕訳（${selected.fiscal_year}期: ${selected.start_date}〜${selected.end_date}）: ` +
            `${journals.length}件取得 → **承認待ち**（${importResult.converted.length}件変換済み）`
          );
          hasWarnings = true;
        }

        // エラー表示
        for (const err of importResult.skippedErrors) {
          results.push(`  ❌ ${err.message}`);
        }

        // 警告表示
        for (const warn of importResult.warnings) {
          results.push(`  ⚠️ ${warn.message}`);
        }
      }

      // 警告があれば承認ボタンをsuggestionsで返す
      if (hasWarnings) {
        const approveCommands: AiSuggestion[] = [];
        for (const bid of batchIds) {
          approveCommands.push({
            command: `__commit__:approve:${bid}`,
            label: '✅ 承認して取込',
            description: '警告を確認しました。過去仕訳CSVに保存します',
          });
        }
        approveCommands.push({
          command: `__commit__:discard:${batchIds[0]}`,
          label: '🗑️ 破棄',
          description: '取込を中止し、データを破棄します',
        });

        return {
          type: 'suggestions',
          content: `${targetLine}⚠️ **MFデータ取込 — 承認が必要です**（${periodLabel}）\n\n${results.join('\n')}\n\n↑ の内容を確認し、承認または破棄を選んでください。`,
          suggestions: approveCommands,
        };
      }
    }

    if (subLabel === '全データ取込' || subLabel === '科目マスタのみ') {
      const allAccounts = await mcpFetchAccounts(clientId);
      // available=trueのみ保存（利用不可科目を除外）
      const available = allAccounts.filter((a) => a.available);
      const mapped: Account[] = available.map((a, idx) => ({
        id: a.id,
        name: a.name,
        target: 'both' as AccountTarget,
        accountGroup: 'PL_EXPENSE' as AccountGroup, // MF→Sugusru変換はSupabase移行時に実施
        category: a.category,
        defaultTaxCategoryId: undefined,
        taxDetermination: 'fixed' as TaxDetermination,
        deprecated: false,
        effectiveFrom: '2019-10-01',
        effectiveTo: null,
        sortOrder: idx + 1,
        // MF連携フィールド
        mfAccountId: a.id,
        mfAccountGroup: a.account_group,
        mfFinancialStatementType: a.financial_statement_type,
        mfDefaultTaxId: a.tax_id,
      }));
      saveClientAccounts(clientId, mapped);

      // Sugusruマスタと名前突合 → 未マッチ科目を警告表示
      const sugusruAccounts = getAllAccounts();
      const sugusruNames = new Set(sugusruAccounts.map(a => a.name));
      const matchedCount = available.filter(a => sugusruNames.has(a.name)).length;
      const unmatched = available.filter(a => !sugusruNames.has(a.name));

      let msg = `✅ 勘定科目: ${allAccounts.length}件取得 → ${available.length}件保存`;
      msg += `（Sugusruマスタとのマッチ: ${matchedCount}件 / 未マッチ: ${unmatched.length}件）`;
      if (unmatched.length > 0) {
        msg += `\n\n⚠️ **Sugusruマスタにない科目（${unmatched.length}件）:**\n`;
        msg += unmatched.slice(0, 20).map(a => `- ${a.name}`).join('\n');
        if (unmatched.length > 20) {
          msg += `\n- …他${unmatched.length - 20}件`;
        }
      }
      results.push(msg);
    }

    if (subLabel === '全データ取込' || subLabel === '税区分マスタのみ') {
      const allTaxes = await mcpFetchTaxes(clientId);
      // 免税事業者は全件available=false → フィルタなしで全件保存
      // activeプロパティにavailableを設定し、UI側のフィルタで制御
      const mapped: TaxCategory[] = allTaxes.map((t, idx) => ({
        id: t.id,
        name: t.name,
        shortName: t.abbreviation ?? '',
        direction: 'common' as TaxDirection,
        qualified: false,
        aiSelectable: t.available,
        active: t.available,
        deprecated: !t.available,
        effectiveFrom: '2019-10-01',
        effectiveTo: null,
        defaultVisible: t.available,
        displayOrder: idx + 1,
      }));
      saveClientTaxCategories(clientId, mapped);
      results.push(`✅ 税区分: ${allTaxes.length}件を取得・保存（available=${allTaxes.filter(t => t.available).length}件）`);
    }

    if (subLabel === '取引先マスタのみ') {
      results.push('⏳ 取引先マスタ取込はDB基盤完成後に実装予定です');
    }

    return {
      type: 'text',
      content: `${targetLine}🎉 **MFデータ取込完了**（${periodLabel}）\n\n${results.join('\n')}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[aiPatternMatcher] MFデータ取込失敗: ${message}`);
    return {
      type: 'text',
      content: `${targetLine}❌ **MFデータ取込に失敗しました**\n\n${message}`,
    };
  }
}

/** コマンド別に結果を組み立て（クライアント名を先頭に表示） */
function buildResult(cmdId: string, cmdName: string, clientId: string): PatternMatchResult {
  /** 顧問先ラベル解決（全社一括 / 個別会社名 / 未選択） */
  let clientLabel: string;
  if (clientId === "all") {
    clientLabel = "📊 全社一括";
  } else if (clientId === "default" || !clientId) {
    clientLabel = "⚠️ 未選択（ヘッダーで顧問先を選択または入力してください）";
  } else {
    const client = getClientById(clientId);
    clientLabel = client?.companyName ?? clientId;
  }

  const options = COMMAND_OPTIONS[cmdId];
  if (options) {
    return {
      type: "suggestions",
      content: `**対象:** ${clientLabel}\n\n${options.content}`,
      suggestions: options.suggestions,
    };
  }

  // サブ選択肢なし → モック結果
  return {
    type: "text",
    content: `**対象:** ${clientLabel}\n\n[モック] 「${cmdName}」を実行しました。\n\nDB基盤完成後に実データに差し替えます。`,
  };
}

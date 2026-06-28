/**
 * inferAccountGroupFromName.ts — 科目名からaccountGroupを推定するルールベース関数
 *
 * 断絶#55の修正:
 *   自動発番科目やDB行のフォールバックで `PL_EXPENSE` をハードコードしていた問題を解消。
 *   科目名の日本語キーワードからBS/PL/資産/負債/純資産/収益/費用を推定する。
 *   マッチしなければ `PL_EXPENSE` ではなく、console.warnで警告を出した上で `PL_EXPENSE` を返す
 *  （完全不明の場合は人間確認が必要だが、経費が最も安全なフォールバック）。
 *
 * ルール出典: test-account-classifier.ts のステップ3-4のルールを本番用に移植。
 */

import type { AccountGroup } from '../types/shared-account'

// ────────────────────────────────────────────
// キーワードルール（上から順にマッチ。最初にマッチしたものを返す）
// ────────────────────────────────────────────

/** BS資産系のキーワード */
const BS_ASSET_KEYWORDS = [
  /現金/, /預金/, /キャッシュ/,
  /売掛/, /受取手形/, /未収売上/,
  /有価証券/,  // 「投資有価証券」はINVESTMENTS側で先にマッチさせる
  /商品/, /製品/, /材料/, /仕掛品/, /貯蔵品/, /棚卸/,
  /建物/, /構築物/, /車両/, /機械/, /工具/, /器具/, /備品/, /土地/, /船舶/, /附属設備/,
  /ソフトウェア/, /特許/, /商標/, /借地権/, /電話加入権/, /のれん/,
  /出資金/, /投資有価証券/, /長期貸付/, /差入保証金/, /敷金/, /保証金/,
  /創立費/, /開業費/, /開発費/,
  /前払/, /未収/, /立替/, /仮払/, /短期貸付/, /貸付金/,
  /事業主貸/,  // 個人事業用（BS_EQUITY扱いだがMFではASSET）
]

/** BS負債系のキーワード */
const BS_LIABILITY_KEYWORDS = [
  /買掛/, /支払手形/,
  /長期借入/, /退職給付/, /役員借入/,
  /未払/, /預り/, /前受/, /仮受/, /短期借入/, /借入金/,
]

/** BS純資産系のキーワード */
const BS_EQUITY_KEYWORDS = [
  /事業主借/,
  /元入金/,
  /資本金/, /剰余金/, /資本準備金/,
  /諸口/, /未確定/,
]

/** PL収益系のキーワード */
const PL_REVENUE_KEYWORDS = [
  /売上高/, /売上$/,  // 「売上原価」は費用側で先にマッチ
  /受取利息/, /受取配当/, /雑収入/,
  /固定資産売却益/,
  /為替差益/,
]

/** PL費用系のキーワード */
const PL_EXPENSE_KEYWORDS = [
  /仕入/, /期首商品/, /期末商品/, /売上原価/, /外注/,
  /支払利息/, /為替差損/, /雑損失/,
  /固定資産売却損/,
  /引当金繰入/, /貸倒引当金繰入/,
  /引当金戻入/,
  /専従者給与/,
  // 一般的な経費科目キーワード
  /費$/, /料$/, /賃$/, /代$/, /税$/, /損$/,
  /給料/, /賃金/, /報酬/, /手当/, /賞与/,
  /減価償却/, /修繕/, /広告/, /宣伝/,
  /交通/, /通信/, /水道/, /光熱/, /保険/,
  /福利/, /厚生/, /接待/, /交際/,
  /消耗/, /事務/, /新聞/, /図書/,
  /研修/, /教育/, /採用/,
  /寄付/, /諸会/,
  /リース/, /レンタル/,
  /支払手数料/, /振込手数料/, /決済手数料/,
]

// ────────────────────────────────────────────
// 推定関数
// ────────────────────────────────────────────

/**
 * 科目名からaccountGroupを推定する。
 *
 * マッチ順序:
 *   1. PL_EXPENSE（費用）← 「売上原価」「仕入」等を収益より先にマッチさせる
 *   2. PL_REVENUE（収益）
 *   3. BS_EQUITY（純資産）← 「事業主借」等を負債より先にマッチさせる
 *   4. BS_LIABILITY（負債）
 *   5. BS_ASSET（資産）
 *   6. フォールバック: PL_EXPENSE（最も安全。誤分類時の影響が最小）
 *
 * @param accountName 科目名（日本語）
 * @returns 推定されたaccountGroup
 */
export function inferAccountGroupFromName(accountName: string): AccountGroup {
  // 「(不動産)」付きは特殊処理
  if (/\(不動産\)/.test(accountName)) {
    // 不動産収入系
    if (/収入|賃貸料|礼金|権利金|名義書換/.test(accountName)) {
      return 'PL_REVENUE'
    }
    // それ以外の不動産科目は費用
    return 'PL_EXPENSE'
  }

  // 費用（最優先: 「売上原価」「仕入」を収益より先に判定）
  if (PL_EXPENSE_KEYWORDS.some(kw => kw.test(accountName))) {
    // ただし「売上」を含む場合は収益の可能性 → 「売上原価」は費用、「売上高」は収益
    if (/売上/.test(accountName) && !/原価|値引|返品/.test(accountName)) {
      return 'PL_REVENUE'
    }
    return 'PL_EXPENSE'
  }

  // 収益
  if (PL_REVENUE_KEYWORDS.some(kw => kw.test(accountName))) {
    return 'PL_REVENUE'
  }

  // 純資産（「事業主借」を負債より先に判定）
  if (BS_EQUITY_KEYWORDS.some(kw => kw.test(accountName))) {
    return 'BS_EQUITY'
  }

  // 負債
  if (BS_LIABILITY_KEYWORDS.some(kw => kw.test(accountName))) {
    return 'BS_LIABILITY'
  }

  // 資産
  if (BS_ASSET_KEYWORDS.some(kw => kw.test(accountName))) {
    return 'BS_ASSET'
  }

  // フォールバック: PL_EXPENSE（最も安全）
  // ただし警告を出す（人間確認が必要な可能性）
  console.warn(
    `[inferAccountGroupFromName] 科目「${accountName}」のaccountGroupを推定できません。` +
    `PL_EXPENSE（費用）をデフォルト設定しますが、人間確認を推奨します。`
  )
  return 'PL_EXPENSE'
}

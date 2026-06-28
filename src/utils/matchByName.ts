/**
 * matchByName.ts — 名前ベースの照合ユーティリティ
 *
 * MF API（MCP）のデータとスグスルマスタを名前で突合する共通関数。
 * mfMappingService / mfTaxImportService 等で重複していたパターンを集約。
 *
 * 照合方式:
 * - デフォルト: 完全一致
 * - normalize: true 指定時: 正規化突合（全半角統一 + 空白除去）
 *
 * @module matchByName
 */

/**
 * 名前を正規化する（全半角統一 + 空白除去）
 *
 * 変換内容:
 * - 全角英数字 → 半角英数字（Ａ→A, ０→0, ％→%）
 * - 全角スペース → 半角スペース
 * - 連続空白を1つに圧縮
 * - 前後の空白を除去
 *
 * 変換しないもの:
 * - 全角カタカナ/ひらがな/漢字（会計用語のため保持）
 * - 全角記号のうち「（」「）」「・」等（会計名称で意味がある）
 *
 * @example normalizeName('課税仕入　１０％') // '課税仕入 10%'
 * @example normalizeName('Ａランク経費') // 'Aランク経費'
 */
export function normalizeName(name: string): string {
  return name
    // 全角英数字・記号（U+FF01〜U+FF5E）→ 半角（U+0021〜U+007E）
    .replace(/[\uFF01-\uFF5E]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    )
    // 全角スペース → 半角スペース
    .replace(/\u3000/g, ' ')
    // 連続空白を1つに圧縮
    .replace(/\s+/g, ' ')
    // 前後の空白を除去
    .trim()
}

/**
 * 配列から名前→オブジェクトのMapを構築する
 *
 * @param items - 名前を持つオブジェクトの配列
 * @param getName - オブジェクトから名前を取得する関数
 * @param filter - オプション。Mapに含める条件（trueを返した要素のみ追加）
 * @param normalize - trueの場合、名前を正規化してからMapに登録（デフォルト: false）
 * @returns 名前→オブジェクトのMap（同名が複数ある場合は後勝ち）
 *
 * @example
 * // MF科目を名前→IDのマップに変換（available=trueのみ）
 * const mfByName = buildNameMap(mfAccounts, a => a.name, a => a.available !== false)
 *
 * @example
 * // マスタの名前→行マップを構築（正規化突合）
 * const masterByName = buildNameMap(masterItems, m => m.name, undefined, true)
 */
export function buildNameMap<T>(
  items: readonly T[],
  getName: (item: T) => string,
  filter?: (item: T) => boolean,
  normalize: boolean = false,
): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items) {
    if (filter && !filter(item)) continue
    const key = normalize ? normalizeName(getName(item)) : getName(item)
    map.set(key, item)
  }
  return map
}

/**
 * 名前で照合してマッチしたオブジェクトを返す
 *
 * @param nameMap - buildNameMapで構築したMap
 * @param name - 検索する名前
 * @param normalize - trueの場合、検索名も正規化してから照合（デフォルト: false）
 * @returns マッチしたオブジェクト。未マッチならundefined
 *
 * @example
 * // 完全一致
 * const match = matchByName(mfByName, '現金')
 *
 * @example
 * // 正規化突合（全角→半角変換して照合）
 * const match = matchByName(mfByName, '課税仕入　１０％', true)
 */
export function matchByName<T>(
  nameMap: Map<string, T>,
  name: string,
  normalize: boolean = false,
): T | undefined {
  const key = normalize ? normalizeName(name) : name
  return nameMap.get(key)
}

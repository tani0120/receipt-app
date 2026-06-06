/**
 * コピー・デフォルト順で使用する共通ユーティリティ
 * MockMasterAccountsPage / MockMasterTaxCategoriesPage /
 * MockClientAccountsPage / MockClientTaxPage で共有
 */

/** IDを取得するヘルパー（accountId / taxCategoryId / id のいずれかを返す） */
function extractId(row: Record<string, unknown>): string {
  return (row.taxCategoryId ?? row.accountId ?? row.id ?? '') as string;
}

/**
 * 既存IDから copyCounter の初期値を算出（リロード後のID衝突防止）
 * _COPY_N や NEW_TAX_N / NEW_N のパターンから最大値を取得
 */
export function getInitialCopyCounter(rows: Record<string, unknown>[]): number {
  let max = 0;
  for (const r of rows) {
    const id = extractId(r);
    if (!id) continue;
    const copyMatches = id.match(/_COPY_(\d+)/g);
    if (copyMatches) {
      for (const m of copyMatches) {
        const num = parseInt(m.replace('_COPY_', ''), 10);
        if (num > max) max = num;
      }
    }
    const newMatch = id.match(/^NEW(?:_TAX)?_(\d+)$/);
    if (newMatch) {
      const num = parseInt(newMatch[1]!, 10);
      if (num > max) max = num;
    }
  }
  return max;
}

/**
 * insertAfterチェーンに従って子要素を再帰的に展開
 * Account / TaxCategory どちらでも使えるジェネリック版
 *
 * @param parentId 親のID
 * @param childrenByParent insertAfter → 子要素配列のMap
 * @param idKey IDフィールド名
 * @param depth 再帰深さ（循環参照防止、最大10）
 */
export function expandInsertAfterChain<T extends Record<string, unknown>>(
  parentId: string,
  childrenByParent: Map<string, T[]>,
  idKey: string = 'taxCategoryId',
  depth = 0
): T[] {
  if (depth > 10) return []; // 循環参照防止
  const children = childrenByParent.get(parentId) ?? [];
  const result: T[] = [];
  for (const child of children) {
    result.push(child);
    const childId = (child[idKey] ?? '') as string;
    result.push(...expandInsertAfterChain(childId, childrenByParent, idKey, depth + 1));
  }
  return result;
}

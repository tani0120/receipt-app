/**
 * 3ソフト間 税区分名称対応表（自動生成）
 *
 * 正本: MF名（tax-category-master.ts）
 * 弥生: 税込(込)/税抜(内) の2パターン
 * freee: 1パターン
 * 全151件
 */

export interface TaxCategoryMapping {
  /** 内部ID（tax-category-master.tsのid） */
  id: string
  /** MFクラウド会計の税区分名（正本） */
  mf: string
  /** 弥生会計の税区分名（税込経理） */
  yayoi_incl: string
  /** 弥生会計の税区分名（税抜経理） */
  yayoi_excl: string
  /** freee会計の税区分名 */
  freee: string
  /** 取引方向 */
  direction: 'sales' | 'purchase' | 'common'
}

export const TAX_CATEGORY_MAPPING: readonly TaxCategoryMapping[] = [
  { id: 'COMMON_UNKNOWN', mf: '不明', yayoi_incl: '不明', yayoi_excl: '不明', freee: '不明', direction: 'common' },
  { id: 'COMMON_EXEMPT', mf: '対象外', yayoi_incl: '対象外', yayoi_excl: '対象外', freee: '対象外', direction: 'common' },
  { id: 'SALES_TAXABLE_10', mf: '課税売上 10%', yayoi_incl: '課税売上込 10%', yayoi_excl: '課税売上内 10%', freee: '課売 10%', direction: 'sales' },
  { id: 'SALES_TAXABLE_10_T1', mf: '課税売上 10% 一種', yayoi_incl: '課税売上込 10% 一種', yayoi_excl: '課税売上内 10% 一種', freee: '課売 10% 一種', direction: 'sales' },
  { id: 'SALES_TAXABLE_10_T2', mf: '課税売上 10% 二種', yayoi_incl: '課税売上込 10% 二種', yayoi_excl: '課税売上内 10% 二種', freee: '課売 10% 二種', direction: 'sales' },
  { id: 'SALES_TAXABLE_10_T3', mf: '課税売上 10% 三種', yayoi_incl: '課税売上込 10% 三種', yayoi_excl: '課税売上内 10% 三種', freee: '課売 10% 三種', direction: 'sales' },
  { id: 'SALES_TAXABLE_10_T4', mf: '課税売上 10% 四種', yayoi_incl: '課税売上込 10% 四種', yayoi_excl: '課税売上内 10% 四種', freee: '課売 10% 四種', direction: 'sales' },
  { id: 'SALES_TAXABLE_10_T5', mf: '課税売上 10% 五種', yayoi_incl: '課税売上込 10% 五種', yayoi_excl: '課税売上内 10% 五種', freee: '課売 10% 五種', direction: 'sales' },
  { id: 'SALES_TAXABLE_10_T6', mf: '課税売上 10% 六種', yayoi_incl: '課税売上込 10% 六種', yayoi_excl: '課税売上内 10% 六種', freee: '課売 10% 六種', direction: 'sales' },
  { id: 'SALES_REDUCED_8', mf: '課税売上 (軽)8%', yayoi_incl: '課税売上込 軽減8%', yayoi_excl: '課税売上内 軽減8%', freee: '課売 (軽)8%', direction: 'sales' },
  { id: 'SALES_REDUCED_8_T1', mf: '課税売上 (軽)8% 一種', yayoi_incl: '課税売上込 軽減8% 一種', yayoi_excl: '課税売上内 軽減8% 一種', freee: '課売 (軽)8% 一種', direction: 'sales' },
  { id: 'SALES_REDUCED_8_T2', mf: '課税売上 (軽)8% 二種', yayoi_incl: '課税売上込 軽減8% 二種', yayoi_excl: '課税売上内 軽減8% 二種', freee: '課売 (軽)8% 二種', direction: 'sales' },
  { id: 'SALES_REDUCED_8_T3', mf: '課税売上 (軽)8% 三種', yayoi_incl: '課税売上込 軽減8% 三種', yayoi_excl: '課税売上内 軽減8% 三種', freee: '課売 (軽)8% 三種', direction: 'sales' },
  { id: 'SALES_REDUCED_8_T4', mf: '課税売上 (軽)8% 四種', yayoi_incl: '課税売上込 軽減8% 四種', yayoi_excl: '課税売上内 軽減8% 四種', freee: '課売 (軽)8% 四種', direction: 'sales' },
  { id: 'SALES_REDUCED_8_T5', mf: '課税売上 (軽)8% 五種', yayoi_incl: '課税売上込 軽減8% 五種', yayoi_excl: '課税売上内 軽減8% 五種', freee: '課売 (軽)8% 五種', direction: 'sales' },
  { id: 'SALES_REDUCED_8_T6', mf: '課税売上 (軽)8% 六種', yayoi_incl: '課税売上込 軽減8% 六種', yayoi_excl: '課税売上内 軽減8% 六種', freee: '課売 (軽)8% 六種', direction: 'sales' },
  { id: 'SALES_TAXABLE_8', mf: '課税売上 8%', yayoi_incl: '課税売上込 8%', yayoi_excl: '課税売上内 8%', freee: '課売 8%', direction: 'sales' },
  { id: 'SALES_TAXABLE_8_T1', mf: '課税売上 8% 一種', yayoi_incl: '課税売上込 8% 一種', yayoi_excl: '課税売上内 8% 一種', freee: '課売 8% 一種', direction: 'sales' },
  { id: 'SALES_TAXABLE_8_T2', mf: '課税売上 8% 二種', yayoi_incl: '課税売上込 8% 二種', yayoi_excl: '課税売上内 8% 二種', freee: '課売 8% 二種', direction: 'sales' },
  { id: 'SALES_TAXABLE_8_T3', mf: '課税売上 8% 三種', yayoi_incl: '課税売上込 8% 三種', yayoi_excl: '課税売上内 8% 三種', freee: '課売 8% 三種', direction: 'sales' },
  { id: 'SALES_TAXABLE_8_T4', mf: '課税売上 8% 四種', yayoi_incl: '課税売上込 8% 四種', yayoi_excl: '課税売上内 8% 四種', freee: '課売 8% 四種', direction: 'sales' },
  { id: 'SALES_TAXABLE_8_T5', mf: '課税売上 8% 五種', yayoi_incl: '課税売上込 8% 五種', yayoi_excl: '課税売上内 8% 五種', freee: '課売 8% 五種', direction: 'sales' },
  { id: 'SALES_TAXABLE_8_T6', mf: '課税売上 8% 六種', yayoi_incl: '課税売上込 8% 六種', yayoi_excl: '課税売上内 8% 六種', freee: '課売 8% 六種', direction: 'sales' },
  { id: 'SALES_TAXABLE_5', mf: '課税売上 5%', yayoi_incl: '課税売上込 5%', yayoi_excl: '課税売上内 5%', freee: '課売 5%', direction: 'sales' },
  { id: 'SALES_TAXABLE_5_T1', mf: '課税売上 5% 一種', yayoi_incl: '課税売上込 5% 一種', yayoi_excl: '課税売上内 5% 一種', freee: '課売 5% 一種', direction: 'sales' },
  { id: 'SALES_TAXABLE_5_T2', mf: '課税売上 5% 二種', yayoi_incl: '課税売上込 5% 二種', yayoi_excl: '課税売上内 5% 二種', freee: '課売 5% 二種', direction: 'sales' },
  { id: 'SALES_TAXABLE_5_T3', mf: '課税売上 5% 三種', yayoi_incl: '課税売上込 5% 三種', yayoi_excl: '課税売上内 5% 三種', freee: '課売 5% 三種', direction: 'sales' },
  { id: 'SALES_TAXABLE_5_T4', mf: '課税売上 5% 四種', yayoi_incl: '課税売上込 5% 四種', yayoi_excl: '課税売上内 5% 四種', freee: '課売 5% 四種', direction: 'sales' },
  { id: 'SALES_TAXABLE_5_T5', mf: '課税売上 5% 五種', yayoi_incl: '課税売上込 5% 五種', yayoi_excl: '課税売上内 5% 五種', freee: '課売 5% 五種', direction: 'sales' },
  { id: 'SALES_TAXABLE_5_T6', mf: '課税売上 5% 六種', yayoi_incl: '課税売上込 5% 六種', yayoi_excl: '課税売上内 5% 六種', freee: '課売 5% 六種', direction: 'sales' },
  { id: 'SALES_EXPORT_0', mf: '輸出売上 0%', yayoi_incl: '輸出売上 0%', yayoi_excl: '輸出売上 0%', freee: '輸出売上 0%', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE', mf: '非課税売上', yayoi_incl: '非課売上', yayoi_excl: '非課売上', freee: '非課売上', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE_SECURITIES', mf: '非課税売上-有価証券譲渡', yayoi_incl: '非課売上-有証', yayoi_excl: '非課売上-有証', freee: '非課税売上-有価証券譲渡', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE_EXPORT', mf: '非課税資産輸出', yayoi_incl: '非課輸出', yayoi_excl: '非課輸出', freee: '非課税資産輸出', direction: 'sales' },
  { id: 'SALES_EXEMPT', mf: '対象外売上', yayoi_incl: '対外売上', yayoi_excl: '対外売上', freee: '対外売上', direction: 'sales' },
  { id: 'SALES_RETURN_10', mf: '課税売上-返還等 10%', yayoi_incl: '課税売返込 10%', yayoi_excl: '課税売返内 10%', freee: '課売返還 10%', direction: 'sales' },
  { id: 'SALES_RETURN_10_T1', mf: '課税売上-返還等 10% 一種', yayoi_incl: '課税売返込 10% 一種', yayoi_excl: '課税売返内 10% 一種', freee: '課売返還 10% 一種', direction: 'sales' },
  { id: 'SALES_RETURN_10_T2', mf: '課税売上-返還等 10% 二種', yayoi_incl: '課税売返込 10% 二種', yayoi_excl: '課税売返内 10% 二種', freee: '課売返還 10% 二種', direction: 'sales' },
  { id: 'SALES_RETURN_10_T3', mf: '課税売上-返還等 10% 三種', yayoi_incl: '課税売返込 10% 三種', yayoi_excl: '課税売返内 10% 三種', freee: '課売返還 10% 三種', direction: 'sales' },
  { id: 'SALES_RETURN_10_T4', mf: '課税売上-返還等 10% 四種', yayoi_incl: '課税売返込 10% 四種', yayoi_excl: '課税売返内 10% 四種', freee: '課売返還 10% 四種', direction: 'sales' },
  { id: 'SALES_RETURN_10_T5', mf: '課税売上-返還等 10% 五種', yayoi_incl: '課税売返込 10% 五種', yayoi_excl: '課税売返内 10% 五種', freee: '課売返還 10% 五種', direction: 'sales' },
  { id: 'SALES_RETURN_10_T6', mf: '課税売上-返還等 10% 六種', yayoi_incl: '課税売返込 10% 六種', yayoi_excl: '課税売返内 10% 六種', freee: '課売返還 10% 六種', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8', mf: '課税売上-返還等 (軽)8%', yayoi_incl: '課税売返込 軽減8%', yayoi_excl: '課税売返内 軽減8%', freee: '課売返還 (軽)8%', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8_T1', mf: '課税売上-返還等 (軽)8% 一種', yayoi_incl: '課税売返込 軽減8% 一種', yayoi_excl: '課税売返内 軽減8% 一種', freee: '課売返還 (軽)8% 一種', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8_T2', mf: '課税売上-返還等 (軽)8% 二種', yayoi_incl: '課税売返込 軽減8% 二種', yayoi_excl: '課税売返内 軽減8% 二種', freee: '課売返還 (軽)8% 二種', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8_T3', mf: '課税売上-返還等 (軽)8% 三種', yayoi_incl: '課税売返込 軽減8% 三種', yayoi_excl: '課税売返内 軽減8% 三種', freee: '課売返還 (軽)8% 三種', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8_T4', mf: '課税売上-返還等 (軽)8% 四種', yayoi_incl: '課税売返込 軽減8% 四種', yayoi_excl: '課税売返内 軽減8% 四種', freee: '課売返還 (軽)8% 四種', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8_T5', mf: '課税売上-返還等 (軽)8% 五種', yayoi_incl: '課税売返込 軽減8% 五種', yayoi_excl: '課税売返内 軽減8% 五種', freee: '課売返還 (軽)8% 五種', direction: 'sales' },
  { id: 'SALES_RETURN_REDUCED_8_T6', mf: '課税売上-返還等 (軽)8% 六種', yayoi_incl: '課税売返込 軽減8% 六種', yayoi_excl: '課税売返内 軽減8% 六種', freee: '課売返還 (軽)8% 六種', direction: 'sales' },
  { id: 'SALES_RETURN_8', mf: '課税売上-返還等 8%', yayoi_incl: '課税売返込 8%', yayoi_excl: '課税売返内 8%', freee: '課売返還 8%', direction: 'sales' },
  { id: 'SALES_RETURN_8_T1', mf: '課税売上-返還等 8% 一種', yayoi_incl: '課税売返込 8% 一種', yayoi_excl: '課税売返内 8% 一種', freee: '課売返還 8% 一種', direction: 'sales' },
  { id: 'SALES_RETURN_8_T2', mf: '課税売上-返還等 8% 二種', yayoi_incl: '課税売返込 8% 二種', yayoi_excl: '課税売返内 8% 二種', freee: '課売返還 8% 二種', direction: 'sales' },
  { id: 'SALES_RETURN_8_T3', mf: '課税売上-返還等 8% 三種', yayoi_incl: '課税売返込 8% 三種', yayoi_excl: '課税売返内 8% 三種', freee: '課売返還 8% 三種', direction: 'sales' },
  { id: 'SALES_RETURN_8_T4', mf: '課税売上-返還等 8% 四種', yayoi_incl: '課税売返込 8% 四種', yayoi_excl: '課税売返内 8% 四種', freee: '課売返還 8% 四種', direction: 'sales' },
  { id: 'SALES_RETURN_8_T5', mf: '課税売上-返還等 8% 五種', yayoi_incl: '課税売返込 8% 五種', yayoi_excl: '課税売返内 8% 五種', freee: '課売返還 8% 五種', direction: 'sales' },
  { id: 'SALES_RETURN_8_T6', mf: '課税売上-返還等 8% 六種', yayoi_incl: '課税売返込 8% 六種', yayoi_excl: '課税売返内 8% 六種', freee: '課売返還 8% 六種', direction: 'sales' },
  { id: 'SALES_RETURN_5', mf: '課税売上-返還等 5%', yayoi_incl: '課税売返込 5%', yayoi_excl: '課税売返内 5%', freee: '課売返還 5%', direction: 'sales' },
  { id: 'SALES_RETURN_5_T1', mf: '課税売上-返還等 5% 一種', yayoi_incl: '課税売返込 5% 一種', yayoi_excl: '課税売返内 5% 一種', freee: '課売返還 5% 一種', direction: 'sales' },
  { id: 'SALES_RETURN_5_T2', mf: '課税売上-返還等 5% 二種', yayoi_incl: '課税売返込 5% 二種', yayoi_excl: '課税売返内 5% 二種', freee: '課売返還 5% 二種', direction: 'sales' },
  { id: 'SALES_RETURN_5_T3', mf: '課税売上-返還等 5% 三種', yayoi_incl: '課税売返込 5% 三種', yayoi_excl: '課税売返内 5% 三種', freee: '課売返還 5% 三種', direction: 'sales' },
  { id: 'SALES_RETURN_5_T4', mf: '課税売上-返還等 5% 四種', yayoi_incl: '課税売返込 5% 四種', yayoi_excl: '課税売返内 5% 四種', freee: '課売返還 5% 四種', direction: 'sales' },
  { id: 'SALES_RETURN_5_T5', mf: '課税売上-返還等 5% 五種', yayoi_incl: '課税売返込 5% 五種', yayoi_excl: '課税売返内 5% 五種', freee: '課売返還 5% 五種', direction: 'sales' },
  { id: 'SALES_RETURN_5_T6', mf: '課税売上-返還等 5% 六種', yayoi_incl: '課税売返込 5% 六種', yayoi_excl: '課税売返内 5% 六種', freee: '課売返還 5% 六種', direction: 'sales' },
  { id: 'SALES_EXPORT_RETURN_0', mf: '輸出売上-返還等 0%', yayoi_incl: '輸出売上-返還等 0%', yayoi_excl: '輸出売上-返還等 0%', freee: '輸出売上-返還等 0%', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE_RETURN', mf: '非課税売上-返還等', yayoi_incl: '非課売返', yayoi_excl: '非課売返', freee: '非課税売上-返還等', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE_EXPORT_RETURN', mf: '非課税資産輸出-返還等', yayoi_incl: '非課輸出-返還', yayoi_excl: '非課輸出-返還', freee: '非課税資産輸出-返還等', direction: 'sales' },
  { id: 'SALES_BAD_DEBT_10', mf: '課税売上-貸倒 10%', yayoi_incl: '課税貸倒込 10%', yayoi_excl: '課税貸倒内 10%', freee: '貸倒 10%', direction: 'sales' },
  { id: 'SALES_BAD_DEBT_REDUCED_8', mf: '課税売上-貸倒 (軽)8%', yayoi_incl: '課税貸倒込 軽減8%', yayoi_excl: '課税貸倒内 軽減8%', freee: '貸倒 (軽)8%', direction: 'sales' },
  { id: 'SALES_BAD_DEBT_8', mf: '課税売上-貸倒 8%', yayoi_incl: '課税貸倒込 8%', yayoi_excl: '課税貸倒内 8%', freee: '貸倒 8%', direction: 'sales' },
  { id: 'SALES_BAD_DEBT_5', mf: '課税売上-貸倒 5%', yayoi_incl: '課税貸倒込 5%', yayoi_excl: '課税貸倒内 5%', freee: '貸倒 5%', direction: 'sales' },
  { id: 'SALES_EXPORT_BAD_DEBT_0', mf: '輸出売上-貸倒 0%', yayoi_incl: '輸出売上-貸倒 0%', yayoi_excl: '輸出売上-貸倒 0%', freee: '輸出売上-貸倒 0%', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE_BAD_DEBT', mf: '非課税売上-貸倒', yayoi_incl: '非課貸倒', yayoi_excl: '非課貸倒', freee: '非課税売上-貸倒', direction: 'sales' },
  { id: 'SALES_NON_TAXABLE_EXPORT_BAD_DEBT', mf: '非課税資産輸出-貸倒', yayoi_incl: '非課輸出-貸倒', yayoi_excl: '非課輸出-貸倒', freee: '非課税資産輸出-貸倒', direction: 'sales' },
  { id: 'SALES_RECOVERY_10', mf: '課税売上-貸倒回収 10%', yayoi_incl: '貸倒回収込 10%', yayoi_excl: '貸倒回収内 10%', freee: '貸倒回収 10%', direction: 'sales' },
  { id: 'SALES_RECOVERY_REDUCED_8', mf: '課税売上-貸倒回収 (軽)8%', yayoi_incl: '貸倒回収込 軽減8%', yayoi_excl: '貸倒回収内 軽減8%', freee: '貸倒回収 (軽)8%', direction: 'sales' },
  { id: 'SALES_RECOVERY_8', mf: '課税売上-貸倒回収 8%', yayoi_incl: '貸倒回収込 8%', yayoi_excl: '貸倒回収内 8%', freee: '貸倒回収 8%', direction: 'sales' },
  { id: 'SALES_RECOVERY_5', mf: '課税売上-貸倒回収 5%', yayoi_incl: '貸倒回収込 5%', yayoi_excl: '貸倒回収内 5%', freee: '貸倒回収 5%', direction: 'sales' },
  { id: 'PURCHASE_TAXABLE_10', mf: '課税仕入 10%', yayoi_incl: '課対仕入込 10%', yayoi_excl: '課対仕入内 10%', freee: '課対仕入 10%', direction: 'purchase' },
  { id: 'PURCHASE_COMMON_10', mf: '共通課税仕入 10%', yayoi_incl: '共対仕入込 10%', yayoi_excl: '共対仕入内 10%', freee: '共対仕入 10%', direction: 'purchase' },
  { id: 'PURCHASE_NT_10', mf: '非課税対応仕入 10%', yayoi_incl: '非対仕入込 10%', yayoi_excl: '非対仕入内 10%', freee: '非対仕入 10%', direction: 'purchase' },
  { id: 'PURCHASE_REDUCED_8', mf: '課税仕入 (軽)8%', yayoi_incl: '課対仕入込 軽減8%', yayoi_excl: '課対仕入内 軽減8%', freee: '課対仕入 (軽)8%', direction: 'purchase' },
  { id: 'PURCHASE_COMMON_REDUCED_8', mf: '共通課税仕入 (軽)8%', yayoi_incl: '共対仕入込 軽減8%', yayoi_excl: '共対仕入内 軽減8%', freee: '共対仕入 (軽)8%', direction: 'purchase' },
  { id: 'PURCHASE_NT_REDUCED_8', mf: '非課税対応仕入 (軽)8%', yayoi_incl: '非対仕入込 軽減8%', yayoi_excl: '非対仕入内 軽減8%', freee: '非対仕入 (軽)8%', direction: 'purchase' },
  { id: 'PURCHASE_TAXABLE_8', mf: '課税仕入 8%', yayoi_incl: '課対仕入込 8%', yayoi_excl: '課対仕入内 8%', freee: '課対仕入 8%', direction: 'purchase' },
  { id: 'PURCHASE_COMMON_8', mf: '共通課税仕入 8%', yayoi_incl: '共対仕入込 8%', yayoi_excl: '共対仕入内 8%', freee: '共対仕入 8%', direction: 'purchase' },
  { id: 'PURCHASE_NT_8', mf: '非課税対応仕入 8%', yayoi_incl: '非対仕入込 8%', yayoi_excl: '非対仕入内 8%', freee: '非対仕入 8%', direction: 'purchase' },
  { id: 'PURCHASE_TAXABLE_5', mf: '課税仕入 5%', yayoi_incl: '課対仕入込 5%', yayoi_excl: '課対仕入内 5%', freee: '課対仕入 5%', direction: 'purchase' },
  { id: 'PURCHASE_COMMON_5', mf: '共通課税仕入 5%', yayoi_incl: '共対仕入込 5%', yayoi_excl: '共対仕入内 5%', freee: '共対仕入 5%', direction: 'purchase' },
  { id: 'PURCHASE_NT_5', mf: '非課税対応仕入 5%', yayoi_incl: '非対仕入込 5%', yayoi_excl: '非対仕入内 5%', freee: '非対仕入 5%', direction: 'purchase' },
  { id: 'IMPORT_BODY_10', mf: '輸入仕入-本体 10%', yayoi_incl: '課対輸本込 10%', yayoi_excl: '課対輸本内 10%', freee: '課対輸本 10%', direction: 'purchase' },
  { id: 'IMPORT_TAX_7_8', mf: '輸入仕入-消費税額 7.8%', yayoi_incl: '課対輸税込 7.8%', yayoi_excl: '課対輸税内 7.8%', freee: '課対輸税 7.8%', direction: 'purchase' },
  { id: 'IMPORT_LOCAL_2_2', mf: '輸入仕入-地方消費税額 2.2%', yayoi_incl: '課対輸地込 2.2%', yayoi_excl: '課対輸地内 2.2%', freee: '課対輸地 2.2%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_BODY_10', mf: '共通輸入仕入-本体 10%', yayoi_incl: '共対輸本込 10%', yayoi_excl: '共対輸本内 10%', freee: '共対輸本 10%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_TAX_7_8', mf: '共通輸入仕入-消費税額 7.8%', yayoi_incl: '共対輸税込 7.8%', yayoi_excl: '共対輸税内 7.8%', freee: '共対輸税 7.8%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_LOCAL_2_2', mf: '共通輸入仕入-地方消費税額 2.2%', yayoi_incl: '共対輸地込 2.2%', yayoi_excl: '共対輸地内 2.2%', freee: '共対輸地 2.2%', direction: 'purchase' },
  { id: 'IMPORT_NT_BODY_10', mf: '非課税対応輸入-本体 10%', yayoi_incl: '非課税対応輸入-本体 10%', yayoi_excl: '非課税対応輸入-本体 10%', freee: '非対輸本 10%', direction: 'purchase' },
  { id: 'IMPORT_NT_TAX_7_8', mf: '非課税対応輸入-消費税額 7.8%', yayoi_incl: '非課税対応輸入-消費税額 7.8%', yayoi_excl: '非課税対応輸入-消費税額 7.8%', freee: '非対輸税 7.8%', direction: 'purchase' },
  { id: 'IMPORT_NT_LOCAL_2_2', mf: '非課税対応輸入-地方消費税額 2.2%', yayoi_incl: '非課税対応輸入-地方消費税額 2.2%', yayoi_excl: '非課税対応輸入-地方消費税額 2.2%', freee: '非対輸地 2.2%', direction: 'purchase' },
  { id: 'IMPORT_BODY_REDUCED_8', mf: '輸入仕入-本体 (軽)8%', yayoi_incl: '課対輸本込 軽減8%', yayoi_excl: '課対輸本内 軽減8%', freee: '課対輸本 (軽)8%', direction: 'purchase' },
  { id: 'IMPORT_TAX_REDUCED_6_24', mf: '輸入仕入-消費税額 (軽)6.24%', yayoi_incl: '課対輸税込 軽減6.24%', yayoi_excl: '課対輸税内 軽減6.24%', freee: '課対輸税 (軽)6.24%', direction: 'purchase' },
  { id: 'IMPORT_LOCAL_REDUCED_1_76', mf: '輸入仕入-地方消費税額 (軽)1.76%', yayoi_incl: '課対輸地込 軽減1.76%', yayoi_excl: '課対輸地内 軽減1.76%', freee: '課対輸地 (軽)1.76%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_BODY_REDUCED_8', mf: '共通輸入仕入-本体 (軽)8%', yayoi_incl: '共対輸本込 軽減8%', yayoi_excl: '共対輸本内 軽減8%', freee: '共対輸本 (軽)8%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_TAX_REDUCED_6_24', mf: '共通輸入仕入-消費税額 (軽)6.24%', yayoi_incl: '共対輸税込 軽減6.24%', yayoi_excl: '共対輸税内 軽減6.24%', freee: '共対輸税 (軽)6.24%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_LOCAL_REDUCED_1_76', mf: '共通輸入仕入-地方消費税額 (軽)1.76%', yayoi_incl: '共対輸地込 軽減1.76%', yayoi_excl: '共対輸地内 軽減1.76%', freee: '共対輸地 (軽)1.76%', direction: 'purchase' },
  { id: 'IMPORT_NT_BODY_REDUCED_8', mf: '非課税対応輸入-本体 (軽)8%', yayoi_incl: '非課税対応輸入-本体 軽減8%', yayoi_excl: '非課税対応輸入-本体 軽減8%', freee: '非対輸本 (軽)8%', direction: 'purchase' },
  { id: 'IMPORT_NT_TAX_REDUCED_6_24', mf: '非課税対応輸入-消費税額 (軽)6.24%', yayoi_incl: '非課税対応輸入-消費税額 軽減6.24%', yayoi_excl: '非課税対応輸入-消費税額 軽減6.24%', freee: '非対輸税 (軽)6.24%', direction: 'purchase' },
  { id: 'IMPORT_NT_LOCAL_REDUCED_1_76', mf: '非課税対応輸入-地方消費税額 (軽)1.76%', yayoi_incl: '非課税対応輸入-地方消費税額 軽減1.76%', yayoi_excl: '非課税対応輸入-地方消費税額 軽減1.76%', freee: '非対輸地 (軽)1.76%', direction: 'purchase' },
  { id: 'IMPORT_BODY_8', mf: '輸入仕入-本体 8%', yayoi_incl: '課対輸本込 8%', yayoi_excl: '課対輸本内 8%', freee: '課対輸本 8%', direction: 'purchase' },
  { id: 'IMPORT_TAX_6_3', mf: '輸入仕入-消費税額 6.3%', yayoi_incl: '課対輸税込 6.3%', yayoi_excl: '課対輸税内 6.3%', freee: '課対輸税 6.3%', direction: 'purchase' },
  { id: 'IMPORT_LOCAL_1_7', mf: '輸入仕入-地方消費税額 1.7%', yayoi_incl: '課対輸地込 1.7%', yayoi_excl: '課対輸地内 1.7%', freee: '課対輸地 1.7%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_BODY_8', mf: '共通輸入仕入-本体 8%', yayoi_incl: '共対輸本込 8%', yayoi_excl: '共対輸本内 8%', freee: '共対輸本 8%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_TAX_6_3', mf: '共通輸入仕入-消費税額 6.3%', yayoi_incl: '共対輸税込 6.3%', yayoi_excl: '共対輸税内 6.3%', freee: '共対輸税 6.3%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_LOCAL_1_7', mf: '共通輸入仕入-地方消費税額 1.7%', yayoi_incl: '共対輸地込 1.7%', yayoi_excl: '共対輸地内 1.7%', freee: '共対輸地 1.7%', direction: 'purchase' },
  { id: 'IMPORT_NT_BODY_8', mf: '非課税対応輸入-本体 8%', yayoi_incl: '非課税対応輸入-本体 8%', yayoi_excl: '非課税対応輸入-本体 8%', freee: '非対輸本 8%', direction: 'purchase' },
  { id: 'IMPORT_NT_TAX_6_3', mf: '非課税対応輸入-消費税額 6.3%', yayoi_incl: '非課税対応輸入-消費税額 6.3%', yayoi_excl: '非課税対応輸入-消費税額 6.3%', freee: '非対輸税 6.3%', direction: 'purchase' },
  { id: 'IMPORT_NT_LOCAL_1_7', mf: '非課税対応輸入-地方消費税額 1.7%', yayoi_incl: '非課税対応輸入-地方消費税額 1.7%', yayoi_excl: '非課税対応輸入-地方消費税額 1.7%', freee: '非対輸地 1.7%', direction: 'purchase' },
  { id: 'IMPORT_BODY_5', mf: '輸入仕入-本体 5%', yayoi_incl: '課対輸本込 5%', yayoi_excl: '課対輸本内 5%', freee: '課対輸本 5%', direction: 'purchase' },
  { id: 'IMPORT_TAX_4', mf: '輸入仕入-消費税額 4%', yayoi_incl: '課対輸税込 4%', yayoi_excl: '課対輸税内 4%', freee: '課対輸税 4%', direction: 'purchase' },
  { id: 'IMPORT_LOCAL_1', mf: '輸入仕入-地方消費税額 1%', yayoi_incl: '課対輸地込 1%', yayoi_excl: '課対輸地内 1%', freee: '課対輸地 1%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_BODY_5', mf: '共通輸入仕入-本体 5%', yayoi_incl: '共対輸本込 5%', yayoi_excl: '共対輸本内 5%', freee: '共対輸本 5%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_TAX_4', mf: '共通輸入仕入-消費税額 4%', yayoi_incl: '共対輸税込 4%', yayoi_excl: '共対輸税内 4%', freee: '共対輸税 4%', direction: 'purchase' },
  { id: 'IMPORT_COMMON_LOCAL_1', mf: '共通輸入仕入-地方消費税額 1%', yayoi_incl: '共対輸地込 1%', yayoi_excl: '共対輸地内 1%', freee: '共対輸地 1%', direction: 'purchase' },
  { id: 'IMPORT_NT_BODY_5', mf: '非課税対応輸入-本体 5%', yayoi_incl: '非課税対応輸入-本体 5%', yayoi_excl: '非課税対応輸入-本体 5%', freee: '非対輸本 5%', direction: 'purchase' },
  { id: 'IMPORT_NT_TAX_4', mf: '非課税対応輸入-消費税額 4%', yayoi_incl: '非課税対応輸入-消費税額 4%', yayoi_excl: '非課税対応輸入-消費税額 4%', freee: '非対輸税 4%', direction: 'purchase' },
  { id: 'IMPORT_NT_LOCAL_1', mf: '非課税対応輸入-地方消費税額 1%', yayoi_incl: '非課税対応輸入-地方消費税額 1%', yayoi_excl: '非課税対応輸入-地方消費税額 1%', freee: '非対輸地 1%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_10', mf: '特定課税仕入 10%', yayoi_incl: '特定仕入 10%', yayoi_excl: '特定仕入 10%', freee: '特定仕入 10%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_COMMON_10', mf: '共通特定課税仕入 10%', yayoi_incl: '共特定仕入 10%', yayoi_excl: '共特定仕入 10%', freee: '共特定仕入 10%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_NT_10', mf: '非課税対応特定課税仕入 10%', yayoi_incl: '非特定仕入 10%', yayoi_excl: '非特定仕入 10%', freee: '非特定仕入 10%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_8', mf: '特定課税仕入 8%', yayoi_incl: '特定仕入 8%', yayoi_excl: '特定仕入 8%', freee: '特定仕入 8%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_COMMON_8', mf: '共通特定課税仕入 8%', yayoi_incl: '共特定仕入 8%', yayoi_excl: '共特定仕入 8%', freee: '共特定仕入 8%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_NT_8', mf: '非課税対応特定課税仕入 8%', yayoi_incl: '非特定仕入 8%', yayoi_excl: '非特定仕入 8%', freee: '非特定仕入 8%', direction: 'purchase' },
  { id: 'PURCHASE_NON_TAXABLE', mf: '非課税仕入', yayoi_incl: '非課仕入', yayoi_excl: '非課仕入', freee: '非課仕入', direction: 'purchase' },
  { id: 'PURCHASE_EXEMPT', mf: '対象外仕入', yayoi_incl: '対外仕入', yayoi_excl: '対外仕入', freee: '対外仕入', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_10', mf: '課税仕入-返還等 10%', yayoi_incl: '課対仕返込 10%', yayoi_excl: '課対仕返内 10%', freee: '課対仕返 10%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_COMMON_10', mf: '共通課税仕入-返還等 10%', yayoi_incl: '共対仕返込 10%', yayoi_excl: '共対仕返内 10%', freee: '共対仕返 10%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_NT_10', mf: '非課税対応仕入-返還等 10%', yayoi_incl: '非対仕返込 10%', yayoi_excl: '非対仕返内 10%', freee: '非対仕返 10%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_REDUCED_8', mf: '課税仕入-返還等 (軽)8%', yayoi_incl: '課対仕返込 軽減8%', yayoi_excl: '課対仕返内 軽減8%', freee: '課対仕返 (軽)8%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_COMMON_REDUCED_8', mf: '共通課税仕入-返還等 (軽)8%', yayoi_incl: '共対仕返込 軽減8%', yayoi_excl: '共対仕返内 軽減8%', freee: '共対仕返 (軽)8%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_NT_REDUCED_8', mf: '非課税対応仕入-返還等 (軽)8%', yayoi_incl: '非対仕返込 軽減8%', yayoi_excl: '非対仕返内 軽減8%', freee: '非対仕返 (軽)8%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_8', mf: '課税仕入-返還等 8%', yayoi_incl: '課対仕返込 8%', yayoi_excl: '課対仕返内 8%', freee: '課対仕返 8%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_COMMON_8', mf: '共通課税仕入-返還等 8%', yayoi_incl: '共対仕返込 8%', yayoi_excl: '共対仕返内 8%', freee: '共対仕返 8%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_NT_8', mf: '非課税対応仕入-返還等 8%', yayoi_incl: '非対仕返込 8%', yayoi_excl: '非対仕返内 8%', freee: '非対仕返 8%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_5', mf: '課税仕入-返還等 5%', yayoi_incl: '課対仕返込 5%', yayoi_excl: '課対仕返内 5%', freee: '課対仕返 5%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_COMMON_5', mf: '共通課税仕入-返還等 5%', yayoi_incl: '共対仕返込 5%', yayoi_excl: '共対仕返内 5%', freee: '共対仕返 5%', direction: 'purchase' },
  { id: 'PURCHASE_RETURN_NT_5', mf: '非課税対応仕入-返還等 5%', yayoi_incl: '非対仕返込 5%', yayoi_excl: '非対仕返内 5%', freee: '非対仕返 5%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_RETURN_10', mf: '特定課税仕入-返還等 10%', yayoi_incl: '特定仕返 10%', yayoi_excl: '特定仕返 10%', freee: '特定仕入返還 10%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_RETURN_COMMON_10', mf: '共通特定課税仕入-返還等 10%', yayoi_incl: '共特定仕返 10%', yayoi_excl: '共特定仕返 10%', freee: '共特定仕入返還 10%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_RETURN_NT_10', mf: '非課税対応特定課税仕入-返還等 10%', yayoi_incl: '非特定仕返 10%', yayoi_excl: '非特定仕返 10%', freee: '非特定仕入返還 10%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_RETURN_8', mf: '特定課税仕入-返還等 8%', yayoi_incl: '特定仕返 8%', yayoi_excl: '特定仕返 8%', freee: '特定仕入返還 8%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_RETURN_COMMON_8', mf: '共通特定課税仕入-返還等 8%', yayoi_incl: '共特定仕返 8%', yayoi_excl: '共特定仕返 8%', freee: '共特定仕入返還 8%', direction: 'purchase' },
  { id: 'PURCHASE_SPECIFIC_RETURN_NT_8', mf: '非課税対応特定課税仕入-返還等 8%', yayoi_incl: '非特定仕返 8%', yayoi_excl: '非特定仕返 8%', freee: '非特定仕入返還 8%', direction: 'purchase' },
]

// === ユーティリティ関数 ===

/** MF名から弥生名(税込)を取得 */
export function mfToYayoi(mfName: string, taxIncluded = true): string {
  const entry = TAX_CATEGORY_MAPPING.find(m => m.mf === mfName)
  if (!entry) return mfName // フォールバック: そのまま返す
  return taxIncluded ? entry.yayoi_incl : entry.yayoi_excl
}

/** MF名からfreee名を取得 */
export function mfToFreee(mfName: string): string {
  const entry = TAX_CATEGORY_MAPPING.find(m => m.mf === mfName)
  if (!entry) return mfName
  return entry.freee
}

/** 弥生名(税込)からMF名を取得 */
export function yayoiToMf(yayoiName: string): string {
  const entry = TAX_CATEGORY_MAPPING.find(m => m.yayoi_incl === yayoiName || m.yayoi_excl === yayoiName)
  if (!entry) return yayoiName
  return entry.mf
}

/** freee名からMF名を取得 */
export function freeeToMf(freeeName: string): string {
  const entry = TAX_CATEGORY_MAPPING.find(m => m.freee === freeeName)
  if (!entry) return freeeName
  return entry.mf
}

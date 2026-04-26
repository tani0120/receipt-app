/**
 * パイプライン段階順の列再編スクリプト
 *
 * 変換内容:
 *   prodAi → classifyAi + accountPipeline（分離）
 *   tsRule → toJournal（リネーム）
 *   dataSource 追加
 *   列の順序をパイプライン段階順に変更
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// ============================================================
// Step 1: prodAi → classifyAi, tsRule → toJournal（全フィールド一括リネーム）
// ============================================================

// prodAi を classifyAi にリネーム
s = s.replace(/prodAi: '([^']*)'/g, "classifyAi: '$1'");

// tsRule を toJournal にリネーム
s = s.replace(/tsRule: '([^']*)'/g, "toJournal: '$1'");

// ============================================================
// Step 2: accountPipeline 列を追加（classifyAi の直後に挿入）
// セクションA〜H + I + K + N: accountPipeline = '—'
// セクションJ の科目確定系: classifyAi の値を accountPipeline に移動し classifyAi = '—'
// セクションL の rule_id/rule_confidence: 同上
// セクションM/O の AI系: classifyAi のまま、accountPipeline = '—'
// ============================================================

// まず全フィールドに accountPipeline: '—' をデフォルト追加（classifyAi の後に挿入）
// パターン: classifyAi: 'X', selectOwn → classifyAi: 'X', accountPipeline: '—', selectOwn は不適切
// 代わりに toJournal の前に追加
// パターン: toJournal: 'X' → accountPipeline: '—', toJournal: 'X'
// いや、パイプライン順は toJournal → accountPipeline なので toJournal の後に追加

// 列順序: classifyAi → selectOwn → selectDrive → toJournal → accountPipeline → humanInput
// つまり humanInput の前に accountPipeline を挿入

// 全フィールドに accountPipeline: '—' を追加（humanInput の前）
s = s.replace(/humanInput: '([^']*)'/g, "accountPipeline: '\u2014', humanInput: '$1'");

// ============================================================
// Step 3: セクションJ の科目確定フィールドを修正
// vendor_vector, debit.account/sub_account/tax_category_id,
// credit.account/sub_account/tax_category_id のみ
// classifyAi の 🔧 を accountPipeline に移動
// ============================================================

const accountPipelineFields = [
  'vendor_vector',
  'debit.account',
  'debit.sub_account',
  'debit.tax_category_id',
  'credit.account',
  'credit.sub_account',
  'credit.tax_category_id',
  'rule_id',
  'rule_confidence',
];

for (const f of accountPipelineFields) {
  // このフィールドの行で classifyAi: '🔧' → classifyAi: '—' に変更
  const escapedField = f.replace(/\./g, '\\.');
  const re = new RegExp(`(field: '${escapedField}'[^}]*?)classifyAi: '🔧'([^}]*?)accountPipeline: '—'`);
  s = s.replace(re, "$1classifyAi: '\u2014'$2accountPipeline: '\uD83D\uDD27'");
}

// ============================================================
// Step 4: セクションB の classify API 出力フィールドの classifyAi を設定
// 現在 classifyAi: '—' だが、classify API で取得されるので '✅' にすべき
// ただし、uploadOwn が '✅' のフィールド（= classify API 経由で取得済み）を対象
// セクションB のフィールド: date〜document_count
// ============================================================

const classifyOutputFields = [
  'date', 'amount', 'vendor', 'source_type', 'direction',
  'description', 'classify_reason', 'supplementary', 'confidence',
  'processing_mode', 'fallback', 'warning', 'isDuplicate', 'document_count',
  'lineItems\\[\\]', 'lineItemsCount',
];

for (const f of classifyOutputFields) {
  const re = new RegExp(`(field: '${f}'[^}]*?)classifyAi: '[^']*'`);
  s = s.replace(re, "$1classifyAi: '\u2705'");
}

// セクション D のメトリクス: classify API の副産物（duration_ms, tokens, cost_yen, model）
const metricsFields = ['duration_ms', 'tokens\\(3種\\)', 'cost_yen', 'model'];
for (const f of metricsFields) {
  const re = new RegExp(`(field: '${f}'[^}]*?)classifyAi: '[^']*'`);
  s = s.replace(re, "$1classifyAi: '\u2705'");
}

// ============================================================
// Step 5: dataSource 列を追加（note の前に挿入）
// ============================================================

// まず全フィールドに dataSource: '' をデフォルト追加（note の前）
s = s.replace(/, note: '/g, ", dataSource: '', note: '");

// セクション I〜O の dataSource を設定
const dataSources = {
  'journal.id': 'generateJournalId()',
  'client_id': 'route.params.clientId',
  'display_order': 'items[idx]+1',
  'voucher_date': 'classify.date',
  'date_on_document': 'classify.date !== null',
  'description': '', // セクションI の description のみ
  'voucher_type': 'VOUCHER_TYPE_MAP',
  'document_id': 'crypto.randomUUID()',
  'line_id': '{docId}_line-{idx}',
  'source_type': '', // classify API から転記
  'direction': '', // classify API から転記
  'vendor_vector': 'classify.vendor_vector',
  'debit.account': 'determined_account',
  'debit.sub_account': 'LineItem.sub_account',
  'debit.tax_category_id': 'LineItem.tax_category',
  'debit.amount': 'LineItem.amount',
  'debit.account_on_document': 'mainEntry=true',
  'debit.amount_on_document': '常にtrue',
  'credit.account': 'counterpart_account',
  'credit.sub_account': 'null',
  'credit.tax_category_id': 'counterpart.tax_category',
  'credit.amount': 'LineItem.amount',
  'credit.account_on_document': 'counterpart=false',
  'credit.amount_on_document': '常にtrue',
};

for (const [field, source] of Object.entries(dataSources)) {
  if (!source) continue;
  const escapedField = field.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  // セクションI〜O のフィールドのみ（uploadOwn: '—' で絞る）
  const re = new RegExp(`(field: '${escapedField}'[^}]*?uploadOwn: '—'[^}]*?)dataSource: ''`);
  s = s.replace(re, `$1dataSource: '${source}'`);
}

// ============================================================
// Step 6: 列順序の調整
// 現在: uploadOwn, uploadDrive, classifyAi, selectOwn, selectDrive,
//       toJournal, accountPipeline, humanInput, journalList,
//       outMf, outCost, outStaffCount, outStaffTime, dataSource, note
// ただし実際のプロパティ順序は変数代入順で決まるため、
// オブジェクトリテラルの並びを変更する必要がある。
// 現在の並び: ...uploadOwn, uploadDrive, selectOwn, selectDrive, classifyAi, ...
// 正しい並び: ...uploadOwn, uploadDrive, classifyAi, selectOwn, selectDrive, ...
// ============================================================

// selectOwn の前に classifyAi を移動
// 現在のパターン: uploadDrive: 'X', selectOwn: 'Y', selectDrive: 'Z', classifyAi: 'W'
// → uploadDrive: 'X', classifyAi: 'W', selectOwn: 'Y', selectDrive: 'Z'
// しかし、現在は prodAi が selectDrive の後にあったので、
// classifyAi も selectDrive の後にある。移動が必要。

// パターン: selectDrive: 'X', classifyAi: 'Y' → classifyAi: 'Y' は selectOwn の前に移動
s = s.replace(
  /uploadDrive: '([^']*)', selectOwn: '([^']*)', selectDrive: '([^']*)', classifyAi: '([^']*)'/g,
  "uploadDrive: '$1', classifyAi: '$4', selectOwn: '$2', selectDrive: '$3'"
);

// ============================================================
// Step 7: toJournal と accountPipeline の位置調整
// 現在: ... selectDrive: 'X', toJournal: 'Y', accountPipeline: 'Z', humanInput: 'W' ...
// これはパイプライン順で正しい。確認のみ。
// ============================================================

fs.writeFileSync(file, s, { encoding: 'utf8' });
console.log('パイプライン列再編完了');

// 検証: 変換後のフィールド数を確認
const result = fs.readFileSync(file, 'utf8');
const fieldCount = (result.match(/field: '/g) || []).length;
const classifyAiCount = (result.match(/classifyAi: '/g) || []).length;
const accountPipelineCount = (result.match(/accountPipeline: '/g) || []).length;
const toJournalCount = (result.match(/toJournal: '/g) || []).length;
const dataSourceCount = (result.match(/dataSource: '/g) || []).length;

console.log(`フィールド数: ${fieldCount}`);
console.log(`classifyAi: ${classifyAiCount}`);
console.log(`accountPipeline: ${accountPipelineCount}`);
console.log(`toJournal: ${toJournalCount}`);
console.log(`dataSource: ${dataSourceCount}`);

if (fieldCount !== classifyAiCount || fieldCount !== accountPipelineCount ||
    fieldCount !== toJournalCount || fieldCount !== dataSourceCount) {
  console.error('❌ 列数不一致！手動確認が必要');
} else {
  console.log('✅ 全フィールドの列数が一致');
}

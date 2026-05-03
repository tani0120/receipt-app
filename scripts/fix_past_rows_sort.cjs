// TSTソート問題修正: pastRowsの追加位置をソート前に移動
// Phase 1 Step 1 暫定修正 (2026-05-02)
const fs = require('fs');
const filePath = 'src/mocks/components/JournalListLevel3Mock.vue';
const src = fs.readFileSync(filePath, 'utf8');
const lines = src.split('\n');

// ── 検証: 期待する行の内容を確認 ──
const checks = [
  { line: 5617, expect: 'const journals = computed(() => {' },
  { line: 5623, expect: '  });' },
  { line: 5624, expect: '' },
  { line: 5625, expect: '  if (sortColumn.value) {' },
  { line: 5844, expect: '  // 過去仕訳CSVチェック時: confirmed_journals' },
  { line: 5914, expect: '  }' },
  { line: 5916, expect: '  return filtered;' },
];

let ok = true;
for (const c of checks) {
  const actual = lines[c.line - 1].trim();
  const expected = c.expect.trim();
  if (!actual.startsWith(expected)) {
    console.error(`❌ L${c.line} 不一致:`);
    console.error(`  期待: "${expected}"`);
    console.error(`  実際: "${actual}"`);
    ok = false;
  }
}
if (!ok) {
  console.error('検証失敗。ファイルが想定と異なるため中止します。');
  process.exit(1);
}

console.log('✅ 行番号検証OK');

// ── 修正1: L5617の前にTODOコメント追加 ──
// ── 修正2: L5623の後（L5624）にpastRows生成コードを挿入 ──
// ── 修正3: L5844-5914を削除 ──

// pastRows生成コード（L5846-5898をそのまま流用、result.pushに変更）
const pastRowsBlock = `
  // TODO: Phase 1（API統合一覧）完了時にこのcomputed全体を削除する
  // pastRowsをソート前に結合するための暫定対応 (2026-05-02)
  // 過去仕訳CSVチェック時: confirmed_journalsをJournalPhase5Mock形式でresultに追加
  // ソート前に結合することで、カラムソート・全列検索・フィルタが過去仕訳にも適用される
  if (showPastCsv.value && confirmedJournals.value.length > 0) {
    const pastRows: JournalPhase5Mock[] = confirmedJournals.value.map((cj, idx) => ({
      id: \`past-csv-\${idx}\`,
      client_id: journalClientId.value,
      display_order: 90000 + idx,
      voucher_date: cj.voucher_date || null,
      date_on_document: true,
      description: cj.description || '',
      voucher_type: null,
      source_type: null,
      direction: cj.direction || null,
      vendor_vector: null,
      vendor_id: cj.vendor_id || null,
      vendor_name: cj.vendor_name || null,
      document_id: null,
      line_id: null,
      debit_entries: (cj.debit_entries || []).map(e => ({
        id: e.id || crypto.randomUUID(),
        account: e.account || null,
        account_on_document: false,
        sub_account: e.sub_account || null,
        department: e.department || null,
        amount: e.amount ?? null,
        amount_on_document: false,
        tax_category_id: e.tax_category_id || null,
        vendor_name: e.vendor_name || null,
      })),
      credit_entries: (cj.credit_entries || []).map(e => ({
        id: e.id || crypto.randomUUID(),
        account: e.account || null,
        account_on_document: false,
        sub_account: e.sub_account || null,
        department: e.department || null,
        amount: e.amount ?? null,
        amount_on_document: false,
        tax_category_id: e.tax_category_id || null,
        vendor_name: e.vendor_name || null,
      })),
      status: 'exported' as const,
      is_read: true,
      deleted_at: null,
      labels: [] as JournalLabelMock[],
      warning_dismissals: [],
      warning_details: {},
      export_batch_id: null,
      is_credit_card_payment: false,
      rule_id: null,
      invoice_status: null,
      invoice_number: null,
      memo: '過去仕訳CSV',
      memo_author: null,
      memo_target: null,
      memo_created_at: null,
    }));
    result.push(...pastRows);
  }
`;

// 修正実行
// Step 1: L5844-5914を削除（71行）
const newLines = [...lines];

// 旧pastRowsブロック削除（L5844〜L5914 = index 5843〜5913）
newLines.splice(5843, 71); // 71行削除（5844-5914）

// Step 2: L5623の後（index 5623）にpastRowsBlockを挿入
// 現在L5624は空行。空行の後にブロックを挿入
const insertLines = pastRowsBlock.split('\n');
newLines.splice(5623, 0, ...insertLines); // L5624の位置に挿入

const result = newLines.join('\n');
fs.writeFileSync(filePath, result, { encoding: 'utf8' });

console.log('✅ 修正完了:');
console.log('  - L5624にpastRows生成ブロック挿入（TODOコメント付き）');
console.log('  - 旧L5844-5914のpastRowsブロック削除');
console.log('  - pastRowsの独立検索フィルタも削除（共通検索フィルタで処理）');
console.log(`  - 修正後行数: ${newLines.length}`);

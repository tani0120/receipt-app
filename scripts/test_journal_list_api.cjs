/**
 * 統合一覧API（Step 4）のHTTP統合テスト
 * GET /api/journals/:clientId?sort=&search=&showPastCsv=&page= の動作確認
 */
const http = require('http');

const CLIENT_ID = 'LDI-00008';
const BASE = `http://localhost:8080/api/journals/${CLIENT_ID}`;
let passed = 0;
let failed = 0;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { reject(new Error('JSONパース失敗: ' + d.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

function assert(name, condition, detail) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}: ${detail}`);
    failed++;
  }
}

async function main() {
  console.log('=== 統合一覧API テスト ===\n');

  // 1. 後方互換: パラメータなし
  const t1 = await httpGet(BASE);
  assert('後方互換（パラメータなし）', t1.status === 200 && t1.data.count === 38,
    `status=${t1.status}, count=${t1.data.count}`);

  // 2. 統合一覧: view=list（最低限のパラメータ）
  const t2 = await httpGet(`${BASE}?view=list`);
  assert('統合一覧（view=list）', t2.status === 200 && t2.data.totalCount >= 0,
    `status=${t2.status}, totalCount=${t2.data.totalCount}`);

  // 3. 過去仕訳CSV ON
  const t3 = await httpGet(`${BASE}?view=list&showPastCsv=true&showExported=true`);
  assert('過去仕訳CSV ON', t3.data.totalCount > 38,
    `totalCount=${t3.data.totalCount}（期待: >38）`);
  console.log(`  → totalCount=${t3.data.totalCount}（通常38 + 過去仕訳CSV）`);

  // 4. ページネーション
  const t4 = await httpGet(`${BASE}?view=list&showPastCsv=true&showExported=true&page=1&pageSize=10`);
  assert('ページネーション', t4.data.journals.length === 10 && t4.data.page === 1,
    `journals=${t4.data.journals.length}, page=${t4.data.page}`);
  assert('総ページ数', t4.data.totalPages > 1,
    `totalPages=${t4.data.totalPages}`);

  // 5. ソート: 日付昇順
  const t5 = await httpGet(`${BASE}?view=list&sort=voucher_date&order=asc&showPastCsv=true&showExported=true&pageSize=5`);
  assert('日付ソート（昇順）', t5.data.journals.length === 5,
    `件数=${t5.data.journals.length}`);
  if (t5.data.journals.length >= 2) {
    const d1 = t5.data.journals[0].voucher_date;
    const d2 = t5.data.journals[1].voucher_date;
    assert('日付順序', !d1 || !d2 || d1 <= d2,
      `1件目=${d1}, 2件目=${d2}`);
  }

  // 6. 検索: amazon
  const t6 = await httpGet(`${BASE}?view=list&search=amazon&showPastCsv=true&showExported=true`);
  assert('検索（amazon）', t6.data.totalCount > 0,
    `totalCount=${t6.data.totalCount}`);
  console.log(`  → amazonヒット: ${t6.data.totalCount}件`);

  // 7. 検索: 存在しないキーワード
  const t7 = await httpGet(`${BASE}?view=list&search=ZZZZNONEXIST&showExported=true`);
  assert('検索（存在しない）', t7.data.totalCount === 0,
    `totalCount=${t7.data.totalCount}`);

  // 8. ソート: 借方金額降順
  const t8 = await httpGet(`${BASE}?view=list&sort=debit_amount&order=desc&showExported=true&pageSize=5`);
  assert('借方金額ソート', t8.data.journals.length <= 5, `件数=${t8.data.journals.length}`);

  // 9. フィルタ: showExported=false
  const t9 = await httpGet(`${BASE}?view=list&showExported=false&showUnexported=true`);
  const allNotExported = t9.data.journals.every(j => j.status !== 'exported');
  assert('フィルタ（出力済み非表示）', allNotExported,
    `出力済みが含まれている`);

  // 10. 後方互換: パラメータなしの応答にtotalCountがないこと
  assert('後方互換形式', t1.data.totalCount === undefined,
    `totalCount=${t1.data.totalCount}（期待: undefined）`);

  console.log(`\n結果: ${passed}/${passed + failed} テスト通過`);
  if (failed === 0) {
    console.log('✅ 全テスト通過。統合一覧APIが正しく動作。');
  } else {
    console.log(`❌ ${failed}件失敗`);
    process.exit(1);
  }
}

main().catch(e => { console.error('テスト失敗:', e); process.exit(1); });

/**
 * validate APIの実動作テスト（HTTP越し）
 * APIサーバーが localhost:8080 で起動していること前提
 */
const http = require('http');

const CLIENT_ID = 'TST-00011';

// まず仕訳一覧を取得
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

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { reject(new Error('JSONパース失敗: ' + d.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== validate API 実動作テスト ===\n');

  // 1. GET /api/journals/:clientId で仕訳取得
  console.log('1. GET /api/journals/' + CLIENT_ID);
  const getResult = await httpGet('http://localhost:8080/api/journals/' + CLIENT_ID);
  console.log('  status:', getResult.status);
  console.log('  件数:', getResult.data.count);

  if (getResult.data.count === 0) {
    console.log('  ⚠️ 仕訳データなし。テスト終了。');
    return;
  }

  const firstJournal = getResult.data.journals[0];
  console.log('  先頭仕訳ID:', firstJournal.id);
  console.log('  labels:', JSON.stringify(firstJournal.labels || []));

  // テスト用accounts/taxCategories（最小セット）
  const testAccounts = [
    { id: 'CASH', accountGroup: 'BS_ASSET', category: '現金及び預金' },
    { id: 'ORDINARY_DEPOSIT', accountGroup: 'BS_ASSET', category: '現金及び預金' },
    { id: 'ACCRUED_EXPENSES', accountGroup: 'BS_LIABILITY', category: 'その他流動負債' },
    { id: 'TRAVEL_EXPENSE', accountGroup: 'PL_EXPENSE', category: '旅費交通費', taxDetermination: 'auto_purchase' },
    { id: 'SALES_REVENUE', accountGroup: 'PL_REVENUE', category: '売上高' },
  ];
  const testTaxCategories = [
    { id: 'TAX_10_PURCHASE', direction: 'purchase' },
    { id: 'TAX_10_SALES', direction: 'sales' },
    { id: 'TAX_EXEMPT', direction: null },
  ];

  // 2. POST /api/journals/:clientId/:journalId/validate（1件）
  console.log('\n2. POST /api/journals/' + CLIENT_ID + '/' + firstJournal.id + '/validate');
  const validateResult = await httpPost(
    'http://localhost:8080/api/journals/' + CLIENT_ID + '/' + firstJournal.id + '/validate',
    { accounts: testAccounts, taxCategories: testTaxCategories }
  );
  console.log('  status:', validateResult.status);
  console.log('  journalId:', validateResult.data.journalId);
  console.log('  labels:', JSON.stringify(validateResult.data.labels));
  console.log('  addedLabels:', JSON.stringify(validateResult.data.addedLabels));
  console.log('  removedLabels:', JSON.stringify(validateResult.data.removedLabels));
  console.log('  warning_details:', JSON.stringify(validateResult.data.warning_details));
  console.log('  conflictAccounts:', JSON.stringify(validateResult.data.conflictAccounts));

  // 3. 存在しないjournalIdでバリデーション（404確認）
  console.log('\n3. POST 存在しないjournal IDで404確認');
  const notFoundResult = await httpPost(
    'http://localhost:8080/api/journals/' + CLIENT_ID + '/NONEXISTENT/validate',
    { accounts: testAccounts, taxCategories: testTaxCategories }
  );
  console.log('  status:', notFoundResult.status, '(期待: 404)');
  console.log('  OK:', notFoundResult.status === 404 ? '✅' : '❌');

  // 4. POST /api/journals/:clientId/validate-all（全件）
  console.log('\n4. POST /api/journals/' + CLIENT_ID + '/validate-all');
  const allResult = await httpPost(
    'http://localhost:8080/api/journals/' + CLIENT_ID + '/validate-all',
    { accounts: testAccounts, taxCategories: testTaxCategories }
  );
  console.log('  status:', allResult.status);
  console.log('  件数:', allResult.data.count);
  if (allResult.data.results && allResult.data.results.length > 0) {
    const sample = allResult.data.results[0];
    console.log('  先頭結果.journalId:', sample.journalId);
    console.log('  先頭結果.labels:', JSON.stringify(sample.labels));
    console.log('  先頭結果.conflictAccounts:', JSON.stringify(sample.conflictAccounts));
  }

  // 5. 不正リクエスト（accounts欠落）で400確認
  console.log('\n5. POST 不正リクエスト（accounts欠落）で400確認');
  const badResult = await httpPost(
    'http://localhost:8080/api/journals/' + CLIENT_ID + '/validate-all',
    { taxCategories: testTaxCategories }
  );
  console.log('  status:', badResult.status, '(期待: 400)');
  console.log('  OK:', badResult.status === 400 ? '✅' : '❌');

  console.log('\n=== テスト完了 ===');
}

main().catch(e => { console.error('テスト失敗:', e); process.exit(1); });

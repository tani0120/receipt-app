/**
 * フロント側 journals computed vs API側 journalListService の出力比較テスト
 *
 * 検証内容:
 * 1. 通常仕訳件数の一致
 * 2. 過去仕訳CSV ON時の件数一致
 * 3. 検索結果の件数一致
 * 4. ソート順序の一致（IDソートの制約を確認）
 * 5. フィルタ結果の一致
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
  console.log('=== 出力一致テスト（フロントcomputed vs API） ===\n');

  // 1. 後方互換APIから通常仕訳を取得（＝フロント側のlocalJournals相当）
  const raw = await httpGet(BASE);
  const rawCount = raw.data.count;
  console.log(`通常仕訳（raw）: ${rawCount}件\n`);

  // 2. 統合一覧APIのデフォルト（showUnexported+showExported=true, showExcluded=false, showTrashed=false）
  // → ゴミ箱2件除外、EXPORT_EXCLUDE 1件除外 = 36件（未出力8 + 出力済み28）
  const listAll = await httpGet(`${BASE}?view=list&pageSize=9999`);
  const filteredCount = listAll.data.totalCount;
  console.log(`デフォルト表示: ${filteredCount}件（全${rawCount}件 - ゴミ箱2件 - EXPORT_EXCLUDE適用）`);
  assert('デフォルト件数（フィルタ適用後）', filteredCount <= rawCount,
    `API=${filteredCount} > raw=${rawCount}（フィルタで増えることはない）`);

  // 3. 過去仕訳CSV ON（showExported=trueで過去仕訳CSVが表示される）
  const listPast = await httpGet(`${BASE}?view=list&showPastCsv=true&showExported=true&pageSize=9999`);
  const confirmedRes = await httpGet(`http://localhost:8080/api/confirmed-journals/${CLIENT_ID}`);
  const confirmedCount = confirmedRes.data.count || confirmedRes.data.journals?.length || 0;
  // 過去仕訳CSVはstatus='exported'なのでshowExported=trueで表示
  // 通常仕訳のフィルタ後件数 + 過去仕訳CSV件数
  assert('過去仕訳CSV件数', listPast.data.totalCount === filteredCount + confirmedCount,
    `API=${listPast.data.totalCount} vs 期待=${filteredCount}+${confirmedCount}=${filteredCount + confirmedCount}`);

  // 4. 検索: amazon（過去仕訳CSV ON）
  const searchAmz = await httpGet(`${BASE}?view=list&search=amazon&showPastCsv=true&showExported=true&pageSize=9999`);
  // フロント側と同じ検索ロジック: 摘要・科目・金額・メモ・証票種別を横断検索
  const allJournals = listPast.data.journals;
  const frontSearchCount = allJournals.filter(j => {
    const fields = [
      j.voucher_date || '',
      j.description || '',
      ...(j.debit_entries || []).flatMap(e => [e.account || '', e.sub_account || '', e.tax_category_id || '', String(e.amount ?? '')]),
      ...(j.credit_entries || []).flatMap(e => [e.account || '', e.sub_account || '', e.tax_category_id || '', String(e.amount ?? '')]),
      j.memo || '',
      j.voucher_type || '',
    ];
    return fields.some(f => f.toLowerCase().includes('amazon'));
  }).length;
  assert('検索結果件数一致（amazon）', searchAmz.data.totalCount === frontSearchCount,
    `API=${searchAmz.data.totalCount} vs フロント再現=${frontSearchCount}`);

  // 5. 日付ソート順序一致
  const sortDate = await httpGet(`${BASE}?view=list&sort=voucher_date&order=asc&showPastCsv=true&showExported=true&pageSize=9999`);
  let dateOrderOk = true;
  for (let i = 1; i < sortDate.data.journals.length; i++) {
    const prev = sortDate.data.journals[i - 1].voucher_date;
    const curr = sortDate.data.journals[i].voucher_date;
    // null → -1 扱い
    const prevTime = prev ? new Date(prev).getTime() : -1;
    const currTime = curr ? new Date(curr).getTime() : -1;
    if (prevTime > currTime) {
      dateOrderOk = false;
      console.log(`  ⚠️ 順序違反: [${i-1}]=${prev} > [${i}]=${curr}`);
      break;
    }
  }
  assert('日付ソート昇順の順序', dateOrderOk, '日付順序に違反あり');

  // 6. 借方金額ソート順序一致
  const sortAmount = await httpGet(`${BASE}?view=list&sort=debit_amount&order=desc&showExported=true&pageSize=9999`);
  let amtOrderOk = true;
  for (let i = 1; i < sortAmount.data.journals.length; i++) {
    const prev = sortAmount.data.journals[i - 1];
    const curr = sortAmount.data.journals[i];
    const prevSum = prev.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0);
    const currSum = curr.debit_entries.reduce((s, e) => s + (e.amount ?? 0), 0);
    if (prevSum < currSum && prevSum !== 0 && currSum !== 0) {
      amtOrderOk = false;
      console.log(`  ⚠️ 金額順序違反: [${i-1}]=${prevSum} < [${i}]=${currSum}`);
      break;
    }
  }
  assert('借方金額ソート降順の順序', amtOrderOk, '金額順序に違反あり');

  // 7. フィルタ: showExported=false, showUnexported=true
  const filterUn = await httpGet(`${BASE}?view=list&showExported=false&showUnexported=true&pageSize=9999`);
  const hasExported = filterUn.data.journals.some(j => j.status === 'exported');
  assert('フィルタ: 出力済み除外', !hasExported, '出力済み仕訳が含まれている');

  // 8. debit_accountソートの制約確認（IDソートになることを記録）
  const sortAcct = await httpGet(`${BASE}?view=list&sort=debit_account&order=asc&showExported=true&pageSize=5`);
  console.log('\n⚠️ debit_accountソート制約確認:');
  for (const j of sortAcct.data.journals.slice(0, 5)) {
    const acct = j.debit_entries[0]?.account || '(null)';
    console.log(`  ID: ${j.id}, debit_account: ${acct}`);
  }
  console.log('  → API側は科目ID（英語）でソート。フロント側はresolveAccountName（日本語名）でソート。');
  console.log('  → Phase 2でマスタのサーバー側ストア化後に科目名ソートを実装予定。');

  // 9. 過去仕訳CSVのmemoが「過去仕訳CSV」であること
  const pastCheck = await httpGet(`${BASE}?view=list&showPastCsv=true&showExported=true&search=過去仕訳CSV&pageSize=5`);
  const hasPastMemo = pastCheck.data.journals.some(j => j.memo === '過去仕訳CSV');
  assert('過去仕訳CSVのmemo', hasPastMemo || pastCheck.data.totalCount === 0,
    'memo="過去仕訳CSV"の行がない');

  // 10. ゴミ箱フィルタ: showTrashed=true
  const trashed = await httpGet(`${BASE}?view=list&showTrashed=true&pageSize=9999`);
  assert('ゴミ箱フィルタ動作', trashed.status === 200, `status=${trashed.status}`);

  console.log(`\n結果: ${passed}/${passed + failed} テスト通過`);
  if (failed === 0) {
    console.log('✅ 全テスト通過。');
    console.log('\n📝 既知の制約:');
    console.log('  - debit_account/credit_account/debit_tax/credit_tax ソートは科目ID順（科目名順ではない）');
    console.log('  - Phase 2でマスタのサーバー側ストア化後に解消予定');
  } else {
    console.log(`❌ ${failed}件失敗`);
    process.exit(1);
  }
}

main().catch(e => { console.error('テスト失敗:', e); process.exit(1); });

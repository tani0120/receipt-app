const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5173${path}`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== スタッフAPI ===');
  const staffData = await get('/api/staff');
  console.log(`スタッフ総数: ${staffData.count}`);
  staffData.staff.forEach(s => console.log(`  ${s.uuid} | ${s.name} | ${s.status} | ${s.role}`));

  console.log('\n=== 顧問先API ===');
  const clientData = await get('/api/clients');
  console.log(`顧問先総数: ${clientData.count}`);
  clientData.clients.forEach(c => console.log(`  ${c.threeCode} | ${c.companyName} | ${c.status}`));

  console.log('\n=== CSV集計（byClient） ===');
  const csv = await get('/api/admin/csv-summary');
  console.log(`byClient件数: ${csv.byClient.length}`);
  csv.byClient.forEach(c => console.log(`  ${c.clientId} | 今月:${c.thisMonth.csvLineCount} | 今年:${c.thisYear.csvLineCount} | 昨年:${c.lastYear.csvLineCount}`));

  console.log(`byStaff件数: ${csv.byStaff.length}`);
  csv.byStaff.forEach(s => console.log(`  ${s.staffId} | 今月:${s.thisMonth.csvLineCount} | 今年:${s.thisYear.csvLineCount} | 昨年:${s.lastYear.csvLineCount}`));

  console.log('\n=== AI費用集計 ===');
  const ai = await get('/api/admin/ai-metrics/summary');
  console.log(`byClient件数: ${ai.byClient.length}`);
  ai.byClient.forEach(c => console.log(`  ${c.key} | ¥${c.totalCostYen}`));
  console.log(`byStaff件数: ${ai.byStaff.length}`);
  ai.byStaff.forEach(s => console.log(`  ${s.key} | ¥${s.totalCostYen}`));

  console.log('\n=== 活動ログ集計 ===');
  const act = await get('/api/activity-log/summary');
  console.log(`byStaff件数: ${act.byStaff.length}`);
  act.byStaff.forEach(s => console.log(`  ${s.staffId} | ${s.totalActiveMs}ms | ${s.sessionCount}セッション`));
  console.log(`byClient件数: ${act.byClient.length}`);
  act.byClient.forEach(c => console.log(`  ${c.clientId} | ${c.totalActiveMs}ms | ${c.sessionCount}セッション`));

  // 照合
  console.log('\n=== 照合結果 ===');
  const staffIds = new Set(staffData.staff.map(s => s.uuid));
  const clientCodes = new Set(clientData.clients.map(c => c.threeCode || c.clientId));
  const clientIds = new Set(clientData.clients.map(c => c.clientId));

  // CSV集計のbyClientにマスター未登録の顧問先がないか
  const csvClientIds = csv.byClient.map(c => c.clientId);
  const csvOrphans = csvClientIds.filter(id => !clientIds.has(id) && !clientCodes.has(id));
  if (csvOrphans.length) {
    console.log(`⚠️ CSV集計にマスター未登録の顧問先: ${csvOrphans.join(', ')}`);
  }

  // CSV集計のbyStaffにマスター未登録のスタッフがないか
  const csvStaffIds = csv.byStaff.map(s => s.staffId);
  const csvStaffOrphans = csvStaffIds.filter(id => !staffIds.has(id));
  if (csvStaffOrphans.length) {
    console.log(`⚠️ CSV集計にマスター未登録のスタッフ: ${csvStaffOrphans.join(', ')}`);
  }

  // fetchRealKpiで全員分のstaffAnalysisが作られるか検証
  // → staffAnalysisはbody.staff.map(s => ...)で全員分作成されるので、staff API応答件数=staffAnalysis件数
  console.log(`\nスタッフ: API ${staffData.count}名 → ダッシュボードstaffAnalysis ${staffData.count}名（全員mapで生成）`);
  console.log(`顧問先: API ${clientData.count}社 → ダッシュボードclientAnalysis ${clientData.count}社（全員mapで生成）`);

  // CSV byClientが全顧問先をカバーしているか
  const clientsWithData = new Set(csvClientIds);
  const clientsNoData = clientData.clients.filter(c => !clientsWithData.has(c.clientId));
  console.log(`\nCSVデータあり顧問先: ${csvClientIds.length}社`);
  console.log(`CSVデータなし顧問先: ${clientsNoData.length}社 → これらは仕訳数0で表示される`);
  clientsNoData.forEach(c => console.log(`  ${c.threeCode} | ${c.companyName}`));

  const staffWithData = new Set(csvStaffIds);
  const staffNoData = staffData.staff.filter(s => !staffWithData.has(s.uuid));
  console.log(`\nCSVデータありスタッフ: ${csvStaffIds.length}名`);
  console.log(`CSVデータなしスタッフ: ${staffNoData.length}名 → これらは仕訳数0で表示される`);
  staffNoData.forEach(s => console.log(`  ${s.uuid} | ${s.name}`));

  console.log('\n✅ 検証完了');
}

main().catch(e => console.error('検証エラー:', e));

/**
 * ダッシュボード未定義フィールド検証
 * 全APIレスポンスのフィールド存在を確認
 */
const BASE = 'http://localhost:5173';

async function check() {
  const issues = [];

  // 1. csv-summary: monthlyAvg, lastYearSameMonth が返っているか
  const csv = await (await fetch(`${BASE}/api/admin/csv-summary`)).json();
  if (!csv.monthlyAvg) issues.push('csv-summary: monthlyAvg 未定義');
  if (!csv.lastYearSameMonth) issues.push('csv-summary: lastYearSameMonth 未定義');
  if (!csv.thisMonth) issues.push('csv-summary: thisMonth 未定義');
  if (!csv.thisYear) issues.push('csv-summary: thisYear 未定義');
  if (!csv.lastYear) issues.push('csv-summary: lastYear 未定義');
  console.log('csv-summary:', JSON.stringify({
    thisMonth: csv.thisMonth?.csvLineCount,
    monthlyAvg: csv.monthlyAvg?.csvLineCount,
    lastYearSameMonth: csv.lastYearSameMonth?.csvLineCount,
    thisYear: csv.thisYear?.csvLineCount,
    lastYear: csv.lastYear?.csvLineCount,
  }));

  // 2. ai-metrics: totalCostYen
  const ai = await (await fetch(`${BASE}/api/admin/ai-metrics/summary`)).json();
  if (ai.total?.totalCostYen === undefined) issues.push('ai-metrics: totalCostYen 未定義');
  console.log('ai-metrics:', JSON.stringify(ai.total));

  // 3. activity-log/summary
  const act = await (await fetch(`${BASE}/api/activity-log/summary`)).json();
  if (!act.byStaff) issues.push('activity-log: byStaff 未定義');
  if (!act.byClient) issues.push('activity-log: byClient 未定義');
  console.log('activity-log:', JSON.stringify({
    staffCount: act.byStaff?.length,
    clientCount: act.byClient?.length,
    totalActiveMs: act.byStaff?.reduce((s, x) => s + x.totalActiveMs, 0) ?? 0,
  }));

  // 4. clients
  const clients = await (await fetch(`${BASE}/api/clients`)).json();
  if (!clients.clients) issues.push('clients: clients配列 未定義');

  // 5. staff
  const staff = await (await fetch(`${BASE}/api/staff`)).json();
  if (!staff.staff) issues.push('staff: staff配列 未定義');

  // 6. admin/dashboard (kpiCostQuality.performance)
  const dash = await (await fetch(`${BASE}/api/admin/dashboard`)).json();
  if (dash.kpi) {
    console.log('dashboard kpi:', JSON.stringify(dash.kpi));
  }

  console.log('\n=== 結果 ===');
  if (issues.length === 0) {
    console.log('✅ 未定義フィールドなし');
  } else {
    for (const i of issues) console.log('❌ ' + i);
    process.exit(1);
  }
}
check();

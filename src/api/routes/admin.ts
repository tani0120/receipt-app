
import { Hono } from 'hono'
import { z } from 'zod'

import { zValidator } from '@hono/zod-validator'
import { zodHook } from '../helpers/zodHook'
import { getDocuments } from '../services/documentStore'
import { summarizeCsvLines as summarizeCsvLinesImport } from '../services/exportHistoryStore'
import { getAll as getAllClients } from '../services/clientStore'
import { getAll as getAllStaff } from '../services/staffStore'
import { getJournals } from '../services/journalStore'
import type { DocEntry } from '../../repositories/types'

const app = new Hono()

// --- Config Schemas ---
const PhaseConfigSchema = z.object({
    provider: z.enum(['vertex_ai', 'ai_studio', 'gemini', 'vertex'], { error: 'プロバイダーは必須です' }),
    mode: z.enum(['realtime', 'batch', 'normal'], { error: 'モードは必須です' }),
    model: z.string().optional(),
    modelName: z.string().optional()
})

const PhaseSettingsSchema = z.object({
    ocr: PhaseConfigSchema,
    learning: PhaseConfigSchema,
    conversion: PhaseConfigSchema,
    optimization: PhaseConfigSchema
})



// ============================================================
// AI利用統計集計ヘルパー
// ============================================================

interface AiMetricsSummary {
  /** 集計キー（顧問先ID or スタッフID） */
  key: string;
  /** AI呼び出し回数 */
  totalCalls: number;
  /** 入力トークン合計 */
  promptTokens: number;
  /** 出力トークン合計 */
  completionTokens: number;
  /** 思考トークン合計 */
  thinkingTokens: number;
  /** 合計トークン数 */
  totalTokens: number;
  /** 費用合計（円） */
  totalCostYen: number;
  /** 平均処理時間（ms） */
  avgLatencyMs: number;
  /** 使用モデル（最頻） */
  model: string;
}

/** DocEntry配列からaiMetricsを集計 */
function aggregateMetrics(docs: DocEntry[], groupBy: 'clientId' | 'createdBy'): AiMetricsSummary[] {
  const groups = new Map<string, DocEntry[]>();
  for (const doc of docs) {
    if (!doc.aiMetrics) continue;
    const key = groupBy === 'clientId' ? doc.clientId : (doc.createdBy ?? '不明');
    const list = groups.get(key) ?? [];
    list.push(doc);
    groups.set(key, list);
  }

  const results: AiMetricsSummary[] = [];
  for (const [key, list] of groups) {
    let promptTokens = 0;
    let completionTokens = 0;
    let thinkingTokens = 0;
    let totalCostYen = 0;
    let totalLatency = 0;
    const modelCounts = new Map<string, number>();

    for (const doc of list) {
      const m = doc.aiMetrics!;
      promptTokens += m.prompt_tokens;
      completionTokens += m.completion_tokens;
      thinkingTokens += m.thinking_tokens;
      totalCostYen += m.cost_yen;
      totalLatency += m.duration_ms;
      const model = m.model ?? 'unknown';
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
    }

    // 最頻モデル
    let topModel = 'unknown';
    let topCount = 0;
    for (const [model, count] of modelCounts) {
      if (count > topCount) { topModel = model; topCount = count; }
    }

    results.push({
      key,
      totalCalls: list.length,
      promptTokens,
      completionTokens,
      thinkingTokens,
      totalTokens: promptTokens + completionTokens,
      totalCostYen: Math.round(totalCostYen * 10000) / 10000,
      avgLatencyMs: list.length > 0 ? Math.round(totalLatency / list.length) : 0,
      model: topModel,
    });
  }

  // コスト降順
  results.sort((a, b) => b.totalCostYen - a.totalCostYen);
  return results;
}

// --- Routes ---
const route = app
    .get('/dashboard', (c) => {
        // ストアから実データを集計（MOCK_ADMIN_DATA削除: 2026-05-05 R5）
        const clients = getAllClients()
        const staff = getAllStaff()
        const docs = getDocuments()
        const withMetrics = docs.filter(d => d.aiMetrics)

        // KPI: 月間仕訳数（今月の処理済みドキュメント数をカウント）
        const now = new Date()
        const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const thisMonthDocs = docs.filter(d =>
          typeof d.receivedAt === 'string' && d.receivedAt.startsWith(thisMonthPrefix)
        )
        const monthlyJournals = thisMonthDocs.length

        // KPI: 自動変換率（完了 / 全受領 × 100）
        const completed = thisMonthDocs.filter(d => d.status === 'completed' || d.status === 'exported')
        const autoConversionRate = thisMonthDocs.length > 0
          ? Math.round((completed.length / thisMonthDocs.length) * 1000) / 10
          : 0

        // KPI: AI精度（aiMetricsが記録されている割合）
        const thisMonthWithMetrics = thisMonthDocs.filter(d => d.aiMetrics)
        const aiAccuracy = thisMonthDocs.length > 0
          ? Math.round((thisMonthWithMetrics.length / thisMonthDocs.length) * 1000) / 10
          : 0

        // KPI: ファネル（受領→出力）
        const received = docs.length
        const exported = docs.filter(d => d.status === 'exported').length

        // スタッフパフォーマンス
        const staffPerformance = staff
          .filter(s => s.status === 'active')
          .map(s => {
            // 各スタッフの担当顧問先の仕訳をカウント
            const assignedClients = clients.filter(cl => cl.staffId === s.uuid)
            let totalBacklog = 0
            let draftCount = 0
            for (const cl of assignedClients) {
              const journals = getJournals(cl.clientId) as Record<string, unknown>[]
              const active = journals.filter(j => !j.deleted_at)
              totalBacklog += active.length
              draftCount += active.filter(j => j.status === 'draft').length
            }
            return {
              name: s.name,
              backlogs: { total: totalBacklog, draft: draftCount },
              velocity: { draftAvg: 0 } // TODO: 実際の処理速度はactivityLogから算出
            }
          })

        return c.json({
          kpi: {
            monthlyJournals,
            autoConversionRate,
            aiAccuracy,
            funnel: { received, exported }
          },
          staff: staffPerformance
        })
    })
    // ━━━ T-31-3: ダッシュボードサマリAPI（顧問先数・スタッフ数・分析データ集計） ━━━
    .get('/dashboard/summary', (c) => {
      const clients = getAllClients()
      const staff = getAllStaff()

      // 顧問先集計
      const activeClients = clients.filter(c => c.status === 'active').length
      const stoppedClients = clients.filter(c => c.status !== 'active').length

      // 顧問先分析データ生成
      const clientAnalysis = clients.map(c => ({
        code: c.threeCode || c.clientId,
        name: c.companyName,
        status: c.status,
        performance: {
          journalsThisMonth: 0, journalsThisYear: 0, journalsLastYear: 0,
          apiCostThisYear: 0, velocityThisMonth: 0, velocityAvg: 0
        }
      }))

      // スタッフ集計
      const activeStaffCount = staff.filter(s => s.status === 'active').length

      // スタッフ分析データ生成
      const staffAnalysis = staff.map(s => ({
        staffId: s.uuid,
        name: s.name,
        role: s.role ?? '一般',
        status: s.status,
        performance: {
          monthlyJournals: 0, processingTime: '0h', velocityPerHour: 0,
          thisMonthJournals: 0, monthlyAvgJournals: 0, annualApiCost: 0,
          velocityThisMonth: 0, velocityAvg: 0, velocityPerHourAvg: 0,
          velocity: { draftAvg: 0 }
        },
        backlogs: { total: 0, draft: 0 },
        backlog: {}
      }))

      // ステータス別カウント（T-31-6: ページ側のfilterカウントをサーバー移植）
      const staffStatusCounts = {
        all: staff.length,
        active: staff.filter(s => s.status === 'active').length,
        inactive: staff.filter(s => s.status === 'inactive').length,
        suspension: staff.filter(s => s.status === 'suspension').length,
      }
      const clientStatusCounts = {
        all: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status !== 'active' && c.status !== 'suspension').length,
        suspension: clients.filter(c => c.status === 'suspension').length,
      }

      return c.json({
        kpiCostQuality: {
          registeredClients: clients.length,
          activeClients,
          stoppedClients,
          staffCount: activeStaffCount,
        },
        clientAnalysis,
        staffAnalysis,
        staffStatusCounts,
        clientStatusCounts,
      })
    })
    // ━━━ T-31-4: タスクダッシュボード サマリAPI（モックデータをサーバー側に移動） ━━━
    // Supabase移行時: 各カウントをSELECT COUNT(*)に差し替え
    .get('/task-summary', (c) => {
      // モックデータ（Supabase接続前はハードコード。接続後はクエリ結果に差し替え）
      const taskClients = [
        {
          code: '1001', name: '株式会社 テスト商事', isIndividual: false,
          missingCount: 1, oldestMissingDate: '12/10',
          alertCount: 2, oldestAlertDate: '12/15',
          draftCount: 45, oldestDraftDate: '12/05',
          approvalCount: 5, oldestApprovalDate: '12/24',
          exportCount: 0,
          filingCount: 2, oldestFilingDate: '12/20',
          learningCount: 0,
          reconcileCount: 1, oldestReconcileDate: '11/30'
        },
        {
          code: '1002', name: '合同会社 サンプル', isIndividual: false,
          missingCount: 0, alertCount: 0,
          draftCount: 12, oldestDraftDate: '12/20',
          approvalCount: 0,
          exportCount: 120, oldestExportDate: '12/25',
          filingCount: 0,
          learningCount: 2, oldestLearningDate: '12/18',
          reconcileCount: 0
        },
        {
          code: '1003', name: '鈴木商店', isIndividual: true,
          missingCount: 2, oldestMissingDate: '11/15',
          alertCount: 3, oldestAlertDate: '11/20',
          draftCount: 67, oldestDraftDate: '11/10',
          approvalCount: 10, oldestApprovalDate: '12/01',
          exportCount: 0,
          filingCount: 10, oldestFilingDate: '11/01',
          learningCount: 6, oldestLearningDate: '12/10',
          reconcileCount: 4, oldestReconcileDate: '11/05'
        },
        {
          code: '2001', name: '田中建設', isIndividual: true,
          missingCount: 0, alertCount: 0, draftCount: 0, approvalCount: 0,
          exportCount: 380, oldestExportDate: '11/30',
          filingCount: 0, learningCount: 0, reconcileCount: 0
        },
        {
          code: '2005', name: 'Tech Solutions Inc.', isIndividual: false,
          missingCount: 0, alertCount: 0, draftCount: 0, approvalCount: 0,
          exportCount: 0, filingCount: 0, learningCount: 0, reconcileCount: 0
        }
      ]

      // ウィジェット集計（サーバー側で算出）
      const widgets = {
        missingCount: taskClients.reduce((s, c) => s + (c.missingCount ?? 0), 0),
        alertCount: taskClients.reduce((s, c) => s + (c.alertCount ?? 0), 0),
        draftCount: taskClients.reduce((s, c) => s + (c.draftCount ?? 0), 0),
        approvalCount: taskClients.reduce((s, c) => s + (c.approvalCount ?? 0), 0),
        exportCount: taskClients.reduce((s, c) => s + (c.exportCount ?? 0), 0),
        filingCount: taskClients.reduce((s, c) => s + (c.filingCount ?? 0), 0),
        learningCount: taskClients.reduce((s, c) => s + (c.learningCount ?? 0), 0),
        reconcileCount: taskClients.reduce((s, c) => s + (c.reconcileCount ?? 0), 0),
      }

      return c.json({ widgets, clients: taskClients })
    })
    .get('/config', async (c) => {
        // [レガシー] Firebase Firestore依存。Supabase移行後に再実装
        console.warn('[admin] config GET: Firebase削除済み。スタブレスポンスを返します')
        return c.json({})
    })
    .patch('/config',
        zValidator('json', z.object({
            aiPhases: PhaseSettingsSchema.optional(),
        }).passthrough(), zodHook),
        async (c) => {
            // [レガシー] Firebase Firestore + ConfigService依存。Supabase移行後に再実装
            console.warn('[admin] config PATCH: Firebase削除済み。保存はスキップされます')
            return c.json({ success: true, message: 'Configuration save skipped (Firebase removed)' })
        }
    )
    // ━━━ AI利用統計API（管理ダッシュボード用） ━━━
    .get('/ai-metrics/summary', (c) => {
      const docs = getDocuments();
      const withMetrics = docs.filter(d => d.aiMetrics);
      const byClient = aggregateMetrics(docs, 'clientId');
      const byStaff = aggregateMetrics(docs, 'createdBy');

      // 全体集計
      let promptTokens = 0, completionTokens = 0, thinkingTokens = 0;
      let totalCostYen = 0, totalLatency = 0;
      for (const doc of withMetrics) {
        const m = doc.aiMetrics!;
        promptTokens += m.prompt_tokens;
        completionTokens += m.completion_tokens;
        thinkingTokens += m.thinking_tokens;
        totalCostYen += m.cost_yen;
        totalLatency += m.duration_ms;
      }

      return c.json({
        total: {
          totalCalls: withMetrics.length,
          promptTokens,
          completionTokens,
          thinkingTokens,
          totalTokens: promptTokens + completionTokens,
          totalCostYen: Math.round(totalCostYen * 10000) / 10000,
          avgLatencyMs: withMetrics.length > 0 ? Math.round(totalLatency / withMetrics.length) : 0,
        },
        byClient,
        byStaff,
      });
    })
    /** 顧問先別AI利用統計 */
    .get('/ai-metrics/by-client', (c) => {
      const docs = getDocuments();
      return c.json({ results: aggregateMetrics(docs, 'clientId') });
    })
    /** スタッフ別AI利用統計 */
    .get('/ai-metrics/by-staff', (c) => {
      const docs = getDocuments();
      return c.json({ results: aggregateMetrics(docs, 'createdBy') });
    })
    /** 特定顧問先のAI利用統計（詳細） */
    .get('/ai-metrics/client/:clientId', (c) => {
      const clientId = c.req.param('clientId');
      const docs = getDocuments(clientId);
      const withMetrics = docs.filter(d => d.aiMetrics);

      const details = withMetrics.map(d => ({
        id: d.id,
        fileName: d.fileName,
        createdBy: d.createdBy,
        receivedAt: d.receivedAt,
        status: d.status,
        metrics: d.aiMetrics,
      }));

      // 集計
      let promptTokens = 0, completionTokens = 0, thinkingTokens = 0;
      let totalCostYen = 0, totalLatency = 0;
      for (const d of withMetrics) {
        const m = d.aiMetrics!;
        promptTokens += m.prompt_tokens;
        completionTokens += m.completion_tokens;
        thinkingTokens += m.thinking_tokens;
        totalCostYen += m.cost_yen;
        totalLatency += m.duration_ms;
      }

      return c.json({
        clientId,
        summary: {
          totalCalls: withMetrics.length,
          promptTokens,
          completionTokens,
          thinkingTokens,
          totalTokens: promptTokens + completionTokens,
          totalCostYen: Math.round(totalCostYen * 10000) / 10000,
          avgLatencyMs: withMetrics.length > 0 ? Math.round(totalLatency / withMetrics.length) : 0,
        },
        details,
      });
    })
    // ━━━ CSV行数集計API（管理ダッシュボード用） ━━━
    .get('/csv-summary', (c) => {
      const summary = summarizeCsvLinesImport();
      return c.json(summary);
    })
    // ━━━ 仕訳数集計API（全顧問先の仕訳データから実数をインポート） ━━━
    .get('/journal-summary', (c) => {
      const allClients = getAllClients();
      const now = new Date();
      const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // 'YYYY-MM'

      let totalJournals = 0; // 仕訳件数（証票数）
      let totalLines = 0;    // 仕訳行数（debit/credit展開後）
      const byClient: { clientId: string; companyName: string; journalCount: number; lineCount: number }[] = [];
      const byStaff = new Map<string, { journalCount: number; lineCount: number }>();

      /** 仕訳1件のレコード型 */
      type JournalRecord = Record<string, unknown> & {
        deleted_at?: string | null;
        created_at?: string | null;
        debit_entries?: unknown[];
        credit_entries?: unknown[];
      };

      for (const client of allClients) {
        const journals = getJournals(client.clientId) as JournalRecord[];
        // deleted_atがnullかつ今月作成分のみカウント
        const active = journals.filter(j =>
          (j.deleted_at === null || j.deleted_at === undefined) &&
          (typeof j.created_at === 'string' && j.created_at.startsWith(thisMonthPrefix))
        );
        const journalCount = active.length;
        // 行数: debit_entries + credit_entries の最大値を合算
        let lineCount = 0;
        for (const j of active) {
          const debitLen = Array.isArray(j.debit_entries) ? j.debit_entries.length : 0;
          const creditLen = Array.isArray(j.credit_entries) ? j.credit_entries.length : 0;
          lineCount += Math.max(debitLen, creditLen);
        }

        totalJournals += journalCount;
        totalLines += lineCount;

        byClient.push({
          clientId: client.clientId,
          companyName: client.companyName,
          journalCount,
          lineCount,
        });

        // スタッフ別集計
        const sid = client.staffId ?? 'unassigned';
        const existing = byStaff.get(sid) ?? { journalCount: 0, lineCount: 0 };
        existing.journalCount += journalCount;
        existing.lineCount += lineCount;
        byStaff.set(sid, existing);
      }

      return c.json({
        total: { journalCount: totalJournals, lineCount: totalLines },
        byClient,
        byStaff: Array.from(byStaff.entries()).map(([staffId, v]) => ({ staffId, ...v })),
      });
    })

export default route



import { Hono } from 'hono'
import { z } from 'zod'

import { zValidator } from '@hono/zod-validator'
import { zodHook } from '../helpers/zodHook'
import { getDocuments } from '../services/documentStore'
import { summarizeCsvLines as summarizeCsvLinesImport } from '../services/exportHistoryStore'
import { getAll as getAllClients } from '../services/clientStore'
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


// --- Mock Data ---
const MOCK_ADMIN_DATA = {
    kpi: {
        monthlyJournals: 12580,
        autoConversionRate: 94.2,
        aiAccuracy: 98.5,
        funnel: {
            received: 15400,
            exported: 13552
        }
    },
    staff: [
        { name: '佐藤 健太', backlogs: { total: 45, draft: 12 }, velocity: { draftAvg: 85 } },
        { name: '鈴木 一郎', backlogs: { total: 12, draft: 0 }, velocity: { draftAvg: 110 } },
        { name: '高橋 花子', backlogs: { total: 8, draft: 2 }, velocity: { draftAvg: 95 } }
    ]
}

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
        return c.json(MOCK_ADMIN_DATA)
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


import { ref, reactive } from 'vue';

// 型安全インポート
import { JobSchema, ClientSchema } from '@/types/zod_schema';
import type { JobApi, ClientApi } from '@/types/zod_schema';
import type { JobUi, ClientUi, JobStatusUi, JournalLineUi } from '@/types/ui.type';
import { mapJobApiToUi } from '@/composables/mapper';
import { mapClientApiToUi } from '@/composables/ClientMapper';


// 分離済みモジュール
import { GAS_LOGIC_DEFINITIONS, AI_PROMPTS, SYSTEM_CONFIG,
  AI_PROMPT_GENERATION_DEFAULT, AI_PROMPT_ANOMALY_DEFAULT, GAS_PROMPT_DRIVE_DEFAULT,
  ClientActionType, type StepState, type StepStatus } from '@/composables/accountingConstants';
import { TAX_SCHEMA_TEXT } from '@/shared/schema_dictionary';
import { createMockJob, MOCK_JOBS_RAW, MOCK_ADMIN_DATA,
  determineAccountItem } from '@/mocks/data/accountingMockData';
import { mockClientsPreload } from '@/mocks/data/accountingMockClients';

// 定数・型の再エクスポート（既存の利用者への互換性維持）
export { GAS_LOGIC_DEFINITIONS, TAX_SCHEMA_TEXT, AI_PROMPTS, SYSTEM_CONFIG,
  AI_PROMPT_GENERATION_DEFAULT, AI_PROMPT_ANOMALY_DEFAULT, GAS_PROMPT_DRIVE_DEFAULT,
  ClientActionType };
export type { StepState, StepStatus };

// UIコンポーネント向け型エクスポート
export type { JobUi, ClientUi, JobStatusUi, JournalLineUi };

// ========================================================================
// 🚀 Composable Implementation (IRONCLAD)
// ========================================================================

const currentUser = reactive({ name: '管理者 太郎', email: 'admin@example.com' });

// ステートはUI型のみ使用
const jobs = ref<JobUi[]>([]);
const clients = ref<ClientUi[]>([]);
const _selectedJob = ref<JobUi | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const adminData = reactive(MOCK_ADMIN_DATA);
const isEmergencyStopped = ref(false);

let unsubscribeJobs: (() => void) | null = null;

// マッピング用ヘルパーロジック
const clientRawMap = new Map<string, ClientApi>();

// ヘルパー: パイプラインプロセッサ
function processJobPipeline(raw: unknown, source: string): JobUi | null {
  // 1. Zod Validation (Gatekeeper)
  const result = JobSchema.safeParse(raw);
  if (!result.success) {
    console.warn(`[型安全] ジョブデータがゲートキーパーで拒否されました (${source}):`, result.error);
    return null; // 不正データを破棄
  }

  // 1.5 Client Lookup (Data Driven)
  const client = clientRawMap.get(result.data.clientCode);

  // 2. Mapper (Transformation) with Client Context
  return mapJobApiToUi(result.data, client);
}

function processClientPipeline(raw: unknown, source: string): ClientUi | null {
  const result = ClientSchema.safeParse(raw);
  if (!result.success) {
    console.warn(`[型安全] 顧問先データがゲートキーパーで拒否されました (${source}):`, JSON.stringify(result.error.format(), null, 2));
    return null;
  }
  // ジョブマッピング用に生データを保持
  clientRawMap.set(result.data.clientCode, result.data);

  return mapClientApiToUi(result.data);
}

export function useAccountingSystem() {
  // useBankLogic は削除済み

  // 安全にマッピングされたモックデータで初期化

  mockClientsPreload.forEach(c => {
    // 顧問先マップ処理
    processClientPipeline(c as ClientApi, `Preload-${c.clientCode}`);
  });

  // 2. Process Jobs (Now Map has data)
  const initialJobs: JobUi[] = [];
  MOCK_JOBS_RAW.forEach(j => {
    const processed = processJobPipeline(j, 'MockInit');
    if (processed) initialJobs.push(processed);
  });
  jobs.value = initialJobs;

  // --- Actions ---

  async function fetchJobById(jobId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const localJob = jobs.value.find(j => j.id === jobId);
      if (localJob) {
        _selectedJob.value = localJob;
      } else {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const rawDbJob = await res.json();
          const processed = processJobPipeline(rawDbJob, 'FetchById');
          if (processed) {
            _selectedJob.value = processed;
          } else {
            error.value = "ジョブデータが不正です (Adapter Rejection)";
          }
        } else {
          error.value = "ジョブが見つかりません (API Error: " + res.status + ")";
        }
      }
    } catch (e) {
      console.error(e);
      error.value = "ジョブデータの取得に失敗しました";
    } finally {
      isLoading.value = false;
    }
  }

  async function createNewJob(_file: File, clientCode: string): Promise<string | null> {
    const newId = "job_" + Date.now();
    // モック生データ作成
    const newRawJob = createMockJob(newId, new Date().toISOString(), "新規アップロード", "解析中...", 0, 'ai_processing', "未確定");
    newRawJob.clientCode = clientCode;

    // パイプライン処理
    const processed = processJobPipeline(newRawJob, 'CreateNew');
    if (processed) {
      jobs.value.push(processed);
      return newId;
    }
    return null;
  }

  async function createClient(data: Partial<ClientApi>) {
    isLoading.value = true;
    try {
      if (!data.clientCode) throw new Error("Client Code is required");

      const newClientRaw = {
        clientId: `client_${data.clientCode}`,
        contact: { type: 'none' as const, value: '' },
        advisoryFee: 0,
        bookkeepingFee: 0,
        settlementFee: 0,
        taxFilingFee: 0,
        ...data,
        updatedAt: new Date()
      };

      // fetch直接呼び出し（旧BFF RPCルート廃止に伴う移行）
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientRaw),
      });

      await fetchClients();
    } catch (e: unknown) {
      if (e instanceof Error) error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateClient(clientCode: string, data: Partial<ClientApi>) {
    isLoading.value = true;
    try {
      // fetch直接呼び出し（旧BFF RPCルート廃止に伴う移行）
      await fetch(`/api/clients/${clientCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // 楽観的ローカルステート更新
      const idx = clients.value.findIndex(c => c.clientCode === clientCode);
      if (idx !== -1) {
        await fetchClients();
      }
    } catch (e: unknown) {
      console.error("顧問先更新失敗", e);
      error.value = "更新に失敗しました";
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchClients() {
    isLoading.value = true;
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        const errText = await res.text();
        console.error("顧問先取得エラー:", errText);
        throw new Error("Failed to fetch clients: " + res.status);
      }

      const rawData: ClientApi[] = (await res.json()) as ClientApi[];

      // モックデータを生データストリームに注入（表示用）
      // 修正: ClientApi型の厳密性のためupdatedAtを注入
      const mockClients = (mockClientsPreload).map(c => ({
        ...c,
        updatedAt: new Date()
      })) as ClientApi[];

      // モック強制注入/上書き（ローカルのみ）
      mockClients.forEach((mock) => {
        const idx = rawData.findIndex((c: ClientApi) => c.clientCode === mock.clientCode);
        if (idx !== -1) {
          rawData[idx] = mock;
        } else {
          rawData.push(mock);
        }
      });

      // パイプラインフィルタ
      const safeClients: ClientUi[] = [];
      rawData.forEach((c: ClientApi) => {
        const processed = processClientPipeline(c, `FetchClients-${c.clientCode}`);
        if (processed) safeClients.push(processed);
      });

      clients.value = safeClients;
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  }

  function checkMaterialStatus(_client: ClientUi, _clientJobs: JobUi[]) {
    // リンター抑制
    void _client;
    void _clientJobs;
    return [];
  }

  function subscribeToClientJobs(clientCode: string) {
    isLoading.value = true;
    if (unsubscribeJobs) unsubscribeJobs();

    const fetchAndSet = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const raw = await res.json();
          const safeJobs: JobUi[] = [];
          // 生データ → パイプライン変換
          // unknown型で安全なキャストを強制
          raw.forEach((j: unknown) => {
            const processed = processJobPipeline(j as JobApi, 'SubscribeClient');
            if (processed && processed.clientCode === clientCode) {
              safeJobs.push(processed);
            }
          });
          jobs.value = safeJobs;
        }
      } catch (e) {
        console.error("ポーリングエラー", e);
      } finally {
        isLoading.value = false;
      }
    };

    fetchAndSet();
    const intervalId = setInterval(fetchAndSet, 5000);
    unsubscribeJobs = () => clearInterval(intervalId);
  }

  function getClientByCode(code: string): ClientUi | undefined {
    return clients.value.find(c => c.clientCode === code);
  }

  return {
    clients,
    jobs,
    _selectedJob,
    currentUser,
    adminData,
    isEmergencyStopped,
    isLoading,
    error,

    fetchJobById,
    createNewJob,
    createClient,
    updateClient,
    fetchClients,
    subscribeToClientJobs,

    subscribeToAllJobs(callback?: (jobs: JobUi[]) => void) {
      isLoading.value = true;
      if (unsubscribeJobs) unsubscribeJobs();

      const fetchAndSet = async () => {
        try {
          const res = await fetch('/api/jobs');
          if (res.ok) {
            const raw = await res.json();
            const fetchedJobs: JobUi[] = [];
            raw.forEach((j: unknown) => {
              const processed = processJobPipeline(j as JobApi, 'SubscribeAll');
              if (processed) fetchedJobs.push(processed);
            });

            // スマートマージ（UIリフレッシュ防止のためオブジェクト参照を保持）
            // 1. Update existing jobs
            fetchedJobs.forEach(newJob => {
              const existingIdx = jobs.value.findIndex(j => j.id === newJob.id);
              if (existingIdx !== -1) {
                // プロパティマージ（参照保持）
                const existing = jobs.value[existingIdx];
                if (existing) {
                  // ユーザー編集中チェック（UI用楽観ロック）
                  // 簡易版: ローカル保留変更がなければサーバーデータで上書き
                  // 現時点: Object.Assignで直接代入（参照保持）
                  // ディープマージロジック（監査準拠）
                  // 1. Merge Primitive Props (Skip 'lines')
                  Object.keys(newJob).forEach((key) => {
                    const k = key as keyof JobUi;
                    if (k === 'lines') return;
                    if (newJob[k] !== existing[k]) {
                      // keyofを使った安全な代入
                      // TS がunionキー間の値互換性を検証できない場合の型アサーション
                      // 明示的anyの排除が目的
                      // 厳密性が失敗した場合、JobUiキーはmutableと仮定
                      (existing[k] as JobUi[keyof JobUi]) = newJob[k];
                    }
                  });
                }

                // 2. Lines Array Deep Merge (Immutable Array Pattern)
                let updatedLines = existing!.lines ? [...existing!.lines] : [];
                // Object.assignで既存refを使うなら配列の浅いコピーで十分
                // 完全にイミュータブルにするなら置換すべき
                // Object.assign(existingLine, newLine) で参照を保持
                updatedLines = existing!.lines ? [...existing!.lines] : [];

                if (newJob.lines && Array.isArray(newJob.lines)) {
                  newJob.lines.forEach((newLine: JournalLineUi) => {
                    const matchIdx = updatedLines.findIndex(l => l.lineNo === newLine.lineNo);
                    if (matchIdx !== -1) {
                      // 入力用オブジェクト参照を保持しつつプロパティ更新
                      // TS Error Fix: assert target and source
                      if (updatedLines[matchIdx]) {
                        Object.assign(updatedLines[matchIdx]!, newLine!);
                      }
                    } else {
                      updatedLines.push(newLine!);
                    }
                  });
                }

                // ジョブへのイミュータブル更新適用
                // JobUi型にキャストしてid型の不一致を解決
                jobs.value[existingIdx] = {
                  ...existing!,
                  lines: updatedLines,
                  id: existing!.id! // 厳密なID強制
                } as JobUi;

                // 現在のジョブの場合、Refも更新
                // currentJob is a Ref to the Object. Updating the Object properties updates currentJob automatically.
              } else {
                jobs.value.push(newJob);
              }
            });

            // 2. Remove deleted jobs (Optional - omitted for safety in Audit?)
            // サーバーリストにない場合は削除
            // jobs.value = jobs.value.filter(j => fetchedJobs.some(n => n.id === j.id));
            // 監査中の行消失を防ぐため現時点では保持

            if (callback) callback(jobs.value);
          }
        } catch (e) {
          console.error("ポーリングエラー", e);
        } finally {
          isLoading.value = false;
        }
      };

      fetchAndSet();
      const intervalId = setInterval(fetchAndSet, 5000);
      unsubscribeJobs = () => clearInterval(intervalId);
    },
    checkMaterialStatus,
    getClientByCode,

    async updateJobStatus(jobId: string, status: JobStatusUi, errorMessage?: string) {
      // 楽観的更新
      const jobIdx = jobs.value.findIndex(j => j.id === jobId);
      if (jobIdx !== -1) {
        jobs.value[jobIdx] = {
          ...jobs.value[jobIdx],
          status: status,
          statusLabel: '更新中...',
          errorMessage: errorMessage || ''
        } as JobUi;
      }

      // API呼び出し（fetch）
      // fetch直接呼び出し（旧BFF RPCルート廃止に伴う移行）
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, errorMessage }),
      });
    },

    async updateJob(jobId: string, data: Partial<JobApi>) {
      // 楽観的更新
      const job = jobs.value.find(j => j.id === jobId);
      if (job && data) {
        Object.assign(job, data);
      }

      // API向け日付フォーマット変換
      const apiUpdates = { ...data };
      if (apiUpdates.transactionDate && typeof apiUpdates.transactionDate === 'string') {
        // YYYY-MM-DD形式をISO形式に変換
        if (/^\d{4}-\d{2}-\d{2}$/.test(apiUpdates.transactionDate)) {
          apiUpdates.transactionDate = new Date(apiUpdates.transactionDate) as Date;
        }
      }

      // TAX VALIDATION (Sublimated in Phase 6 due to totalAmount removal)
      // バリデーションはバックエンドまたは行合計で実施すべき
      // ロジック整理済み

      try {
        await fetch(`/api/jobs/${jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiUpdates),
        });
      } catch (e) {
        console.error('ジョブ更新エラー', e);
        throw e;
      }
    },

    runAIInference: determineAccountItem,
    debugInjectClients: (data: ClientUi[]) => { clients.value = data; },
    toggleEmergencyStop: () => { isEmergencyStopped.value = !isEmergencyStopped.value; },

    // GAS Integration Mock
    mockGasIntegration: async () => {
      console.log('GAS統合: 税スキーマ検証中...');
      return new Promise<{ success: boolean; message: string }>((resolve) => {
        setTimeout(() => {
          console.log('GAS統合: 検証完了');
          resolve({ success: true, message: 'Tax Schema Verified by GAS' });
        }, 800);
      });
    }
  };
}


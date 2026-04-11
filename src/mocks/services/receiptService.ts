/**
 * receiptService.ts
 * サービス層: モックモード / 本番モード を VITE_USE_MOCK で切り替える
 * Vue側は常に同じ ReceiptAnalysisResult 型を受け取る
 */

export interface ReceiptAnalysisResult {
  ok: boolean
  /** 正常時: YYYY-MM-DD */
  date: string | null
  /** 正常時: 合計金額（整数） */
  amount: number | null
  /** 正常時: 取引先名 */
  vendor: string | null
  /** NGの場合: 却下理由（UIに表示） */
  errorReason: string | null
  /** テスト用メトリクス（全項目） */
  metrics?: {
    // AIレスポンス
    source_type: string                  // 証票種別
    source_type_confidence: number       // 種別信頼度（0.0〜1.0）
    direction: string                    // 仕訳方向（支払/入金/振替/混在）
    direction_confidence: number          // 方向信頼度（0.0〜1.0）
    processing_mode: string              // 処理モード（自動/手動/除外）
    description: string | null           // 摘要
    fallback_applied: boolean            // フォールバック適用
    // メトリクス
    duration_ms: number                  // 処理時間（ミリ秒）
    duration_seconds: number             // 処理時間（秒）
    prompt_tokens: number                // 入力トークン数
    completion_tokens: number            // 出力トークン数
    thinking_tokens: number              // 思考トークン数
    token_count: number                  // トークン合計（入力+出力）
    cost_yen: number                     // 利用料（円）
    model: string                        // 使用AIモデル名
    // 前処理
    original_size_kb: number             // 前処理前サイズ（KB）
    processed_size_kb: number            // 前処理後サイズ（KB）
    preprocess_reduction_pct: number     // 削減率（%）
  }
}

/** analyzeReceipt呼出し時のオプション */
export interface AnalyzeOptions {
  clientId?: string
  role?: string      // 'staff' | 'guest'
  device?: string    // 'pc' | 'mobile'
  documentId?: string  // 証票ID（crypto.randomUUID()で生成。Supabase時はUUID PK）
}

// ===== モック用定数 =====
const MOCK_ERROR_REASONS = [
  '金額が判読できません',
  '日付が記載されていません',
  '取引先が不明です',
  '複数の証票が1枚に写っています',
]

const MOCK_VENDORS = [
  'セブン-イレブン',
  'ファミリーマート',
  'ローソン',
  '東京電力エナジーパートナー',
  'Amazon Japan',
  '関西電力',
  'ENEOSウイング',
  'ヤマト運輸',
  'NTTコミュニケーションズ',
  'イオンリテール',
]

// ===== モック実装 =====
async function analyzeReceiptMock(_file: File, _clientId?: string): Promise<ReceiptAnalysisResult> {
  // 5〜8秒（DL-011実測: 前処理あり6.3秒/枚に基づく）
  const delay = 5000 + Math.random() * 3000
  await new Promise(r => setTimeout(r, delay))

  const isOk = Math.random() > 0.25 // 75%がOK

  if (isOk) {
    const day = Math.floor(Math.random() * 28) + 1
    const d = new Date(2025, 2, day)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const amount = Math.floor((Math.random() * 500 + 5)) * 100
    const vendor = MOCK_VENDORS[Math.floor(Math.random() * MOCK_VENDORS.length)] ?? null
    return { ok: true, date, amount, vendor, errorReason: null }
  }

  return {
    ok: false,
    date: null,
    amount: null,
    vendor: null,
    errorReason: MOCK_ERROR_REASONS[Math.floor(Math.random() * MOCK_ERROR_REASONS.length)] ?? null,
  }
}

// ===== 本番実装（/api/pipeline/classify） =====
async function analyzeReceiptReal(file: File, clientId?: string): Promise<ReceiptAnalysisResult> {
  try {
    // ファイルをbase64に変換
    const buffer = await file.arrayBuffer()
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    // API呼び出し
    const response = await fetch('/api/pipeline/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mimeType: file.type || 'image/jpeg',
        clientId: clientId ?? 'unknown',
        filename: file.name,
      }),
    })

    if (!response.ok) {
      return {
        ok: false,
        date: null,
        amount: null,
        vendor: null,
        errorReason: `サーバーエラー (${response.status})`,
      }
    }

    const data = await response.json()

    // バリデーション: date/amount のnullチェック
    const date: string | null = data.date ?? null
    const amount: number | null = data.total_amount ?? null
    const vendor: string | null = data.issuer_name ?? null

    const metrics = {
      // AIレスポンス
      source_type: data.source_type ?? 'unknown',
      source_type_confidence: data.source_type_confidence ?? 0,
      direction: data.direction ?? 'unknown',
      direction_confidence: data.direction_confidence ?? 0,
      processing_mode: data.processing_mode ?? 'unknown',
      description: data.description ?? null,
      fallback_applied: data.fallback_applied ?? false,
      // メトリクス
      duration_ms: data.metadata?.duration_ms ?? 0,
      duration_seconds: data.metadata?.duration_seconds ?? 0,
      prompt_tokens: data.metadata?.prompt_tokens ?? 0,
      completion_tokens: data.metadata?.completion_tokens ?? 0,
      thinking_tokens: data.metadata?.thinking_tokens ?? 0,
      token_count: data.metadata?.token_count ?? 0,
      cost_yen: data.metadata?.cost_yen ?? 0,
      model: data.metadata?.model ?? 'unknown',
      // 前処理
      original_size_kb: data.metadata?.original_size_kb ?? 0,
      processed_size_kb: data.metadata?.processed_size_kb ?? 0,
      preprocess_reduction_pct: data.metadata?.preprocess_reduction_pct ?? 0,
    }

    // 除外対象（non_journal / other）
    if (data.source_type === 'non_journal' || data.source_type === 'other') {
      return {
        ok: false,
        date,
        amount,
        vendor,
        errorReason: '仕訳対象外の書類です',
        metrics,
      }
    }

    // 日付なし → NG
    if (!date) {
      return {
        ok: false,
        date: null,
        amount,
        vendor,
        errorReason: '日付が読み取れません',
        metrics,
      }
    }

    // 金額なしまたは0以下 → NG
    if (amount === null || amount <= 0) {
      return {
        ok: false,
        date,
        amount: null,
        vendor,
        errorReason: '金額が読み取れません',
        metrics,
      }
    }

    // fallback適用時 → NG
    if (data.fallback_applied) {
      return {
        ok: false,
        date,
        amount,
        vendor,
        errorReason: 'AI処理に失敗しました。撮り直してください',
        metrics,
      }
    }

    // 全項目OK
    return {
      ok: true,
      date,
      amount,
      vendor,
      errorReason: null,
      metrics,
    }
  } catch (err) {
    return {
      ok: false,
      date: null,
      amount: null,
      vendor: null,
      errorReason: `通信エラー: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/** テスト用: classify結果をコンソールに全項目構造化出力 */
function logClassifyResult(file: File, opts: AnalyzeOptions, result: ReceiptAnalysisResult) {
  const m = result.metrics
  const DIRECTION_LABELS: Record<string, string> = {
    expense: '支払', income: '入金', transfer: '振替', mixed: '混在', unknown: '不明',
  }
  const MODE_LABELS: Record<string, string> = {
    auto: '自動仕訳', manual: '手動仕訳', excluded: '除外', unknown: '不明',
  }
  const fallbackLabel = m?.fallback_applied
    ? 'あり（デフォルト値に置換）'
    : 'なし（AIが正常に処理）'

  console.log(
    `\n═══ classify結果 [${file.name}] ═══\n` +
    `▼ フロント情報\n` +
    `  顧問先ID     : ${opts.clientId ?? '-'}\n` +
    `  証票ID       : ${opts.documentId ?? '-'}\n` +
    `  権限         : ${opts.role ?? '-'}（${opts.role === 'staff' ? '事務所スタッフ' : opts.role === 'guest' ? '顧問先ゲスト' : '-'}）\n` +
    `  端末         : ${opts.device ?? '-'}（${opts.device === 'pc' ? 'PC' : opts.device === 'mobile' ? 'スマホ' : '-'}）\n` +
    `  ファイル名   : ${file.name}\n` +
    `  ファイル形式 : ${file.type || '-'}\n` +
    `  ファイルサイズ : ${Math.round(file.size / 1024)}KB (${file.size.toLocaleString()}バイト)\n` +
    `▼ AIレスポンス\n` +
    `  OK/NG        : ${result.ok ? '✅ OK' : '❌ NG'} ${result.errorReason ? `(理由: ${result.errorReason})` : ''}\n` +
    `  証票種別     : ${m?.source_type ?? '-'}\n` +
    `  種別信頼度   : ${m?.source_type_confidence != null ? `${(m.source_type_confidence * 100).toFixed(0)}%` : '-'}\n` +
    `  仕訳方向     : ${m?.direction ?? '-'}（${DIRECTION_LABELS[m?.direction ?? ''] ?? '-'}）\n` +
    `  方向信頼度   : ${m?.direction_confidence != null ? `${(m.direction_confidence * 100).toFixed(0)}%` : '-'}\n` +
    `  処理モード   : ${m?.processing_mode ?? '-'}（${MODE_LABELS[m?.processing_mode ?? ''] ?? '-'}）\n` +
    `  日付         : ${result.date ?? 'null'}\n` +
    `  金額         : ${result.amount != null ? `¥${result.amount.toLocaleString()}` : 'null'}\n` +
    `  取引先       : ${result.vendor ?? 'null'}\n` +
    `  摘要         : ${m?.description ?? 'null'}\n` +
    `  fallback     : ${fallbackLabel}\n` +
    `▼ メトリクス\n` +
    `  処理時間     : ${m?.duration_seconds ?? '-'}秒 (${m?.duration_ms ?? '-'}ms)\n` +
    `  入力トークン : ${m?.prompt_tokens ?? '-'}\n` +
    `  出力トークン : ${m?.completion_tokens ?? '-'}\n` +
    `  思考トークン : ${m?.thinking_tokens ?? '-'}\n` +
    `  トークン合計 : ${m?.token_count ?? '-'}\n` +
    `  コスト       : ¥${m?.cost_yen?.toFixed(4) ?? '-'}\n` +
    `  モデル       : ${m?.model ?? '-'}\n` +
    `▼ 前処理\n` +
    `  元サイズ     : ${m?.original_size_kb ?? '-'}KB\n` +
    `  圧縮後       : ${m?.processed_size_kb ?? '-'}KB\n` +
    `  削減率       : ${m?.preprocess_reduction_pct ?? '-'}%\n` +
    `════════════════════════════════════\n`
  )
}

// ===== エクスポート（環境変数でスイッチ） =====
const _analyzeRaw: (file: File, clientId?: string) => Promise<ReceiptAnalysisResult> =
  import.meta.env.VITE_USE_MOCK !== 'false'
    ? analyzeReceiptMock
    : analyzeReceiptReal

export const analyzeReceipt = async (file: File, opts?: AnalyzeOptions): Promise<ReceiptAnalysisResult> => {
  const result = await _analyzeRaw(file, opts?.clientId)
  // テスト用: ブラウザコンソールに全項目構造化出力
  logClassifyResult(file, opts ?? {}, result)
  return result
}

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
  /** テスト用メトリクス */
  metrics?: {
    duration_seconds: number
    token_count: number
    cost_yen: number
    source_type: string
    processing_mode: string
    description: string | null
    fallback_applied: boolean
    original_size_kb: number
    processed_size_kb: number
    preprocess_reduction_pct: number
  }
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
      duration_seconds: data.metadata?.duration_seconds ?? 0,
      token_count: data.metadata?.token_count ?? 0,
      cost_yen: data.metadata?.cost_yen ?? 0,
      source_type: data.source_type ?? 'unknown',
      processing_mode: data.processing_mode ?? 'unknown',
      description: data.description ?? null,
      fallback_applied: data.fallback_applied ?? false,
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

/** テスト用: classify結果をコンソールに構造化出力 */
function logClassifyResult(filename: string, result: ReceiptAnalysisResult) {
  const m = result.metrics
  const fallbackLabel = m?.fallback_applied
    ? 'あり（デフォルト値に置換）'
    : 'なし（AIが正常に処理）'

  console.log(
    `\n═══ classify結果 [${filename}] ═══\n` +
    `  OK/NG      : ${result.ok ? '✅ OK' : '❌ NG'} ${result.errorReason ? `(理由: ${result.errorReason})` : ''}\n` +
    `  種別       : ${m?.source_type ?? '-'}\n` +
    `  日付       : ${result.date ?? '-'}\n` +
    `  金額       : ${result.amount != null ? `¥${result.amount.toLocaleString()}` : '-'}\n` +
    `  取引先     : ${result.vendor ?? '-'}\n` +
    `  摘要       : ${m?.description ?? '-'}\n` +
    `  処理時間   : ${m?.duration_seconds ?? '-'}秒\n` +
    `  トークン   : ${m?.token_count ?? '-'}\n` +
    `  コスト     : ¥${m?.cost_yen?.toFixed(4) ?? '-'}\n` +
    `  前処理     : ${m?.original_size_kb ?? '-'}KB → ${m?.processed_size_kb ?? '-'}KB (${m?.preprocess_reduction_pct ?? '-'}%削減)\n` +
    `  fallback   : ${fallbackLabel}\n` +
    `════════════════════════════════════\n`
  )
}

// ===== エクスポート（環境変数でスイッチ） =====
const _analyzeRaw: (file: File, clientId?: string) => Promise<ReceiptAnalysisResult> =
  import.meta.env.VITE_USE_MOCK !== 'false'
    ? analyzeReceiptMock
    : analyzeReceiptReal

export const analyzeReceipt = async (file: File, clientId?: string): Promise<ReceiptAnalysisResult> => {
  const result = await _analyzeRaw(file, clientId)
  // テスト用: ブラウザコンソールに構造化出力
  logClassifyResult(file.name, result)
  return result
}

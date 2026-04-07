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
async function analyzeReceiptMock(_file: File): Promise<ReceiptAnalysisResult> {
  // 1.5〜2.5秒（Gemini推論のシミュレーション）
  const delay = 1500 + Math.random() * 1000
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

// ===== 本番実装（Supabase + Gemini） =====
// TODO: Phase 2 Group 1 で実装
async function analyzeReceiptReal(_file: File): Promise<ReceiptAnalysisResult> {
  throw new Error('本番実装未完成: Supabase Edge Functions への接続を実装してください')
}

// ===== エクスポート（環境変数でスイッチ） =====
export const analyzeReceipt: (file: File) => Promise<ReceiptAnalysisResult> =
  import.meta.env.VITE_USE_MOCK !== 'false'
    ? analyzeReceiptMock
    : analyzeReceiptReal

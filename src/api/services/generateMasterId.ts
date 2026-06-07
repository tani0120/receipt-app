/**
 * ローマ字ID生成関数
 *
 * MFインポートで未知の科目名が来たとき、Gemini 3.5-flashで
 * ローマ字IDを自動生成する。1回だけ生成してマスタに保存し、
 * 以降は保存済みIDを使用する（データ駆動）。
 *
 * 設計書: docs/genzai/50_romaji_id_migration.md §ローマ字変換エンジン
 */
import { GoogleGenAI } from '@google/genai'

const ROMAJI_PROMPT = `あなたは日本語会計用語のローマ字変換エンジンです。

## 入力
勘定科目名（日本語）が1つ与えられます。

## 出力
JSONオブジェクトで返してください：
{"reading": "ふりがな（ひらがな）", "romaji": "ROMAJI"}

## 変換ルール（厳守）

1. ヘボン式ローマ字を使用する
   - し→SHI, ち→CHI, つ→TSU, ふ→FU, じ→JI
   - しゃ→SHA, しゅ→SHU, しょ→SHO
   - ちゃ→CHA, ちゅ→CHU, ちょ→CHO

2. 長音は省略しない（そのまま綴る）
   - おう→OU, うう→UU, おお→OO
   - 例：交通→KOUTSUU, 証券→SHOUKEN, 普通→FUTSUU

3. 単語区切りなし（全て一続きにする）
   - 例：旅費交通費→RYOHIKOUTSUUHI（アンダースコアなし）

4. 全て大文字

5. 撥音「ん」は常にN（B/M/Pの前でもNのまま）
   - 例：新聞→SHINBUN

6. 促音「っ」は子音を重ねる
   - 例：雑費→ZAPPI, 別途→BETTO

7. 「・」「（）」「(不動産)」等の記号・括弧内テキストは無視する（IDに含めない）
   - 例：保証金・敷金→HOSHOUKINSHIKIKIN

## 会計用語の読み注意
- 売掛金→うりかけきん, 買掛金→かいかけきん
- 貸倒→かしだおれ, 棚卸→たなおろし
- 繰延→くりのべ, 減価償却→げんかしょうきゃく
- 租税公課→そぜいこうか, 仕掛品→しかかりひん
- 福利厚生費→ふくりこうせいひ, 荷造運賃→にづくりうんちん

## 入力データ
`

interface RomajiResponse {
  reading: string
  romaji: string
}

/**
 * 科目名からローマ字部分を生成する（サフィックスなし）
 * Gemini 3.5-flashでローマ字変換→後処理（正規化）
 */
async function toRomaji(name: string): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    throw new Error('[generateMasterId] GEMINI_API_KEY が未設定。.env.local を確認してください')
  }

  const ai = new GoogleGenAI({ apiKey })
  const result = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: ROMAJI_PROMPT + name,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const text = result.text ?? ''
  try {
    const parsed: RomajiResponse = JSON.parse(text)
    return parsed.romaji
  } catch {
    throw new Error(`[generateMasterId] Gemini応答のJSONパースエラー（科目名: ${name}）: ${text.slice(0, 200)}`)
  }
}

/**
 * 後処理（正規化）
 * 50_romaji_id_migration.md §後処理（正規化）に準拠
 */
function normalizeRomaji(raw: string): string {
  return raw
    .toUpperCase()                // 1. 大文字統一
    .replace(/[^A-Z0-9]/g, '')   // 2. 記号除去（英数字以外を全削除）
}

/**
 * ローマ字IDを生成する（サフィックス付き、重複チェック付き）
 *
 * @param name - 科目名（日本語）
 * @param suffix - サフィックス（'CORP', 'IND', 'FUDOUSAN_IND'等）
 * @param existingIds - 既存IDのセット（重複チェック用）
 * @returns ローマ字ID（例: 'RYOHIKOUTSUUHI_CORP'）
 */
export async function generateMasterId(
  name: string,
  suffix: string,
  existingIds: Set<string>
): Promise<string> {
  const rawRomaji = await toRomaji(name)
  const normalized = normalizeRomaji(rawRomaji)
  const baseId = `${normalized}_${suffix}`

  // 重複チェック: 衝突時は連番サフィックスを付与
  if (!existingIds.has(baseId)) {
    return baseId
  }

  let counter = 2
  while (existingIds.has(`${baseId}_${counter}`)) {
    counter++
  }
  const finalId = `${baseId}_${counter}`
  console.warn(`[generateMasterId] ID衝突回避: ${baseId} → ${finalId}`)
  return finalId
}

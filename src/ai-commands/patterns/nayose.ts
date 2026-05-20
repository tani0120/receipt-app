/**
 * AI名寄せモジュール — 取引先名の同一グルーピング
 *
 * 半角カナ⇔全角、略称⇔正式名称、振込名義⇔会社名を
 * gemini-2.5-flashで判定し、同一取引先をマージする。
 */

import { GoogleGenAI } from '@google/genai'

/** 名寄せ結果: 別名→正式名称のマッピング */
export interface NayoseResult {
  aliasMap: Map<string, string>
  mergedCount: number
}

/**
 * 取引先名一覧をAIでグルーピングし、別名→正式名称のマッピングを返す
 * @param names 取引先名の配列（重複なし）
 * @returns aliasMap（別名→正式名称）と統合件数
 */
export async function nayoseByAI(names: string[]): Promise<NayoseResult> {
  // 2件以下なら名寄せ不要
  if (names.length <= 2) return { aliasMap: new Map(), mergedCount: 0 }

  const apiKey = process.env['GEMINI_API_KEY'] ?? ''
  if (!apiKey) {
    console.log('  ⚠️ GEMINI_API_KEY未設定のため名寄せスキップ')
    return { aliasMap: new Map(), mergedCount: 0 }
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = `以下は会計仕訳の取引先名・摘要の一覧です。
同一の取引先と推定されるものをグルーピングしてください。
半角カナと全角、略称と正式名称、振込名義と会社名などを考慮してください。

取引先名一覧:
${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}

出力形式（JSON配列のみ。説明不要）:
[["正式名称", "別名1", "別名2", ...], ["正式名称B", "別名B1"]]
グルーピング不要な取引先は1要素の配列で返してください。`

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  })
  const text = resp.text ?? ''

  // JSONパース
  const jsonMatch = text.match(/\[\s*\[.*\]\s*\]/s)
  if (!jsonMatch) {
    console.log('  ⚠️ AI名寄せのレスポンスをパースできません。名寄せスキップ')
    return { aliasMap: new Map(), mergedCount: 0 }
  }

  let groups: string[][]
  try {
    groups = JSON.parse(jsonMatch[0])
  } catch {
    console.log('  ⚠️ AI名寄せJSONパースエラー。名寄せスキップ')
    return { aliasMap: new Map(), mergedCount: 0 }
  }

  // 別名→正式名称のマッピングを構築
  const aliasMap = new Map<string, string>()
  for (const group of groups) {
    if (group.length < 2) continue
    const canonical = group[0]!
    for (let i = 1; i < group.length; i++) {
      aliasMap.set(group[i]!, canonical)
    }
  }

  if (aliasMap.size > 0) {
    console.log(`  🤖 AI名寄せ: ${aliasMap.size}件の別名を統合`)
    for (const [alias, canonical] of aliasMap) {
      console.log(`     ${alias} → ${canonical}`)
    }
  }

  return { aliasMap, mergedCount: aliasMap.size }
}

/** Map<string, number>の名寄せマージ */
export function mergeMapByAlias(original: Map<string, number>, aliasMap: Map<string, string>): Map<string, number> {
  if (aliasMap.size === 0) return original
  const merged = new Map<string, number>()
  for (const [name, amount] of original) {
    const canonical = aliasMap.get(name) ?? name
    merged.set(canonical, (merged.get(canonical) ?? 0) + amount)
  }
  return merged
}

/** Map<string, {count, total}>の名寄せマージ */
export function mergeCountMapByAlias(
  original: Map<string, { count: number; total: number }>,
  aliasMap: Map<string, string>
): Map<string, { count: number; total: number }> {
  if (aliasMap.size === 0) return original
  const merged = new Map<string, { count: number; total: number }>()
  for (const [name, data] of original) {
    const canonical = aliasMap.get(name) ?? name
    const existing = merged.get(canonical) ?? { count: 0, total: 0 }
    existing.count += data.count
    existing.total += data.total
    merged.set(canonical, existing)
  }
  return merged
}

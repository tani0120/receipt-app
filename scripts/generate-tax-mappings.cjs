/**
 * 税区分変換テーブル自動生成スクリプト
 * マスタ（tax-category-master.json）からMF列を生成し、
 * taxCategoryMappings.ts を出力する。
 */
const fs = require('fs')
const path = require('path')

const master = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'tax-category-master.json'), 'utf8'))

const lines = [
  `/**`,
  ` * 税区分変換テーブル（会計ソフト別）`,
  ` *`,
  ` * マスタID → 各会計ソフトの税区分名マッピング。`,
  ` * CSVエクスポート・仕訳画面表示・AIプロンプト生成で使用。`,
  ` *`,
  ` * MF列: tax-category-master.json から自動生成`,
  ` * 弥生/Freee列: 実機データ取得後に埋める（現在null）`,
  ` *`,
  ` * 生成日: ${new Date().toISOString().slice(0, 10)}`,
  ` */`,
  ``,
  `/** 会計ソフト識別子 */`,
  `export type AccountingSoftwareKey = 'mf' | 'yayoi' | 'freee'`,
  ``,
  `/** 税区分名マッピングエントリ */`,
  `export interface TaxCategoryNameEntry {`,
  `  mf: { name: string; shortName: string }`,
  `  yayoi: { name: string } | null`,
  `  freee: { name: string } | null`,
  `}`,
  ``,
  `/** マスタID → 各会計ソフトの税区分名 */`,
  `export const TAX_CATEGORY_NAMES: Record<string, TaxCategoryNameEntry> = {`,
]

for (const item of master) {
  const id = item.id
  const name = (item.name || '').replace(/'/g, "\\'")
  const shortName = (item.shortName || '').replace(/'/g, "\\'")
  lines.push(`  '${id}': {`)
  lines.push(`    mf: { name: '${name}', shortName: '${shortName}' },`)
  lines.push(`    yayoi: null,`)
  lines.push(`    freee: null,`)
  lines.push(`  },`)
}

lines.push(`}`)
lines.push(``)
lines.push(`/**`)
lines.push(` * マスタIDから指定会計ソフトの税区分名を取得する。`)
lines.push(` * マッピングが見つからない場合はfallbackNameを返す。`)
lines.push(` */`)
lines.push(`export function resolveTaxNameForSoftware(`)
lines.push(`  masterId: string,`)
lines.push(`  software: AccountingSoftwareKey,`)
lines.push(`  fallbackName: string,`)
lines.push(`): string {`)
lines.push(`  const entry = TAX_CATEGORY_NAMES[masterId]`)
lines.push(`  if (!entry) return fallbackName`)
lines.push(`  const mapping = entry[software]`)
lines.push(`  if (!mapping) return entry.mf.name // 未対応ソフトはMF名にフォールバック`)
lines.push(`  return mapping.name`)
lines.push(`}`)
lines.push(``)

const outputPath = path.join(__dirname, '..', 'src', 'shared', 'mappings', 'taxCategoryMappings.ts')
const outputDir = path.dirname(outputPath)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8')

console.log(`生成完了: ${outputPath}`)
console.log(`エントリ数: ${master.length}件`)

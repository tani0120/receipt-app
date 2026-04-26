const fs = require('fs')

// 1. typeDefinitionsData.tsから全フィールド名を取得
const data = fs.readFileSync('src/mocks/components/typeDefinitionsData.ts', 'utf8')
const defFields = new Set()
for (const line of data.split('\n')) {
  const m = line.match(/field: '([^']*)'/)
  if (m) defFields.add(m[1])
}

// 2. DocEntry型のプロパティ取得
const types = fs.readFileSync('src/repositories/types.ts', 'utf8')
const docEntryProps = new Set()
// DocEntry interfaceの範囲を抽出
const docMatch = types.match(/export interface DocEntry \{([\s\S]*?)\n\}/)
if (docMatch) {
  for (const line of docMatch[1].split('\n')) {
    const pm = line.match(/^\s+(\w+)[\?:]/)
    if (pm) docEntryProps.add(pm[1])
  }
}

// 3. JournalPhase5Mock型のプロパティ取得
const journal = fs.readFileSync('src/mocks/types/journal_phase5_mock.type.ts', 'utf8')
const journalProps = new Set()
const journalMatch = journal.match(/export interface JournalPhase5Mock \{([\s\S]*?)\n\}/)
if (journalMatch) {
  for (const line of journalMatch[1].split('\n')) {
    const pm = line.match(/^\s+(\w+)[\?:]/)
    if (pm) journalProps.add(pm[1])
  }
}

// 4. UploadEntry型のプロパティ取得
const upload = fs.readFileSync('src/mocks/composables/useUpload.ts', 'utf8')
const uploadProps = new Set()
const uploadMatch = upload.match(/export interface UploadEntry \{([\s\S]*?)\n\}/)
if (uploadMatch) {
  for (const line of uploadMatch[1].split('\n')) {
    const pm = line.match(/^\s+(\w+)[\?:]/)
    if (pm) uploadProps.add(pm[1])
  }
}

// 5. 差分レポート
console.log('=== DocEntry型のプロパティ (' + docEntryProps.size + '件) ===')
console.log([...docEntryProps].join(', '))

console.log('\n=== JournalPhase5Mock型のプロパティ (' + journalProps.size + '件) ===')
console.log([...journalProps].join(', '))

console.log('\n=== UploadEntry型のプロパティ (' + uploadProps.size + '件) ===')
console.log([...uploadProps].join(', '))

console.log('\n=== typeDefinitionsData.tsのフィールド (' + defFields.size + '件) ===')
console.log([...defFields].join(', '))

// フィールド名の正規化マッピング（定義データの表記→型のプロパティ名）
const FIELD_MAP = {
  'fileHash': 'fileHash',
  'receivedAt': 'receivedAt',
  'thumbnailUrl': 'thumbnailUrl',
  'previewUrl': 'previewUrl',
  'driveFileId': 'driveFileId',
  // AI分類結果（typeDefではshort name, DocEntryではai接頭辞）
  'date': 'aiDate',
  'amount': 'aiAmount',
  'vendor': 'aiVendor',
  'source_type': 'aiSourceType',
  'direction': 'aiDirection',
  'description': 'aiDescription',
  'classify_reason': 'aiClassifyReason',
  'supplementary': 'aiSupplementary',
  'document_count': 'aiDocumentCount',
  'warning': 'aiWarning',
  'processing_mode': 'aiProcessingMode',
  'fallback': 'aiFallbackApplied',
  'lineItems[]': 'aiLineItems',
  'lineItemsCount': 'aiLineItemsCount',
  // メトリクス（aiMetricsの子プロパティ）
  'duration_ms': '_aiMetrics.duration_ms',
  'tokens(3種)': '_aiMetrics.prompt_tokens',
  'cost_yen': '_aiMetrics.cost_yen',
  'model': '_aiMetrics.model',
  'size_kb(2種)': '_aiMetrics.original_size_kb',
  'reduction_pct': '_aiMetrics.preprocess_reduction_pct',
  // メトリクスの子なのでDocEntry直下にはない
  'confidence': '_aiMetrics.source_type_confidence',
  'isDuplicate': '_local',  // UploadEntryのみ。DocEntryにはなし
}

// DocEntryに存在しないフィールド
console.log('\n=== DocEntry型に存在しないtypeDefフィールド ===')
for (const f of defFields) {
  if (docEntryProps.has(f)) continue
  if (journalProps.has(f)) continue
  const mapped = FIELD_MAP[f]
  if (mapped) continue
  console.log('  ❌ ' + f)
}

// DocEntry/JournalPhase5Mockに存在するがtypeDefにないプロパティ
console.log('\n=== DocEntry型にあるがtypeDefにないプロパティ ===')
for (const p of docEntryProps) {
  let found = false
  for (const f of defFields) {
    if (f === p) { found = true; break }
    const mapped = FIELD_MAP[f]
    if (mapped === p || mapped === 'ai' + p.charAt(0).toUpperCase() + p.slice(1)) { found = true; break }
  }
  if (!found) console.log('  ❌ ' + p)
}

console.log('\n=== JournalPhase5Mock型にあるがtypeDefにないプロパティ ===')
for (const p of journalProps) {
  let found = false
  for (const f of defFields) {
    if (f === p) { found = true; break }
    if (f === 'journal.id' && p === 'id') { found = true; break }
    if (f.startsWith('debit.') && p === 'debit_entries') { found = true; break }
    if (f.startsWith('credit.') && p === 'credit_entries') { found = true; break }
  }
  if (!found) console.log('  ❌ ' + p)
}

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// typeDefinitionsData.tsの全フィールド名を取得
const data = fs.readFileSync('src/mocks/components/typeDefinitionsData.ts', 'utf8')
const defFields = []
for (const line of data.split('\n')) {
  const m = line.match(/field: '([^']*)'/)
  if (m) defFields.push(m[1])
}

// DocEntry + JournalPhase5Mockの主要プロパティ（Vueで参照される可能性があるもの）
const searchProps = [
  // DocEntry
  'aiDate', 'aiAmount', 'aiVendor', 'aiSourceType', 'aiDirection',
  'aiDescription', 'aiClassifyReason', 'aiLineItems', 'aiLineItemsCount',
  'aiSupplementary', 'aiDocumentCount', 'aiWarning', 'aiProcessingMode',
  'aiFallbackApplied', 'aiMetrics', 'isDuplicate', 'fileHash',
  'driveFileId', 'thumbnailUrl', 'previewUrl', 'statusChangedBy',
  'statusChangedAt', 'batchId', 'journalId',
  // JournalPhase5Mock
  'voucher_date', 'date_on_document', 'voucher_type', 'source_type',
  'vendor_vector', 'document_id', 'line_id', 'debit_entries', 'credit_entries',
  'is_read', 'read_by', 'read_at', 'deleted_at', 'deleted_by',
  'warning_dismissals', 'warning_details', 'export_batch_id',
  'is_credit_card_payment', 'rule_id', 'rule_confidence',
  'invoice_status', 'invoice_number', 'staff_notes', 'staff_notes_author',
  'exported_at', 'exported_by', 'created_at', 'updated_at',
  'created_by', 'updated_by', 'ai_completed_at', 'prediction_method',
  'prediction_score', 'model_version',
  // LineItem
  'determined_account', 'tax_category', 'vendor_name', 'candidates',
  'history_match_hit', 'non_vendor_type', 'tax_type', 'counterpart_account',
]

// 全Vueファイルを検索
const vueFiles = execSync('git ls-files -- *.vue', { encoding: 'utf8' })
  .trim().split('\n')

const results = {}
for (const prop of searchProps) {
  results[prop] = []
}

for (const vf of vueFiles) {
  try {
    const content = fs.readFileSync(vf, 'utf8')
    for (const prop of searchProps) {
      // プロパティ名で検索（.prop, ['prop'], prop:, prop= 等）
      const patterns = [
        new RegExp('\\.' + prop + '\\b'),
        new RegExp("\\['" + prop + "'\\]"),
        new RegExp('\\b' + prop + '\\s*[=:]'),
        new RegExp('\\b' + prop + '\\b'),
      ]
      for (const p of patterns) {
        if (p.test(content)) {
          if (!results[prop].includes(vf)) {
            results[prop].push(vf)
          }
          break
        }
      }
    }
  } catch (e) { /* ファイル読み取りエラー無視 */ }
}

// レポート
console.log('=== Vueファイルでのプロパティ参照一覧 ===\n')
let referenced = 0
let notReferenced = 0
for (const prop of searchProps) {
  if (results[prop].length > 0) {
    referenced++
    console.log(`✅ ${prop}: ${results[prop].length}件`)
    for (const f of results[prop]) {
      console.log(`   ${f}`)
    }
  } else {
    notReferenced++
    console.log(`❌ ${prop}: 参照なし`)
  }
}
console.log(`\n参照あり: ${referenced}, 参照なし: ${notReferenced}`)

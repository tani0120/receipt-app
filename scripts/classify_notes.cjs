const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// Classify AIの出力フィールド → noteに「Classify AI」を追記
const classifyFields = {
  'date': 'Classify AI → result.date',
  'amount': 'Classify AI → result.amount (total_amount)',
  'vendor': 'Classify AI → result.issuer_name',
  'source_type': 'Classify AI → result.source_type',
  'direction': 'Classify AI → result.direction',
  'description': 'Classify AI → result.description',
  'classify_reason': 'Classify AI → result.classify_reason',
  'supplementary': 'Classify AI → validation.supplementary',
  'confidence': 'Classify AI → result.source_type_confidence',
  'processing_mode': 'Classify AI → result.processing_mode',
  'fallback': 'Classify AI → result.fallback_applied',
  'warning': 'Classify AI → validation.warning',
  'isDuplicate': 'Classify AI → validation.isDuplicate + TS照合',
  'document_count': 'Classify AI → result.document_count',
  'lineItems[]': 'Classify AI → result.line_items[]',
  'lineItemsCount': 'Classify AI → result.line_items.length',
  'duration_ms': 'Classify AI → metadata.duration_ms',
  'tokens(3種)': 'Classify AI → metadata.prompt/completion/thinking_tokens',
  'cost_yen': 'Classify AI → metadata.cost_yen',
  'model': 'Classify AI → metadata.model (gemini-2.5-flash)',
  'size_kb(2種)': 'Classify AI → metadata.original/processed_size_kb',
  'reduction_pct': 'Classify AI → metadata.preprocess_reduction_pct',
};

let count = 0;
const lines = s.split('\n');
let secIdx = 0;
const newLines = lines.map(line => {
  const titleMatch = line.match(/title: '([A-O])\./);
  if (titleMatch) secIdx = titleMatch[1].charCodeAt(0) - 65;

  const fieldMatch = line.match(/field: '([^']*)'/);
  if (!fieldMatch) return line;
  const field = fieldMatch[1];

  // セクションB(1),C(2),D(3)のみ対象。セクションI(8)以降の重複は除外
  if (secIdx > 3) return line;

  const newNote = classifyFields[field];
  if (!newNote) return line;

  // note: '...' を置換
  const noteRe = /note: ('[^']*'|"[^"]*")/;
  if (!noteRe.test(line)) return line;

  count++;
  return line.replace(noteRe, `note: '${newNote}'`);
});

s = newLines.join('\n');
fs.writeFileSync(file, s, 'utf8');
console.log('note更新: ' + count + '/22');

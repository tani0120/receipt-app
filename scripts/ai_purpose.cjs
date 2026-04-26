const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// 1. dataSource: '', note: '' → noteClassify: '', noteExtract: '' に一括置換
s = s.replace(/dataSource: '[^']*', note: '[^']*'/g, "noteClassify: '', noteExtract: ''");
let count = (s.match(/noteClassify:/g) || []).length;
console.log('プロパティ名変換: ' + count);

// 2. フィールド別のnoteClassify/noteExtract設定
const MAP = {
  // === セクションB: 証票分類AIの出力 ===
  'date':          ['日付抽出', ''],
  'amount':        ['金額抽出', ''],
  'vendor':        ['取引先名抽出', 'vendor_vector推定の入力'],
  'source_type':   ['証票種別判定', 'プロンプト分岐に使用'],
  'direction':     ['仕訳方向判定', 'debit/credit配置に使用'],
  'description':   ['摘要抽出', 'description転記'],
  'classify_reason':['判定根拠説明', ''],
  'supplementary': ['補助資料判定', ''],
  'confidence':    ['種別信頼度', ''],
  'processing_mode':['処理モード判定', ''],
  'fallback':      ['フォールバック判定', ''],
  'warning':       ['警告判定', ''],
  'isDuplicate':   ['重複検出', ''],
  'document_count':['証票枚数判定', ''],

  // === セクションC: 行データ ===
  'lineItems[]':   ['行データ抽出', 'LineItem[]→Journal変換の入力'],
  'lineItemsCount':['行数カウント', ''],

  // === セクションD: メトリクス ===
  'duration_ms':   ['処理時間計測', ''],
  'tokens(3種)':   ['トークン計測', ''],
  'cost_yen':      ['コスト計算', ''],
  'model':         ['モデル名記録', ''],
  'size_kb(2種)':  ['前処理サイズ記録', ''],
  'reduction_pct': ['削減率記録', ''],

  // === セクションJ: 科目確定（仕訳確定AIの出力） ===
  'vendor_vector': ['', '業種ベクトル推定'],
  'debit.account': ['', '借方科目推定'],
  'debit.sub_account':['', '借方補助科目推定'],
  'debit.tax_category_id':['', '借方税区分推定'],
  'debit.amount':  ['', '借方金額設定'],
  'credit.account':['', '貸方科目推定'],
  'credit.sub_account':['', '貸方補助科目推定'],
  'credit.tax_category_id':['', '貸方税区分推定'],
  'credit.amount': ['', '貸方金額設定'],

  // === セクションL ===
  'rule_id':       ['', 'ルールマッチ結果'],
  'rule_confidence':['', 'ルール信頼度'],

  // === セクションO ===
  'prediction_method':['', '推定手法記録'],
  'prediction_score':['', '推定信頼度記録'],
  'model_version': ['', 'モデルVer記録'],
};

let secIdx = 0;
const lines = s.split('\n');
let updated = 0;
const newLines = lines.map(line => {
  const titleMatch = line.match(/title: '([A-O])\./);
  if (titleMatch) secIdx = titleMatch[1].charCodeAt(0) - 65;

  const fieldMatch = line.match(/field: '([^']*)'/);
  if (!fieldMatch) return line;
  const field = fieldMatch[1];

  // セクションBの重複フィールド（I以降は対象外）
  if (['source_type','direction','description'].includes(field) && secIdx >= 8) return line;

  const vals = MAP[field];
  if (!vals) return line;

  updated++;
  return line
    .replace(/noteClassify: '[^']*'/, `noteClassify: '${vals[0]}'`)
    .replace(/noteExtract: '[^']*'/, `noteExtract: '${vals[1]}'`);
});

s = newLines.join('\n');
fs.writeFileSync(file, s, 'utf8');
console.log('目的設定: ' + updated);

const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// フィールド別の全列値マッピング（TSコード根拠）
// D=—, O=✅, I=→, U=✏️, W=🔧, X=⛔
const D='—',O='✅',I='→',U='✏️',W='🔧',X='⛔';
const def = [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D]; // 25列

// [uploadOwnAi,uploadOwnTs,uploadOwnHuman, uploadDriveAi,uploadDriveTs,uploadDriveHuman, selectOwnAi,selectOwnTs,selectOwnHuman, selectDriveAi,selectDriveTs,selectDriveHuman, convertAi,convertTs,convertHuman, accountAi,accountTs,accountHuman, journalAi,journalTs,journalHuman, outMf,outCost,outStaffCount,outStaffTime]
const MAP = {
  // === セクションA: ファイルメタ ===
  'id':            [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,I,D, D,D,D,D],
  'fileName':      [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'fileType':      [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'fileSize':      [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'fileHash':      [D,O,D, D,W,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'receivedAt':    [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'thumbnailUrl':  [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,I,D, D,D,D,D],
  'previewUrl':    [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,I,D, D,D,D,D],
  'driveFileId':   [D,X,D, D,O,D, D,X,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],

  // === セクションB: AI分類結果 ===
  'date':          [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'amount':        [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'vendor':        [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'classify_reason':[O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'supplementary': [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'confidence':    [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'processing_mode':[O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'fallback':      [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'warning':       [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'isDuplicate':   [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'document_count':[O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'source_type':   [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'direction':     [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'description':   [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],

  // === セクションC: 行データ ===
  'lineItems[]':   [O,D,D, X,D,D, D,I,D, D,D,D, D,I,D, D,D,D, D,D,D, D,D,D,D],
  'lineItemsCount':[O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],

  // === セクションD: メトリクス ===
  'duration_ms':   [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,I],
  'tokens(3種)':   [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'cost_yen':      [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,I,D,D],
  'model':         [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'size_kb(2種)':  [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'reduction_pct': [O,D,D, X,D,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],

  // === セクションE: DocEntry管理 ===
  'clientId':      [D,O,D, D,O,D, D,I,D, D,I,D, D,I,D, D,D,D, D,I,D, I,I,I,I],
  'source':        [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'createdBy':     [D,O,D, D,O,D, D,I,D, D,I,D, D,D,D, D,D,D, D,D,D, D,D,I,I],
  'updatedBy':     [D,D,D, D,D,D, D,U,U, D,U,U, D,D,D, D,D,D, D,I,D, D,D,D,D],
  'updatedAt':     [D,D,D, D,D,D, D,U,D, D,U,D, D,D,D, D,D,D, D,I,D, D,D,D,D],

  // === セクションF: ステータス ===
  'status':        [D,O,D, D,O,D, D,I,U, D,I,U, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'statusChangedBy':[D,D,D, D,D,D, D,U,D, D,U,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'statusChangedAt':[D,D,D, D,D,D, D,U,D, D,U,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'batchId':       [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, I,D,D,D],
  'journalId':     [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, I,D,D,D],

  // === セクションG: Drive移行 ===
  'job_id':        [D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'migration_status':[D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'retry_count':   [D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'last_error':    [D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'storage_path':  [D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'downloaded_at': [D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'storage_purged_at':[D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,D,D, D,D,D, D,D,D,D],

  // === セクションH: 関連エンティティ ===
  'Staff':         [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'Client':        [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'ShareStatus':   [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'Notification':  [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D,D],
  'ConfirmedJournal':[D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, W,D,D,D],

  // === セクションI: 仕訳基本情報（lineItemToJournalMock L344-375） ===
  'journal.id':    [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'client_id':     [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,I,I,I],
  'display_order': [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'voucher_date':  [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'date_on_document':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'voucher_type':  [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'document_id':   [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'line_id':       [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  // セクションIの重複フィールド（JournalPhase5Mock側）
  'source_type_j': [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'direction_j':   [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'description_j': [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],

  // === セクションJ: 科目確定（勘定科目） ===
  'vendor_vector': [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,D, D,I,D, D,D,D,D],
  'debit.account': [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,U, D,I,D, I,D,D,D],
  'debit.sub_account':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,U, D,I,D, I,D,D,D],
  'debit.tax_category_id':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,U, D,I,D, I,D,D,D],
  'debit.amount':  [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'debit.account_on_document':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'debit.amount_on_document':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'credit.account':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,U, D,I,D, I,D,D,D],
  'credit.sub_account':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,U, D,I,D, I,D,D,D],
  'credit.tax_category_id':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,U, D,I,D, I,D,D,D],
  'credit.amount': [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'credit.account_on_document':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'credit.amount_on_document':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],

  // === セクションK: 仕訳ステータス ===
  'journal.status':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,U, D,D,D,D],
  'is_read':       [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,U, D,D,D,D],
  'read_by':       [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'read_at':       [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'deleted_at':    [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'deleted_by':    [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],

  // === セクションL: ラベル・警告・ルール ===
  'labels':        [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'warning_dismissals':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,U, D,D,D,D],
  'warning_details':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,U,D, D,D,D,D],
  'export_batch_id':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, I,D,D,D],
  'is_credit_card_payment':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,U, D,D,D,D],
  'rule_id':       [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,D, D,I,D, D,D,D,D],
  'rule_confidence':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, W,D,D, D,I,D, D,D,D,D],

  // === セクションM: インボイス ===
  'invoice_status':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,W, D,D,D,D],
  'invoice_number':[D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,W, D,D,D,D],

  // === セクションN: メモ ===
  'memo':          [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'memo_author':   [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'memo_target':   [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'memo_created_at':[D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'staff_notes':   [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'staff_notes_author':[D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],

  // === セクションO: 監査・AI推定 ===
  'exported_at':   [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, U,D,D,D],
  'exported_by':   [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, U,D,D,D],
  'created_at':    [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'updated_at':    [D,D,D, D,D,D, D,D,D, D,D,D, D,O,D, D,D,D, D,I,D, D,D,D,D],
  'created_by':    [D,D,D, D,D,D, D,D,D, D,D,D, D,W,D, D,D,D, D,I,D, D,D,D,D],
  'updated_by':    [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,U,U, D,D,D,D],
  'ai_completed_at':[D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, D,W,D, D,D,D,D],
  'prediction_method':[D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, W,D,D, D,I,D, D,D,D,D],
  'prediction_score':[D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, W,D,D, D,I,D, D,D,D,D],
  'model_version': [D,D,D, D,D,D, D,D,D, D,D,D, D,D,D, W,D,D, D,I,D, D,D,D,D],
};

const COLS = ['uploadOwnAi','uploadOwnTs','uploadOwnHuman','uploadDriveAi','uploadDriveTs','uploadDriveHuman','selectOwnAi','selectOwnTs','selectOwnHuman','selectDriveAi','selectDriveTs','selectDriveHuman','convertAi','convertTs','convertHuman','accountAi','accountTs','accountHuman','journalAi','journalTs','journalHuman','outMf','outCost','outStaffCount','outStaffTime'];

// 重複フィールド（source_type/direction/descriptionがセクションBとIに存在）
// セクションI側のみ_j付きでMAP定義。実際のデータ行ではフィールド名は同じ。
// セクション番号で判別
let secIdx = 0;
const SEC_TITLES = ['A.','B.','C.','D.','E.','F.','G.','H.','I.','J.','K.','L.','M.','N.','O.'];

const lines = s.split('\n');
let count = 0;
const newLines = lines.map(line => {
  // セクション検出
  const titleMatch = line.match(/title: '([A-O])\./);
  if (titleMatch) secIdx = titleMatch[1].charCodeAt(0) - 65;

  const fieldMatch = line.match(/field: '([^']*)'/);
  if (!fieldMatch) return line;
  const field = fieldMatch[1];

  // MAPキー決定（重複フィールドはセクションで区別）
  let mapKey = field;
  if (['source_type','direction','description'].includes(field) && secIdx >= 8) {
    mapKey = field + '_j';
  }

  const vals = MAP[mapKey];
  if (!vals) { console.log('未定義: ' + field + ' (sec=' + secIdx + ')'); return line; }

  // 置換
  let newLine = line;
  COLS.forEach((col, i) => {
    const re = new RegExp(col + ": '[^']*'");
    newLine = newLine.replace(re, col + ": '" + vals[i] + "'");
  });
  count++;
  return newLine;
});

s = newLines.join('\n');
fs.writeFileSync(file, s, 'utf8');
console.log('変換: ' + count + '/108');

// 検証
const result = fs.readFileSync(file, 'utf8');
const arrows = (result.match(/: '→'/g) || []).length;
const edits = (result.match(/: '✏️'/g) || []).length;
console.log('→(継承): ' + arrows + ', ✏️(更新): ' + edits);

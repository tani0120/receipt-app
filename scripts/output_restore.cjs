/**
 * outputAi/outputTs/outputHuman → outMf/outCost/outStaffCount/outStaffTime 変換
 * 元の4列の値はgitから復元不可のため、TSコード根拠で再設定
 */
const fs = require('fs');
const file = require('path').join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// セクション定義
const SEC = {};
['id','fileName','fileType','fileSize','fileHash','receivedAt','thumbnailUrl','previewUrl','driveFileId'].forEach(f => SEC[f] = 'A');
['date','amount','vendor','classify_reason','supplementary','confidence','processing_mode','fallback','warning','isDuplicate','document_count'].forEach(f => SEC[f] = 'B');
['lineItems[]','lineItemsCount'].forEach(f => SEC[f] = 'C');
['duration_ms','tokens(3種)','cost_yen','model','size_kb(2種)','reduction_pct'].forEach(f => SEC[f] = 'D');
['clientId','source','createdBy','updatedBy','updatedAt'].forEach(f => SEC[f] = 'E');
['status','statusChangedBy','statusChangedAt','batchId','journalId'].forEach(f => SEC[f] = 'F');
['job_id','migration_status','retry_count','last_error','storage_path','downloaded_at','storage_purged_at'].forEach(f => SEC[f] = 'G');
['Staff','Client','ShareStatus','Notification','ConfirmedJournal'].forEach(f => SEC[f] = 'H');
// Journal段階
['journal.id','client_id','display_order','voucher_date','date_on_document','voucher_type','document_id','line_id'].forEach(f => SEC[f] = 'I');
['vendor_vector','debit.account','debit.sub_account','debit.tax_category_id','debit.amount','debit.account_on_document','debit.amount_on_document','credit.account','credit.sub_account','credit.tax_category_id','credit.amount','credit.account_on_document','credit.amount_on_document'].forEach(f => SEC[f] = 'J');
['journal.status','is_read','read_by','read_at','deleted_at','deleted_by'].forEach(f => SEC[f] = 'K');
['labels','warning_dismissals','warning_details','export_batch_id','is_credit_card_payment','rule_id','rule_confidence'].forEach(f => SEC[f] = 'L');
['invoice_status','invoice_number'].forEach(f => SEC[f] = 'M');
['memo','memo_author','memo_target','memo_created_at','staff_notes','staff_notes_author'].forEach(f => SEC[f] = 'N');
['exported_at','exported_by','created_at','updated_at','created_by','updated_by','ai_completed_at','prediction_method','prediction_score','model_version'].forEach(f => SEC[f] = 'O');

// MF出力対象フィールド（lineItemToJournalMock → CSV出力）
const mfFields = ['voucher_date','voucher_type','debit.account','debit.sub_account','debit.tax_category_id','debit.amount','credit.account','credit.sub_account','credit.tax_category_id','credit.amount','description','source_type','direction'];
// 費用集計対象
const costFields = ['voucher_date','debit.amount','credit.amount','debit.account','credit.account','client_id'];
// 担当別件数
const countFields = ['client_id','created_by','voucher_date'];
// 担当別時間
const timeFields = ['client_id','created_by','duration_ms','ai_completed_at'];

function getOut(field, sec) {
  const D = '\u2014';
  // DocEntry段階(A-H): 出力対象外
  if ('ABCDEFGH'.includes(sec)) {
    // 例外: duration_ms/cost_yen/clientId/createdByは集計出力あり
    if (field === 'duration_ms') return { outMf: D, outCost: D, outStaffCount: D, outStaffTime: '\u2705' };
    if (field === 'cost_yen') return { outMf: D, outCost: '\u2705', outStaffCount: D, outStaffTime: D };
    if (field === 'clientId') return { outMf: '\u2705', outCost: '\u2705', outStaffCount: '\u2705', outStaffTime: '\u2705' };
    if (field === 'createdBy') return { outMf: D, outCost: D, outStaffCount: '\u2705', outStaffTime: '\u2705' };
    return { outMf: D, outCost: D, outStaffCount: D, outStaffTime: D };
  }
  // Journal段階(I-O)
  const outMf = mfFields.includes(field) ? '\u2705' : D;
  const outCost = costFields.includes(field) ? '\u2705' : D;
  const outCount = countFields.includes(field) ? '\u2705' : D;
  const outTime = timeFields.includes(field) ? '\u2705' : D;
  // exported_at/exported_by: MF出力メタ
  if (field === 'exported_at' || field === 'exported_by') return { outMf: '\u2705', outCost: D, outStaffCount: D, outStaffTime: D };
  if (field === 'export_batch_id') return { outMf: '\u2705', outCost: D, outStaffCount: D, outStaffTime: D };
  return { outMf, outCost, outStaffCount: outCount, outStaffTime: outTime };
}

// 変換
const re = /outputAi: '([^']*)', outputTs: '([^']*)', outputHuman: '([^']*)'/g;
let count = 0;
// フィールド名を取得するために行単位で処理
const lines = s.split('\n');
const newLines = lines.map(line => {
  const fieldMatch = line.match(/field: '([^']*)'/);
  if (!fieldMatch) return line;
  const field = fieldMatch[1];
  if (!line.includes("outputAi: '")) return line;
  count++;
  const sec = SEC[field] || '?';
  const out = getOut(field, sec);
  return line.replace(
    /outputAi: '[^']*', outputTs: '[^']*', outputHuman: '[^']*'/,
    `outMf: '${out.outMf}', outCost: '${out.outCost}', outStaffCount: '${out.outStaffCount}', outStaffTime: '${out.outStaffTime}'`
  );
});
s = newLines.join('\n');
console.log('変換: ' + count);
fs.writeFileSync(file, s, 'utf8');

// 検証
const result = fs.readFileSync(file, 'utf8');
const old = (result.match(/outputAi:/g) || []).length;
const nw = (result.match(/outMf:/g) || []).length;
console.log('outputAi残存: ' + old + ', outMf: ' + nw);
if (old === 0 && nw === 109) console.log('\u2705 完了');
else console.log('\u274C 要確認');

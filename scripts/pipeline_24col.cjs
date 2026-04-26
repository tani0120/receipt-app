/**
 * 24列方式変換: 18列(uploadAi等) → 24列(uploadOwnAi/uploadDriveAi等)
 * TSコード根拠でセクション別に値を設定
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

// セクション定義（フィールド名→セクション）
const SEC = {};
['id','fileName','fileType','fileSize','fileHash','receivedAt','thumbnailUrl','previewUrl','driveFileId'].forEach(f => SEC[f] = 'A');
['date','amount','vendor','classify_reason','supplementary','confidence','processing_mode','fallback','warning','isDuplicate','document_count'].forEach(f => SEC[f] = 'B');
['lineItems[]','lineItemsCount'].forEach(f => SEC[f] = 'C');
['duration_ms','tokens(3種)','cost_yen','model','size_kb(2種)','reduction_pct'].forEach(f => SEC[f] = 'D');
['clientId','source','createdBy','updatedBy','updatedAt'].forEach(f => SEC[f] = 'E');
['status','statusChangedBy','statusChangedAt','batchId','journalId'].forEach(f => SEC[f] = 'F');
['job_id','migration_status','retry_count','last_error','storage_path','downloaded_at','storage_purged_at'].forEach(f => SEC[f] = 'G');
['Staff','Client','ShareStatus','Notification','ConfirmedJournal'].forEach(f => SEC[f] = 'H');
['journal.id','client_id','display_order','voucher_date','date_on_document','voucher_type','document_id','line_id'].forEach(f => SEC[f] = 'I');
['vendor_vector','debit.account','debit.sub_account','debit.tax_category_id','debit.amount','debit.account_on_document','debit.amount_on_document','credit.account','credit.sub_account','credit.tax_category_id','credit.amount','credit.account_on_document','credit.amount_on_document'].forEach(f => SEC[f] = 'J');
['journal.status','is_read','read_by','read_at','deleted_at','deleted_by'].forEach(f => SEC[f] = 'K');
['labels','warning_dismissals','warning_details','export_batch_id','is_credit_card_payment','rule_id','rule_confidence'].forEach(f => SEC[f] = 'L');
['invoice_status','invoice_number'].forEach(f => SEC[f] = 'M');
['memo','memo_author','memo_target','memo_created_at','staff_notes','staff_notes_author'].forEach(f => SEC[f] = 'N');
['exported_at','exported_by','created_at','updated_at','created_by','updated_by','ai_completed_at','prediction_method','prediction_score','model_version'].forEach(f => SEC[f] = 'O');

// 重複フィールド（description/source_type/direction）はuploadAi値で判別
// uploadAi=✅ → セクションB, uploadAi=— → セクションI

// TSコード根拠の値マッピング（独自/Drive分離）
// useUpload.ts: 独自経路、useDriveDocuments.ts: Drive経路
function getValues(field, sec, old) {
  const D = '\u2014'; // —
  const OK = '\u2705'; // ✅
  const NG = '\u26D4'; // ⛔
  const WR = '\uD83D\uDD27'; // 🔧

  const v = {
    uploadOwnAi: D, uploadOwnTs: D, uploadOwnHuman: D,
    uploadDriveAi: D, uploadDriveTs: D, uploadDriveHuman: D,
    selectOwnAi: D, selectOwnTs: D, selectOwnHuman: D,
    selectDriveAi: D, selectDriveTs: D, selectDriveHuman: D,
    convertAi: D, convertTs: D, convertHuman: D,
    accountAi: D, accountTs: D, accountHuman: D,
    journalAi: D, journalTs: D, journalHuman: D,
    outputAi: D, outputTs: D, outputHuman: D,
  };

  // ===== セクションA: ファイルメタデータ =====
  if (sec === 'A') {
    // useUpload.ts: File API / generateUUID() でTS自動取得
    if (field === 'driveFileId') {
      v.uploadOwnTs = NG; // 独自にDriveIDなし
      v.uploadDriveTs = OK; // f.id
      v.selectOwnTs = NG;
      v.selectDriveTs = OK;
    } else if (field === 'fileHash') {
      v.uploadOwnTs = OK; // サーバーSHA-256計算
      v.uploadDriveTs = WR; // migrationWorkerで後計算
      v.selectOwnTs = OK;
      v.selectDriveTs = OK;
    } else {
      v.uploadOwnTs = OK;
      v.uploadDriveTs = OK;
      v.selectOwnTs = OK;
      v.selectDriveTs = OK;
    }
    // 仕訳一覧で参照されるもの
    if (['id','thumbnailUrl','previewUrl'].includes(field)) {
      v.journalTs = OK;
    }
  }

  // ===== セクションB: AI分類結果 =====
  if (sec === 'B') {
    v.uploadOwnAi = OK; // classify API同期実行
    v.uploadDriveAi = NG; // Driveではclassify未実行
    v.selectOwnTs = OK; // 選別画面で表示
    v.selectDriveTs = OK;
    if (['date','amount','vendor','direction','description','warning','isDuplicate'].includes(field)) {
      v.journalTs = OK;
    }
  }

  // ===== セクションC: 行データ =====
  if (sec === 'C') {
    v.uploadOwnAi = OK;
    v.uploadDriveAi = NG;
    v.selectOwnTs = OK;
    v.selectDriveTs = OK;
    if (field === 'lineItems[]') v.journalTs = OK;
  }

  // ===== セクションD: メトリクス =====
  if (sec === 'D') {
    if (['duration_ms','tokens(3種)','cost_yen','model'].includes(field)) {
      v.uploadOwnAi = OK;
      v.uploadDriveAi = NG;
    }
    v.selectOwnTs = OK;
    v.selectDriveTs = OK;
    // 出力
    if (['duration_ms'].includes(field)) { v.outputTs = OK; }
    if (['tokens(3種)','cost_yen','model'].includes(field)) { v.outputTs = OK; }
  }

  // ===== セクションE: DocEntry管理 =====
  if (sec === 'E') {
    if (field === 'clientId') {
      v.uploadOwnTs = OK; v.uploadDriveTs = OK;
      v.selectOwnTs = OK; v.selectDriveTs = OK;
      v.journalTs = OK; v.outputTs = OK;
    }
    if (field === 'source') {
      v.selectOwnTs = OK; v.selectDriveTs = OK;
    }
    if (field === 'createdBy') {
      v.selectOwnTs = OK; v.selectDriveTs = OK;
      v.journalTs = OK; v.outputTs = OK;
    }
    if (field === 'updatedBy') {
      v.selectOwnTs = OK; v.selectDriveTs = OK;
      v.selectOwnHuman = OK; // 選別操作者
      v.selectDriveHuman = OK;
      v.journalTs = OK;
    }
    if (field === 'updatedAt') {
      v.selectOwnTs = OK; v.selectDriveTs = OK;
      v.journalTs = OK;
    }
  }

  // ===== セクションF: ステータス =====
  if (sec === 'F') {
    if (field === 'status') {
      v.uploadOwnTs = OK; v.uploadDriveTs = OK;
      v.selectOwnTs = OK; v.selectDriveTs = OK;
      v.journalTs = OK;
    }
    if (['statusChangedBy','statusChangedAt'].includes(field)) {
      v.selectOwnTs = OK; v.selectDriveTs = OK;
    }
    if (field === 'batchId') {
      v.journalTs = OK; v.outputTs = WR;
    }
    if (field === 'journalId') {
      v.journalTs = OK; v.outputTs = OK;
    }
  }

  // ===== セクションG: Drive移行 =====
  if (sec === 'G') {
    v.selectDriveTs = OK;
  }

  // ===== セクションH: 関連エンティティ =====
  if (sec === 'H') {
    if (field === 'ConfirmedJournal') v.outputTs = WR;
  }

  // ===== セクションI: 仕訳基本情報 =====
  if (sec === 'I') {
    // lineItemToJournalMock()でTS自動設定
    const tsAutoFields = ['journal.id','display_order','date_on_document','voucher_type','document_id','line_id'];
    if (tsAutoFields.includes(field)) v.convertTs = OK;
    // classify結果から転記
    if (['client_id','voucher_date','source_type','direction','description'].includes(field)) v.convertTs = OK;
    v.journalTs = OK;
    if (['voucher_date','description','direction'].includes(field)) v.outputTs = OK;
  }

  // ===== セクションJ: 科目確定 =====
  if (sec === 'J') {
    const aiFields = ['vendor_vector','debit.account','debit.sub_account','debit.tax_category_id','credit.account','credit.sub_account','credit.tax_category_id'];
    if (aiFields.includes(field)) {
      v.accountAi = WR; // 科目確定パイプライン未実装
      v.accountHuman = OK; // 人間が手動選択可能
    }
    if (['debit.account_on_document','debit.amount_on_document','credit.account_on_document','credit.amount_on_document'].includes(field)) {
      v.convertTs = OK;
    }
    if (['debit.amount','credit.amount'].includes(field)) {
      v.convertTs = OK;
    }
    v.journalTs = OK;
    if (['debit.account','debit.sub_account','debit.tax_category_id','debit.amount','credit.account','credit.sub_account','credit.tax_category_id','credit.amount'].includes(field)) {
      v.outputTs = OK;
    }
  }

  // ===== セクションK: ステータス =====
  if (sec === 'K') {
    if (['journal.status','is_read','read_by','read_at','deleted_at','deleted_by'].includes(field)) {
      v.journalHuman = OK;
      v.journalTs = OK;
    }
  }

  // ===== セクションL: ラベル・警告・ルール =====
  if (sec === 'L') {
    if (['labels','warning_details'].includes(field)) {
      v.convertTs = OK; v.journalTs = OK;
    }
    if (field === 'warning_dismissals') {
      v.journalTs = OK; v.journalHuman = OK;
    }
    if (field === 'export_batch_id') {
      v.convertTs = OK; v.journalTs = OK; v.outputTs = OK;
    }
    if (field === 'is_credit_card_payment') {
      v.uploadOwnAi = WR; v.journalTs = OK; v.journalHuman = OK;
    }
    if (['rule_id','rule_confidence'].includes(field)) {
      v.accountAi = WR; v.journalTs = OK;
    }
  }

  // ===== セクションM: インボイス =====
  if (sec === 'M') {
    v.uploadOwnAi = WR; // 将来AI判定
    v.journalTs = WR;
  }

  // ===== セクションN: メモ =====
  if (sec === 'N') {
    v.journalHuman = OK; v.journalTs = OK;
  }

  // ===== セクションO: 監査・AI推定 =====
  if (sec === 'O') {
    if (['exported_at','exported_by'].includes(field)) {
      v.outputHuman = OK; v.outputTs = OK;
    }
    if (['created_at','updated_at'].includes(field)) {
      v.convertTs = OK; v.journalTs = OK;
    }
    if (field === 'created_by') v.journalTs = WR;
    if (field === 'updated_by') { v.journalHuman = OK; v.journalTs = OK; }
    if (field === 'ai_completed_at') v.journalTs = WR;
    if (['prediction_method','prediction_score','model_version'].includes(field)) {
      v.accountAi = WR; v.journalTs = WR;
    }
  }

  return v;
}

// フィールド行の正規表現
const re = /\{ field: '([^']*)', label: '([^']*)', tsType: ([^,]+), uploadAi: '([^']*)', uploadTs: '([^']*)', uploadHuman: '([^']*)', selectAi: '([^']*)', selectTs: '([^']*)', selectHuman: '([^']*)', convertAi: '([^']*)', convertTs: '([^']*)', convertHuman: '([^']*)', accountAi: '([^']*)', accountTs: '([^']*)', accountHuman: '([^']*)', journalAi: '([^']*)', journalTs: '([^']*)', journalHuman: '([^']*)', outputAi: '([^']*)', outputTs: '([^']*)', outputHuman: '([^']*)', dataSource: '([^']*)', note: ('[^']*'|"[^"]*") \}/g;

let count = 0;
s = s.replace(re, (match, field, label, tsType, uAi, uTs, uH, sAi, sTs, sH, cAi, cTs, cH, aAi, aTs, aH, jAi, jTs, jH, oAi, oTs, oH, ds, note) => {
  count++;
  let sec = SEC[field];
  // 重複フィールド: uploadAi値で判別
  if (['description','source_type','direction'].includes(field) && !sec) {
    sec = (uAi !== '\u2014') ? 'B' : 'I';
  }
  if (!sec) {
    // descriptionはセクションBかI
    if (field === 'description') sec = (uAi !== '\u2014') ? 'B' : 'I';
    else if (field === 'source_type') sec = (uAi !== '\u2014') ? 'B' : 'I';
    else if (field === 'direction') sec = (uAi !== '\u2014') ? 'B' : 'I';
    else sec = '?';
  }
  const v = getValues(field, sec, { uAi, uTs, uH, sAi, sTs, sH, cAi, cTs, cH, aAi, aTs, aH, jAi, jTs, jH, oAi, oTs, oH });
  return `{ field: '${field}', label: '${label}', tsType: ${tsType}, uploadOwnAi: '${v.uploadOwnAi}', uploadOwnTs: '${v.uploadOwnTs}', uploadOwnHuman: '${v.uploadOwnHuman}', uploadDriveAi: '${v.uploadDriveAi}', uploadDriveTs: '${v.uploadDriveTs}', uploadDriveHuman: '${v.uploadDriveHuman}', selectOwnAi: '${v.selectOwnAi}', selectOwnTs: '${v.selectOwnTs}', selectOwnHuman: '${v.selectOwnHuman}', selectDriveAi: '${v.selectDriveAi}', selectDriveTs: '${v.selectDriveTs}', selectDriveHuman: '${v.selectDriveHuman}', convertAi: '${v.convertAi}', convertTs: '${v.convertTs}', convertHuman: '${v.convertHuman}', accountAi: '${v.accountAi}', accountTs: '${v.accountTs}', accountHuman: '${v.accountHuman}', journalAi: '${v.journalAi}', journalTs: '${v.journalTs}', journalHuman: '${v.journalHuman}', outputAi: '${v.outputAi}', outputTs: '${v.outputTs}', outputHuman: '${v.outputHuman}', dataSource: '${ds}', note: ${note} }`;
});

console.log('変換: ' + count);
fs.writeFileSync(file, s, 'utf8');

// 未変換行チェック
const result = fs.readFileSync(file, 'utf8');
const old18 = (result.match(/uploadAi:/g) || []).length;
const new24 = (result.match(/uploadOwnAi:/g) || []).length;
console.log('旧uploadAi残存: ' + old18 + ', 新uploadOwnAi: ' + new24);
if (old18 > 0) console.log('\u274C 未変換行あり');
else if (new24 === 109) console.log('\u2705 全108+1(型定義)=109 一致');
else console.log('\u274C uploadOwnAi=' + new24 + ' (109でない)');

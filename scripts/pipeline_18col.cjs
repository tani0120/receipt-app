/**
 * 18列方式変換スクリプト
 * 6フェーズ×3主体（AI/TS/人間）= 18列
 *
 * フェーズ:
 *   1. upload（アップロード）
 *   2. select（資料選別）
 *   3. convert（仕訳変換）
 *   4. account（科目確定）
 *   5. journal（仕訳一覧）
 *   6. output（出力）
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
const src = fs.readFileSync(file, 'utf8');

// ============================================================
// Step 1: TypeField インターフェース書き換え
// ============================================================
const oldInterface = `export interface TypeField {
  field: string; label: string; tsType: string
  uploadOwn: CellValue; uploadDrive: CellValue
  classifyAi: CellValue
  selectOwn: CellValue; selectDrive: CellValue
  toJournal: CellValue; accountPipeline: CellValue
  humanInput: CellValue; journalList: CellValue
  outMf: CellValue; outCost: CellValue; outStaffCount: CellValue; outStaffTime: CellValue
  dataSource: string
  note: string
}`;

const newInterface = `export interface TypeField {
  field: string; label: string; tsType: string
  // 1. アップロード
  uploadAi: CellValue; uploadTs: CellValue; uploadHuman: CellValue
  // 2. 資料選別
  selectAi: CellValue; selectTs: CellValue; selectHuman: CellValue
  // 3. 仕訳変換
  convertAi: CellValue; convertTs: CellValue; convertHuman: CellValue
  // 4. 科目確定
  accountAi: CellValue; accountTs: CellValue; accountHuman: CellValue
  // 5. 仕訳一覧
  journalAi: CellValue; journalTs: CellValue; journalHuman: CellValue
  // 6. 出力
  outputAi: CellValue; outputTs: CellValue; outputHuman: CellValue
  dataSource: string
  note: string
}`;

let s = src.replace(oldInterface, newInterface);
s = s.replace(
  '// パイプライン段階順: upload→classifyAi→select→toJournal→accountPipeline→humanInput→journalList→out*',
  '// 18列方式: 6フェーズ(upload/select/convert/account/journal/output) × 3主体(AI/TS/人間)'
);

// ============================================================
// Step 2: 各フィールド行を変換
// ============================================================

// フィールド行を解析する正規表現
const fieldRe = /\{ field: '([^']*)', label: '([^']*)', tsType: ([^,]+), uploadOwn: '([^']*)', uploadDrive: '([^']*)', classifyAi: '([^']*)', selectOwn: '([^']*)', selectDrive: '([^']*)', toJournal: '([^']*)', accountPipeline: '([^']*)', humanInput: '([^']*)', journalList: '([^']*)', outMf: '([^']*)', outCost: '([^']*)', outStaffCount: '([^']*)', outStaffTime: '([^']*)', dataSource: '([^']*)', note: ('[^']*'|"[^"]*") \}/g;

// セクション判定用（フィールド名でセクションを判定）
const sectionAFields = ['id', 'fileName', 'fileType', 'fileSize', 'fileHash', 'receivedAt', 'thumbnailUrl', 'previewUrl', 'driveFileId'];
const sectionBFields = ['date', 'amount', 'vendor', 'source_type', 'direction', 'description', 'classify_reason', 'supplementary', 'confidence', 'processing_mode', 'fallback', 'warning', 'isDuplicate', 'document_count'];
const sectionCFields = ['lineItems[]', 'lineItemsCount'];
const sectionDFields = ['duration_ms', 'tokens(3種)', 'cost_yen', 'model', 'size_kb(2種)', 'reduction_pct'];
const sectionEFields = ['clientId', 'source', 'createdBy', 'updatedBy', 'updatedAt'];
const sectionFFields = ['status', 'statusChangedBy', 'statusChangedAt', 'batchId', 'journalId'];
const sectionGFields = ['job_id', 'migration_status', 'retry_count', 'last_error', 'storage_path', 'downloaded_at', 'storage_purged_at'];
const sectionHFields = ['Staff', 'Client', 'ShareStatus', 'Notification', 'ConfirmedJournal'];

// セクションI〜Oのフィールド（仕訳フェーズ）
const sectionIFields = ['journal.id', 'client_id', 'display_order', 'voucher_date', 'date_on_document', 'voucher_type', 'document_id', 'line_id'];
// descriptionはセクションBとIで重複。セクションI内のdescriptionはuploadOwn='—'で区別
const sectionJFields = ['vendor_vector', 'debit.account', 'debit.sub_account', 'debit.tax_category_id', 'debit.amount', 'debit.account_on_document', 'debit.amount_on_document', 'credit.account', 'credit.sub_account', 'credit.tax_category_id', 'credit.amount', 'credit.account_on_document', 'credit.amount_on_document'];
const sectionKFields = ['journal.status', 'is_read', 'read_by', 'read_at', 'deleted_at', 'deleted_by'];
const sectionLFields = ['labels', 'warning_dismissals', 'warning_details', 'export_batch_id', 'is_credit_card_payment', 'rule_id', 'rule_confidence'];
const sectionMFields = ['invoice_status', 'invoice_number'];
const sectionNFields = ['memo', 'memo_author', 'memo_target', 'memo_created_at', 'staff_notes', 'staff_notes_author'];
const sectionOFields = ['exported_at', 'exported_by', 'created_at', 'updated_at', 'created_by', 'updated_by', 'ai_completed_at', 'prediction_method', 'prediction_score', 'model_version'];

function getSection(fieldName, uploadOwn) {
  if (sectionAFields.includes(fieldName)) return 'A';
  // description はuploadOwnで区別
  if (fieldName === 'description' && uploadOwn !== '\u2014') return 'B';
  if (fieldName === 'description' && uploadOwn === '\u2014') return 'I';
  // source_type, direction はuploadOwnで区別
  if (fieldName === 'source_type' && uploadOwn !== '\u2014') return 'B';
  if (fieldName === 'source_type' && uploadOwn === '\u2014') return 'I';
  if (fieldName === 'direction' && uploadOwn !== '\u2014') return 'B';
  if (fieldName === 'direction' && uploadOwn === '\u2014') return 'I';
  if (sectionBFields.includes(fieldName)) return 'B';
  if (sectionCFields.includes(fieldName)) return 'C';
  if (sectionDFields.includes(fieldName)) return 'D';
  if (sectionEFields.includes(fieldName)) return 'E';
  if (sectionFFields.includes(fieldName)) return 'F';
  if (sectionGFields.includes(fieldName)) return 'G';
  if (sectionHFields.includes(fieldName)) return 'H';
  if (sectionIFields.includes(fieldName)) return 'I';
  if (sectionJFields.includes(fieldName)) return 'J';
  if (sectionKFields.includes(fieldName)) return 'K';
  if (sectionLFields.includes(fieldName)) return 'L';
  if (sectionMFields.includes(fieldName)) return 'M';
  if (sectionNFields.includes(fieldName)) return 'N';
  if (sectionOFields.includes(fieldName)) return 'O';
  return '?';
}

let count = 0;
s = s.replace(fieldRe, (match, field, label, tsType, uploadOwn, uploadDrive, classifyAi, selectOwn, selectDrive, toJournal, accountPipeline, humanInput, journalList, outMf, outCost, outStaffCount, outStaffTime, dataSource, note) => {
  count++;
  const sec = getSection(field, uploadOwn);

  // デフォルト: 全て '—'
  const r = {
    uploadAi: '\u2014', uploadTs: '\u2014', uploadHuman: '\u2014',
    selectAi: '\u2014', selectTs: '\u2014', selectHuman: '\u2014',
    convertAi: '\u2014', convertTs: '\u2014', convertHuman: '\u2014',
    accountAi: '\u2014', accountTs: '\u2014', accountHuman: '\u2014',
    journalAi: '\u2014', journalTs: '\u2014', journalHuman: '\u2014',
    outputAi: '\u2014', outputTs: '\u2014', outputHuman: '\u2014',
  };

  // セクション別マッピング
  if ('ABCDEFGH'.includes(sec)) {
    // DocEntry段階のフィールド
    // uploadフェーズ
    if (classifyAi !== '\u2014') {
      // classify APIで取得されるフィールド → uploadAi
      r.uploadAi = classifyAi;
    }
    // File API / TS自動取得
    if (uploadOwn !== '\u2014' && classifyAi === '\u2014') {
      r.uploadTs = uploadOwn;
    }
    if (uploadDrive !== '\u2014' && classifyAi === '\u2014') {
      // DriveはuploadTsに含める（noteで経路区別）
      if (r.uploadTs === '\u2014') r.uploadTs = uploadDrive;
    }
    // classify結果でもTS取得でもないもの
    if (uploadOwn !== '\u2014' && classifyAi !== '\u2014') {
      // AI取得フィールドだがuploadOwnも✅ → uploadAiに統合済み
    }

    // selectフェーズ
    if (selectOwn !== '\u2014' || selectDrive !== '\u2014') {
      // 選別画面で表示される → selectTs（画面表示はTS）
      r.selectTs = selectOwn !== '\u2014' ? selectOwn : selectDrive;
    }
    // humanInput（DocEntry段階のhumanInput = 選別操作）
    if (humanInput === '\u2705') {
      r.selectHuman = '\u2705';
    }

    // journalフェーズ
    if (journalList !== '\u2014') {
      r.journalTs = journalList;
    }

    // outputフェーズ
    if (outMf !== '\u2014' || outCost !== '\u2014' || outStaffCount !== '\u2014' || outStaffTime !== '\u2014') {
      // 出力されるフィールド → outputTs
      const vals = [outMf, outCost, outStaffCount, outStaffTime].filter(v => v !== '\u2014');
      r.outputTs = vals.length > 0 ? vals[0] : '\u2014';
    }
  } else {
    // セクションI〜O: Journal段階のフィールド

    // convertフェーズ（仕訳変換）
    if (toJournal !== '\u2014') {
      r.convertTs = toJournal;
    }

    // accountフェーズ（科目確定）
    if (accountPipeline !== '\u2014') {
      r.accountAi = accountPipeline;
    }

    // humanInputの振り分け
    if (humanInput === '\u2705') {
      if ('JK'.includes(sec)) {
        // 科目確定 or ステータスの人間操作
        if (sec === 'J') {
          r.accountHuman = '\u2705';
        } else {
          r.journalHuman = '\u2705';
        }
      } else if (sec === 'L') {
        // ラベル関連
        if (field === 'warning_dismissals' || field === 'is_credit_card_payment') {
          r.journalHuman = '\u2705';
        }
      } else if (sec === 'N') {
        // メモ
        r.journalHuman = '\u2705';
      } else if (sec === 'O') {
        if (field === 'exported_at' || field === 'exported_by') {
          r.outputHuman = '\u2705';
        } else if (field === 'updated_by') {
          r.journalHuman = '\u2705';
        }
      }
    }

    // journalフェーズ
    if (journalList !== '\u2014') {
      r.journalTs = journalList;
    }

    // outputフェーズ
    if (outMf !== '\u2014' || outCost !== '\u2014' || outStaffCount !== '\u2014' || outStaffTime !== '\u2014') {
      const vals = [outMf, outCost, outStaffCount, outStaffTime].filter(v => v !== '\u2014');
      r.outputTs = vals.length > 0 ? vals[0] : '\u2014';
    }

    // AI関連フィールド
    if (classifyAi !== '\u2014' && classifyAi !== accountPipeline) {
      r.uploadAi = classifyAi;
    }

    // labels/warning_details: journalTs（syncWarningLabelsで自動設定）
    if (field === 'labels' || field === 'warning_details' || field === 'export_batch_id') {
      r.journalTs = journalList;
    }

    // created_at/updated_at: convertTs
    if (field === 'created_at' || field === 'updated_at') {
      r.convertTs = toJournal;
    }
  }

  // 出力先詳細をnoteに追加
  let outDetail = '';
  const outParts = [];
  if (outMf !== '\u2014') outParts.push('MF:' + outMf);
  if (outCost !== '\u2014') outParts.push('\u8CBB\u7528:' + outCost);
  if (outStaffCount !== '\u2014') outParts.push('\u4EF6\u6570:' + outStaffCount);
  if (outStaffTime !== '\u2014') outParts.push('\u6642\u9593:' + outStaffTime);
  if (outParts.length > 1) {
    outDetail = ' [' + outParts.join(' ') + ']';
  }

  // 独自/Drive経路詳細をnoteに追加
  let routeDetail = '';
  if (uploadOwn !== uploadDrive && uploadOwn !== '\u2014' && uploadDrive !== '\u2014') {
    routeDetail = ' [\u72EC\u81EA:' + uploadOwn + ' Drive:' + uploadDrive + ']';
  }
  if (selectOwn !== selectDrive && selectOwn !== '\u2014' && selectDrive !== '\u2014') {
    if (!routeDetail) routeDetail = ' [\u9078\u5225\u72EC\u81EA:' + selectOwn + ' Drive:' + selectDrive + ']';
  }

  const noteVal = note;

  return `{ field: '${field}', label: '${label}', tsType: ${tsType}, uploadAi: '${r.uploadAi}', uploadTs: '${r.uploadTs}', uploadHuman: '${r.uploadHuman}', selectAi: '${r.selectAi}', selectTs: '${r.selectTs}', selectHuman: '${r.selectHuman}', convertAi: '${r.convertAi}', convertTs: '${r.convertTs}', convertHuman: '${r.convertHuman}', accountAi: '${r.accountAi}', accountTs: '${r.accountTs}', accountHuman: '${r.accountHuman}', journalAi: '${r.journalAi}', journalTs: '${r.journalTs}', journalHuman: '${r.journalHuman}', outputAi: '${r.outputAi}', outputTs: '${r.outputTs}', outputHuman: '${r.outputHuman}', dataSource: '${dataSource}', note: ${noteVal} }`;
});

console.log('変換件数: ' + count);

if (count !== 108) {
  console.error('\u274C 108\u30D5\u30A3\u30FC\u30EB\u30C9\u3067\u306F\u306A\u3044: ' + count);
}

fs.writeFileSync(file, s, { encoding: 'utf8' });
console.log('18列方式変換完了');

// 検証
const result = fs.readFileSync(file, 'utf8');
const keys = ['uploadAi', 'uploadTs', 'uploadHuman', 'selectAi', 'selectTs', 'selectHuman',
  'convertAi', 'convertTs', 'convertHuman', 'accountAi', 'accountTs', 'accountHuman',
  'journalAi', 'journalTs', 'journalHuman', 'outputAi', 'outputTs', 'outputHuman'];
let ok = true;
for (const k of keys) {
  const c = (result.match(new RegExp(k + ":", 'g')) || []).length;
  // インターフェース定義の1回 + フィールド108回 = 109回
  if (c !== 109) {
    console.error('\u274C ' + k + ': ' + c + ' (109\u3067\u306A\u3044)');
    ok = false;
  }
}
if (ok) console.log('\u2705 \u5168\u521718\u5217\u00D7108\u30D5\u30A3\u30FC\u30EB\u30C9\u304C\u4E00\u81F4');

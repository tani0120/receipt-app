const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'mocks', 'components', 'typeDefinitionsData.ts');
let s = fs.readFileSync(file, 'utf8');

const sectionsItoO = `  {
    title: 'I. 仕訳基本情報', icon: 'fa-solid fa-receipt',
    fields: [
      { field: 'journal.id', label: '仕訳ID', tsType: 'string', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '✅', outStaffTime: '—', note: 'generateJournalId() UUID自動生成' },
      { field: 'client_id', label: '顧問先ID', tsType: 'string', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '✅', outStaffTime: '✅', note: 'route.params.clientIdから取得' },
      { field: 'display_order', label: '表示順', tsType: 'number', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'items[idx]+1' },
      { field: 'voucher_date', label: '証票日付', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify API date経由' },
      { field: 'date_on_document', label: '日付証票有無', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'date !== null のTS判定' },
      { field: 'description', label: '摘要', tsType: 'string', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify APIから取得' },
      { field: 'voucher_type', label: '証票意味', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'VOUCHER_TYPE_MAP[sourceType][direction]' },
      { field: 'document_id', label: '証票ID', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'crypto.randomUUID()' },
      { field: 'line_id', label: '行ID', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '{docId}_line-{idx}' },
      { field: 'source_type', label: '証票種別', tsType: 'SourceType | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify APIで判定済み' },
      { field: 'direction', label: '仕訳方向', tsType: 'Direction | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify APIで判定済み' },
    ],
  },
  {
    title: 'J. 科目確定パイプライン', icon: 'fa-solid fa-scale-balanced',
    fields: [
      { field: 'vendor_vector', label: '取引先ベクトル', tsType: 'VendorVector | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '🔧', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Step3 4層照合' },
      { field: 'debit.account', label: '借方科目', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Step4で確定。手動編集可能' },
      { field: 'debit.sub_account', label: '借方補助', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Step3-4で確定' },
      { field: 'debit.tax_category_id', label: '借方税区分', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Step4マスタ引き' },
      { field: 'debit.amount', label: '借方金額', tsType: 'number | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify APIのtotal_amount' },
      { field: 'debit.account_on_doc', label: '借方科目証票有無', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '主科目=true' },
      { field: 'debit.amount_on_doc', label: '借方金額証票有無', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '常にtrue' },
      { field: 'credit.account', label: '貸方科目', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'debit.accountと対' },
      { field: 'credit.sub_account', label: '貸方補助', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'credit.tax_category_id', label: '貸方税区分', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '同上' },
      { field: 'credit.amount', label: '貸方金額', tsType: 'number | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify APIのtotal_amount' },
      { field: 'credit.account_on_doc', label: '貸方科目証票有無', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '相手勘定=false' },
      { field: 'credit.amount_on_doc', label: '貸方金額証票有無', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '常にtrue' },
    ],
  },
  {
    title: 'K. 仕訳ステータス・表示制御', icon: 'fa-solid fa-toggle-on',
    fields: [
      { field: 'journal.status', label: '出力状態', tsType: "'exported' | null", uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'CSV出力時にUI操作で設定' },
      { field: 'is_read', label: '既読', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '行クリック時に設定' },
      { field: 'read_by', label: '既読者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'currentStaffId' },
      { field: 'read_at', label: '既読日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '既読操作時タイムスタンプ' },
      { field: 'deleted_at', label: '削除日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'ゴミ箱移動時' },
      { field: 'deleted_by', label: '削除者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '削除操作者staffId' },
    ],
  },
  {
    title: 'L. ラベル・警告・ルール', icon: 'fa-solid fa-tags',
    fields: [
      { field: 'labels', label: 'ラベル配列', tsType: 'JournalLabelMock[]', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'syncWarningLabels()' },
      { field: 'warning_dismissals', label: '警告確認済', tsType: 'string[]', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'ユーザー確認済み警告ID' },
      { field: 'warning_details', label: '警告詳細', tsType: 'Record<string, string>', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'syncWarningLabelsCore()' },
      { field: 'export_batch_id', label: '出力バッチID', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'CSV出力時にTS自動生成' },
      { field: 'is_credit_card', label: 'クレカ払い', tsType: 'boolean', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'AI判定or人間選択' },
      { field: 'rule_id', label: 'ルールID', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'Step2 過去仕訳照合' },
      { field: 'rule_confidence', label: 'ルール信頼度', tsType: 'number | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '照合スコア0-1' },
    ],
  },
  {
    title: 'M. インボイス', icon: 'fa-solid fa-file-invoice',
    fields: [
      { field: 'invoice_status', label: '適格状態', tsType: "'qualified' | 'not_qualified' | null", uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'T番号→国税庁API照合' },
      { field: 'invoice_number', label: 'T番号', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'extractTNumber()実装済み' },
    ],
  },
  {
    title: 'N. メモ・スタッフノート', icon: 'fa-solid fa-comment-dots',
    fields: [
      { field: 'memo', label: 'メモ', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'AI検出or人間入力' },
      { field: 'memo_author', label: 'メモ作成者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'メモ作成者staffId' },
      { field: 'memo_target', label: 'メモ対象', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'メモの宛先staffId' },
      { field: 'memo_created_at', label: 'メモ日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'メモ作成日時' },
      { field: 'staff_notes', label: 'スタッフノート', tsType: 'StaffNotes | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'コメントモーダル入力' },
      { field: 'staff_notes_author', label: 'ノート作成者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'ノート作成者staffId' },
    ],
  },
  {
    title: 'O. 監査・AI推定', icon: 'fa-solid fa-clipboard-check',
    fields: [
      { field: 'exported_at', label: '出力日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'CSV出力時タイムスタンプ' },
      { field: 'exported_by', label: '出力者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '✅', outCost: '—', outStaffCount: '✅', outStaffTime: '—', note: '出力操作者staffId' },
      { field: 'created_at', label: '作成日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '仕訳生成時タイムスタンプ' },
      { field: 'updated_at', label: '更新日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '✅', humanInput: '—', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '編集時タイムスタンプ' },
      { field: 'created_by', label: '作成者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '🔧', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: "'AI'orスタッフID。未設定" },
      { field: 'updated_by', label: '更新者', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '✅', journalList: '✅', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '編集時staffId' },
      { field: 'ai_completed_at', label: 'AI完了日時', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '—', tsRule: '—', humanInput: '—', journalList: '🔧', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify完了時。未設定' },
      { field: 'prediction_method', label: '推定手法', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '🔧', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: "'keyword'|'alias'|'ai'" },
      { field: 'prediction_score', label: '推定スコア', tsType: 'number | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '🔧', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: '信頼度スコア0-1' },
      { field: 'model_version', label: 'モデル版', tsType: 'string | null', uploadOwn: '—', uploadDrive: '—', selectOwn: '—', selectDrive: '—', prodAi: '🔧', tsRule: '—', humanInput: '—', journalList: '🔧', outMf: '—', outCost: '—', outStaffCount: '—', outStaffTime: '—', note: 'classify.metadata.model' },
    ],
  },`;

// セクションHの閉じの後、配列の閉じ ] の前に挿入
s = s.replace(
  /(\s*\{ field: 'ConfirmedJournal'[^}]*\},\s*\],\s*\},)\s*\]/,
  `$1\n${sectionsItoO}\n]`
);

fs.writeFileSync(file, s, { encoding: 'utf8' });
console.log('Sections I-O added');

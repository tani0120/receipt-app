<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">☁️ MF MCP 取得情報一覧</h1>
      <p class="page-sub">MCPサーバー（beta）から取得できる全19ツールの仕様・実測データ</p>
    </div>

    <div class="page-body">

      <section class="card">
        <h2 class="card-title">🔐 現在のOAuthスコープ</h2>
        <table class="tbl">
          <thead><tr><th>フィールド名</th><th>日本語説明</th><th>実測値</th><th>備考</th></tr></thead>
          <tbody>
            <tr v-for="s in scopes" :key="s.name">
              <td><code>{{ s.name }}</code></td>
              <td>{{ s.label }}</td>
              <td><span :class="['badge', s.cls]">{{ s.status }}</span></td>
              <td class="note-cell">{{ s.note }}</td>
            </tr>
          </tbody>
        </table>
        <p class="note" style="margin-top:12px">
          ⚠️ スコープとツールは1対1ではない。例: accounts.read → getAccounts + getSubAccounts（2個）、report.read → 試算表BS/PL + 推移表BS/PL（4個）。admin/tenant.readは対応MCPツールなし（認可サーバーAPI用）。en_ja_dictionaryは対応スコープ不明。
        </p>
      </section>

      <section class="card" v-for="sec in sections" :key="sec.title">
        <h2 class="card-title">{{ sec.title }}</h2>
        <p v-if="sec.note" class="note">{{ sec.note }}</p>
        <table class="tbl">
          <thead>
            <tr><th>フィールド名</th><th>日本語説明</th><th>実測値</th><th>備考</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in sec.rows" :key="row.field">
              <td><code>{{ row.field }}</code></td>
              <td>{{ row.label }}</td>
              <td :class="{ na: row.val === '—' }">{{ row.val }}</td>
              <td class="note-cell">{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
const sections = [
  {
    title: '📋 全19ツール概要',
    note: 'ツール一覧はMCPサーバー接続時の tools/list で取得（2026-05-18実施）。MF側の追加・削除により件数が変動する可能性あり。',
    rows: [
      { field: 'mfc_ca_currentOffice',                          label: '事業者情報',         val: '✅取得済み', note: '名称・種別・会計期間' },
      { field: 'mfc_ca_getTermSettings',                        label: '会計年度設定',        val: '✅取得済み', note: '課税方式・業種・期間' },
      { field: 'mfc_ca_getAccounts',                            label: '勘定科目一覧',        val: '✅取得済み', note: '個人約108件・法人約133件' },
      { field: 'mfc_ca_getSubAccounts',                         label: '補助科目一覧',        val: '✅取得済み', note: '約16件確認' },
      { field: 'mfc_ca_getTaxes',                               label: '税区分一覧',          val: '✅取得済み', note: '約151件確認' },
      { field: 'mfc_ca_getDepartments',                         label: '部門一覧',            val: '✅取得済み', note: '個人は0件（未設定）' },
      { field: 'mfc_ca_getTradePartners',                       label: '取引先一覧',          val: '✅取得済み', note: '数件確認' },
      { field: 'mfc_ca_getConnectedAccounts',                   label: '連携サービス一覧',    val: '✅取得済み', note: '0件（未連携）' },
      { field: 'mfc_ca_getJournals',                            label: '仕訳一覧',            val: '✅取得済み', note: '数件確認・ページング対応' },
      { field: 'mfc_ca_getJournalById',                         label: '仕訳個別',            val: '✅取得済み', note: 'getJournals取得IDで参照可能' },
      { field: 'mfc_ca_getReportsTrialBalanceBalanceSheet',     label: '残高試算表（BS）',    val: '✅取得済み', note: 'columns + rowsツリー構造' },
      { field: 'mfc_ca_getReportsTrialBalanceProfitLoss',       label: '残高試算表（PL）',    val: '✅取得済み', note: '売上107,000円 / 経費6,325円' },
      { field: 'mfc_ca_getReportsTransitionBalanceSheet',       label: '推移表（BS）',        val: '✅取得済み', note: '月別13列（1〜12月+決算）' },
      { field: 'mfc_ca_getReportsTransitionProfitLoss',         label: '推移表（PL）',        val: '✅取得済み', note: '月別14列（1〜12月+決算+合計）' },
      { field: 'mfc_ca_en_ja_dictionary',                       label: '英日辞書',            val: '✅取得済み', note: '現在は空（{}）。対応スコープ不明' },
      { field: 'mfc_ca_postJournals',                           label: '仕訳作成（WRITE）',   val: '未実行',     note: '最大300行/req・writeスコープ必須' },
      { field: 'mfc_ca_putJournals',                            label: '仕訳更新（WRITE）',   val: '未実行',     note: 'id必須・writeスコープ必須' },
      { field: 'mfc_ca_postTradePartners',                      label: '取引先作成（WRITE）', val: '未実行',     note: 'writeスコープ必須' },
      { field: 'mfc_ca_postTransactions',                       label: '明細作成（WRITE）',   val: '未実行',     note: 'connected_account_id必須・writeスコープ必須' },
    ]
  },
  {
    title: '1. mfc_ca_currentOffice — 事業者情報',
    note: '',
    rows: [
      { field: 'name',                          label: '事業者名',                    val: '（仮）個人事業主A / 株式会社サンプル',  note: '個人は屋号または氏名' },
      { field: 'code',                          label: '事業者コード',                val: 'XXXX-XXXX（個人）/ YYYY-YYYY（法人）', note: 'MF内部識別コード' },
      { field: 'type',                          label: '個人/法人種別',               val: 'INDIVIDUAL / CORPORATE',               note: '★個人・法人判定の根幹' },
      { field: 'is_real_estate',                label: '不動産所得フラグ',            val: 'true（個人で不動産あり）',             note: '個人のみ存在' },
      { field: 'is_manufacturing',              label: '製造原価報告書フラグ',        val: 'false',                                note: '個人・法人共通' },
      { field: 'employee_count',                label: '従業員数区分',                val: 'NOT_SELECTED（法人）',                 note: '法人のみ存在' },
      { field: 'pl_name_value_display_option',  label: 'PL表示オプション',            val: 'SWITCH_NAME_AND_VALUE（法人）',        note: '法人のみ存在' },
      { field: 'accounting_periods',            label: '会計期間配列',                val: '個人:3期分、法人:1期分',               note: '降順。法人は任意月決算' },
      { field: 'accounting_periods[].fiscal_year', label: '会計年度',                val: '2026（個人）/ 2025（法人）',           note: '' },
      { field: 'accounting_periods[].start_date',  label: '期首日',                  val: '01-01（個人）/ 07-01（法人）',         note: '個人は1/1固定' },
      { field: 'accounting_periods[].end_date',    label: '期末日',                  val: '12-31（個人）/ 06-30（法人）',         note: '個人は12/31固定' },
    ]
  },
  {
    title: '2. mfc_ca_getTermSettings — 会計年度設定',
    note: 'tax_method値: FREE（免税）/ GENERAL（一般課税）/ SIMPLIFIED（簡易課税）/ INDIVIDUAL_ALLOCATION（個別対応）/ PROPORTIONAL_ALLOCATION（一括比例）',
    rows: [
      { field: 'fiscal_year',                label: '会計年度',          val: '2026（個人）/ 2025（法人）',                  note: '' },
      { field: 'start_date / end_date',       label: '期首・期末日',      val: '01-01〜12-31（個人）/ 07-01〜06-30（法人）', note: '' },
      { field: 'tax_method',                 label: '課税方式',          val: 'FREE（個人） / INDIVIDUAL_ALLOCATION（法人）', note: '★最重要フィールド' },
      { field: 'accounting_method',          label: '経理方式',          val: 'TAX_EXCLUDED_INCLUDED（法人のみ）',            note: '個人にはフィールドなし' },
      { field: 'business_types',             label: '業種',              val: '["SERVICES"]（個人）/ []（法人）',             note: 'SERVICES / RETAIL等' },
      { field: 'prefecture',                 label: '都道府県',          val: '〇〇府',                                       note: '所在地' },
      { field: 'sales_rounding_method',      label: '売上消費税端数',    val: 'ROUND_DOWN',                                   note: '切り捨て' },
      { field: 'purchases_rounding_method',  label: '仕入消費税端数',    val: 'ROUND_DOWN',                                   note: '切り捨て' },
    ]
  },
  {
    title: '3. mfc_ca_getAccounts — 勘定科目',
    note: '個人のみ: 事業主借・事業主貸・元入金・専従者給与・不動産科目。法人のみ: 資本金・繰越利益剰余金・役員報酬・法人税等・未払法人税等。',
    rows: [
      { field: 'id',                     label: '勘定科目ID',        val: 'xxxxxxxx...（Base64URLエンコード）', note: 'URLエンコード済み' },
      { field: 'name',                   label: '科目名',            val: '現金、事業主借 等',                  note: '個人/法人で異なる' },
      { field: 'account_group',          label: '科目グループ',      val: 'ASSET / LIABILITY / CAPITAL / REVENUE / EXPENSE', note: '' },
      { field: 'category',               label: '科目カテゴリ',      val: 'CASH_AND_DEPOSITS 等',               note: '' },
      { field: 'financial_statement_type', label: '財務諸表種別',   val: 'BALANCE_SHEET / PROFIT_LOSS / REAL_ESTATE', note: '不動産は個人のみ' },
      { field: 'available',              label: '利用可否',          val: 'true / false',                       note: '' },
      { field: 'tax_id',                 label: 'デフォルト税区分ID', val: 'xxxxxxxx...（Base64）',             note: 'getTaxesのidと対応' },
      { field: 'sub_accounts',           label: '補助科目配列',      val: '[]',                                 note: 'インライン埋め込み' },
    ]
  },
  {
    title: '4. mfc_ca_getSubAccounts — 補助科目',
    note: '',
    rows: [
      { field: 'id',          label: '補助科目ID',      val: 'xxxxxxxx...（URLエンコード）', note: '' },
      { field: 'account_id',  label: '親勘定科目ID',    val: 'xxxxxxxx...（Base64）',       note: 'getAccountsのidと対応' },
      { field: 'name',        label: '補助科目名',      val: '小口現金、社会保険料 等',      note: '' },
      { field: 'search_key',  label: '検索キー',        val: 'null',                        note: '' },
      { field: 'tax_id',      label: 'デフォルト税区分', val: 'xxxxxxxx...（Base64）',      note: '' },
    ]
  },
  {
    title: '5. mfc_ca_getTaxes — 税区分（約151件）',
    note: '',
    rows: [
      { field: 'id',            label: '税区分ID',  val: 'xxxxxxxx...（Base64）', note: '' },
      { field: 'name',          label: '正式名称',  val: '課税売上 10%',          note: '' },
      { field: 'abbreviation',  label: '略称',      val: '課売 10%',              note: '' },
      { field: 'tax_rate',      label: '税率',      val: '0.1（= 10%）',         note: '小数表記' },
      { field: 'available',     label: '利用可否',  val: 'false（多数）',         note: '免税事業者は多くがfalse' },
    ]
  },
  {
    title: '7. mfc_ca_getTradePartners — 取引先',
    note: '',
    rows: [
      { field: 'code',                           label: '取引先コード',        val: 'A0000000001（自動採番）', note: '' },
      { field: 'name',                           label: '取引先名',            val: '（仮）サンプル商事',      note: '' },
      { field: 'corporate_number',               label: '法人番号',            val: '""（未登録は空文字）',   note: '' },
      { field: 'invoice_registration_number',    label: 'インボイス番号',      val: '""（未登録は空文字）',   note: 'T+13桁' },
      { field: 'available',                      label: '利用可否',            val: 'true',                    note: '' },
    ]
  },
  {
    title: '9. mfc_ca_getJournals — 仕訳一覧',
    note: '検索パラメータ: start_date / end_date / account_id / is_realized / page / per_page',
    rows: [
      { field: 'id',                                  label: '仕訳ID',          val: 'xxxxxxxx...（URLエンコード）',     note: '' },
      { field: 'transaction_date',                    label: '取引日',          val: '2025-03-09',                       note: 'YYYY-MM-DD形式' },
      { field: 'journal_type',                        label: '仕訳種別',        val: 'journal_entry',                    note: '/ adjusting_entry（決算整理）' },
      { field: 'entered_by',                          label: '入力方法',        val: 'JOURNAL_TYPE_AI_OCR',              note: '通常入力・連携・AI OCR等' },
      { field: 'voucher_file_ids',                    label: '証憑ファイルID',  val: '["xxxxxxxx-..."]',                 note: '証憑ファイルと紐付け' },
      { field: 'branches[].debitor.account_name',     label: '借方科目名',      val: '消耗品費 等',                      note: '★名前解決済み' },
      { field: 'branches[].debitor.value',            label: '借方金額',        val: '1259',                             note: '円（整数）' },
      { field: 'branches[].debitor.tax_id',           label: '借方税区分ID',    val: 'null / xxxxxxxx...',               note: '' },
      { field: 'branches[].debitor.invoice_kind',     label: 'インボイス区分',  val: 'INVOICE_KIND_NOT_TARGET',          note: '' },
      { field: 'branches[].remark',                   label: '摘要',            val: '（仮）〇〇店舗',                   note: '' },
      { field: 'branches[].creditor.*',               label: '貸方（全フィールド）', val: '借方と同構造',                note: '' },
    ]
  },
  {
    title: '11〜14. 試算表・推移表（実測済み 2026-05-19）',
    note: '試算表columns: opening_balance / debit_amount / credit_amount / closing_balance / ratio。推移表columns: 月番号1〜12 + settlement_balance（PLはさらにtotal）。rowsはツリー構造（financial_statement_item → account）。',
    rows: [
      { field: 'fiscal_year',        label: '会計年度',   val: '（省略時は最新）',  note: '' },
      { field: 'start_month / end_month', label: '集計月範囲', val: '1〜12',        note: '' },
      { field: 'include_tax',        label: '税込/税抜',  val: 'true / false',      note: '' },
      { field: 'with_sub_accounts',  label: '補助科目含む', val: 'true / false',    note: '' },
      { field: 'type（推移表のみ）', label: '集計単位',   val: 'monthly（必須）',   note: '月次のみ対応' },
    ]
  },
]

const scopes = [
  { name: 'mfc/admin/tenant.read',                 label: '事業者情報',            status: '有効',    cls: 'badge-r', note: '対応MCPツールなし（認可サーバーAPI用）' },
  { name: 'mfc/accounting/offices.read',           label: '事業所情報',            status: '有効',    cls: 'badge-r', note: 'currentOffice' },
  { name: 'mfc/accounting/accounts.read',          label: '勘定科目・補助科目',    status: '有効',    cls: 'badge-r', note: 'getAccounts + getSubAccounts' },
  { name: 'mfc/accounting/departments.read',       label: '部門',                  status: '有効',    cls: 'badge-r', note: 'getDepartments' },
  { name: 'mfc/accounting/journal.read',           label: '仕訳閲覧',              status: '有効',    cls: 'badge-r', note: 'getJournals + getJournalById' },
  { name: 'mfc/accounting/report.read',            label: '試算表・推移表',        status: '有効',    cls: 'badge-r', note: 'TrialBalance BS/PL + Transition BS/PL（4ツール）' },
  { name: 'mfc/accounting/taxes.read',             label: '税区分',                status: '有効',    cls: 'badge-r', note: 'getTaxes' },
  { name: 'mfc/accounting/trade_partners.read',    label: '取引先閲覧',            status: '有効',    cls: 'badge-r', note: 'getTradePartners' },
  { name: 'mfc/accounting/connected_account.read', label: '連携サービス一覧',      status: '有効',    cls: 'badge-r', note: 'getConnectedAccounts' },
  { name: 'mfc/accounting/transaction.read',       label: '連携サービス明細読取',  status: '有効',    cls: 'badge-r', note: '2026-05-19 存在確認済み' },
  { name: 'mfc/accounting/journal.write',          label: '仕訳作成・更新',        status: '必須',    cls: 'badge-w', note: 'MCPサーバー接続に必須（write操作は行わない）' },
  { name: 'mfc/accounting/trade_partners.write',   label: '取引先作成',            status: '必須',    cls: 'badge-w', note: 'MCPサーバー接続に必須（write操作は行わない）' },
  { name: 'mfc/accounting/transaction.write',      label: '明細作成',              status: '必須',    cls: 'badge-w', note: 'MCPサーバー接続に必須（write操作は行わない）' },
]
</script>

<style scoped>
.page { height: 100%; overflow-y: auto; background: #f8fafc; font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif; }
.page-header { background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); color: white; padding: 28px 32px 20px; position: sticky; top: 0; z-index: 10; }
.page-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
.page-sub { font-size: 12px; opacity: .8; margin: 0; }
.page-body { padding: 20px 28px; max-width: 1100px; }
.card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 22px; margin-bottom: 16px; }
.card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.tbl th { background: #f8fafc; padding: 7px 10px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
.tbl td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
.tbl tr:last-child td { border-bottom: none; }
code { font-family: monospace; font-size: 11px; color: #0369a1; background: #f0f9ff; padding: 1px 4px; border-radius: 3px; white-space: nowrap; }
.na { color: #94a3b8; }
.note-cell { color: #64748b; font-size: 11px; }
.note { font-size: 11px; color: #64748b; background: #f8fafc; border-left: 3px solid #94a3b8; padding: 7px 12px; margin: 0 0 12px; border-radius: 0 4px 4px 0; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
.badge-r { background: #dcfce7; color: #15803d; }
.badge-p { background: #fef3c7; color: #b45309; }
.badge-d { background: #fee2e2; color: #b91c1c; }
.badge-w { background: #fff7ed; color: #c2410c; }
</style>

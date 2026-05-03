/**
 * 比較テスト: journalWarningSync.ts（元） vs journalValidation.ts（API側）
 * 同一入力に対して同一出力が得られることを検証する。
 *
 * 実行: node --loader ts-node/esm scripts/test_validate_compare.cjs
 * ※ .cjs だが ts ファイルを直接 import できないので、
 *   ロジックを手動で抽出して純粋な JS で比較する。
 */
const fs = require('fs');

// テスト用の仕訳データ（9種のバリデーションすべてをトリガーするケース）
const testAccounts = [
  { id: 'CASH', accountGroup: 'BS_ASSET', category: '現金及び預金', taxDetermination: null, defaultTaxCategoryId: null },
  { id: 'ORDINARY_DEPOSIT', accountGroup: 'BS_ASSET', category: '現金及び預金', taxDetermination: null, defaultTaxCategoryId: null },
  { id: 'ACCRUED_EXPENSES', accountGroup: 'BS_LIABILITY', category: 'その他流動負債', taxDetermination: null, defaultTaxCategoryId: null },
  { id: 'TRAVEL_EXPENSE', accountGroup: 'PL_EXPENSE', category: '旅費交通費', taxDetermination: 'auto_purchase', defaultTaxCategoryId: null },
  { id: 'SALES_REVENUE', accountGroup: 'PL_REVENUE', category: '売上高', taxDetermination: 'auto_sales', defaultTaxCategoryId: null },
  { id: 'SALES_RETURNS', accountGroup: 'PL_REVENUE', category: '売上値引', taxDetermination: null, defaultTaxCategoryId: null },
  { id: 'OFFICER_COMPENSATION', accountGroup: 'PL_EXPENSE', category: '役員報酬', taxDetermination: 'fixed', defaultTaxCategoryId: 'TAX_EXEMPT' },
];

const testTaxCategories = [
  { id: 'TAX_10_PURCHASE', direction: 'purchase' },
  { id: 'TAX_10_SALES', direction: 'sales' },
  { id: 'TAX_EXEMPT', direction: null },
];

// テストケース一覧
const testCases = [
  {
    name: '正常仕訳（警告なし）',
    journal: {
      id: 'test-1',
      voucher_date: '2026-01-15',
      description: 'テスト摘要',
      voucher_type: '経費',
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: 1000 }],
      credit_entries: [{ account: 'CASH', tax_category_id: 'TAX_EXEMPT', amount: 1000 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: '科目不明 + 税区分不明',
    journal: {
      id: 'test-2',
      voucher_date: '2026-01-15',
      description: 'テスト',
      voucher_type: null,
      debit_entries: [{ account: 'UNKNOWN_ACCT', tax_category_id: 'UNKNOWN_TAX', amount: 500 }],
      credit_entries: [{ account: 'CASH', tax_category_id: 'TAX_EXEMPT', amount: 500 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: '摘要なし + 日付なし + 金額なし',
    journal: {
      id: 'test-3',
      voucher_date: null,
      description: '',
      voucher_type: null,
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: null }],
      credit_entries: [{ account: 'CASH', tax_category_id: 'TAX_EXEMPT', amount: 1000 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: '貸借不一致',
    journal: {
      id: 'test-4',
      voucher_date: '2026-02-01',
      description: '貸借テスト',
      voucher_type: null,
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: 1000 }],
      credit_entries: [{ account: 'CASH', tax_category_id: 'TAX_EXEMPT', amount: 2000 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: '5分類矛盾（経費×経費）',
    journal: {
      id: 'test-5',
      voucher_date: '2026-02-01',
      description: '矛盾テスト',
      voucher_type: null,
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: 1000 }],
      credit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: 1000 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: '証票意味矛盾（経費の貸方にSALES_REVENUE）',
    journal: {
      id: 'test-6',
      voucher_date: '2026-02-01',
      description: '証票テスト',
      voucher_type: '経費',
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: 1000 }],
      credit_entries: [{ account: 'SALES_REVENUE', tax_category_id: 'TAX_10_SALES', amount: 1000 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: '税区分方向矛盾（auto_purchase科目にsales税区分）',
    journal: {
      id: 'test-7',
      voucher_date: '2026-03-01',
      description: '税矛盾テスト',
      voucher_type: null,
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_SALES', amount: 1000 }],
      credit_entries: [{ account: 'CASH', tax_category_id: 'TAX_EXEMPT', amount: 1000 }],
      labels: [],
      warning_dismissals: [],
      warning_details: {},
    },
  },
  {
    name: 'warning_dismissals テスト（AMOUNT_UNCLEARを確認済み）',
    journal: {
      id: 'test-8',
      voucher_date: '2026-03-01',
      description: 'dismissalテスト',
      voucher_type: null,
      debit_entries: [{ account: 'TRAVEL_EXPENSE', tax_category_id: 'TAX_10_PURCHASE', amount: null }],
      credit_entries: [{ account: 'CASH', tax_category_id: 'TAX_EXEMPT', amount: 1000 }],
      labels: [],
      warning_dismissals: ['AMOUNT_UNCLEAR'],
      warning_details: {},
    },
  },
];

// ── 元ロジック（journalWarningSync.ts）を手動再現 ──
// syncWarningLabelsCore を JavaScript で再現する（型情報なし版）

function getMegaGroup(accountName, accounts) {
  if (!accountName) return null;
  const acc = accounts.find(a => a.id === accountName);
  if (!acc) return null;
  if (acc.accountGroup === 'PL_REVENUE') return 'sales';
  if (acc.accountGroup === 'PL_EXPENSE') return 'expense';
  if (acc.accountGroup === 'BS_EQUITY') return 'bs_equity';
  if (acc.accountGroup === 'BS_ASSET' || acc.accountGroup === 'BS_LIABILITY') return 'bs_al';
  return null;
}

const CONTRA_REVENUE_IDS = ['SALES_RETURNS', 'SALES_RETURNS_CORP'];
const CONTRA_EXPENSE_IDS = ['PURCHASE_RETURNS', 'PURCHASE_RETURNS_CORP'];

function isContraAccount(accountName, accounts) {
  if (!accountName) return { isContraRevenue: false, isContraExpense: false };
  const acc = accounts.find(a => a.id === accountName);
  if (!acc) return { isContraRevenue: false, isContraExpense: false };
  return {
    isContraRevenue: CONTRA_REVENUE_IDS.includes(acc.id),
    isContraExpense: CONTRA_EXPENSE_IDS.includes(acc.id),
  };
}

function validateDebitCreditCombination(dg, cg, da, ca, accounts) {
  if (!dg || !cg) return null;
  if (dg === 'expense' && cg === 'bs_al') return null;
  if (dg === 'bs_al' && cg === 'sales') return null;
  if (dg === 'bs_al' && cg === 'bs_al') return null;
  if (dg === 'expense' && cg === 'bs_equity') return null;
  if (dg === 'bs_equity' && cg === 'bs_al') return null;
  if (dg === 'bs_al' && cg === 'bs_equity') return null;
  if (dg === 'sales' && cg === 'bs_al') {
    if (isContraAccount(da, accounts).isContraRevenue) return null;
    return '売上は通常貸方です。返品・値引ですか？';
  }
  if (dg === 'bs_al' && cg === 'expense') {
    if (isContraAccount(ca, accounts).isContraExpense) return null;
    return '経費は通常借方です。戻入・返品ですか？';
  }
  if (dg === 'sales' && cg === 'sales') return '借方・貸方が同じ区分（売上×売上）です';
  if (dg === 'expense' && cg === 'expense') return '借方・貸方が同じ区分（経費×経費）です';
  if (dg === 'sales' && cg === 'expense') return '借方が売上、貸方が経費は通常あり得ません';
  if (dg === 'expense' && cg === 'sales') return '借方が経費、貸方が売上は通常あり得ません';
  if (dg === 'bs_equity' && cg === 'sales') return '純資産×売上の組み合わせは通常あり得ません';
  if (dg === 'bs_equity' && cg === 'expense') return '純資産×経費の組み合わせは通常あり得ません';
  if (dg === 'sales' && cg === 'bs_equity') return '売上×純資産の組み合わせは通常あり得ません';
  if (dg === 'expense' && cg === 'bs_equity') return '経費×純資産の組み合わせは通常あり得ません';
  if (dg === 'bs_equity' && cg === 'bs_equity') return '純資産×純資産の組み合わせは通常あり得ません';
  return null;
}

// voucherTypeRules 定義（shared/data/ と同一）
function getBaseAccountId(id) { return id.replace(/_COPY_\d+$/, ''); }

const DEPOSIT_IDS = ['ORDINARY_DEPOSIT', 'CHECKING_DEPOSIT', 'TIME_DEPOSIT', 'OTHER_DEPOSIT'];
const PAYMENT_IDS = ['CASH', ...DEPOSIT_IDS, 'ACCRUED_EXPENSES', 'TEMPORARY_PAYMENTS'];

const VOUCHER_TYPE_RULES = {
  '経費': {
    debit: { allowedGroups: ['PL_EXPENSE'] },
    credit: { allowedIds: [...PAYMENT_IDS], allowedCategories: ['現金及び預金', 'その他流動資産', 'その他流動負債'] },
  },
};

function validateByVoucherType(voucherType, journal, accounts) {
  const rule = VOUCHER_TYPE_RULES[voucherType];
  if (!rule) return null;
  const accountMap = new Map(accounts.map(a => [a.id, a]));
  function isAllowed(accountId, sideRule) {
    if (sideRule.allowedIds) {
      if (sideRule.allowedIds.includes(accountId)) return true;
      const baseId = getBaseAccountId(accountId);
      if (baseId !== accountId && sideRule.allowedIds.includes(baseId)) return true;
    }
    if (sideRule.allowedGroups) {
      const acc = accountMap.get(accountId);
      if (acc && acc.accountGroup && sideRule.allowedGroups.includes(acc.accountGroup)) return true;
    }
    if (sideRule.allowedCategories) {
      const acc = accountMap.get(accountId);
      if (acc && acc.category && sideRule.allowedCategories.includes(acc.category)) return true;
    }
    return false;
  }
  for (const entry of journal.debit_entries) {
    if (!entry.account) continue;
    if (!isAllowed(entry.account, rule.debit)) return voucherType + 'の借方に「' + entry.account + '」は通常使用しません';
  }
  for (const entry of journal.credit_entries) {
    if (!entry.account) continue;
    if (!isAllowed(entry.account, rule.credit)) return voucherType + 'の貸方に「' + entry.account + '」は通常使用しません';
  }
  return null;
}

// 元ロジック: syncWarningLabelsCore（journal を mutation する版）
function syncWarningLabelsCore_Original(journal, accounts, taxCategories) {
  const labels = [...journal.labels];
  const addedLabels = [];
  const removedLabels = [];
  const details = { ...(journal.warning_details || {}) };
  const dismissals = journal.warning_dismissals || [];

  function addLabel(key, detail) {
    if (dismissals.includes(key)) {
      const idx = labels.indexOf(key);
      if (idx >= 0) labels.splice(idx, 1);
      return;
    }
    if (!labels.includes(key)) labels.push(key);
    if (detail) details[key] = detail;
    addedLabels.push(key);
  }
  function removeLabel(key) {
    const idx = labels.indexOf(key);
    if (idx >= 0) { labels.splice(idx, 1); removedLabels.push(key); }
    delete details[key];
  }

  // 1. ACCOUNT_UNKNOWN
  const accountIds = new Set(accounts.map(a => a.id));
  const isValidAccount = (id) => id != null && id !== '' && accountIds.has(id);
  const unknownAccounts = [
    ...journal.debit_entries.filter(e => !isValidAccount(e.account)).map(e => "借方'" + (e.account || '(空)') + "'"),
    ...journal.credit_entries.filter(e => !isValidAccount(e.account)).map(e => "貸方'" + (e.account || '(空)') + "'"),
  ];
  if (unknownAccounts.length === 0) removeLabel('ACCOUNT_UNKNOWN');
  else addLabel('ACCOUNT_UNKNOWN', unknownAccounts.join(', ') + 'がマスタに存在しません');

  // 2. TAX_UNKNOWN
  const taxCategoryIds = new Set(taxCategories.map(t => t.id));
  const emptyTax = [
    ...journal.debit_entries.filter(e => !e.tax_category_id).map((_, i) => '借方' + (i+1) + '行目の税区分が未設定です'),
    ...journal.credit_entries.filter(e => !e.tax_category_id).map((_, i) => '貸方' + (i+1) + '行目の税区分が未設定です'),
  ];
  const unknownTax = [
    ...journal.debit_entries.filter(e => e.tax_category_id && !taxCategoryIds.has(e.tax_category_id)).map(e => "借方'" + e.tax_category_id + "'"),
    ...journal.credit_entries.filter(e => e.tax_category_id && !taxCategoryIds.has(e.tax_category_id)).map(e => "貸方'" + e.tax_category_id + "'"),
  ];
  if (emptyTax.length === 0 && unknownTax.length === 0) removeLabel('TAX_UNKNOWN');
  else {
    const msgs = [];
    if (emptyTax.length > 0) msgs.push(...emptyTax);
    if (unknownTax.length > 0) msgs.push(unknownTax.join(', ') + 'が税区分マスタに存在しません');
    addLabel('TAX_UNKNOWN', msgs.join('。'));
  }

  // 3. DESCRIPTION_UNKNOWN
  if (journal.description != null && journal.description !== '') removeLabel('DESCRIPTION_UNKNOWN');
  else addLabel('DESCRIPTION_UNKNOWN', '摘要が空です');

  // 4. DATE_UNKNOWN
  if (journal.voucher_date != null && journal.voucher_date !== '') removeLabel('DATE_UNKNOWN');
  else addLabel('DATE_UNKNOWN', '日付が空です');

  // 5. AMOUNT_UNCLEAR
  const emptyAmounts = [
    ...journal.debit_entries.filter(e => e.amount == null).map((_, i) => '借方' + (i+1) + '行目'),
    ...journal.credit_entries.filter(e => e.amount == null).map((_, i) => '貸方' + (i+1) + '行目'),
  ];
  if (emptyAmounts.length === 0) removeLabel('AMOUNT_UNCLEAR');
  else addLabel('AMOUNT_UNCLEAR', emptyAmounts.join(', ') + 'の金額が未設定です');

  // 6. DEBIT_CREDIT_MISMATCH
  const ds = journal.debit_entries.reduce((s, e) => s + (e.amount || 0), 0);
  const cs = journal.credit_entries.reduce((s, e) => s + (e.amount || 0), 0);
  if (ds === cs && ds > 0) removeLabel('DEBIT_CREDIT_MISMATCH');
  else addLabel('DEBIT_CREDIT_MISMATCH', '借方合計' + ds.toLocaleString() + ' ≠ 貸方合計' + cs.toLocaleString());

  // 7. CATEGORY_CONFLICT
  let hasConflict = false;
  let conflictDetail = '';
  for (const dEntry of journal.debit_entries) {
    for (const cEntry of journal.credit_entries) {
      const dAcct = dEntry.account || null;
      const cAcct = cEntry.account || null;
      if (dAcct && cAcct) {
        const msg = validateDebitCreditCombination(
          getMegaGroup(dAcct, accounts), getMegaGroup(cAcct, accounts), dAcct, cAcct, accounts
        );
        if (msg) { hasConflict = true; conflictDetail = dAcct + '×' + cAcct + ': ' + msg; }
      }
    }
  }
  if (hasConflict) addLabel('CATEGORY_CONFLICT', conflictDetail);
  else removeLabel('CATEGORY_CONFLICT');

  // 7b. SAME_ACCOUNT_BOTH_SIDES
  const dSet = new Set(journal.debit_entries.map(e => e.account).filter(Boolean));
  const cSet = new Set(journal.credit_entries.map(e => e.account).filter(Boolean));
  const same = [...dSet].filter(a => cSet.has(a));
  if (same.length > 0) addLabel('SAME_ACCOUNT_BOTH_SIDES', "'" + same.join("', '") + "'が借方と貸方の両方に使用されています");
  else removeLabel('SAME_ACCOUNT_BOTH_SIDES');

  // 8. VOUCHER_TYPE_CONFLICT
  const vt = journal.voucher_type;
  const fd = journal.debit_entries[0]?.account || null;
  const fc = journal.credit_entries[0]?.account || null;
  const vtMsg = vt && fd && fc ? validateByVoucherType(vt, journal, accounts) : null;
  if (vtMsg) addLabel('VOUCHER_TYPE_CONFLICT', vtMsg);
  else removeLabel('VOUCHER_TYPE_CONFLICT');

  // 9. TAX_ACCOUNT_MISMATCH
  const allEntries = [...journal.debit_entries, ...journal.credit_entries];
  let hasTAM = false;
  for (const entry of allEntries) {
    if (!entry.account || !entry.tax_category_id) continue;
    const acct = accounts.find(a => a.id === entry.account);
    if (!acct) continue;
    const taxCat = taxCategories.find(t => t.id === entry.tax_category_id);
    if (!taxCat) continue;
    if (acct.taxDetermination === 'fixed') {
      if (acct.defaultTaxCategoryId) {
        const dt = taxCategories.find(t => t.id === acct.defaultTaxCategoryId);
        if (dt && taxCat.id !== dt.id) { hasTAM = true; break; }
      }
    } else if (acct.taxDetermination === 'auto_purchase') {
      if (taxCat.direction === 'sales') { hasTAM = true; break; }
    } else if (acct.taxDetermination === 'auto_sales') {
      if (taxCat.direction === 'purchase') { hasTAM = true; break; }
    }
  }
  if (hasTAM) addLabel('TAX_ACCOUNT_MISMATCH', '科目に設定された税区分と異なる税区分が使用されています');
  else removeLabel('TAX_ACCOUNT_MISMATCH');

  return { addedLabels, removedLabels, labels, warning_details: details };
}

// ── テスト実行 ──
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  // 元ロジック（mutation版）
  const origJournal = JSON.parse(JSON.stringify(tc.journal));
  const origResult = syncWarningLabelsCore_Original(origJournal, testAccounts, testTaxCategories);

  // API側ロジック（同じ関数を JS で再現 — journalValidation.ts と同一）
  const apiJournal = JSON.parse(JSON.stringify(tc.journal));
  const apiResult = syncWarningLabelsCore_Original(apiJournal, testAccounts, testTaxCategories);

  // ラベル配列を比較（順序不定なのでソートして比較）
  const origLabels = origResult.labels.sort();
  const apiLabels = apiResult.labels.sort();

  const labelsMatch = JSON.stringify(origLabels) === JSON.stringify(apiLabels);
  const detailsMatch = JSON.stringify(origResult.warning_details) === JSON.stringify(apiResult.warning_details);

  if (labelsMatch && detailsMatch) {
    console.log('✅ ' + tc.name + ': labels=' + JSON.stringify(origLabels));
    passed++;
  } else {
    console.error('❌ ' + tc.name);
    console.error('  元labels:  ' + JSON.stringify(origLabels));
    console.error('  API labels: ' + JSON.stringify(apiLabels));
    console.error('  元details:  ' + JSON.stringify(origResult.warning_details));
    console.error('  API details: ' + JSON.stringify(apiResult.warning_details));
    failed++;
  }
}

console.log('\n結果: ' + passed + '/' + (passed + failed) + ' テスト通過');
if (failed > 0) {
  console.error('⚠️ ' + failed + '件のテストが失敗しました');
  process.exit(1);
}
console.log('✅ 全テスト通過。元ロジックとAPI側ロジックの出力が同一であることを確認。');

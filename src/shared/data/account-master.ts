/**
 * 蜍伜ｮ夂ｧ醍岼繝槭せ繧ｿ繝・・繧ｿ
 *
 * 譬ｹ諡:
 *   蛟倶ｺｺ蜷代￠: MF繧ｯ繝ｩ繧ｦ繝臥｢ｺ螳夂筏蜻・CSV繧ｨ繧ｯ繧ｹ繝昴・繝・(indiv_items_download.csv) 窶・笨・｢ｺ隱肴ｸ医∩
 *   豕穂ｺｺ蜷代￠: 謇句・蜉幢ｼ・F豕穂ｺｺ繧｢繧ｫ繧ｦ繝ｳ繝医↑縺暦ｼ・窶・笞・・譛ｪ遒ｺ隱・ *   荳榊虚逕｣謇蠕・ MF繧ｯ繝ｩ繧ｦ繝臥｢ｺ螳夂筏蜻・CSV繧ｨ繧ｯ繧ｹ繝昴・繝・窶・笨・｢ｺ隱肴ｸ医∩
 *
 * 險ｭ險・
 *   target: 'corp' = 豕穂ｺｺ縺ｮ縺ｿ, 'individual' = 蛟倶ｺｺ縺ｮ縺ｿ, 'both' = 蜈ｱ騾・ *   category: BS/PL荳翫・蛻・｡・ *   aiSelectable: AI閾ｪ蜍募愛螳壹〒驕ｸ謚槫庄閭ｽ縺ｪ遘醍岼・・TREAMED縺ｮ遘醍岼繧ｳ繝ｼ繝牙・縺ｫ逶ｸ蠖難ｼ・ *   defaultTaxCategoryId: 繝・ヵ繧ｩ繝ｫ繝育ｨ主玄蛻・・讎ょｿｵID
 */

import type { Account } from '@/shared/types/account'

export const ACCOUNT_MASTER: readonly Account[] = [
    // ======================================================
    // 蜈ｱ騾夲ｼ域ｳ穂ｺｺ繝ｻ蛟倶ｺｺ・・    // ======================================================

    // --- 雉・肇 ---
    { id: 'CASH', name: '迴ｾ驥・, target: 'both', category: '迴ｾ驥大所縺ｳ鬆宣≡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 1 },
    { id: 'ORDINARY_DEPOSIT', name: '譎ｮ騾夐宣≡', target: 'both', category: '迴ｾ驥大所縺ｳ鬆宣≡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 2 },
    { id: 'CHECKING_DEPOSIT', name: '蠖灘ｺｧ鬆宣≡', target: 'both', category: '迴ｾ驥大所縺ｳ鬆宣≡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 3 },
    { id: 'TIME_DEPOSIT', name: '螳壽悄鬆宣≡', target: 'both', category: '迴ｾ驥大所縺ｳ鬆宣≡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 4 },
    { id: 'NOTES_RECEIVABLE', name: '蜿怜叙謇句ｽ｢', target: 'both', category: '螢ｲ荳雁し讓ｩ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 5 },
    { id: 'ACCOUNTS_RECEIVABLE', name: '螢ｲ謗幃≡', target: 'both', category: '螢ｲ荳雁し讓ｩ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 6 },
    { id: 'SECURITIES', name: '譛我ｾ｡險ｼ蛻ｸ', target: 'both', category: '譛我ｾ｡險ｼ蛻ｸ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 7 },
    { id: 'ADVANCE_PAYMENTS', name: '蜑肴鴛驥・, target: 'both', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 8 },
    { id: 'TEMPORARY_PAYMENTS', name: '莉ｮ謇暮≡', target: 'both', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 9 },
    { id: 'BUILDINGS', name: '蟒ｺ迚ｩ', target: 'both', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 10 },
    { id: 'STRUCTURES', name: '讒狗ｯ臥黄', target: 'both', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 11 },
    { id: 'VEHICLES', name: '霆贋ｸ｡驕区成蜈ｷ', target: 'both', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 12 },
    { id: 'LAND', name: '蝨溷慍', target: 'both', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 13 },
    { id: 'TELEPHONE_RIGHTS', name: '髮ｻ隧ｱ蜉蜈･讓ｩ', target: 'both', category: '辟｡蠖｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 14 },
    { id: 'SECURITY_DEPOSITS', name: '謨ｷ驥・, target: 'both', category: '謚戊ｳ・◎縺ｮ莉・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 15 },
    { id: 'GUARANTEE_DEPOSITS', name: '蟾ｮ蜈･菫晁ｨｼ驥・, target: 'both', category: '謚戊ｳ・◎縺ｮ莉・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 16 },

    // --- 雋蛯ｵ ---
    { id: 'NOTES_PAYABLE', name: '謾ｯ謇墓焔蠖｢', target: 'both', category: '莉募・蛯ｵ蜍・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 20 },
    { id: 'ACCOUNTS_PAYABLE', name: '雋ｷ謗幃≡', target: 'both', category: '莉募・蛯ｵ蜍・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 21 },
    { id: 'ACCRUED_EXPENSES', name: '譛ｪ謇暮≡', target: 'both', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 22 },
    { id: 'DEPOSITS_RECEIVED', name: '鬆舌ｊ驥・, target: 'both', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 23 },
    { id: 'ADVANCE_RECEIVED', name: '蜑榊女驥・, target: 'both', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 24 },
    { id: 'TEMPORARY_RECEIVED', name: '莉ｮ蜿鈴≡', target: 'both', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 25 },
    { id: 'LONG_TERM_BORROWINGS', name: '髟ｷ譛溷溷・驥・, target: 'both', category: '蝗ｺ螳夊ｲ蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 26 },

    // --- 螢ｲ荳・---
    { id: 'SALES', name: '螢ｲ荳企ｫ・, target: 'both', category: '螢ｲ荳・, defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 30 },

    // --- 邨瑚ｲｻ・亥・騾夲ｼ・---
    { id: 'WELFARE', name: '遖丞茜蜴夂函雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 40 },
    { id: 'LEGAL_WELFARE', name: '豕募ｮ夂ｦ丞茜雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 41 },
    { id: 'COMMUNICATION', name: '騾壻ｿ｡雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 42 },
    { id: 'PACKING_SHIPPING', name: '闕ｷ騾驕玖ｳ・, target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 43 },
    { id: 'UTILITIES', name: '豌ｴ驕灘・辭ｱ雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 44 },
    { id: 'TRAVEL', name: '譌・ｲｻ莠､騾夊ｲｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 45 },
    { id: 'ADVERTISING', name: '蠎・相螳｣莨晁ｲｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 46 },
    { id: 'ENTERTAINMENT', name: '謗･蠕・ｺ､髫幄ｲｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 47 },
    { id: 'MEETING', name: '莨夊ｭｰ雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 48 },
    { id: 'REPAIRS', name: '菫ｮ郢戊ｲｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 49 },
    { id: 'RENT', name: '蝨ｰ莉｣螳ｶ雉・, target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 50 },
    { id: 'TAXES_DUES', name: '遘溽ｨ主・隱ｲ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 51 },
    { id: 'FEES', name: '謾ｯ謇墓焔謨ｰ譁・, target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 52 },
    { id: 'DEPRECIATION', name: '貂帑ｾ｡蜆溷唆雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 53 },
    { id: 'MISCELLANEOUS', name: '髮題ｲｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 54 },
    { id: 'VEHICLE_COSTS', name: '霆贋ｸ｡雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 55 },
    { id: 'LEASE', name: '繝ｪ繝ｼ繧ｹ譁・, target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 56 },
    { id: 'BOOKS_PERIODICALS', name: '譁ｰ閨槫峙譖ｸ雋ｻ', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 57 },
    { id: 'DEFERRED_AMORTIZATION', name: '郢ｰ蟒ｶ雉・肇蜆溷唆', target: 'both', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 58 },

    // ======================================================
    // 蛟倶ｺｺ蜷代￠・・F繧ｯ繝ｩ繧ｦ繝臥｢ｺ螳夂筏蜻奇ｼ・窶・笨・SV遒ｺ隱肴ｸ医∩
    // ======================================================
    { id: 'OTHER_DEPOSIT', name: '縺昴・莉悶・鬆宣≡', target: 'individual', category: '迴ｾ驥大所縺ｳ鬆宣≡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 100 },
    { id: 'MERCHANDISE', name: '蝠・刀', target: 'individual', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 101 },
    { id: 'STORED_GOODS', name: '雋ｯ阡ｵ蜩・, target: 'individual', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 102 },
    { id: 'MATERIALS', name: '譚先侭', target: 'individual', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 103 },
    { id: 'WORK_IN_PROGRESS', name: '莉墓寺蜩・, target: 'individual', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 104 },
    { id: 'PRODUCTS', name: '陬ｽ蜩・, target: 'individual', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 105 },
    { id: 'LOANS', name: '雋ｸ莉倬≡', target: 'individual', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 106 },
    { id: 'ADVANCE_PAID', name: '遶区崛驥・, target: 'individual', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 107 },
    { id: 'ACCRUED_REVENUE', name: '譛ｪ蜿朱≡', target: 'individual', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 108 },
    { id: 'FIXTURES', name: '蟾･蜈ｷ蝎ｨ蜈ｷ蛯吝刀', target: 'individual', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 109 },
    { id: 'MACHINERY', name: '讖滓｢ｰ陬・ｽｮ', target: 'individual', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 110 },
    { id: 'STARTUP_COSTS', name: '髢区･ｭ雋ｻ', target: 'individual', category: '郢ｰ蟒ｶ雉・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 111 },
    { id: 'OWNER_DRAWING', name: '莠区･ｭ荳ｻ雋ｸ', target: 'individual', category: '莠区･ｭ荳ｻ雋ｸ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 112 },
    { id: 'OWNER_INVESTMENT', name: '莠区･ｭ荳ｻ蛟・, target: 'individual', category: '莠区･ｭ荳ｻ蛟・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 113 },
    { id: 'OWNER_CAPITAL', name: '蜈・・驥・, target: 'individual', category: '雉・悽縺ｮ驛ｨ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 114 },
    { id: 'BORROWINGS', name: '蛟溷・驥・, target: 'individual', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 115 },
    { id: 'ALLOWANCE_DOUBTFUL', name: '雋ｸ蛟貞ｼ募ｽ馴≡', target: 'individual', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 116 },
    { id: 'UNCONFIRMED', name: '譛ｪ遒ｺ螳壼鋸螳・, target: 'individual', category: '隲ｸ蜿｣', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 117 },

    // --- PL・亥倶ｺｺ・・---
    { id: 'SALES_RETURNS', name: '螢ｲ荳雁､蠑輔・霑泌刀', target: 'individual', category: '螢ｲ荳・, defaultTaxCategoryId: 'SALES_RETURN_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 120 },
    { id: 'PERSONAL_CONSUMPTION', name: '螳ｶ莠区ｶ郁ｲｻ遲・, target: 'individual', category: '螢ｲ荳・, defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 121 },
    { id: 'MISC_INCOME', name: '髮大庶蜈･', target: 'individual', category: '螢ｲ荳・, defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 122 },
    { id: 'BEGINNING_INVENTORY', name: '譛滄ｦ門膚蜩∵｣壼査鬮・, target: 'individual', category: '螢ｲ荳雁次萓｡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 123 },
    { id: 'PURCHASES', name: '莉募・鬮・, target: 'individual', category: '螢ｲ荳雁次萓｡', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 124 },
    { id: 'PURCHASE_RETURNS', name: '莉募・蛟､蠑輔・霑泌刀', target: 'individual', category: '螢ｲ荳雁次萓｡', defaultTaxCategoryId: 'PURCHASE_RETURN_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 125 },
    { id: 'ENDING_INVENTORY', name: '譛滓忰蝠・刀譽壼査鬮・, target: 'individual', category: '螢ｲ荳雁次萓｡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 126 },
    { id: 'INSURANCE', name: '謳榊ｮｳ菫晞匱譁・, target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 127 },
    { id: 'SUPPLIES', name: '豸郁怜刀雋ｻ', target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 128 },
    { id: 'WAGES', name: '邨ｦ譁呵ｳ・≡', target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 129 },
    { id: 'RETIREMENT_PAY', name: '騾閨ｷ邨ｦ荳・, target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 130 },
    { id: 'OUTSOURCING', name: '螟匁ｳｨ蟾･雉・, target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 131 },
    { id: 'INTEREST_DISCOUNT', name: '蛻ｩ蟄仙牡蠑墓侭', target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 132 },
    { id: 'BAD_DEBT_LOSS', name: '雋ｸ蛟帝≡(謳榊､ｱ)', target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'SALES_BAD_DEBT_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 133 },
    { id: 'TRAINING', name: '遐比ｿｮ謗｡逕ｨ雋ｻ', target: 'individual', category: '邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 134 },
    { id: 'BAD_DEBT_REVERSAL', name: '雋ｸ蛟貞ｼ募ｽ馴≡謌ｻ蜈･', target: 'individual', category: '郢ｰ謌ｻ鬘咲ｭ・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 135 },
    { id: 'FAMILY_EMPLOYEE_PAY', name: '蟆ょｾ楢・ｵｦ荳・, target: 'individual', category: '郢ｰ蜈･鬘咲ｭ・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 136 },
    { id: 'BAD_DEBT_PROVISION', name: '雋ｸ蛟貞ｼ募ｽ馴≡郢ｰ蜈･', target: 'individual', category: '郢ｰ蜈･鬘咲ｭ・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 137 },

    // ======================================================
    // 蛟倶ｺｺ蜷代￠繝ｻ荳榊虚逕｣謇蠕・窶・笨・SV遒ｺ隱肴ｸ医∩
    // ======================================================
    { id: 'RENTAL_INCOME', name: '雉・ｲｸ譁・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣蜿主・', defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 200 },
    { id: 'RENTAL_KEY_MONEY', name: '遉ｼ驥代・讓ｩ蛻ｩ驥第峩譁ｰ譁・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣蜿主・', defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 201 },
    { id: 'RENTAL_TRANSFER_FEE', name: '蜷咲ｾｩ譖ｸ謠帶侭縺昴・莉・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣蜿主・', defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 202 },
    { id: 'RENTAL_TAXES', name: '遘溽ｨ主・隱ｲ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 203 },
    { id: 'RENTAL_INSURANCE', name: '謳榊ｮｳ菫晞匱譁・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 204 },
    { id: 'RENTAL_REPAIRS', name: '菫ｮ郢戊ｲｻ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 205 },
    { id: 'RENTAL_DEPRECIATION', name: '貂帑ｾ｡蜆溷唆雋ｻ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 206 },
    { id: 'RENTAL_INTEREST', name: '蛟溷・驥大茜蟄・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 207 },
    { id: 'RENTAL_RENT', name: '蝨ｰ莉｣螳ｶ雉・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 208 },
    { id: 'RENTAL_WAGES', name: '邨ｦ譁呵ｳ・≡(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 209 },
    { id: 'RENTAL_OUTSOURCING', name: '螟匁ｳｨ邂｡逅・ｲｻ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 210 },
    { id: 'RENTAL_TRAVEL', name: '譌・ｲｻ莠､騾夊ｲｻ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 211 },
    { id: 'RENTAL_BOOKS', name: '譁ｰ閨槫峙譖ｸ雋ｻ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 212 },
    { id: 'RENTAL_OTHER', name: '縺昴・莉悶・邨瑚ｲｻ(荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣邨瑚ｲｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 213 },
    { id: 'RENTAL_FAMILY_PAY', name: '蟆ょｾ楢・ｵｦ荳・荳榊虚逕｣)', target: 'individual', category: '荳榊虚逕｣', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 214 },

    // ======================================================
    // 豕穂ｺｺ蜷代￠・・F繧ｯ繝ｩ繧ｦ繝我ｼ夊ｨ茨ｼ俄・笞・・譛ｪ遒ｺ隱・    // ======================================================

    // --- 豕穂ｺｺ蝗ｺ譛・BS ---
    { id: 'OTHER_DEPOSIT_CORP', name: '縺昴・莉悶・鬆宣≡', target: 'corp', category: '迴ｾ驥大所縺ｳ鬆宣≡', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 300 },
    { id: 'MERCHANDISE_CORP', name: '蝠・刀', target: 'corp', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 301 },
    { id: 'PRODUCTS_CORP', name: '陬ｽ蜩・, target: 'corp', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 302 },
    { id: 'MATERIALS_CORP', name: '譚先侭', target: 'corp', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 303 },
    { id: 'WORK_IN_PROGRESS_CORP', name: '莉墓寺蜩・, target: 'corp', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 304 },
    { id: 'STORED_GOODS_CORP', name: '雋ｯ阡ｵ蜩・, target: 'corp', category: '譽壼査雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 305 },
    { id: 'PREPAID_EXPENSES', name: '蜑肴鴛雋ｻ逕ｨ', target: 'corp', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 306 },
    { id: 'SHORT_TERM_LOANS', name: '遏ｭ譛溯ｲｸ莉倬≡', target: 'corp', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 307 },
    { id: 'ACCRUED_REVENUE_CORP', name: '譛ｪ蜿主・驥・, target: 'corp', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 308 },
    { id: 'ADVANCE_PAID_CORP', name: '遶区崛驥・, target: 'corp', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 309 },
    { id: 'ALLOWANCE_DOUBTFUL_CORP', name: '雋ｸ蛟貞ｼ募ｽ馴≡', target: 'corp', category: '縺昴・莉匁ｵ∝虚雉・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 310 },
    { id: 'BUILDING_EQUIPMENT_CORP', name: '蟒ｺ迚ｩ髯・ｱ櫁ｨｭ蛯・, target: 'corp', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 311 },
    { id: 'MACHINERY_CORP', name: '讖滓｢ｰ陬・ｽｮ', target: 'corp', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 312 },
    { id: 'FIXTURES_CORP', name: '蝎ｨ蜈ｷ蛯吝刀', target: 'corp', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 313 },
    { id: 'CONSTRUCTION_IN_PROGRESS', name: '蟒ｺ險ｭ莉ｮ蜍伜ｮ・, target: 'corp', category: '譛牙ｽ｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 314 },
    { id: 'SOFTWARE', name: '繧ｽ繝輔ヨ繧ｦ繧ｧ繧｢', target: 'corp', category: '辟｡蠖｢蝗ｺ螳夊ｳ・肇', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 315 },
    { id: 'INVESTMENT_SECURITIES', name: '謚戊ｳ・怏萓｡險ｼ蛻ｸ', target: 'corp', category: '謚戊ｳ・◎縺ｮ莉・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 316 },
    { id: 'LONG_TERM_LOANS', name: '髟ｷ譛溯ｲｸ莉倬≡', target: 'corp', category: '謚戊ｳ・◎縺ｮ莉・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 317 },
    { id: 'LONG_TERM_PREPAID', name: '髟ｷ譛溷燕謇戊ｲｻ逕ｨ', target: 'corp', category: '謚戊ｳ・◎縺ｮ莉・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 318 },
    { id: 'SHORT_TERM_BORROWINGS', name: '遏ｭ譛溷溷・驥・, target: 'corp', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 319 },
    { id: 'ACCRUED_LIABILITIES', name: '譛ｪ謇戊ｲｻ逕ｨ', target: 'corp', category: '縺昴・莉匁ｵ∝虚雋蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 320 },
    { id: 'OFFICER_BORROWINGS', name: '蠖ｹ蜩｡蛟溷・驥・, target: 'corp', category: '蝗ｺ螳夊ｲ蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 321 },
    { id: 'RETIREMENT_ALLOWANCE', name: '騾閨ｷ邨ｦ莉伜ｼ募ｽ馴≡', target: 'corp', category: '蝗ｺ螳夊ｲ蛯ｵ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 322 },
    { id: 'CAPITAL', name: '雉・悽驥・, target: 'corp', category: '邏碑ｳ・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 323 },
    { id: 'CAPITAL_RESERVE', name: '雉・悽貅門ｙ驥・, target: 'corp', category: '邏碑ｳ・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 324 },
    { id: 'RETAINED_EARNINGS', name: '郢ｰ雜雁茜逶雁臆菴咎≡', target: 'corp', category: '邏碑ｳ・肇', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 325 },

    // --- 豕穂ｺｺ蝗ｺ譛・PL ---
    { id: 'SALES_RETURNS_CORP', name: '螢ｲ荳雁､蠑輔・霑泌刀', target: 'corp', category: '螢ｲ荳・, defaultTaxCategoryId: 'SALES_RETURN_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 330 },
    { id: 'OUTSOURCING_CORP', name: '螟匁ｳｨ雋ｻ', target: 'corp', category: '螢ｲ荳雁次萓｡', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 331 },
    { id: 'PURCHASES_CORP', name: '莉募・鬮・, target: 'corp', category: '螢ｲ荳雁次萓｡', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 332 },
    { id: 'OFFICER_COMPENSATION', name: '蠖ｹ蜩｡蝣ｱ驟ｬ', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 333 },
    { id: 'SALARIES', name: '邨ｦ譁呎焔蠖・, target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 334 },
    { id: 'BONUSES', name: '雉樔ｸ・, target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 335 },
    { id: 'COMMUTING', name: '騾壼共雋ｻ', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 336 },
    { id: 'SUPPLIES_CORP', name: '豸郁怜刀雋ｻ', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 337 },
    { id: 'INSURANCE_CORP', name: '菫晞匱譁・, target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'PURCHASE_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 338 },
    { id: 'LEASE_CORP', name: '雉・滓侭', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 339 },
    { id: 'MEMBERSHIP_FEES', name: '隲ｸ莨夊ｲｻ', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 340 },
    { id: 'DONATIONS', name: '蟇・ｻ倬≡', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 341 },
    { id: 'BAD_DEBT_PROVISION_CORP', name: '雋ｸ蛟貞ｼ募ｽ馴≡郢ｰ蜈･鬘・, target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 342 },
    { id: 'BAD_DEBT_LOSS_CORP', name: '雋ｸ蛟呈錐螟ｱ', target: 'corp', category: '雋ｩ邂｡雋ｻ', defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 343 },
    { id: 'INTEREST_INCOME', name: '蜿怜叙蛻ｩ諱ｯ', target: 'corp', category: '蝟ｶ讌ｭ螟門庶逶・, defaultTaxCategoryId: 'SALES_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 344 },
    { id: 'DIVIDEND_INCOME', name: '蜿怜叙驟榊ｽ馴≡', target: 'corp', category: '蝟ｶ讌ｭ螟門庶逶・, defaultTaxCategoryId: 'COMMON_EXEMPT', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 345 },
    { id: 'MISC_INCOME_CORP', name: '髮大庶蜈･', target: 'corp', category: '蝟ｶ讌ｭ螟門庶逶・, defaultTaxCategoryId: 'SALES_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 346 },
    { id: 'INTEREST_EXPENSE', name: '謾ｯ謇募茜諱ｯ', target: 'corp', category: '蝟ｶ讌ｭ螟冶ｲｻ逕ｨ', defaultTaxCategoryId: 'PURCHASE_NON_TAXABLE', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 347 },
    { id: 'MISC_LOSS', name: '髮第錐螟ｱ', target: 'corp', category: '蝟ｶ讌ｭ螟冶ｲｻ逕ｨ', defaultTaxCategoryId: 'PURCHASE_TAXABLE_10', aiSelectable: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, sortOrder: 348 },
] as const

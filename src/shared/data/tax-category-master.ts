/**
 * 遞主玄蛻・・繧ｹ繧ｿ繝・・繧ｿ・・51莉ｶ・・ *
 * 譬ｹ諡: MF 繧ｯ繝ｩ繧ｦ繝我ｼ夊ｨ・遞主玄蛻・ｨｭ螳・.csv・・ocs/genzai/09_streamed/遞主玄蛻・ｨｭ螳・.csv・・ * 險ｭ險・ domain_type_design.md v2
 *
 * ID蜻ｽ蜷阪Ν繝ｼ繝ｫ:
 *   蜈ｱ騾・     COMMON_*
 *   螢ｲ荳・     SALES_*
 *   莉募・:     PURCHASE_*
 *   霈ｸ蜈･:     IMPORT_*
 *   邁｡譏楢ｪｲ遞・ *_T{1-6}
 *   霆ｽ貂帷ｨ守紫: *_REDUCED_*
 *   霑秘ｄ:     *_RETURN_*
 *   雋ｸ蛟・     *_BAD_DEBT_*
 *   蝗槫庶:     *_RECOVERY_*
 *
 * qualified: 驕ｩ譬ｼ蛻､螳壼ｯｾ雎｡・・TREAMED help/8090縺ｮ縲碁←譬ｼ蛻､螳壼ｯｾ雎｡縲阪メ繧ｧ繝・け逶ｸ蠖難ｼ・ *   竊・隱ｲ遞惹ｻ募・10%, 8%, (霆ｽ)8% 縺ｮ縺ｿtrue・亥・譛溷､・・ * aiSelectable: AI閾ｪ蜍暮∈謚槫庄蜷ｦ
 *   竊・STREAMED help/8369 閾ｪ蜍募愛螳壼ｯｾ雎｡縺ｮ縺ｿtrue
 * active: 縲御ｽｿ逕ｨ縲榊・縺・縺ｮ繧ゅ・true
 * defaultVisible: STREAMED蛻晄悄險ｭ螳・7莉ｶ + 繝・ヵ繧ｩ繝ｫ繝郁｡ｨ遉ｺ縺励◆縺・ｸｻ隕∝玄蛻・ * displayOrder: CSV荳ｦ縺ｳ鬆・ */

import type { TaxCategory } from '@/shared/types/tax-category'

export const TAX_CATEGORY_MASTER: readonly TaxCategory[] = [
    // ===== 蜈ｱ騾・=====
    { id: 'COMMON_UNKNOWN', name: '荳肴・', shortName: '荳肴・', direction: 'common', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 1 },
    { id: 'COMMON_EXEMPT', name: '蟇ｾ雎｡螟・, shortName: '蟇ｾ雎｡螟・, direction: 'common', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 2 },

    // ===== 螢ｲ荳・ 隱ｲ遞主｣ｲ荳・10% =====
    { id: 'SALES_TAXABLE_10', name: '隱ｲ遞主｣ｲ荳・10%', shortName: '隱ｲ螢ｲ 10%', direction: 'sales', qualified: false, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 3 },
    { id: 'SALES_TAXABLE_10_T1', name: '隱ｲ遞主｣ｲ荳・10% 荳遞ｮ', shortName: '隱ｲ螢ｲ 10% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 4 },
    { id: 'SALES_TAXABLE_10_T2', name: '隱ｲ遞主｣ｲ荳・10% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ 10% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 5 },
    { id: 'SALES_TAXABLE_10_T3', name: '隱ｲ遞主｣ｲ荳・10% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ 10% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 6 },
    { id: 'SALES_TAXABLE_10_T4', name: '隱ｲ遞主｣ｲ荳・10% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ 10% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 7 },
    { id: 'SALES_TAXABLE_10_T5', name: '隱ｲ遞主｣ｲ荳・10% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ 10% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 8 },
    { id: 'SALES_TAXABLE_10_T6', name: '隱ｲ遞主｣ｲ荳・10% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ 10% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 9 },

    // ===== 螢ｲ荳・ 隱ｲ遞主｣ｲ荳・(霆ｽ)8% =====
    { id: 'SALES_REDUCED_8', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8%', shortName: '隱ｲ螢ｲ (霆ｽ)8%', direction: 'sales', qualified: false, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 10 },
    { id: 'SALES_REDUCED_8_T1', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8% 荳遞ｮ', shortName: '隱ｲ螢ｲ (霆ｽ)8% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 11 },
    { id: 'SALES_REDUCED_8_T2', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ (霆ｽ)8% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 12 },
    { id: 'SALES_REDUCED_8_T3', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ (霆ｽ)8% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 13 },
    { id: 'SALES_REDUCED_8_T4', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ (霆ｽ)8% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 14 },
    { id: 'SALES_REDUCED_8_T5', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ (霆ｽ)8% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 15 },
    { id: 'SALES_REDUCED_8_T6', name: '隱ｲ遞主｣ｲ荳・(霆ｽ)8% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ (霆ｽ)8% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 16 },

    // ===== 螢ｲ荳・ 隱ｲ遞主｣ｲ荳・8% =====
    { id: 'SALES_TAXABLE_8', name: '隱ｲ遞主｣ｲ荳・8%', shortName: '隱ｲ螢ｲ 8%', direction: 'sales', qualified: false, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 17 },
    { id: 'SALES_TAXABLE_8_T1', name: '隱ｲ遞主｣ｲ荳・8% 荳遞ｮ', shortName: '隱ｲ螢ｲ 8% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 18 },
    { id: 'SALES_TAXABLE_8_T2', name: '隱ｲ遞主｣ｲ荳・8% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ 8% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 19 },
    { id: 'SALES_TAXABLE_8_T3', name: '隱ｲ遞主｣ｲ荳・8% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ 8% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 20 },
    { id: 'SALES_TAXABLE_8_T4', name: '隱ｲ遞主｣ｲ荳・8% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ 8% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 21 },
    { id: 'SALES_TAXABLE_8_T5', name: '隱ｲ遞主｣ｲ荳・8% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ 8% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 22 },
    { id: 'SALES_TAXABLE_8_T6', name: '隱ｲ遞主｣ｲ荳・8% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ 8% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 23 },

    // ===== 螢ｲ荳・ 隱ｲ遞主｣ｲ荳・5%・域立遞守紫・・=====
    { id: 'SALES_TAXABLE_5', name: '隱ｲ遞主｣ｲ荳・5%', shortName: '隱ｲ螢ｲ 5%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 24 },
    { id: 'SALES_TAXABLE_5_T1', name: '隱ｲ遞主｣ｲ荳・5% 荳遞ｮ', shortName: '隱ｲ螢ｲ 5% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 25 },
    { id: 'SALES_TAXABLE_5_T2', name: '隱ｲ遞主｣ｲ荳・5% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ 5% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 26 },
    { id: 'SALES_TAXABLE_5_T3', name: '隱ｲ遞主｣ｲ荳・5% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ 5% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 27 },
    { id: 'SALES_TAXABLE_5_T4', name: '隱ｲ遞主｣ｲ荳・5% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ 5% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 28 },
    { id: 'SALES_TAXABLE_5_T5', name: '隱ｲ遞主｣ｲ荳・5% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ 5% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 29 },
    { id: 'SALES_TAXABLE_5_T6', name: '隱ｲ遞主｣ｲ荳・5% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ 5% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 30 },

    // ===== 螢ｲ荳・ 霈ｸ蜃ｺ繝ｻ髱櫁ｪｲ遞弱・蟇ｾ雎｡螟・=====
    { id: 'SALES_EXPORT_0', name: '霈ｸ蜃ｺ螢ｲ荳・0%', shortName: '霈ｸ螢ｲ 0%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 31 },
    { id: 'SALES_NON_TAXABLE', name: '髱櫁ｪｲ遞主｣ｲ荳・, shortName: '髱槫｣ｲ', direction: 'sales', qualified: false, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 32 },
    { id: 'SALES_NON_TAXABLE_SECURITIES', name: '髱櫁ｪｲ遞主｣ｲ荳・譛我ｾ｡險ｼ蛻ｸ隴ｲ貂｡', shortName: '髱槫｣ｲ-譛芽ｨｼ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 33 },
    { id: 'SALES_NON_TAXABLE_EXPORT', name: '髱櫁ｪｲ遞手ｳ・肇霈ｸ蜃ｺ', shortName: '髱櫁ｼｸ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 34 },
    { id: 'SALES_EXEMPT', name: '蟇ｾ雎｡螟門｣ｲ荳・, shortName: '蟇ｾ雎｡螟門｣ｲ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 35 },

    // ===== 螢ｲ荳・ 霑秘ｄ 10% =====
    { id: 'SALES_RETURN_10', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10%', shortName: '隱ｲ螢ｲ-霑秘ｄ 10%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 36 },
    { id: 'SALES_RETURN_10_T1', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10% 荳遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 10% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 37 },
    { id: 'SALES_RETURN_10_T2', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 10% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 38 },
    { id: 'SALES_RETURN_10_T3', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 10% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 39 },
    { id: 'SALES_RETURN_10_T4', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 10% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 40 },
    { id: 'SALES_RETURN_10_T5', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 10% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 41 },
    { id: 'SALES_RETURN_10_T6', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・10% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 10% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 42 },

    // ===== 螢ｲ荳・ 霑秘ｄ (霆ｽ)8% =====
    { id: 'SALES_RETURN_REDUCED_8', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8%', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 43 },
    { id: 'SALES_RETURN_REDUCED_8_T1', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8% 荳遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 44 },
    { id: 'SALES_RETURN_REDUCED_8_T2', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 45 },
    { id: 'SALES_RETURN_REDUCED_8_T3', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 46 },
    { id: 'SALES_RETURN_REDUCED_8_T4', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 47 },
    { id: 'SALES_RETURN_REDUCED_8_T5', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 48 },
    { id: 'SALES_RETURN_REDUCED_8_T6', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・(霆ｽ)8% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ (霆ｽ)8% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 49 },

    // ===== 螢ｲ荳・ 霑秘ｄ 8% =====
    { id: 'SALES_RETURN_8', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8%', shortName: '隱ｲ螢ｲ-霑秘ｄ 8%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 50 },
    { id: 'SALES_RETURN_8_T1', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8% 荳遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 8% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 51 },
    { id: 'SALES_RETURN_8_T2', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 8% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 52 },
    { id: 'SALES_RETURN_8_T3', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 8% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 53 },
    { id: 'SALES_RETURN_8_T4', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 8% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 54 },
    { id: 'SALES_RETURN_8_T5', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 8% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 55 },
    { id: 'SALES_RETURN_8_T6', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・8% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 8% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 56 },

    // ===== 螢ｲ荳・ 霑秘ｄ 5%・域立遞守紫・・=====
    { id: 'SALES_RETURN_5', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5%', shortName: '隱ｲ螢ｲ-霑秘ｄ 5%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 57 },
    { id: 'SALES_RETURN_5_T1', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5% 荳遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 5% 荳遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 58 },
    { id: 'SALES_RETURN_5_T2', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5% 莠檎ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 5% 莠檎ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 59 },
    { id: 'SALES_RETURN_5_T3', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5% 荳臥ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 5% 荳臥ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 60 },
    { id: 'SALES_RETURN_5_T4', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5% 蝗帷ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 5% 蝗帷ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 61 },
    { id: 'SALES_RETURN_5_T5', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5% 莠皮ｨｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 5% 莠皮ｨｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 62 },
    { id: 'SALES_RETURN_5_T6', name: '隱ｲ遞主｣ｲ荳・霑秘ｄ遲・5% 蜈ｭ遞ｮ', shortName: '隱ｲ螢ｲ-霑秘ｄ 5% 蜈ｭ遞ｮ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 63 },

    // ===== 螢ｲ荳・ 霈ｸ蜃ｺ霑秘ｄ繝ｻ髱櫁ｪｲ遞手ｿ秘ｄ =====
    { id: 'SALES_EXPORT_RETURN_0', name: '霈ｸ蜃ｺ螢ｲ荳・霑秘ｄ遲・0%', shortName: '霈ｸ螢ｲ-霑秘ｄ 0%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 64 },
    { id: 'SALES_NON_TAXABLE_RETURN', name: '髱櫁ｪｲ遞主｣ｲ荳・霑秘ｄ遲・, shortName: '髱槫｣ｲ-霑秘ｄ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 65 },
    { id: 'SALES_NON_TAXABLE_EXPORT_RETURN', name: '髱櫁ｪｲ遞手ｳ・肇霈ｸ蜃ｺ-霑秘ｄ遲・, shortName: '髱櫁ｼｸ-霑秘ｄ', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 66 },

    // ===== 螢ｲ荳・ 雋ｸ蛟・=====
    { id: 'SALES_BAD_DEBT_10', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟・10%', shortName: '隱ｲ螢ｲ-雋ｸ蛟・10%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 67 },
    { id: 'SALES_BAD_DEBT_REDUCED_8', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟・(霆ｽ)8%', shortName: '隱ｲ螢ｲ-雋ｸ蛟・(霆ｽ)8%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 68 },
    { id: 'SALES_BAD_DEBT_8', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟・8%', shortName: '隱ｲ螢ｲ-雋ｸ蛟・8%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 69 },
    { id: 'SALES_BAD_DEBT_5', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟・5%', shortName: '隱ｲ螢ｲ-雋ｸ蛟・5%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 70 },
    { id: 'SALES_EXPORT_BAD_DEBT_0', name: '霈ｸ蜃ｺ螢ｲ荳・雋ｸ蛟・0%', shortName: '霈ｸ螢ｲ-雋ｸ蛟・0%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 71 },
    { id: 'SALES_NON_TAXABLE_BAD_DEBT', name: '髱櫁ｪｲ遞主｣ｲ荳・雋ｸ蛟・, shortName: '髱槫｣ｲ-雋ｸ蛟・, direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 72 },
    { id: 'SALES_NON_TAXABLE_EXPORT_BAD_DEBT', name: '髱櫁ｪｲ遞手ｳ・肇霈ｸ蜃ｺ-雋ｸ蛟・, shortName: '髱櫁ｼｸ-雋ｸ蛟・, direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 73 },

    // ===== 螢ｲ荳・ 雋ｸ蛟貞屓蜿・=====
    { id: 'SALES_RECOVERY_10', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟貞屓蜿・10%', shortName: '隱ｲ螢ｲ-蝗槫庶 10%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 74 },
    { id: 'SALES_RECOVERY_REDUCED_8', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟貞屓蜿・(霆ｽ)8%', shortName: '隱ｲ螢ｲ-蝗槫庶 (霆ｽ)8%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 75 },
    { id: 'SALES_RECOVERY_8', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟貞屓蜿・8%', shortName: '隱ｲ螢ｲ-蝗槫庶 8%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 76 },
    { id: 'SALES_RECOVERY_5', name: '隱ｲ遞主｣ｲ荳・雋ｸ蛟貞屓蜿・5%', shortName: '隱ｲ螢ｲ-蝗槫庶 5%', direction: 'sales', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 77 },

    // ===== 莉募・: 隱ｲ遞惹ｻ募・ =====
    { id: 'PURCHASE_TAXABLE_10', name: '隱ｲ遞惹ｻ募・ 10%', shortName: '隱ｲ莉・10%', direction: 'purchase', qualified: true, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 78 },
    { id: 'PURCHASE_COMMON_10', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・ 10%', shortName: '蜈ｱ-隱ｲ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 79 },
    { id: 'PURCHASE_NT_10', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・ 10%', shortName: '髱・隱ｲ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 80 },
    { id: 'PURCHASE_REDUCED_8', name: '隱ｲ遞惹ｻ募・ (霆ｽ)8%', shortName: '隱ｲ莉・(霆ｽ)8%', direction: 'purchase', qualified: true, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 81 },
    { id: 'PURCHASE_COMMON_REDUCED_8', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・ (霆ｽ)8%', shortName: '蜈ｱ-隱ｲ莉・(霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 82 },
    { id: 'PURCHASE_NT_REDUCED_8', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・ (霆ｽ)8%', shortName: '髱・隱ｲ莉・(霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 83 },
    { id: 'PURCHASE_TAXABLE_8', name: '隱ｲ遞惹ｻ募・ 8%', shortName: '隱ｲ莉・8%', direction: 'purchase', qualified: true, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 84 },
    { id: 'PURCHASE_COMMON_8', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・ 8%', shortName: '蜈ｱ-隱ｲ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 85 },
    { id: 'PURCHASE_NT_8', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・ 8%', shortName: '髱・隱ｲ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 86 },
    { id: 'PURCHASE_TAXABLE_5', name: '隱ｲ遞惹ｻ募・ 5%', shortName: '隱ｲ莉・5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 87 },
    { id: 'PURCHASE_COMMON_5', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・ 5%', shortName: '蜈ｱ-隱ｲ莉・5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 88 },
    { id: 'PURCHASE_NT_5', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・ 5%', shortName: '髱・隱ｲ莉・5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 89 },

    // ===== 莉募・: 霈ｸ蜈･莉募・ 10% =====
    { id: 'IMPORT_BODY_10', name: '霈ｸ蜈･莉募・-譛ｬ菴・10%', shortName: '霈ｸ莉・譛ｬ菴・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 90 },
    { id: 'IMPORT_TAX_7_8', name: '霈ｸ蜈･莉募・-豸郁ｲｻ遞朱｡・7.8%', shortName: '霈ｸ莉・豸育ｨ・7.8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 91 },
    { id: 'IMPORT_LOCAL_2_2', name: '霈ｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・2.2%', shortName: '霈ｸ莉・蝨ｰ遞・2.2%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 92 },
    { id: 'IMPORT_COMMON_BODY_10', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-譛ｬ菴・10%', shortName: '蜈ｱ-霈ｸ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 93 },
    { id: 'IMPORT_COMMON_TAX_7_8', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-豸郁ｲｻ遞朱｡・7.8%', shortName: '蜈ｱ-霈ｸ莉・豸育ｨ・7.8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 94 },
    { id: 'IMPORT_COMMON_LOCAL_2_2', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・2.2%', shortName: '蜈ｱ-霈ｸ莉・蝨ｰ遞・2.2%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 95 },
    { id: 'IMPORT_NT_BODY_10', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-譛ｬ菴・10%', shortName: '髱・霈ｸ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 96 },
    { id: 'IMPORT_NT_TAX_7_8', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-豸郁ｲｻ遞朱｡・7.8%', shortName: '髱・霈ｸ莉・豸育ｨ・7.8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 97 },
    { id: 'IMPORT_NT_LOCAL_2_2', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・2.2%', shortName: '髱・霈ｸ莉・蝨ｰ遞・2.2%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 98 },

    // ===== 莉募・: 霈ｸ蜈･莉募・ (霆ｽ)8% =====
    { id: 'IMPORT_BODY_REDUCED_8', name: '霈ｸ蜈･莉募・-譛ｬ菴・(霆ｽ)8%', shortName: '霈ｸ莉・譛ｬ菴・(霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 99 },
    { id: 'IMPORT_TAX_REDUCED_6_24', name: '霈ｸ蜈･莉募・-豸郁ｲｻ遞朱｡・(霆ｽ)6.24%', shortName: '霈ｸ莉・豸育ｨ・(霆ｽ)6.24%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 100 },
    { id: 'IMPORT_LOCAL_REDUCED_1_76', name: '霈ｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・(霆ｽ)1.76%', shortName: '霈ｸ莉・蝨ｰ遞・(霆ｽ)1.76%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 101 },
    { id: 'IMPORT_COMMON_BODY_REDUCED_8', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-譛ｬ菴・(霆ｽ)8%', shortName: '蜈ｱ-霈ｸ莉・(霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 102 },
    { id: 'IMPORT_COMMON_TAX_REDUCED_6_24', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-豸郁ｲｻ遞朱｡・(霆ｽ)6.24%', shortName: '蜈ｱ-霈ｸ莉・豸育ｨ・(霆ｽ)6.24%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 103 },
    { id: 'IMPORT_COMMON_LOCAL_REDUCED_1_76', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・(霆ｽ)1.76%', shortName: '蜈ｱ-霈ｸ莉・蝨ｰ遞・(霆ｽ)1.76%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 104 },
    { id: 'IMPORT_NT_BODY_REDUCED_8', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-譛ｬ菴・(霆ｽ)8%', shortName: '髱・霈ｸ莉・(霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 105 },
    { id: 'IMPORT_NT_TAX_REDUCED_6_24', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-豸郁ｲｻ遞朱｡・(霆ｽ)6.24%', shortName: '髱・霈ｸ莉・豸育ｨ・(霆ｽ)6.24%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 106 },
    { id: 'IMPORT_NT_LOCAL_REDUCED_1_76', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・(霆ｽ)1.76%', shortName: '髱・霈ｸ莉・蝨ｰ遞・(霆ｽ)1.76%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 107 },

    // ===== 莉募・: 霈ｸ蜈･莉募・ 8% =====
    { id: 'IMPORT_BODY_8', name: '霈ｸ蜈･莉募・-譛ｬ菴・8%', shortName: '霈ｸ莉・譛ｬ菴・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 108 },
    { id: 'IMPORT_TAX_6_3', name: '霈ｸ蜈･莉募・-豸郁ｲｻ遞朱｡・6.3%', shortName: '霈ｸ莉・豸育ｨ・6.3%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 109 },
    { id: 'IMPORT_LOCAL_1_7', name: '霈ｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・1.7%', shortName: '霈ｸ莉・蝨ｰ遞・1.7%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 110 },
    { id: 'IMPORT_COMMON_BODY_8', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-譛ｬ菴・8%', shortName: '蜈ｱ-霈ｸ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 111 },
    { id: 'IMPORT_COMMON_TAX_6_3', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-豸郁ｲｻ遞朱｡・6.3%', shortName: '蜈ｱ-霈ｸ莉・豸育ｨ・6.3%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 112 },
    { id: 'IMPORT_COMMON_LOCAL_1_7', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・1.7%', shortName: '蜈ｱ-霈ｸ莉・蝨ｰ遞・1.7%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 113 },
    { id: 'IMPORT_NT_BODY_8', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-譛ｬ菴・8%', shortName: '髱・霈ｸ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 114 },
    { id: 'IMPORT_NT_TAX_6_3', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-豸郁ｲｻ遞朱｡・6.3%', shortName: '髱・霈ｸ莉・豸育ｨ・6.3%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 115 },
    { id: 'IMPORT_NT_LOCAL_1_7', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・1.7%', shortName: '髱・霈ｸ莉・蝨ｰ遞・1.7%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 116 },

    // ===== 莉募・: 霈ｸ蜈･莉募・ 5%・域立遞守紫・・=====
    { id: 'IMPORT_BODY_5', name: '霈ｸ蜈･莉募・-譛ｬ菴・5%', shortName: '霈ｸ莉・譛ｬ菴・5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 117 },
    { id: 'IMPORT_TAX_4', name: '霈ｸ蜈･莉募・-豸郁ｲｻ遞朱｡・4%', shortName: '霈ｸ莉・豸育ｨ・4%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 118 },
    { id: 'IMPORT_LOCAL_1', name: '霈ｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・1%', shortName: '霈ｸ莉・蝨ｰ遞・1%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 119 },
    { id: 'IMPORT_COMMON_BODY_5', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-譛ｬ菴・5%', shortName: '蜈ｱ-霈ｸ莉・5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 120 },
    { id: 'IMPORT_COMMON_TAX_4', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-豸郁ｲｻ遞朱｡・4%', shortName: '蜈ｱ-霈ｸ莉・豸育ｨ・4%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 121 },
    { id: 'IMPORT_COMMON_LOCAL_1', name: '蜈ｱ騾夊ｼｸ蜈･莉募・-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・1%', shortName: '蜈ｱ-霈ｸ莉・蝨ｰ遞・1%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 122 },
    { id: 'IMPORT_NT_BODY_5', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-譛ｬ菴・5%', shortName: '髱・霈ｸ莉・5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 123 },
    { id: 'IMPORT_NT_TAX_4', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-豸郁ｲｻ遞朱｡・4%', shortName: '髱・霈ｸ莉・豸育ｨ・4%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 124 },
    { id: 'IMPORT_NT_LOCAL_1', name: '髱櫁ｪｲ遞主ｯｾ蠢懆ｼｸ蜈･-蝨ｰ譁ｹ豸郁ｲｻ遞朱｡・1%', shortName: '髱・霈ｸ莉・蝨ｰ遞・1%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 125 },

    // ===== 莉募・: 迚ｹ螳夊ｪｲ遞惹ｻ募・ =====
    { id: 'PURCHASE_SPECIFIC_10', name: '迚ｹ螳夊ｪｲ遞惹ｻ募・ 10%', shortName: '迚ｹ螳夊ｪｲ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 126 },
    { id: 'PURCHASE_SPECIFIC_COMMON_10', name: '蜈ｱ騾夂音螳夊ｪｲ遞惹ｻ募・ 10%', shortName: '蜈ｱ-迚ｹ螳夊ｪｲ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 127 },
    { id: 'PURCHASE_SPECIFIC_NT_10', name: '髱櫁ｪｲ遞主ｯｾ蠢懃音螳夊ｪｲ遞惹ｻ募・ 10%', shortName: '髱・迚ｹ螳夊ｪｲ莉・10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 128 },
    { id: 'PURCHASE_SPECIFIC_8', name: '迚ｹ螳夊ｪｲ遞惹ｻ募・ 8%', shortName: '迚ｹ螳夊ｪｲ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 129 },
    { id: 'PURCHASE_SPECIFIC_COMMON_8', name: '蜈ｱ騾夂音螳夊ｪｲ遞惹ｻ募・ 8%', shortName: '蜈ｱ-迚ｹ螳夊ｪｲ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 130 },
    { id: 'PURCHASE_SPECIFIC_NT_8', name: '髱櫁ｪｲ遞主ｯｾ蠢懃音螳夊ｪｲ遞惹ｻ募・ 8%', shortName: '髱・迚ｹ螳夊ｪｲ莉・8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 131 },

    // ===== 莉募・: 髱櫁ｪｲ遞弱・蟇ｾ雎｡螟・=====
    { id: 'PURCHASE_NON_TAXABLE', name: '髱櫁ｪｲ遞惹ｻ募・', shortName: '髱樔ｻ・, direction: 'purchase', qualified: false, aiSelectable: true, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 132 },
    { id: 'PURCHASE_EXEMPT', name: '蟇ｾ雎｡螟紋ｻ募・', shortName: '蟇ｾ雎｡螟紋ｻ・, direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 133 },

    // ===== 莉募・: 霑秘ｄ 10% =====
    { id: 'PURCHASE_RETURN_10', name: '隱ｲ遞惹ｻ募・-霑秘ｄ遲・10%', shortName: '隱ｲ莉・霑秘ｄ 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 134 },
    { id: 'PURCHASE_RETURN_COMMON_10', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・10%', shortName: '蜈ｱ-隱ｲ莉・霑秘ｄ 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 135 },
    { id: 'PURCHASE_RETURN_NT_10', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・-霑秘ｄ遲・10%', shortName: '髱・隱ｲ莉・霑秘ｄ 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 136 },

    // ===== 莉募・: 霑秘ｄ (霆ｽ)8% =====
    { id: 'PURCHASE_RETURN_REDUCED_8', name: '隱ｲ遞惹ｻ募・-霑秘ｄ遲・(霆ｽ)8%', shortName: '隱ｲ莉・霑秘ｄ (霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 137 },
    { id: 'PURCHASE_RETURN_COMMON_REDUCED_8', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・(霆ｽ)8%', shortName: '蜈ｱ-隱ｲ莉・霑秘ｄ (霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 138 },
    { id: 'PURCHASE_RETURN_NT_REDUCED_8', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・-霑秘ｄ遲・(霆ｽ)8%', shortName: '髱・隱ｲ莉・霑秘ｄ (霆ｽ)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 139 },

    // ===== 莉募・: 霑秘ｄ 8% =====
    { id: 'PURCHASE_RETURN_8', name: '隱ｲ遞惹ｻ募・-霑秘ｄ遲・8%', shortName: '隱ｲ莉・霑秘ｄ 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: true, displayOrder: 140 },
    { id: 'PURCHASE_RETURN_COMMON_8', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・8%', shortName: '蜈ｱ-隱ｲ莉・霑秘ｄ 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 141 },
    { id: 'PURCHASE_RETURN_NT_8', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・-霑秘ｄ遲・8%', shortName: '髱・隱ｲ莉・霑秘ｄ 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 142 },

    // ===== 莉募・: 霑秘ｄ 5%・域立遞守紫・・=====
    { id: 'PURCHASE_RETURN_5', name: '隱ｲ遞惹ｻ募・-霑秘ｄ遲・5%', shortName: '隱ｲ莉・霑秘ｄ 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 143 },
    { id: 'PURCHASE_RETURN_COMMON_5', name: '蜈ｱ騾夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・5%', shortName: '蜈ｱ-隱ｲ莉・霑秘ｄ 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 144 },
    { id: 'PURCHASE_RETURN_NT_5', name: '髱櫁ｪｲ遞主ｯｾ蠢應ｻ募・-霑秘ｄ遲・5%', shortName: '髱・隱ｲ莉・霑秘ｄ 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 145 },

    // ===== 莉募・: 迚ｹ螳夊ｪｲ遞惹ｻ募・-霑秘ｄ =====
    { id: 'PURCHASE_SPECIFIC_RETURN_10', name: '迚ｹ螳夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・10%', shortName: '迚ｹ螳夊ｪｲ莉・霑秘ｄ 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 146 },
    { id: 'PURCHASE_SPECIFIC_RETURN_COMMON_10', name: '蜈ｱ騾夂音螳夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・10%', shortName: '蜈ｱ-迚ｹ螳夊ｪｲ莉・霑秘ｄ 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 147 },
    { id: 'PURCHASE_SPECIFIC_RETURN_NT_10', name: '髱櫁ｪｲ遞主ｯｾ蠢懃音螳夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・10%', shortName: '髱・迚ｹ螳夊ｪｲ莉・霑秘ｄ 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 148 },
    { id: 'PURCHASE_SPECIFIC_RETURN_8', name: '迚ｹ螳夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・8%', shortName: '迚ｹ螳夊ｪｲ莉・霑秘ｄ 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 149 },
    { id: 'PURCHASE_SPECIFIC_RETURN_COMMON_8', name: '蜈ｱ騾夂音螳夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・8%', shortName: '蜈ｱ-迚ｹ螳夊ｪｲ莉・霑秘ｄ 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 150 },
    { id: 'PURCHASE_SPECIFIC_RETURN_NT_8', name: '髱櫁ｪｲ遞主ｯｾ蠢懃音螳夊ｪｲ遞惹ｻ募・-霑秘ｄ遲・8%', shortName: '髱・迚ｹ螳夊ｪｲ莉・霑秘ｄ 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: , deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, defaultVisible: false, displayOrder: 151 },
] as const

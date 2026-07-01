/**
 * industry_vector_corporate.ts — T-06a: 法人用業種ベクトル辞書
 *
 * 準拠: vendor_vector_41_reference.md（68種: telecom/saas分割後。2026-04-05更新）
 * 全科目ID: ACCOUNT_MASTER（data/account-master.json）準拠 — ローマ字ID（§50移行済み）
 *
 * 用途: パイプライン Step 4（科目確定）で、
 *   vendor_vector + direction → 科目候補リストを取得する。
 *   LDI社・ABC社など法人顧問先で使用。
 */

import type { IndustryVectorEntry } from '@/types/pipeline/vendor.type';

/** 法人用 業種ベクトル → 科目候補マッピング（68種: telecom/saas分割後。telecom_saasはdeprecated） */
export const INDUSTRY_VECTOR_CORPORATE: IndustryVectorEntry[] = [
  // ── 🍽️ 飲食（2種）──
  { vector: 'restaurant',        expense: ['KAIGIHI_CORP', 'SETTAIKOUSAIHI_CORP'],                                       income: [] },
  { vector: 'cafe',              expense: ['KAIGIHI_CORP'],                                                              income: [] },

  // ── 🛒 小売（19種）──
  { vector: 'food_market',       expense: ['KAIGIHI_CORP', 'SHIIREDAKA_CORP'],                                           income: [] },
  { vector: 'supermarket',       expense: ['BIHINSHOUMOUHINHI_CORP', 'SHIIREDAKA_CORP'],                                 income: [] },
  { vector: 'convenience_store', expense: ['BIHINSHOUMOUHINHI_CORP', 'KAIGIHI_CORP'],                                   income: [] },
  { vector: 'general_goods',     expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'souvenir',          expense: ['SETTAIKOUSAIHI_CORP'],                                                       income: [] },
  { vector: 'drugstore',         expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'apparel',           expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'cosmetics',         expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'books',             expense: ['SHINBUNTOSHOHI_CORP'],                                                       income: [] },
  { vector: 'electronics',       expense: ['BIHINSHOUMOUHINHI_CORP', 'KOUGUKIGUBIHIN_CORP', 'SHIIREDAKA_CORP'],          income: [] },
  { vector: 'bicycle',           expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'sports_goods',      expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'media_disc',        expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'jewelry',           expense: ['BIHINSHOUMOUHINHI_CORP', 'SETTAIKOUSAIHI_CORP'],                             income: [] },
  { vector: 'florist',           expense: ['SETTAIKOUSAIHI_CORP'],                                                       income: [] },
  { vector: 'auto_dealer',       expense: ['SHARYOUHI_CORP', 'SHUUZENHI_CORP'],                                         income: [] },
  { vector: 'auto_parts',        expense: ['SHARYOUHI_CORP'],                                                            income: [] },
  { vector: 'building_materials',expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'stationery',        expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },

  // ── 🔧 サービス（19種）──
  { vector: 'beauty',            expense: ['FUKURIKOUSEIHI_CORP'],                                                       income: [] },
  { vector: 'printing',          expense: ['KOUKOKUSENDENHI_CORP'],                                                      income: [] },
  { vector: 'advertising',       expense: ['KOUKOKUSENDENHI_CORP'],                                                      income: [] },
  { vector: 'post_office',       expense: ['TSUUSHINHI_CORP', 'SHIHARAITESUURYOU_CORP', 'SOZEIKOUKAI_CORP'],             income: [] },
  { vector: 'waste',             expense: ['SHIHARAITESUURYOU_CORP'],                                                    income: [] },
  { vector: 'it_service',        expense: ['TSUUSHINHI_CORP', 'SHIHARAITESUURYOU_CORP'],                                 income: [] },
  // @deprecated telecom_saas → telecom / saas に分割（2026-04-05）
  { vector: 'telecom_saas',      expense: ['TSUUSHINHI_CORP', 'SHIHARAITESUURYOU_CORP'],                                 income: [] },
  { vector: 'telecom',           expense: ['TSUUSHINHI_CORP'],                                                           income: [] },  // A確定: 携帯・固定回線・ISP
  { vector: 'saas',              expense: ['TSUUSHINHI_CORP', 'SHIHARAITESUURYOU_CORP'],                                 income: [] },  // insufficient: AWS/Google/Microsoft等
  { vector: 'education',         expense: ['KENSHUUSAIYOUHI_CORP'],                                                      income: [] },
  { vector: 'outsourcing',       expense: ['GAICHUUHI_CORP'],                                                            income: [] },
  { vector: 'lease_rental',      expense: ['RIISURYOU_CORP', 'RIISURYOU_CORP'],                                         income: [] },
  { vector: 'staffing',          expense: ['GAICHUUHI_CORP'],                                                            income: [] },
  { vector: 'camera_dpe',        expense: ['BIHINSHOUMOUHINHI_CORP'],                                                    income: [] },
  { vector: 'funeral',           expense: ['SETTAIKOUSAIHI_CORP'],                                                       income: [] },
  { vector: 'platform',          expense: ['SHIHARAITESUURYOU_CORP', 'KOUKOKUSENDENHI_CORP'],                            income: ['URIAGEDAKA_CORP'] },
  { vector: 'ec_site',           expense: ['BIHINSHOUMOUHINHI_CORP', 'SHIIREDAKA_CORP', 'KOUKOKUSENDENHI_CORP'],         income: ['URIAGEDAKA_CORP'] },
  { vector: 'logistics',         expense: ['NIZUKURIUNCHIN_CORP'],                                                       income: [] },
  { vector: 'consulting',        expense: ['SHIHARAITESUURYOU_CORP', 'GAICHUUHI_CORP'],                                 income: [] },
  { vector: 'legal_firm',        expense: ['SHIHARAITESUURYOU_CORP'],                                                    income: [] },
  { vector: 'construction',      expense: ['GAICHUUHI_CORP'],                                                            income: [] },

  // ── 🏢 不動産・保険（2種）──
  { vector: 'real_estate',       expense: ['CHIDAIYACHIN_CORP', 'SHUUZENHI_CORP'],                                      income: [] },
  { vector: 'insurance',         expense: ['HOKENRYOU_CORP'],                                                            income: [] },

  // ── 🎾 スポーツ・娯楽（5種）──
  { vector: 'entertainment',     expense: ['SETTAIKOUSAIHI_CORP', 'FUKURIKOUSEIHI_CORP'],                                income: [] },
  { vector: 'leisure',           expense: ['FUKURIKOUSEIHI_CORP', 'SETTAIKOUSAIHI_CORP'],                                income: [] },
  { vector: 'cinema_music',      expense: ['SETTAIKOUSAIHI_CORP'],                                                       income: [] },
  { vector: 'spa',               expense: ['FUKURIKOUSEIHI_CORP'],                                                       income: [] },
  { vector: 'travel_agency',     expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },

  // ── 🚃 交通機関（9種）──
  { vector: 'gas_station',       expense: ['SHARYOUHI_CORP'],                                                            income: [] },  // A確定: VEHICLE_COSTS（2026-04-05変更）
  { vector: 'taxi',              expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'rental_car',        expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'train',             expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'bus',               expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'highway',           expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'airline_ship',      expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'parking',           expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },
  { vector: 'hotel',             expense: ['RYOHIKOUTSUUHI_CORP'],                                                       income: [] },

  // ── 🏛️ 公共機関（5種）──
  { vector: 'utility',           expense: ['SUIDOUKOUNETSUHI_CORP'],                                                     income: [] },
  { vector: 'government',        expense: ['SOZEIKOUKAI_CORP'/*租税公課*/, 'SHIHARAITESUURYOU_CORP'/*支払手数料*/, 'HOUTEIFUKURIHI_CORP'/*法定福利費*/],
    // ▶ SUBSIDY_INCOME（補助金収入）は ACCOUNT_MASTER（勘定科目マスタ）に存在しない。
    //   「存在しない」ことが正しい設計。二度と追加するな。
    //   補助金入金は ZATSUSHUUNYUU_CORP（雑収入・法人）で処理する。
    income: ['ZATSUSHUUNYUU_CORP'/*雑収入・法人*/] },
  { vector: 'social_insurance',  expense: ['HOUTEIFUKURIHI_CORP'],                                                       income: [] },
  { vector: 'medical',           expense: ['FUKURIKOUSEIHI_CORP'],                                                       income: [] },
  { vector: 'religious',         expense: ['KIFUKIN_CORP', 'SHOKAIHI_CORP', 'SHIHARAITESUURYOU_CORP'],                   income: [] },

  // ── 💰 金融（1種）──
  { vector: 'financial',         expense: ['CHOUKIKARIIREKIN_CORP', 'SHIHARAIRISOKU_CORP', 'SHIHARAITESUURYOU_CORP'],     income: ['CHOUKIKARIIREKIN_CORP', 'UKETORIRISOKU_CORP'] },

  // ── 👤 個人・卸売・会費・不明（4種）──
  { vector: 'individual',        expense: ['GAICHUUHI_CORP', 'KYUURYOUCHINGIN_CORP', 'YAKUINHOUSHUU_CORP', 'TATEKAEKIN_CORP', 'YAKUINKASHITSUKEKIN_CORP', 'KARIBARAIKIN_CORP'], income: ['URIAGEDAKA_CORP', 'TATEKAEKIN_CORP', 'ZATSUSHUUNYUU_CORP', 'YAKUINKARIIREKIN_CORP', 'AZUKARIKIN_CORP'] },
  { vector: 'wholesale',         expense: ['SHIIREDAKA_CORP'],                                                           income: [] },
  { vector: 'association',       expense: ['SHOKAIHI_CORP', 'SETTAIKOUSAIHI_CORP'],                                     income: [] },
  { vector: 'unknown',           expense: [],                                                                             income: [] },
];

/**
 * industry_vector_corporate.ts — T-06a: 法人用業種ベクトル辞書
 *
 * 準拠: vendor_vector_41_reference.md（68種: telecom/saas分割後。2026-04-05更新）
 * 全科目ID: ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 *
 * 用途: パイプライン Step 4（科目確定）で、
 *   vendor_vector + direction → 科目候補リストを取得する。
 *   LDI社・ABC社など法人顧問先で使用。
 */

import type { IndustryVectorEntry } from '@/mocks/types/pipeline/vendor.type';

/** 法人用 業種ベクトル → 科目候補マッピング（68種: telecom/saas分割後。telecom_saasはdeprecated） */
export const INDUSTRY_VECTOR_CORPORATE: IndustryVectorEntry[] = [
  // ── 🍽️ 飲食（2種）──
  { vector: 'restaurant',        expense: ['MEETING', 'ENTERTAINMENT'],                           income: [] },
  { vector: 'cafe',              expense: ['MEETING'],                                            income: [] },

  // ── 🛒 小売（19種）──
  { vector: 'food_market',       expense: ['MEETING', 'PURCHASES_CORP'],                          income: [] },
  { vector: 'supermarket',       expense: ['SUPPLIES_CORP', 'PURCHASES_CORP'],                    income: [] },
  { vector: 'convenience_store', expense: ['SUPPLIES_CORP', 'MEETING'],                           income: [] },
  { vector: 'general_goods',     expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'souvenir',          expense: ['ENTERTAINMENT'],                                      income: [] },
  { vector: 'drugstore',         expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'apparel',           expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'cosmetics',         expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'books',             expense: ['BOOKS_PERIODICALS'],                                  income: [] },
  { vector: 'electronics',       expense: ['SUPPLIES_CORP', 'FIXTURES_CORP', 'PURCHASES_CORP'],   income: [] },
  { vector: 'bicycle',           expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'sports_goods',      expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'media_disc',        expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'jewelry',           expense: ['SUPPLIES_CORP', 'ENTERTAINMENT'],                     income: [] },
  { vector: 'florist',           expense: ['ENTERTAINMENT'],                                      income: [] },
  { vector: 'auto_dealer',       expense: ['VEHICLE_COSTS', 'REPAIRS'],                           income: [] },
  { vector: 'auto_parts',        expense: ['VEHICLE_COSTS'],                                      income: [] },
  { vector: 'building_materials',expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'stationery',        expense: ['SUPPLIES_CORP'],                                      income: [] },

  // ── 🔧 サービス（19種）──
  { vector: 'beauty',            expense: ['WELFARE'],                                            income: [] },
  { vector: 'printing',          expense: ['ADVERTISING'],                                        income: [] },
  { vector: 'advertising',       expense: ['ADVERTISING'],                                        income: [] },
  { vector: 'post_office',       expense: ['COMMUNICATION', 'FEES', 'TAXES_DUES'],                income: [] },
  { vector: 'waste',             expense: ['FEES'],                                               income: [] },
  { vector: 'it_service',        expense: ['COMMUNICATION', 'FEES'],                              income: [] },
  // @deprecated telecom_saas → telecom / saas に分割（2026-04-05）
  { vector: 'telecom_saas',      expense: ['COMMUNICATION', 'FEES'],                              income: [] },
  { vector: 'telecom',           expense: ['COMMUNICATION'],                                      income: [] },  // A確定: 携帯・固定回線・ISP
  { vector: 'saas',              expense: ['COMMUNICATION', 'FEES'],                              income: [] },  // insufficient: AWS/Google/Microsoft等
  { vector: 'education',         expense: ['TRAINING'],                                           income: [] },
  { vector: 'outsourcing',       expense: ['OUTSOURCING_CORP'],                                   income: [] },
  { vector: 'lease_rental',      expense: ['LEASE_CORP', 'LEASE'],                                income: [] },
  { vector: 'staffing',          expense: ['OUTSOURCING_CORP'],                                   income: [] },
  { vector: 'camera_dpe',        expense: ['SUPPLIES_CORP'],                                      income: [] },
  { vector: 'funeral',           expense: ['ENTERTAINMENT'],                                      income: [] },
  { vector: 'platform',          expense: ['FEES', 'ADVERTISING'],                                income: ['SALES'] },
  { vector: 'ec_site',           expense: ['SUPPLIES_CORP', 'PURCHASES_CORP', 'ADVERTISING'],     income: ['SALES'] },
  { vector: 'logistics',         expense: ['PACKING_SHIPPING'],                                   income: [] },
  { vector: 'consulting',        expense: ['FEES', 'OUTSOURCING_CORP'],                           income: [] },
  { vector: 'legal_firm',        expense: ['FEES'],                                               income: [] },
  { vector: 'construction',      expense: ['OUTSOURCING_CORP'],                                   income: [] },

  // ── 🏢 不動産・保険（2種）──
  { vector: 'real_estate',       expense: ['RENT', 'REPAIRS'],                                    income: [] },
  { vector: 'insurance',         expense: ['INSURANCE_CORP'],                                     income: [] },

  // ── 🎾 スポーツ・娯楽（5種）──
  { vector: 'entertainment',     expense: ['ENTERTAINMENT', 'WELFARE'],                           income: [] },
  { vector: 'leisure',           expense: ['WELFARE', 'ENTERTAINMENT'],                           income: [] },
  { vector: 'cinema_music',      expense: ['ENTERTAINMENT'],                                      income: [] },
  { vector: 'spa',               expense: ['WELFARE'],                                            income: [] },
  { vector: 'travel_agency',     expense: ['TRAVEL'],                                             income: [] },

  // ── 🚃 交通機関（9種）──
  { vector: 'gas_station',       expense: ['VEHICLE_COSTS'],                                      income: [] },  // A確定: VEHICLE_COSTS（2026-04-05変更）
  { vector: 'taxi',              expense: ['TRAVEL'],                                             income: [] },
  { vector: 'rental_car',        expense: ['TRAVEL'],                                             income: [] },
  { vector: 'train',             expense: ['TRAVEL'],                                             income: [] },
  { vector: 'bus',               expense: ['TRAVEL'],                                             income: [] },
  { vector: 'highway',           expense: ['TRAVEL'],                                             income: [] },
  { vector: 'airline_ship',      expense: ['TRAVEL'],                                             income: [] },
  { vector: 'parking',           expense: ['TRAVEL'],                                             income: [] },
  { vector: 'hotel',             expense: ['TRAVEL'],                                             income: [] },

  // ── 🏛️ 公共機関（5種）──
  { vector: 'utility',           expense: ['UTILITIES'],                                          income: [] },
  { vector: 'government',        expense: ['TAXES_DUES'/*租税公課*/, 'FEES'/*支払手数料*/, 'LEGAL_WELFARE'/*法定福利費*/],
    // ▶ SUBSIDY_INCOME（補助金収入）は ACCOUNT_MASTER（勘定科目マスタ）に存在しない。
    //   「存在しない」ことが正しい設計。二度と追加するな。
    //   補助金入金は MISC_INCOME_CORP（雑収入・法人）で処理する。
    income: ['MISC_INCOME_CORP'/*雑収入・法人*/] },
  { vector: 'social_insurance',  expense: ['LEGAL_WELFARE'],                                      income: [] },
  { vector: 'medical',           expense: ['WELFARE'],                                            income: [] },
  { vector: 'religious',         expense: ['DONATIONS', 'MEMBERSHIP_FEES', 'FEES'],               income: [] },

  // ── 💰 金融（1種）──
  { vector: 'financial',         expense: ['LONG_TERM_BORROWINGS', 'INTEREST_EXPENSE', 'FEES'],   income: ['LONG_TERM_BORROWINGS', 'INTEREST_INCOME'] },

  // ── 👤 個人・卸売・会費・不明（4種）──
  { vector: 'individual',        expense: ['OUTSOURCING_CORP', 'SALARIES', 'OFFICER_COMPENSATION', 'ADVANCE_PAID_CORP', 'OFFICER_LOANS', 'TEMPORARY_PAYMENTS'], income: ['SALES', 'ADVANCE_PAID_CORP', 'MISC_INCOME_CORP', 'OFFICER_BORROWINGS', 'DEPOSITS_RECEIVED'] },
  { vector: 'wholesale',         expense: ['PURCHASES_CORP'],                                     income: [] },
  { vector: 'association',       expense: ['MEMBERSHIP_FEES', 'ENTERTAINMENT'],                   income: [] },
  { vector: 'unknown',           expense: [],                                                     income: [] },
];

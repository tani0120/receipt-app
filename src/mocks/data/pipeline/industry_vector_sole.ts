/**
 * industry_vector_sole.ts — T-06b: 個人事業主用業種ベクトル辞書
 *
 * 準拠: vendor_vector_41_reference.md（66種・個人expense/income列）
 * 全科目ID: ACCOUNT_MASTER（src/shared/data/account-master.ts）準拠
 *
 * 用途: パイプライン Step 4（科目確定）で、
 *   vendor_vector + direction → 科目候補リストを取得する。
 *   GHI社など個人事業主の顧問先で使用。
 *
 * 法人用との主な差異:
 *   - SUPPLIES_CORP → SUPPLIES（消耗品費）
 *   - PURCHASES_CORP → PURCHASES（仕入高）
 *   - OUTSOURCING_CORP → OUTSOURCING（外注工賃）※staffing/constructionは例外でCORP維持
 *   - FIXTURES_CORP → FIXTURES（工具器具備品）
 *   - INSURANCE_CORP → INSURANCE（損害保険料）
 *   - real_estate: income追加（RENTAL_INCOME）
 *   - government: LEGAL_WELFARE除外、income除外
 *   - individual: expense/income が法人と完全に異なる
 */

import type { IndustryVectorEntry } from '@/mocks/types/pipeline/vendor.type';

/** 個人事業主用 業種ベクトル → 科目候補マッピング（66種） */
export const INDUSTRY_VECTOR_SOLE: IndustryVectorEntry[] = [
  // ── 🍽️ 飲食（2種）──
  { vector: 'restaurant',        expense: ['MEETING', 'ENTERTAINMENT'],                     income: [] },
  { vector: 'cafe',              expense: ['MEETING'],                                      income: [] },

  // ── 🛒 小売（19種）──
  { vector: 'food_market',       expense: ['MEETING', 'PURCHASES'],                         income: [] },
  { vector: 'supermarket',       expense: ['SUPPLIES', 'PURCHASES'],                        income: [] },
  { vector: 'convenience_store', expense: ['SUPPLIES', 'MEETING'],                          income: [] },
  { vector: 'general_goods',     expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'souvenir',          expense: ['ENTERTAINMENT'],                                income: [] },
  { vector: 'drugstore',         expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'apparel',           expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'cosmetics',         expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'books',             expense: ['BOOKS_PERIODICALS'],                            income: [] },
  { vector: 'electronics',       expense: ['SUPPLIES', 'FIXTURES', 'PURCHASES'],            income: [] },
  { vector: 'bicycle',           expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'sports_goods',      expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'media_disc',        expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'jewelry',           expense: ['SUPPLIES', 'ENTERTAINMENT'],                    income: [] },
  { vector: 'florist',           expense: ['ENTERTAINMENT'],                                income: [] },
  { vector: 'auto_dealer',       expense: ['VEHICLE_COSTS', 'REPAIRS'],                     income: [] },
  { vector: 'auto_parts',        expense: ['VEHICLE_COSTS'],                                income: [] },
  { vector: 'building_materials',expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'stationery',        expense: ['SUPPLIES'],                                     income: [] },

  // ── 🔧 サービス（19種）──
  { vector: 'beauty',            expense: ['WELFARE'],                                      income: [] },
  { vector: 'printing',          expense: ['ADVERTISING'],                                  income: [] },
  { vector: 'advertising',       expense: ['ADVERTISING'],                                  income: [] },
  { vector: 'post_office',       expense: ['COMMUNICATION', 'FEES', 'TAXES_DUES'],          income: [] },
  { vector: 'waste',             expense: ['FEES'],                                         income: [] },
  { vector: 'it_service',        expense: ['COMMUNICATION', 'FEES'],                        income: [] },
  { vector: 'telecom_saas',      expense: ['COMMUNICATION', 'FEES'],                        income: [] },
  { vector: 'education',         expense: ['TRAINING'],                                     income: [] },
  { vector: 'outsourcing',       expense: ['OUTSOURCING'],                                  income: [] },
  { vector: 'lease_rental',      expense: ['LEASE', 'LEASE_CORP'],                          income: [] },
  { vector: 'staffing',          expense: ['OUTSOURCING_CORP'],                             income: [] },  // reference通り：個人でもCORP
  { vector: 'camera_dpe',        expense: ['SUPPLIES'],                                     income: [] },
  { vector: 'funeral',           expense: ['ENTERTAINMENT'],                                income: [] },
  { vector: 'platform',          expense: ['FEES', 'ADVERTISING'],                          income: ['SALES'] },
  { vector: 'ec_site',           expense: ['SUPPLIES', 'PURCHASES', 'ADVERTISING'],         income: [] },
  { vector: 'logistics',         expense: ['PACKING_SHIPPING'],                             income: [] },
  { vector: 'consulting',        expense: ['FEES', 'OUTSOURCING'],                          income: [] },
  { vector: 'legal_firm',        expense: ['FEES'],                                         income: [] },
  { vector: 'construction',      expense: ['OUTSOURCING_CORP'],                             income: [] },  // reference通り：個人でもCORP

  // ── 🏢 不動産・保険（2種）──
  { vector: 'real_estate',       expense: ['RENT', 'REPAIRS'],                              income: ['RENTAL_INCOME'] },  // 個人のみincome有
  { vector: 'insurance',         expense: ['INSURANCE'],                                    income: [] },

  // ── 🎾 スポーツ・娯楽（5種）──
  { vector: 'entertainment',     expense: ['ENTERTAINMENT', 'WELFARE'],                     income: [] },
  { vector: 'leisure',           expense: ['WELFARE', 'ENTERTAINMENT'],                     income: [] },
  { vector: 'cinema_music',      expense: ['ENTERTAINMENT'],                                income: [] },
  { vector: 'spa',               expense: ['WELFARE'],                                      income: [] },
  { vector: 'travel_agency',     expense: ['TRAVEL'],                                       income: [] },

  // ── 🚃 交通機関（9種）──
  { vector: 'gas_station',       expense: ['TRAVEL'],                                       income: [] },
  { vector: 'taxi',              expense: ['TRAVEL'],                                       income: [] },
  { vector: 'rental_car',        expense: ['TRAVEL'],                                       income: [] },
  { vector: 'train',             expense: ['TRAVEL'],                                       income: [] },
  { vector: 'bus',               expense: ['TRAVEL'],                                       income: [] },
  { vector: 'highway',           expense: ['TRAVEL'],                                       income: [] },
  { vector: 'airline_ship',      expense: ['TRAVEL'],                                       income: [] },
  { vector: 'parking',           expense: ['TRAVEL'],                                       income: [] },
  { vector: 'hotel',             expense: ['TRAVEL'],                                       income: [] },

  // ── 🏛️ 公共機関（5種）──
  { vector: 'utility',           expense: ['UTILITIES'],                                    income: [] },
  { vector: 'government',        expense: ['TAXES_DUES', 'FEES'],                           income: ['SUBSIDY_INCOME', 'MISC_INCOME_CORP'] },
  { vector: 'social_insurance',  expense: ['LEGAL_WELFARE'],                                income: [] },
  { vector: 'medical',           expense: ['WELFARE'],                                      income: [] },
  { vector: 'religious',         expense: ['DONATIONS', 'MEMBERSHIP_FEES', 'FEES'],         income: [] },

  // ── 💰 金融（1種）──
  { vector: 'financial',         expense: ['INTEREST_DISCOUNT', 'FEES'],                    income: ['LONG_TERM_BORROWINGS', 'INTEREST_INCOME'] },

  // ── 👤 個人・卸売・会費・不明（4種）──
  { vector: 'individual',        expense: ['OUTSOURCING', 'WAGES', 'ADVANCE_PAID', 'OWNER_DRAWING'], income: ['SALES', 'ADVANCE_PAID', 'MISC_INCOME', 'OWNER_INVESTMENT', 'DEPOSITS_RECEIVED'] },
  { vector: 'wholesale',         expense: ['PURCHASES'],                                    income: [] },
  { vector: 'association',       expense: ['MEMBERSHIP_FEES', 'ENTERTAINMENT'],             income: [] },
  { vector: 'unknown',           expense: [],                                               income: [] },
];

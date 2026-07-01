-- ============================================================
-- Supabase seedデータ（自動生成）
-- 生成日時: 2026-06-30T15:48:23.108Z
-- 生成元: supabase/seed.cjs
-- ============================================================

-- § 1. staff（7件）
-- 元データ: data/staff.json

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0000', '管理者', 'admin@sugu-suru.com', 'admin', 'active', 'kanrisha')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0001', '田中 太郎', 'tanaka@sugu-suru.com', 'admin', 'active', 'tanaka taro')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0002', '佐藤 花子', 'sato@sugu-suru.com', 'general', 'active', 'sato hanako')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0003', '鈴木 一郎', 'suzuki@sugu-suru.com', 'general', 'inactive', 'suzuki ichiro')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0004', '田中 次郎', 'tanaka-j@sugu-suru.com', 'general', 'active', 'tanaka jiro')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0006', 'テスト太郎', 'test@example.com', 'general', 'active', 'test taro')
ON CONFLICT (uuid) DO NOTHING;

INSERT INTO staff (uuid, name, email, role, status, name_romaji)
VALUES ('staff-0007', 'テスト　桃子', 'kyoyu.horitax@gmail.com', 'admin', 'active', 'test momoko')
ON CONFLICT (uuid) DO NOTHING;

-- § 2. vendors / scope=global（250件）
-- 元データ: data/vendors.json

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0001', '関西電力株式会社', '関西電力', NULL,
  '{}'::text[], '{"T3120001059632"}'::text[], '{}'::text[], NULL,
  'utility', NULL, NULL,
  NULL, 'expense', NULL,
  'UTILITIES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0002', '大阪瓦斯株式会社', '大阪ガス', NULL,
  '{}'::text[], '{"T3120001077601"}'::text[], '{}'::text[], NULL,
  'utility', NULL, NULL,
  NULL, 'expense', NULL,
  'UTILITIES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0003', 'ＮＴＴ西日本株式会社', 'NTT西日本', NULL,
  '{}'::text[], '{"T7120001077523"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0004', '株式会社ＮＴＴドコモ', 'NTTドコモ', NULL,
  '{}'::text[], '{"T1010001067912"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0005', 'ＫＤＤＩ株式会社', 'ＫＤＤＩ', NULL,
  '{"ＵＱモバイル","ａｕでんき"}'::text[], '{"T9011101031552"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0006', 'ソフトバンク株式会社', 'ソフトバンク', NULL,
  '{"ワイモバイル","ソフトバンク電気"}'::text[], '{"T9010401052465"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0007', '楽天モバイル株式会社', '楽天モバイル', NULL,
  '{}'::text[], '{"T2010901041404"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0008', '株式会社オプテージ', 'オプテージ', NULL,
  '{"ｍｉｎｅｏ","eo光"}'::text[], '{"T9120001062589"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0009', '株式会社ベイ・コミュニケーションズ', 'ベイコム', NULL,
  '{}'::text[], '{"T8120001035166"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0010', 'ＪＣＯＭ株式会社', 'ＪＣＯＭ', NULL,
  '{"ＺＡＱ","Ｊ：ＣＯＭ電気"}'::text[], '{"T1010001132055"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0011', '株式会社インターネットイニシアティブ', 'IIJmio', NULL,
  '{}'::text[], '{"T6010001011147"}'::text[], '{}'::text[], NULL,
  'telecom', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0012', '日本郵便株式会社', '日本郵便', NULL,
  '{}'::text[], '{"T1010001112577"}'::text[], '{}'::text[], NULL,
  'post_office', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0013', '東日本旅客鉄道株式会社', 'JR東日本', NULL,
  '{}'::text[], '{"T9011001029597"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0014', '東海旅客鉄道株式会社', 'JR東海', NULL,
  '{}'::text[], '{"T3180001031569"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0015', '西日本旅客鉄道株式会社', 'JR西日本', NULL,
  '{}'::text[], '{"T1120001059675"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0016', '近畿日本鉄道株式会社', '近鉄', NULL,
  '{}'::text[], '{"T5120001183629"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0017', '阪急電鉄株式会社', '阪急電鉄', NULL,
  '{}'::text[], '{"T7120901021811"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0018', '大阪市高速電気軌道株式会社', '大阪メトロ', NULL,
  '{}'::text[], '{"T6120001206256"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0019', '南海電気鉄道株式会社', '南海電鉄', NULL,
  '{}'::text[], '{"T6120001077499"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0020', '京阪電気鉄道株式会社', '京阪電鉄', NULL,
  '{}'::text[], '{"T5120001189816"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0021', '阪神電気鉄道株式会社', '阪神電鉄', NULL,
  '{}'::text[], '{"T3120001036177"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0022', '泉北高速鉄道株式会社', '泉北高速鉄道', NULL,
  '{}'::text[], '{"T5120101043162"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0023', '北大阪急行電鉄株式会社', '北大阪急行電鉄', NULL,
  '{}'::text[], '{"T5120901023396"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0024', '阪堺電気軌道株式会社', '阪堺電気軌道', NULL,
  '{"阪堺電車"}'::text[], '{"T9120001033524"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0025', '能勢電鉄株式会社', '能勢電鉄', NULL,
  '{}'::text[], '{"T3140001079570"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0026', '大阪モノレール株式会社', '大阪モノレール', NULL,
  '{}'::text[], '{"T1120901023210"}'::text[], '{}'::text[], NULL,
  'train', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0027', '西日本ジェイアールバス株式会社', '西日本JRバス', NULL,
  '{}'::text[], '{"T3120001057487"}'::text[], '{}'::text[], NULL,
  'bus', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0028', '阪急バス株式会社', '阪急バス', NULL,
  '{}'::text[], '{"T6120901019848"}'::text[], '{}'::text[], NULL,
  'bus', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0029', '大阪シティバス株式会社', '大阪シティバス', NULL,
  '{}'::text[], '{"T6120001048830"}'::text[], '{}'::text[], NULL,
  'bus', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0030', '近鉄バス株式会社', '近鉄バス', NULL,
  '{}'::text[], '{"T7180001033082"}'::text[], '{}'::text[], NULL,
  'bus', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0031', '大阪エムケイ株式会社', 'MKタクシー', NULL,
  '{}'::text[], '{"T1120001036971"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0032', '大阪相互タクシー株式会社', '大阪相互タクシー', NULL,
  '{}'::text[], '{"T5120101001368"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0033', '近鉄タクシー株式会社', '近鉄タクシー', NULL,
  '{}'::text[], '{"T3120001023118"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0034', '阪神タクシー株式会社', '阪神タクシー', NULL,
  '{}'::text[], '{"T8140001070038"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0035', '大阪第一交通株式会社', '大阪第一交通', NULL,
  '{"第一交通"}'::text[], '{"T5120101055323"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0036', 'DiDiモビリティジャパン株式会社', 'DiDi', NULL,
  '{}'::text[], '{"T2011001150650"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0037', 'GO株式会社', 'GO', NULL,
  '{}'::text[], '{"T2011501015896"}'::text[], '{}'::text[], NULL,
  'taxi', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0038', 'タイムズ２４株式会社', 'タイムズ２４', NULL,
  '{"タイムズカー"}'::text[], '{"T4010001137274"}'::text[], '{}'::text[], NULL,
  'parking', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0039', 'オリックス自動車株式会社', 'オリックスレンタカー', NULL,
  '{}'::text[], '{"T7010401056220"}'::text[], '{}'::text[], NULL,
  'rental_car', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0040', 'ニッポンレンタカーサービス株式会社', 'ニッポンレンタカー', NULL,
  '{}'::text[], '{"T6011001018116"}'::text[], '{}'::text[], NULL,
  'rental_car', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0041', 'ＥＮＥＯＳ株式会社', 'ENEOS', NULL,
  '{"ＥＮＥＯＳでんき"}'::text[], '{"T4010001133876"}'::text[], '{}'::text[], NULL,
  'gas_station', NULL, NULL,
  NULL, 'expense', NULL,
  'VEHICLE_COSTS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0042', '出光興産株式会社', '出光興産', NULL,
  '{}'::text[], '{"T9010001011318"}'::text[], '{}'::text[], NULL,
  'gas_station', NULL, NULL,
  NULL, 'expense', NULL,
  'VEHICLE_COSTS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0043', 'コスモ石油株式会社', 'コスモ石油', NULL,
  '{}'::text[], '{"T3010401010164"}'::text[], '{}'::text[], NULL,
  'gas_station', NULL, NULL,
  NULL, 'expense', NULL,
  'VEHICLE_COSTS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0044', '伊藤忠エネクス株式会社', '伊藤忠エネクス', NULL,
  '{}'::text[], '{"T9010401078551"}'::text[], '{}'::text[], NULL,
  'gas_station', NULL, NULL,
  NULL, 'expense', NULL,
  'VEHICLE_COSTS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0045', 'ヤマト運輸株式会社', 'ヤマト運輸', NULL,
  '{}'::text[], '{"T1010001092605"}'::text[], '{}'::text[], NULL,
  'logistics', NULL, NULL,
  NULL, 'expense', NULL,
  'PACKING_SHIPPING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0046', '佐川急便株式会社', '佐川急便', NULL,
  '{}'::text[], '{"T8130001000053"}'::text[], '{}'::text[], NULL,
  'logistics', NULL, NULL,
  NULL, 'expense', NULL,
  'PACKING_SHIPPING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0047', '西濃運輸株式会社', '西濃運輸', NULL,
  '{}'::text[], '{"T7200001015755"}'::text[], '{}'::text[], NULL,
  'logistics', NULL, NULL,
  NULL, 'expense', NULL,
  'PACKING_SHIPPING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0048', '福山通運株式会社', '福山通運', NULL,
  '{}'::text[], '{"T1240001032736"}'::text[], '{}'::text[], NULL,
  'logistics', NULL, NULL,
  NULL, 'expense', NULL,
  'PACKING_SHIPPING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0049', '日本通運株式会社', '日本通運', NULL,
  '{"NIPPON EXPRESS"}'::text[], '{"T4010401022860"}'::text[], '{}'::text[], NULL,
  'logistics', NULL, NULL,
  NULL, 'expense', NULL,
  'PACKING_SHIPPING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0050', '京阪バス株式会社', '京阪バス', NULL,
  '{}'::text[], '{"T5130001010526"}'::text[], '{}'::text[], NULL,
  'bus', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0051', '南海バス株式会社', '南海バス', NULL,
  '{}'::text[], '{"T4120001098852"}'::text[], '{}'::text[], NULL,
  'bus', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0052', '株式会社Ｌｏｏｏｐ', 'Ｌｏｏｏｐでんき', NULL,
  '{}'::text[], '{"T4010901031114"}'::text[], '{}'::text[], NULL,
  'utility', NULL, NULL,
  NULL, 'expense', NULL,
  'UTILITIES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0053', '日本放送協会', 'ＮＨＫ', NULL,
  '{}'::text[], '{"T8011005000968"}'::text[], '{}'::text[], NULL,
  'utility', NULL, NULL,
  NULL, 'expense', NULL,
  'UTILITIES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0054', '株式会社タイミー', 'タイミー', NULL,
  '{}'::text[], '{"T1012801018219"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0055', 'ディップ株式会社', 'バイトル', NULL,
  '{}'::text[], '{"T6010401050785"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0056', '株式会社マイナビ', 'マイナビ', NULL,
  '{"マイナビバイト"}'::text[], '{"T3010001029968"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0057', 'Ｉｎｄｅｅｄ Ｊａｐａｎ株式会社', 'インディード', NULL,
  '{}'::text[], '{"T7010401108252"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0058', '株式会社アイデム', 'アイデム', NULL,
  '{}'::text[], '{"T1011101001562"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0059', '株式会社フルキャスト', 'フルキャスト', NULL,
  '{}'::text[], '{"T3010701023915"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0060', 'エン・ジャパン株式会社', 'エン・ジャパン', NULL,
  '{}'::text[], '{"T1011101029018"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0061', '株式会社ビズリーチ', 'ビズリーチ', NULL,
  '{}'::text[], '{"T2011001058413"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0062', '株式会社パソナ', 'パソナ', NULL,
  '{}'::text[], '{"T1010001067359"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0063', 'アデコ株式会社', 'アデコ', NULL,
  '{}'::text[], '{"T8010401001563"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0064', '株式会社スタッフサービス', 'スタッフサービス', NULL,
  '{}'::text[], '{"T8010001076758"}'::text[], '{}'::text[], NULL,
  'staffing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0065', '株式会社ダスキン', 'ダスキン', NULL,
  '{"ミスタードーナツ"}'::text[], '{"T5050001027644"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0066', '株式会社サニクリーン', 'サニクリーン', NULL,
  '{}'::text[], '{"T4010401011574"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0067', '株式会社ベルシステム２４', 'ベルシステム24', NULL,
  '{}'::text[], '{"T2010001159015"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0068', '株式会社プリントパック', 'プリントパック', NULL,
  '{}'::text[], '{"T5130001024625"}'::text[], '{}'::text[], NULL,
  'printing', NULL, NULL,
  NULL, 'expense', NULL,
  'ADVERTISING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0069', 'ラクスル株式会社', 'ラクスル', NULL,
  '{}'::text[], '{"T9010401089631"}'::text[], '{}'::text[], NULL,
  'printing', NULL, NULL,
  NULL, 'expense', NULL,
  'ADVERTISING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0070', '株式会社日本旅行', '日本旅行', NULL,
  '{}'::text[], '{"T1010401023408"}'::text[], '{}'::text[], NULL,
  'travel_agency', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0071', '富士フイルムビジネスイノベーション株式会社', '富士フイルムBI', NULL,
  '{}'::text[], '{"T3010401026805"}'::text[], '{}'::text[], NULL,
  'it_service', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0072', 'リコージャパン株式会社', 'リコージャパン', NULL,
  '{}'::text[], '{"T1010001110829"}'::text[], '{}'::text[], NULL,
  'it_service', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0073', 'キヤノンマーケティングジャパン株式会社', 'キヤノンMJ', NULL,
  '{}'::text[], '{"T5010401008297"}'::text[], '{}'::text[], NULL,
  'it_service', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0074', '株式会社大塚商会', '大塚商会', NULL,
  '{}'::text[], '{"T1010001012983"}'::text[], '{}'::text[], NULL,
  'it_service', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0075', 'オリックス株式会社', 'オリックス', NULL,
  '{}'::text[], '{"T8010401006942"}'::text[], '{}'::text[], NULL,
  'lease_rental', NULL, NULL,
  NULL, 'expense', NULL,
  'LEASE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0076', '三菱ＨＣキャピタル株式会社', '三菱HCキャピタル', NULL,
  '{}'::text[], '{"T4010001049866"}'::text[], '{}'::text[], NULL,
  'lease_rental', NULL, NULL,
  NULL, 'expense', NULL,
  'LEASE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0077', '三井住友ファイナンス＆リース株式会社', '三井住友FL', NULL,
  '{}'::text[], '{"T5010401072079"}'::text[], '{}'::text[], NULL,
  'lease_rental', NULL, NULL,
  NULL, 'expense', NULL,
  'LEASE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0078', '東京センチュリー株式会社', '東京センチュリー', NULL,
  '{}'::text[], '{"T6010401015821"}'::text[], '{}'::text[], NULL,
  'lease_rental', NULL, NULL,
  NULL, 'expense', NULL,
  'LEASE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0079', '株式会社ベネフィット・ワン', 'ベネフィットワン', NULL,
  '{}'::text[], '{"T8011001045281"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0080', '株式会社リロクラブ', 'リロクラブ', NULL,
  '{}'::text[], '{"T2011101032251"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0081', 'ランサーズ株式会社', 'ランサーズ', NULL,
  '{}'::text[], '{"T6021001024617"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0082', '株式会社クラウドワークス', 'クラウドワークス', NULL,
  '{}'::text[], '{"T6010401098453"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0083', '日本マクドナルド株式会社', 'マクドナルド', NULL,
  '{}'::text[], '{"T5011101033783"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0084', '日本ケンタッキー・フライドチキン株式会社', 'ケンタッキー', NULL,
  '{"KFC"}'::text[], '{"T3010001244022"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0085', '株式会社モスフードサービス', 'モスバーガー', NULL,
  '{}'::text[], '{"T5010701019713"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0086', '株式会社アレフ', 'びっくりドンキー', NULL,
  '{}'::text[], '{"T430001001078"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0087', '株式会社すき家', 'すき家', NULL,
  '{}'::text[], '{"T2010401093920"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0088', '株式会社吉野家', '吉野家', NULL,
  '{}'::text[], '{"T6011501019200"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0089', '株式会社松屋フーズ', '松屋', NULL,
  '{}'::text[], '{"T8012401033917"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0090', '株式会社大戸屋', '大戸屋', NULL,
  '{}'::text[], '{"T4012401021669"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0091', '株式会社プレナス', 'やよい軒', NULL,
  '{"ほっともっと"}'::text[], '{"T2290001034974"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0092', '株式会社すかいらーくレストランツ', 'ガスト', NULL,
  '{"バーミヤン","ジョナサン","しゃぶ葉"}'::text[], '{"T2012401030556"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0093', 'ロイヤルホールディングス株式会社', 'ロイヤルホスト', NULL,
  '{}'::text[], '{"T2290001017525"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0094', '株式会社サイゼリヤ', 'サイゼリヤ', NULL,
  '{}'::text[], '{"T8030001065552"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0095', 'スターバックスコーヒージャパン株式会社', 'スターバックス', NULL,
  '{}'::text[], '{"T7011001031943"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0096', '株式会社ドトールコーヒー', 'ドトール', NULL,
  '{}'::text[], '{"T6011001032554"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0097', '株式会社コメダ', 'コメダ珈琲店', NULL,
  '{"コメダ"}'::text[], '{"T7011101057112"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0098', 'タリーズコーヒージャパン株式会社', 'タリーズ', NULL,
  '{}'::text[], '{"T9011101048118"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0099', '株式会社サンマルクカフェ', 'サンマルクカフェ', NULL,
  '{}'::text[], '{"T5260001003038"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0100', '株式会社プロント', 'プロント', NULL,
  '{}'::text[], '{"T8010401026511"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0101', 'ユーシーシー上島珈琲株式会社', '上島珈琲店', NULL,
  '{"UCC"}'::text[], '{"T1140001032589"}'::text[], '{}'::text[], NULL,
  'cafe', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0102', '株式会社あきんどスシロー', 'スシロー', NULL,
  '{}'::text[], '{"T4010001148370"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0103', 'くら寿司株式会社', 'くら寿司', NULL,
  '{}'::text[], '{"T4120101002846"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0104', '株式会社はま寿司', 'はま寿司', NULL,
  '{}'::text[], '{"T7010401052896"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0105', 'カッパ・クリエイト株式会社', 'かっぱ寿司', NULL,
  '{}'::text[], '{"T7030001001979"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0106', '株式会社エターナルホスピタリティグループ', '鳥貴族', NULL,
  '{"鳥貴族ホールディングス"}'::text[], '{"T9120001011711"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0107', '株式会社モンテローザ', '魚民', NULL,
  '{"白木屋","山内農場"}'::text[], '{"T6011101026423"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0108', '養老乃瀧株式会社', '養老乃瀧', NULL,
  '{}'::text[], '{"T5013301022756"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0109', '株式会社つぼ八', 'つぼ八', NULL,
  '{}'::text[], '{"T1450001001934"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0110', 'がんこフードサービス株式会社', 'がんこ', NULL,
  '{}'::text[], '{"T6120001054597"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0111', '株式会社グルメ杵屋', '杵屋', NULL,
  '{"麦まる"}'::text[], '{"T2120001030585"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0112', '株式会社かに道楽', 'かに道楽', NULL,
  '{}'::text[], '{"T2120001076959"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0113', '株式会社木曽路', '木曽路', NULL,
  '{}'::text[], '{"T9180001008132"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0114', '株式会社王将フードサービス', '餃子の王将', NULL,
  '{"王将"}'::text[], '{"T3130001012441"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0115', '株式会社551蓬莱', '551蓬莱', NULL,
  '{"蓬莱"}'::text[], '{"T4120001124781"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0116', '株式会社丸亀製麺', '丸亀製麺', NULL,
  '{}'::text[], '{"T3140001101540"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0117', '株式会社はなまる', 'はなまるうどん', NULL,
  '{"はなまる"}'::text[], '{"T5010001195230"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0118', '株式会社魁力屋', '魁力屋', NULL,
  '{}'::text[], '{"T4130001026309"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0119', '株式会社来来亭', '来来亭', NULL,
  '{}'::text[], '{"T8160001015833"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0120', '株式会社レインズインターナショナル', '牛角', NULL,
  '{"温野菜"}'::text[], '{"T5010401071849"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0121', 'アスクル株式会社', 'アスクル', NULL,
  '{}'::text[], '{"T5010601030357"}'::text[], '{}'::text[], NULL,
  'stationery', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0122', '株式会社カウネット', 'カウネット', NULL,
  '{}'::text[], '{"T3010401090025"}'::text[], '{}'::text[], NULL,
  'stationery', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0123', '株式会社ＭｏｎｏｔａＲＯ', 'モノタロウ', NULL,
  '{}'::text[], '{"T6140001054380"}'::text[], '{}'::text[], NULL,
  'stationery', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0124', '株式会社ライフコーポレーション', 'ライフ', NULL,
  '{}'::text[], '{"T9010001060208"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0125', '株式会社万代', '万代', NULL,
  '{}'::text[], '{"T6120001018791"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0126', '株式会社平和堂', '平和堂', NULL,
  '{}'::text[], '{"T3160001008726"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0127', '株式会社イズミヤ', 'イズミヤ', NULL,
  '{"阪急オアシス"}'::text[], '{"T8010001010923"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0128', '株式会社関西スーパーマーケット', '関西スーパー', NULL,
  '{}'::text[], '{"T4140001123170"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0129', '株式会社オークワ', 'オークワ', NULL,
  '{}'::text[], '{"T2170001002092"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0130', '株式会社神戸物産', '業務スーパー', NULL,
  '{}'::text[], '{"T5140001044630"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0131', '株式会社成城石井', '成城石井', NULL,
  '{}'::text[], '{"T5010901028646"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0132', '株式会社近商ストア', '近商ストア', NULL,
  '{}'::text[], '{"T3120101026862"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0133', '上新電機株式会社', 'ジョーシン', NULL,
  '{"上新電機","Joshin"}'::text[], '{"T9120001038564"}'::text[], '{}'::text[], NULL,
  'electronics', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0134', '株式会社エディオン', 'エディオン', NULL,
  '{}'::text[], '{"T3240001041231"}'::text[], '{}'::text[], NULL,
  'electronics', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0135', '株式会社ヤマダデンキ', 'ヤマダ電機', NULL,
  '{"ヤマダデンキ"}'::text[], '{"T2070001036729"}'::text[], '{}'::text[], NULL,
  'electronics', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0136', '株式会社ワークマン', 'ワークマン', NULL,
  '{}'::text[], '{"T1070001013828"}'::text[], '{}'::text[], NULL,
  'apparel', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0137', '株式会社ユニクロ', 'ユニクロ', NULL,
  '{}'::text[], '{"T9250001001451"}'::text[], '{}'::text[], NULL,
  'apparel', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0138', '青山商事株式会社', '洋服の青山', NULL,
  '{"青山商事"}'::text[], '{"T1240001029674"}'::text[], '{}'::text[], NULL,
  'apparel', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0139', '株式会社パル', 'パル', NULL,
  '{}'::text[], '{"T5010001031920"}'::text[], '{}'::text[], NULL,
  'apparel', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0140', '株式会社ハンズ', 'ハンズ', NULL,
  '{"東急ハンズ"}'::text[], '{"T5011001016616"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0141', 'ハンズホールディングス株式会社', 'ハンズHD', NULL,
  '{}'::text[], '{"T6010001215615"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0142', '株式会社ロフト', 'ロフト', NULL,
  '{}'::text[], '{"T5011001027621"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0143', '株式会社大創産業', 'ダイソー', NULL,
  '{"DAISO"}'::text[], '{"T7240001022681"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0144', '株式会社セリア', 'セリア', NULL,
  '{}'::text[], '{"T4200001013662"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0145', '株式会社ニトリ', 'ニトリ', NULL,
  '{}'::text[], '{"T3430001044958"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0146', '株式会社良品計画', '無印良品', NULL,
  '{"MUJI"}'::text[], '{"T5013301012443"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0147', 'アイリスオーヤマ株式会社', 'アイリスオーヤマ', NULL,
  '{}'::text[], '{"T3370001006799"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0148', 'アマゾンジャパン合同会社', 'Amazon', NULL,
  '{"アマゾン","Amazon.co.jp"}'::text[], '{"T3040001028447"}'::text[], '{}'::text[], NULL,
  'ec_site', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0149', '楽天グループ株式会社', '楽天', NULL,
  '{"楽天市場","楽天でんき"}'::text[], '{"T9010701020592"}'::text[], '{}'::text[], NULL,
  'ec_site', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0150', '株式会社メルカリ', 'メルカリ', NULL,
  '{"メルペイ"}'::text[], '{"T6010701027558"}'::text[], '{}'::text[], NULL,
  'ec_site', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0151', 'ＢＡＳＥ株式会社', 'BASE', NULL,
  '{}'::text[], '{"T7010401103229"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0152', 'Shopify Japan株式会社', 'Shopify', NULL,
  '{}'::text[], '{"T4010001187930"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0153', 'freee株式会社', 'freee', NULL,
  '{}'::text[], '{"T7010401100770"}'::text[], '{}'::text[], NULL,
  'saas', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0154', '株式会社マネーフォワード', 'マネーフォワード', NULL,
  '{}'::text[], '{"T6011101063359"}'::text[], '{}'::text[], NULL,
  'saas', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0155', '弥生株式会社', '弥生', NULL,
  '{}'::text[], '{"T9010001223243"}'::text[], '{}'::text[], NULL,
  'saas', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0156', 'OpenAI Japan合同会社', 'OpenAI', NULL,
  '{"ChatGPT"}'::text[], '{"T4010403030746"}'::text[], '{}'::text[], NULL,
  'saas', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0157', 'Ａｎｔｈｒｏｐｉｃ，ＰＢＣ', 'Anthropic', NULL,
  '{"Claude"}'::text[], '{"T7700150134388"}'::text[], '{}'::text[], NULL,
  'saas', NULL, NULL,
  NULL, 'expense', NULL,
  'COMMUNICATION', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0158', 'ダイキチシステム株式会社', 'ダイキチ', NULL,
  '{"やきとり大吉"}'::text[], '{"T6120001083076"}'::text[], '{}'::text[], NULL,
  'outsourcing', NULL, NULL,
  NULL, 'expense', NULL,
  'OUTSOURCING_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0159', '株式会社大庄', '庄や', NULL,
  '{"日本海庄や"}'::text[], '{"T2010801006663"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0160', 'ＳＲＳホールディングス株式会社', '和食さと', NULL,
  '{"さと"}'::text[], '{"T4120101022786"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0161', '株式会社神座', 'どうとんぼり神座', NULL,
  '{"神座"}'::text[], '{"T1120001085187"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0162', '株式会社鎌倉パスタ', '鎌倉パスタ', NULL,
  '{}'::text[], '{"T2260001008997"}'::text[], '{}'::text[], NULL,
  'restaurant', NULL, NULL,
  NULL, 'expense', 10000,
  'MEETING', 'ENTERTAINMENT', NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0163', 'イオン株式会社', 'イオン', NULL,
  '{"AEON","イオンスーパー"}'::text[], '{"T6010001006132"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0164', 'イオンリテール株式会社', 'イオンリテール', NULL,
  '{"マックスバリュ"}'::text[], '{"T6010401017409"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0165', 'イオンモール株式会社', 'イオンモール', NULL,
  '{}'::text[], '{"T4120001037640"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0166', '株式会社セブン-イレブン・ジャパン', 'セブン-イレブン', NULL,
  '{"7-Eleven","7-11"}'::text[], '{"T1010001088181"}'::text[], '{}'::text[], NULL,
  'convenience_store', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0167', '株式会社ファミリーマート', 'ファミリーマート', NULL,
  '{"ファミマ"}'::text[], '{"T2013301010706"}'::text[], '{}'::text[], NULL,
  'convenience_store', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0168', '株式会社ローソン', 'ローソン', NULL,
  '{}'::text[], '{"T2010701019195"}'::text[], '{}'::text[], NULL,
  'convenience_store', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0169', 'ミニストップ株式会社', 'ミニストップ', NULL,
  '{}'::text[], '{"T4010001030181"}'::text[], '{}'::text[], NULL,
  'convenience_store', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0170', '株式会社デイリーヤマザキ', 'デイリーヤマザキ', NULL,
  '{}'::text[], '{"T4040001007262"}'::text[], '{}'::text[], NULL,
  'convenience_store', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0171', 'コーナン商事株式会社', 'コーナン', NULL,
  '{}'::text[], '{"T3120101003135"}'::text[], '{}'::text[], NULL,
  'building_materials', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0172', '株式会社カインズ', 'カインズ', NULL,
  '{}'::text[], '{"T3070001006474"}'::text[], '{}'::text[], NULL,
  'building_materials', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0173', '株式会社コメリ', 'コメリ', NULL,
  '{}'::text[], '{"T9110001002050"}'::text[], '{}'::text[], NULL,
  'building_materials', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0174', 'アークランズ株式会社', 'アークランズ', NULL,
  '{"ムサシ","アームス"}'::text[], '{"T4110001013829"}'::text[], '{}'::text[], NULL,
  'building_materials', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0175', '株式会社ナフコ', 'ナフコ', NULL,
  '{}'::text[], '{"T7290801002705"}'::text[], '{}'::text[], NULL,
  'building_materials', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0176', '株式会社ヨドバシカメラ', 'ヨドバシカメラ', NULL,
  '{"ヨドバシ"}'::text[], '{"T5011101021978"}'::text[], '{}'::text[], NULL,
  'electronics', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0177', '株式会社ビックカメラ', 'ビックカメラ', NULL,
  '{"ビック"}'::text[], '{"T9013301010402"}'::text[], '{}'::text[], NULL,
  'electronics', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0178', '株式会社紀伊國屋書店', '紀伊國屋書店', NULL,
  '{"紀伊国屋"}'::text[], '{"T4011101005131"}'::text[], '{}'::text[], NULL,
  'books', NULL, NULL,
  NULL, 'expense', NULL,
  'BOOKS_PERIODICALS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0179', '株式会社丸善ジュンク堂書店', '丸善ジュンク堂', NULL,
  '{"丸善","ジュンク堂"}'::text[], '{"T9010001134416"}'::text[], '{}'::text[], NULL,
  'books', NULL, NULL,
  NULL, 'expense', NULL,
  'BOOKS_PERIODICALS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0180', 'カルチュア・コンビニエンス・クラブ株式会社', 'TSUTAYA', NULL,
  '{"CCC","T-POINT"}'::text[], '{"T2120001077107"}'::text[], '{}'::text[], NULL,
  'general_goods', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0181', '株式会社東横イン', '東横イン', NULL,
  '{}'::text[], '{"T8010801008365"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0182', 'アパホテル株式会社', 'アパホテル', NULL,
  '{"APA"}'::text[], '{"T4010401043403"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0183', 'ルートインジャパン株式会社', 'ルートイン', NULL,
  '{"ROUTE INN"}'::text[], '{"T9010701012499"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0184', '株式会社スーパーホテル', 'スーパーホテル', NULL,
  '{}'::text[], '{"T4120001044443"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0185', '株式会社共立メンテナンス', 'ドーミーイン', NULL,
  '{"共立メンテナンス"}'::text[], '{"T1010001014427"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0186', 'ダイワロイヤル株式会社', 'ダイワロイネット', NULL,
  '{"ダイワロイヤル"}'::text[], '{"T6010001132637"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0187', '株式会社グリーンズ', 'コンフォートホテル', NULL,
  '{"グリーンズ"}'::text[], '{"T5190001014736"}'::text[], '{}'::text[], NULL,
  'hotel', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0188', 'サンディ株式会社', 'サンディ', NULL,
  '{}'::text[], '{"T5120001055464"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0189', '大黒天物産株式会社', 'ラ・ムー', NULL,
  '{"ラムー","ディオ"}'::text[], '{"T8260001013868"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0190', '株式会社ハローズ', 'ハローズ', NULL,
  '{}'::text[], '{"T7240001031724"}'::text[], '{}'::text[], NULL,
  'supermarket', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0191', '株式会社ウエルシアホールディングス', 'ウエルシア', NULL,
  '{}'::text[], '{"T7010001119831"}'::text[], '{}'::text[], NULL,
  'drugstore', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0192', '株式会社ツルハホールディングス', 'ツルハドラッグ', NULL,
  '{"ツルハ"}'::text[], '{"T4430001029116"}'::text[], '{}'::text[], NULL,
  'drugstore', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0193', '株式会社マツモトキヨシ', 'マツモトキヨシ', NULL,
  '{"マツキヨ"}'::text[], '{"T1040001036939"}'::text[], '{}'::text[], NULL,
  'drugstore', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0194', '株式会社コスモス薬品', 'コスモス薬品', NULL,
  '{"ディスカウントドラッグコスモス"}'::text[], '{"T9290001025414"}'::text[], '{}'::text[], NULL,
  'drugstore', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0195', '株式会社キリン堂', 'キリン堂', NULL,
  '{}'::text[], '{"T4120001131547"}'::text[], '{}'::text[], NULL,
  'drugstore', NULL, NULL,
  NULL, 'expense', NULL,
  'SUPPLIES_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0196', '株式会社日比谷花壇', '日比谷花壇', NULL,
  '{}'::text[], '{"T8010001027100"}'::text[], '{}'::text[], NULL,
  'florist', NULL, NULL,
  NULL, 'expense', NULL,
  'ENTERTAINMENT', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0197', '株式会社パーク・コーポレーション', '青山フラワーマーケット', NULL,
  '{"パーク・コーポレーション"}'::text[], '{"T6010401023733"}'::text[], '{}'::text[], NULL,
  'florist', NULL, NULL,
  NULL, 'expense', NULL,
  'ENTERTAINMENT', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0198', '株式会社花キューピット', '花キューピット', NULL,
  '{}'::text[], '{"T1010001083901"}'::text[], '{}'::text[], NULL,
  'florist', NULL, NULL,
  NULL, 'expense', NULL,
  'ENTERTAINMENT', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0199', '株式会社ニッカフラワー', 'ニッカフラワー', NULL,
  '{}'::text[], '{"T8010001099688"}'::text[], '{}'::text[], NULL,
  'florist', NULL, NULL,
  NULL, 'expense', NULL,
  'ENTERTAINMENT', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0200', '株式会社オートバックスセブン', 'オートバックス', NULL,
  '{}'::text[], '{"T3010601030532"}'::text[], '{}'::text[], NULL,
  'auto_parts', NULL, NULL,
  NULL, 'expense', NULL,
  'VEHICLE_COSTS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0201', '株式会社イエローハット', 'イエローハット', NULL,
  '{}'::text[], '{"T1010001126172"}'::text[], '{}'::text[], NULL,
  'auto_parts', NULL, NULL,
  NULL, 'expense', NULL,
  'VEHICLE_COSTS', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0202', '株式会社ＺＯＺＯ', 'ZOZO', NULL,
  '{"ZOZOタウン","ZOZOTOWN"}'::text[], '{"T4040001010503"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0203', 'ＧＭＯペパボ株式会社', 'GMOペパボ', NULL,
  '{"minne","カラーミーショップ"}'::text[], '{"T5011001042496"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0205', 'ＬＩＮＥヤフー株式会社', 'LINEヤフー', NULL,
  '{"Yahoo! JAPAN","LINE","PayPay"}'::text[], '{"T4010401039979"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0206', '株式会社サイバーエージェント', 'サイバーエージェント', NULL,
  '{"Ameba","AbemaTV"}'::text[], '{"T8010001099195"}'::text[], '{}'::text[], NULL,
  'advertising', NULL, NULL,
  NULL, 'expense', NULL,
  'ADVERTISING', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0207', 'ＧＭＯインターネット株式会社', 'GMOインターネット', NULL,
  '{"お名前.com"}'::text[], '{"T1011001032872"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0208', '株式会社ディー・エヌ・エー', 'DeNA', NULL,
  '{"Mobage"}'::text[], '{"T4011001032721"}'::text[], '{}'::text[], NULL,
  'platform', NULL, NULL,
  NULL, 'expense', NULL,
  'FEES', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0209', '東京海上日動火災保険株式会社', '東京海上日動', NULL,
  '{"東京海上"}'::text[], '{"T2010001008824"}'::text[], '{}'::text[], NULL,
  'insurance', NULL, NULL,
  NULL, 'expense', NULL,
  'INSURANCE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0210', '損害保険ジャパン株式会社', '損保ジャパン', NULL,
  '{"SOMPO"}'::text[], '{"T4011101023372"}'::text[], '{}'::text[], NULL,
  'insurance', NULL, NULL,
  NULL, 'expense', NULL,
  'INSURANCE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0211', '三井住友海上火災保険株式会社', '三井住友海上', NULL,
  '{"MS&AD"}'::text[], '{"T6010001008795"}'::text[], '{}'::text[], NULL,
  'insurance', NULL, NULL,
  NULL, 'expense', NULL,
  'INSURANCE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0212', '日本生命保険相互会社', '日本生命', NULL,
  '{"ニッセイ"}'::text[], '{"T1120005009230"}'::text[], '{}'::text[], NULL,
  'insurance', NULL, NULL,
  NULL, 'expense', NULL,
  'INSURANCE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0213', '第一生命保険株式会社', '第一生命', NULL,
  '{}'::text[], '{"T1010001174683"}'::text[], '{}'::text[], NULL,
  'insurance', NULL, NULL,
  NULL, 'expense', NULL,
  'INSURANCE_CORP', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0214', '大江戸温泉物語グループ株式会社', '大江戸温泉物語', NULL,
  '{}'::text[], '{"T9010001184601"}'::text[], '{}'::text[], NULL,
  'spa', NULL, NULL,
  NULL, 'expense', NULL,
  'WELFARE', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0215', '株式会社万葉倶楽部', '万葉の湯', NULL,
  '{"万葉倶楽部"}'::text[], '{"T3021001032036"}'::text[], '{}'::text[], NULL,
  'spa', NULL, NULL,
  NULL, 'expense', NULL,
  'WELFARE', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0216', '湯楽株式会社', '湯楽', NULL,
  '{"おふろの王様"}'::text[], '{"T9140001105172"}'::text[], '{}'::text[], NULL,
  'spa', NULL, NULL,
  NULL, 'expense', NULL,
  'WELFARE', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0217', '西日本高速道路株式会社', '西日本高速道路', NULL,
  '{"NEXCO西日本"}'::text[], '{"T3120001112341"}'::text[], '{}'::text[], NULL,
  'highway', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0218', '阪神高速道路株式会社', '阪神高速', NULL,
  '{}'::text[], '{"T2120001112350"}'::text[], '{}'::text[], NULL,
  'highway', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0219', '東日本高速道路株式会社', '東日本高速道路', NULL,
  '{"NEXCO東日本"}'::text[], '{"T9010001095716"}'::text[], '{}'::text[], NULL,
  'highway', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0220', '中日本高速道路株式会社', '中日本高速道路', NULL,
  '{"NEXCO中日本"}'::text[], '{"T4180001056169"}'::text[], '{}'::text[], NULL,
  'highway', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0221', '日本航空株式会社', 'JAL', NULL,
  '{"日本航空","ＪＡＬ"}'::text[], '{"T7010701007666"}'::text[], '{}'::text[], NULL,
  'airline_ship', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0222', '全日本空輸株式会社', 'ANA', NULL,
  '{"全日空","ＡＮＡ"}'::text[], '{"T1010401099027"}'::text[], '{}'::text[], NULL,
  'airline_ship', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0223', 'スカイマーク株式会社', 'スカイマーク', NULL,
  '{"SKY"}'::text[], '{"T7010801019529"}'::text[], '{}'::text[], NULL,
  'airline_ship', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0224', '株式会社ジェットスター・ジャパン', 'ジェットスター', NULL,
  '{"Jetstar"}'::text[], '{"T3040001076850"}'::text[], '{}'::text[], NULL,
  'airline_ship', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'gbl-0225', '商船三井フェリー株式会社', '商船三井フェリー', NULL,
  '{"MOLフェリー"}'::text[], '{"T4010701022437"}'::text[], '{}'::text[], NULL,
  'airline_ship', NULL, NULL,
  NULL, 'expense', NULL,
  'TRAVEL', NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0001', 'ATM出金', 'atm', NULL,
  '{"ATM","ＡＴＭ","ATM入出金"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'ATM', 'bank',
  'A', 'expense', NULL,
  'CASH', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0002', 'ATM入金', 'atm', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'ATM', 'bank',
  'A', 'income', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'CASH', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0003', '受取利息', '利息', NULL,
  '{"普通預金利息","利子"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'INTEREST_INCOME', 'bank',
  'A', 'income', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  'SALES_NON_TAXABLE', NULL,
  'INTEREST_INCOME', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0004', '支払利息（銀行）', '支払利息', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'INTEREST_EXPENSE', 'bank',
  'A', 'expense', NULL,
  'INTEREST_EXPENSE', NULL, NULL,
  'PURCHASE_NON_TAXABLE', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0005', '銀行振込手数料', '振込手数料', NULL,
  '{"振込手数料","送金手数料"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'BANK_FEE', 'bank',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0006', '口座維持手数料', '口座維持手数料', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'ACCOUNT_FEE', 'bank',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0007', '外国為替手数料', '外国為替手数料', NULL,
  '{"為替手数料"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'FOREIGN_EXCHANGE_FEE', 'bank',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0008', '自社口座間移動（出）', '口座間振替', NULL,
  '{"振替","資金移動"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'INTERNAL_TRANSFER', 'bank',
  'A', 'expense', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0009', '自社口座間移動（入）', '口座間振替', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'INTERNAL_TRANSFER', 'bank',
  'A', 'income', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0010', '借入金入金', '借入金', NULL,
  '{"融資実行"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'LOAN_RECEIPT', 'bank',
  'A', 'income', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'SHORT_TERM_BORROWINGS', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0011', '借入金返済', '借入金返済', NULL,
  '{"元金返済"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'LOAN_REPAYMENT', 'bank',
  'A', 'expense', NULL,
  'SHORT_TERM_BORROWINGS', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0012', 'クレカ年会費', '年会費', NULL,
  '{"カード年会費"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'CREDIT_CARD_ANNUAL_FEE', 'credit',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ACCRUED_EXPENSES', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0013', 'クレカ利用明細手数料', '利用明細手数料', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'CREDIT_CARD_STATEMENT_FEE', 'credit',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ACCRUED_EXPENSES', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0014', 'クレカ遅延損害金', '遅延損害金', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'CREDIT_CARD_LATE_FEE', 'credit',
  'A', 'expense', NULL,
  'MISC_LOSS', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0015', 'リボ払い手数料', 'リボ', NULL,
  '{"リボ払い","リボルビング"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'REVOLVING_FEE', 'credit',
  'A', 'expense', NULL,
  'INTEREST_EXPENSE', NULL, NULL,
  'PURCHASE_NON_TAXABLE', NULL,
  'ACCRUED_EXPENSES', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0016', 'キャッシング手数料', 'キャッシング手数料', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'CARD_CASH_ADVANCE_FEE', 'credit',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ACCRUED_EXPENSES', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0017', 'キャッシング利息', 'キャッシング利息', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'CARD_CASH_ADVANCE_INTEREST', 'credit',
  'A', 'expense', NULL,
  'INTEREST_EXPENSE', NULL, NULL,
  'PURCHASE_NON_TAXABLE', NULL,
  'ACCRUED_EXPENSES', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0018', '海外利用手数料', '海外利用手数料', NULL,
  '{"海外事務手数料"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'FOREIGN_TRANSACTION_FEE', 'credit',
  'A', 'expense', NULL,
  'FEES', NULL, NULL,
  'PURCHASE_TAXABLE_10', NULL,
  'ACCRUED_EXPENSES', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0019', 'キャッシュバック', 'キャッシュバック', NULL,
  '{"ポイント還元"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'CASHBACK', 'all',
  'insufficient', 'income', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0020', '給与振込（支払元不明）', '給与', NULL,
  '{"給料","賃金"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'UNIDENTIFIED_SALARY', 'all',
  'insufficient', 'expense', NULL,
  'SALARIES', NULL, NULL,
  'COMMON_EXEMPT', NULL,
  'ORDINARY_DEPOSIT', NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0021', '突合不能入金', '不明入金', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'UNIDENTIFIED_INFLOW', 'all',
  'insufficient', 'income', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0022', '突合不能出金', '不明出金', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'UNIDENTIFIED_OUTFLOW', 'all',
  'insufficient', 'expense', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0023', '現金過不足調整', '現金過不足', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'PETTY_CASH_ADJUSTMENT', 'all',
  'insufficient', 'expense', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0024', '補助金・助成金受取', '補助金', NULL,
  '{"助成金"}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'SUBSIDY_RECEIVED', 'all',
  'insufficient', 'income', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0025', '保険金受取', '保険金', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'INSURANCE_RECEIVED', 'all',
  'insufficient', 'income', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

INSERT INTO vendors (
  vendor_id, company_name, match_key, display_name,
  aliases, t_numbers, phone_numbers, address,
  vendor_vector, non_vendor_type, source_category,
  level, direction, amount_threshold,
  debit_account, debit_account_over, debit_sub_account,
  debit_tax_category, debit_department,
  credit_account, credit_sub_account, credit_tax_category,
  credit_department, scope, client_id
) VALUES (
  'nv-0026', 'その他取引先外', 'その他', NULL,
  '{}'::text[], '{}'::text[], '{}'::text[], NULL,
  NULL, 'OTHER_NON_VENDOR', 'all',
  'insufficient', 'expense', NULL,
  NULL, NULL, NULL,
  NULL, NULL,
  NULL, NULL, NULL,
  NULL, 'global', NULL
) ON CONFLICT (vendor_id) DO NOTHING;

-- § 3. accounts（241件）
-- 元データ: data/account-master.json

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKIN_CORP', '現金', 'corp', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  1, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKIN_IND', '現金', 'individual', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  1, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'FUTSUUYOKIN_CORP', '普通預金', 'corp', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  2, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'FUTSUUYOKIN_IND', '普通預金', 'individual', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  2, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOUZAYOKIN_CORP', '当座預金', 'corp', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  3, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOUZAYOKIN_IND', '当座預金', 'individual', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  3, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TEIKIYOKIN_CORP', '定期預金', 'corp', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  4, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TEIKIYOKIN_IND', '定期預金', 'individual', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  4, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'UKETORITEGATA_CORP', '受取手形', 'corp', 'BS_ASSET', 'TRADE_RECEIVABLES',
  'COMMON_EXEMPT', NULL, NULL,
  5, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'UKETORITEGATA_IND', '受取手形', 'individual', 'BS_ASSET', 'TRADE_RECEIVABLES',
  'COMMON_EXEMPT', NULL, NULL,
  5, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIKAKEKIN_CORP', '売掛金', 'corp', 'BS_ASSET', 'TRADE_RECEIVABLES',
  'COMMON_EXEMPT', NULL, NULL,
  6, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIKAKEKIN_IND', '売掛金', 'individual', 'BS_ASSET', 'TRADE_RECEIVABLES',
  'COMMON_EXEMPT', NULL, NULL,
  6, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YUUKASHOUKEN_CORP', '有価証券', 'corp', 'BS_ASSET', 'MARKETABLE_SECURITIES',
  'COMMON_EXEMPT', NULL, NULL,
  7, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YUUKASHOUKEN_IND', '有価証券', 'individual', 'BS_ASSET', 'MARKETABLE_SECURITIES',
  'COMMON_EXEMPT', NULL, NULL,
  7, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MAEBARAIKIN_CORP', '前払金', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  8, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MAEBARAIKIN_IND', '前払金', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  8, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIBARAIKIN_CORP', '仮払金', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  9, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIBARAIKIN_IND', '仮払金', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  9, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TATEMONO_CORP', '建物', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  10, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TATEMONO_IND', '建物', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  10, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUCHIKUBUTSU_CORP', '構築物', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  11, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUCHIKUBUTSU_IND', '構築物', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  11, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHARYOUUNPANGU_CORP', '車両運搬具', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  12, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHARYOUUNPANGU_IND', '車両運搬具', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  12, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOCHI_CORP', '土地', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'COMMON_EXEMPT', NULL, NULL,
  13, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOCHI_IND', '土地', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'COMMON_EXEMPT', NULL, NULL,
  13, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'DENWAKANYUUKEN_CORP', '電話加入権', 'corp', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  14, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'DENWAKANYUUKEN_IND', '電話加入権', 'individual', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  14, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIKIKIN_CORP', '敷金', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  15, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIKIKIN_IND', '敷金', 'individual', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  15, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SASHIIREHOSHOUKIN_CORP', '差入保証金', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  16, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SASHIIREHOSHOUKIN_IND', '差入保証金', 'individual', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  16, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHARAITEGATA_CORP', '支払手形', 'corp', 'BS_LIABILITY', 'TRADE_PAYABLES',
  'COMMON_EXEMPT', NULL, NULL,
  20, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHARAITEGATA_IND', '支払手形', 'individual', 'BS_LIABILITY', 'TRADE_PAYABLES',
  'COMMON_EXEMPT', NULL, NULL,
  20, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAIKAKEKIN_CORP', '買掛金', 'corp', 'BS_LIABILITY', 'TRADE_PAYABLES',
  'COMMON_EXEMPT', NULL, NULL,
  21, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAIKAKEKIN_IND', '買掛金', 'individual', 'BS_LIABILITY', 'TRADE_PAYABLES',
  'COMMON_EXEMPT', NULL, NULL,
  21, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIHARAIKIN_CORP', '未払金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  22, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIHARAIKIN_IND', '未払金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  22, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'AZUKARIKIN_CORP', '預り金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  23, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'AZUKARIKIN_IND', '預り金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  23, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MAEUKEKIN_CORP', '前受金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  24, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MAEUKEKIN_IND', '前受金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  24, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIUKEKIN_CORP', '仮受金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  25, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIUKEKIN_IND', '仮受金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  25, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHOUKIKARIIREKIN_CORP', '長期借入金', 'corp', 'BS_LIABILITY', 'NON_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  26, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHOUKIKARIIREKIN_IND', '長期借入金', 'individual', 'BS_LIABILITY', 'NON_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  26, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIAGEDAKA_CORP', '売上高', 'corp', 'PL_REVENUE', 'NET_SALES',
  'SALES_TAXABLE_10', NULL, NULL,
  30, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIAGEDAKA_IND', '売上高', 'individual', 'PL_REVENUE', 'SALES_REVENUE',
  'SALES_TAXABLE_10', NULL, NULL,
  30, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'FUKURIKOUSEIHI_CORP', '福利厚生費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  40, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'FUKURIKOUSEIHI_IND', '福利厚生費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  40, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOUTEIFUKURIHI_CORP', '法定福利費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  41, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOUTEIFUKURIHI_IND', '法定福利費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  41, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TSUUSHINHI_CORP', '通信費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  42, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TSUUSHINHI_IND', '通信費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  42, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'NIZUKURIUNCHIN_CORP', '荷造運賃', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  43, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'NIZUKURIUNCHIN_IND', '荷造運賃', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  43, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SUIDOUKOUNETSUHI_CORP', '水道光熱費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  44, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SUIDOUKOUNETSUHI_IND', '水道光熱費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  44, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RYOHIKOUTSUUHI_CORP', '旅費交通費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  45, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RYOHIKOUTSUUHI_IND', '旅費交通費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  45, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUKOKUSENDENHI_CORP', '広告宣伝費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  46, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUKOKUSENDENHI_IND', '広告宣伝費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  46, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SETTAIKOUSAIHI_CORP', '接待交際費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  47, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SETTAIKOUSAIHI_IND', '接待交際費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  47, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAIGIHI_CORP', '会議費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  48, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAIGIHI_IND', '会議費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  48, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHUUZENHI_CORP', '修繕費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  49, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHUUZENHI_IND', '修繕費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  49, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHIDAIYACHIN_CORP', '地代家賃', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  50, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHIDAIYACHIN_IND', '地代家賃', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  50, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SOZEIKOUKAI_CORP', '租税公課', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  51, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SOZEIKOUKAI_IND', '租税公課', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  51, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHARAITESUURYOU_CORP', '支払手数料', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  52, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHARAITESUURYOU_IND', '支払手数料', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  52, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKASHOUKYAKUHI_CORP', '減価償却費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  53, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKASHOUKYAKUHI_IND', '減価償却費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  53, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZAPPI_CORP', '雑費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  54, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZAPPI_IND', '雑費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  54, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHARYOUHI_CORP', '車両費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  55, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHARYOUHI_IND', '車両費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  55, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RIISURYOU_CORP', 'リース料', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  56, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RIISURYOU_IND', 'リース料', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  56, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHINBUNTOSHOHI_CORP', '新聞図書費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  57, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHINBUNTOSHOHI_IND', '新聞図書費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  57, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURINOBESHISANSHOUKYAKU_CORP', '繰延資産償却', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  58, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURINOBESHISANSHOUKYAKU_IND', '繰延資産償却', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  58, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONOTANOYOKIN_IND', 'その他の預金', 'individual', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  100, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHOUHIN_IND', '商品', 'individual', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  101, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHOZOUHIN_IND', '貯蔵品', 'individual', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  102, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZAIRYOU_IND', '材料', 'individual', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  103, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIKAKARIHIN_IND', '仕掛品', 'individual', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  104, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SEIHIN_IND', '製品', 'individual', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  105, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHITSUKEKIN_IND', '貸付金', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  106, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TATEKAEKIN_IND', '立替金', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  107, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MISHUUKIN_IND', '未収金', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  108, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUGUKIGUBIHIN_IND', '工具器具備品', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  109, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KIKAISOUCHI_IND', '機械装置', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  110, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAIGYOUHI_CORP', '開業費', 'corp', 'BS_ASSET', 'DEFERRED_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  111, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAIGYOUHI_IND', '開業費', 'individual', 'BS_ASSET', 'DEFERRED_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  111, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'JIGYOUNUSHIKASHI_IND', '事業主貸', 'individual', 'BS_ASSET', 'OWNERS_DRAWINGS',
  'COMMON_EXEMPT', NULL, NULL,
  112, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'JIGYOUNUSHIKARI_IND', '事業主借', 'individual', 'BS_LIABILITY', 'OWNERS_CAPITAL',
  'COMMON_EXEMPT', NULL, NULL,
  113, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MOTOIREKIN_IND', '元入金', 'individual', 'BS_EQUITY', 'EQUITY',
  'COMMON_EXEMPT', NULL, NULL,
  114, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIIREKIN_IND', '借入金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  115, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREHIKIATEKIN_IND', '貸倒引当金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  116, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIKAKUTEIKANJOU_CORP', '未確定勘定', 'corp', 'BS_ASSET', 'SUNDRIES',
  'COMMON_EXEMPT', NULL, NULL,
  117, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIKAKUTEIKANJOU_IND', '未確定勘定', 'individual', 'BS_ASSET', 'SUNDRIES',
  'COMMON_EXEMPT', NULL, NULL,
  117, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIAGENEBIKIHENPIN_IND', '売上値引・返品', 'individual', 'PL_REVENUE', 'SALES_REVENUE',
  'SALES_RETURN_10', NULL, NULL,
  120, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KAJISHOUHITOU_IND', '家事消費等', 'individual', 'PL_REVENUE', 'SALES_REVENUE',
  'SALES_TAXABLE_10', NULL, NULL,
  121, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZATSUSHUUNYUU_IND', '雑収入', 'individual', 'PL_REVENUE', 'SALES_REVENUE',
  'SALES_TAXABLE_10', NULL, NULL,
  122, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KISHUSHOUHINTANAOROSHIDAKA_CORP', '期首商品棚卸高', 'corp', 'PL_EXPENSE', 'BEGINNING_INVENTORY',
  'COMMON_EXEMPT', NULL, NULL,
  123, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KISHUSHOUHINTANAOROSHIDAKA_IND', '期首商品棚卸高', 'individual', 'PL_EXPENSE', 'BEGINNING_MERCHANDISE_INVENTORY',
  'COMMON_EXEMPT', NULL, NULL,
  123, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIIREDAKA_IND', '仕入高', 'individual', 'PL_EXPENSE', 'COST_OF_PURCHASED_GOODS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  124, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIIRENEBIKIHENPIN_IND', '仕入値引・返品', 'individual', 'PL_EXPENSE', 'COST_OF_PURCHASED_GOODS',
  'PURCHASE_RETURN_10', NULL, NULL,
  125, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KIMATSUSHOUHINTANAOROSHIDAKA_CORP', '期末商品棚卸高', 'corp', 'PL_EXPENSE', 'ENDING_INVENTORY',
  'COMMON_EXEMPT', NULL, NULL,
  126, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KIMATSUSHOUHINTANAOROSHIDAKA_IND', '期末商品棚卸高', 'individual', 'PL_EXPENSE', 'ENDING_MERCHANDISE_INVENTORY',
  'COMMON_EXEMPT', NULL, NULL,
  126, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONGAIHOKENRYOU_IND', '損害保険料', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_NON_TAXABLE', NULL, NULL,
  127, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHOUMOUHINHI_IND', '消耗品費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  128, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KYUURYOUCHINGIN_IND', '給料賃金', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  129, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TAISHOKUKYUUYO_CORP', '退職給与', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  130, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TAISHOKUKYUUYO_IND', '退職給与', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  130, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GAICHUUKOUCHIN_IND', '外注工賃', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  131, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RISHIWARIBIKIRYOU_IND', '利子割引料', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  132, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREKIN_IND', '貸倒金(損失)', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'SALES_BAD_DEBT_10', NULL, NULL,
  133, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KENSHUUSAIYOUHI_CORP', '研修採用費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  134, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KENSHUUSAIYOUHI_IND', '研修採用費', 'individual', 'PL_EXPENSE', 'EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  134, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREHIKIATEKINMODOSHIIRE_IND', '貸倒引当金戻入', 'individual', 'PL_REVENUE', 'REVERSALS',
  'COMMON_EXEMPT', NULL, NULL,
  135, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SENJUSHAKYUUYO_IND', '専従者給与', 'individual', 'PL_EXPENSE', 'PROVISIONS',
  'PURCHASE_EXEMPT', NULL, NULL,
  136, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREHIKIATEKINKUNIIRE_IND', '貸倒引当金繰入', 'individual', 'PL_EXPENSE', 'PROVISIONS',
  'COMMON_EXEMPT', NULL, NULL,
  137, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHINTAIRYOU_FUDOUSAN_IND', '賃貸料(不動産)', 'individual', 'PL_REVENUE', 'REAL_ESTATE_INCOME',
  'SALES_TAXABLE_10', NULL, NULL,
  200, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'REIKINKENRIKINKOUSHINRYOU_FUDOUSAN_IND', '礼金・権利金更新料(不動産)', 'individual', 'PL_REVENUE', 'REAL_ESTATE_INCOME',
  'SALES_TAXABLE_10', NULL, NULL,
  201, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MEIGIKAKIKAESONOTA_FUDOUSAN_IND', '名義書換料その他(不動産)', 'individual', 'PL_REVENUE', 'REAL_ESTATE_INCOME',
  'SALES_TAXABLE_10', NULL, NULL,
  202, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SOZEIKOUKAI_FUDOUSAN_IND', '租税公課(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  203, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONGAIHOKENRYOU_FUDOUSAN_IND', '損害保険料(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_NON_TAXABLE', NULL, NULL,
  204, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHUUZENHI_FUDOUSAN_IND', '修繕費(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  205, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKASHOUKYAKUHI_FUDOUSAN_IND', '減価償却費(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  206, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIIREKINRISHI_FUDOUSAN_IND', '借入金利子(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  207, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHIDAIYACHIN_FUDOUSAN_IND', '地代家賃(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  208, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KYUURYOUCHINGIN_FUDOUSAN_IND', '給料賃金(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  209, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GAICHUUKANRIHI_FUDOUSAN_IND', '外注管理費(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  210, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RYOHIKOUTSUUHI_FUDOUSAN_IND', '旅費交通費(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  211, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHINBUNTOSHOHI_FUDOUSAN_IND', '新聞図書費(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  212, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONOTANOKEIHI_FUDOUSAN_IND', 'その他の経費(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  213, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SENJUSHAKYUUYO_FUDOUSAN_IND', '専従者給与(不動産)', 'individual', 'PL_EXPENSE', 'REAL_ESTATE_EMPLOYEE_SALARY',
  'PURCHASE_EXEMPT', NULL, NULL,
  214, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONOTANOYOKIN_CORP', 'その他の預金', 'corp', 'BS_ASSET', 'CASH_AND_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  300, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHOUHIN_CORP', '商品', 'corp', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  301, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SEIHIN_CORP', '製品', 'corp', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  302, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZAIRYOU_CORP', '材料', 'corp', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  303, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIKAKARIHIN_CORP', '仕掛品', 'corp', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  304, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHOZOUHIN_CORP', '貯蔵品', 'corp', 'BS_ASSET', 'INVENTORIES',
  'COMMON_EXEMPT', NULL, NULL,
  305, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TANKIKASHITSUKEKIN_CORP', '短期貸付金', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  307, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MISHUUNYUUKIN_CORP', '未収入金', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  308, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TATEKAEKIN_CORP', '立替金', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  309, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREHIKIATEKIN_CORP', '貸倒引当金', 'corp', 'BS_ASSET', 'TRADE_RECEIVABLES',
  'COMMON_EXEMPT', NULL, NULL,
  310, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KIKAISOUCHI_CORP', '機械装置', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  312, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUGUKIGUBIHIN_CORP', '工具器具備品', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  313, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SOFUTOWEA_CORP', 'ソフトウェア', 'corp', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  315, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOUSHIYUUKASHOUKEN_CORP', '投資有価証券', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  316, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHOUKIKASHITSUKEKIN_CORP', '長期貸付金', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  317, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'CHOUKIMAEBARAIHIYOU_CORP', '長期前払費用', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  318, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TANKIKARIIREKIN_CORP', '短期借入金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  319, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIHARAIHIYOU_CORP', '未払費用', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  320, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHONKIN_CORP', '資本金', 'corp', 'BS_EQUITY', 'CAPITAL_STOCK',
  'COMMON_EXEMPT', NULL, NULL,
  323, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHONJUNBIKIN_CORP', '資本準備金', 'corp', 'BS_EQUITY', 'LEGAL_CAPITAL_SURPLUS',
  'COMMON_EXEMPT', NULL, NULL,
  324, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURIKOSHIRIEKIJOURYOKIN_CORP', '繰越利益剰余金', 'corp', 'BS_EQUITY', 'RETAINED_EARNINGS_BROUGHT_FORWARD',
  'COMMON_EXEMPT', NULL, NULL,
  325, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIAGENEBIKIHENPIN_CORP', '売上値引・返品', 'corp', 'PL_REVENUE', 'NET_SALES',
  'SALES_RETURN_10', NULL, NULL,
  330, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIIREDAKA_CORP', '仕入高', 'corp', 'PL_EXPENSE', 'COST_OF_PURCHASED_GOODS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  332, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIIRENEBIKIHENPIN_CORP', '仕入値引・返品', 'corp', 'PL_EXPENSE', 'COST_OF_PURCHASED_GOODS',
  'PURCHASE_RETURN_10', NULL, NULL,
  332.5, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YAKUINHOUSHUU_CORP', '役員報酬', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  333, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KYUURYOUCHINGIN_CORP', '給料賃金', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  334, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHOUYO_CORP', '賞与', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  335, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOKENRYOU_CORP', '保険料', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_NON_TAXABLE', NULL, NULL,
  338, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KIFUKIN_CORP', '寄付金', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  341, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREHIKIATEKINKUNIREGAKU_CORP', '貸倒引当金繰入額', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  342, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAORESONSHITSU_CORP', '貸倒損失', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'SALES_BAD_DEBT_10', NULL, NULL,
  343, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'UKETORIRISOKU_CORP', '受取利息', 'corp', 'PL_REVENUE', 'NON_OPERATING_INCOME',
  'SALES_NON_TAXABLE', NULL, NULL,
  344, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'UKETORIHAITOUKIN_CORP', '受取配当金', 'corp', 'PL_REVENUE', 'NON_OPERATING_INCOME',
  'SALES_EXEMPT', NULL, NULL,
  345, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZATSUSHUUNYUU_CORP', '雑収入', 'corp', 'PL_REVENUE', 'NON_OPERATING_INCOME',
  'SALES_TAXABLE_10', NULL, NULL,
  346, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHARAIRISOKU_CORP', '支払利息', 'corp', 'PL_EXPENSE', 'NON_OPERATING_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  347, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZATSUSONSHITSU_CORP', '雑損失', 'corp', 'PL_EXPENSE', 'NON_OPERATING_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  348, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOTEISHISANBAIKYAKUEKI_CORP', '固定資産売却益', 'corp', 'PL_REVENUE', 'EXTRAORDINARY_INCOME',
  'COMMON_EXEMPT', NULL, NULL,
  350, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOTEISHISANBAIKYAKUSON_CORP', '固定資産売却損', 'corp', 'PL_EXPENSE', 'EXTRAORDINARY_LOSSES',
  'COMMON_EXEMPT', NULL, NULL,
  351, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MISHUUCHINTAIRYOU_CORP', '未収賃貸料', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  352, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MISHUUCHINTAIRYOU_IND', '未収賃貸料', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  352, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIBARAISHYOUHIZEI_CORP', '仮払消費税', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  353, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIBARAISHYOUHIZEI_IND', '仮払消費税', 'individual', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  353, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'FUZOKUSETSUBI_CORP', '附属設備', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  354, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'FUZOKUSETSUBI_IND', '附属設備', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  354, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SENPAKU_CORP', '船舶', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  355, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SENPAKU_IND', '船舶', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  355, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'IKKATSUSHOUKYAKUSHISAN_CORP', '一括償却資産', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  356, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'IKKATSUSHOUKYAKUSHISAN_IND', '一括償却資産', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  356, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKASHOUKYAKURUIKEIGAKU_CORP', '減価償却累計額', 'corp', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'COMMON_EXEMPT', NULL, NULL,
  357, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GENKASHOUKYAKURUIKEIGAKU_IND', '減価償却累計額', 'individual', 'BS_ASSET', 'PROPERTY_PLANT_AND_EQUIPMENT',
  'COMMON_EXEMPT', NULL, NULL,
  357, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHAKKUCHIKEN_CORP', '借地権', 'corp', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  358, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHAKKUCHIKEN_IND', '借地権', 'individual', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  358, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUKYOUSHISETSUFUTANKIN_CORP', '公共施設負担金', 'corp', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  359, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KOUKYOUSHISETSUFUTANKIN_IND', '公共施設負担金', 'individual', 'BS_ASSET', 'INTANGIBLE_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  359, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YOTAKUKIN_CORP', '預託金', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  360, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YOTAKUKIN_IND', '預託金', 'individual', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  360, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHISANJOUTOSON_IND', '資産譲渡損', 'individual', 'BS_ASSET', 'OWNERS_DRAWINGS',
  'COMMON_EXEMPT', NULL, NULL,
  361, false, false, false,
  false, false, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURINOBEZEIKINSHISAN_CORP', '繰延税金資産(流)', 'corp', 'BS_ASSET', 'OTHER_CURRENT_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  362, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHUSSHIKIN_CORP', '出資金', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  363, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURINOBEZEIKINSHISAN_CORP_2', '繰延税金資産(固)', 'corp', 'BS_ASSET', 'INVESTMENTS_AND_OTHER_ASSETS',
  'COMMON_EXEMPT', NULL, NULL,
  364, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SOURITSUHI_CORP', '創立費', 'corp', 'BS_ASSET', 'DEFERRED_ASSETS',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  365, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURINOBEZEIKINFUSAI_CORP', '繰延税金負債(流)', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  366, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'AZUKARIHOSHOUKIN_CORP', '預り保証金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  367, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIHARAISHOUHIZEI_CORP', '未払消費税', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  368, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIHARAIHOUJINZEITOU_CORP', '未払法人税等', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  369, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOSHOUKINSHIKIKIN_CORP', '保証金・敷金', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  370, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHOUHINKEN_CORP', '商品券', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  371, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIUKESHOUHIZEI_CORP', '仮受消費税', 'corp', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  372, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KURINOBEZEIKINFUSAI_CORP_2', '繰延税金負債(固)', 'corp', 'BS_LIABILITY', 'NON_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  373, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHINKABUSHIKIMOUSHIKOMISHOUKOKIN_CORP', '新株式申込証拠金', 'corp', 'BS_EQUITY', 'STOCK_SUBSCRIPTION_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  374, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONOTASHIHONJOUYOKIN_CORP', 'その他資本剰余金', 'corp', 'BS_EQUITY', 'OTHER_CAPITAL_SURPLUS',
  'COMMON_EXEMPT', NULL, NULL,
  375, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'RIEKIJUNBIKIN_CORP', '利益準備金', 'corp', 'BS_EQUITY', 'LEGAL_RETAINED_EARNINGS',
  'COMMON_EXEMPT', NULL, NULL,
  376, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'BETTOTSUMITATEKIN_CORP', '別途積立金', 'corp', 'BS_EQUITY', 'APPROPRIATED_RETAINED_EARNINGS',
  'COMMON_EXEMPT', NULL, NULL,
  377, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'JIKOKABUSHIKI_CORP', '自己株式', 'corp', 'BS_EQUITY', 'TREASURY_STOCK',
  'COMMON_EXEMPT', NULL, NULL,
  378, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'JIKOKABUSHIKIMOUSHIKOMISHOUKOKIN_CORP', '自己株式申込証拠金', 'corp', 'BS_EQUITY', 'TREASURY_STOCK_SUBSCRIPTION_DEPOSITS',
  'COMMON_EXEMPT', NULL, NULL,
  379, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SONOTAYUUKASHOUKENHYOUKASAGAKUKIN_CORP', 'その他有価証券評価差額金', 'corp', 'BS_EQUITY', 'VALUATION_AND_TRANSLATION_ADJUSTMENTS',
  'COMMON_EXEMPT', NULL, NULL,
  380, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOCHISAIHYOUKASAGAKUKIN_CORP', '土地再評価差額金', 'corp', 'BS_EQUITY', 'VALUATION_AND_TRANSLATION_ADJUSTMENTS',
  'COMMON_EXEMPT', NULL, NULL,
  381, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHINKABUYOYAKUKEN_CORP', '新株予約権', 'corp', 'BS_EQUITY', 'SUBSCRIPTION_RIGHTS_TO_SHARES',
  'COMMON_EXEMPT', NULL, NULL,
  382, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TAKANJOUFURIKAEDAKA_CORP', '他勘定振替高', 'corp', 'PL_EXPENSE', 'TRANSFERS_TO_OTHER_ACCOUNTS',
  'COMMON_EXEMPT', NULL, NULL,
  383, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZAKKYUU_CORP', '雑給', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_EXEMPT', NULL, NULL,
  384, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'GYOUMUITAKURYOU_CORP', '業務委託料', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  385, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'BIHINSHOUMOUHINHI_CORP', '備品・消耗品費', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  386, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIHARAIHOUSHUU_CORP', '支払報酬', 'corp', 'PL_EXPENSE', 'SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES',
  'PURCHASE_TAXABLE_10', NULL, NULL,
  387, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KASHIDAOREHIKIATEKINREINYUUGAKU_CORP', '貸倒引当金戻入額', 'corp', 'PL_REVENUE', 'NON_OPERATING_INCOME',
  'COMMON_EXEMPT', NULL, NULL,
  388, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YUUKASHOUKENBAIKYAKUEKI_CORP', '有価証券売却益', 'corp', 'PL_REVENUE', 'NON_OPERATING_INCOME',
  'SALES_NON_TAXABLE_SECURITIES', NULL, NULL,
  389, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHIIREWARIBIKI_CORP', '仕入割引', 'corp', 'PL_REVENUE', 'NON_OPERATING_INCOME',
  'PURCHASE_RETURN_10', NULL, NULL,
  390, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'YUUKASHOUKENBAIKYAKUSON_CORP', '有価証券売却損', 'corp', 'PL_EXPENSE', 'NON_OPERATING_EXPENSES',
  'COMMON_EXEMPT', NULL, NULL,
  391, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'URIAGEWARIBIKI_CORP', '売上割引', 'corp', 'PL_EXPENSE', 'NON_OPERATING_EXPENSES',
  'SALES_RETURN_10', NULL, NULL,
  392, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZENKISONEKISHUUSEIEKI_CORP', '前期損益修正益', 'corp', 'PL_REVENUE', 'EXTRAORDINARY_INCOME',
  'COMMON_EXEMPT', NULL, NULL,
  393, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOUSHIYUUKASHOUKENBAIKYAKUEKI_CORP', '投資有価証券売却益', 'corp', 'PL_REVENUE', 'EXTRAORDINARY_INCOME',
  'COMMON_EXEMPT', NULL, NULL,
  394, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'ZENKISONEKISHUUSEISON_CORP', '前期損益修正損', 'corp', 'PL_EXPENSE', 'EXTRAORDINARY_LOSSES',
  'COMMON_EXEMPT', NULL, NULL,
  395, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'TOUSHIYUUKASHOUKENBAIKYAKUSON_CORP', '投資有価証券売却損', 'corp', 'PL_EXPENSE', 'EXTRAORDINARY_LOSSES',
  'COMMON_EXEMPT', NULL, NULL,
  396, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOUJINZEITOU_CORP', '法人税等', 'corp', 'PL_EXPENSE', 'CORPORATE_INCOME_TAXES_CURRENT',
  'COMMON_EXEMPT', NULL, NULL,
  397, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOUJINZEITOUCHOUSEIGAKU_CORP', '法人税等調整額', 'corp', 'PL_EXPENSE', 'CORPORATE_INCOME_TAXES_DEFERRED',
  'COMMON_EXEMPT', NULL, NULL,
  398, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'MIHARAISHOUHIZEI_IND', '未払消費税', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  399, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'HOSHOUKINSHIKIKIN_IND', '保証金・敷金', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  400, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'SHOUHINKEN_IND', '商品券', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  401, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (
  id, name, target, account_group, category,
  default_tax_category_id, effective_from, effective_to,
  sort_order, hidden_in_master, is_custom, hidden,
  is_master_custom, is_client_custom, source
) VALUES (
  'KARIUKESHOUHIZEI_IND', '仮受消費税', 'individual', 'BS_LIABILITY', 'OTHER_CURRENT_LIABILITIES',
  'COMMON_EXEMPT', NULL, NULL,
  402, NULL, false, false,
  NULL, NULL, 'mcp'
) ON CONFLICT (id) DO NOTHING;

-- § 4. tax_categories（151件）
-- 元データ: data/tax-category-master.json
-- テーブル定義: 018_tax_categories.sql（マイグレーション）

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'COMMON_UNKNOWN', '不明', '不明', 'common', false,
  true, true, false, '1989-04-01', NULL,
  true, 1, false, 0, 'mcp',
  true, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":true}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'COMMON_EXEMPT', '対象外', '対象外', 'common', false,
  true, true, false, '1989-04-01', NULL,
  true, 2, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":true}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10', '課税売上 10%', '課売 10%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 3, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10_T1', '課税売上 10% 一種', '課売 10% 一種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 4, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10_T2', '課税売上 10% 二種', '課売 10% 二種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 5, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10_T3', '課税売上 10% 三種', '課売 10% 三種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 6, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10_T4', '課税売上 10% 四種', '課売 10% 四種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 7, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10_T5', '課税売上 10% 五種', '課売 10% 五種', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  false, 8, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_10_T6', '課税売上 10% 六種', '課売 10% 六種', 'sales', false,
  false, false, false, '2015-04-01', NULL,
  false, 9, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8', '課税売上 (軽)8%', '課売 (軽)8%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 10, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8_T1', '課税売上 (軽)8% 一種', '課売 (軽)8% 一種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 11, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8_T2', '課税売上 (軽)8% 二種', '課売 (軽)8% 二種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 12, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8_T3', '課税売上 (軽)8% 三種', '課売 (軽)8% 三種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 13, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8_T4', '課税売上 (軽)8% 四種', '課売 (軽)8% 四種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 14, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8_T5', '課税売上 (軽)8% 五種', '課売 (軽)8% 五種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 15, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_REDUCED_8_T6', '課税売上 (軽)8% 六種', '課売 (軽)8% 六種', 'sales', false,
  false, false, false, '2015-04-01', NULL,
  false, 16, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8', '課税売上 8%', '課売 8%', 'sales', false,
  true, true, false, '2014-04-01', NULL,
  true, 17, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8_T1', '課税売上 8% 一種', '課売 8% 一種', 'sales', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 18, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8_T2', '課税売上 8% 二種', '課売 8% 二種', 'sales', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 19, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8_T3', '課税売上 8% 三種', '課売 8% 三種', 'sales', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 20, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8_T4', '課税売上 8% 四種', '課売 8% 四種', 'sales', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 21, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8_T5', '課税売上 8% 五種', '課売 8% 五種', 'sales', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 22, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_8_T6', '課税売上 8% 六種', '課売 8% 六種', 'sales', false,
  false, false, true, '2015-04-01', '2019-09-30',
  false, 23, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5', '課税売上 5%', '課売 5%', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 24, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5_T1', '課税売上 5% 一種', '課売 5% 一種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 25, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5_T2', '課税売上 5% 二種', '課売 5% 二種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 26, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5_T3', '課税売上 5% 三種', '課売 5% 三種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 27, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5_T4', '課税売上 5% 四種', '課売 5% 四種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 28, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5_T5', '課税売上 5% 五種', '課売 5% 五種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 29, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_TAXABLE_5_T6', '課税売上 5% 六種', '課売 5% 六種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 30, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_EXPORT_0', '輸出売上 0%', '輸売 0%', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 31, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE', '非課税売上', '非売', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 32, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE_SECURITIES', '非課税売上-有価証券譲渡', '非売-有証', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 33, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE_EXPORT', '非課税資産輸出', '非輸', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 34, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_EXEMPT', '対象外売上', '対象外売', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 35, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10', '課税売上-返還等 10%', '課売-返還 10%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 36, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10_T1', '課税売上-返還等 10% 一種', '課売-返還 10% 一種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 37, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10_T2', '課税売上-返還等 10% 二種', '課売-返還 10% 二種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 38, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10_T3', '課税売上-返還等 10% 三種', '課売-返還 10% 三種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 39, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10_T4', '課税売上-返還等 10% 四種', '課売-返還 10% 四種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 40, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10_T5', '課税売上-返還等 10% 五種', '課売-返還 10% 五種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 41, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_10_T6', '課税売上-返還等 10% 六種', '課売-返還 10% 六種', 'sales', false,
  false, false, false, '2015-04-01', NULL,
  false, 42, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8', '課税売上-返還等 (軽)8%', '課売-返還 (軽)8%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 43, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8_T1', '課税売上-返還等 (軽)8% 一種', '課売-返還 (軽)8% 一種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 44, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8_T2', '課税売上-返還等 (軽)8% 二種', '課売-返還 (軽)8% 二種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 45, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8_T3', '課税売上-返還等 (軽)8% 三種', '課売-返還 (軽)8% 三種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 46, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8_T4', '課税売上-返還等 (軽)8% 四種', '課売-返還 (軽)8% 四種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 47, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8_T5', '課税売上-返還等 (軽)8% 五種', '課売-返還 (軽)8% 五種', 'sales', false,
  false, false, false, '2019-10-01', NULL,
  false, 48, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_REDUCED_8_T6', '課税売上-返還等 (軽)8% 六種', '課売-返還 (軽)8% 六種', 'sales', false,
  false, false, false, '2015-04-01', NULL,
  false, 49, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8', '課税売上-返還等 8%', '課売-返還 8%', 'sales', false,
  true, true, false, '2014-04-01', NULL,
  true, 50, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8_T1', '課税売上-返還等 8% 一種', '課売-返還 8% 一種', 'sales', false,
  false, false, false, '2014-04-01', NULL,
  false, 51, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8_T2', '課税売上-返還等 8% 二種', '課売-返還 8% 二種', 'sales', false,
  false, false, false, '2014-04-01', NULL,
  false, 52, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8_T3', '課税売上-返還等 8% 三種', '課売-返還 8% 三種', 'sales', false,
  false, false, false, '2014-04-01', NULL,
  false, 53, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8_T4', '課税売上-返還等 8% 四種', '課売-返還 8% 四種', 'sales', false,
  false, false, false, '2014-04-01', NULL,
  false, 54, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8_T5', '課税売上-返還等 8% 五種', '課売-返還 8% 五種', 'sales', false,
  false, false, false, '2014-04-01', NULL,
  false, 55, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_8_T6', '課税売上-返還等 8% 六種', '課売-返還 8% 六種', 'sales', false,
  false, false, false, '2015-04-01', NULL,
  false, 56, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5', '課税売上-返還等 5%', '課売-返還 5%', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 57, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5_T1', '課税売上-返還等 5% 一種', '課売-返還 5% 一種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 58, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5_T2', '課税売上-返還等 5% 二種', '課売-返還 5% 二種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 59, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5_T3', '課税売上-返還等 5% 三種', '課売-返還 5% 三種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 60, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5_T4', '課税売上-返還等 5% 四種', '課売-返還 5% 四種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 61, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5_T5', '課税売上-返還等 5% 五種', '課売-返還 5% 五種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 62, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RETURN_5_T6', '課税売上-返還等 5% 六種', '課売-返還 5% 六種', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 63, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_EXPORT_RETURN_0', '輸出売上-返還等 0%', '輸売-返還 0%', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 64, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE_RETURN', '非課税売上-返還等', '非売-返還', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 65, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE_EXPORT_RETURN', '非課税資産輸出-返還等', '非輸-返還', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 66, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_BAD_DEBT_10', '課税売上-貸倒 10%', '課売-貸倒 10%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 67, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_BAD_DEBT_REDUCED_8', '課税売上-貸倒 (軽)8%', '課売-貸倒 (軽)8%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 68, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_BAD_DEBT_8', '課税売上-貸倒 8%', '課売-貸倒 8%', 'sales', false,
  true, true, false, '2014-04-01', NULL,
  true, 69, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_BAD_DEBT_5', '課税売上-貸倒 5%', '課売-貸倒 5%', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 70, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_EXPORT_BAD_DEBT_0', '輸出売上-貸倒 0%', '輸売-貸倒 0%', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 71, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE_BAD_DEBT', '非課税売上-貸倒', '非売-貸倒', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 72, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_NON_TAXABLE_EXPORT_BAD_DEBT', '非課税資産輸出-貸倒', '非輸-貸倒', 'sales', false,
  true, true, false, '1989-04-01', NULL,
  true, 73, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RECOVERY_10', '課税売上-貸倒回収 10%', '課売-回収 10%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 74, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RECOVERY_REDUCED_8', '課税売上-貸倒回収 (軽)8%', '課売-回収 (軽)8%', 'sales', false,
  true, true, false, '2019-10-01', NULL,
  true, 75, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RECOVERY_8', '課税売上-貸倒回収 8%', '課売-回収 8%', 'sales', false,
  true, true, false, '2014-04-01', NULL,
  true, 76, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'SALES_RECOVERY_5', '課税売上-貸倒回収 5%', '課売-回収 5%', 'sales', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 77, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_TAXABLE_10', '課税仕入 10%', '課仕 10%', 'purchase', true,
  true, true, false, '2019-10-01', NULL,
  true, 78, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_COMMON_10', '共通課税仕入 10%', '共-課仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  true, 79, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_NT_10', '非課税対応仕入 10%', '非-課仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  true, 80, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_REDUCED_8', '課税仕入 (軽)8%', '課仕 (軽)8%', 'purchase', true,
  true, true, false, '2019-10-01', NULL,
  true, 81, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_COMMON_REDUCED_8', '共通課税仕入 (軽)8%', '共-課仕 (軽)8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  true, 82, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_NT_REDUCED_8', '非課税対応仕入 (軽)8%', '非-課仕 (軽)8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  true, 83, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_TAXABLE_8', '課税仕入 8%', '課仕 8%', 'purchase', true,
  true, true, false, '2014-04-01', NULL,
  true, 84, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_COMMON_8', '共通課税仕入 8%', '共-課仕 8%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  true, 85, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_NT_8', '非課税対応仕入 8%', '非-課仕 8%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  true, 86, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_TAXABLE_5', '課税仕入 5%', '課仕 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 87, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_COMMON_5', '共通課税仕入 5%', '共-課仕 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 88, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_NT_5', '非課税対応仕入 5%', '非-課仕 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 89, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_BODY_10', '輸入仕入-本体 10%', '輸仕-本体 10%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  true, 90, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_TAX_7_8', '輸入仕入-消費税額 7.8%', '輸仕-消税 7.8%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  true, 91, false, 0.078, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_LOCAL_2_2', '輸入仕入-地方消費税額 2.2%', '輸仕-地税 2.2%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  true, 92, false, 0.022, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_BODY_10', '共通輸入仕入-本体 10%', '共-輸仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 93, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_TAX_7_8', '共通輸入仕入-消費税額 7.8%', '共-輸仕-消税 7.8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 94, false, 0.078, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_LOCAL_2_2', '共通輸入仕入-地方消費税額 2.2%', '共-輸仕-地税 2.2%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 95, false, 0.022, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_BODY_10', '非課税対応輸入-本体 10%', '非-輸仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 96, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_TAX_7_8', '非課税対応輸入-消費税額 7.8%', '非-輸仕-消税 7.8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 97, false, 0.078, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_LOCAL_2_2', '非課税対応輸入-地方消費税額 2.2%', '非-輸仕-地税 2.2%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 98, false, 0.022, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_BODY_REDUCED_8', '輸入仕入-本体 (軽)8%', '輸仕-本体 (軽)8%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  false, 99, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_TAX_REDUCED_6_24', '輸入仕入-消費税額 (軽)6.24%', '輸仕-消税 (軽)6.24%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  false, 100, false, 0.0624, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '6%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_LOCAL_REDUCED_1_76', '輸入仕入-地方消費税額 (軽)1.76%', '輸仕-地税 (軽)1.76%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  false, 101, false, 0.0176, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_BODY_REDUCED_8', '共通輸入仕入-本体 (軽)8%', '共-輸仕 (軽)8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 102, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_TAX_REDUCED_6_24', '共通輸入仕入-消費税額 (軽)6.24%', '共-輸仕-消税 (軽)6.24%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 103, false, 0.0624, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '6%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_LOCAL_REDUCED_1_76', '共通輸入仕入-地方消費税額 (軽)1.76%', '共-輸仕-地税 (軽)1.76%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 104, false, 0.0176, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_BODY_REDUCED_8', '非課税対応輸入-本体 (軽)8%', '非-輸仕 (軽)8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 105, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_TAX_REDUCED_6_24', '非課税対応輸入-消費税額 (軽)6.24%', '非-輸仕-消税 (軽)6.24%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 106, false, 0.0624, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '6%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_LOCAL_REDUCED_1_76', '非課税対応輸入-地方消費税額 (軽)1.76%', '非-輸仕-地税 (軽)1.76%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 107, false, 0.0176, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_BODY_8', '輸入仕入-本体 8%', '輸仕-本体 8%', 'purchase', false,
  true, true, false, '2014-04-01', NULL,
  false, 108, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_TAX_6_3', '輸入仕入-消費税額 6.3%', '輸仕-消税 6.3%', 'purchase', false,
  true, true, false, '2014-04-01', NULL,
  false, 109, false, 0.063, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '6%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_LOCAL_1_7', '輸入仕入-地方消費税額 1.7%', '輸仕-地税 1.7%', 'purchase', false,
  true, true, false, '2014-04-01', NULL,
  false, 110, false, 0.017, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_BODY_8', '共通輸入仕入-本体 8%', '共-輸仕 8%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 111, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_TAX_6_3', '共通輸入仕入-消費税額 6.3%', '共-輸仕-消税 6.3%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 112, false, 0.063, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '6%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_LOCAL_1_7', '共通輸入仕入-地方消費税額 1.7%', '共-輸仕-地税 1.7%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 113, false, 0.017, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_BODY_8', '非課税対応輸入-本体 8%', '非-輸仕 8%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 114, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_TAX_6_3', '非課税対応輸入-消費税額 6.3%', '非-輸仕-消税 6.3%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 115, false, 0.063, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '6%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_LOCAL_1_7', '非課税対応輸入-地方消費税額 1.7%', '非-輸仕-地税 1.7%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 116, false, 0.017, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '2%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_BODY_5', '輸入仕入-本体 5%', '輸仕-本体 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 117, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_TAX_4', '輸入仕入-消費税額 4%', '輸仕-消税 4%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 118, false, 0.04, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '4%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_LOCAL_1', '輸入仕入-地方消費税額 1%', '輸仕-地税 1%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 119, false, 0.01, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '1%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_BODY_5', '共通輸入仕入-本体 5%', '共-輸仕 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 120, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_TAX_4', '共通輸入仕入-消費税額 4%', '共-輸仕-消税 4%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 121, false, 0.04, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '4%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_COMMON_LOCAL_1', '共通輸入仕入-地方消費税額 1%', '共-輸仕-地税 1%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 122, false, 0.01, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '1%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_BODY_5', '非課税対応輸入-本体 5%', '非-輸仕 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 123, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_TAX_4', '非課税対応輸入-消費税額 4%', '非-輸仕-消税 4%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 124, false, 0.04, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '4%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'IMPORT_NT_LOCAL_1', '非課税対応輸入-地方消費税額 1%', '非-輸仕-地税 1%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 125, false, 0.01, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '1%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_10', '特定課税仕入 10%', '特定課仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 126, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_COMMON_10', '共通特定課税仕入 10%', '共-特定課仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 127, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_NT_10', '非課税対応特定課税仕入 10%', '非-特定課仕 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 128, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_8', '特定課税仕入 8%', '特定課仕 8%', 'purchase', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 129, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_COMMON_8', '共通特定課税仕入 8%', '共-特定課仕 8%', 'purchase', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 130, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_NT_8', '非課税対応特定課税仕入 8%', '非-特定課仕 8%', 'purchase', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 131, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_NON_TAXABLE', '非課税仕入', '非仕', 'purchase', false,
  true, true, false, '1989-04-01', NULL,
  true, 132, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_EXEMPT', '対象外仕入', '対象外仕', 'purchase', false,
  true, true, false, '1989-04-01', NULL,
  true, 133, false, 0, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '-'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_10', '課税仕入-返還等 10%', '課仕-返還 10%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  true, 134, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_COMMON_10', '共通課税仕入-返還等 10%', '共-課仕-返還 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 135, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_NT_10', '非課税対応仕入-返還等 10%', '非-課仕-返還 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 136, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_REDUCED_8', '課税仕入-返還等 (軽)8%', '課仕-返還 (軽)8%', 'purchase', false,
  true, true, false, '2019-10-01', NULL,
  true, 137, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_COMMON_REDUCED_8', '共通課税仕入-返還等 (軽)8%', '共-課仕-返還 (軽)8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 138, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_NT_REDUCED_8', '非課税対応仕入-返還等 (軽)8%', '非-課仕-返還 (軽)8%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 139, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_8', '課税仕入-返還等 8%', '課仕-返還 8%', 'purchase', false,
  true, true, false, '2014-04-01', NULL,
  true, 140, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":true,"individual":true,"simplified":true,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_COMMON_8', '共通課税仕入-返還等 8%', '共-課仕-返還 8%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 141, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_NT_8', '非課税対応仕入-返還等 8%', '非-課仕-返還 8%', 'purchase', false,
  false, false, false, '2014-04-01', NULL,
  false, 142, false, 0.08, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":true,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_5', '課税仕入-返還等 5%', '課仕-返還 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 143, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_COMMON_5', '共通課税仕入-返還等 5%', '共-課仕-返還 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 144, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_RETURN_NT_5', '非課税対応仕入-返還等 5%', '非-課仕-返還 5%', 'purchase', false,
  false, false, true, '1997-04-01', '2014-03-31',
  false, 145, false, 0.05, 'mcp',
  NULL, '2026-06-14', '2014-03-31', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '5%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_RETURN_10', '特定課税仕入-返還等 10%', '特定課仕-返還 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 146, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_RETURN_COMMON_10', '共通特定課税仕入-返還等 10%', '共-特定課仕-返還 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 147, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_RETURN_NT_10', '非課税対応特定課税仕入-返還等 10%', '非-特定課仕-返還 10%', 'purchase', false,
  false, false, false, '2019-10-01', NULL,
  false, 148, false, 0.1, 'mcp',
  NULL, '2026-06-14', NULL, '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '10%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_RETURN_8', '特定課税仕入-返還等 8%', '特定課仕-返還 8%', 'purchase', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 149, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_RETURN_COMMON_8', '共通特定課税仕入-返還等 8%', '共-特定課仕-返還 8%', 'purchase', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 150, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

INSERT INTO tax_categories (
  tax_category_id, name, short_name, direction, qualified,
  ai_selectable, active, deprecated, effective_from, effective_to,
  default_visible, display_order, is_custom, tax_rate, source,
  is_unknown_default, enabled_from, enabled_to, visible_in, display_rate
) VALUES (
  'PURCHASE_SPECIFIC_RETURN_NT_8', '非課税対応特定課税仕入-返還等 8%', '非-特定課仕-返還 8%', 'purchase', false,
  false, false, true, '2014-04-01', '2019-09-30',
  false, 151, false, 0.08, 'mcp',
  NULL, '2026-06-14', '2019-09-30', '{"proportional":false,"individual":false,"simplified":false,"exempt":false}'::jsonb, '8%'
) ON CONFLICT (tax_category_id) DO NOTHING;

-- § 5. industry_vectors（法人68件 + 個人68件）
-- 元データ: data/industry-vectors-corporate.json + industry-vectors-sole.json
-- 注: industry_vectorsテーブルは002_core_tables.sqlで定義済み

INSERT INTO industry_vectors (vector, account, direction)
VALUES ('restaurant', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('restaurant', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('cafe', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('food_market', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('food_market', 'PURCHASES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('supermarket', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('supermarket', 'PURCHASES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('convenience_store', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('convenience_store', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('general_goods', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('souvenir', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('drugstore', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('apparel', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('cosmetics', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('books', 'BOOKS_PERIODICALS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('electronics', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('electronics', 'FIXTURES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('electronics', 'PURCHASES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('bicycle', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('sports_goods', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('media_disc', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('jewelry', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('jewelry', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('florist', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('auto_dealer', 'VEHICLE_COSTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('auto_dealer', 'REPAIRS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('auto_parts', 'VEHICLE_COSTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('building_materials', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('stationery', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('beauty', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('printing', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('advertising', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('post_office', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('post_office', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('post_office', 'TAXES_DUES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('waste', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('it_service', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('it_service', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('telecom_saas', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('telecom_saas', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('telecom', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('saas', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('saas', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('education', 'TRAINING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('outsourcing', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('lease_rental', 'LEASE_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('lease_rental', 'LEASE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('staffing', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('camera_dpe', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('funeral', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('platform', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('platform', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('platform', 'SALES', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'SUPPLIES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'PURCHASES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'SALES', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('logistics', 'PACKING_SHIPPING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('consulting', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('consulting', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('legal_firm', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('construction', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('real_estate', 'RENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('real_estate', 'REPAIRS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('insurance', 'INSURANCE_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('entertainment', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('entertainment', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('leisure', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('leisure', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('cinema_music', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('spa', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('travel_agency', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('gas_station', 'VEHICLE_COSTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('taxi', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('rental_car', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('train', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('bus', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('highway', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('airline_ship', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('parking', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('hotel', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('utility', 'UTILITIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'TAXES_DUES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'LEGAL_WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'MISC_INCOME_CORP', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('social_insurance', 'LEGAL_WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('medical', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('religious', 'DONATIONS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('religious', 'MEMBERSHIP_FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('religious', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'LONG_TERM_BORROWINGS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'INTEREST_EXPENSE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'LONG_TERM_BORROWINGS', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'INTEREST_INCOME', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'SALARIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OFFICER_COMPENSATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'ADVANCE_PAID_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OFFICER_LOANS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'TEMPORARY_PAYMENTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'SALES', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'ADVANCE_PAID_CORP', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'MISC_INCOME_CORP', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OFFICER_BORROWINGS', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'DEPOSITS_RECEIVED', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('wholesale', 'PURCHASES_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('association', 'MEMBERSHIP_FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('association', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;

INSERT INTO industry_vectors (vector, account, direction)
VALUES ('restaurant', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('restaurant', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('cafe', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('food_market', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('food_market', 'PURCHASES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('supermarket', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('supermarket', 'PURCHASES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('convenience_store', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('convenience_store', 'MEETING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('general_goods', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('souvenir', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('drugstore', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('apparel', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('cosmetics', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('books', 'BOOKS_PERIODICALS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('electronics', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('electronics', 'FIXTURES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('electronics', 'PURCHASES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('bicycle', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('sports_goods', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('media_disc', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('jewelry', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('jewelry', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('florist', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('auto_dealer', 'VEHICLE_COSTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('auto_dealer', 'REPAIRS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('auto_parts', 'VEHICLE_COSTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('building_materials', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('stationery', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('beauty', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('printing', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('advertising', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('post_office', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('post_office', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('post_office', 'TAXES_DUES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('waste', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('it_service', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('it_service', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('telecom_saas', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('telecom_saas', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('telecom', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('saas', 'COMMUNICATION', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('saas', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('education', 'TRAINING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('outsourcing', 'OUTSOURCING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('lease_rental', 'LEASE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('lease_rental', 'LEASE_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('staffing', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('camera_dpe', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('funeral', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('platform', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('platform', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('platform', 'SALES', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'SUPPLIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'PURCHASES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('ec_site', 'ADVERTISING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('logistics', 'PACKING_SHIPPING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('consulting', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('consulting', 'OUTSOURCING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('legal_firm', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('construction', 'OUTSOURCING_CORP', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('real_estate', 'RENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('real_estate', 'REPAIRS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('real_estate', 'RENTAL_INCOME', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('insurance', 'INSURANCE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('entertainment', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('entertainment', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('leisure', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('leisure', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('cinema_music', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('spa', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('travel_agency', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('gas_station', 'VEHICLE_COSTS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('taxi', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('rental_car', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('train', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('bus', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('highway', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('airline_ship', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('parking', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('hotel', 'TRAVEL', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('utility', 'UTILITIES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'TAXES_DUES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('government', 'MISC_INCOME_CORP', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('social_insurance', 'LEGAL_WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('medical', 'WELFARE', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('religious', 'DONATIONS', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('religious', 'MEMBERSHIP_FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('religious', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'INTEREST_DISCOUNT', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'LONG_TERM_BORROWINGS', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('financial', 'INTEREST_INCOME', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OUTSOURCING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'WAGES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'ADVANCE_PAID', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OWNER_DRAWING', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'SALES', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'ADVANCE_PAID', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'MISC_INCOME', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'OWNER_INVESTMENT', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('individual', 'DEPOSITS_RECEIVED', 'income')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('wholesale', 'PURCHASES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('association', 'MEMBERSHIP_FEES', 'expense')
ON CONFLICT DO NOTHING;
INSERT INTO industry_vectors (vector, account, direction)
VALUES ('association', 'ENTERTAINMENT', 'expense')
ON CONFLICT DO NOTHING;
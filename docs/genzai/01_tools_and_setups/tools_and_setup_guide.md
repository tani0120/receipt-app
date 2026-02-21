📦 技術スタック
フロントエンド
json
{
  "フレームワーク": "Vue 3.5.25 (Composition API)",
  "ビルドツール": "Vite 7.2.4",
  "状態管理": "Pinia 3.0.4",
  "ルーティング": "Vue Router 4.6.3",
  "スタイリング": "Tailwind CSS 4.1.18",
  "型チェック": "TypeScript 5.9 + vue-tsc",
  "テスト": "Vitest 4.0.16 + @vue/test-utils + jsdom 22"
}
バックエンド
json
{
  "APIフレームワーク": "Hono 4.11.3 (@hono/node-server)",
  "メインDB": "Supabase (PostgreSQL) 2.95.3",
  "イベントログDB": "Firebase/Firestore 12.7.0 + firebase-admin 13.6.0",
  "AI": "Vertex AI SDK 1.10.0 + Gemini API 0.24.1",
  "ランタイム": "Node.js 20.19+ / 22.12+",
  "ビルド": "esbuild 0.27 (バンドル)"
}
開発環境・ツール
json
{
  "並列実行": "npm-run-all2 (dev:frontend + dev:api)",
  "型安全AST": "ts-morph 21.0.0 (Partial検知)",
  "Linter": "ESLint 9.39 + eslint-plugin-vue",
  "ホットリロード": "tsx watch (API開発)",
  "Git Hooks": "husky 9.1.7",
  "その他": "zod 4.3.4 (スキーマ検証), iconv-lite (Shift-JIS), xlsx 0.18.5"
}
デプロイ環境（想定）
フロントエンド: Firebase Hosting
バックエンド: Cloud Run（Node.js）
AI処理: Vertex AI (Gemini Flash-2.0)
🏗️ アーキテクチャ設計思想
Streamed互換設計（Phase A核心）
定義:
「状態を1か所で確定し、過程はイベントとして分離し、UI・API・監査がすべて同一のstatusを参照する設計」

データベース役割分離
DB	役割	用途例
PostgreSQL (Supabase)	正規帳簿（唯一の真実）	receipts, audit_logs, status管理
Firestore	イベントログ（過程の記録）	OCR完了イベント、状態変更履歴
設計決定の3大修正（Phase 1で確定）
status ENUM化: typo完全防止、意識的変更強制
SQL function化: トランザクション保証、race condition防止
CHECK制約: DB側で完全性保証（confirmed時はjournal必須）
結論: 「Streamedより事故らない」構成を実現

📊 完了済Phase詳細
Phase 0: アーキテクチャ設計（2026-02-05完了）
成果物:

design_architecture_comparison_260205.md
Firestore vs PostgreSQL比較分析
optional地獄の特定: 242個のoptionalフィールド（必須8個のみ）
UI真っ白問題: 12種statusを無視して推測ロジックで条件分岐漏れ
決定事項:

PostgreSQL追加は正当化される（メリット > デメリット）
Phase 1: PostgreSQL導入（2026-02-07完了）✅
実装内容:

Step 1.1: Supabaseプロジェクト作成 ✅
Supabase無料アカウント作成完了
プロジェクト: receipt-app-production
認証情報を.env.localに設定
Step 1.2: テーブル作成 ✅
実行ファイル: 
schema.sql

sql
-- ENUM型（typo防止）
CREATE TYPE receipt_status AS ENUM (
  'uploaded', 'preprocessed', 'ocr_done',
  'suggested', 'reviewing', 'confirmed', 'rejected'
);
-- receiptsテーブル
CREATE TABLE receipts (
  id uuid PRIMARY KEY,
  client_id uuid NOT NULL,
  drive_file_id text NOT NULL UNIQUE,
  status receipt_status NOT NULL DEFAULT 'uploaded',
  current_version int NOT NULL DEFAULT 1,
  confirmed_journal jsonb,
  display_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- CHECK制約（confirmed時はjournal必須）
ALTER TABLE receipts
ADD CONSTRAINT confirmed_requires_journal
CHECK (
  (status = 'confirmed' AND confirmed_journal IS NOT NULL)
  OR (status != 'confirmed')
);
-- audit_logsテーブル
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- SQL function（トランザクション保証）
CREATE OR REPLACE FUNCTION update_receipt_status(
  p_id uuid,
  p_new_status receipt_status,
  p_actor text
) RETURNS void AS $$
DECLARE
  v_before jsonb;
BEGIN
  SELECT row_to_json(receipts.*)::jsonb INTO v_before FROM receipts WHERE id = p_id;
  UPDATE receipts SET status = p_new_status, updated_at = now() WHERE id = p_id;
  INSERT INTO audit_logs (entity_type, entity_id, action, actor, before_json, after_json)
  VALUES ('receipt', p_id, 'status_change', p_actor, v_before, jsonb_build_object('status', p_new_status));
END;
$$ LANGUAGE plpgsql;
Step 1.3: SDK導入とリポジトリ作成 ✅
npm install @supabase/supabase-js 完了
作成ファイル:
client.ts
 - Supabaseクライアント初期化
receipt.types.ts
 - 軽量型定義
receiptRepository.ts
 - CRUD + SQL function利用
auditLogRepository.ts
 - 監査ログ
Step 1.4: API統合 ✅
receipts.ts
 作成
Firestore + Supabase 両方に書き込むロジック実装
環境変数制御(ENABLE_FIRESTORE, ENABLE_OCR)
手動テスト: 3ケース成功（reviewing, confirmed+journal, confirmed-journal失敗）
Git commit完了（2コミット）
成果:

optional地獄の91.7%削減（242個 → 20個）見込み
監査証跡完備（audit_logs）
UI真っ白問題の構造的解決（status駆動）
Phase 2: Receipt UI実装（2026-02-07完了）✅
実装内容:

Step 2.1: フロント型定義の統合 ✅
receiptStatus.ts
 - 共有型定義
receiptViewModel.ts
 - ViewModel
receiptStore.ts
 - normalizeReceipt()実装
Step 2.2: UI条件分岐のstatus化 ✅
核心設計: status → uiMode → template 2段階構造

実装ファイル:

ReceiptDetail.vue
 - メインコンポーネント
UIモード6種類:
LoadingView.vue
 (uploaded, preprocessed)
OcrPreview.vue
 (ocr_done)
EditorView.vue
 (suggested)
ReadonlyView.vue
 (reviewing, confirmed)
RejectedView.vue
 (rejected)
FallbackView.vue
 (unknown)
Git commit: 5ce1ee1 (12ファイル変更、381行追加)

Step 2.3: 既存画面の改修 ✅
Receipt系画面探索完了
ScreenE_Workbench.vue は Journalドメイン と判定（Phase 4資産）
Phase 3移行前確認3項目クリア:
✅ UIはFirestore構造を一切見ていない
✅ receipt.statusがUIの唯一の判断軸
✅ ViewModelが完成形
Phase 2完了率: 100% ✅

完了時の状態:

✅ 設計完了: status → uiMode → template パターン確立
✅ 実装完了: ReceiptDetail.vue + 6種UIコンポーネント
✅ 型安全性: ReceiptStatus、ReceiptUiMode型定義
✅ 防御線: normalizeReceipt()による不正値対策
Phase 🅲: 安定化フェーズ（2026-02-07完了）✅
目標: 「status駆動UIは壊れない」をコードで保証

Task 1: ReceiptStatus → ReceiptUiMode 網羅性テスト ✅
テストファイル: 
ReceiptDetail.spec.ts
全7種ReceiptStatus → uiMode マッピング検証
結果: 7/7合格 ✅
Task 2: Fallback動作の境界値テスト ✅
receipt = null → uiMode = 'loading'
receipt.status = undefined → uiMode = 'fallback'
receipt.status = 'INVALID' → uiMode = 'fallback'
Fallbackメッセージ検証（「この状態は認識されていません」）
結果: 4/4合格 ✅
Task 3: ViewModel正規化の境界テスト ✅
テストファイル: 
receiptStore.spec.ts
不正status → 'uploaded'変換
displaySnapshot = undefinedの動作
必須フィールド検証（id, clientId, driveFileId）
結果: 5/5合格 ✅
Task 4: ブラウザ実機テスト ✅
URL: http://localhost:5173/receipts/test
6種UIモード表示確認完了
Receipt UI関連エラー: 0件
Console警告12件: Journal domain (Phase 4で対処)
安定化フェーズ完了サマリ:

自動テスト結果: 16/16合格 ✅
手動テスト結果: ブラウザ実機確認完了 ✅
技術的成果:

テスト環境完全構築（vitest + jsdom@22 + @vue/test-utils）
status駆動UI完全検証（全7種statusマッピング）
Phase 4/5への基盤確立（テストパターン、設計固定化）
Phase 3: データ移行（スキップ確定）✅
調査結果:

Firestoreにreceiptsコレクション不在
移行対象データ = 0件
スキップ理由:

Receiptドメイン: Supabase専用（最初から）
Journalドメイン: Firestore（別ライフサイクル）
ドメイン境界が完全分離（DDD原則遵守）
Phase 3完了率: 100% ✅（調査完了・スキップ確定）

🔄 進行中Phase詳細
Phase 4: Journal UI再設計（50%完了、保留中）
完了部分:

Step 4.1-4.3: 型システム、ViewModel、ヘッダーUI実装
保留部分:

Step 4.3.11: 明細disabled制御
保留理由:

status/label/readonly の再定義待ち（Phase A）
Phase Aの設計思想確立後に再開予定
Phase A: UX探索モード（進行中）
Phase A-0（準備）完了状況:
- Step 1-3: Yen型・type定義・fixture確認 ✅
- Step 4: journalColumns.ts作成（JournalColumn型+sortKey付き23列定義） ✅
- Step 5: ヘッダーv-for化（pr-[8px]列ずれ修正、ソートバグ2件修正含む） ✅
- Step 6: ボディ全体v-for化（全23列、6type分岐、getValue()導入） ✅
- Step 7: 操作列（⋯）DD実装、ゴミ箱ソフトデリート（deleted_at方式）、フィルタ4種、4色背景 ✅
- Step 8: 確認ダイアログ（コピー「未出力にコピー」メッセージ）、exported行制限（個別DD disabled化+一括スキップ方式） ✅

確定済み設計:
- status: exported + null（2値のみ）
- labels: 21種類（Phase CでEXPORT_EXCLUDE廃止→20種類）
- 背景色: 4色優先順位制（deleted_at→濃灰+白字(最優先) > exported→灰 > !is_read→黄 > 既読→白）
- columns.ts = 構造定義の単一ソース。描画ロジックはVue側

💼 現在の課題
1. Phase A残タスク
残り19列のUI実装（component列10本の動作実装が主）
一括操作バー実装（Gmail式チェック→アクション切替）
30件テスト・摩擦レポート
2. Phase 4への影響
Phase Aの設計思想確立後、Journal UIの再設計再開
status/label/readonlyの定義をPhase Aから引き継ぐ
📂 重要ディレクトリ構造
receipt-app/
├── docs/
│   ├── genzai/
│   │   ├── 00_モック実装時のルール.md       # Phase体系・暴走防止・型安全ルール（最上位規範）
│   │   ├── モック作成ガイド.md             # 指示テンプレート・型安全ルール・移行手順
│   │   ├── 01_tools_and_setups/           # 本ファイル（技術スタック・セットアップ）
│   │   ├── 02_database_schema/            # DB設計書（journal_v2, migration.sql, API設計書, 実装ノート）
│   │   ├── 03_idea/                       # アイデア・検討中の設計
│   │   ├── 04_mock/                       # モック関連タスク（task_current.md）
│   │   ├── NEW/                           # 進行中Phase設計書
│   │   └── OLD/                           # 完了済Phase設計書
│   ├── _archive_legacy/
│   │   └── kakunin/                        # 過去の設計書・技術資料
│   └── sessions/                           # セッション記録
│
├── src/
│   ├── api/
│   │   └── routes/
│   │       └── receipts.ts                 # Receipt API（Phase 1実装）
│   ├── database/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Supabaseクライアント
│   │   │   └── schema.sql                  # DDL定義
│   │   ├── repositories/
│   │   │   ├── receiptRepository.ts        # Receipt CRUD
│   │   │   └── auditLogRepository.ts       # 監査ログ
│   │   └── types/
│   │       └── receipt.types.ts            # Receipt型定義
│   ├── mocks/
│   │   ├── columns/                        # journalColumns.ts（列定義の単一ソース）
│   │   ├── components/                     # JournalListLevel3Mock.vue等
│   │   ├── data/                           # journal_test_fixture_30cases.ts等
│   │   └── types/                          # journal_phase5_mock.type.ts等
│   ├── views/
│   │   └── ReceiptDetail.vue               # Receipt詳細画面（Phase 2実装）
│   ├── components/receipt/                 # Receipt UIコンポーネント（6種）
│   ├── stores/
│   │   └── receiptStore.ts                 # Pinia Store
│   ├── shared/
│   │   └── receiptStatus.ts                # 共有型定義
│   └── server.ts                           # Honoサーバー
│
├── .env.local                              # 環境変数（APIキー、DB接続情報）
├── package.json                            # 依存関係定義
└── tsconfig.json                           # TypeScript設定
🔧 開発コマンド
bash
# 開発環境起動（フロントエンド + API並列）
npm run dev
# フロントエンドのみ起動
npm run dev:frontend
# APIのみ起動
npm run dev:api
# ビルド（本番用）
npm run build
# 型チェック
npm run type-check
# ASTベースPartial検知
npm run type-check:ast
# テスト実行
npm run test
# Lint修正
npm run lint
📋 技術規約（CONVENTIONS.md より）
禁止パターン
❌ Partial + フォールバック値: 型契約の骨抜き、サイレント障害の温床
❌ any型: 型システムの完全放棄
❌ statusフィールドの無視: 監査証跡の破壊
正しいパターン
✅ Pick/Omit: 明示的な型定義
✅ unknown + 型ガード: 外部データの安全な扱い
✅ status必須化: 業務状態の追跡と監査
CI/CDによる自動検知
TypeScript型チェック (tsc --noEmit)
ASTベースPartial検知 (ts-morph)
Domain層厳格チェック
証跡コメント確認 (@type-audit)
違反した場合、CIが自動的にマージを拒否

🚀 次のアクション（Claudeへの期待）
1. Phase A完了支援
ルール閾値の最終決定サポート
UI/UX仕様のPhase 4への反映方法提案
MVP定義の明確化
2. 全体ロードマップ策定
Phase A完了後の開発優先度
Phase 4再開タイミング
技術的負債の対処計画
3. 設計レビュー
Streamed互換設計の妥当性検証
PostgreSQL移行の効果確認
アーキテクチャの改善提案
📚 参照リンク
Phase 0-3完了レポート
Phase 0: design_architecture_comparison_260205.md
Phase 1: plan_phase1_overall_260207.md
Phase 2: report_phase2_completion_260207.md
Phase 3: decision_phase3_migration_skip_260207.md
Phase A進行中ドキュメント
concept_phaseA_overview_260208.md
task_phaseA_260208.md
技術資料（kakunin）
PROJECT_STATUS.md
TECH-DEBT.md
CONVENTIONS.md
system_design.md
このドキュメントは、Claudeが瞬時にプロジェクト全体を把握するための包括的な引き継ぎ資料です。
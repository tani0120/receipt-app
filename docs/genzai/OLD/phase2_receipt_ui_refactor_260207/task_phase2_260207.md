# PostgreSQL移行提案ドキュメント更新タスク

**作成日**: 2026-02-07T12:38:32+09:00  
**目的**: 実コードベース調査結果を既存ドキュメントに統合

---

## タスク概要

過去の会話（d16a11bb）で作成された2つのアーティファクトを、実コード調査結果で更新する。

---

## チェックリスト

### [x] ドキュメント更新
- [x] 実コードベース調査完了（zod_schema.ts 確認）
- [x] [architecture_comparison.md.resolved](file:///C:/Users/kazen/.gemini/antigravity/brain/d16a11bb-f6a2-452a-8ff6-ee0a98123634/architecture_comparison.md.resolved) の更新
  - [x] optional地獄の実測データ追加（242個のoptional）
  - [x] JobStatusの実態反映（12個の状態）
  - [x] UI真っ白問題の具体的メカニズム追加
  - [x] 削減率の数学的根拠追記（91.7%削減）
- [x] [implementation_plan.md.resolved](file:///C:/Users/kazen/.gemini/antigravity/brain/d16a11bb-f6a2-452a-8ff6-ee0a98123634/implementation_plan.md.resolved) の更新
  - [x] 実ファイルパス反映（zod_schema.ts: 547行）
  - [x] 削減対象の具体的行数追加（239-481行目）
  - [x] 実装難易度の見積もり更新

**成果物**:
1. [architecture_comparison_UPDATED.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/architecture_comparison_UPDATED.md)
2. [implementation_plan_UPDATED.md](file:///C:/Users/kazen/.gemini/antigravity/brain/969b0a66-a361-48a4-9679-359b9c632af4/implementation_plan_UPDATED.md)

---

## 調査結果サマリー

### 発見した事実
1. **optional地獄の実態**: 242個のoptionalフィールド（文書の100+は控えめ）
2. **JobStatus定義**: 12個の状態（'pending', 'ai_processing', ... 'excluded'）
3. **型定義の肥大化**: zod_schema.ts 547行
4. **削減率の根拠**: (242 - 20) / 242 = 91.7%

### 更新方針
- 推測表現を実測値に置き換え
- 具体的なコード例を実コードから引用
- 数値的根拠を強化

### ユーザーレビュー結果
✅ **LGTMを獲得**（3ドキュメントすべて承認）

### 重要修正3点の統合
- [x] 修正① status ENUM化（typo完全防止）
- [x] 修正② SQL functionでトランザクション化（race condition防止）
- [x] 修正③ CHECK制約（confirmed時のjournal必須化）

**結論**: 「Streamedより事故らない」構成に進化

---

## Phase 1: PostgreSQL導入（2026-02-07実施）

### [x] Step 1.1: Supabaseプロジェクト作成
- [x] Supabase無料アカウント作成
- [x] 新規プロジェクト作成（receipt-app-production）
- [x] 認証情報を[.env.local](file:///C:/dev/receipt-app/.env.local)に設定

### [x] Step 1.2: テーブル作成
- [x] [schema.sql](file:///C:/dev/receipt-app/src/database/supabase/schema.sql)実行（重要修正3点統合済み）
  - ENUM型（receipt_status）
  - CHECK制約（confirmed_requires_journal）
  - SQL function（update_receipt_status）
- [x] インデックス作成確認（4件）
- [x] Supabase Studioでテーブル確認

### [x] Step 1.3: SDK導入とリポジトリ作成
- [x] `npm install @supabase/supabase-js`
- [x] [C:\dev\receipt-app\src\database\supabase\client.ts](file:///C:/dev/receipt-app/src/database/supabase/client.ts)作成
- [x] [C:\dev\receipt-app\src\database\supabase\schema.sql](file:///C:/dev/receipt-app/src/database/supabase/schema.sql)作成
- [x] [C:\dev\receipt-app\src\database\types\receipt.types.ts](file:///C:/dev/receipt-app/src/database/types/receipt.types.ts)作成
- [x] [C:\dev\receipt-app\src\database\repositories\receiptRepository.ts](file:///C:/dev/receipt-app/src/database/repositories/receiptRepository.ts)作成
- [x] [C:\dev\receipt-app\src\database\repositories\auditLogRepository.ts](file:///C:/dev/receipt-app/src/database/repositories/auditLogRepository.ts)作成

### [x] Step 1.4: API統合
- [x] [src/api/routes/receipts.ts](file:///C:/dev/receipt-app/src/api/routes/receipts.ts)作成
- [x] Firestore + Supabase 両方に書き込むロジック実装（環境変数制御）
- [x] 環境変数でFirestore/OCRを制御（ENABLE_FIRESTORE, ENABLE_OCR）
- [x] 手動テスト（3ケース成功）
- [x] Gitコミット・プッシュ完了

**Phase 1 完了率**: 100% ✅ （2026-02-07完了）

---

## Phase 2: UI参照先切り替え（2026-02-07実施）

### [x] Step 2.1: フロント型定義の統合
- [x] 共有レイヤー作成（[src/shared/receiptStatus.ts](file:///C:/dev/receipt-app/src/shared/receiptStatus.ts)）
- [x] ReceiptViewModel定義（[src/types/receiptViewModel.ts](file:///C:/dev/receipt-app/src/types/receiptViewModel.ts)）
- [x] Store正規化実装（[src/stores/receiptStore.ts](file:///C:/dev/receipt-app/src/stores/receiptStore.ts)）
- [x] DB側型定義を共有レイヤー参照に変更
- [x] lint error修正（any型をunknownに変更）

### [x] Step 2.2: UI条件分岐のstatus化
- [x] ReceiptDetail.vue作成（status → uiMode → template 2段階構造）
- [x] ReceiptUiMode型定義（typo防止、template補完）
- [x] UIモードコンポーネント6種作成
  - LoadingView.vue（uploaded, preprocessed）
  - OcrPreview.vue（ocr_done）
  - EditorView.vue（suggested）
  - ReadonlyView.vue（reviewing, confirmed）
  - RejectedView.vue（rejected）
  - FallbackView.vue（unknown status）
- [x] 開発用テストパネル追加
- [x] ブラウザで全6種UIモード確認
- [x] Gitコミット完了（commit 5ce1ee1、12ファイル変更、381行追加）

### [x] Step 2.3: 既存画面の改修
- [x] receiptベース画面探索（views/components全探索）
- [x] 発見: ReceiptDetail.vueのみ（既にPhase 2完了済み）
- [x] 判定: ScreenE_Workbench.vueはJournalドメイン（Phase 4資産として凍結）
- [x] Phase 3移行前確認3項目クリア
  - UIはFirestore構造を一切見ていない ✅
  - receipt.statusがUIの唯一の判断軸 ✅
  - ViewModelが完成形 ✅

**Phase 2 完了率**: 100% ✅ **（Phase 2完全終了）**

---

## Phase 3: データ移行（スキップ確定）

### [x] 調査: Firestore既存データ確認
- [x] .env.local確認（ENABLE_FIRESTORE=false）
- [x] firestoreRepository.ts全コレクション確認
- [x] firestore.ts型定義確認
- [x] 結論: **receiptsコレクションは存在しない** ✅

### スキップ理由（調査により証明）

1. **移行対象データ = 0件**
   - Firestoreに`receipts`コレクション不在
   - Supabaseが最初からSource of Truth
   - 移行すべきデータが存在しない

2. **設計的正しさ（DDD原則遵守）**
   - Receiptドメイン: Supabase専用
   - Journalドメイン: Firestore（別ライフサイクル）
   - ドメイン境界が完全分離

3. **Phase 3実施は設計的負債**
   - 存在しないデータへの移行スクリプト = 構造的な嘘
   - Firestoreへの不要な依存導入
   - 「やらない」が正解

**Phase 3 完了率**: 100% ✅ **（調査完了・スキップ確定）**

---

## 次のフェーズ候補

### 推奨順位: 🅲 → 🅰 → 🅱

---

## Phase 🅲: 安定化フェーズ（優先度：最高）

### ゴール
「status駆動UIは壊れない」がコードで保証されている状態を確立

### [x] Task 1: ReceiptStatus → ReceiptUiMode 網羅性テスト
- [x] 全7種のReceiptStatus（uploaded, preprocessed, ocr_done, suggested, reviewing, confirmed, rejected）がuiModeにマップされることを確認
- [x] unknownステータスがfallbackに正しく落ちることを確認
- [x] テストコード作成（ReceiptDetail.spec.ts）
- [x] 全テスト合格（7/7）

### [x] Task 2: Fallback動作の境界値テスト
- [x] receipt = null の場合にuiMode = 'loading'を確認
- [x] receipt.status = undefined の場合の挙動確認
- [x] receipt.status = 'unknown_value' の場合にfallbackを確認
- [x] 各UIモードコンポーネントがprops不足でも壊れないことを確認
- [x] Fallbackメッセージ検証追加（UX保証強化）
- [x] 全テスト合格（4/4）

### [x] Task 3: ViewModel正規化の境界テスト
- [x] normalizeReceipt() が不正statusを'uploaded'に変換することを確認
- [x] displaySnapshotがundefinedでもUIが壊れないことを確認
- [x] 必須フィールド（id, clientId, driveFileId）の検証
- [x] テストコード作成（receiptStore.spec.ts）
- [x] 全テスト合格（5/5）

### [x] Task 4: ブラウザ実機テスト
**Step 1**: ブラウザアクセスと初期確認
- [x] http://localhost:5173/receipts/test にアクセス
- [x] テストパネルが表示されることを確認
- [x] DevTools Consoleを開く

**Step 2**: 全6種UIモード表示確認
- [x] Loading View (uploaded) - スピナー表示、メッセージ確認
- [x] OCR Preview (ocr_done) - OCRテキスト表示、情報確認のみ注記 ✅
- [x] Editable (suggested) - 編集フォーム表示、入力可能
- [x] Readonly (reviewing) - 読み取り専用表示、編集不可
- [x] Rejected (rejected) - 却下メッセージ、再提出オプション
- [x] Fallback (unknown) - 「この状態は認識されていません」メッセージ表示

**Step 3**: コンソールエラーチェック
- [x] Console error: 0件確認（Receipt UI関連）
- [x] Console warning: 12件存在（**Journal domain**、Phase 4で対処）
- [x] optional chaining関連警告なし

**Step 4**: UI品質確認
- [x] レイアウト崩れなし
- [x] ボタン活性/非活性が意図通り
- [x] テキスト表示が正しい

**Step 5**: 証跡取得
- [x] UIモードのスクリーンショット取得（2枚）
- [x] walkthrough.md更新（Phase 🅲セクション追加）

### 完了条件
- [x] 全テスト通過（automated） - **16/16合格** ✅
  - Task 1: 7/7合格
  - Task 2: 4/4合格
  - Task 3: 5/5合格
- [x] ブラウザ実機確認完了（manual） ✅
- [x] コンソールエラー0件（Receipt UI関連） ✅
- [x] walkthrough.md更新（テスト結果記録） ✅

**Phase 🅲 推定工数**: 小（2-3時間） → **実績: 約45分** ✅


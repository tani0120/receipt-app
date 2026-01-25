# ⚠️ UI開発マスター（LEGACY - 参照禁止）

> [!CAUTION]
> ## 🚫 このファイルは参照禁止です
> - **このファイルは旧版です**（削除予定）
> - **最新の情報は [UI_MASTER_v2.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/UI_MASTER_v2.md) を参照してください**
> - このファイルは2026-01-25までの情報を含みます
> - **AI（私）はこのファイルを参照してはいけません**
> - 削除予定日: 2026-02-01

**作成日**: 2026-01-25  
**最終更新**: 2026-01-25 21:52  
**ステータス**: ❌ DEPRECATED（非推奨）  
**関連ファイル**: [UI_master_plan.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/UI_master_plan.md), ADR-011, CONVENTIONS.md


---

## 📋 顧問先UI要件（2026-01-23完了）

### プロパティ（33項目）

**基本情報（13項目）**: ステータス、ジョブID、3コード、担当者名、種別、会社名、会社名フリガナ、代表者名、代表者名フリガナ、決算月、設立年月日、電話番号、連絡手段

**会計設定（12項目）**: 会計ソフト、経理方式、計上基準、課税方式、事業区分、消費税端数処理、消費税適用特例、仕入税額控除方式、経過措置計算、インボイス登録、標準決済手段、部門管理

**報酬設定（6項目）**: 顧問報酬（月額）、記帳代行（月額）、月次報酬合計（自動算出）、決算報酬（年次）、消費税申告報酬（年次）、年間総報酬（自動算出）

**Google Drive連携（2項目）**: 親フォルダID、共有フォルダID

### デフォルト値
- 経理方式: **税込**
- 計上基準: **期中現金**
- 消費税端数処理: **切り捨て**
- 仕入税額控除方式: **全額**
- 経過措置計算: **適用する**

### Google Drive自動作成
- 新規登録時に自動でフォルダ作成
- フォルダ名: `{3コード}_{会社名}_資料共有用（処理後移動します）`
- 権限: 投稿者（顧問先は資料保存可、フォルダ削除・移動不可）

### CRUD操作
- 新規登録: モーダル、Google Drive自動作成
- 編集: ジョブID以外全て編集可能、3コード変更可
- 削除: 物理削除なし、ステータスを「停止中」に変更

### UI仕様
- 登録・編集: モーダル（基本情報/会計設定/報酬設定の3セクション）
- 一覧表示: 10カラム（ステータス、3コード、担当者名、種別、会社名/代表者名、決算月、会計ソフト、電話番号、連絡手段、共有フォルダ）

### ⚠️ 計画乖離の教訓
**問題**: 計画ではMilestone 1.1（OCR→仕訳）を先にすべきだったが、Milestone 1.2（顧問先UI）を先に実施した

**原因**: ユーザーの提案が計画と違ったが、AIが指摘しなかった

**教訓**: **計画と違う提案があった場合、AIは必ず指摘し、計画変更の確認を取る**

### 詳細
- [SESSION_20260123.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260123.md) - 実施内容の経緯
- [client-ui-requirements.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/client-ui-requirements.md) - 完全な仕様（31項目、Zodスキーマ、Phase振り分け）

---

## 🎯 仕訳UI（Journal）- 完全仕様

### データ構造

#### JournalEntry（19プロパティ）

| # | プロパティ | 型 | 必須 | Phase | 説明 |
|---|-----------|----|----|-------|------|
| 1 | `id` | string (UUID) | ✅ | 1 | 仕訳エントリのUUID |
| 2 | `date` | string (YYYY-MM-DD) | ✅ | 1 | 取引日付 |
| 3 | `description` | string | ✅ | 1 | 摘要（全行共通） |
| 4 | `totalAmount` | number | ✅ | 1 | 合計金額（税込） |
| 5 | `lines` | JournalLine[] | ✅ | 1 | 仕訳明細行（最小2行） |
| 6 | `clientId` | string | ✅ | 1 | 顧問先ID |
| 7 | `clientCode` | string (3文字) | ✅ | 1 | 顧問先の3コード |
| 8 | `aiSourceType` | enum | ✅ | 1 | gemini/manual/hybrid |
| 9 | `aiConfidence` | number (0-1) | ✅ | 1 | AI信頼度 |
| 10 | `sourceFiles` | SourceFile[] | ✅ | 1 | 証憑ファイル情報 |
| 11 | `createdAt` | string (ISO) | ✅ | 1 | 作成日時 |
| 12 | `createdBy` | string | ✅ | 1 | 作成者ID |
| 13 | `updatedAt` | string (ISO) | ✅ | 1 | 更新日時 |
| 14 | `updatedBy` | string | ⭕ | 1 | 更新者ID |
| 15 | `isConfirmed` | boolean | ✅ | 1 | ユーザー確認済みか |
| 16 | `hasQualifiedInvoice` | boolean | ⭕ | 1 | 適格請求書か |
| 17 | `aiConfidenceBreakdown` | object | ⭕ | 2 | 項目別AI信頼度 |
| 18 | `exportHistory` | object[] | ⭕ | 2 | 出力履歴 |
| 19 | `approvalWorkflow` | object | ⭕ | 2 | 承認ワークフロー |

#### JournalLine（16プロパティ）

| # | プロパティ | 型 | 必須 | Phase | 説明 |
|---|-----------|----|----|-------|------|
| 1 | `lineId` | string (UUID) | ✅ | 1 | 行のUUID |
| 2 | `accountCode` | string | ✅ | 1 | 勘定科目コード |
| 3 | `accountName` | string | ✅ | 1 | 勘定科目名 |
| 4 | `subAccount` | string | ⭕ | 1 | 補助科目 |
| 5 | `debit` | number | ✅ | 1 | 借方金額 |
| 6 | `credit` | number | ✅ | 1 | 貸方金額 |
| 7 | `taxType` | enum | ✅ | 1 | none/consumption/reduced |
| 8 | `taxAmountFromDocument` | number | ⭕ | 1 | 証憑記載の税額 |
| 9 | `taxDocumentSource` | enum | ✅ | 1 | 証憑値の取得方法 |
| 10 | `taxAmountCalculated` | number | ✅ | 1 | システム計算の税額 |
| 11 | `taxCalculationMethod` | enum | ✅ | 1 | 計算方法 |
| 12 | `taxAmountFinal` | number | ✅ | 1 | 最終確定税額（CSV出力用） |
| 13 | `taxAmountSource` | enum | ✅ | 1 | 最終値の出所 |
| 14 | `taxDiscrepancy` | object | ⭕ | 1 | 税額ズレ検出結果 |
| 15 | `description` | string | ⭕ | 1 | 行ごとのコメント |
| 16 | `isAIGenerated` | boolean | ✅ | 1 | AI生成か |

### 税額の三重構造

1. **taxAmountFromDocument（証憑値）**: 領収書に記載された税額
2. **taxAmountCalculated（計算値）**: システムが「金額 × 税率」で計算した値
3. **taxAmountFinal（最終値）**: 最終的にCSV出力する確定値（デフォルトは証憑値、ユーザーが修正可能）

### 税額判定戦略：戦略C

**原則**: OCR抽出値（記載値）を採用

**検証**: 計算値とのズレを自動検出
- ズレなし / 1円以内 → ✅ OK（自動承認）
- 2-5円 → ⚠️ WARNING（確認推奨）
- 5円超 → ❌ ERROR（修正必須）

**理由**:
- 領収書の原文を尊重（監査対応）
- AI精度を可視化（信頼度表示）
- ユーザーが最終判定（責任の所在）

### UI表示方針（Streamed調査結果）

**内部データ**:
- 証憑記載の税額 ✅ 保持
- 計算上の税額 ✅ 保持
- 最終確定税額 ✅ 保持

**UI表示**:
- 仕訳一覧: 税額 ❌ 非表示（情報量削減）
- ズレがある行: ⚠️ アラート表示
- 詳細モーダル: 税額 ✅ 表示（証憑値/計算値/差分）

**CSV/API出力**:
- すべて ✅ 含める（taxAmountFinal）

### 仕訳一覧画面

```
┌─────────────────────────────────────────┐
│ 日付 | 摘要 | 勘定科目 | 金額 | 警告 | 確認 │
├─────────────────────────────────────────┤
│2025-01-23│ABC支払│現金│1100│     │✅   │
│2025-01-23│ABC支払│雑費│1000│⚠️  │     │ ← ズレあり
├─────────────────────────────────────────┤
```

**設計のポイント**:
- ✅ 税額は非表示（情報量削減）
- ⚠️ ズレがある行のみアラート表示
- ✅ 確認済みフラグ（`isConfirmed`）

### 詳細モーダル（税額確認画面）

```
┌────────────────────────────────────────────┐
│ 【仕訳詳細 - 修正画面】                   │
├────────────────────────────────────────────┤
│ 【左】証憑画像                            │
│ ┌──────────────┐                         │
│ │ ABC Inc      │                         │
│ │ 消費税: 33円 │ ← 証憑に記載              │
│ │ 合計: 1100   │                         │
│ └──────────────┘                         │
├────────────────────────────────────────────┤
│ 【右】仕訳詳細                            │
│ 勘定: 雑費                                │
│ 金額: 1000                               │
│                                           │
│ 税額情報:                                │
│  ✅ 証憑記載: 33円 ← FROM_DOCUMENT       │
│  ℹ️ 計算値: 32円   ← 参考                │
│  ⚠️ ズレ: 1円      ← 警告                │
│                                           │
│ 採用する税額:                            │
│  ○ 証憑の値（33円）                     │
│  ○ 計算値（32円）                       │
│  ○ 手入力で修正: [ 入力 ] 円            │
│                                           │
│ [修正を確定] [キャンセル]                │
└────────────────────────────────────────────┘
```

**実装ポイント**:
- ✅ 証憑画像と仕訳データの並列表示
- ✅ 税額の三重構造を可視化
- ✅ ユーザーが最終判定（戦略C）

### Phase 2延期項目

**承認ワークフロー**: Phase 1は1名、Phase 2で複数名対応

**出力履歴管理**: Phase 1は初回のみ、Phase 2で複数回出力対応

**項目別AI信頼度**: Phase 1は全体信頼度、Phase 2で詳細分析

**インボイス詳細情報**: Phase 1は基本情報、Phase 2で消費税申告書対応

### 詳細
- [step2_l1-3_definition.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/step2_l1-3_definition.md) - 完全な仕様（実装ファイル一覧、テストケース含む）

---

## 📖 参照用資料（調査結果・経緯）

### UI差分分析
**結論**: Admin Settings以外は公開/ローカルで差分なし

- [ui-diff-admin-dg.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/ui-diff-admin-dg.md) - Admin Settings差分分析
- [ui-column-modal-checklist.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/ui-column-modal-checklist.md) - 全8画面のカラム×モーダル差分チェック

### プロパティ調査
- [complete-property-checklist.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/complete-property-checklist.md) - Screen A: /clients 公開 vs ローカル差分分析
- [property-integration-map.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/property-integration-map.md) - 全プロパティの統合マップ

### ユースケース分類
- [usecase-classification-category1.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/usecase-classification-category1.md) - ユースケース分類
- [decision-clusters-all-usecases.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/decision-clusters-all-usecases.md) - 決定クラスタ

# JP_LITERAL定数集約化 — 設計・進捗・監査

> 作成: 2026-05-09
> 準拠: `.agent/workflows/load_context.md` L22-44: ★★★ Supabase移行前倒し原則
> 監査ツール: `scripts/audit-hardcode.cjs`

## 概要

日本語ハードコード（JP_LITERAL）を3分類に仕分けし、定数ファイルに集約する。
Supabase移行時の機械的変換を可能にするための前準備。

---

## 方針（load_context.md L26-33 準拠）

| 分類 | 判断基準 | 対応 | 例 |
|---|---|---|---|
| **DB候補** | Supabase移行時にテーブル化する値 | 定数ファイルに集約 | フィールドラベル→`clientFieldDefs.ts` |
| **定数化推奨** | コード内に残るがUI横断で重複する文言 | `uiMessages.ts`等に集約 | `'保存しました'`→`UI_MSG.保存成功` |
| **コード据え置き** | APIエラー文・ログ等、移行しても変わらない | 放置OK | `throw new Error('...')` |

---

## 定数ファイル配置（確定版 2026-05-09）

```
src/constants/                  ← フロント+共通の日本語定数（唯一の集約先）
  ├── uiMessages.ts                524プロパティ（UI共通メッセージ）
  ├── validationMessages.ts        59定数（バリデーション定数。shared/から移動済み）
  ├── clientFieldDefs.ts           フィールド定義（DB候補）
  ├── leadFieldDefs.ts             フィールド定義（DB候補）
  ├── progressFieldDefs.ts         フィールド定義（DB候補）
  ├── clientOptions.ts             選択肢定数
  ├── vendorOptions.ts             選択肢定数
  ├── journalConstants.ts          仕訳定数
  ├── fieldLabels.ts               フィールドラベル
  └── aiPrompts.ts                 AIプロンプトデフォルト

src/api/helpers/                ← API層専用（フロントから参照しない）
  └── apiMessages.ts               28定数（HTTPエラー文言）

src/api/services/pipeline/      ← AI層専用（フロントから参照しない）
  └── schemaDescriptions.ts        18定数（AIスキーマdescription）
```

**設計判断:**
- `constants/`がフロント+共通の日本語定数の唯一の配置先
- API層専用（`apiMessages.ts`/`schemaDescriptions.ts`）はAPI側に配置（フロントから参照しない）
- `validationMessages.ts`は2026-05-09に`shared/`→`constants/`に移動完了（9ファイルのimport書き換え済み）

---

## 監査ツール改善（2026-05-09）

### 偽陽性フィルタ追加

| フィルタ | 除外対象 | 推定除外件数 |
|---|---|---|
| `UI_MSG\.\|FIELD_\|SIDE_\|WARN_\|DESC_\|LABEL_\|getFieldLabel\(` | 定数参照行 | ~180件 |
| `console\.(log\|error\|warn\|info\|debug)` | デバッグログ（行中含む） | ~100件 |
| `throw\s+new\s+Error` | サーバー側エラー | ~20件 |
| `apiError\(\|return.*\.json\(\s*\{\s*error:` | APIエラーレスポンス | ~15件 |
| `未検出\(\|必須\(\|コード重複\(\|未実装\(` | apiMessages定数関数呼び出し | ~15件 |

### ホワイトリスト追加

| ファイル | 理由 |
|---|---|
| `schemaDescriptions.ts` | AIスキーマdescription定数（集約済み） |
| `validationMessages.ts` | バリデーションメッセージ定数（集約先自体） |
| `receiptService.ts` | デバッグログ専用（logPreviewExtractResult。UIに表示されない） |
| `driveService.ts` | サーバー側ログ/環境エラー（UIに表示されない） |

---

## 進捗

### スコア推移

| 日時 | JP_LITERAL | 備考 |
|---|---|---|
| 2026-05-08 セッション開始 | 803件 | audit-hardcode初回 |
| 2026-05-09 14:00 | 714件 | JournalList+journalWarningSync定数化 |
| 2026-05-09 17:00 | 669件 | APIルート定数化+schemaDescriptions新設 |
| 2026-05-09 17:15 | 669件 | uiMessages.ts重複プロパティ修正（IDEエラー9件解消） |
| 2026-05-09 17:30 | **204件** | 監査ツール偽陽性フィルタ改善（465件の偽陽性除去） |

### 修正済みファイル一覧

| ファイル | 修正内容 | 件数 |
|---|---|---|
| `constants/uiMessages.ts` | +42定数（一括操作/ヒント/OCR/根拠資料/カテゴリ/ツールチップ/ALT/実行不可） | - |
| `components/JournalListLevel3Mock.vue` | ~65箇所をUI_MSG/FIELD_/SIDE_/WARN_定数に置換 | 100→8件 |
| `utils/journalWarningSync.ts` | 借方/貸方テンプレート関数をvalidationMessages定数に統一 | 8箇所 |
| `api/helpers/apiMessages.ts` | +4定数（コード重複テンプレート/リソースラベル3種） | - |
| `api/routes/clientRoutes.ts` | リソースラベル5+コード重複2 | 9→0件 |
| `api/routes/leadRoutes.ts` | リソースラベル5 | 6→0件 |
| `api/routes/staffRoutes.ts` | リソースラベル3 | 4→0件 |
| `api/services/pipeline/schemaDescriptions.ts` | 新規作成（18定数） | - |
| `api/services/pipeline/previewExtract.service.ts` | スキーマdescription18箇所+REQUEST_PROMPTを定数参照に置換 | 19→0件 |
| `constants/validationMessages.ts` | `shared/`→`constants/`に移動 | - |
| 9ファイル | validationMessages.tsのimportパス書き換え | - |
| `scripts/audit-hardcode.cjs` | 偽陽性フィルタ6種追加+ホワイトリスト4件追加 | -465件 |

---

## 残存204件の分布（2026-05-09 17:30時点）

| # | ファイル | 件数 | 分類 | 備考 |
|---|---|---|---|---|
| 1 | api/routes/admin.ts | 8 | モックデータ+バリデーション | L250-282モック会社名、L18-19 zodエラー文 |
| 2 | components/JournalListLevel3Mock.vue | 8 | 定数化対象 | テンプレートHTML内日本語 |
| 3 | utils/lineItemToJournalMock.ts | 8 | 定数化対象 | ドメインラベル |
| 4 | views/admin/ScreenH_TaskDashboard.vue | 8 | モックデータ | ハードコードモックウィジェット |
| 5 | views/TestOCRPage.vue | 8 | テストページ | テスト用文言 |
| 6 | views/upload/MockUploadDocsPage.vue | 8 | 定数化対象 | UI文言 |
| 7 | composables/useUpload.ts | 7 | 定数化対象 | エラーメッセージ/ステータスラベル |
| 8 | views/upload/MockUploadSelectorUnifiedPage.vue | 7 | 定数化対象 | UI文言 |
| 9 | api/services/pipeline/image_preprocessor.ts | 6 | 据え置きOK | サーバー側ログ |
| 10 | components/ContactTable.vue | 6 | 定数化対象 | UI文言 |
| 11 | components/ScreenC_CollectionStatus.vue | 6 | 定数化対象 | UI文言 |
| 12 | views/history/MockExcludedHistoryPage.vue | 6 | 定数化対象 | UI文言 |
| 13 | views/history/MockSupportingHistoryPage.vue | 6 | 定数化対象 | UI文言 |
| 14 | views/portal/MockPortalPage.vue | 6 | 定数化対象 | UI文言 |
| 15 | views/upload/MockDriveUploadPage.vue | 6 | 定数化対象 | UI文言 |
| 16 | api/routes/accountMasterRoutes.ts | 5 | 据え置きOK | APIエラー |
| 17 | api/routes/taxCategoryRoutes.ts | 5 | 据え置きOK | APIエラー |
| 18 | shared/field-nullable-spec.ts | 5 | 定数ファイル自体 | ホワイトリスト追加候補 |
| 19 | api/routes/notificationRoutes.ts | 4 | 定数化対象 | 通知メッセージ |
| 20 | 以降26ファイル | 各1-4 | 混在 | 個別判定必要 |

### 分類サマリ

| 区分 | 推定件数 | 対応 |
|---|---|---|
| **定数化対象** | ~120件 | uiMessages.ts/validationMessages.tsに集約 |
| **据え置きOK**（ログ/throw/API/モック） | ~60件 | ホワイトリスト追加で消える |
| **テスト/モックデータ** | ~24件 | 放置OK |

---

## 次のアクション（優先順位）

1. **ホワイトリスト追加**: `field-nullable-spec.ts`、`image_preprocessor.ts` → ~11件減
2. **useUpload.ts（7件）**: エラーメッセージをvalidationMessagesに集約
3. **lineItemToJournalMock.ts（8件）**: ドメインラベルをuiMessagesに集約
4. **JournalList残り8件**: テンプレートHTML内文字列
5. **Upload系3ファイル（計21件）**: UI文言をuiMessagesに集約
6. **History系2ファイル（計12件）**: UI文言をuiMessagesに集約
7. **ContactTable+CollectionStatus+Portal（計18件）**: UI文言をuiMessagesに集約

**目標: 残存204件 → 100件以下**

---

## 型安全性

| チェック | 結果 | 日時 |
|---|---|---|
| `npx vue-tsc --noEmit` | エラー0件 ✅ | 2026-05-09 17:30 |
| IDEエラー | 0件 ✅ | 2026-05-09 17:30 |

---

## 関連ドキュメント

| ドキュメント | 関連 |
|---|---|
| [load_context.md](../../.agent/workflows/load_context.md) | L22-44: Supabase移行前倒し原則（3分類方針） |
| [28_api_migration_plan.md](28_api_migration_plan.md) | API化計画（ロジック移動。本ファイルとは責務が異なる） |
| [30_audit_checklist.md](30_audit_checklist.md) | 全310ファイル調査チェックリスト |

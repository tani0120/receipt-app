# SESSION_20260307_マスタUI改修

**日付**: 2026-03-07
**目的**: 勘定科目・税区分マスタUIにデフォルト/カスタム区別・非表示化・物理削除を実装
**会話ID**: 8466cc7e-464e-4db7-8f29-2acce5b18ad3

---

## 🧠 プロジェクト現状スナップショット

### UIモック進捗
- 対象ファイル: MockMasterAccountsPage.vue, MockMasterTaxCategoriesPage.vue
- 完了: 勘定科目マスタ ✅、税区分マスタ ✅
- 次の作業: 顧問先管理UI（K10-K14）→ スコープ宣言済み、未着手

---

## ✅ このセッションで確定したこと

| 項目 | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 非推奨化の呼称 | 非推奨化（deprecate） | 非表示化（hide）+ 目マーク | ユーザー指示 |
| デフォルト行アイコン | 右端に🔒ロックのみ | 科目名左に🔒黄色鍵 + 右端に👁目マーク | ユーザー指示 |
| カスタム行アイコン | 右端にゴミ箱のみ | 右端に🗑️ゴミ箱 + 👁目マーク（2つ並列） | ユーザー指示 |
| ✏️ペンアイコン | カスタム行の科目名左に表示 | 削除 | ユーザー指示 |
| 一括操作ボタン | 削除 / 復元 / コピー / 追加 | 表示化 / 非表示化 / 削除（復元できません）/ コピー / 追加 | ユーザー指示 |
| 物理削除 | なし | カスタム科目のみ、confirmダイアログ付き | ユーザー指示 |
| TaxCategory型 | isCustomなし | isCustom?: boolean追加 | デフォルト/カスタム区別のため |
| 税区分マスタUI | 旧式（チェックなし、一括操作なし） | 勘定科目と同一ルールで全面改修 | ユーザー指示 |

### 確定した型定義（コピペ用・最新のみ残す）
```typescript
// Account型（isCustom追加済み）
export type Account = {
    id: string
    name: string
    target: 'corp' | 'individual' | 'both'
    category: string
    defaultTaxCategoryId: string
    aiSelectable: boolean
    deprecated: boolean
    effectiveFrom: string
    effectiveTo: string | null
    sortOrder: number
    isCustom?: boolean  // ← 今回追加
}

// TaxCategory型（isCustom追加済み）
export type TaxCategory = {
    id: string
    name: string
    shortName: string
    direction: TaxDirection
    qualified: boolean
    aiSelectable: boolean
    active: boolean
    deprecated: boolean
    effectiveFrom: string
    effectiveTo: string | null
    defaultVisible: boolean
    displayOrder: number
    isCustom?: boolean  // ← 今回追加
}
```

---

## 📂 ファイル操作ログ

### 変更したファイル
| ファイル | 変更内容 | commitハッシュ |
|---|---|---|
| src/mocks/views/MockMasterAccountsPage.vue | 🔒鍵+👁目マーク、非表示化/物理削除、一括操作5ボタン、保存ボタン | de543cd |
| src/mocks/views/MockMasterTaxCategoriesPage.vue | 勘定科目と同一ルールで全面改修 | de543cd |
| src/shared/types/account.ts | isCustom追加 | de543cd |
| src/shared/types/tax-category.ts | isCustom追加 | de543cd |
| src/shared/data/account-master.ts | データ修正 | de543cd |
| src/shared/data/tax-category-master.ts | データ修正 | de543cd |
| docs/genzai/02_database_schema/master_design_rules.md | ルール4/6更新 | de543cd |
| docs/genzai/02_database_schema/tax_category_schema.md | is_customカラム追加 | de543cd |
| docs/genzai/10_nullable_on_document_plan.md | タスクステータス更新 | de543cd |

### 削除したファイル
なし

---

## 🔴 技術的負債（戦略的放置中）

| 内容 | 件数 | 対処時期 | 放置の理由 |
|---|---|---|---|
| deprecated→hiddenフラグ名不一致 | 全マスタ | PostgreSQL移行時 | 現在はモックなのでdeprecatedフラグ流用で十分 |

---

## ⚡ Antigravityへの注意事項

### 今セッションで発生した問題
- 🔒ロックアイコン・✏️ペンアイコンが小さすぎて見えない問題が3回発生（9px→12px→14px→18px→最終的にユーザー指示で調整）
- deprecateChecked/restoreChecked削除時にhideRow関数が壊れた（replaceのTargetContentが不正確だった）

### 対策ルール（毎回徹底）
- アイコンサイズは最低14px以上にすること
- 複数関数を一度に削除する場合、正確なTargetContentを確認してから実行
- ブラウザ確認は必ずスクリーンショットを目視確認

---

## ⚠️ 未解決・保留中・未確認

| 内容 | 保留理由 | 再開条件 |
|---|---|---|
| 顧問先管理UI（K10-K14） | スコープ宣言済み、実装未着手 | 次セッションで着手 |

---

## ❌ やらないと決めたこと

| 内容 | 理由 |
|---|---|
| 既存ScreenA_Clients.vueの改修 | 新規に/master/clientsを作成する方針に決定 |
| monthlyTotalFee/annualTotalFeeのDB保存 | 導出値のためUIで算出する設計を維持 |

---

## 🔄 次のセッションへの引き継ぎ

- **次にやること**: 顧問先管理UI（K10-K14）の実装
  - K10: 顧問先一覧表示（MockMasterClientsPage.vue新規作成）
  - K11: 顧問先追加モーダル（右スライドインパネル、16項目フォーム）
  - K12: 顧問先編集
  - K13: 顧問先停止（物理削除なし）
  - K14: 新規作成時マスタ自動コピー
- **スコープ宣言済み**: router/index.ts (L161付近に3行追加)、MockNavBar.vue (L61 path変更)、MockMasterClientsPage.vue (新規500-700行)
- **業種ドロップダウン**: ScreenS_Settings.vueのindustryOptions（23業種）と同一
- **参照すべきファイル（優先順）**:
  1. docs/genzai/10_nullable_on_document_plan.md（K10-K14タスク定義）
  2. src/features/client-management/schemas/ClientFormSchema.ts（33プロパティ定義）
  3. src/views/ScreenS_Settings.vue（業種ドロップダウン・基本情報パネルのUI参考）
  4. src/mocks/views/MockMasterAccountsPage.vue（テーブル+一括操作の実装参考）
- **注意事項**: clientCodeは一意IDではない（3コード、可変）。内部IDをUUIDで自動生成すること

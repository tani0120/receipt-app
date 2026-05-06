# 29. Kintone風フィルタ + ページ最適化

> 作業期間: 2026-05-06
> 適用対象: 全マスター一覧ページ + 進捗管理ページ

---

## 概要

kintone準拠のフィルタリング・ビュー管理・URL同期アーキテクチャを全ページに導入。
サーバーサイドフィルタエンジンを新設し、フロントの旧フィルタUIを完全置換。

---

## 実施済み ✅

### 1. 汎用フィルタエンジン（サーバーサイド）

| ファイル | 内容 |
|---|---|
| `src/api/helpers/applyFilterConditions.ts` | **新規** — FilterCondition[]を受け取る汎用フィルタ関数 |

- 12種類の演算子対応: `eq`, `neq`, `contains`, `not_contains`, `in`, `not_in`, `gte`, `lte`, `gt`, `lt`, `is_empty`, `is_not_empty`
- AND/OR条件結合
- boolean型フィールド対応（`'true'`/`'false'`文字列→boolean変換）
- Supabase移行時はWHERE句生成（PostgREST形式）に差替可能な構造

```
処理フロー:
フロント → POST /api/clients/list { filters: [...], logic, sort, page, pageSize }
  → clientListService.getClientList(query)
    → 1. getAll()
    → 2. applyFilterConditions(rows, query.filters, query.logic)
    → 3. ソート
    → 4. ページネーション
    → レスポンス返却
```

### 2. ClientListQuery拡張

| ファイル | 変更内容 |
|---|---|
| `src/api/services/clientListService.ts` | `statusFilters` → `filters: FilterCondition[]` + `logic: 'and' | 'or'` に拡張 |

- `statusFilters`は後方互換として残存（`filters`が空の場合のフォールバック）
- 全ページ移行完了後に`statusFilters`を削除予定

### 3. URL ⇔ フィルタ状態の相互変換

| ファイル | 内容 |
|---|---|
| `src/utils/urlFilterSync.ts` | **新規** — kintone準拠のURL設計 |

```
URL形式:
  ?view=basic&q=status.in.active&sort=threeCode.asc
  ?view=all&q=status.in.active,type.eq.corp&logic=and&sort=companyName.desc

パラメータ:
  view   — ビュー名（basic, all等）
  q      — フィルタ条件（ドット区切り、カンマで複数条件連結）
  logic  — 条件結合方式（and/or、省略時=and）
  sort   — ソート設定（フィールド.順序）
```

### 4. FilterModal.vue（kintone風絞り込みモーダル）

| ファイル | 内容 |
|---|---|
| `src/components/list-view/FilterModal.vue` | **新規** — kintone風絞り込みモーダル |
| `src/components/list-view/types.ts` | **新規** — 共通型定義 |

```
┌─────────────────────────────────────────────────┐
│ 絞り込む                                    ✕   │
├─────────────────────────────────────────────────┤
│ 条件                                            │
│ ┌──────────┐┌──────────────────┐┌─────────┐ ⊖  │
│ │ステータス▼││次のいずれかを含む▼││ ✔稼働中  │     │
│ └──────────┘└──────────────────┘│ ✔休眠中  │     │
│                                 └─────────┘     │
│ ⊕                                               │
│ ● すべての条件を満たす  ○ いずれかの条件を満たす    │
│                                                  │
│ [すべてクリア]  [デフォルトに戻す]                  │
│─────────────────────────────────────────────────│
│ ソート                                           │
│ ┌──────────┐┌──────┐                           │
│ │3コード   ▼││昇順  ▼│                            │
│ └──────────┘└──────┘                            │
│─────────────────────────────────────────────────│
│ [キャンセル]                          [適用]      │
└─────────────────────────────────────────────────┘
```

- フィールド検索（インクリメンタル）
- 複数条件追加/個別削除
- AND/ORラジオボタン
- ソート（フィールド＋昇順/降順）
- 「すべてクリア」→ 全条件を空にする（全件表示）
- 「デフォルトに戻す」→ ビューの初期条件・ソートに復元

### 5. TableFilterToolbar改善

| ファイル | 変更内容 |
|---|---|
| `src/components/TableFilterToolbar.vue` | フィルタタグ表示、デフォルト値パススルー追加 |

- ファンネルアイコン横に適用中フィルタ条件をタグ（チップ）表示
- 演算子ラベル日本語化（eq=, in=のいずれか, contains=含む 等）
- select型の値をラベルに変換（active→稼働中）
- ×ボタンで個別条件削除
- `defaultConditions`/`defaultSort` propsをFilterModalにパススルー

### 6. POST二重呼び出し修正（全6ページ）

watchをnextTickバッチ化し、同一tick内の連鎖的ref変更による二重API発火を防止。

| ページ | 修正 |
|---|---|
| `MockMasterClientsPage.vue` | ✅ nextTickバッチ化 |
| `LeadListPage.vue` | ✅ nextTickバッチ化 |
| `MockMasterStaffPage.vue` | ✅ nextTickバッチ化 |
| `MockMasterVendorsPage.vue` | ✅ nextTickインポート + バッチ化 |
| `MockMasterNonVendorPage.vue` | ✅ nextTickインポート + バッチ化 |
| `MockProgressDetailPage.vue` | ✅ nextTickインポート + バッチ化 |

### 7. ビュー定義（ViewDefWithDefaults）

各ページにデフォルトフィルタ・ソート付きビュー定義を導入。

#### 顧問先管理（MockMasterClientsPage.vue）

| ビュー | フィルタ | ソート |
|---|---|---|
| 基本情報 | `status in ['active']`（稼働中のみ） | 3コード昇順 |
| （すべて） | なし | 内部ID昇順 |

#### 進捗管理（MockProgressDetailPage.vue）

| ビュー | フィルタ | ソート |
|---|---|---|
| デフォルト | `clientStatus in ['active']` + `unsorted >= 1` + `unexported >= 1` | 3コード昇順 |
| （すべて） | なし | 3コード昇順 |

### 8. フィルタ列の選択肢改善

| フィールド | 変更前 | 変更後 |
|---|---|---|
| 担当者（`staffId`） | text（手入力） | **select**（スタッフ一覧から動的生成） |
| 決算月（`fiscalMonth`） | number（手入力） | **select**（1月〜12月） |
| 主な連絡手段（`contactType`） | select（2件） | select（3件: メール/チャットワーク/**なし**追加） |

### 9. ページタイトル行の青背景化

| ファイル | 変更内容 |
|---|---|
| `src/styles/master-list.css` | `.cm-header` → `background: #3b82f6`、`.cm-title` → `color: #ffffff` |

- 顧問先管理・見込管理: 既存の`cm-header`に自動適用
- 進捗管理: `<div class="cm-header"><h1 class="cm-title">進捗管理</h1></div>`を新規追加

### 10. 進捗管理のフィルタUI刷新

| 変更前 | 変更後 |
|---|---|
| テキスト検索（顧問先）| FilterModal経由の`companyName`フィルタ |
| 担当者ドロップダウン | FilterModal経由の`staffId`フィルタ（スタッフ一覧select） |
| 「未出力がある顧問先のみ表示」チェックボックス | FilterModal経由の`unexported >= 1`条件 |
| 旧フィルタUIコンポーネント | **TableFilterToolbar**に完全置換 |

### 11. CSS外部化

scoped CSSを外部ファイルに分離し、HMR性能とページ遷移時の再注入コストを最適化。

| ファイル | 内容 |
|---|---|
| `src/styles/master-list.css` | 顧問先・見込先一覧の共通スタイル |
| `src/styles/master-staff.css` | スタッフ管理 |
| `src/styles/master-vendors.css` | 取引先管理 |
| `src/styles/master-non-vendor.css` | 非取引先管理 |
| `src/styles/master-accounts.css` | 科目マスタ |
| `src/styles/master-tax-categories.css` | 税区分マスタ |
| `src/styles/master-industry-vector.css` | 業種ベクトル管理 |
| `src/styles/progress-detail.css` | 進捗管理 |

---

## コンポーネント構成

```
src/components/
├── TableFilterToolbar.vue       … ツールバー本体（ビュー切替+列選択+フィルタタグ+ファンネル）
│
src/components/list-view/        … フィルタ関連コンポーネント群
├── FilterModal.vue              … kintone風絞り込みモーダル
└── types.ts                     … FilterCondition, SortSetting, FilterColumnDef等
│
src/utils/
└── urlFilterSync.ts             … URL ⇔ フィルタ状態の相互変換
│
src/api/helpers/
└── applyFilterConditions.ts     … サーバーサイド汎用フィルタ関数
```

---

## 共通型定義（types.ts）

```typescript
/** フィルタ条件 */
interface FilterCondition {
  field: string
  operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'in' | 'not_in'
           | 'gte' | 'lte' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty'
  value: string | string[]
}

/** ソート設定 */
interface SortSetting {
  key: string
  order: 'asc' | 'desc'
}

/** フィルタ列定義（モーダル用） */
interface FilterColumnDef {
  key: string
  label: string
  filterType: 'select' | 'text' | 'number'
  filterOptions?: { value: string; label: string }[]
}
```

---

## 今後の予定（未着手）

### Phase 3: ビュー定義管理（admin専用）

| 項目 | 内容 |
|---|---|
| 権限 | **adminのみ**がビュー定義を作成・編集・削除 |
| ビュー内容 | 表示列キー配列 + 列順序（フィルタ/ソートは含めない） |
| 永続化 | `data/view-defs-{storageKey}.json` にサーバー保存 → Supabase移行時にDB化 |
| 一般ユーザー | ビュー選択ドロップダウンから切替のみ |

### 横展開

- `applyFilterConditions.ts`を他のListService（`vendorListService.ts`等）にも展開
- 全ページで複雑な複数条件フィルタリングを有効化
- `progressListService.ts`のサーバーサイドをFilterConditions対応に移行

### statusFilters完全削除

- 全ページのAPI呼び出しが`filters`に統一された後、`clientListService.ts`の`statusFilters`フォールバックを削除

---

## 注意事項

- ユーザーのフィルタ/ソートはURLのみ（永続化しない）
- ビュー定義の永続化はサーバー側JSON → Supabase移行時にDB化
- 仕訳一覧（JournalListLevel3Mock.vue）はスコープ外
- API設計: 既存エンドポイントを拡張、新規エンドポイント乱立禁止

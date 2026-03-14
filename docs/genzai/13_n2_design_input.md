# N2設計インプット: マスタ vs 顧問先の差異整理

> 作成日: 2026-03-13
> 目的: N2（共有composableのゼロベース再定義）の設計に必要なインプット情報を整理する
> 根拠: モックUI修正で発覚した問題と、master_design_rules.md・tax_category_schema.mdの設計ルール

---

## 1. 発覚した問題（N2設計に影響するもの）

| # | 問題 | 根本原因 | N2への影響 |
|---|------|---------|-----------|
| 1 | `useClients.ts`の正規表現が旧URL体系のまま | URL体系変更時にcomposableの影響範囲を追跡できていない | composableはURL体系に依存しない設計にすべき |
| 2 | NavBarがマスタページでも顧問先名を表示 | マスタと顧問先のコンテキスト分離が不十分 | composableに`scope`パラメータが必要 |
| 3 | フォールバックで常にABC-00001を返す | 「該当なし=null」の設計意図が反映されていない | composableのデフォルト値設計を明確にすべき |
| 4 | 顧問先ページがマスタページの完全コピー | 編集権限・表示ルールの違いが未反映 | composableが`scope`に応じた権限情報を返す必要がある |

---

## 2. マスタページ vs 顧問先ページの編集権限（確定）

### 勘定科目

| 操作 | マスタ | 顧問先 |
|------|:-----:|:-----:|
| デフォルト勘定科目名の編集 | ❌ | ❌ |
| カスタム勘定科目名の編集 | ✅ | ✅ |
| 補助科目の入力 | ❌（常に空白） | ✅（ダブルクリックで自由記載。デフォルト/カスタム両方で編集可） |
| 区分（`category`）の変更 | ✅（カスタムのみ。ダブルクリック→ドロップダウン） | ✅（カスタムのみ） |
| 税区分判定モード（`taxDetermination`）の変更 | ✅（カスタムのみ。category変更時に自動連動） | 上書き可能（ルール9） |
| デフォルト税区分（`defaultTaxCategoryId`）の変更 | ✅（カスタムのみ。category連動フィルタリング） | ✅（カスタムのみ） |
| 表示/非表示の切替 | ❌（全件表示） | ✅（`visible`制御） |
| 非推奨化 | ✅ | ✅ |
| 物理削除（カスタムのみ） | ✅ | ✅ |

### 税区分

| 操作 | マスタ | 顧問先 |
|------|:-----:|:-----:|
| デフォルト税区分名の編集 | ❌ | ❌ |
| カスタム税区分名の編集 | ✅ | ✅ |
| 名称オーバーライド（`mf_name_override`） | ❌（マスタは正式名） | ✅（顧問先固有名） |
| 表示/非表示の切替 | ❌（全件表示） | ✅（`visible`制御） |
| 非推奨化 | ✅ | ✅ |
| 物理削除（カスタムのみ） | ✅ | ✅ |

---

## 3. UIの差異（確定）

| 要素 | マスタページ | 顧問先ページ |
|------|-------------|-------------|
| パンくず | 「← マスタ管理」→ `/master` | 「← 顧問先管理」→ 顧問先管理ページ |
| タイトル（勘定科目） | 「勘定科目マスタ（事務所共通）」 | 「顧問先用勘定科目」 |
| タイトル（税区分） | 「税区分マスタ（事務所共通）」 | 「顧問先用税区分」 |
| デフォルト科目アイコン | 🔓鍵アイコン（編集不可を示す） | デフォルト表示アイコン（編集可能とわかるもの）。カスタム科目にはアイコンなし |
| 事業形態 | `<select>`で選択可能 | `useClients`の`client.type`から取得。選択不可（表示のみ） |
| 不動産所得 | チェックボックスで変更可能 | `useClients`の`client.hasRentalIncome`から取得。選択不可（表示のみ） |
| 課税方式（税区分） | `<select>`で選択可能 | `useClients`の`client.consumptionTaxMode`から取得。選択不可（表示のみ） |
| 説明文（勘定科目） | 「デフォルト科目の勘定科目名・税区分は編集できません。コピー・追加したカスタム科目のみ編集可能です。」 | 「デフォルト科目の科目名は変更できません。補助科目・表示切替は編集可能です。カスタム科目は全項目を編集できます。」 |
| 説明文（税区分） | 「デフォルト税区分の名称は編集できません。コピー・追加したカスタム税区分のみ編集可能です。」 | 「デフォルト税区分の名称は変更できません。表示切替は編集可能です。カスタム税区分は全項目を編集できます。」 |
| MF警告（ルール5） | なし（マスタは正式名） | カスタム科目の名称変更時に?マーク警告表示 |
| 「デフォルトで表示」列（2026-03-14追加） | なし（マスタは全件表示） | 左から2番目に配置。🗑削除+👁表示/非表示アイコン。デフォルト行は👁のみ、カスタム行は🗑+👁 |
| 保存ボタンのlocalStorage永続化（2026-03-14追加） | `sugu-suru:account-master:overrides`に保存 | `sugu-suru:client-accounts:{clientId}`に保存。`subAccounts`マップ含む |

---

## 4. データ取得の依存関係（N2 composable設計に直結）

```
顧問先ページが必要とするデータ:

useClients (既存)
  ├ client.type          → 事業形態（corp/individual）固定表示
  ├ client.hasRentalIncome → 不動産所得あり（個人のみ）固定表示
  └ client.consumptionTaxMode → 課税方式（general/simplified/exempt）固定表示

useAccountSettings (N7で新規作成)
  ├ scope: 'master' | 'client'
  ├ clientId?: string    → 顧問先ページの場合のみ
  ├ accounts[]           → マスタ: ACCOUNT_MASTER / 顧問先: マスタ+カスタム
  ├ taxCategories[]      → マスタ: TAX_CATEGORY_MASTER / 顧問先: マスタ+カスタム+override
  ├ permissions           → scope依存の編集権限
  └ effectiveAccounts()  → 合成済みマスタ（仕訳UIが使う）
```

---

## 5. 現在のモックUI修正項目（優先実施）

| # | 修正内容 | 対象ファイル |
|---|---------|-------------|
| 1 | パンくず「← マスタ管理」→「← 顧問先管理」 | `MockClientAccountsPage.vue` L8-10, `MockClientTaxPage.vue` L8-10 |
| 2 | タイトル変更 | 同上 L11 |
| 3 | 事業形態の固定表示（`useClients`から取得） | `MockClientAccountsPage.vue` L18-21, `MockClientTaxPage.vue` L18-22 |
| 4 | 不動産所得の固定表示（個人の場合のみ） | `MockClientAccountsPage.vue` L23-28 |
| 5 | アイコン変更（鍵→デフォルト表示） | `MockClientAccountsPage.vue` L118, `MockClientTaxPage.vue` L97 |
| 6 | 説明文修正 | `MockClientAccountsPage.vue` L39, `MockClientTaxPage.vue` L29 |
| 7 | MF名称変更警告の実装 | 両ファイル |

---

## 5.5 共通設計原則（全composable共通）

### sensitive情報の管理

| ルール | 内容 |
|--------|------|
| **表示用型にsensitive情報を含めない** | `Staff`型に`password`なし。APIレスポンスにも含めない |
| **入力用型にのみ含める** | `StaffForm`に`password`あり。新規作成・変更時のみ使用 |
| **composableが返すRefにsensitive情報を載せない** | `useStaff()` → `staffList: Ref<Staff[]>` にpasswordなし |
| **モックデータにもsensitive情報を書かない** | gitにコミットされるため |

### モックと本番の差異

| 処理 | モック（現在） | 本番実装 |
|------|---------------|---------|
| パスワード保存 | 入力値を無視（alertのみ） | HTTPS経由でAPI送信 → bcryptハッシュ化 |
| パスワード編集 | 欄は常に空で開く | 同左（サーバーからpasswordを返さない） |
| パスワードバリデーション | 新規作成時のみ必須チェック | 同左 + ポリシー（最小文字数等） |

---

## 6. 関連設計書

| ファイル | 関連ルール |
|---------|-----------|
| [master_design_rules.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/master_design_rules.md) | ルール4（編集権限）、ルール5（MF警告）、ルール7（自動コピー）、ルール9（AI可否上書き） |
| [tax_category_schema.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/tax_category_schema.md) | `client_tax_settings`テーブル（L110-119）、`mf_name_override`（L118） |
| [10_nullable_on_document_plan.md](file:///c:/dev/receipt-app/docs/genzai/10_nullable_on_document_plan.md) | N1-N7タスク一覧、URL体系マップ（L561-577） |
| [12_full_schema_design_20260311.md](file:///c:/dev/receipt-app/docs/genzai/12_full_schema_design_20260311.md) | accountsテーブル（L87-107）、is_customカラム（L100）

---

## 7. 設定パネル読み取り専用化の設計決定（2026-03-14確定）

> 設定画面（`/client/settings/:clientId`）の「基本情報」パネルは、顧問先管理ページ（`/master/clients`）との機能重複を解消するため、**読み取り専用**とする。

### 決定事項

| 項目 | 決定 |
|------|------|
| パネルデザイン | 元のフォームデザインを維持し、全要素にdisabled属性を付与 |
| ヘッダー | 「顧問先情報の編集はこちら」リンク（左寄せ、17px、太字600）＋×閉じるボタン |
| キャンセル/保存ボタン | 削除 |
| 編集先 | 顧問先管理ページ（`/master/clients`）の編集パネル |

### データ一元化方針

| データソース | 方針 |
|-------------|------|
| `staffName`（担当者名） | 旧系統フィールドとして全削除。composable(`useClients`)経由でのみ参照 |
| 顧問先基本情報 | 設定画面は閲覧のみ。編集は顧問先管理ページに一元化 |
| `currentClient` composable | 返却型を`Client | null`に変更済み（N1f）。フォールバック廃止 |

### N2 composable設計への影響

- `useAccountSettings`が返すデータに顧問先基本情報は含めない（`useClients`の責務）
- 設定画面のパネルは`useClients`の`currentClient`から直接データバインド
- 編集はcomposableの`updateClient()`メソッド経由（顧問先管理ページのみ）


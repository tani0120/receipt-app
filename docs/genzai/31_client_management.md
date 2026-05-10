# 31. 顧問先管理

## 概要

顧問先の詳細編集・一覧管理を担う画面群。Kintoneスタイルのレイアウトエディタによるフィールド配置のカスタマイズ、カスタムフィールドの動的追加、レイアウト定義のAPI永続化を実装済み。

## 対象ページ

| 画面 | パス | ファイル |
|---|---|---|
| 顧問先詳細・編集 | `/master/clients/:clientId` | `ClientEditPage.vue` |
| 顧問先一覧 | `/master/clients` | `MockMasterClientsPage.vue` |
| レイアウト管理 | `/master/clients/:clientId?mode=layout` | `ClientEditPage.vue`（モード切替） |

---

## アーキテクチャ

### データフロー

```
┌─────────────────────────────────────────────────────────┐
│                   顧問先データ                            │
│  clients.json → GET /api/clients → useClients.ts        │
│  → ClientEditPage.vue (form展開)                         │
│  → PUT /api/clients/:clientId (保存)                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              レイアウト定義（全社共通）                      │
│  GET /api/field-layout/client                            │
│  → useFieldLayout.ts（シングルトンMap）                    │
│  → 全画面で即時共有（編集・一覧・レイアウト管理）              │
│  → PUT /api/field-layout/client (保存)                   │
│  → data/field-layouts/client.json                        │
└─────────────────────────────────────────────────────────┘
```

### useFieldLayout（シングルトン・パターン）

モジュールスコープの `Map<pageId, SharedState>` により、同一 `pageId` を指定する全コンポーネントで状態を共有。

```typescript
interface SharedState {
  fields: Ref<FieldDef[]>;           // 全フィールド定義
  sectionOrder: Ref<string[]>;       // セクション順序
  sectionHeights: Ref<Record<string, number>>;
  labelOverrides: Ref<Record<string, string>>;
  fieldOptions: Ref<Record<string, FieldOption[]>>;
  hiddenFields: Ref<string[]>;
  deletedFields: Ref<string[]>;
  fieldRows: Ref<string[][]>;        // 行ベースレイアウト
  customDefs: Ref<CustomFieldDef[]>; // カスタムフィールド定義
}
```

**永続化:** API PUT（`data/field-layouts/{pageId}.json`）に一本化。初回アクセス時にlocalStorageからの自動移行を実施し、移行後はlocalStorageを削除。

### カスタムフィールド

| 区分 | 保存先 | 管理元 |
|---|---|---|
| 定義（全社共通） | `data/field-layouts/client.json` の `customDefs` | `useFieldLayout.customDefs` |
| 値（顧問先ごと） | `data/clients.json` の各レコード `extraFields` | `ClientEditPage.vue` が直接処理 |

※ `useCustomFields.ts` は廃止済み（デッドコードとして削除）。

---

## フィールド定義

### 定義ファイル

| ファイル | 内容 |
|---|---|
| `src/constants/clientFieldDefs.ts` | `clientFieldsFlat`（唯一のフィールド定義）、`clientSections`、`LIST_ONLY_COLUMNS` |
| `src/constants/clientOptions.ts` | 全ドロップダウン選択肢定数 + `getLabel()` |
| `src/types/fieldLayout.ts` | `FieldDef`, `SavedFieldLayout`, `FieldOption` 等の型定義 |

※ 旧 `clientFields`（セクション付き配列）は廃止済み。`clientFieldsFlat` に一本化。

### フィールド定義構造（clientFieldsFlat）

フラット構造。セクション分割はheadingコンポーネントで表現。全フィールドの `section` は空文字。

```
heading_basic（基本情報）
  status / type / engagementStartDate / engagementEndDate
  staffId / subStaffId / payrollStaffId / progressLink
  clientId / threeCode / companyName / companyNameKana
  corporateNumber / repTitle / repName / repNameKana

heading_needs（ニーズ管理）
  needsInsurance / needsTaxSaving / needsSubsidy / needsLoan / needsRealEstate

heading_fiscal（決算・税務）
  fiscalDate / consumptionTaxInterim / isInvoiceRegistered
  invoiceRegistrationNumber / establishedDate

heading_memo（備考・URL・その他）
  memo / websiteUrl / sharedEmail / uploadUrlStaff / uploadUrlGuest
  annualRevenue / employeeCount / industry / parentCompany / businessDescription

heading_contact（連絡先）
  contactTable（連絡先テーブル）

heading_accounting（会計設定）
  accountingSoftware / taxFilingType / consumptionTaxMode / simplifiedTaxCategory
  taxMethod / calculationMethod / defaultPaymentMethod
  hasDepartmentManagement / hasRentalIncome

heading_system（システム導入状況）
  accountingSoftwareDisplay / accountingSoftwareMemo
  payrollSoftware / payrollSoftwareMemo
  attendanceSystem / attendanceSystemMemo
  otherSystem / otherSystemMemo

heading_fee（報酬情報）
  contractScope / bookkeepingType / hasSocialInsuranceContract
  hasPayrollService / hasAccountingService

heading_fee_amount（報酬金額）
  advisoryFee / bookkeepingFee / socialInsuranceFee / payrollFee
  accountingServiceFee / systemFee / monthlyTotal（自動算出）
  settlementFee / taxFilingFee / annualTotal（自動算出）

heading_payment（契約・引き落とし）
  contractDocUrl / paymentMethod / paymentDay / feeNotes
```

### 一覧画面専用の派生列（LIST_ONLY_COLUMNS）

| キー | ラベル |
|---|---|
| `companyName` | 会社名/代表者名 |
| `taxMode` | 課税方式 |
| `staffName` | 担当者 |
| `fiscalMonth` | 決算日 |
| `driveUrl` | Drive取込 |
| `contact` | 主な連絡手段 |

---

## 選択肢定数（clientOptions.ts）

| 定数名 | 内容 |
|---|---|
| `TYPE_OPTIONS` | 法人/個人事業/個人 |
| `STATUS_OPTIONS` | 契約中/休眠中/契約終了 |
| `INDUSTRY_OPTIONS` | 業種24項目 |
| `ACCOUNTING_SOFTWARE_OPTIONS` | MF/freee/弥生/TKC/その他 |
| `TAX_FILING_OPTIONS` | 青色/白色 |
| `TAX_MODE_OPTIONS` | 原則課税/簡易課税/免税 |
| `SIMPLIFIED_CATEGORY_OPTIONS` | 第一種〜第六種 |
| `TAX_METHOD_OPTIONS` | 税込/税抜 |
| `CALCULATION_METHOD_OPTIONS` | 発生主義/現金主義/中間現金主義 |
| `DEFAULT_PAYMENT_OPTIONS` | 現金/事業主借/買掛金 |
| `CONSUMPTION_TAX_INTERIM_OPTIONS` | 不要/1回/3回/11回 |
| `NEEDS_OPTIONS` | 未確認/あり/なし |
| `CONTRACT_SCOPE_OPTIONS` | 決算のみ/顧問/年1〜12回 |
| `BOOKKEEPING_TYPE_OPTIONS` | 自計化/記帳代行 |
| `YES_NO_OPTIONS` | なし/あり |
| `PAYMENT_METHOD_OPTIONS` | 紙/口座引落し |
| `PAYMENT_DAY_OPTIONS` | 8日/その他 |
| `CONTACT_METHOD_OPTIONS` | メール/電話/チャットワーク |

汎用関数: `getLabel(options, value)` — value→labelの変換を共通化

---

## レイアウト管理

### 機能

| 機能 | 説明 |
|---|---|
| ドラッグ&ドロップ | フィールドの並び替え |
| 幅変更 | フィールドの横幅（%）調整 |
| 表示/非表示 | フィールドの表示切替 |
| 論理削除/復元 | フィールドの論理削除と復元 |
| ラベル上書き | フィールドの表示名変更 |
| 選択肢カスタマイズ | select型フィールドの選択肢編集 |
| カスタムフィールド追加 | テキスト/数値/日付/選択肢等の動的追加 |
| heading編集 | サイズ・背景色・文字色の変更 |
| spacer編集 | 高さの変更 |
| Undo/Redo | 編集操作の取消/やり直し |

### フィールド管理モーダル（CustomFieldModal.vue）

全フィールドの一括管理UI。以下の機能を提供:

- **文字検索**: フィールド名でのリアルタイム絞り込み
- **種別フィルタ**: コンポーネント種別（テキスト/数値/日付等）での絞り込み
- ラベル上書き・表示/非表示・論理削除の一括管理
- カスタムフィールドの追加
- 選択肢の編集

### API

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/field-layout/:pageId` | レイアウト定義取得 |
| PUT | `/api/field-layout/:pageId` | レイアウト定義保存 |

**保存データ（SavedFieldLayout）:**

```typescript
interface SavedFieldLayout {
  pageId: string;
  fieldOrders: Record<string, string[]>;
  fieldWidths: Record<string, number>;
  fieldRowSpans?: Record<string, number>;
  fieldLineBreaks?: Record<string, boolean>;
  fieldHeights?: Record<string, number>;
  sectionHeights?: Record<string, number>;
  sectionOrder: string[];
  updatedAt: string;
  updatedBy: string;
  labelOverrides?: Record<string, string>;
  fieldOptions?: Record<string, FieldOption[]>;
  hiddenFields?: string[];
  fieldRows?: string[][];
  deletedFields?: string[];
  customDefs?: Array<{
    key: string; label: string; section: string;
    component: string; widthPercent: number; order: number;
  }>;
}
```

---

## 変更対象ファイル

| 操作 | ファイル | 内容 |
|---|---|---|
| 実装済 | `src/composables/useFieldLayout.ts` | シングルトン + API永続化 + customDefs統合 |
| 実装済 | `src/constants/clientFieldDefs.ts` | `clientFieldsFlat` 一本化（旧`clientFields`廃止） |
| 実装済 | `src/constants/clientOptions.ts` | 全選択肢定数 + `getLabel()` |
| 実装済 | `src/types/fieldLayout.ts` | `SavedFieldLayout`にcustomDefs追加、`LayoutVersion`廃止 |
| 実装済 | `src/views/master/ClientEditPage.vue` | レイアウト管理 + customDefs統合 |
| 実装済 | `src/views/master/MockMasterClientsPage.vue` | `clientFieldsFlat` + customDefs統合 |
| 実装済 | `src/components/CustomFieldModal.vue` | 文字検索追加、CustomFieldDef型統一 |
| 実装済 | `src/api/routes/fieldLayoutRoutes.ts` | レイアウトCRUD API |
| 廃止 | `src/composables/useCustomFields.ts` | 削除済み（customDefsはuseFieldLayout、extraFieldValuesはClientEditPage直接処理） |

---

## 検証計画

### コンパイル
- `vue-tsc --noEmit` エラーなし

### ブラウザ検証
- 閲覧モード: 全フィールドが枠線付きで表示
- 編集モード: 全ドロップダウン・テキスト入力・テーブル行追加が動作
- レイアウト管理: フィールド並替・幅変更・heading編集が正常動作
- レイアウト保存: `data/field-layouts/client.json` にAPI保存
- レイアウト復元: ブラウザリロード後にAPIから復元
- カスタムフィールド: 追加→一覧・編集画面に即時反映
- フィールド管理モーダル: 文字検索・種別フィルタが正常動作
- sharedEmailが編集不可
- 自動生成URL（社内用/顧問先用）が正しく表示

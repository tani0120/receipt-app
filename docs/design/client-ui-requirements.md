# 顧問先UI要件定義（Phase 1）

**作成日**: 2026-01-23  
**ステータス**: 確定  
**参照**: ScreenA-data-contract.md

---

## プロパティ一覧（31項目）

### 基本情報（13項目）

| # | プロパティ | 選択肢 | デフォルト | 必須 |
|---|-----------|--------|-----------|------|
| 1 | ステータス | 稼働中/停止中 | 稼働中 | ○ |
| 2 | ジョブID | 自動採番 | - | - |
| 3 | 3コード | 大文字アルファベット3文字 | - | ○ |
| 4 | 担当者名 | スタッフ一覧 | 一番上 | ○ |
| 5 | 種別 | 法人/個人 | 法人 | ○ |
| 6 | 会社名 | テキスト | - | ○ |
| 7 | 会社名フリガナ | テキスト | - | - |
| 8 | 代表者名 | テキスト | - | ○ |
| 9 | 代表者名フリガナ | テキスト | - | - |
| 10 | 決算月 | 1-12月 | 1月 | - |
| 11 | 設立年月日 | YYYY/MM/DD | - | - |
| 12 | 電話番号 | テキスト | - | - |
| 13 | 連絡手段 | メール/チャットワーク + テキストエリア | メール | - |

### 会計設定（12項目）

| # | プロパティ | 選択肢 | デフォルト | 必須 |
|---|-----------|--------|-----------|------|
| 1 | 会計ソフト | MF/Freee/弥生/TKC | MF | ○ |
| 2 | 経理方式 | 税込/税抜 | **税込** | - |
| 3 | 計上基準 | 現金/期中現金/発生 | **期中現金** | - |
| 4 | 課税方式 | 原則/免税/簡易 | 原則 | - |
| 5 | 事業区分 | 簡易1-6 | 簡易1 | - |
| 6 | 消費税端数処理 | 切り捨て/四捨五入/切り上げ | **切り捨て** | - |
| 7 | **消費税適用特例** | **なし/2割特例/3割特例** | **なし** | - |
| 8 | **仕入税額控除方式** | **個別/一括/全額** | **全額** | - |
| 9 | **経過措置計算** | **適用する/適用しない** | **適用する** | - |
| 10 | インボイス登録 | あり/なし | あり | - |
| 11 | 標準決済手段 | 現金/社長借入金/未払金 | 現金 | - |
| 12 | 部門管理 | あり/なし | あり | - |

### 報酬設定（6項目）

| # | プロパティ | 選択肢 | デフォルト | 必須 |
|---|-----------|--------|-----------|------|
| 1 | 顧問報酬（月額） | 数値、0以上 | 0 | ○ |
| 2 | 記帳代行（月額） | 数値、0以上 | 0 | ○ |
| 3 | 月次報酬合計 | 自動算出 | - | - |
| 4 | 決算報酬（年次） | 数値、0以上 | 0 | ○ |
| 5 | 消費税申告報酬（年次） | 数値、0以上 | 0 | ○ |
| 6 | 年間総報酬 | 自動算出 | - | - |

---

## 自動算出の計算式

### 月次報酬合計
```
顧問報酬 + 記帳代行
```

### 年間総報酬
```
顧問報酬×12 + 記帳代行×12 + 決算報酬 + 消費税申告報酬
```

---

## Phase 1実装方針

### 実装する
- ✅ 全31項目の入力UI
- ✅ Zodスキーマ定義（全フィールド）
- ✅ デフォルト値設定
- ✅ 自動算出（月次報酬合計、年間総報酬）
- ✅ Firestoreへの保存
- ✅ 一覧表示

### 実装しない（Phase 2へ）
- ❌ 課税方式による仕訳の自動変更
- ❌ 会計ソフト形式によるCSV変換の違い
- ❌ 標準決済手段の自動適用
- ❌ 部門管理機能
- ❌ 経過措置計算の実装

---

## Zodスキーマ設計

```typescript
export const ClientSchema = z.object({
  // 基本情報
  status: z.enum(['active', 'inactive']).default('active'),
  jobId: z.string().optional(),
  clientCode: z.string().regex(/^[A-Z]{3}$/),
  staffName: z.string().min(1),
  type: z.enum(['corp', 'individual']).default('corp'),
  companyName: z.string().min(1),
  companyNameKana: z.string().optional(),
  repName: z.string().min(1),
  repNameKana: z.string().optional(),
  fiscalMonth: z.number().int().min(1).max(12).default(1),
  establishedDate: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).optional(),
  phoneNumber: z.string().optional(),
  contact: z.object({
    type: z.enum(['email', 'chatwork']).default('email'),
    value: z.string().optional(),
  }).optional(),
  
  // 会計設定
  accountingSoftware: z.enum(['mf', 'freee', 'yayoi', 'tkc']).default('mf'),
  taxMethod: z.enum(['inclusive', 'exclusive']).default('inclusive'),
  calculationMethod: z.enum(['cash', 'interim_cash', 'accrual']).default('interim_cash'),
  consumptionTaxMode: z.enum(['general', 'exempt', 'simplified']).default('general'),
  simplifiedTaxCategory: z.enum(['1', '2', '3', '4', '5', '6']).default('1'),
  roundingSettings: z.enum(['floor', 'round', 'ceil']).default('floor'),
  consumptionTaxException: z.enum(['none', '20percent', '30percent']).default('none'),
  purchaseTaxDeduction: z.enum(['individual', 'lump', 'full']).default('full'),
  transitionalMeasure: z.enum(['apply', 'not_apply']).default('apply'),
  isInvoiceRegistered: z.boolean().default(true),
  defaultPaymentMethod: z.enum(['cash', 'owner_loan', 'accounts_payable']).default('cash'),
  hasDepartmentManagement: z.boolean().default(true),
  
  // 報酬設定
  advisoryFee: z.number().min(0).default(0),
  bookkeepingFee: z.number().min(0).default(0),
  settlementFee: z.number().min(0).default(0),
  taxFilingFee: z.number().min(0).default(0),
  
  // Google Drive連携（追加）
  parentFolderId: z.string(), // GASがある親フォルダID
  sharedFolderId: z.string(), // 顧問先共有フォルダID
});
```

---

## Google Drive連携

### フォルダ構成

```
親フォルダ（GASがある場所）
├── AAA_株式会社エーアイシステム_資料共有用（処理後移動します）
├── BBB_個人事業主山田太郎_資料共有用（処理後移動します）
└── CCC_合同会社テスト_資料共有用（処理後移動します）
```

**フォルダ名ルール**:
```
{3コード}_{会社名}_資料共有用（処理後移動します）
```

**サブフォルダ**: なし（顧問先は1つのフォルダに全て保存）

---

### 権限設定

| 役割 | 権限 | 備考 |
|------|------|------|
| オーナー | 事務所 | 全権限 |
| 編集者 | 担当者 | 編集可能 |
| 投稿者 | 顧問先 | 資料保存可、フォルダ削除・移動不可 |

**Google Drive API**: Contributor権限を使用

---

## CRUD操作詳細

### 新規登録（Phase 1）

1. **モーダルで入力**
2. **保存時の処理**:
   - Google Driveフォルダ自動作成
   - フォルダ名: `{3コード}_{会社名}_資料共有用（処理後移動します）`
   - 権限設定: 投稿者（顧問先）
   - `sharedFolderId`をClientSchemaに保存

---

### 編集（Phase 1）

**編集可能**: ジョブID以外の全項目

**3コード変更**: 可能（会社名変更等に対応）

**Phase 1の動作**:
- フォルダ名変更なし（手動対応）

**Phase 2で追加**:
- 3コード・会社名変更時に自動でフォルダ名変更

---

### 削除

- 物理削除なし
- ステータスを「停止中」に変更
- Google Driveフォルダは放置（人間が削除）

---

## UI仕様

### 登録・編集画面

**レイアウト**: モーダル

**セクション分け**:
1. 基本情報
2. 会計設定
3. 報酬設定

---

### 一覧表示

**表示カラム**（10項目）:

| # | カラム | 表示内容 | 備考 |
|---|--------|---------|------|
| 1 | ステータス | 稼働中/停止中 | - |
| 2 | 3コード | AAA | - |
| 3 | 担当者名 | 山田太郎 | - |
| 4 | 種別 | 法人/個人 | - |
| 5 | 会社名/代表者名 | 法人→会社名、個人→代表者名 | 条件分岐 |
| 6 | 決算月 | 3月 | - |
| 7 | 会計ソフト | MF | - |
| 8 | 電話番号 | 06-1111-2222 | - |
| 9 | 連絡手段 | リンク | メール/チャットワーク |
| 10 | 共有フォルダ | リンク | Google Drive |

---

## Phase 1/2振り分け

### Phase 1（今すぐ実装）

**実装する**:
- ✅ 全33項目の入力UI（Drive連携2項目追加）
- ✅ モーダル（登録・編集）
- ✅ 一覧表示（10カラム）
- ✅ Google Driveフォルダ自動作成
- ✅ 権限設定（投稿者）
- ✅ `sharedFolderId`, `parentFolderId`保存
- ✅ Zodスキーマ定義
- ✅ デフォルト値設定
- ✅ 自動算出（報酬計算）

**実装しない**:
- ❌ 課税方式による仕訳自動変更
- ❌ 会計ソフト別CSV形式
- ❌ 標準決済手段の自動適用
- ❌ 部門管理機能
- ❌ 経過措置計算の実装

---

### Phase 2（将来実装）

**追加機能**:
- 3コード・会社名変更時のフォルダ名自動変更
- 業務ロジック完全版

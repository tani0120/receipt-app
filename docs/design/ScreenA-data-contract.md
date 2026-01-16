# Screen A 完全要件定義（改訂版）

**日付**: 2026-01-15  
**ステータス**: 設計中  
**前回の提案**: 不十分（報酬等の新規フィールド未対応）

---

## 画面構成

### **基本情報エリア**
- KPI表示（登録顧問先数、稼働中、今月申告対象等）

### **顧問先管理一覧エリア**
![参考画像](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/uploaded_image_1768403505523.png)

**カラム**:
- 設定状況（稼働中/停止中）
- ID（3コード）
- 会社名
- 担当
- 連絡
- 決算月
- ソフト/税/基準
- DRIVE連携

### **機能**
- ✅ 新規登録
- ✅ 編集
- ❌ 物理削除（なし）

---

## フィールド仕様（完全版）

### **基本情報**

| フィールド | 型 | 必須 | バリデーション | UI |
|-----------|----|----|-------------|-----|
| **ステータス** | enum | ○ | 稼働中/停止中 | ドロップダウン（デフォルト：稼働中） |
| **ジョブID** | string | - | 自動採番 | 自動生成（表示のみ） |
| **3コード** | string | ○ | 大文字アルファベット3文字 | テキスト（AAA例示、英大文字のみ） |
| **担当者名** | string | ○ | 担当者一覧から選択 | ドロップダウン |
| **種別** | enum | ○ | 法人/個人 | ドロップダウン |
| **会社名** | string | ○ | - | テキスト（例：個人は屋号、屋号なければ代表者名） |
| **会社名フリガナ** | string | - | - | テキスト |
| **代表者名** | string | ○ | - | テキスト（例：個人は代表者名重複OK） |
| **代表者名フリガナ** | string | - | - | テキスト |
| **決算月** | number | - | 1-12 | ドロップダウン（例：個人は12月） |
| **設立年月日** | string | - | YYYYMMDD | テキスト入力（YYYY/MM/DD形式）+ カレンダーピッカー（日付選択UI） |
| **電話番号** | string | - | - | テキスト（例：0611112222） |
| **連絡手段** | enum | - | メール/チャットワーク | ドロップダウン |
| **連絡手段のテキストエリア** | string | - | - | テキストエリア |

### **会計設定**

| フィールド | 型 | 必須 | バリデーション | UI |
|-----------|----|----|-------------|-----|
| **会計ソフト** | enum | ○ | MF/Freee/弥生/TKC | ドロップダウン |
| **経理方式** | enum | - | 税込/税抜 | ドロップダウン |
| **計上基準** | enum | - | 現金/期中現金/発生 | ドロップダウン |
| **課税方式** | enum | - | 原則/免税/簡易 | ドロップダウン |
| **事業区分** | enum | - | 簡易1-6 | ドロップダウン |
| **消費税端数処理** | enum | - | 切り捨て/四捨五入/切り上げ | ドロップダウン（デフォルト：切り捨て） |
| **インボイス登録** | enum | - | あり/なし | ドロップダウン |
| **標準決済手段** | enum | - | 現金/社長借入金/未払金 | ドロップダウン（例：OCR判別不能時の科目） |
| **部門管理** | enum | - | あり/なし | ドロップダウン |

### **報酬設定**

| フィールド | 型 | 必須 | バリデーション | UI | 備考 |
|-----------|----|----|-------------|-----|------|
| **顧問報酬** | number | ○ | 0以上、半角数字のみ | テキスト（0はOK） | 月額 |
| **記帳代行** | number | ○ | 0以上、半角数字のみ | テキスト（0はOK） | 月額 |
| **月次報酬合計** | number | - | 自動算出 | 自動算出（表示のみ） | 顧問報酬+記帳代行 |
| **決算報酬** | number | ○ | 0以上、半角数字のみ | テキスト（0はOK） | 年次 |
| **消費税申告報酬** | number | ○ | 0以上、半角数字のみ | テキスト（0はOK） | 年次 |
| **年間総報酬** | number | - | 自動算出 | 自動算出（表示のみ） | 詳細は下記計算式参照 |

**月次報酬合算の計算式**:
```
顧問報酬 + 記帳代行
```

**年間総報酬の計算式**:
```
顧問報酬×12 + 記帳代行×12 + 決算報酬 + 消費税申告報酬
```

**注記**:
- **顧問報酬**と**記帳代行**は**月額**
- **決算報酬**と**消費税申告報酬**は**年次**

---

## データスキーマ設計

### **1. ClientSchema（Firestore）**

```typescript
export const ClientSchema = z.object({
  // システム
  clientCode: z.string().regex(/^[A-Z]{3}$/, '大文字アルファベット3文字'),
  jobId: z.string().optional(), // 自動採番
  
  // 基本情報
  status: z.enum(['active', 'inactive']), // 稼働中/停止中
  type: z.enum(['corp', 'individual']), // 法人/個人
  companyName: z.string().min(1),
  companyNameKana: z.string().optional(),
  repName: z.string().min(1),
  repNameKana: z.string().optional(),
  staffName: z.string().min(1), // 担当者名
  
  fiscalMonth: z.number().int().min(1).max(12).optional(),
  establishedDate: z.string().regex(/^\d{8}$/).optional(), // YYYYMMDD
  phoneNumber: z.string().optional(),
  
  contact: z.object({
    type: z.enum(['email', 'chatwork', 'none']).optional(),
    value: z.string().optional(),
  }).optional(),
  
  // 会計設定
  accountingSoftware: z.enum(['mf', 'freee', 'yayoi', 'tkc']),
  taxMethod: z.enum(['inclusive', 'exclusive']).optional(), // 税込/税抜
  calculationMethod: z.enum(['accrual', 'cash', 'interim_cash']).optional(), // 発生/現金/期中現金
  consumptionTaxMode: z.enum(['general', 'exempt', 'simplified']).optional(), // 原則/免税/簡易
  simplifiedTaxCategory: z.enum(['1', '2', '3', '4', '5', '6']).optional(), // 簡易1-6
  roundingSettings: z.enum(['floor', 'round', 'ceil']).optional(), // 切り捨て/四捨五入/切り上げ
  isInvoiceRegistered: z.boolean().optional(),
  defaultPaymentMethod: z.enum(['cash', 'owner_loan', 'accounts_payable']).optional(),
  hasDepartmentManagement: z.boolean().optional(),
  
  // 報酬設定
  advisoryFee: z.number().min(0).default(0), // 顧問報酬
  bookkeepingFee: z.number().min(0).default(0), // 記帳代行
  settlementFee: z.number().min(0).default(0), // 決算報酬
  taxFilingFee: z.number().min(0).default(0), // 消費税申告報酬
  
  // Drive連携（既存）
  driveLinked: z.boolean(),
  sharedFolderId: z.string(),
  // ... 他のフォルダID
  
  // その他既存フィールド
  taxFilingType: z.enum(['blue', 'white']),
  // ...
});
```

---

### **2. ClientFormSchema（フォーム用）**

```typescript
export const ClientFormSchema = ClientSchema.extend({
  // 自動算出フィールドを追加
  monthlyTotalFee: z.number().optional(), // 月次報酬合計
  annualTotalFee: z.number().optional(), // 年間総報酬
});

// フォーム送信時の算出ロジック
export function calculateFees(form: ClientForm): ClientForm {
  return {
    ...form,
    monthlyTotalFee: form.advisoryFee + form.bookkeepingFee,
    annualTotalFee: 
      form.advisoryFee * 12 + 
      form.bookkeepingFee * 12 + 
      form.settlementFee + 
      form.taxFilingFee,
  };
}
```

---

### **3. ClientUiSchema（一覧表示用）**

```typescript
export const ClientUiSchema = z.object({
  clientCode: z.string(),
  companyName: z.string(),
  staffName: z.string(),
  fiscalMonth: z.number(),
  
  // 表示ラベル
  statusLabel: z.string(), // "稼働中"/"停止中"
  fiscalMonthLabel: z.string(), // "3月決算"
  softwareLabel: z.string(), // "MF"/"freee"等
  taxInfoLabel: z.string(), // "税込 / 発生"
  
  // Drive連携
  driveLinked: z.boolean(),
  driveLinks: z.object({
    storage: z.string(),
    // ...
  }),
  
  // 連絡
  contact: z.object({
    type: z.enum(['email', 'chatwork', 'none']),
    value: z.string(),
  }),
});
```

---

## バリデーションルール

### **3コード（clientCode）**

```typescript
const clientCodeValidator = z.string()
  .length(3, '3文字で入力してください')
  .regex(/^[A-Z]{3}$/, '大文字アルファベット3文字で入力してください')
  .refine(
    async (code) => !await isClientCodeDuplicate(code),
    '既に登録されているコードです'
  );
```

### **報酬フィールド**

```typescript
const feeValidator = z.number()
  .min(0, '0以上の数値を入力してください')
  .int('整数で入力してください');
```

---

## 次のステップ

1. **スキーマ実装**（今日）
   - [ ] `ClientSchema`を完全版に更新
   - [ ] `ClientFormSchema`作成
   - [ ] `ClientUiSchema`作成

2. **Mapper作成**（明日）
   - [ ] Firestore → UI
   - [ ] Form → Firestore

3. **UI実装**（明後日）
   - [ ] フォームコンポーネント
   - [ ] 一覧画面

---

**この設計で進めて良いですか？**

# Phase 5実装開始の方針・調査結果

**調査日**: 2026-02-14  
**目的**: Phase 5モック実装開始前の環境確認と実装方針明確化

---

## ✅ 環境調査結果

### **1. src/mocksディレクトリ構造**

**現状**:
```
src/mocks/
├── ledger_sample.csv（573バイト）
├── mockJobUi.ts（6,196バイト）
├── mockJobUi.ts.SafetyPoint_Step4397（4,930バイト）
└── test_scenarios.ts（7,786バイト）
```

**結論**: 
- ✅ `src/mocks/`ディレクトリは存在
- ❌ サブディレクトリ（types/, data/, components/）は未作成
- 📝 既存ファイルはPhase 0-4関連

---

### **2. Routerパターン**

**既存パターン**（`src/router/index.ts`）:
```typescript
{
  path: '/screen_b_mock',
  name: 'ScreenB_Restore_Mock',
  component: ScreenB_Restore_Mock  // ← 直接import
},
{
  path: '/test-ocr',
  name: 'TestOCR',
  component: () => import('@/views/TestOCRPage.vue'),  // ← lazy loading
  meta: { requiresAuth: true }
}
```

**Phase 5で使用するパターン**:
```typescript
{
  path: '/mock/journal-list',
  name: 'JournalListMock',
  component: () => import('@/mocks/components/JournalListLevel3Mock.vue'),
  meta: { requiresAuth: false }  // モック専用、認証不要
}
```

---

### **3. TailwindCSS導入状況**

**確認結果**:
- ✅ TailwindCSS 4.1.18導入済み
- ✅ `postcss.config.js`に設定あり
- ✅ `src/assets/main.css`でimport

**使用可能なクラス**: 全てのTailwindCSS 4.1クラスが利用可能

---

### **4. 既存Vueコンポーネントパターン**

**既存コンポーネント数**: 43件（.vueファイル）

**代表的なパターン**:
- `components/ScreenB_JournalTable.vue`（仕訳テーブル表示）
- `components/ScreenE_JournalEntry.vue`（仕訳詳細）
- `components/UI_StatusBadge.vue`（ステータス表示）

**参考にすべきコンポーネント**: `ScreenB_JournalTable.vue`（テーブル表示パターン）

---

### **5. 30件テストデータ設計書**

**調査結果**:
- ❌ `phase5_level3_test_fixture_30cases_260214.md`は未作成
- 📝 docs/genzai内に存在しない

**対応**: ステップ3.2b-2-2で作成時に、journal_v2_20260214.mdを参照して30件データを直接TypeScript化

---

## 📝 実装方針（4段階）

### **ステップ3.2b-2-1: モック専用型定義作成**（30分想定）

**作業内容**:
1. `src/mocks/types/`ディレクトリ作成
2. `journal_phase5_mock.type.ts`作成（50行）

**参照ドキュメント**:
- `docs/genzai/02_database_schema/journal/journal_v2_20260214.md`（完全スキーマ定義、602行）

**実装詳細**:
```typescript
// src/mocks/types/journal_phase5_mock.type.ts

export type JournalStatusPhase5 = 
  | 'pending'   // 通常
  | 'help'      // サポート依頼
  | 'soudan'    // 相談
  | 'kakunin'   // 確認待ち
  | 'exported'; // 出力済み

export type JournalLabelPhase5 =
  // 証憑種類（5個）
  | 'TRANSPORT' | 'RECEIPT' | 'INVOICE' | 'CREDIT_CARD' | 'BANK_STATEMENT'
  // ルール（2個）
  | 'RULE_APPLIED' | 'RULE_AVAILABLE'
  // インボイス（3個）
  | 'INVOICE_QUALIFIED' | 'INVOICE_NOT_QUALIFIED' | 'MULTI_TAX_RATE'
  // 事故フラグ（6個）
  | 'DEBIT_CREDIT_MISMATCH' | 'TAX_CALCULATION_ERROR' | 'DUPLICATE_SUSPECT'
  | 'DATE_ANOMALY' | 'AMOUNT_ANOMALY' | 'MISSING_RECEIPT'
  // OCR（2個）
  | 'OCR_LOW_CONFIDENCE' | 'OCR_FAILED'
  // その他（1個）
  | 'HAS_MEMO';

export interface JournalPhase5Mock {
  id: string;
  client_id: string;
  receipt_id: string | null;
  
  // status管理
  status: JournalStatusPhase5;
  status_updated_at: string;  // ISO 8601
  status_updated_by: string;
  
  // 基本タイムスタンプ
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
  
  // 未読/既読（背景色管理）
  is_read: boolean;
  read_at: string | null;
  
  // メモ機能
  memo: string | null;
  memo_author: string | null;
  memo_target: string | null;
  memo_created_at: string | null;
  
  // 出力管理
  exported_at: string | null;
  exported_by: string | null;
  export_exclude: boolean;
  export_exclude_reason: string | null;
  
  // ゴミ箱
  deleted_at: string | null;
  deleted_by: string | null;
  
  // ラベル（17種類、非排他的）
  labels: JournalLabelPhase5[];
  
  // 仕訳データ（UIモック用、簡略化）
  date: string;  // YYYY-MM-DD
  description: string;
  amount: number;
  debit_account: string;
  credit_account: string;
  debit_sub_account: string | null;
  credit_sub_account: string | null;
  tax_code: string | null;
  
  // ルール情報
  rule_name: string | null;
  rule_confidence: number | null;  // 0.0-1.0
  
  // インボイス情報
  invoice_number: string | null;
}
```

**完了条件**:
- ✅ TypeScriptコンパイルエラー0件
- ✅ 全17種類のlabels定義
- ✅ 全5種類のstatus定義

---

### **ステップ3.2b-2-2: 30件テストデータ作成**（2時間想定）

**作業内容**:
1. `src/mocks/data/`ディレクトリ作成
2. `journal_test_fixture_30cases.ts`作成（600行）

**参照ドキュメント**:
- `journal_v2_20260214.md`（スキーマ定義）
- `phase5_ui_design_strategy_260214.md`（UI設計方針）

**データ構成**:
- グリーン（正常）: 20件（行1-20）
- イエロー（要確認）: 7件（行21-27）
- レッド（緊急）: 3件（行28-30）

**実装例**:
```typescript
// src/mocks/data/journal_test_fixture_30cases.ts

import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type';

export const mockJournalsPhase5: JournalPhase5Mock[] = [
  // 行1: グリーン、pending、TRANSPORT + RULE_APPLIED + INVOICE_QUALIFIED
  {
    id: 'j-001',
    client_id: 'client-aaa',
    receipt_id: 'receipt-001',
    status: 'pending',
    status_updated_at: '2024-01-01T10:00:00Z',
    status_updated_by: 'user-001',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    is_read: true,
    read_at: '2024-01-01T10:00:00Z',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    exported_at: null,
    exported_by: null,
    export_exclude: false,
    export_exclude_reason: null,
    deleted_at: null,
    deleted_by: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    date: '2024-01-01',
    description: 'タクシー代（新宿→渋谷）',
    amount: 1200,
    debit_account: '旅費交通費',
    credit_account: '現金',
    debit_sub_account: null,
    credit_sub_account: null,
    tax_code: '課税仕入10%',
    rule_name: 'タクシー代→旅費交通費',
    rule_confidence: 0.95,
    invoice_number: 'INV-2024-001',
  },
  // 行2-30: ... （以下30件分）
];
```

**完了条件**:
- ✅ 30件すべてのデータ作成
- ✅ 全17種類のlabelsを使用
- ✅ 全5種類のstatusを使用

---

### **ステップ3.2b-2-3: Vueモックコンポーネント作成**（3時間想定）

**作業内容**:
1. `src/mocks/components/`ディレクトリ作成
2. `JournalListLevel3Mock.vue`作成（200行）

**参照コンポーネント**:
- `src/components/ScreenB_JournalTable.vue`（既存テーブル表示パターン）

**実装内容**:
- テーブル形式で30件表示
- TailwindCSSでスタイリング
- アイコン表示（5列）
- ホバー表示（ツールチップ）
- 背景色管理（is_read, status）

**完了条件**:
- ✅ 30件すべてが表示
- ✅ アイコン5列表示
- ✅ ホバー動作確認

---

### **ステップ3.2b-2-4: ローカル検証**（30分想定）

**作業内容**:
1. `src/router/index.ts`にルート追加
2. ブラウザで表示確認
3. スクリーンショット撮影

**ルート追加**:
```typescript
{
  path: '/mock/journal-list',
  name: 'JournalListMock',
  component: () => import('@/mocks/components/JournalListLevel3Mock.vue'),
  meta: { requiresAuth: false }
}
```

**検証手順**:
1. `npm run dev`起動（既に起動中の場合は不要）
2. ブラウザで`http://localhost:5173/#/mock/journal-list`を開く
3. 30件表示確認
4. アイコン・背景色確認
5. ホバー動作確認
6. スクリーンショット撮影（3-8枚）

---

## ❓ 不明点・要確認事項

### **1. 30件テストデータの詳細設計**

**状況**: `phase5_level3_test_fixture_30cases_260214.md`は未作成

**対応案**:
- A案: journal_v2_20260214.mdを参照し、TypeScript作成時に30件を直接定義
- B案: 先にmarkdown設計書を作成し、レビュー後にTypeScript化

**推奨**: A案（直接TypeScript化、効率的）

---

### **2. 複合仕訳の表示方法**

**不明点**: 複合仕訳（借方2行、貸方1行など）のデータ構造

**対応**: 簡略化し、description欄に「複合仕訳」と記載、詳細はUIモックで検証

---

### **3. アイコンの具体的な種類**

**不明点**: 🎓や🔵のEmoji実装方法

**対応**: Emojiを直接使用（HTML特殊文字不要）

---

## ✅ 実装開始の準備完了

**次のアクション**: ステップ3.2b-2-1（型定義作成）から実装開始

**最終更新**: 2026-02-14

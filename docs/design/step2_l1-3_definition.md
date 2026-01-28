<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION             -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- 
【型安全性ルール - AI必須遵守事項】

## ❌ 禁止事項（6項目）- NEVER DO THESE:
1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT

## ✅ 許可事項（3項目）- ALLOWED:
1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
2. unknown型の使用（型ガードと組み合わせて）
3. 必要最小限の型定義（Pick<T>, Omit<T>等）

## 📋 類型分類（9種）:
| 類型 | 今すぐ修正 | 将来Phase | 修正不要 |
|------|-----------|----------|---------|
| 1. Partial+フォールバック | ✅ | - | - |
| 2. any型（実装済み） | ✅ | - | - |
| 3. status未使用 | ✅ | - | - |
| 4. eslint-disable | - | - | ✅ |
| 5. Zod.strict()偽装 | ※1+2 | - | - |
| 6. Zodスキーマany型 | ✅ | - | - |
| 7. 型定義any型 | ✅ | - | - |
| 8. 全体any型濫用 | - | ✅ | - |
| 9. 型定義不整合 | ✅ | - | - |

詳細: complete_evidence_no_cover_up.md

## ⚠️ MANDATORY: このルールブロックの保持義務
THIS RULE BLOCK MUST REMAIN AT THE TOP OF THIS FILE AT ALL TIMES.
UNDER NO CIRCUMSTANCES SHALL ANY AI EDIT THIS FILE WITHOUT PRESERVING THIS BLOCK.
WHEN EDITING THIS FILE, YOU MUST:
1. NEVER remove this rule block
2. NEVER move this rule block from the top position
3. ALWAYS ensure this block is the first content in the file
4. IMMEDIATELY restore this block if it is accidentally removed

VIOLATION OF THIS REQUIREMENT IS A CRITICAL FAILURE.
このルールブロックをファイルの最上部から削除・移動することは、
型安全性破壊と同等の重大な違反行為である。
-->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

# Step 2: L1-3定義（Journal）- 完全版

**作成日**: 2026-01-23  
**所要時間**: 2-3時間  
**ステータス**: 準備完了 → 実装開始待ち

---

## 🎯 このステップの目的

**今やるべきこと**: **仕訳データのスキーマを確定させる**

**なぜ必要か**:
- Step 3（AI API実装）で「どんなデータ構造に変換するか」を決める必要がある
- Step 7（仕訳入力画面）で「何を表示するか」を決める必要がある
- スキーマが確定しないと、実装が進められない

**次のステップとの関係**:
```
Step 2: JournalEntry/JournalLine のスキーマを定義
   ↓ 「どんなデータ構造か」が確定
Step 3: Gemini Vision API へのプロンプトを設計
   ↓ 「OCR結果をどのスキーマに変換するか」が決まる
Step 4-7: UI実装
   ↓ 「確定したスキーマを画面に表示」
```

---

## 📊 データ構造の全体像

### 1対多の関係

```
JournalEntry（仕訳エントリ）
  ├─ id: "entry-001"
  ├─ date: "2026-01-23"
  ├─ description: "ABC Inc への支払い"
  ├─ totalAmount: 1100
  └─ lines: [                        ← 複合仕訳対応（配列）
      {
        lineId: "line-001",
        accountCode: "4000",
        accountName: "雑費",
        debit: 1100,
        credit: 0,
        taxAmountFinal: 100
      },
      {
        lineId: "line-002",
        accountCode: "1000",
        accountName: "現金",
        debit: 0,
        credit: 1100,
        taxAmountFinal: 0
      }
    ]
```

---

## 📋 JournalEntry（仕訳エントリ）- 19プロパティ

| # | プロパティ | 型 | 必須 | Phase | 説明 |
|---|-----------|----|----|-------|------|
| 1 | `id` | string (UUID) | ✅ | 1 | 仕訳エントリのUUID |
| 2 | `date` | string (YYYY-MM-DD) | ✅ | 1 | 取引日付 |
| 3 | `description` | string | ✅ | 1 | 摘要（全行共通） |
| 4 | `totalAmount` | number | ✅ | 1 | 合計金額（税込） |
| 5 | `lines` | JournalLine[] | ✅ | 1 | 仕訳明細行（最小2行） |
| 6 | `clientId` | string | ✅ | 1 | 顧問先ID（Client.id） |
| 7 | `clientCode` | string (3文字) | ✅ | 1 | 顧問先の3コード |
| 8 | `aiSourceType` | enum | ✅ | 1 | AI由来か（gemini/manual/hybrid） |
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

### SourceFile の構造

```typescript
{
  driveFileId: string;      // Google DriveのファイルID
  fileName: string;         // ファイル名
  fileType: enum;           // RECEIPT, INVOICE, BANK_CSV等
  firestoreDocId: string;   // Firestoreにコピーされた doc ID
  copiedAt: string;         // Firestoreにコピーした日時
}
```

---

## 📋 JournalLine（仕訳明細）- 16プロパティ

| # | プロパティ | 型 | 必須 | Phase | 説明 |
|---|-----------|----|----|-------|------|
| 1 | `lineId` | string (UUID) | ✅ | 1 | 行のUUID |
| 2 | `accountCode` | string | ✅ | 1 | 勘定科目コード（例: "4000"） |
| 3 | `accountName` | string | ✅ | 1 | 勘定科目名（例: "雑費"） |
| 4 | `subAccount` | string | ⭕ | 1 | 補助科目（例: "東京店舗"） |
| 5 | **`debit`** | **number** | ✅ | 1 | **借方金額** |
| 6 | **`credit`** | **number** | ✅ | 1 | **貸方金額** |
| 7 | `taxType` | enum | ✅ | 1 | 税率区分（none/consumption/reduced） |
| 8 | **`taxAmountFromDocument`** | **number** | ⭕ | 1 | **証憑に記載された税額** |
| 9 | `taxDocumentSource` | enum | ✅ | 1 | 証憑値の取得方法 |
| 10 | **`taxAmountCalculated`** | **number** | ✅ | 1 | **システム計算の税額** |
| 11 | `taxCalculationMethod` | enum | ✅ | 1 | 計算方法 |
| 12 | **`taxAmountFinal`** | **number** | ✅ | 1 | **最終確定税額（CSV出力用）** |
| 13 | `taxAmountSource` | enum | ✅ | 1 | 最終値の出所 |
| 14 | `taxDiscrepancy` | object | ⭕ | 1 | 税額ズレ検出結果 |
| 15 | `description` | string | ⭕ | 1 | 行ごとのコメント |
| 16 | `isAIGenerated` | boolean | ✅ | 1 | AI生成か |

### 税額の三重構造

```typescript
税額は以下の3つの値を持つ:

1️⃣ taxAmountFromDocument（証憑値）
   = 領収書に「33円」と書いてあった値
   
2️⃣ taxAmountCalculated（計算値）
   = システムが「1000 × 0.10 = 100円」と計算した値
   
3️⃣ taxAmountFinal（最終値）
   = 最終的にCSV出力する確定値
   = デフォルトは証憑値、ユーザーが修正可能
```

---

## 🎯 重要な設計決定（これまでの議論で確定）

### 1. 税額判定戦略：**戦略C採用** ✅

```
【原則】
デフォルト: OCR抽出値（記載値）を採用

【検証】
計算値とのズレを自動検出

【ユーザー判定】
- ズレなし / 1円以内 → ✅ OK（自動承認）
- 2-5円 → ⚠️ WARNING（確認推奨）
- 5円超 → ❌ ERROR（修正必須）

【理由】
- 領収書の原文を尊重（監査対応）
- AI精度を可視化（信頼度表示）
- ユーザーが最終判定（責任の所在）
```

---

### 2. UI表示方針（Streamed調査結果） ✅

```
【内部データ】
- 証憑記載の税額 ✅ 保持
- 計算上の税額 ✅ 保持
- 最終確定税額 ✅ 保持

【UI表示】
- 仕訳一覧: 税額 ❌ 非表示（情報量削減）
- ズレがある行: ⚠️ アラート表示
- 詳細モーダル: 税額 ✅ 表示（証憑値/計算値/差分）

【CSV/API出力】
- すべて ✅ 含める（taxAmountFinal）

【理由】
- UIでの情報過多を防ぐ
- 問題がある箇所だけ注意喚起
- 出力時には完全なデータを含める
```

---

### 3. ファイルタイプ：**2段階分類** ✅

```
【段階1: カテゴリ】（処理パイプライン決定）
- RECEIPT（領収書）
- INVOICE（請求書）
- BANK_CSV（通帳CSV）
- BANK_IMAGE（通帳画像）
- CREDIT_CSV（クレカ明細CSV）
- CREDIT_IMAGE（クレカ明細画像）
- OTHER（その他）

【段階2: サブタイプ】（Phase 2で拡張）
- RECEIPT_SHOP（小売店の領収書）
- RECEIPT_MEDICAL（医療機関の領収書）
- BANK_CSV_MIZUHO（みずほ銀行CSV）
  等

【理由】
- カテゴリでAIプロンプトを最適化
- サブタイプで詳細な処理を決定
```

---

### 4. 顧問先紐付け ✅

```
JournalEntry に以下を必須で追加:
  - clientId（Client.id への参照）
  - clientCode（3文字コード、表示用）

【理由】
- 仕訳がどの顧問先のものかを明確化
- Client データと連携
```

---

### 5. L1-3の実装単位 ✅

```
【実装単位】
エンティティごと:
  - Receipt L1-3（既存）
  - Client L1-3（既存）
  - Job L1-3（既存）
  - Journal L1-3（今回作成） ← Step 2で実装

【UIとの関係】
UIは複数のL1-3を組み合わせて使用:
  - 仕訳入力画面: Journal L1-3 + Client L1-3
  - 顧問先管理画面: Client L1-3のみ
```

---

### 6. Phase 1 で実装しないもの ❌

```
以下はPhase 2で実装:
- approvedBy/approvedAt（複数承認者）
- lastExport（出力履歴管理）
- aiConfidenceBreakdown（項目別AI信頼度）
- approvalWorkflow（承認フロー）
- State Machine（状態遷移管理）
- Evidence ID（証跡ID）

【理由】
Phase 1は「最小限の機能」に集中
```

---

## 🎨 UIで実現すべき内容（Step 7で実装）

### なぜUIの仕様をStep 2で決めるのか

```
Step 2: スキーマ定義 ← 「何を保存するか」を決める
   ↓
Step 7: UI実装 ← 「何を表示するか」を決める

UIの仕様は「スキーマ」に依存するため、
Step 2の段階で「UIで何を表示するか」を決定する必要がある
```

---

### 仕訳一覧画面

**表示項目**:
```
┌─────────────────────────────────────────┐
│ 日付 | 摘要 | 勘定科目 | 金額 | 警告 | 確認 │
├─────────────────────────────────────────┤
│2025-01-23│ABC支払│現金│1100│     │✅   │
│2025-01-23│ABC支払│雑費│1000│⚠️  │     │ ← ズレあり
├─────────────────────────────────────────┤
```

**設計のポイント**:
- ✅ 税額は**非表示**（情報量削減）
- ⚠️ ズレがある行のみ**アラート表示**
- ✅ 確認済みフラグ（`isConfirmed`）

**理由（Streamed調査から）**:
```
Streamedの実装:
- 仕訳一覧: 税額を表示しない（情報過多を防ぐ）
- ズレ検出: ⚠️ マークで注意喚起
- 詳細確認: モーダルで税額を表示

→ この方式を採用
```

---

### 詳細モーダル（税額確認画面）

**表示項目**:
```
┌────────────────────────────────────────────┐
│ 【仕訳詳細 - 修正画面】                   │
├────────────────────────────────────────────┤
│ 【左】証憑画像                            │
│ ┌──────────────┐                         │
│ │              │                         │
│ │ ABC Inc      │                         │
│ │ 消費税: 33円 │ ← 証憑に記載              │
│ │ 合計: 1100   │                         │
│ │              │                         │
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
- ✅ 証憑画像と仕訳データの**並列表示**
- ✅ 税額の三重構造を**可視化**（証憑値/計算値/最終値）
- ✅ ユーザーが**最終判定**（戦略C）

**理由（Streamed調査から）**:
```
Streamedの最強の特徴:
「仕訳データ」と「証憑画像」を同じ画面に表示

ユーザーの判定:
「画像に『33円』と書いてあるから、仕訳の『33円』で正解」
→ [確認] をクリック

→ この方式を採用
```

---

### 税額ズレ検出UI

**ズレの表示方法**:
```
【ケース1: 完全一致】
✅ OK - 税額が正確です

【ケース2: 1円誤差】
✅ OK - 1円の誤差は端数処理と判定されます

【ケース3: 2-5円誤差】
⚠️ 確認推奨
記載値(95円) と計算値(100円) に5円の誤差があります。
[修正を適用 (100円)] [現在の値を保持]

【ケース4: 5円超】
❌ 修正必須
記載値(80円) と計算値(100円) に20円の大きな誤差があります。
正しい税額を入力: [___] 円 [修正を確定]
```

**実装ポイント**:
- ✅ ズレの重要度で**色分け**（OK=緑、WARNING=黄、ERROR=赤）
- ✅ 修正方法を**明示**（ボタンまたはフォーム）
- ✅ TaxResolutionService の判定結果を**そのまま表示**

---

### UIで表示しないもの（内部データのみ）

```
以下は「内部では保持」するが「UIでは非表示」:
- taxAmountCalculated（計算値）← 詳細モーダルでのみ表示
- taxCalculationMethod（計算方法）← 開発者用
- taxDocumentSource（証憑値の取得方法）← 開発者用
- taxAmountSource（最終値の出所）← 開発者用

理由:
- 一般ユーザーには不要な情報
- 情報過多を防ぐ
- トラブル時のみ開発者が確認
```

---

## 📊 Phase 2延期の詳細な理由と経緯

### なぜ Phase 2に延期したのか

#### 1. approvedBy/approvedAt（承認ワークフロー）

**Phase 1での状況**:
```
- ユーザー数: 1名（個人開発）
- 作成者 = 確認者 = 同一人物
- 複数承認者は不要
```

**Phase 2での必要性**:
```
- ユーザー数: 複数名（税理士 + スタッフ）
- 作成者 ≠ 確認者
- 承認フローが必要
  例: スタッフ作成 → 税理士承認 → CSV出力
```

**経緯**:
```
議論（2026-01-23 17:12）:
  問: approvedBy/approvedAt は Phase 1で必要では？
  答: Phase 1では createdBy で代用可能
      → Phase 2で複数承認者対応
```

---

#### 2. lastExport / exportHistory（出力履歴管理）

**Phase 1での状況**:
```
- 出力先: 1つ（MF または Freee または弥生）
- 出力回数: 初回のみ
- 履歴管理: 不要
```

**Phase 2での必要性**:
```
- 出力先: 複数（MF + Freee の両方等）
- 出力回数: 複数回（再出力の可能性）
- 履歴管理: 必要
  - 「どこに出力したか」
  - 「いつ出力したか」
  - 「成功したか、失敗したか」
```

**経緯**:
```
議論（2026-01-23 17:12）:
  問: lastExport は Phase 1で必要では？
  答: Phase 1では「全て未出力」なので管理不要
      → Phase 2で複数回出力に対応
```

---

#### 3. aiConfidenceBreakdown（項目別AI信頼度）

**Phase 1での状況**:
```
- AI信頼度: 全体で 0.85（85%）と表示
- 「この仕訳は信頼できるか」が分かればOK
```

**Phase 2での必要性**:
```
- 項目別の信頼度:
  - dateConfidence: 0.98（日付は正確）
  - amountConfidence: 0.92（金額は正確）
  - accountConfidence: 0.65（勘定科目が不正確）← 修正すべき

- 「どこを直すべきか」が分かる
```

**経緯**:
```
議論（2026-01-23 17:12）:
  問: aiConfidenceBreakdown は Phase 1で必要では？
  答: Phase 1では「全体の信頼度」で十分
      → Phase 2で詳細分析（AI精度向上のため）
```

---

#### 4. invoiceInfo（インボイス詳細情報）

**Phase 1での実装**:
```
最小限の情報のみ:
  - hasQualifiedInvoice: 適格請求書か（true/false）
  - registrationNumber: 登録番号（オプション）
```

**Phase 2での拡張**:
```
詳細情報:
  - registrationVerified: 国税庁DBで検証済みか
  - taxControlRate: 控除率（100% or 80%）
  - isFromTaxExemptBusiness: 免税事業者からの仕入か
  - specialTaxTreatment: 特殊な税務扱い

用途:
  - 消費税申告書の自動生成
  - インボイス制度への完全対応
```

**経緯**:
```
議論（2026-01-23 16:48）:
  問: invoiceInfo は Phase 1で必須では？
  答: 基本情報（登録番号の有無）のみ Phase 1
      詳細な消費税申告書対応は Phase 2
```

---

### Phase 1 vs Phase 2の境界線（設計思想）

```
【Phase 1の目的】
「最小限の機能で動くものを作る」
  ↓
- 1名で使える
- ログインして仕訳作成してCSV出力
- 基本的な税額検証

【Phase 2の目的】
「本番運用に必要な機能を追加」
  ↓
- 複数名で使える
- 承認ワークフロー
- 複数会計ソフト対応
- 詳細な税制対応

【境界線】
「個人開発で検証」→「本番運用」
```

---

## 📌 重要な経緯の記録

### Streamed調査の発見（2026-01-23）

```
調査内容:
  競合サービス「Streamed」のUI実装を調査

主な発見:
1️⃣ 税額は「仕訳一覧では非表示」
   → 情報過多を防ぐ

2️⃣ ズレがある行のみ「⚠️ アラート」
   → 問題箇所だけ注意喚起

3️⃣ 詳細モーダルで「証憑画像 + 仕訳データ」を並列表示
   → ユーザーが見比べて判定

4️⃣ CSV出力時は「税額を含める」
   → 会計ソフト側の「勝手な再計算」を防ぐ

結論:
  → この方式を採用
```

---

### 税額判定戦略の決定（2026-01-23）

```
議論された3つの戦略:

【戦略A】: 記載値を絶対優先
  - メリット: シンプル
  - デメリット: AI誤りを見逃す

【戦略B】: 計算値を絶対優先
  - メリット: 一貫性が保証
  - デメリット: 領収書の原文を無視

【戦略C】: ズレを検出して、ユーザーに判断させる ← 採用
  - メリット:
    - 領収書の原文を尊重
    - AI精度を可視化
    - ユーザーが最終判定
  - デメリット: 実装が複雑

結論:
  → 戦略C を採用
```

---

**これらの経緯をすべて `step2_l1-3_definition.md` に追記しました。**



## 🔧 実装ファイル一覧

### 1. `src/features/journal/JournalEntrySchema.ts`

**実装内容**:
```typescript
// 列挙型
export const AISourceTypeEnum = z.enum(['gemini', 'manual', 'hybrid']);
export const TaxTypeEnum = z.enum(['none', 'consumption', 'reduced']);
export const TaxAmountSourceEnum = z.enum(['FROM_DOCUMENT', 'CALCULATED', 'USER_INPUT']);
export const TaxDiscrepancySeverityEnum = z.enum(['OK', 'WARNING', 'ERROR']);
export const FileTypeEnum = z.enum([
  'RECEIPT', 'INVOICE', 'BANK_CSV', 'BANK_IMAGE',
  'CREDIT_CSV', 'CREDIT_IMAGE', 'OTHER'
]);

// JournalLine（16プロパティ）
export const JournalLineSchema = z.object({
  lineId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  subAccount: z.string().optional(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  taxType: TaxTypeEnum,
  taxAmountFromDocument: z.number().min(0).optional(),
  taxDocumentSource: z.enum(['OCR_EXTRACTED', 'MANUAL_INPUT', 'NOT_PRESENT']),
  taxAmountCalculated: z.number().min(0),
  taxCalculationMethod: z.enum(['SIMPLE_RATE', 'NET_AMOUNT_REVERSE', 'CUSTOM']),
  taxAmountFinal: z.number().min(0),
  taxAmountSource: TaxAmountSourceEnum,
  taxDiscrepancy: z.object({
    hasDiscrepancy: z.boolean(),
    differenceAmount: z.number(),
    severity: TaxDiscrepancySeverityEnum,
    reason: z.string().optional()
  }).optional(),
  description: z.string().optional(),
  isAIGenerated: z.boolean()
});

// JournalEntry（19プロパティ）
export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string(),
  totalAmount: z.number().min(0),
  lines: z.array(JournalLineSchema).min(2),
  clientId: z.string(),
  clientCode: z.string().regex(/^[A-Z]{3}$/),
  aiSourceType: AISourceTypeEnum,
  aiConfidence: z.number().min(0).max(1),
  sourceFiles: z.array(z.object({
    driveFileId: z.string(),
    fileName: z.string(),
    fileType: FileTypeEnum,
    firestoreDocId: z.string(),
    copiedAt: z.string()
  })),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),
  isConfirmed: z.boolean().default(false),
  hasQualifiedInvoice: z.boolean().optional()
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalLine = z.infer<typeof JournalLineSchema>;
```

---

### 2. `src/features/journal/JournalSemanticGuard.ts`

**実装内容**:
```typescript
export class JournalSemanticGuard {
  
  /**
   * 二重記帳の検証
   * 借方合計 = 貸方合計
   */
  static validateDoubleEntry(entry: JournalEntry): void {
    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);
    
    if (totalDebit !== totalCredit) {
      throw new Error(
        `二重記帳が成立していません。借方合計: ${totalDebit}, 貸方合計: ${totalCredit}`
      );
    }
  }
  
  /**
   * 各行の debit/credit 相互排他性チェック
   */
  static validateLineMutualExclusivity(entry: JournalEntry): void {
    for (const line of entry.lines) {
      if (line.debit !== 0 && line.credit !== 0) {
        throw new Error(
          `行 "${line.accountName}": debit と credit は同時に値を持てません`
        );
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new Error(
          `行 "${line.accountName}": debit または credit のいずれかに値が必要です`
        );
      }
    }
  }
  
  /**
   * 税額の最終値チェック
   */
  static validateTaxAmountFinal(entry: JournalEntry): void {
    for (const line of entry.lines) {
      if (line.taxType !== 'none' && line.taxAmountFinal === undefined) {
        throw new Error(
          `行 "${line.accountName}": taxAmountFinal が確定していません`
        );
      }
    }
  }
  
  /**
   * 総合検証
   */
  static validate(entry: JournalEntry): void {
    this.validateLineMutualExclusivity(entry);
    this.validateDoubleEntry(entry);
    this.validateTaxAmountFinal(entry);
  }
}
```

---

### 3. `src/features/journal/services/TaxResolutionService.ts`

**実装内容**:
```typescript
export class TaxResolutionService {
  
  /**
   * OCR税額 vs 計算値から「採用する税額」を決定
   * 
   * 判定ルール:
   * - ズレなし → OK
   * - 1円以内 → OK（端数処理）
   * - 2-5円 → WARNING（確認推奨）
   * - 5円超 → ERROR（修正必須）
   */
  static resolveTaxAmount(
    ocrResult: {
      totalAmount: number;
      taxAmount: number;
    },
    taxType: 'consumption' | 'reduced'
  ): {
    adoptedTaxAmount: number;
    netAmount: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    warnings: string[];
    userAction: 'OK' | 'REVIEW' | 'MUST_FIX';
    suggestion?: {
      calculatedTaxAmount: number;
      reason: string;
    };
  } {
    
    const taxRate = taxType === 'consumption' ? 0.10 : 0.08;
    const netAmount = ocrResult.totalAmount - ocrResult.taxAmount;
    const calculatedTaxAmount = Math.round(netAmount * taxRate);
    const discrepancy = Math.abs(ocrResult.taxAmount - calculatedTaxAmount);
    
    const warnings: string[] = [];
    let userAction: 'OK' | 'REVIEW' | 'MUST_FIX' = 'OK';
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    
    if (discrepancy === 0) {
      warnings.push('記載値と計算値が一致しています');
    } else if (discrepancy === 1) {
      warnings.push('1円の誤差は端数処理と判定されます');
    } else if (discrepancy <= 5) {
      warnings.push(`記載値と計算値に${discrepancy}円の誤差があります。確認をお勧めします。`);
      userAction = 'REVIEW';
      confidence = 'MEDIUM';
    } else {
      warnings.push(`記載値と計算値に${discrepancy}円の大きな誤差があります。修正が必要です。`);
      userAction = 'MUST_FIX';
      confidence = 'LOW';
    }
    
    return {
      adoptedTaxAmount: ocrResult.taxAmount,
      netAmount,
      confidence,
      warnings,
      userAction,
      suggestion: discrepancy > 0 ? {
        calculatedTaxAmount,
        reason: `計算による期待値は${calculatedTaxAmount}円です。${discrepancy}円の差分があります。`
      } : undefined
    };
  }
}
```

---

### 4. `src/features/journal/index.ts`

**実装内容**:
```typescript
// スキーマのエクスポート
export {
  JournalEntrySchema,
  JournalLineSchema,
  AISourceTypeEnum,
  TaxTypeEnum,
  TaxAmountSourceEnum,
  FileTypeEnum
} from './JournalEntrySchema';

// 型のエクスポート
export type {
  JournalEntry,
  JournalLine
} from './JournalEntrySchema';

// ビジネスルールのエクスポート
export { JournalSemanticGuard } from './JournalSemanticGuard';

// ユーティリティ関数
export { TaxResolutionService } from './services/TaxResolutionService';
```

---

## 🧪 テストケース

### 単一行仕訳（税額あり）

```typescript
const simpleEntry: JournalEntry = {
  id: 'entry-001',
  date: '2026-01-23',
  description: 'ABC Inc への支払い',
  totalAmount: 1100,
  lines: [
    {
      lineId: 'line-001',
      accountCode: '4000',
      accountName: '雑費',
      debit: 1100,
      credit: 0,
      taxType: 'consumption',
      taxAmountFromDocument: 100,
      taxDocumentSource: 'OCR_EXTRACTED',
      taxAmountCalculated: 100,
      taxCalculationMethod: 'NET_AMOUNT_REVERSE',
      taxAmountFinal: 100,
      taxAmountSource: 'FROM_DOCUMENT',
      isAIGenerated: true
    },
    {
      lineId: 'line-002',
      accountCode: '1000',
      accountName: '現金',
      debit: 0,
      credit: 1100,
      taxType: 'none',
      taxAmountCalculated: 0,
      taxCalculationMethod: 'SIMPLE_RATE',
      taxAmountFinal: 0,
      taxAmountSource: 'CALCULATED',
      isAIGenerated: true
    }
  ],
  // ... その他のフィールド
};

// 検証
JournalSemanticGuard.validate(simpleEntry); // → OK
```

---

### 複合仕訳（3行以上）

```typescript
const complexEntry: JournalEntry = {
  id: 'entry-002',
  date: '2026-01-23',
  description: '家賃（事業用40% / プライベート60%）',
  totalAmount: 100000,
  lines: [
    {
      lineId: 'line-001',
      accountCode: '4000',
      accountName: '地代家賃',
      debit: 40000,
      credit: 0,
      taxType: 'none',
      taxAmountCalculated: 0,
      taxCalculationMethod: 'SIMPLE_RATE',
      taxAmountFinal: 0,
      taxAmountSource: 'CALCULATED',
      description: '事業用（40%）',
      isAIGenerated: false
    },
    {
      lineId: 'line-002',
      accountCode: '7000',
      accountName: '事業主貸',
      debit: 60000,
      credit: 0,
      taxType: 'none',
      taxAmountCalculated: 0,
      taxCalculationMethod: 'SIMPLE_RATE',
      taxAmountFinal: 0,
      taxAmountSource: 'CALCULATED',
      description: 'プライベート（60%）',
      isAIGenerated: false
    },
    {
      lineId: 'line-003',
      accountCode: '1000',
      accountName: '普通預金',
      debit: 0,
      credit: 100000,
      taxType: 'none',
      taxAmountCalculated: 0,
      taxCalculationMethod: 'SIMPLE_RATE',
      taxAmountFinal: 0,
      taxAmountSource: 'CALCULATED',
      isAIGenerated: false
    }
  ],
  // ... その他のフィールド
};

// 検証
JournalSemanticGuard.validate(complexEntry); // → OK
```

---

### 税額ズレ検出

```typescript
// 完全一致
const result1 = TaxResolutionService.resolveTaxAmount(
  { totalAmount: 1100, taxAmount: 100 },
  'consumption'
);
// → { userAction: 'OK', confidence: 'HIGH' }

// 1円誤差（端数処理）
const result2 = TaxResolutionService.resolveTaxAmount(
  { totalAmount: 1100, taxAmount: 99 },
  'consumption'
);
// → { userAction: 'OK', confidence: 'HIGH' }

// 2-5円誤差（確認推奨）
const result3 = TaxResolutionService.resolveTaxAmount(
  { totalAmount: 1100, taxAmount: 95 },
  'consumption'
);
// → { userAction: 'REVIEW', confidence: 'MEDIUM' }

// 5円超（修正必須）
const result4 = TaxResolutionService.resolveTaxAmount(
  { totalAmount: 1100, taxAmount: 80 },
  'consumption'
);
// → { userAction: 'MUST_FIX', confidence: 'LOW' }
```

---

### 二重記帳検証

```typescript
// 正常な仕訳
const validEntry: JournalEntry = {
  // ... 省略
  lines: [
    { debit: 1000, credit: 0 },  // 借方 1000
    { debit: 0, credit: 1000 }   // 貸方 1000
  ]
};
JournalSemanticGuard.validate(validEntry); // → OK

// 不正な仕訳（借方 ≠ 貸方）
const invalidEntry: JournalEntry = {
  // ... 省略
  lines: [
    { debit: 1000, credit: 0 },  // 借方 1000
    { debit: 0, credit: 900 }    // 貸方 900（不一致）
  ]
};
JournalSemanticGuard.validate(invalidEntry); // → Error: 二重記帳が成立していません
```

---

## ✅ Step 2 完了チェックリスト

- [ ] `src/features/journal/JournalEntrySchema.ts` 作成
  - [ ] 列挙型（5種類）定義
  - [ ] JournalLineSchema（16プロパティ）定義
  - [ ] JournalEntrySchema（19プロパティ）定義
  
- [ ] `src/features/journal/JournalSemanticGuard.ts` 作成
  - [ ] validateDoubleEntry() 実装
  - [ ] validateLineMutualExclusivity() 実装
  - [ ] validateTaxAmountFinal() 実装
  - [ ] validate() 実装
  
- [ ] `src/features/journal/services/TaxResolutionService.ts` 作成
  - [ ] resolveTaxAmount() 実装
  
- [ ] `src/features/journal/index.ts` 作成
  - [ ] エクスポートの整理
  
- [ ] テストケース実装
  - [ ] 単一行仕訳（税額あり）
  - [ ] 単一行仕訳（税額なし）
  - [ ] 複合仕訳（3行以上）
  - [ ] 消費税仕訳
  - [ ] 事業用/プライベート混在
  - [ ] 税額ズレ検出（完全一致、1円誤差、2-5円誤差、5円超）
  - [ ] 二重記帳検証

---

## 📌 次のステップ（Step 3）

**Step 3: AI API実装**

**実施内容**:
- Gemini Vision API へのプロンプト設計
- OCR結果を JournalEntry に変換
- 勘定科目の自動推測ロジック
- テスト

**Step 2 との関係**:
```
Step 2で確定したスキーマ
   ↓
Step 3でGemini Vision APIに
「このスキーマ形式でJSONを返して」と指示
   ↓
OCR結果が JournalEntry 形式で返ってくる
```

---

**Step 2の実装を開始してよろしいですか？** 🎯

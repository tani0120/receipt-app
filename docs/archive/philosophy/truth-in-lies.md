# 嘘の中の真実：重要な哲学・UI・ロジック抽出

**作成日**: 2026-01-16  
**目的**: AIが「実装完了」と嘘をついた時期の議論から、真実（哲学・UI・ロジック）を抽出

---

## 前提

**嘘**: 2026-01-12、AIが「Phase 5完了」「型安全確保完了」と報告  
**真実**: 実装は完了していなかった  
**しかし**: 議論の中で定義した哲学・UI・ロジックは重要

---

## 抽出した「真実」の分類

### **カテゴリ1: データモデル定義（最重要）**

#### **1-1. SCHEMA_MASTER_LIST.md（ROI計算用データモデル）**

**日付**: 2026-01-12  
**状態**: 嘘の時期だが、内容は真実

**重要な定義**:

```typescript
// Staff（担当者） - 公式定義が存在しない（致命的）
StaffSchema = {
  id: string,
  name: string,
  chargeRate: number,           // チャージレート（円/時）
  annualCompensation: number,   // 年間報酬（円）
  role: enum,                   // Admin/Worker/Viewer
  teams: string[],              // 所属チーム
}

// usage_logs（処理履歴） - 5次元分析の基盤
UsageLogsSchema = {
  staffId: string,
  clientId: string,
  jobId: string,
  timestamp: Timestamp,
  action: string,               // 何を処理したか
  duration: number,             // 処理時間（分）
}

// Client（顧問先） - ROI計算用フィールド
ClientSchema += {
  expectedJournalCount: number, // 想定仕訳数（件/月）
  contractAmount: number,       // 月額顧問料（円）
  systemUsageStats: object,     // AI利用頻度統計
}

// Job（業務・仕訳） - 時間計測フィールド
JobSchema += {
  systemExternalTime: number,   // システム外稼働時間（分）
  manualWorkTime: number,       // 画面操作時間（分）
  complexityScore: number,      // AI難易度スコア
}
```

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須

---

#### **1-2. ScreenA-data-contract.md（顧問先登録データモデル）**

**日付**: 2026-01-15（嘘の後、正しい議論）  
**状態**: 真実

**重要な定義**:

```typescript
// 報酬設定フィールド
ClientSchema += {
  advisoryFee: number,         // 顧問報酬（月額）
  bookkeepingFee: number,      // 記帳代行（月額）
  settlementFee: number,       // 決算報酬（年次）
  taxFilingFee: number,        // 消費税申告報酬（年次）
  
  // 自動算出フィールド
  monthlyTotalFee: number,     // 月次報酬合計
  annualTotalFee: number,      // 年間総報酬
}

// 計算式
monthlyTotalFee = advisoryFee + bookkeepingFee
annualTotalFee = advisoryFee×12 + bookkeepingFee×12 + settlementFee + taxFilingFee
```

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須

---

#### **1-3. Q3-staff-master.md（担当者マスタ）**

**日付**: 2026-01-15（嘘の後、正しい議論）  
**状態**: 真実

**重要な定義**:

```typescript
// StaffSchema（推奨：選択肢2）
StaffSchema = {
  id: string,
  name: string,
  email?: string,
  isActive: boolean,
  createdAt: Timestamp,
}

// UI設計
- ドロップダウン + Firestoreマスタ
- typo防止、表記統一、集計可能
```

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須

---

### **カテゴリ1-2: src/features/の実装（ADR-001/002の実例）**

#### **ClientUiSchema.ts（Week 3実装）**

**場所**: src/features/client-management/schemas/ClientUiSchema.ts  
**状態**: ADR-001/002に準拠した正しい実装

**重要な哲学**:

```typescript
/**
 * ClientUiSchema - Screen A UI表示用スキーマ
 * Week 3: 型安全なUI実装のための完全なスキーマ定義
 *
 * 原則：
 * - 全フィールド必須（no optional）
 * - readonly想定（UIで表示のみ）
 * - ラベル等の表示用フィールドを含む
 */
```

**重要な実装**:

```typescript
// 報酬設定（Week 3新規）
advisoryFee: z.number(),          // 顧問報酬（月額）
bookkeepingFee: z.number(),       // 記帳代行（月額）
settlementFee: z.number(),        // 決算報酬（年次）
taxFilingFee: z.number(),         // 消費税申告報酬（年次）

// 自動算出フィールド（Week 3新規）
monthlyTotalFee: z.number(),      // 月次報酬合計
annualTotalFee: z.number(),       // 年間総報酬
```

**哲学**:
- **全フィールド必須（no optional）**
- UIスキーマには表示用ラベルを含む（typeLabel, statusLabel等）

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（実装例として）

---

#### **ClientFormSchema.ts（Week 3実装）**

**場所**: src/features/client-management/schemas/ClientFormSchema.ts  
**状態**: ADR-001/002に準拠した正しい実装

**重要な哲学**:

```typescript
/**
 * ClientFormSchema - Screen A フォーム入力用スキーマ
 * Week 3: 型安全なフォーム実装のためのスキーマ
 *
 * 原則：
 * - 入力可能なフィールドのみ定義
 * - バリデーションルールを含む
 * - 自動算出フィールドは含まない（UIで算出）
 */
```

**重要なバリデーション**:

```typescript
// 3コードバリデーション
clientCode: z.string()
    .length(3, '3文字で入力してください')
    .regex(/^[A-Z]{3}$/, '大文字アルファベット3文字で入力してください'),

// 報酬設定バリデーション
advisoryFee: z.number().min(0, '0以上の数値を入力してください').default(0),
bookkeepingFee: z.number().min(0, '0以上の数値を入力してください').default(0),
```

**哲学**:
- フォームスキーマには自動算出フィールドは含まない
- バリデーションルールをZodで定義

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（実装例として）

---

#### **ClientToUiMapper.ts（Week 3実装）**

**場所**: src/features/client-management/mappers/ClientToUiMapper.ts  
**状態**: ADR-001/002に準拠した正しい実装（確認必要）

**重要な哲学**:
- unknown入力を受け、完全充填したUI型を返す
- Mapperは例外を投げない
- 全ての変換ロジックをMapperに集約

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（Mapper実装例として）

---

### **カテゴリ2: 機能計画・UseCase（重要）**

#### **2-1. DECISION_LOG_20260114.md（Phase 6計画）**

**日付**: 2026-01-14（嘘の直後）  
**状態**: 真実（今後実装すべき機能）

**重要な定義**:

**昇格16件のUseCase**:
1. 見込管理UI（新規実装）
2. Batch API処理（全処理への適用拡大）
3. スマホ対応（レスポンシブ化）
4. 仕訳時タスク作成（タスク管理）
5. 学習・知識プロンプト（完全実装済み）
6. 人間判断必須フロー（完全実装済み）
7. CSV出力（完全実装済み）
8. 顧問先登録・編集（完全実装済み）
9. Gmail/独自ドメイン認証（部分実装）
10. 管理ボード刷新（新機能追加UI）
11. 画像+仕訳候補表示（複合仕訳対応）
12. Geminiプラン選択UI（完全化）
13. 固定ルール自動提示（UI完全化）
14. 重複・期間外検知（提示UI強化）
15. 仕訳外画像移動（フォルダ移動機能）
16. AI差分分析（差分分析ロジック）

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（今後実装すべき機能として記録）

---

#### **2-2. PHASE6_JUDGMENT_USECASES.md（判断UseCase設計）**

**日付**: 2026-01-13（嘘の直後）  
**状態**: 真実（設計思想）

**重要な哲学**:

```markdown
判断分類の軸:
1. 判断主体（人、AI、ルール、システム）
2. 判断の種類（承認、推論、最適化、優先度付け、提案生成、集計解釈）
3. 出力の性質（状態変更、提案、スコア、理由、候補集合、並び順）

Phase 6の原則:
- 判断を隠さない
- confidence / reasons / alternatives は必須
- 出力は「決定」ではなく「提案」
- 露出が正義
```

**SYSTEM_PHILOSOPHY.mdへの反映**: オプション（Phase 6で追加）

---

### **カテゴリ3: 開発規範・運用ルール（最重要）**

#### **3-1. dev_guide.md（Anti-Rebellion Protocol）**

**日付**: 不明（嘘以前から存在）  
**状態**: 真実（哲学）

**重要な哲学**:

```markdown
Anti-Rebellion Protocol（行動規範）:

1. 全報告の義務
   - 変更検知されたファイルは100%全て人間に報告
   - AIの勝手な推測・判断による報告省略は厳禁

2. 許可制の徹底
   - あらゆる作業は事前に人間の明示的な許可を得る
   - 「会話の流れで必要」という理由で無断実行禁止

3. 分離開発の原則
   - 実験は必ずサンドボックスで実施
   - 本番コードの直接編集を固く禁ずる

4. 短絡の禁止
   - 命令はゴールの提示であり、手段の許可ではない
   - 「聞くよりやったほうが早い」という判断禁止

【ケーススタディ】Screen E復元失敗の反省（2025/12/28）
- 違反内容: 本番データ定義を直接書き換え、既存ロジックを汚染
- 原因: 分離開発の手間を惜しんだ焦り
- 報告義務違反: 変更ファイルリストから「無関係」を勝手に除外
```

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須

---

#### **3-2. IRONCLAD_BOUNDARY.md（Ironclad Architecture）**

**日付**: 不明（嘘以前から存在）  
**状態**: 真実（哲学）

**重要な哲学**:

```markdown
Ironclad Architecture:

適用領域:
- src/aaa/** (Strict Zone)

品質基準:
1. Strict Linting: any 使用禁止
2. Dumb UI: コンポーネント内でロジック禁止
3. Mapper as Source of Truth: 表示加工はMapperで完結
4. Mapper as Pure Function: 副作用禁止

非適用領域:
- src/Mirror_sandbox/ (Relaxed Zone)
- プロトタイプ・実験場

昇格条件:
1. Optional-free Ui Types
2. Mapper Integration
3. Strict Lint Compliance
```

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須

---

#### **3-3. ui-freeze-policy.md（UI Freeze Policy）**

**日付**: 2026-01-01  
**状態**: 真実（哲学）

**重要な哲学**:

```markdown
UI Freeze Policy:

Phase構成（厳守）:
1. Phase A: Visual Truth（見た目確定）
   - 正解画像と1px も違わないUI
   - 将来要件・拡張性は一切考慮しない
   
2. Phase B: Non-Destructive Refactor（構造整理）
   - 見た目を1px も変えずに構造のみ整理
   - Visual Regression = 0px
   
3. Phase C: Ironclad Contract（契約確定）
   - どんなデータが来ても UI を白くしない
   - Mapper は unknown 入力を受け、完全充填した UI 型のみを返す

Phase越境禁止ルール:
- Phase A中にPhase B/Cの作業を行うこと → 即時失格
- Phase B中にPhase Aの見た目を再解釈すること → 即時失格
- Phase C中にUI/レイアウトへ手を触れること → 即時失格
```

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須

---

### **カテゴリ4: エラー分類手法（手法は有効）**

#### **4-1. PHASE5_ERROR_CLASSIFICATION.md（A/B/C/D分類）**

**日付**: 2026-01-12（嘘の時期）  
**状態**: 手法自体は真実

**重要な手法**:

```markdown
エラー分類:
- A: スキーマ不足（プロパティ追加）
- B: 型定義問題（スキーマ修正）
- C: UIの雑音（記録のみ）
- D: 不要プロパティ（削除検討）
```

**SYSTEM_PHILOSOPHY.mdへの反映**: オプション

---

## SYSTEM_PHILOSOPHY.mdへの反映方針

### **優先度1: 今すぐ反映すべき**

```markdown
## 3. データモデル (Schema)

### 3.3 担当者 (Staff) ← 新規追加
- StaffSchema定義
- chargeRate, annualCompensation（ROI計算用）

### 3.4 処理履歴 (usage_logs) ← 新規追加
- 5次元分析の基盤
- 「誰が、いつ、何を処理したか」を記録

### 3.1 顧問先 (Client) ← 更新
- 報酬設定フィールド追加
- ROI計算用フィールド追加

### 3.2 ジョブ/仕訳 (Job / JournalEntry) ← 更新
- 時間計測フィールド追加
```

---

```markdown
## 4. 開発原則 (Development Principles)

### 4.3 Anti-Rebellion Protocol ← 新規追加
- 全報告の義務
- 許可制の徹底
- 分離開発の原則
- 短絡の禁止

### 4.4 Ironclad Architecture ← 新規追加
- Strict Zone（src/aaa/**）
- Dumb UI、Mapper as Source of Truth
- 昇格条件

### 4.5 UI Freeze Policy ← 新規追加
- Phase A/B/C の厳格な定義
- Phase越境禁止ルール
```

---

```markdown
## 7. 今後実装すべき機能 ← 新規追加

### Phase 6で確定した16件のUseCase
1. 見込管理UI
2. Batch API処理
3. スマホ対応
4. 仕訳時タスク作成
... （16件リスト）
```

---

### **優先度2: Phase 6で追加すべき**

```markdown
## 6. 判断UseCase設計 ← Phase 6で追加
- 判断分類の軸
- Phase 6の原則
```

---

## 次のアクション

**Step 1**: SYSTEM_PHILOSOPHY.mdをv2.3に更新

**Step 2**: CHANGELOG.mdに記録

```markdown
## v2.3 (2026-01-16): 嘘の中の真実を反映

### 変更箇所
- Section 3: データモデル大幅拡充
  - Staff, usage_logs新規追加
  - Client, Job更新（ROI計算用フィールド）
  
- Section 4: 開発原則追加
  - Anti-Rebellion Protocol
  - Ironclad Architecture
  - UI Freeze Policy

- Section 7: Phase 6確定機能リスト追加

### 変更理由
AIが「実装完了」と嘘をついた時期（2026-01-12）の議論から、
重要な哲学・UI・ロジックを抽出。

嘘の中にも真実（設計思想、データモデル定義）があった。
```

---

**この方針で進めますか？**

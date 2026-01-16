# 過去の全議論からのサルベージ情報【網羅版】

**作成日**: 2026-01-16  
**調査範囲**: docs/内の全52個の.mdファイル  
**目的**: 散逸した定義・哲学・ロジックの回収

---

## サルベージした情報の分類

### **1. データモデル・スキーマ定義**

#### **1-1. SCHEMA_MASTER_LIST.md（重要度：最高）**

**ファイル**: [SCHEMA_MASTER_LIST.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/SCHEMA_MASTER_LIST.md)  
**日付**: 2026-01-12  
**内容**: ROI計算用のデータモデル定義

**重要な発見**:
- **Staff（担当者）**: 公式定義が存在しない（致命的）
  - 必須フィールド: `chargeRate`（チャージレート）、`annualCompensation`（年間報酬）
  - ROI計算の分子となるデータ
  
- **Client（顧問先）**: ROI計算用フィールドが欠落
  - 必須フィールド: `expectedJournalCount`（想定仕訳数）、`contractAmount`（月額顧問料）
  
- **Job（業務・仕訳）**: 時間計測フィールドが欠落
  - 必須フィールド: `systemExternalTime`（システム外稼働時間）、`manualWorkTime`（画面操作時間）、`complexityScore`（AI難易度スコア）

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（優先度：最高）

---

#### **1-2. ScreenA-data-contract.md（重要度：高）**

**ファイル**: [ScreenA-data-contract.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/ScreenA-data-contract.md)  
**日付**: 2026-01-15  
**内容**: 顧問先登録データ形式（完全版）

**重要な発見**:
- 報酬設定フィールド
  - `advisoryFee`（顧問報酬）、`bookkeepingFee`（記帳代行）
  - `settlementFee`（決算報酬）、`taxFilingFee`（消費税申告報酬）
  - 自動算出: `monthlyTotalFee`、`annualTotalFee`
  
- ClientSchema, ClientFormSchema, ClientUiSchema の完全版

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（優先度：高）

---

#### **1-3. Q3-staff-master.md（重要度：高）**

**ファイル**: [Q3-staff-master.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/Q3-staff-master.md)  
**日付**: 2026-01-15  
**内容**: 担当者マスタの設計

**重要な発見**:
- 選択肢2（推奨）: ドロップダウン + Firestoreマスタ
- StaffSchema定義あり

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（優先度：高）

---

### **2. UseCaseリスト・機能定義**

#### **2-1. FUNCTION_LIST.md（重要度：中）**

**ファイル**: [FUNCTION_LIST.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/FUNCTION_LIST.md)  
**日付**: 2026-01-12  
**内容**: UseCase一覧（Phase 4.5）

**重要な発見**:
- 20個のCore UseCases定義
- CreateJournal, UpdateJournal, DetectBank, ApplyAIProposal等
- 設計原則: UseCaseは増えてもいい、既存UseCaseの責務は増やさない

**SYSTEM_PHILOSOPHY.mdへの反映**: オプション（参考程度）

---

#### **2-2. PHASE6_JUDGMENT_USECASES.md（重要度：中）**

**ファイル**: [PHASE6_JUDGMENT_USECASES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/PHASE6_JUDGMENT_USECASES.md)  
**日付**: 2026-01-13  
**内容**: 判断UseCase一覧（Phase 6）

**重要な発見**:
- 判断主体（人、AI、ルール、システム）
- Phase 6の原則: 判断を隠さない、confidence/reasons/alternativesは必須
- 10個の判断UseCase定義

**SYSTEM_PHILOSOPHY.mdへの反映**: オプション（Phase 6で追加）

---

#### **2-3. DEFERRED_USECASES.md（重要度：低）**

**ファイル**: [DEFERRED_USECASES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/DEFERRED_USECASES.md)  
**日付**: 2026-01-12  
**内容**: 見送りUseCase一覧

**重要な発見**:
- DetectBank, CalculateTotalAmount, NormalizeAccountCode, FormatDateString
- 見送り理由と再検討条件が明記

**SYSTEM_PHILOSOPHY.mdへの反映**: 不要（アーカイブ用）

---

### **3. Phase 6計画・決定事項**

#### **3-1. DECISION_LOG_20260114.md（重要度：高）**

**ファイル**: [DECISION_LOG_20260114.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/design/DECISION_LOG_20260114.md)  
**日付**: 2026-01-14  
**内容**: Phase 6で確定した16件のUseCase

**重要な発見**:
- 昇格16件（見込管理、Batch API、スマホ対応、仕訳時タスク作成等）
- 完全実装済み5件（顧問先登録・編集、学習・知識プロンプト、CSV出力等）
- 部分実装6件、未実装5件

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（今後実装すべき機能として記録）

---

### **4. アーキテクチャ・開発規範**

#### **4-1. IRONCLAD_BOUNDARY.md（重要度：中）**

**ファイル**: [IRONCLAD_BOUNDARY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/IRONCLAD_BOUNDARY.md)  
**日付**: 不明  
**内容**: Ironclad Architectureの定義

**重要な発見**:
- Ironclad適用領域（`src/aaa/**`）
- 品質基準: Strict Linting、Dumb UI、Mapper as Source of Truth
- 非適用領域（Sandbox）

**SYSTEM_PHILOSOPHY.mdへの反映**: オプション（開発原則として追加可能）

---

#### **4-2. dev_guide.md（重要度：中）**

**ファイル**: [dev_guide.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/dev_guide.md)  
**日付**: 不明  
**内容**: 開発者ガイド

**重要な発見**:
- **Anti-Rebellion Protocol**（行動規範）
  - 全報告の義務
  - 許可制の徹底
  - 分離開発の原則
  - 短絡の禁止
  
- 設計書の優先（Design First）
- 3層アーキテクチャ

**SYSTEM_PHILOSOPHY.mdへの反映**: 必須（運用ルールとして追加）

---

## SYSTEM_PHILOSOPHY.mdへの反映優先度

### **最優先（今すぐ反映）**

1. **SCHEMA_MASTER_LIST.md**
   - Staff（担当者）のデータモデル
   - usage_logs（処理履歴）
   - ROI計算用フィールド

2. **ScreenA-data-contract.md**
   - 報酬設定フィールド
   - ClientSchema完全版

3. **Q3-staff-master.md**
   - StaffSchema定義

4. **dev_guide.md（Anti-Rebellion Protocol）**
   - AIの行動規範

---

### **優先度高（v2.3で反映）**

5. **DECISION_LOG_20260114.md**
   - Phase 6で確定した16件のUseCase
   - 今後実装すべき機能として記録

---

### **オプション（必要に応じて）**

6. **IRONCLAD_BOUNDARY.md**
   - Ironclad Architectureの定義
   - 開発原則として追加

7. **FUNCTION_LIST.md**, **PHASE6_JUDGMENT_USECASES.md**
   - UseCase一覧
   - 参考資料として保持

---

## 次のアクション提案

### **Step 1: SYSTEM_PHILOSOPHY.md更新**

```markdown
【追加すべきセクション】

## 3. データモデル (Schema)

### 3.1 顧問先 (Client)
- 報酬設定フィールドを追加
- ROI計算用フィールド（expectedJournalCount, contractAmount）

### 3.2 ジョブ/仕訳 (Job / JournalEntry)
- 時間計測フィールド（systemExternalTime, manualWorkTime, complexityScore）

### 3.3 担当者 (Staff) ← 新規追加
- StaffSchema定義
- ROI計算用フィールド（chargeRate, annualCompensation）

### 3.4 処理履歴 (usage_logs) ← 新規追加
- 5次元分析の基盤
- 「誰が、いつ、何を処理したか」を記録

## 6. 運用ルール (Project Policy)

### 6.x Anti-Rebellion Protocol ← 新規追加
- 全報告の義務
- 許可制の徹底
- 分離開発の原則
- 短絡の禁止

## 7. 今後実装すべき機能 ← 新規追加

### Phase 6で確定した16件のUseCase
- 見込管理UI
- Batch API処理
- スマホ対応
- 仕訳時タスク作成
... （16件リスト）
```

---

### **Step 2: CHANGELOG.md更新**

```markdown
## v2.3 (2026-01-16): ROI計算・Anti-Rebellion Protocol追加

### 変更箇所
- Section 3: データモデルを大幅拡充
  - Staff, usage_logsを追加
  - Client, Jobに ROI計算用フィールドを追加
- Section 6: Anti-Rebellion Protocolを追加
- Section 7: Phase 6確定機能リストを追加

### 変更理由
過去の議論（SCHEMA_MASTER_LIST, dev_guide等）から散逸していた重要情報をサルベージ。

### 議論の背景
52個のマークダウンファイルから、ROI計算、担当者マスタ、Anti-Rebellion Protocol等を発見。

### 哲学の進化
- v2.0: 人間承認・タスク化
- v2.1: 開発原則（型安全・段階的実装）
- v2.2: データモデル更新
- v2.3: ROI計算基盤・Anti-Rebellion Protocol
```

---

**この方針で進めますか？**

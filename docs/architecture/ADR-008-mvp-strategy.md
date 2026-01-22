# ADR-008: MVP戦略（小さく開発への方針転換）

**Status**: Accepted  
**Date**: 2026-01-22  
**Owner**: 司令官  
**関連**: ADR-004, ADR-005, ADR-006, SESSION_20260122.md

---

## Context（背景）

### 発生した問題

2026-01-22の議論により、以下の問題が明確になった：

1. **Phase 3-B（UIモック29件）は複雑すぎる**
   - 207件のUseCaseから29件のcore UseCaseを抽出
   - しかし29件でも実装が困難
   - UI統合作業（admin-settings、DG等）も未完了

2. **L4/L5の本質的理解不足**
   - **L4（UI Implementation Layer）**: 「意味と画面を1対1に束縛する層」
   - **L5（CI/Integration Layer）**: 「意味が壊れていないことを機械が保証する層」
   - ADR-006で定義したが、実装方法が不明確

3. **過去の痛みが再発する懸念**
   - **「表示されない」**: Service正常、データ返却、でもどのUIが表示責任を持つか未定義 → L4欠如
   - **「デバッグ不能」**: 設計違反か実装ミスか判別不能 → L5欠如

---

## Decision（決定事項）

### **MVP戦略を採用し、L4/L5を段階的に硬化させる**

#### 1. **MVP Scope（最小実装範囲）**

**対象画面**:
- 仕訳UI（Screen E）
- 顧問先登録UI（Screen A）

**学習ルール**:
- 初期は簡素化（複雑な学習ロジックは後回し）

**理由**:
- 29件のcore UseCaseは多すぎる
- 仕訳UIと顧問先登録UIに集中すれば、10件程度に絞れる

---

#### 2. **L4/L5の段階的硬化（Staged Freeze Model拡張）**

**従来**（ADR-004）:
- Penta-Shieldは5層すべてを一度に実装
- L4/L5の実装方法が不明確

**新方針**:
- **L4/L5を「凍結」ではなく「段階的硬化」**
- MVP実装中はLayer A/B/Cで代替
- 実装成熟後にL4/L5を追加

**段階的硬化の定義**:

```
Temporary Freeze（暫定凍結）:
  L1-L3: 実装済み・Freeze
  L4-L5: Layer A/B/Cで代替

Full Freeze（完全凍結）:
  L1-L5: すべて実装済み・Freeze
```

---

#### 3. **Layer A/B/C組み合わせ戦略**

L4/L5の本格実装前に、以下の3層で段階的に実装する：

##### **Layer A（Technical Layer Verification）**

**目的**: 技術的エラーを段階的に排除

**内容**:
- Firebase Emulatorテスト
- `console.log`でデータ検証
- 増分UI開発（1画面ずつ）

**例**:
```
Step 1: Firestoreにデータが存在するか確認
Step 2: データがVueに渡っているか確認
Step 3: UIに表示されているか確認
```

---

##### **Layer B（Mapping Table - L4代替）**

**目的**: 「責任所在」の明確化（L4の本質）

**内容**:
- `USECASE_TO_UI_MAPPING`テーブル作成
- 各UseCaseと表示責任UIの対応を明記
- 表示されない場合の修正箇所を即座に特定

**実装例**:
```typescript
// src/domain/mapping/usecaseToUI.ts
export const USECASE_TO_UI_MAPPING = {
  "UC-001: 顧問先ごとの採算感覚を掴みたい": {
    primaryUI: "Screen A - Client List",
    displayFields: ["想定仕訳数", "作業時間", "報酬"],
    actions: ["ソート", "フィルタ"],
  },
  "UC-002: 顧問先のステータスから作業可否を判断したい": {
    primaryUI: "Screen A - Client List",
    displayFields: ["ステータス"],
    actions: ["確認"],
  },
  // ...
} as const;
```

**効果**:
- 「表示されない」→ Mapping Tableで責任UIを即座に特定
- L4の本質（意味と画面の1対1束縛）を実現

---

##### **Layer C（Service Unit Test + Type Enforcement - L5代替）**

**目的**: 「意味の不変性保証」（L5の本質）

**内容**:
- TypeScript型で呼び出し元を制限
- Service単体テストで意味の不変性を検証

**実装例**:
```typescript
// src/services/JournalEntryService.ts
type AllowedCallers = "ScreenE_JournalEntry" | "ScreenB_JobList";

export class JournalEntryService {
  static async createEntry(
    data: JournalEntryInput,
    caller: AllowedCallers
  ): Promise<JournalEntry> {
    // callerチェック
    if (!this.isAllowedCaller(caller)) {
      throw new Error(`Unauthorized caller: ${caller}`);
    }
    // ...
  }

  private static isAllowedCaller(caller: string): caller is AllowedCallers {
    return ["ScreenE_JournalEntry", "ScreenB_JobList"].includes(caller);
  }
}
```

**効果**:
- 不正なUI/コンポーネントからのService呼び出しをコンパイル時に防止
- 意味破壊を物理的に防止（L5の本質）

---

## Consequences（影響）

### 正の影響

| 観点 | 効果 |
|------|------|
| **実装範囲の削減** | 29件 → 10件（仕訳UI + 顧問先登録UI） |
| **手戻りの最小化** | Layer A/B/Cで段階的確認、問題を早期発見 |
| **過去の痛み回避** | Layer B（Mapping Table）で「表示されない」を解決 |
| | Layer C（型制約）で「デバッグ不能」を解決 |
| **実装速度向上** | 小さく始めるため、1週間〜2週間で検証可能 |

### 負の影響

| 観点 | 影響 |
|------|------|
| **L4/L5の後回し** | 完全なPenta-Shield実装は延期 |
| **Layer B/Cの追加工数** | Mapping Table、型制約の実装が必要 |

**結論**: 許容する（MVP検証を優先）

---

## 実装計画（5日間）

### **Day 1: UseCase絞り込み + Mapping Table設計**

- [ ] 207件UseCaseから仕訳UI + 顧問先登録UI関連を抽出（10件程度）
- [ ] Mapping Tableテンプレート作成（Layer B）
- [ ] 各UseCaseと責任UIの対応付け

**成果物**: `USECASE_TO_UI_MAPPING.ts`（テンプレート）

---

### **Day 2: Layer A実装（技術的検証）**

- [ ] Firebase Emulatorセットアップ
- [ ] 仕訳UIのデータフロー検証（Firestore → Vue → 画面）
- [ ] `console.log`で各Stepのデータ確認

**成果物**: 技術的エラーがゼロの状態

---

### **Day 3: Layer B実装（Mapping Table完成）**

- [ ] 仕訳UI用Mapping Table完成
- [ ] 顧問先登録UI用Mapping Table完成
- [ ] 各UseCaseに対する表示責任の明確化

**成果物**: 完全なMapping Table

---

### **Day 4: Layer C実装（型制約 + 単体テスト）**

- [ ] Service層に`AllowedCallers`型を追加
- [ ] 単体テストで不正呼び出しを検証
- [ ] コンパイルエラーで不正呼び出しを防止

**成果物**: 型制約実装済みService層

---

### **Day 5: 統合検証 + walkthrough作成**

- [ ] Layer A/B/C統合動作確認
- [ ] 「表示されない」「デバッグ不能」が発生しないことを検証
- [ ] walkthrough.md更新（検証結果記録）

**成果物**: MVP実装完了

---

## L4/L5への移行計画（将来）

MVP実装・検証完了後、以下の手順でL4/L5を追加：

**Phase 1**: Layer B → L4（Visual Guard）
- Mapping Tableの対応関係をVisual Regression Testに変換
- Storybook導入
- CI接続

**Phase 2**: Layer C → L5（CI Integration）
- 型制約をCI自動チェックに変換
- Lintルール追加
- Service呼び出し元の自動検証

---

## 関連ADR

- [ADR-004: Penta-Shield（5層防御）](./ADR-004-penta-shield-defense-layers.md)
- [ADR-005: 防御層実装詳細（L1/L2/L3）](./ADR-005-defense-layer-implementation.md)
- [ADR-006: UI・CI統合（L4/L5）](./ADR-006-ui-ci-integration.md)

---

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2026-01-22 | 初版作成（MVP戦略確立） | 司令官 + AI |

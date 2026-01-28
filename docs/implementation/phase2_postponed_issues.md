# Phase 2延期事項 - 完全版

> [!WARNING]
> ## ⚠️ このファイルの位置づけ
> - **検索用アーカイブ**です
> - **最新の意思決定・項目リスト**は [UI_MASTER_v2.md](../../docs/UI_MASTER_v2.md) を参照
> - このファイルは2026-01-24時点のスナップショット
> - 意思決定情報は古い可能性があります

**作成日**: 2026-01-24  
**更新日**: 2026-01-24  
**ステータス**: Phase 1完了、Phase 2で対応予定

---

## 4. Step 3実装時のany型・型定義問題

### 議論の経緯

- 2026-01-24セッションでStep 3（AI API実装）を完了
- 実装後、ESLintで31件のエラーを検出
- 主な原因:
  - `any` 型の使用（CsvValidator、CsvExportService、GeminiVisionService）
  - `Client`型のプロパティアクセス問題（`Partial<Client>` 使用時）
  - Phase 2用関数の未使用パラメータ警告

---

### 4-1. any 型の使用（6箇所）

#### Phase 2用の関数（未実装）

**CsvValidator.ts**:
- `validateFreee(entry: any)` - L100
- `validateYayoi(entry: any)` - L108

**CsvExportService.ts**:
- `convertToCsv(rows: Record<string, any>[])` - L96

**GeminiVisionService.ts**:
- `any` 型（L100, L125）

#### 理由
Phase 2で実装する関数のため、現時点で型を確定できない

#### 再開条件
- Phase 2でFreee/弥生のCSV出力を実装する際
- 実際のAPIレスポンス形式を確認してから型定義

#### 対応方針
- Phase 1では `// eslint-disable-next-line @typescript-eslint/no-explicit-any` で抑制
- Phase 2で正確な型を定義

---

### 4-2. Client型のプロパティアクセス問題

#### 問題

```typescript
// FileTypeDetector.ts と GeminiVisionService.ts
function buildPrompt(client: Partial<Client>): string {
  // エラー: Partial<Client> にプロパティが存在しない
  client.clientCode  // ❌
  client.fiscalMonth // ❌
}
```

#### 理由
`Partial<Client>` を使用したため、すべてのプロパティがoptionalになり型情報が失われた

#### Phase 2での対応

**方法1**: 必須プロパティのみを含むサブタイプを定義
```typescript
type ClientMinimal = Pick<Client, 'clientCode' | 'fiscalMonth' | ...>;
```

**方法2**: optional chaining を使用
```typescript
client?.clientCode || 'XXX'
```

#### 再開条件
- Phase 2でClient型のリファクタリングを実施する際
- 既存の`ClientSchema.ts`の仕様が安定してから

---

### 4-3. Phase 1で実施した安全な修正

以下はPhase 1で完了（型定義に影響なし）:

- ✅ importパス修正（相対パス → `@/features/journal`）
- ✅ 未使用変数の警告抑制（`_journalEntries`, `_client`）

---

#### 記録先
- `brain/error_31_investigation.md`（エラー調査レポート）
- `task.md`（Phase 2実装タスクに追加）

#### 次のアクション
- Phase 2開始時に `any` 型と `Partial<Client>` 問題を優先的に解決
- Client型の仕様を安定させてから対応

---

## 5. CI/CD脆弱性修正の残タスク（unknown型への変更）

### 議論の経緯

- 2026-01-24にCI/CD脆弱性を発見
- `GeminiVisionService.ts`の暗黙的any型（`response.json()`, `JSON.parse()`）がCI/CDを通り抜けた
- 以下の3つの対応を完了:
  - ✅ 優先度1: AST チェックの検証範囲を拡大（`src/services` 層を追加）
  - ✅ 優先度2: `GeminiVisionService.ts`に`@type-audit`コメントを追加
  - ✅ 優先度3: `types/firestore.ts`に`@type-audit`コメントを追加

---

### Phase 2に延期した対応

#### 優先度4: unknown型への変更

**内容**:

```typescript
// 現状（優先度2で@type-auditコメント付き）
const result = await response.json();
const parsed = JSON.parse(cleanedJson);

// 優先度4で実施すべき変更
const result: unknown = await response.json();
// 型ガードで安全に扱う
if (typeof result === 'object' && result !== null && 'candidates' in result) {
  // ...
}

const parsed: unknown = JSON.parse(cleanedJson);
// Zodスキーマで検証（既に実施済み）
```

#### 延期理由

1. 既に `@type-audit` コメントを追加済みでADR-011に形式的に準拠
2. Zodスキーマ（L142）で検証しているため、実質的に型安全
3. `unknown`型への変更はコード量が増加する（15行程度）
4. 優先度1-3の修正でCI/CD脆弱性は解消済み

#### Phase 2での対応

- `GeminiVisionService.ts` L78, L87を`unknown`型+型ガードに変更
- 型安全性をさらに向上

#### 再開条件

- Phase 2で外部API連携の型安全性を強化する際
- `GeminiVisionService`のリファクタリングを実施する際

---

#### 記録先
- `cicd_vulnerability_analysis.md`（CI/CD脆弱性分析レポート）
- `TASK_MASTER.md`（Phase 2タスクとして追加）

#### 次のアクション
- Phase 2開始時に`unknown`型への変更を実施
- 完全な型安全性を実現

---

## 解決済み議論（参考）

### #10. Step 2（L1-3定義）での設計決定 ✅ 解決（2026-01-23）

#### 議論の経緯

Step 2（Journal L1-3定義）で以下の設計決定を確定:
- 税額判定戦略C採用: OCR抽出値をデフォルト採用 + 計算値との差分検証
- UI表示方針: 仕訳一覧では税額非表示、詳細モーダルで表示
- Phase 2延期判断: 複雑な機能（詳細信頼度、承認ワークフロー、詳細インボイス対応）をPhase 2に延期

#### 解決内容

**【税額判定戦略C】**
- デフォルト: OCR抽出値（記載値）を採用
- 検証: 計算値とのズレを自動検出
- ユーザー判定:
  - ズレなし / 1円以内 → ✅ OK（自動承認）
  - 2-5円 → ⚠️ WARNING（確認推奨）
  - 5円超 → ❌ ERROR（修正必須）

**【UI表示方針】**
- 内部データ: 証憑記載の税額 + 計算上の税額 + 最終確定税額（すべて保持）
- UI表示: 仕訳一覧では税額非表示、詳細モーダルで表示
- CSV/API出力: すべて含める（`taxAmountFinal`）

**【Phase 2延期理由】**
- Phase 1はMVP（最小機能）に集中
- 複雑な機能は実運用での検証後に追加

#### 記録先
- `step2_l1-3_definition.md`（完全版ドキュメント）
- `task.md`（Step 2詳細設計決定）

#### 次のアクション
- Step 2実装（Schema/Service作成）
- Step 3（AIプロンプト設計）へ進む

---

## 更新履歴

- 2026-01-24: Step 3実装時のany型・型定義問題（Phase 2延期）を追加
- 2026-01-23: Step 2（L1-3定義）の設計決定を解決済み議論に追加
- 2026-01-21: 初版作成（Firebase認証設定セッション）

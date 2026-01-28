# バックエンド実装タスク（L2：カテゴリー別、永続）

> [!NOTE]
> ## 📋 このファイルの位置づけ
> - **階層**: L2（カテゴリー別タスク、永続）
> - **役割**: バックエンド実装の詳細タスク管理
> - **同期**:
>   - **上位**: BACKEND_MASTER.md（L1、Milestone完了時に同期）
>   - **下位**: task.md（L3、セッション終了時に集約）
> - **ルール**: 急遽問題が発生してもこのファイルは影響を受けない

**最終更新**: 2026-01-26  
**カテゴリー**: バックエンド実装  
**Phase**: 1-2  
**優先度**: P1

---

## 🎯 現在の進捗（横断的）

**Phase 1**: ADR-011型安全防御、Step 3 AI API実装 ✅ 完了  
**Phase 2最優先**: TD-001型定義ミスマッチ修正（1-2時間）← **Phase 2冒頭で即座に対応**

**影響箇所**: CsvValidator.ts、FileTypeDetector.ts、CsvExportService.ts（3ファイル）

**詳細**: [PROJECT_STATUS.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/PROJECT_STATUS.md)（L0最上位）

---

## 📊 全体進捗

### Phase 1（完了・一部課題あり）
| タスク | ステータス | 完了日 | 備考 |
|------|----------|--------|------|
| ADR-011型安全実装 | ✅ 完了 | 2026-01-24 | 5層防御アーキテクチャ |
| Step 3: AI API実装 | ✅ 完了 | 2026-01-24 | 8ファイル作成、TD-001あり |

### Phase 2（待機中）
| タスク | ステータス | 予定開始 |
|------|----------|---------|
| TD-001型定義修正 | ⏸️ 待機中 | Phase 2冒頭 |
| Cloud Functions実装 | ⏸️ 待機中 | Phase 2 |
| API統合（MF/Freee/弥生） | ⏸️ 待機中 | Phase 2 |

---

## TD-001: 型定義ミスマッチ（Phase 2最優先）

**ステータス**: Phase 2冒頭で対応  
**重要度**: 最高  
**発見日**: 2026-01-24

### 影響箇所（3ファイル）

**出典**: SESSION_20260124.md L119-128、TECH-DEBT.md

1. **CsvValidator.ts**
   - 問題: `JournalEntry` に `description`, `date` が存在しない
   - 影響: CSV制約チェックが動作しない

2. **FileTypeDetector.ts**
   - 問題: `Client` に `clientCode` が存在しない
   - 影響: プロンプト生成が失敗する

3. **CsvExportService.ts**
   - 問題: `JournalEntry` に複数の必須フィールドが欠落
   - 影響: MF用CSV出力が動作しない

### 対応方針

**Phase 2冒頭で型定義を再設計**

- [ ] `types/journal.ts` 再設計
- [ ] `types/client.ts` 再設計
- [ ] `CsvValidator.ts` 修正
- [ ] `FileTypeDetector.ts` 修正
- [ ] `CsvExportService.ts` 修正
- [ ] 型整合性テスト実施

**所要時間**: 1-2時間  
**詳細**: [TECH-DEBT.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TECH-DEBT.md)

---

## any型の使用（Phase 2対応）

**ステータス**: Phase 2で対応  
**重要度**: 高

### 対象箇所（6箇所）

**出典**: phase2_postponed_issues.md L29-53

#### Phase 2用の関数（未実装）

1. **CsvValidator.ts**
   - `validateFreee(entry: any)` - L100
   - `validateYayoi(entry: any)` - L108

2. **CsvExportService.ts**
   - `convertToCsv(rows: Record<string, any>[])` - L96

3. **GeminiVisionService.ts**
   - `any` 型（L100, L125）

#### 理由
Phase 2で実装する関数のため、現時点で型を確定できない

#### 対応タスク
- [ ] Freee/弥生のCSV仕様確認
- [ ] `validateFreee()` 正確な型定義
- [ ] `validateYayoi()` 正確な型定義
- [ ] `convertToCsv()` 厳密な型定義
- [ ] GeminiVisionService型修正

---

## Client型のPartial問題（Phase 2対応）

**ステータス**: Phase 2で対応  
**重要度**: 中

### 問題

**出典**: phase2_postponed_issues.md L56-86

```typescript
// 現状（NG）
function buildPrompt(client: Partial<Client>): string {
  client.clientCode  // ❌ Partial<Client>で型情報が失われる
  client.fiscalMonth // ❌
}
```

### 対応方針

**方法1**: 必須プロパティのみを含むサブタイプを定義
```typescript
type ClientMinimal = Pick<Client, 'clientCode' | 'fiscalMonth' | ...>;
```

**方法2**: optional chaining を使用
```typescript
client?.clientCode || 'XXX'
```

### 対応タスク
- [ ] `ClientMinimal` 型定義作成
- [ ] `FileTypeDetector.ts` 修正
- [ ] `GeminiVisionService.ts` 修正

---

## unknown型への変更（CI/CD脆弱性修正）

**ステータス**: Phase 2で対応（優先度4）  
**重要度**: 低（@type-audit対応済み）

### 対象箇所

**出典**: phase2_postponed_issues.md L109-169

**GeminiVisionService.ts L78, L87**

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
```

### 延期理由
1. 既に `@type-audit` コメント追加済みでADR-011に形式的に準拠
2. Zodスキーマで検証しているため、実質的に型安全
3. `unknown`型への変更はコード量が増加する（15行程度）
4. 優先度1-3の修正でCI/CD脆弱性は解消済み

### 対応タスク
- [ ] GeminiVisionService.ts L78, L87を`unknown`型に変更
- [ ] 型ガードで安全に扱う

---

## ADR-011 型安全防御アーキテクチャ（Phase 1完了）

**ステータス**: ✅ 完了  
**完了日**: 2026-01-24  
**成果**: 型安全性破壊リスク95%削減（推定）

### 5層防御アーキテクチャ

**出典**: ADR-011-ai-proof-type-safety.md、SESSION_20260124.md L13-27

1. **L1: tsconfig strict（IDE暴走防止）**
   - ✅ `tsconfig.app.json` 更新
   - ✅ `.vscode/settings.json` 更新

2. **L2: ASTベースCI（AI回避不能）**
   - ✅ `scripts/check-partial.ts` 作成
   - ✅ `.github/workflows/type-safety.yml` 作成
   - ✅ Domain/Features層にPartial/anyなし検証

3. **L3: 層別ルール（Domain厳格、DTO緩和）**
   - ✅ Domain層: HARD FAIL
   - ✅ DTO層: 警告のみ（Artifact保存）

4. **L4: 証跡管理（監査対応）**
   - ✅ `@type-audit` コメント必須
   - ✅ CI Artifact で90日保存

5. **L5: AI自律修正（フィードバックループ）**
   - ✅ エラー時の自動修正提案

### 作成ファイル（8件）
- ADR-011-ai-proof-type-safety.md
- CONVENTIONS.md
- scripts/check-partial.ts
- .github/workflows/type-safety.yml
- TECH-DEBT.md
- package.json（更新）
- tsconfig.app.json（更新）
- .vscode/settings.json（更新）

---

## Cloud Functions実装（Phase 2）

**ステータス**: 待機中  
**予定開始**: Phase 2

### Vertex AI連携

**出典**: adr010_part2_implementation.md

#### タスクリスト
- [ ] Vertex AI SDK導入
- [ ] OAuth 2.1実装
- [ ] Service Account認証設定
- [ ] VPC対応設定
- [ ] ファインチューニング準備
- [ ] Cloud Functions実装（analyzeReceipt）
- [ ] 本番環境テスト

#### 実装ファイル
- `functions/src/index.ts` - エントリーポイント
- `functions/src/analyzeReceipt.ts` - Vertex AI呼び出し
- `functions/src/types.ts` - 型定義
- `functions/package.json`
- `functions/tsconfig.json`

**所要時間**: 3-4時間  
**詳細**: [ADR-010 Part2実装手順](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/adr010_part2_implementation.md)

---

## API統合（Phase 2）

**ステータス**: 待機中  
**予定開始**: Phase 2

### MF API連携

#### タスクリスト
- [ ] OAuth 2.1実装
- [ ] マスタAPI連携（勘定科目、補助科目、税区分）
- [ ] 取引先マスタ連携
- [ ] NFKC正規化との連動

### Freee API連携

#### タスクリスト
- [ ] REST API (OAuth 2.1)実装
- [ ] Tax Code動的取得
- [ ] 税区分マッピング（Freee形式）

### 弥生 API連携

#### タスクリスト
- [ ] API仕様確認
- [ ] 税区分マッピング（弥生形式）

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-26 | 【横断的進捗追加】「現在の進捗（横断的）」セクション追加：Phase 2最優先TD-001型定義修正（1-2時間）を明記 |
| 2026-01-26 | 【重要拡充】14ファイル全文読み込み情報を反映：TD-001詳細、any型問題、unknown型変更、ADR-011完了記録、Cloud Functions/API統合タスク追加、53行→約300行に拡充 |
| 2026-01-25 | 初版作成、Phase 2タスクをリスト化 |

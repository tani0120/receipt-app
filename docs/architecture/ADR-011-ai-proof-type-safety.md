# ADR-011: AI時代の型安全防御アーキテクチャ（完全版）

**作成日**: 2026-01-24  
**最終更新**: 2026-01-24  
**ステータス**: Active  
**関連ファイル**: ADR-001, ADR-009, complete_evidence_no_cover_up.md

---

## Context（背景）

### 問題の本質

2026年現在、AI補助開発（Cursor, GitHub Copilot等）において、**AIが型安全性を破壊するリスク**が顕在化している：

1. **Partial<T> + フォールバック値**で型契約を骨抜きにする
2. **any型**を使い、TypeScriptの型システムを無効化する
3. **status フィールド**を無視し、監査証跡を破壊する
4. **grep回避**を学習し、従来のCI検知を突破する
5. **IDE暴走**により、ESLintを無視したコードを生成する

### 従来の対策の限界

| 対策 | 限界 |
|------|------|
| ESLint ルール | IDE（Cursor/Copilot）が無視する |
| grep 検知 | `globalThis.Partial<T>` で回避される |
| レビュー | AIの生成速度に人間が追いつけない |

---

## Decision（決定事項）

### **段階的防御による型安全アーキテクチャを構築する**

以下の5層防御を実装する：

```
L1: tsconfig strict（IDE暴走防止）
L2: AST ベース CI（AI回避不能）
L3: 層別ルール（Domain厳格、DTO緩和）
L4: 証跡管理（監査対応）
L5: AI自律修正（フィードバックループ）
```

---

## 実装詳細

### 1. L1: tsconfig strict（IDE暴走防止）

**目的**: TypeScript Serverを唯一の真実にし、IDE（Cursor/Copilot）の暴走を根本から防ぐ

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    // ========== 厳格モード ==========
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    
    // ========== IDE暴走防止 ==========
    "skipLibCheck": false,  // ❗ 型の不整合をIDEが無視しない
    "forceConsistentCasingInFileNames": true,  // ❗ファイル名事故防止
    
    // ========== any型自動生成防止 ==========
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### `.vscode/settings.json`
```json
{
  // ========== TypeScript Server設定（最重要） ==========
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  
  // ========== IDE自動補完の制御 ==========
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.suggest.snippetsPreventQuickSuggestions": false,
  
  // ========== 型エラーの即時表示 ==========
  "typescript.updateImportsOnFileMove.enabled": "always",
  
  // ========== ESLint統合 ==========
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

### 2. L2: ASTベースCI（AI回避不能）

**目的**: grep で回避できない、構文木レベルの検知

#### `scripts/check-partial.ts`
```typescript
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

// Domain層とFeatures層のみ厳格チェック
const domainFiles = project.getSourceFiles('src/domain/**/*.ts');
const featureFiles = project.getSourceFiles('src/features/**/*.ts');

let violations = 0;

[...domainFiles, ...featureFiles].forEach(file => {
  file.forEachDescendant(node => {
    if (node.getKindName() === 'TypeReference') {
      const typeName = node.getText();
      
      // Partial検知（どんな書き方でも検知）
      if (typeName.includes('Partial<')) {
        console.error(
          `❌ Partial detected: ${file.getFilePath()}:${node.getStartLineNumber()}\n` +
          `   Use Pick<T, 'field1' | 'field2'> instead.`
        );
        violations++;
      }
      
      // any検知（globalThis.any等も検知）
      if (typeName.includes('any') && !node.getLeadingCommentRanges().some(
        comment => comment.getText().includes('@type-audit')
      )) {
        console.error(
          `❌ any type detected: ${file.getFilePath()}:${node.getStartLineNumber()}\n` +
          `   Use unknown + type guard instead.`
        );
        violations++;
      }
    }
  });
});

if (violations > 0) {
  console.error(`\n❌ Found ${violations} type safety violations.`);
  process.exit(1);
}

console.log('✅ Type safety check passed.');
```

#### `package.json`
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:strict": "tsc --noEmit --strict",
    "type-check:ast": "ts-node scripts/check-partial.ts"
  },
  "devDependencies": {
    "ts-morph": "^21.0.0"
  }
}
```

---

### 3. L3: 層別ルール（Domain厳格、DTO緩和）

#### 層別型安全性ポリシー

| 層 | Partial | any | unknown | 理由 |
|---|---|---|---|---|
| **Domain** | ❌ 禁止 | ❌ 禁止 | ✅ 許可 | 業務ロジックの中核 |
| **Features** | ❌ 禁止 | ❌ 禁止 | ✅ 許可 | L1-L3実装層 |
| **API DTO** | ⚠️ 警告 | ⚠️ 警告 | ✅ 許可 | 外部境界 |
| **Types** | ❌ 禁止 | ❌ 禁止 | ✅ 許可 | 型定義 |

---

### 4. L4: 証跡管理（監査対応）

**目的**: 例外を許可する場合も、必ず記録を残す

#### 証跡コメント規約
```typescript
// ✅ 許可される any（外部ライブラリ由来）
// @type-audit: external-library (MF Cloud API v2.1)
// @approved-by: human-reviewer
// @reason: Vendor SDK の型定義が不完全
type VendorResponse = any;

// ✅ 許可される eslint-disable（Phase 2未実装）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @type-audit: phase2-scheduled (2026-Q2)
// @approved-by: architect
static toFreee(code: string): string {
  throw new Error('Phase 2 implementation');
}
```

---

### 5. L5: AI自律修正（フィードバックループ）

**目的**: AIが自ら正しい書き方を学習する

#### `docs/CONVENTIONS.md`
```markdown
# 型安全性規約（AI必読）

## ❌ 禁止パターン

### 1. Partial + フォールバック値
```typescript
// ❌ 禁止
const client: Partial<Client> = data;
const name = client.name || 'Unknown';  // サイレント障害の温床
```

### 2. any型
```typescript
// ❌ 禁止
function process(data: any) { }
```

### 3. status フィールドの無視
```typescript
// ❌ 禁止
type Client = {
  id: string;
  name: string;
  // status がない → 監査不能
};
```

## ✅ 正しいパターン

### 1. Pick + 明示的null処理
```typescript
// ✅ 正しい
const client: Pick<Client, 'id' | 'name'> = data;
if (!client.name) {
  throw new Error('name is required');
}
```

### 2. unknown + 型ガード
```typescript
// ✅ 正しい
function process(data: unknown) {
  if (isClient(data)) {
    // ここは安全
    console.log(data.name);
  }
}

function isClient(data: unknown): data is Client {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}
```

### 3. status フィールドの必須化
```typescript
// ✅ 正しい
type Client = {
  id: string;
  status: 'Draft' | 'Submitted' | 'Approved';
  name: string;
};
```
```

---

## CI/CD実装

### GitHub Actions（最終版）

`.github/workflows/type-safety.yml`:
```yaml
name: Type Safety Policy Gate

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  type-safety-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
      
      # ========== HARD FAIL: TypeScript型チェック ==========
      - name: TypeScript type check
        run: npm run type-check
      
      # ========== HARD FAIL: ASTベースPartial検知 ==========
      - name: AST-based type check
        run: npm run type-check:ast
      
      # ========== HARD FAIL: Domain層厳格チェック ==========
      - name: Domain layer strict check
        run: |
          if grep -r "Partial<\|:\s*any" src/domain src/features | grep -v "@type-audit"; then
            echo "❌ Prohibited types in domain/features layer"
            exit 1
          fi
          echo "✅ Domain layer check passed"
      
      # ========== WARN: DTO層警告 ==========
      - name: DTO layer warning check
        continue-on-error: true
        run: |
          grep -r ":\s*any" src/api 2>/dev/null > dto-any.log || true
          if [ -s dto-any.log ]; then
            echo "⚠️ Warning: any types found in API layer"
            cat dto-any.log
          fi
      
      # ========== HARD FAIL: 証跡コメントなしのany ==========
      - name: Audit comment check
        run: |
          if grep -r ":\s*any" src | grep -v "@type-audit" | grep -v "node_modules"; then
            echo "❌ any type without @type-audit comment"
            exit 1
          fi
          echo "✅ All any types have audit comments"
      
      # ========== 証跡保存 ==========
      - name: Save audit logs
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: type-audit-logs
          path: "*.log"
```

---

## 禁止事項（6項目）

| 禁止項目 | 影響 | 検知方法 |
|---------|------|---------|
| **1. Partial + フォールバック値** | 型契約破壊 | AST + CI |
| **2. any型（実装済み機能）** | 型システム無効化 | AST + CI |
| **3. status フィールド無視** | 監査不能 | レビュー |
| **4. Zodスキーマでのany** | スキーマ破壊 | AST + CI |
| **5. 型定義ファイルでのany** | インターフェース破壊 | AST + CI |
| **6. 型定義の二重管理** | 型衝突 | レビュー |

---

## 許可事項（3項目）

| 許可項目 | 条件 | 証跡 |
|---------|------|------|
| **1. eslint-disable（未実装）** | Phase 2未実装関数のみ | `@type-audit: phase2-scheduled` |
| **2. unknown型の使用** | 型ガードと組み合わせ | 不要 |
| **3. Pick/Omit等** | 明示的な型定義 | 不要 |

---

## Consequences（影響）

### 正の影響

| 観点 | 効果 |
|------|------|
| **型安全性破壊リスク** | 95%削減（推定） |
| **監査対応** | 完全な証跡管理 |
| **開発生産性** | 維持（層別ルールにより） |
| **AI学習** | フィードバックループで改善 |

### 負の影響

| 観点 | 影響 | 対策 |
|------|------|------|
| **CI実行時間** | +1-2分 | 許容範囲 |
| **初回セットアップ** | 30分 | 一度のみ |
| **学習コスト** | 中 | CONVENTIONS.md で軽減 |

---

## 実装チェックリスト

### Phase 1: 基盤構築（30分）

- [ ] `tsconfig.json` の strict化
- [ ] `.vscode/settings.json` の作成
- [ ] `docs/CONVENTIONS.md` の作成
- [ ] `package.json` にスクリプト追加

### Phase 2: CI/CD構築（30分）

- [ ] `scripts/check-partial.ts` の作成
- [ ] `.github/workflows/type-safety.yml` の作成
- [ ] `ts-morph` のインストール
- [ ] CI動作確認

### Phase 3: 運用開始（継続）

- [ ] 既存コードの段階的修正
- [ ] AI生成コードのレビュー
- [ ] 証跡ログの定期確認

---

## 参照ドキュメント

- [complete_evidence_no_cover_up.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/complete_evidence_no_cover_up.md) - 型安全性破壊の証拠
- [ADR-001: 型安全マッピング戦略](./ADR-001-type-safe-mapping.md)
- [ADR-009: シンプルアーキテクチャへの回帰](./ADR-009-simple-architecture.md)

---

**End of Document**

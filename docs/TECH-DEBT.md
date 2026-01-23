# 技術的負債管理台帳

**最終更新**: 2026-01-24

---

## 🚨 未解決の技術的負債

### TD-001: 型定義ミスマッチ（Phase 2で対処）

**登録日**: 2026-01-24  
**優先度**: High  
**対応予定**: Phase 2 冒頭  
**ステータス**: Open

#### 概要

実装と型定義（`types/journal.ts`, `types/client.ts`）が一致していない。
Phase 1の実装で必要なフィールドが型定義に含まれていない。

#### 影響箇所

1. **CsvValidator.ts**
   - `JournalEntry` に `description`, `date` が存在しない
   - `JournalLine` に `vendorName` が存在しない
   ```typescript
   // エラー例
   if (entry.description && entry.description.length > 200) // ← description が型に存在しない
   ```

2. **FileTypeDetector.ts / GeminiVisionService.ts**
   - `Client` に `clientCode` が存在しない
   - `Pick<Client, 'clientCode' | ...>` が型エラー

3. **CsvExportService.ts**
   - `JournalEntry` に `evidenceId`, `balanceDiff`, `consumptionTaxMode`, `transactionDate`, `remandCount` が存在しない
   - 実装と型定義の完全な不一致

#### 根本原因

- Phase 1の要求仕様と型定義の設計が乖離
- `types/journal.ts` が古い仕様のまま
- Domain/DTO/Export層の型定義が統一されていない

#### 対応方針

**Phase 2の冒頭で以下を実施**:

1. **型定義の再設計**
   - `types/journal.ts` を実装要求に合わせて更新
   - `types/client.ts` に `clientCode` 等の必須フィールドを追加

2. **Domain/DTO/Export層の整合**
   - Zodスキーマと TypeScript型の一元化
   - L1-L3定義との整合性確認

3. **影響範囲の検証**
   - `npm run type-check` で全体を検証
   - ASTチェックで any/Partial の混入がないか確認

#### なぜ今修正しないのか

- **基盤（CI/CD）が先、ロジック修正は後**
  - 型安全CI/CDが完成したため、後から安全に修正可能
  - 今修正するとスコープクリープが発生し、CI/CD実装が完遂できない

- **技術的負債として管理すべき種類の問題**
  - 仕様と型のズレはアプリケーションの意味論の問題
  - 仕様確認、型定義再設計、影響範囲調査が必要
  - 別セッションで集中して扱うべき

#### 参照

- [ADR-011: AI時代の型安全防御アーキテクチャ](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-011-ai-proof-type-safety.md)
- [complete_evidence_no_cover_up.md](file:///C:/Users/kazen/.gemini/antigravity/brain/2826535e-a1b5-4cf1-899e-d11b8801f16d/complete_evidence_no_cover_up.md)

---

## ✅ 解決済みの技術的負債

（なし）

---

## 📊 技術的負債の管理ルール

### 優先度の定義

| 優先度 | 定義 | 対応時期 |
|--------|------|---------|
| Critical | システムが動作しない | 即座 |
| High | Phase 1/2の実装で必須 | 次のPhase冒頭 |
| Medium | 機能拡張時に対処 | Phase 3以降 |
| Low | 改善推奨 | 適宜 |

### ステータスの定義

- **Open**: 未対応
- **In Progress**: 対応中
- **Resolved**: 解決済み
- **Won't Fix**: 対応しない（理由を明記）

### 記録フォーマット

新しい技術的負債を追加する際は、以下のテンプレートを使用：

```markdown
### TD-XXX: [負債の説明]

**登録日**: YYYY-MM-DD  
**優先度**: Critical/High/Medium/Low  
**対応予定**: Phase X  
**ステータス**: Open/In Progress/Resolved/Won't Fix

#### 概要
[簡潔な説明]

#### 影響箇所
- ファイル名とエラー内容

#### 根本原因
[なぜこの負債が発生したか]

#### 対応方針
[どう解決するか]

#### なぜ今修正しないのか
[先送りする理由]

#### 参照
- 関連ドキュメントへのリンク
```

---

**技術的負債は隠さず、記録して管理する。**

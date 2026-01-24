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

### TD-002: 既存ファイルの型エラー（Phase 2以降で対処）

**登録日**: 2026-01-24  
**優先度**: Medium  
**対応予定**: Phase 2以降（個別ファイルごとに対応）  
**ステータス**: Open

#### 概要

TD-001（Journal System関連）の修正以前から存在していた、他のファイルの型エラー。
これらはStep 3（Journal System）の実装とは無関係の既存エラーである。

#### 影響箇所

**確認されているエラー**:

1. **src/AaaLayout.vue (L94)**
   - エラー: `TS2724: '@/composables/useAIModels' does not exist on type 'Promise<AIProvider>'`
   - 原因: composablesの型定義またはインポート問題

2. **src/api/lib/ai/strategy/ZuboraLogic.ts**
   - L75: 型エラー（詳細不明）
   - L102: 型エラー（詳細不明）
   - L156: 型エラー（詳細不明）
   - 原因: ZuboraLogic実装時の型定義不足

3. **src/api/routes/ai-models.ts (L12)**
   - エラー: `TS2339: Property does not exist`
   - 原因: AI models APIの型定義不足

4. **src/api/routes/admin.ts (L90)**
   - エラー: `TS7030: Not all code paths return a value`
   - 原因: 関数の戻り値が不完全

**合計**: 約6-10件のエラー（詳細は`npm run type-check`で確認可能）

#### 根本原因

- Screen E（Journal System）以外の機能は未完成
- 過去の実装でTypeScript型チェックを完全に通していなかった
- ADR-011（型安全防御）実装前の古いコード

#### 対応方針

**Phase 2以降で個別に対応**:

1. **優先度付け**
   - Critical: システムが動作しない → 即座
   - High: Phase 2で使用する機能 → Phase 2冒頭
   - Medium: 使用しない機能 → 適宜

2. **ファイル別対応**
   - AaaLayout.vue: composables修正
   - ZuboraLogic.ts: 型定義追加
   - ai-models.ts: API型定義整備
   - admin.ts: 戻り値修正

3. **検証**
   - 各ファイル修正後に`npm run type-check`で確認
   - ASTチェック（`npm run type-check:ast`）も実施

#### なぜ今修正しないのか

**スコープ外判定の理由**:

1. **Step 3（Journal System）とは無関係**
   - これらのエラーはJournal System実装前から存在
   - TD-001修正の対象外

2. **優先度の判断**
   - Journal Systemは動作している
   - 既存エラーは他機能の問題で、Phase 1で使用しない

3. **技術的負債として管理すべき**
   - 各ファイルの仕様確認が必要
   - 個別に対応すべき（一括修正は危険）

#### 参照

- [TD-001: 型定義ミスマッチ](#td-001-型定義ミスマッチphase-2で対処)（Journal System関連）
- [ADR-011: AI時代の型安全防御アーキテクチャ](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-011-ai-proof-type-safety.md)

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

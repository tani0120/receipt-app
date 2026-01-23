<!--  ═══════════════════════════════════════════════════════════════════════════ -->
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
-->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

# 必読ファイルマスター

**作成日**: 2026-01-16  
**最終更新**: 2026-01-24  
**ステータス**: Active  
**配置**: プロジェクトディレクトリ（全セッション共有）  
**関連ファイル**: PROJECT_INDEX.md, session-management-protocol-complete.md  
**目的**: 「何を読めばいいか」を一箇所で管理（発見可能性の確保）

---

## セッション開始時（必須）

**新規セッション・前回からの続き問わず必読**:

1. [READING_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/READING_INDEX.md) - このファイル（必読ファイルマスター）
2. [TASK_MASTER.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md) - 現在のタスク・進行状況
3. [session-management-protocol-complete.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md) - セッション管理プロトコル
4. [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md) - システム哲学（存在する場合）
5. [CHANGELOG_SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CHANGELOG_SYSTEM_PHILOSOPHY.md) - 変更履歴（存在する場合）

**前回セッションからの続きの場合のみ**:
6. [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md)
7. 該当の SESSION_YYYYMMDD.md
8. **[UNRESOLVED_DISCUSSIONS.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/UNRESOLVED_DISCUSSIONS.md)** - 未解決議論の確認

**重要プロトコル**:
9. **[Phase/Step/Milestone提示プロトコル](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md#L178-L355)** - 必ず全体像を提示（セクション1.7）

**最新セッション（2026-01-21）**:
9. [SESSION_20260121.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260121.md) - Firebase認証完了、プロトコル改善

**用語定義**:
10. [TERMINOLOGY.md](file:///C:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/TERMINOLOGY.md) - プロジェクト用語定義（Phase/Step等）

---

## ADR（随時参照）

### 基幹ADR（すべての基礎）

1. [ADR-001: 型安全マッピング戦略](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)
2. [ADR-002: 段階的UI実装](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)
3. [ADR-003: ファイル整理戦略](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md)

### Penta-Shield関連ADR

4. [ADR-004: Penta-Shield（5層防御）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md) ⚠️ Superseded by ADR-009
5. [ADR-005: 防御層実装詳細（L1/L2/L3）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md) ⚠️ Superseded by ADR-009
6. [ADR-006: UI・CI統合（L4/L5）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md) ⚠️ Superseded by ADR-009
7. [ADR-007: Human Use-Case Table形式](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-007-human-usecase-table.md)
8. [ADR-008: MVP戦略（小さく開発への方針転換）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-008-mvp-strategy.md) ⚠️ Superseded by ADR-009
9. [ADR-009: シンプルアーキテクチャへの回帰](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-009-simple-architecture.md) ✅ **現行**
10. [ADR-010: AI API移行戦略（Gemini API → Vertex AI）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-ai-api-migration.md) ✅ **現行**
    - [Part1: 環境比較](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part1-environment-comparison.md)
    - [Part2: 実装手順](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part2-implementation.md)
    - [Part3: チェックリスト](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part3-checklist.md)
    - [Part4: コスト・セキュリティ](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-010-Part4-cost-security.md)

---

## トピック別インデックス

### Penta-Shield関連

**必読順序**:
1. [ADR-004](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md) - 全体定義、Staged Freeze Model、AI矯正ログ
2. [ADR-005](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md) - L1/L2/L3実装
3. [ADR-006](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md) - L4/L5/UI/CI
4. [TASK_MASTER.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/TASK_MASTER.md) - AI Rejection Log、Phase 6 Human Pain Log

**実装コード**:
- `src/features/receipt/` - Receipt L1-L3
- `src/features/client/` - Client L1-L3
- `src/features/job/` - Job L1-L3
- `src/features/staff/` - Staff L1-L3

---

### ファイル管理プロトコル関連

**必読順序**:
1. [session-management-protocol-complete.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md) - 全プロトコル
2. [PROJECT_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/PROJECT_INDEX.md) - ファイル網羅
3. [READING_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/READING_INDEX.md) - このファイル

---

## インデックスファイル階層

```
READING_INDEX.md（このファイル）
  ├─ session-management-protocol-complete.md（プロトコル本体）
  ├─ PROJECT_INDEX.md（ファイル網羅）
  ├─ SESSION_INDEX.md（セッション一覧）
  └─ ADR-001〜006
```

---

## 更新ルール

**このファイルを更新すべきとき**:
- 新しいADRが作成された
- 重要なトピックができた
- ファイル構造が変更された

**更新者**: AI（セッション終了時）

---

## 更新履歴

- **2026-01-22**: ADR-008（MVP戦略）追加、最終更新日更新
- **2026-01-17**: セッション開始時必読ファイルを最新化（READING_INDEX.md、TASK_MASTER.md を最優先に）
- **2026-01-17**: AI矯正ログ、Staged Freeze Model反映
- **2026-01-17**: プロジェクトディレクトリに移行、session-management-protocol-complete.mdのパス更新
- **2026-01-16**: 初版作成（brain/129dd3c2）

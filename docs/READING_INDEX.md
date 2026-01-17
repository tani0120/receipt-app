# 必読ファイルマスター

**作成日**: 2026-01-16  
**最終更新**: 2026-01-17  
**ステータス**: Active  
**配置**: プロジェクトディレクトリ（全セッション共有）  
**関連ファイル**: PROJECT_INDEX.md, session-management-protocol-complete.md  
**目的**: 「何を読めばいいか」を一箇所で管理（発見可能性の確保）

---

## セッション開始時（必須）

**新規セッション・前回からの続き問わず必読**:

1. [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md)
2. [CHANGELOG_SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CHANGELOG_SYSTEM_PHILOSOPHY.md)
3. [session-management-protocol-complete.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md)

**前回セッションからの続きの場合のみ**:
4. [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md)
5. 該当の SESSION_YYYYMMDD.md

---

## ADR（随時参照）

### 基幹ADR（すべての基礎）

1. [ADR-001: 型安全マッピング戦略](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)
2. [ADR-002: 段階的UI実装](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)
3. [ADR-003: ファイル整理戦略](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md)

### Penta-Shield関連ADR

4. [ADR-004: Penta-Shield（5層防御）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md)
5. [ADR-005: 防御層実装詳細（L1/L2/L3）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md)
6. [ADR-006: UI・CI統合（L4/L5）](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md)

---

## トピック別インデックス

### Penta-Shield関連

**必読順序**:
1. [ADR-004](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md) - 全体定義
2. [ADR-005](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md) - L1/L2/L3実装
3. [ADR-006](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md) - L4/L5/UI/CI

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

- **2026-01-17**: プロジェクトディレクトリに移行、session-management-protocol-complete.mdのパス更新
- **2026-01-16**: 初版作成（brain/129dd3c2）

# プロジェクトマスターインデックス

**作成日**: 2026-01-16  
**最終更新**: 2026-01-17  
**ステータス**: Active  
**配置**: プロジェクトディレクトリ（全セッション共有）  
**関連ファイル**: READING_INDEX.md, SESSION_INDEX.md  
**目的**: プロジェクト全体のファイル網羅性を確保

---

## ADR（Architecture Decision Records）

| ADR | タイトル | 作成日 | 最終更新 | ステータス |
|-----|---------|--------|---------| -----------|
| [ADR-001](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md) | 型安全マッピング戦略 | 不明 | 不明 | ✅ Active |
| [ADR-002](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md) | 段階的UI実装 | 不明 | 不明 | ✅ Active |
| [ADR-003](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md) | ファイル整理戦略 | 2026-01-16 | 2026-01-17 | ✅ Active |
| [ADR-004](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-004-penta-shield-defense-layers.md) | Penta-Shield（5層防御） | 2026-01-16 | 2026-01-16 | ✅ Active |
| [ADR-005](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md) | 防御層実装詳細（L1/L2/L3） | 2026-01-16 | 2026-01-16 | ✅ Active |
| [ADR-006](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-006-ui-ci-integration.md) | UI・CI統合（L4/L5） | 2026-01-16 | 2026-01-16 | ✅ Active |

---

## 実装済みエンティティ

| エンティティ | 実装日 | 最終更新 | ステータス | Phase | ファイル数 |
|------------|--------|---------|-----------|-------|----------|
| Receipt | 2026-01-16 | 2026-01-16 | ✅ Frozen | Phase 1完了 | 9 |
| Client | 2026-01-16 | 2026-01-16 | ✅ Frozen | Phase 3完了 | 5 |
| Job | 2026-01-16 | 2026-01-16 | ✅ Frozen | Phase 3完了 | 5 |
| Staff | 2026-01-16 | 2026-01-16 | ✅ Frozen | Phase 3完了 | 5 |

**合計**: 4エンティティ、24ファイル

---

## セッション記録

| 日付 | 主な成果 | git commit | ファイル |
|------|---------|-----------|---------|
| 2026-01-15 | セッション管理プロトコル確立 | - | [SESSION_20260115.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260115.md) |
| 2026-01-16 | Penta-Shield Phase 1-3完了 | 4c1ea0b, df6fb27, dbf270a | [SESSION_20260116.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260116.md) |
| 2026-01-17 | プロトコル統合、ファイル整理 | 43e9179, 570f192 | [SESSION_20260117.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_20260117.md) |
| 2026-01-17 | ADR-003 Phase 2-3完遂 | fa92afd, bfa20c3 | - |

---

## プロジェクトディレクトリ（docs/）

### 重要ドキュメント

| ファイル | 作成日 | 最終更新 | 用途 |
|---------|--------|---------|------|
| [session-management-protocol-complete.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/session-management-protocol-complete.md) | 2026-01-15 | 2026-01-17 | セッション管理の全プロトコル |
| [SYSTEM_PHILOSOPHY.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/SYSTEM_PHILOSOPHY.md) | 不明 | 2026-01-16 | システムの本質・哲学 |
| [CANONICAL_SOURCES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CANONICAL_SOURCES.md) | 不明 | 不明 | 正史ファイル一覧 |
| [SESSION_INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/sessions/SESSION_INDEX.md) | 2026-01-15 | 2026-01-17 | セッション一覧 |

---

## 統計

**ADR**: 6件  
**実装エンティティ**: 4個  
**実装ファイル**: 24件  
**セッション記録**: 4件  
**git commits**: 7回

---

## 更新履歴

- **2026-01-17**: プロジェクトディレクトリに移行、ADR-003 Phase 2-3完了、セッション17記録追加
- **2026-01-16**: 初版作成（brain/129dd3c2）、Phase 1-3完了時点の全ファイルを登録

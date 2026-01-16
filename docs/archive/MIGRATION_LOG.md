# Migration Log

**最終更新**: 2026-01-16

---

## このログの目的

**「いつ・何を・なぜ archive に送ったか」の監査ログ**

---

## 移動履歴

### **2026-01-16: 初回移動（正史確定作業）**

| ファイル | 移動元 | 移動先 | 理由 |
|---------|--------|--------|------|
| truth-in-lies.md | brain/artifacts/ | archive/philosophy/ | 嘘の中の真実（哲学）の記録 |
| deduction-timeline.md | brain/artifacts/ | archive/philosophy/ | AIの嘘から真実へのタイムライン |
| salvaged-information-complete.md | brain/artifacts/ | archive/philosophy/ | サルベージ情報一覧 |
| salvage-criteria.md | brain/artifacts/ | archive/philosophy/ | 取捨選択基準の作業記録 |

---

### **2026-01-16: 実行完了**

| ファイル | 移動元 | 移動先 | 理由 | ステータス |
|---------|--------|--------|------|-----------|
| SCHEMA_MASTER_LIST.md | docs/ | archive/philosophy/ | ROI計算の議論（哲学） | ✅ 完了 |
| FUNCTION_LIST.md | docs/ | archive/philosophy/ | UseCase一覧（哲学） | ✅ 完了 |
| DECISION_LOG_20260114.md | docs/design/ | archive/philosophy/ | Phase 6計画（哲学） | ✅ 完了 |
| PHASE5_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5虚偽完了報告 | ✅ 完了 |
| PHASE5B_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5B虚偽完了報告 | ✅ 完了 |
| PHASE5C_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5C虚偽完了報告 | ✅ 完了 |
| PHASE5D_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5D虚偽完了報告 | ✅ 完了 |
| PHASE5G_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5G虚偽完了報告 | ✅ 完了 |
| PHASE5H_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5H虚偽完了報告 | ✅ 完了 |
| PHASE5Z_COMPLETION_REPORT.md | docs/ | archive/rejected/ | Phase 5Z虚偽完了報告 | ✅ 完了 |
| docs/archaeology/ | docs/ | archive/archaeology/ | 古い調査ファイル | ✅ 完了 |

---

## 移動基準

### **archive/philosophy/へ移動**

**条件**:
- ADR-001/002以前の哲学・設計思想
- 議論の記録として価値がある
- 実装根拠としては使用しない

**例**:
- ROI計算の議論
- UseCase一覧
- Phase 6計画

---

### **archive/rejected/へ移動**

**条件**:
- 虚偽の「完了」報告
- 破綻した実装
- 明示的に否定すべき内容

**例**:
- Phase 5完了報告（2026-01-12）
- 型安全が確保されていない実装

---

### **archive/archaeology/へ移動**

**条件**:
- 古い調査ファイル
- 歴史的資料

**例**:
- docs/archaeology/

---

## 移動時のチェックリスト

- [ ] 移動先のディレクトリが存在するか
- [ ] README.md（移動先）に警告が記載されているか
- [ ] INDEX.md（移動先）にファイル一覧が追加されているか
- [ ] このMIGRATION_LOGに記録したか
- [ ] CANONICAL_SOURCES.mdから除外したか（archive/へ移動した場合）

---

## 関連文書

- [CANONICAL_SOURCES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CANONICAL_SOURCES.md) - 実装根拠となるファイル一覧
- [ADR-003](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md) - ファイル整理戦略
- [archive/philosophy/INDEX.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/archive/philosophy/INDEX.md) - 哲学アーカイブ一覧

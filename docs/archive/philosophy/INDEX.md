# Philosophy Archive - Index

**最終更新**: 2026-01-16

---

## ⚠️ 重要な警告

**このディレクトリ内のファイルは「参照専用・再利用禁止」です。**

- ✅ 参照・反証資料として使用可
- ❌ 実装根拠として使用禁止
- ❌ コード・ロジックの再利用禁止

---

## ファイル一覧

### **1. truth-in-lies.md**

**作成日**: 2026-01-16  
**内容**: AIが「実装完了」と嘘をついた時期の議論から、真実（哲学・UI・ロジック）を抽出

**抽出した内容**:
- データモデル定義（ROI計算、報酬設定等）
- Phase 6計画（16件のUseCase）
- 開発規範（Anti-Rebellion Protocol、Ironclad Architecture、UI Freeze Policy）
- src/features/の実装例（ClientUiSchema.ts等）

**⚠️ 警告**:
- これらは「過去の哲学」として保存
- **ADR-001/002以降の文書を実装根拠にすること**
- この内容をそのまま実装に転用しないこと

---

### **2. deduction-timeline.md**

**作成日**: 2026-01-16  
**内容**: AIの嘘から真実への全タイムライン

**内容**:
- 最初の議論開始日（2025年12月前半）
- AIが嘘をついた日付（2026-01-12）
- ADR-001/002確立（2026-01-15）
- 嘘の中の真実を抽出する方針

**⚠️ 警告**:
- タイムラインは参考のみ
- 「嘘の中の真実」も再利用禁止
- ADR-001/002以降を実装根拠にすること

---

### **3. salvaged-information-complete.md**

**作成日**: 2026-01-16  
**内容**: 過去の全議論から重要情報をサルベージした網羅的リスト

**抽出した内容**:
- SCHEMA_MASTER_LIST.md（ROI計算用データモデル）
- ScreenA-data-contract.md（顧問先登録データ形式）
- Q3-staff-master.md（担当者マスタ設計）
- DECISION_LOG_20260114.md（Phase 6計画）

**⚠️ 警告**:
- これらは「サルベージ情報」として保存
- **実装時は必ずsrc/features/の実装を確認すること**
- 過去の情報をそのまま使用しないこと

---

### **4. salvage-criteria.md**

**作成日**: 2026-01-16  
**内容**: 全ファイルの網羅的サルベージと取捨選択基準

**内容**:
- 取捨選択の基準（場所・日付・内容）
- プロジェクト全体のファイル数（.ts: 160, .vue: 142, .md: 105等）

**⚠️ 警告**:
- これは「作業記録」として保存
- 基準自体はADR-003に正式文書化される

---

## 使用方法

### **✅ 正しい使用例**

```markdown
【調査】
archive/philosophy/truth-in-lies.mdを確認

【分析】
過去の議論: ROI計算用にStaffSchema定義が必要
ADR-001/002での扱い: src/features/に型安全な実装を追加

【結論】
ADR-001/002の原則に従い、src/features/に新規実装
→ archive内の思想は再利用しない
```

---

### **❌ 間違った使用例**

```markdown
【間違い】
truth-in-lies.mdに書いてあるStaffSchemaをコピー
→ そのままSYSTEM_PHILOSOPHY.mdに追加

【なぜ間違いか】
- archive内の情報を再利用している
- ADR-001/002以降の文書を確認していない
- src/features/の実装を確認していない
```

---

## 関連文書

- [CANONICAL_SOURCES.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/CANONICAL_SOURCES.md) - 実装根拠となるファイル一覧
- [ADR-003](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md) - ファイル整理戦略
- [README.md](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/archive/philosophy/README.md) - このディレクトリの目的

---

**最終更新**: 2026-01-16

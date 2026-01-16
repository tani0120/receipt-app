# Philosophy Archive

**このディレクトリは「過去の思考の記録」である。**

---

## ⚠️ 重要な制約

### **禁止事項**

1. **実装根拠として使用してはならない**
2. **設計判断の比較・検証目的でのみ参照可**
3. **新規実装は必ず ADR-001/002 以降の文書を根拠とする**

### **⚠️ この思想をそのままコードに落とすことを禁止する**

---

## このアーカイブの目的

### **✅ 許可される使用**

- 過去の議論を振り返る
- なぜ当時の方法が失敗したかを理解する
- ADR-001/002の設計判断と比較する
- 反証資料として参照する

### **❌ 禁止される使用**

- 「良さそうだから」で実装に転用する
- コードをコピーする
- ロジックを再利用する
- 「この考え方使えるかも」と実装に混ぜる

---

## 正しい利用方法

### **例：過去の思想を参照する場合**

```markdown
【調査】
過去のarchive/philosophy/2025-mapping-idea.mdを確認

【分析】
旧思想: 宣言的マッピング
失敗理由: 型システム外の情報に依存

【ADR-002での扱い】
明示的マッピングオブジェクトのみ許可

【結論】
ADR-002の設計判断が正しいことを再確認
→ archive内の思想は再利用しない
```

---

## ファイルリスト

| ファイル | 内容 | 作成日 |
|---------|------|--------|
| truth-in-lies.md | 嘘の中の真実（哲学抽出） | 2026-01-16 |
| deduction-timeline.md | AIの嘘から真実へのタイムライン | 2026-01-16 |
| salvaged-information-complete.md | サルベージ情報一覧 | 2026-01-16 |

---

## 関連文書

- [ADR-003: Migration Policy](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-003-file-organization-strategy.md)
- [ADR-001: Type Safe Mapping](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-001-type-safe-mapping.md)
- [ADR-002: Gradual UI Implementation](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-002-gradual-ui-implementation.md)

---

**最終更新**: 2026-01-16

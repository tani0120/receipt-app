# Phase B リファクタリング計画

**作成日**: 2026-02-27
**目的**: コードは動作するが構造改善が必要な項目を管理
**解決時期**: Phase B（UI再定義〜構造固定）
**移管元**: `04_mock/task_phase_a.md` §5.1（2026-02-27移管）

---

## 振り分け基準（技術的負債 vs リファクタリング）

| 分類 | 05_technical_debt | 06_refactoring |
|------|-------------------|----------------|
| **性質** | 壊れている（型崩壊・設計違反・データ汚染） | 壊れていないが美しくない |
| **放置リスク** | 高（バグ・精度劣化） | 中（保守性低下） |
| **優先度** | 修正必須 | 余力時 |

---

## A. 型安全の厳格化

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| A1 | `getValue()`の`any`排除 | L1662: `eslint-disable`付き`any` | `keyof`制約 or 列定義型連動方式に書き換え |
| A2 | `non-null assertion (!)`解消 | 12箇所（`commentModalJournal!` 8件 + `staff_notes!` 4件） | computed保証 + `v-if`でガード → `!`不要化 |
| A3 | Domain型強制（ガイド ルール3） | Phase Aでは未適用 | `createMockJournal()`形式必須化 |
| A4 | 生成関数化（ガイド ルール4） | Phase Aでは直書き許容 | `src/mocks/factories/journalFactory.ts`でFactory必須化 |
| A5 | `noUncheckedIndexedAccess`追加 | tsconfig未設定 | 新規コード安定後に追加 |
| A6 | `exactOptionalPropertyTypes`追加 | tsconfig未設定 | 同上 |
| A7 | `noPropertyAccessFromIndexSignature`追加 | tsconfig未設定 | 同上 |
| A8 | `api/components/composables`の`any` 160件修正 | warn状態 | 段階的にerrorへ引き上げ |
| A9 | `unused-vars` 69件削除 | warn状態 | 削除（`@ts-expect-error`不使用） |

---

## B. コンポーネント分離

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| B1 | CellComponent分離 | 全10列が`JournalListLevel3Mock.vue`に直書き | `PhotoCell`, `CommentCell`, `NeedActionCell`等に分離 |
| B2 | `getCellComponent`方式導入 | v-if連鎖 | `cellComponents: Record<string, Component>` + 動的`<component :is>` |
| B3 | モーダル分離 | コメントモーダル・画像プレビュー等がVue内 | 各モーダルを独立コンポーネントに |
| B4 ②④⑤ | staff_notes分離（構造改善部分） | staff_notesとlabels混在 | ② NEED_*を`JournalLabelPhase5`型から削除 ④ Vueフィルタの参照先をstaff_notesに変更 ⑤ 全動作検証 |

> [!NOTE]
> B4①③（`syncLabelsFromStaffNotes`廃止 + fixture汚染データ除去）は設計違反のため [technical_debt_phase_b.md](file:///C:/dev/receipt-app/docs/genzai/05_technical_debt/technical_debt_phase_b.md) B-13, B-14 で管理。

---

## C. データ・Fixture管理

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| C1 | Fixture完全凍結 | Phase Aでは1-2件変更可 | 凍結。新規はFactory経由のみ |
| C2 | 拡張型のDomain型統合 | `journal_extensions.ts`分離 | `JournalEntry`本体に統合 → `journal_extensions.ts`削除 |

---

## D. ESLint・ビルド

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| D1 | `unsafe/` import制限の物理ルール | 未設定 | `unsafe/`→`data/` `components/`へのimport→error |
| D2 | `unsafe/`以外の`any`→error | 現状warn | error化 |
| D3 | `as any`→error | 現状warn | error化 |
| D4 | flat config (`eslint.config.js`) 移行 | 旧形式 | Phase B以降で移行 |

---

## F. 文書整備

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| F1 | ルール文書にPhase B移行チェックリスト追加 | 移行条件は§1に記載あるが詳細なし | 本一覧をルール文書に組み込み |
| F2 | `non-null assertion`禁止ルール明文化 | 暗黙の許容 | 「新規`!`追加禁止」をルール§4に追加 |

---

## G. UI追加機能

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| G1 | 列表示ON/OFF | 未実装 | ユーザーが列を非表示にする機能 |
| G2 | カラムグループ化 | 未実装 | 借方/貸方のグループヘッダー（**必須**） |

---

## チェックリスト

- [ ] A1: getValue() any排除
- [ ] A2: non-null assertion解消 (12箇所)
- [ ] A3: Domain型強制
- [ ] A4: Factory必須化
- [ ] A5-A7: tsconfig厳格化3オプション
- [ ] A8: any 160件 warn→error
- [ ] A9: unused-vars 69件削除
- [ ] B1: CellComponent分離
- [ ] B2: getCellComponent方式導入
- [ ] B3: モーダル分離
- [ ] B4②④⑤: staff_notes構造改善
- [ ] C1: Fixture凍結
- [ ] C2: journal_extensions.ts統合・削除
- [ ] D1-D4: ESLint設定強化4件
- [ ] F1: ルール文書にチェックリスト追加
- [ ] F2: non-null assertion禁止明文化
- [ ] G1: 列表示ON/OFF
- [ ] G2: カラムグループ化（必須）

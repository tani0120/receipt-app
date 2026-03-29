# Phase B 技術的負債

**作成日**: 2026-02-27
**目的**: テスト精度・学習ロジック・UI挙動に影響する負債を管理
**解決時期**: Phase B完了前（UI再定義〜学習ロジック設計）

---

## 振り分け基準（Phase B / C 共通）

| 分類 | Phase B | Phase C |
|------|---------|---------|
| **性質** | テスト精度・挙動に影響 | アーキテクチャ・型統一・本番化 |
| **放置リスク** | 中（精度測定が歪む） | 高（構造崩壊） |
| **対象** | 精度改善、学習ロジック、警告ロジック、軽微整合 | スキーマ統一、型移行、RPC実装、as any全除去、API層zod整合 |
| **判断基準** | Run B〜学習ロジック設計に影響するか？ | 本番昇格に必要か？ |

---

## 🔴 B-1: handwritten_flag 判定精度改善

- **現状**: 3値enum化完了（`NONE`/`NON_MEANINGFUL`/`MEANINGFUL`）、domain層に定義済み
- **残課題**: Run B実行後に精度を計測し、Geminiプロンプトの判定基準を調整する
- **影響**: 手書きメモ検出精度がベースラインに直結
- **解決条件**: Run B精度レポートで`handwritten_flag`の正答率を確認後

---

## 🔴 B-2: 学習ロジック未定義

- **現状**: 設計未着手
- **必要な定義**:
  - `merchant_normalized`戦略（正規化ルール）
  - 摘要正規化ルール
  - 期間ラベル（YYYY/MM）の意味
  - 同一取引定義
- **影響**: Phase C実装時に設計なしで実装すると破綻する
- **解決条件**: Run B精度レポート確認後に設計着手

---

## 🔴 B-3: UI再定義に伴う警告表示ロジック

- **現状**: 警告ラベル22種のdomain型定義済み、パイプライン対応表更新済み
- **残課題**:
  - アイコン列の確定
  - rowspan複合仕訳表示の確定
  - 💳表示ロジックの確定
  - 🟡警告発火条件の確定
- **影響**: UIがdomainのラベル情報を正しく表示できるかの検証に必要
- **解決条件**: UI再定義フェーズで確定

---

## 🟠 B-4: ground_truth.ts HandwrittenFlag文字列ハードコード

- **ファイル**: [ground_truth.ts](file:///C:/dev/receipt-app/src/scripts/ground_truth.ts)
- **問題**:
  - L335: 型定義が`'NONE' | 'NON_MEANINGFUL' | 'MEANINGFUL'`文字列リテラル直書き → domain層の`HandwrittenFlag`型をimportすべき
  - L381, L426, L471, L497, L558: 5箇所で`'NONE'`/`'NON_MEANINGFUL'`を文字列ハードコード → `HandwrittenFlag.NONE`等の定数参照にすべき
- **影響**: enum値変更時に静かに壊れる（classify_postprocess.tsは修正済みだがground_truth.tsは未修正）
- **解決策**: `HandwrittenFlag`型と定数をdomain層からimportして使用

---

## � B-5: classify_test.ts HandwrittenFlag文字列比較

- **ファイル**: [classify_test.ts](file:///C:/dev/receipt-app/src/scripts/classify_test.ts) L337
- **問題**: `geminiResult.handwritten_flag !== 'NONE'` — 文字列直接比較
- **影響**: enum値変更時に検出が壊れる
- **解決策**: `HandwrittenFlag.NONE`定数参照に変更

---

## � B-6: ai-rules.ts `actions`型不整合

- **ファイル**: [ai-rules.ts](file:///C:/dev/receipt-app/src/api/routes/ai-rules.ts) L32, L45, L59
- **問題**: mockデータに`actions`プロパティがあるが`LearningRuleUi`型に未定義
- **影響**: コンパイルエラー（strictモード）
- **解決策**: `LearningRuleUi`に`actions`を追加するか、mockから`actions`を削除してUI側で生成する
- **判断基準**: Screen Dの仕様確定時に決定

---

## 🟡 B-7: ai-rules.ts `undefined`安全性

- **ファイル**: [ai-rules.ts](file:///C:/dev/receipt-app/src/api/routes/ai-rules.ts) L151, L156-157, L192
- **問題**: `rules[index]`が`T | undefined`。`findIndex`で-1チェック済みだが、TypeScript的にundefinedガードが必要
- **解決策**: 早期returnパターンで対処

---

## 🟡 B-8: JobService.ts `snapshot`未使用

- **ファイル**: [JobService.ts](file:///C:/dev/receipt-app/src/services/JobService.ts) L42
- **問題**: `onSnapshot`コールバック内で`snapshot`引数が未使用（mockのみ返却）
- **解決策**: mock分岐除去時に自然解決

---

## 🟡 B-9: useBankLogic.ts マジックナンバー

- **ファイル**: [useBankLogic.ts](file:///C:/dev/receipt-app/src/composables/useBankLogic.ts) L60
- **問題**: `0.7 + (keywordMatchCount * 0.1)` — 信頼度係数がマジックナンバー
- **解決策**: 定数化（`BANK_CONFIDENCE_BASE`, `BANK_CONFIDENCE_INCREMENT`等）

---

## 🟡 B-10: transformToJournalMock.ts scripts→mocks依存（残存1件）

- **ファイル**: [transformToJournalMock.ts](file:///C:/dev/receipt-app/src/scripts/transformToJournalMock.ts) L13
- **問題**: `import type { JournalPhase5Mock } from '@/mocks/types/...'` — scripts→mocks依存が1件残存
- **解決策**: Phase Cで`JournalPhase5Mock`が本番型に昇格する際にdomain層へ移動

---

## 🟡 B-11: transformToJournalMock.ts VALID_JOURNAL_LABELS手動管理

- **ファイル**: [transformToJournalMock.ts](file:///C:/dev/receipt-app/src/scripts/transformToJournalMock.ts) L171-180
- **問題**: `VALID_JOURNAL_LABELS`が文字列Setで手動管理。`JournalLabel`型と二重管理になっている。ラベル追加時に両方を更新する必要がある
- **解決策**: `JournalLabel`をconst+typeパターンに変更してobjectのキーからSetを自動生成する、または実行時検証でenumの網羅性を保証する仕組みを導入

---

## 🟡 B-12: 計画的TODO（Phase B対象 4件）

以下は計画済み・問題なしと判定されたが、Phase B中に対処するTODO:

| ファイル | 行 | 内容 |
|---------|:---:|------|
| [classify_test.ts](file:///C:/dev/receipt-app/src/scripts/classify_test.ts) | L304 | SDK公式サポート待ち |
| [journal_phase5_mock.type.ts](file:///C:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts) | L100 | Phase Bで分離予定 |
| [staff_notes.ts](file:///C:/dev/receipt-app/src/mocks/staff_notes.ts) | L8 | Phase B計画 |
| [useCurrentUser.ts](file:///C:/dev/receipt-app/src/composables/useCurrentUser.ts) | L7 | Phase Bで差し替え予定 |

---

## 🔴 B-13: `syncLabelsFromStaffNotes()`廃止

- **ファイル**: `JournalListLevel3Mock.vue`
- **問題**: `syncLabelsFromStaffNotes()`がstaff_notes→labelsに書き戻し。人間ラベル（NEED_DOCUMENT等）がAI特性配列（labels）に汚染される**設計違反**
- **影響**: labelsの意味が「AI分類結果」から「AI分類 + 人間操作の混合」に崩壊。将来のバリデーション・統計が不正確になる
- **解決策**: `syncLabelsFromStaffNotes()`を完全削除。ソートは既にstaff_notes直接参照なので同期不要
- **前提**: B4②④⑤（構造改善部分）は [refactoring_phase_b.md](file:///C:/dev/receipt-app/docs/genzai/06_refactoring/refactoring_phase_b.md) で管理
- **2026-03-27関連進捗**: 警告ラベル同期ロジックは`syncWarningLabelsCore()`として[journalWarningSync.ts](file:///c:/dev/receipt-app/src/mocks/utils/journalWarningSync.ts)に抽出済み。staff_notes系ラベルのlabels混入問題（B-13本体）は未解決

---

## 🔴 B-14: fixture labels汚染データ除去

- **ファイル**: `journal_test_fixture_30cases.ts`
- **問題**: fixtureのlabels配列にNEED_DOCUMENT, NEED_INFO, REMINDER, NEED_CONSULTが混入。これらはAI特性ではなく人間操作なのでstaff_notesに存在すべき
- **影響**: テストデータが設計違反状態のため、Phase B以降のテストで誤った前提になる
- **解決策**: fixture内のlabels配列からNEED_*を全て除去。staff_notesオブジェクトに対応する値があることを確認

---

## 🟢 B-15: schema_keys.ts A2 #5リネーム不完全

- **ファイル**: [schema_keys.ts](file:///C:/dev/receipt-app/src/types/schema_keys.ts)
- **問題**: 11_remaining_issues A2 #5で`ReceiptSchema`→`DocumentSchema`リネーム指示があったが、参照先の`zod_schema.ts`に`DocumentSchema`が未定義。importが壊れている
- **外部参照**: ゼロ（grep確認済み。どのファイルもschema_keys.tsをimportしていない）
- **影響**: 未使用ファイルのためランタイム影響なし
- **解決策**: Phase B以降でファイルが必要になった時点で`DocumentSchema`をzod_schema.tsに追加、または不要であればファイル削除

---

## チェックリスト

- [ ] B-1: handwritten_flag精度計測（Run B後）
- [ ] B-2: 学習ロジック設計
- [ ] B-3: UI再定義（警告表示ロジック確定）
- [ ] B-4: ground_truth.ts HandwrittenFlag定数参照に変更
- [ ] B-5: classify_test.ts HandwrittenFlag定数参照に変更
- [ ] B-6: LearningRuleUi.actions型定義 or 削除
- [ ] B-7: rules[index] undefinedガード
- [ ] B-8: JobService mock分岐整理
- [ ] B-9: useBankLogic マジックナンバー定数化
- [ ] B-10: transformToJournalMock scripts→mocks依存解消
- [ ] B-11: VALID_JOURNAL_LABELS自動生成化
- [ ] B-12: 計画的TODO対処（4件）
- [ ] B-13: syncLabelsFromStaffNotes()廃止
- [ ] B-14: fixture labels汚染データ除去
- [ ] B-15: schema_keys.ts A2 #5リネーム不完全（未使用ファイル）

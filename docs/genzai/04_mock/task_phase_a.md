# タスクリスト: UIモック完成 → Backend接続

**作成日**: 2026-02-19
**ルール**: `docs/genzai/00_モック実装時のルール.md` を順守
**旧タスク**: `task_archive_260214.md`（参照用に凍結）
**照合報告**: 7ソースファイル照合済み（2026-02-19）
**モックURL**: `http://localhost:5173/#/mock/journal-list`（⚠️ ハッシュルーティング。`#/`を忘れるな）

---

## 現在地

**保留中**（ユーザー確定申告のため一時中断: 2026-02-24）

### 完了済み（Phase A UIモック）

24列定義。v-for化。ソート。フィルタ4種。背景色4色。⋯ドロップダウン。ゴミ箱。一括操作。バッジ/アイコン6種（学習・証票・警告・クレ払い・軽減・適格）。残り: 取引日・摘要・借方/貸方6列 = **8列**。

### 再開時の実行順序

```
① 取引日・摘要 ──────────────────────────┐
                                          ├→ ③ 借方/貸方6列 → Phase A完了
② tax分離+複合仕訳 設計 ──────────────────┘
                          │
④ 顧問先UI ──────────────┼→ ⑤ テスト再定義+Run B → ⑥ 本番移行
```

**次のタスク** = **①と②を並行**（依存なし）。③は②の設計承認後。

### 3階層UIの対応関係

- **レベル1** = 顧問先全体処理一覧UI → Phase 5.5-6で実装
- **レベル2** = 個別顧問先_種別UI → Phase 5.5-6で実装
- **レベル3** = 個別顧問先_種別詳細UI（仕訳一覧） → **現在のフォーカス**

---

## 順序の例外

ルール§1ではPhase A-0が先だが、UI暴走破壊により先にUI修復が必要。
理由: 壊れたコードにcolumns.ts v-for化を適用すると検証不能になるため。

```
実行順序: 1. UI修復 → 2. Phase A-0 → 3. Phase A列実装 → 4. 30件テスト → 5. Phase B → 6. Phase C
```

---

## 1. UI修復（暴走修正）

- [x] JournalListLevel3Mock.vue hover復活（過去仕訳アイコン: showImageModal/hideImageModal/togglePinModal）
- [x] 600×600モーダル復旧（過去commit暴走で破壊）
- [x] 金額欄復旧（過去commit暴走で破壊）
- [x] ブラウザ確認で残り5%を洗い出し
- [x] receipt_mock_data.ts VueとセットでCommit
- [x] public/images/ Commitするか判断

---

## 2. Phase A-0（準備）

`00_モック実装時のルール.md` §1 Phase A-0 の手順に従う。

**今やる（確認 → 構築の順）:**
- [x] Yen型確定確認（Phase Aとして確定。Phase BでBranded化予定）
- [x] journal_phase5_mock.type.ts 確認（JournalStatusPhase5, JournalLabelPhase5, JournalPhase5Mock）
- [x] journal_test_fixture_30cases.ts 確認（グリーン21/イエロー9/複合5、全21ラベル網羅）
- [x] journalColumns.ts 作成（列定義の単一ソース）
- [x] ヘッダー v-for化（2026-02-20完了。columns.ts型定義正常化、as const→JournalColumn[]型注釈。スクロールバー8px列ずれ修正pr-[8px]。ソートバグ2件修正: コメント列memo有無、過去仕訳列findIndex+id比較。表示ロジック修正: journalIndex→hasPastJournal関数）
- [x] ボディ v-for化（2026-02-20完了。全23列一括変換。type分岐: checkbox/index/component/text/amount/action。getValue()ユーティリティ追加。journal/entry判定はkey.includes('.')でVue側ロジック。component列10本はcol.key個別分岐。amount列!=nullチェック。needActionキー不一致修正。DOM実測H:23 B:23 ALL_ALIGNED確認済）
- [x] L4上部バー刷新（2026-02-20完了。緑→白。タイトル・ボタン削除。表示条件ドロップダウン+チェックボックス3個（未出力✓/出力済/出力対象外）+行背景色凡例（未読=黄/既読=白/出力済=灰）追加）
- [x] チェックボックスフィルタリング実装（2026-02-20完了。ref3個+OR結合フィルタ。status===null→未出力、exported→出力済、EXPORT_EXCLUDEラベル→出力対象外。全OFF時は全件表示）
- [x] スクロールバー常時表示（2026-02-20完了。overflow-y-auto→overflow-y-scroll。ヘッダーpr-[8px]補正とのズレ防止）
- [x] 行背景色ロジック改善（2026-02-20完了。display_orderハードコード→status/is_readベース優先順位制。exported→灰(最優先) > !is_read→黄 > 既読→白）
- [x] ~~出力列追加~~ → **廃止**（2026-02-21決定。⋯ボタン+フィルタで「見る」「変える」「絞る」を代替。専用列は不要）
- [x] ⋯ボタン実装（2026-02-21完了。🗑列→⋯列置換。ホバー展開・クリック固定。未読/既読・対象/対象外トグル＋コピー＋ゴミ箱。exported行制限付き）
  - [x] journalColumns.tsの🗑列を⋯列に変更（2026-02-21完了。B案採用: key→actions、label→操作、icon→⋮追加。JournalColumn型にicon?追加。Vueヘッダー/ボディ両方のfa-trashハードコード除去、col.label/col.icon列定義駆動に統一）
  - [x] ⋯ドロップダウンUI実装（2026-02-21完了。w-44固定メニュー。未読/既読・対象/対象外トグル＋コピー＋ゴミ箱。ゴミ箱状態→復活のみ表示。exported行→ゴミ箱disabled）
  - [x] コピーロジック（2026-02-21完了。★コピー+摘要、日付維持、is_read=false、status=null、labels=[]、deleted_at=null）
  - [x] ゴミ箱ソフトデリート（2026-02-21完了。deleted_at方式でDB設計書と統一。trashJournal=timestamp設定、restoreJournal=null設定。exported行ガード。フィルタ追加表示型）
  - [x] フィルタバグ修正（2026-02-21完了。全フィルタOFF時の全表示条件にshowTrashed追加）
  - [ ] 一括操作バー実装（選列チェック時にL4バーをフィルタ→アクションに切替、Gmail式）
  - [x] 確認ダイアログ（2026-02-21完了。個別コピー「○○を未出力にコピーしますか？」、一括コピー「N件を未出力にコピーしますか？」。個別ゴミ箱・対象外も確認ダイアログ付き）
  - [x] exported行制限（2026-02-21完了。個別DD: 未読/既読・対象/対象外をdisabled+グレーアウト。一括: exported行スキップ方式で「実行不可 選択: N件 / 出力済み: N件（スキップ）」メッセージ表示）
- [x] L4バー一括操作モード（2026-02-21完了。isSelectionMode切替でフィルタ⇔アクション。Gmail式）
  - [x] チェックあり: [未読][既読]並列濃淡 / [対象外][対象]普通ボタン / [コピー][ゴミ箱]普通ボタン + 「X件選択中」常時表示
  - [x] チェックなし: 元のフィルタ表示に復帰（☑未出力 ☐出力済 ☐出力対象外 + 凡例）
  - [x] 初回チェック時ヘルプ「✓をすべて外すと元の画面に戻ります」fadeOut表示（showSelectionHelp）
  - [x] 確認ダイアログ（コピー「N件を未出力にコピーしますか？」、対象外「N件を出力対象外にしますか？」、ゴミ箱「N件をゴミ箱に移動しますか？」。exported行スキップ方式）
  - [x] 冪等処理（同じ状態への重ね掛けはエラーにしない）
- [x] L3ツールバー新設（2026-02-21完了。ホーム・アップロード・出力・学習・設定の5ボタン。bg-sky-600/白字。SVGアイコン付き）
- [x] useDraggable composable新規作成（2026-02-21完了。src/mocks/composables/useDraggable.ts。方式B: elRef watch、getBoundingClientRect clamp、z-indexグローバルカウンタ、body userSelect制御、onUnmountedクリーンアップ）
- [x] ドラッグ可能モーダル実装（2026-02-21完了。画像プレビュー・過去仕訳検索の両モーダルにドラッグハンドル付きヘッダー追加。bg-blue-100/黒字。「※移動できます」表示。中央初期配置、画面外clamp）

**後でやる（Phase A列実装が進んでから）:**
- [ ] mocks/unsafe/ 作成（any許可の実験場）
- [ ] ESLint ルール追加（unsafe/以外でany禁止）

---

## 3. UI列実装状況（24列）

- [x] ▢（チェックボックス）
- [x] No.
- [x] 写真（ドラッグ移動可能モーダル実装済み）
- [x] 過去仕訳（ドラッグ移動可能モーダル実装済み）
- [x] 学習（2026-02-23完了。RULE_APPLIED/RULE_AVAILABLE 2種バッジ。ホバーポップアップ。ソート対応済み）
- [x] コメント（2026-02-21完了。staff_notesベース4項目コメントモーダル。ドラッグ移動可能。空白行に薄アイコン表示。ソートstaff_notesベース。ヒントテキスト「✓を入れるとテキスト入力欄が表示されます」付き）
- [x] 要対応（2026-02-21完了。4FAアイコン: NEED_DOCUMENT/NEED_INFO/REMINDER/NEED_CONSULT。ホバーポップアップ遅延付き。ソート重み付け8/4/2/1方式。Chatwork URL表示）
- [x] 証票（2026-02-23完了。RECEIPT/INVOICE/TRANSPORT/CREDIT_CARD/BANK_STATEMENT/MEDICAL/NOT_APPLICABLE 7種バッジ。色分け・アイコン付き。ホバーポップアップ。ソート対応済み）
- [x] 警告（2026-02-23完了。DEBIT_CREDIT_MISMATCH等10種警告アイコン。ホバーポップアップ。ソート重み付け対応済み）
- [x] クレ払い（2026-02-23完了。is_credit_card_payment==trueで💳アイコン表示。ソート対応済み）
- [x] 軽減（2026-02-23完了。MULTI_TAX_RATE時に軽減バッジ表示。ソート対応済み）
- [ ] 証票メモ（memo有無アイコン表示+ソート+ホバーでNON_MEANINGFUL／MEANINGFUL＝メモ内容を表示。未実装）
- [x] 適格（2026-02-23完了。INVOICE_QUALIFIED/INVOICE_NOT_QUALIFIED 2種バッジ。ホバーポップアップ。ソート対応済み）
- [ ] 取引日
- [ ] 摘要
- [ ] 借方勘定科目
- [ ] 借方補助
- [ ] 借方税区分
- [ ] 借方金額
- [ ] 貸方勘定科目
- [ ] 貸方補助
- [ ] 貸方税区分
- [ ] 貸方金額
- [x] 操作（⋯ドロップダウン。2026-02-21完了。旧🗑列→操作列に置換）

### 列実装時の追加要件

- [ ] ハイライト表示（is_read=false → 黄色、is_read=true → 白の2色。出力状態は出力列で表示）
- [ ] N対N複合仕訳表示（rowspan計算、1対10/10対1/N対N全パターン）

---

## 4. 未決定仕様（列実装時に決定が必要）

### ルール表示（学習列）
- [ ] ホバー時の表示内容（ルール名、信頼度、適用日時の表示方法）
- [ ] RULE_APPLIED vs RULE_AVAILABLE のアイコン・色の区別

### インボイス判定（適格列）
- [ ] 不適格時の警告メッセージ内容
- [ ] インボイス番号の表示位置（ホバー？別カラム？詳細画面のみ？）

### メモUI（メモ列）
- [ ] ホバーUIの詳細（モーダルサイズ、保存ボタン、キャンセル挙動）

---

## 5. Phase A 完了条件

`00_モック実装時のルール.md` §1 Phase B移行条件を満たすこと。

- [ ] 全23列がブラウザで正しく表示
- [ ] ソート全項目動作確認
- [ ] モーダル全種動作確認
- [ ] トグル動作確認
- [ ] npm run type-check 通過
- [ ] npm run lint 通過
- [ ] any増加ゼロ
- [ ] ユーザーが「UX固定」と宣言

## 5.1 Phase Bタスク

> **移管済み**（2026-02-27）
>
> - リファクタリング → [refactoring_phase_b.md](file:///C:/dev/receipt-app/docs/genzai/06_refactoring/refactoring_phase_b.md)
> - テスト自動化 → [test_automation.md](file:///C:/dev/receipt-app/docs/genzai/07_test_plan/test_automation.md)
> - 設計違反（B4①③）→ [technical_debt_phase_b.md](file:///C:/dev/receipt-app/docs/genzai/05_technical_debt/technical_debt_phase_b.md) B-13, B-14

### H. Pipeline層 → 本番移行（Phase A-2）

**システム位置づけ**: **会計支援システム**（税務申告支援ではない。申告ロジック不要）
**設計思想**: 入力は制度非依存で事実を保存 → 計算で事業者設定参照 → 出力でフィルター（MF/STREAMED同等）
**方針**: `src/scripts/` は「ドメイン中核」として扱う（実験コードではない）

---

#### ① 取引日・摘要列の実装

| 項目 | 内容 |
|------|------|
| やること | `columns.ts` に取引日・摘要の列定義追加。Vue側レンダリング・ソート実装 |
| やらないこと | 税関連フィールドの変更。データ構造の変更 |
| 対象ファイル | `journalColumns.ts`, `JournalListLevel3Mock.vue`, `journal_phase5_mock.type.ts`（必要なら） |
| 成果物 | UIに取引日・摘要列が表示される |
| 完了条件 | ブラウザで表示+ソート動作確認 |
| 依存 | なし |

---

#### ② tax分離 + 複合仕訳 **設計のみ**

| 項目 | 内容 |
|------|------|
| やること | `tax_category`(8値enum) → `tax_rate` + `tax_type` + `invoice_qualified` 分離の**設計書作成**。複合仕訳 `1 journal = N entries` の**データモデル設計**。科目×税区分バリデーションルールの定義。entry単位でtax情報を持つ構造の設計 |
| やらないこと | コード変更。UI変更。DB変更。**設計書のみ** |
| 対象ファイル | `証票分類パイプライン設計書.md`, `journal_v2_20260214.md`, `classify_schema.ts`（設計のみ記載） |
| 成果物 | 設計書（新規 or 既存更新） |
| 完了条件 | ユーザー承認 |
| 依存 | なし（①と並行可能） |

**設計の要点:**
- `tax_category`(8値圧縮) → `tax_rate: 10|8|0|null` + `tax_type: 課税|非課税|対象外|null` + `invoice_qualified: boolean|null`
- `tax_method`（原則/簡易/免税）は事業者設定 → 顧問先プロパティ
- tax情報は **entry（行）単位**。credit行のtax系は基本null
- 科目×税区分バリデーション追加（既存の貸借・重複チェックに加えて）
- `1 journal = N entries`（借方N件 + 貸方M件）

---

#### ③ 借方/貸方6列の実装

| 項目 | 内容 |
|------|------|
| やること | 借方勘定科目・借方補助・借方税区分・借方金額・貸方勘定科目〜貸方金額の6列をUI実装。②の設計に基づくデータ構造でレンダリング。複合仕訳のrowspan表示 |
| やらないこと | バックエンド実装。Geminiスキーマ変更（設計に基づくUI表示のみ） |
| 対象ファイル | `journalColumns.ts`, `JournalListLevel3Mock.vue`, `journal_phase5_mock.type.ts`, fixture |
| 成果物 | 全24列がブラウザ表示。Phase A完了条件の「全列表示」達成 |
| 完了条件 | 24列 + ソート + 複合仕訳rowspan動作確認 |
| 依存 | **②の設計承認後** |

---

#### ④ 顧問先登録UI

| 項目 | 内容 |
|------|------|
| やること | 顧問先情報の登録/編集UI作成。入力項目: 事業者種別、会計期間、課税方式、経理方式、科目マスタ、決済手段等（12項目）。入力値からVertex APIプロンプトを動的生成する機能 |
| やらないこと | DB永続化（モック段階）。学習機能 |
| 対象ファイル | 新規Vue, 新規composable, `classify_test.ts`（ハードコード→動的生成に置換） |
| 成果物 | 顧問先UIモック + プロンプト生成関数 |
| 完了条件 | 顧問先プロパティを入力 → プロンプト文字列が生成 → Vertex APIに渡せる |
| 依存 | ②の設計が望ましいが必須ではない |

---

#### ⑤ Run A テスト実行 + 本番スキーマ確定

> **⚠️ 順序変更**: 旧計画では④完了後だったが、**⑤を先行実施**に変更。
> テスト結果を根拠に②③④を設計する方が手戻りが少ない。

| 項目 | 内容 |
|------|------|
| やること | 本番仕様プロンプト（ハードコード）でRun A実行。正解データ18件と照合。自動採点S1-S5 + 人間判定H1-H5で合否判定 |
| やらないこと | プロンプト動的生成（④は後）。旧Run Aとの比較レポート（無意味のため廃止） |
| 対象ファイル | `classify_test.ts`（プロンプト）, `classify_schema.ts`（スキーマ）, `ground_truth.ts`（正解データ+記入ガイド） |
| 成果物 | Run A結果JSON + 採点スコア + 合否判定 |
| 完了条件 | S1-S5自動採点 + H1-H5人間判定完了。合格なら②③④⑥に進む |
| 依存 | **なし**（④不要。ハードコードで実行可能） |

**進捗:**

- [x] 0-1: スキーマ修正（`classify_schema.ts`）— AccountCode英語enum30科目
- [x] 0-2: プロンプト修正（`classify_test.ts`）— 英語enum+日本語対応表+全条件18項目
- [ ] 0-3: 正解データ18件作成（`ground_truth.ts`）— 型定義+記入ガイド完了、データ空
- [ ] 0-4: 採点スクリプト作成（自動採点S1-S5）
- [ ] 1-1: Run A実行
- [ ] 2-1: 自動採点 + 人間判定
- [ ] 3-1: 合否判定 → 合格なら②③④へ / 不合格なら原因特定→Run B

**合格ライン:**

| 種別 | # | 評価軸 | 合格ライン |
|------|---|--------|-----------|
| 自動 | S1 | JSON構造破損率 | 0件 |
| 自動 | S2 | enum逸脱率（勘定科目・税区分） | 0件 |
| 自動 | S3 | 必須フィールド欠損率 | 0件 |
| 自動 | S4 | 借貸合計不一致 | 0件 |
| 自動 | S5 | 税計算矛盾率 | ≤ 10% |
| 人間 | H1 | account（勘定科目）正解率 | ≥ 80% |
| 人間 | H2 | tax_category（税区分）正解率 | ≥ 85% |
| 人間 | H3 | voucher_type（証票分類）正解率 | ≥ 95% |
| 人間 | H4 | total_amount（合計金額）正解率 | ≥ 90% |
| 人間 | H5 | date（日付）正解率 | ≥ 90% |

**重要な設計決定（本セッションで確定）:**

| 決定事項 | 内容 |
|---------|------|
| 宛名チェックルール | 宛名が事業者名と異なる → `is_not_applicable`（仕訳対象外）=true、`entries`（仕訳候補）=[] |
| 除外時出力ルール（選択肢B） | 除外でもOCR結果は全フィールド保持。`entries`（仕訳候補）のみ空。一覧UI表示+将来の除外管理UIに対応 |
| Gemini/人間の条件一致 | `classify_test.ts`のプロンプトと`ground_truth.ts`の前提条件を完全一致（18項目） |

---

#### ⑥ 本番移行準備

| 項目 | 内容 |
|------|------|
| やること | `tsconfig.pipeline.json` 新規作成。`src/scripts/` → `src/pipeline/` リネーム。型エラーゼロ確認。DOM依存排除 |
| やらないこと | Supabase接続（Phase C）。RLS。学習機能 |
| 対象ファイル | `tsconfig.pipeline.json`（新規）, `tsconfig.json`, `tsconfig.app.json` |
| 成果物 | `npx tsc -p tsconfig.pipeline.json --noEmit` 通過 |
| 完了条件 | pipeline側コードがフロントと完全分離、型エラーゼロ |
| 依存 | ②〜⑤の変更が安定してから |

---

#### 残留負債（SDK更新待ち）

- [ ] `classify_test.ts` L218 `usage as Record` キャスト除去（SDK更新後）
- [ ] `gaxios` 型エラー（`tsconfig.pipeline.json` の `skipLibCheck: true` で解消見込み）
- [x] PRICING定数虚偽値（P0.2で修正済み）

#### ⚠️ 学習機能は後回し

> `journal_rules`テーブル、RULE_APPLIED/RULE_AVAILABLE判定ロジックは①〜⑥完了後に着手。
> UI側の学習列表示は2026-02-23に完了済み。バックエンドロジックは後。

#### 関連ドキュメント

| ファイル | 用途 |
|---------|------|
| `docs/genzai/02_database_schema/証票分類パイプライン設計書.md` | パイプライン全体設計 |
| `docs/genzai/02_database_schema/ui_pipeline_mapping.md` | UI↔パイプライン対応 |
| `docs/genzai/02_database_schema/パイプライン対応表（人間用）.md` | 人間用対応一覧 |
| `docs/genzai/04_mock/テスト結果.md` | Run Aテスト結果（検証中） |
| ブレイン: `検証フィールド定義.md` | テスト検証フィールドのSSoT（98項目） |
| ブレイン: `implementation_plan.md` | 本番仕様（顧問先プロパティ+科目+ルール） |

---

## 6. 30件テスト

- [ ] 30件を上から確認（KPI: 3秒でOK）
- [ ] 成功基準: 詳細遷移率 < 30%
- [ ] 記録項目:
  - 所要時間
  - 詳細画面に入った回数（/30件）
  - 止まった箇所数
  - 色が信用できたか
  - アイコンの意味が分かったか
  - **使わなかった列**
  - **邪魔だったホバー**
  - **欲しかった機能**

---

## 7. 摩擦レポート

- [ ] 情報不足を列挙（例: ルール名が見えない → 追加候補）
- [ ] 情報過多を列挙（例: 一覧に不要な列 → 詳細画面に移動）
- [ ] 判断曖昧を列挙（例: 色の意味 → is_read定義見直し）
- [ ] 欲しかった機能を列挙

---

## 8. Phase 1.5 決定事項（30件テスト後に決定）

- [ ] is_readのタイミング（A: 詳細遷移時 / B: 3秒表示 / C: 手動ボタン）
- [ ] メモUIの形式（A: モーダル / B: サイドパネル / C: インライン）
- [ ] 一括操作（一括既読、一括コピー、一括出力対象外、一括削除のどれが必要か）
- [x] export_excludeの管理方針 → カラム管理確定（2026-02-20）。一覧UIは出力列で表示。UI詳細は出力列実装時に決定

---

## 9. Phase B（構造固定）

> **移管済み**（2026-02-27）→ [refactoring_phase_b.md](file:///C:/dev/receipt-app/docs/genzai/06_refactoring/refactoring_phase_b.md)

---

## 10. Phase C（Backend接続）

> **移管済み**（2026-02-27）→ [refactoring_phase_c.md](file:///C:/dev/receipt-app/docs/genzai/06_refactoring/refactoring_phase_c.md)

---

## 11. Phase 5.5（レベル1-2 実証設計）

- [ ] レベル1: 顧問先一覧UIモック（ClientListLevel1Mock.vue）+ 摩擦テスト
- [ ] レベル2: 種別選択UIモック（ReceiptTypeSelectionLevel2Mock.vue）+ 摩擦テスト
- [ ] 統合DDL確定（clients, receipt_source_type + journals整合性確認）

---

## 12. Phase 6（レベル1-2 実装）

- [ ] clientsテーブル実装 + 顧問先一覧UI
- [ ] 種別管理実装 + 種別選択UI
- [ ] 3階層遷移テスト（レベル1→2→3）
- [ ] ゴミ箱物理削除（30日バッチ処理）
- [ ] 複数人同時編集の競合解決（楽観的ロック）
- [ ] 履歴管理（Firestoreイベントログで十分か検証）

---

## Phase 4 保留部分

- [ ] Step 4.3.11: 明細disabled制御（Phase Aの設計思想確立後に再開）

---

## Phase体系の対応関係

| 安全フェーズ（`00_モック実装時のルール.md`） | 機能フェーズ（本ファイル） | 関係 |
|---|---|---|
| Phase A-0（準備） | §2 | columns.ts導入、unsafe隔離 |
| Phase A（UX探索） | §3-8 | UIモック作成・30件テスト・摩擦レポート |
| Phase B（構造固定） | §9 | CellComponent分離、Factory必須化 |
| Phase C（Backend接続） | §10 | DDL確定・Supabase接続 |

---

## 設計思想（要約）

1. **実証設計**: スクショ→概念モデル→UIモック→30件テスト→摩擦レポート→DDL確定。想像でDDLを先に作らない。
2. **定義B（2026-02-14確定、2026-02-20追記、2026-02-21追記）**: status = exported + null。labels = 18種類（要対応4種はstaff_notesに移行）→Phase CでEXPORT_EXCLUDE廃止→17種類。背景色 = 4色優先順位制（deleted_at→灰+白字(最優先) > exported→灰 > !is_read→黄 > 既読→白）。出力状態は背景色+フィルタで表示。export_excludeはカラム管理（ラベルではない）。ゴミ箱=deleted_at(string|null)でDB設計書と統一。
3. **Streamed互換**: 出力=完了、背景色=未読管理、ゴミ箱30日（deleted_atベースで将来実装可能）。MFが会計の真実、本システムは業務効率レイヤー。

## 2026-02-20 確定: export_exclude設計判断

### 問題の経緯

8ファイル（journal_v2, migration.sql, API設計書, 実装ノート, ルール, ガイド, task_current, セッションログ）の照合で矛盾7件を発見。うち2件が設計判断を必要とした。

### 判断1: exported_by型不整合

journals.exported_by（VARCHAR）とexport_batches.exported_by（UUID）の型不整合。
**判断: 現状維持。Phase Cでusersテーブル作成時に統一。**
理由: usersテーブルが未定義。FK参照先がない状態でUUID化しても意味がない。

### 判断2: export_exclude二重管理

EXPORT_EXCLUDEがラベル（labels配列）とカラム（BOOLEAN）の両方で管理されている。API設計書ではラベルで検索（L339）、カラムで更新（L503）しており、同期ミスでバグが発生する。
**判断: カラムのみ。EXPORT_EXCLUDEラベルはPhase Cで廃止（18→17個）。**

理由（レイヤー分離）:
- **状態** = 何が起きたか（事実）→ statusカラム。例: exported
- **特性** = 何であるか（分類）→ labels配列。例: RECEIPT, INVOICE_QUALIFIED
- **要対応** = 誰が何をすべきか（アクション）→ staff_notesオブジェクト（2026-02-21移行）
- **制御** = どうするか（判断）→ export_excludeカラム。例: 出力しない

export_excludeは「人間の業務判断」。理由が必要（CHECK制約）。ラベルには理由を持たせる仕組みがない。

### 用語定義

| 用語 | 条件 | 意味 |
|---|---|---|
| 出力済み | status = 'exported' | CSV出力完了（不可逆） |
| 出力保留 | status = null AND export_exclude = false | まだ出力していない（デフォルト） |
| 出力除外 | export_exclude = true | 人間が出力しないと判断（理由必須） |

### 一覧UI

- 背景色（4色・優先順位制）: deleted_at→濃灰+白字(最優先) > exported→灰 > !is_read→黄 > 既読→白
- ~~出力列~~ → **廃止**（2026-02-21）。⋯ボタン+フィルタで代替
- フィルタリング: チェックボックス4個（未出力を表示✓/出力済を表示/出力対象外を表示/ゴミ箱を表示）実装済み
- スクロールバー: 常時表示（overflow-y-scroll）でヘッダーpr-[8px]補正とのズレ防止
- 操作列: ⋯ドロップダウン（未読/既読トグル、対象/対象外トグル、コピー、ゴミ箱/復活）
  - コピー確認メッセージ: 「○○を未出力にコピーしますか？」（一括: 「N件を未出力にコピーしますか？」）
  - exported行制限: 未読/既読・対象/対象外がdisabled+グレーアウト（ゴミ箱と同様）
  - 一括操作exported制限: スキップ方式（「実行不可 選択: N件 / 出力済み: N件（スキップ）」）

### 過去仕訳モーダル

- 背景色3色: exported→白、未出力→薄い青、出力除外→薄い赤
- is_readはモーダルでは使用しない

### Phase Cでの変更予定

| ファイル | 行 | 変更内容 |
|---|---|---|
| journal_v2 §2 L62 | L62 | ✅済: 「18個」（要対応3種はstaff_notesに移行済み） → Phase C廃止後「17個」 |
| journal_v2 §2 L121-124 | L121-124 | EXPORT_EXCLUDEラベル削除 |
| journal_v2 §13 L548 | L548 | ✅済: 「18個」に修正済み → Phase C廃止後「17個」 |
| migration.sql L42 | L42 | 「21種類」→「17種類」（要対応3移行 + EXPORT_EXCLUDE廃止） |
| migration.sql L43 | L43 | 「出力制御1個」→削除 |
| migration.sql L220 | L220 | 「21種類」→「17種類」 |
| API設計書 L339 | L339 | `.not('labels','cs','{EXPORT_EXCLUDE}')` → `.eq('export_exclude', false)` |
| task_current L53 | L53 | 「全21ラベル」→「全18ラベル」（Phase C後17） |

### 未決定事項

| 項目 | 決定時期 |
|---|---|
| 出力列のUI（アイコン/✓/テキスト） | Phase A出力列実装時 |
| 出力列の位置（23列のどこ） | Phase A出力列実装時 |
| モーダル背景色の具体値（薄い青、薄い赤のCSS値） | Phase A出力列実装時 |
| export_exclude=true AND status='exported'を禁止するCHECK制約 | Phase C |
| export_exclude_reasonの入力UI（テキスト/定型選択） | Phase A出力列実装時 |

---

## 完了条件

- [ ] Phase A完了: レベル3 UIモック完成 + UX固定宣言
- [ ] Phase B完了: 構造固定 + fixture凍結
- [ ] Phase C完了: レベル3 Supabase接続完了
- [ ] Phase 5.5完了: レベル1-2 DDL確定
- [ ] Phase 6完了: 3階層すべて実装完了

# タスクリスト: UIモック完成 → Backend接続

**作成日**: 2026-02-19
**ルール**: `docs/genzai/00_モック実装時のルール.md` を順守
**旧タスク**: `task_archive_260214.md`（参照用に凍結）
**照合報告**: 7ソースファイル照合済み（2026-02-19）
**モックURL**: `http://localhost:5173/#/mock/journal-list`（⚠️ ハッシュルーティング。`#/`を忘れるな）

---

## 現在地

Phase A（UX探索モード）進行中。
JournalListLevel3Mock.vue は23列。ヘッダー・ボディ両方のv-for化完了。columns.tsが列定義の唯一ソース。ソートバグ2件修正済み（過去仕訳・コメント）。ヘッダー/ボディ列ずれ解消済み。操作列（⋯）ドロップダウンメニュー実装済み。ゴミ箱ソフトデリート（deleted_at方式）実装・DB設計書と統一済み。フィルタ4種（未出力/出力済/出力対象外/ゴミ箱）+フィルタバグ修正済み。背景色4色優先順位制（ゴミ箱>出力済>未読>既読）。

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
- [/] ⋯ボタン実装（🗑列を⋯列に置換。ホバーで展開、クリックで固定。未読/既読・対象/対象外の並列濃淡トグル＋コピー＋ゴミ箱。exported行は対象外・ゴミ箱を制限）
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

## 3. UI列実装状況（23列）

- [x] ▢（チェックボックス）
- [x] No.
- [x] 写真（ドラッグ移動可能モーダル実装済み）
- [x] 過去仕訳（ドラッグ移動可能モーダル実装済み）
- [ ] コメント
- [ ] 要対応（NEED_DOCUMENT/NEED_CONFIRM/NEED_CONSULT）
- [ ] 証票（TRANSPORT/RECEIPT/INVOICE/CREDIT_CARD/BANK_STATEMENT）
- [ ] 警告（DEBIT_CREDIT_MISMATCH等6種）
- [ ] 学習（RULE_APPLIED/RULE_AVAILABLE）
- [ ] 軽減（MULTI_TAX_RATE）
- [ ] メモ（HAS_MEMO）
- [ ] 適格（INVOICE_QUALIFIED/INVOICE_NOT_QUALIFIED）
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

## 5.1 Phase Bタスク（今はやらない）

- [ ] 列表示ON/OFF（ユーザーが列を非表示にする機能）
- [ ] カラムグループ化（借方/貸方のグループヘッダー）← 必須
- [ ] セルコンポーネント化（ルール§3.4 Phase B参照）

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

- [ ] CellComponent分離
- [ ] Factory必須化
- [ ] fixture完全凍結

---

## 10. Phase C（Backend接続）

- [ ] DDL確定（摩擦レポート結果 → 型・制約・インデックス決定。CHECK制約4つを含む）
- [ ] journal_rulesテーブル作成
- [ ] Supabase Mapper導入（モック→本番切り替え）
- [ ] RLSポリシー本番化（client_idフィルタリング。開発環境は設定済み）
- [ ] GINインデックス（labels配列検索用）
- [ ] モック差し替え
- [ ] unsafe/ 廃止

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
2. **定義B（2026-02-14確定、2026-02-20追記、2026-02-21追記）**: status = exported + null。labels = 21種類→Phase Cで20種類（EXPORT_EXCLUDE廃止）。背景色 = 4色優先順位制（deleted_at→灰+白字(最優先) > exported→灰 > !is_read→黄 > 既読→白）。出力状態は背景色+フィルタで表示。export_excludeはカラム管理（ラベルではない）。ゴミ箱=deleted_at(string|null)でDB設計書と統一。
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
**判断: カラムのみ。EXPORT_EXCLUDEラベルはPhase Cで廃止（21→20個）。**

理由（レイヤー分離）:
- **状態** = 何が起きたか（事実）→ statusカラム。例: exported
- **特性** = 何であるか（分類）→ labels配列。例: RECEIPT, NEED_CONFIRM
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
| journal_v2 §2 L62 | L62 | 「21個」→「20個」 |
| journal_v2 §2 L121-124 | L121-124 | EXPORT_EXCLUDEラベル削除 |
| journal_v2 §13 L501 | L501 | 「21個」→「20個」 |
| migration.sql L42 | L42 | 「21種類」→「20種類」 |
| migration.sql L43 | L43 | 「出力制御1個」→削除 |
| migration.sql L220 | L220 | 「21種類」→「20種類」 |
| API設計書 L339 | L339 | `.not('labels','cs','{EXPORT_EXCLUDE}')` → `.eq('export_exclude', false)` |
| task_current L53 | L53 | 「全21ラベル」→「全20ラベル」 |

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

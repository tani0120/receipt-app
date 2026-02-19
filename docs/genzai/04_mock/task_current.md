# タスクリスト: UIモック完成 → Backend接続

**作成日**: 2026-02-19
**ルール**: `docs/genzai/00_モック実装時のルール.md` を順守
**旧タスク**: `task_archive_260214.md`（参照用に凍結）
**照合報告**: 7ソースファイル照合済み（2026-02-19）
**モックURL**: `http://localhost:5173/#/mock/journal-list`（⚠️ ハッシュルーティング。`#/`を忘れるな）

---

## 現在地

Phase A（UX探索モード）進行中。
JournalListLevel3Mock.vue は22列中4列完了（No./写真/過去仕訳）、§1 UI修復完了。

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
- [ ] journalColumns.ts 作成（列定義の単一ソース）
- [ ] ヘッダー v-for化
- [ ] ボディ v-for化

**後でやる（Phase A列実装が進んでから）:**
- [ ] mocks/unsafe/ 作成（any許可の実験場）
- [ ] ESLint ルール追加（unsafe/以外でany禁止）

---

## 3. UI列実装状況（22列）

- [ ] 選（チェックボックス）
- [x] No.
- [x] 写真
- [x] 過去仕訳
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
- [ ] 🗑️（論理削除）

### 列実装時の追加要件

- [ ] ハイライト表示（is_read=false → 黄色、exported → グレー、is_read=true → 白）
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

- [ ] 全22列がブラウザで正しく表示
- [ ] ソート全項目動作確認
- [ ] モーダル全種動作確認
- [ ] トグル動作確認
- [ ] npm run type-check 通過
- [ ] npm run lint 通過
- [ ] any増加ゼロ
- [ ] ユーザーが「UX固定」と宣言

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
- [ ] export_excludeの管理UI（A: 背景色 / B: アイコン / C: 表示しない）

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
2. **定義B（2026-02-14確定）**: status = exported + null。labels = 21種類（非排他的配列）。背景色 = is_readで管理。
3. **Streamed互換**: 出力=完了、背景色=未読管理、ゴミ箱30日。MFが会計の真実、本システムは業務効率レイヤー。

---

## 完了条件

- [ ] Phase A完了: レベル3 UIモック完成 + UX固定宣言
- [ ] Phase B完了: 構造固定 + fixture凍結
- [ ] Phase C完了: レベル3 Supabase接続完了
- [ ] Phase 5.5完了: レベル1-2 DDL確定
- [ ] Phase 6完了: 3階層すべて実装完了

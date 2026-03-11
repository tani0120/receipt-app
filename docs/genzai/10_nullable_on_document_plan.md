# null許容化・項目存在フラグ・警告ラベル整備計画

> 作成日: 2026-03-04
> 更新日: 2026-03-08（K21-K26進捗管理composable化完了。K10-K14顧問先管理UI完了、#13税区分deprecated完了、#18a編集権限制御完了。実装状況差異確認による一括更新）
> 根拠: STREAMED（ストリームド）UI調査、ChatGPT設計議論（2026-03-03）、journal_v2_20260214.md
> 承認: 2026-03-04 チャットにて承認済み

---

## 承認済みの設計決定

| 項目 | 決定 |
|------|------|
| `account`（勘定科目）のnull許容化 | ✅ 承認。nullの場合「未確定」と表記 |
| `amount`（金額）のnull許容化 | ✅ 承認。存在しなければ空白。存在すれば不明瞭でも貸借を合わせるよう類推 |
| `description`（摘要）のnull許容化 | ❌ 不要。nullは返さない |
| `on_document`（項目存在フラグ） | ✅ 持たせる。プロンプト（AI指示文）にも必須 |
| 列名変更 | 取引日 → **日付** |
| 警告ホバー | 3種: 「未入力項目あり」「内訳が不明瞭な金額あり」「日付が不明」 |
| CSV出力 | 人間が修正前提。可否は後日MF仕様確認 |
| 「分類」列の廃止 | ✅ 2026-03-06実施。「分類」→「補助科目」列に差替え |

---

## null × on_document（項目存在フラグ） × 警告ラベル 相関表

| on_document（項目存在） | 値 | 警告ラベル | 日本語 | ホバーメッセージ | 色 |
|:---:|:---:|------|------|------|:---:|
| false（項目なし） | null | `DATE_UNKNOWN`等 | 日付不明 等 | 「証憑に○○の記載がありません」 | 🔴赤 |
| true（項目あり） | null | `DATE_UNKNOWN`等 | 日付不明 等 | 「○○の読み取りに失敗しました」 | 🔴赤 |
| true（項目あり） | 値あり（低信頼度） | `UNREADABLE_ESTIMATED` | 判読困難（AI推測値） | 「判読困難（AI推測値）」 | 🟡黄 |
| true（項目あり） | 値あり（高信頼度） | — | 正常 | — | — |

### フィールド別の適用

| フィールド（日本語名） | null時の一覧UI表示 | ホバーメッセージ |
|---------|------------|---------|
| `transaction_date`（日付） | 「未確定」 | 「日付が不明」 |
| `account`（勘定科目） | 「未確定」 | 「未入力項目あり」 |
| `amount`（金額） | 空白（存在しない場合）/ 類推値（存在する場合） | 「内訳が不明瞭な金額あり」 |

---

## 全作業項目

### 優先度1: 型定義の整合（他の全作業の前提） ✅完了

| # | 対象ファイル | 作業内容 |
|---|------------|---------|
| A1 | [journal.ts](file:///c:/dev/receipt-app/src/domain/types/journal.ts)（ドメイン層の型定義）| [x] `JournalEntryLine`（仕訳明細行）に `account_on_document`（勘定科目項目存在フラグ）、`amount_on_document`（金額項目存在フラグ）を追加 |
| A2 | [journal_phase5_mock.type.ts](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts)（モック層の型定義）| [x] `date_on_document`（日付項目存在フラグ）を追加 |
| A3 | [field-nullable-spec.ts](file:///c:/dev/receipt-app/src/mocks/definitions/field-nullable-spec.ts)（null許容定義表）| [x] 承認内容に修正: `description`（摘要）除外、`on_document`（項目存在フラグ）追加、警告3種定義 |

### 優先度2: 警告ラベルの整備（UIと相関表の整合） ✅完了

| # | 対象ファイル | 作業内容 |
|---|------------|---------|
| B1 | [journal_v2_20260214.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v2_20260214.md)（仕訳スキーマ定義書）§2 | [x] 警告ラベル定義に `on_document`（項目存在フラグ）との判定マトリクスを正式統合 |
| B2 | [field-nullable-spec.ts](file:///c:/dev/receipt-app/src/mocks/definitions/field-nullable-spec.ts)（null許容定義表）| [x] `warningLabel`（警告ラベル）を `on_document`（項目存在フラグ）による2種分岐に対応 |

### 優先度3: マスター作成（プルダウン・未確定マッピングの前提） ✅完了

> マスタ設計ルール: [master_design_rules.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/master_design_rules.md)（13ルール確定済み）
> テーブル設計: [tax_category_schema.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/tax_category_schema.md)（accounts テーブル + tax_categories テーブル）

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K1 | [account-master.ts](file:///c:/dev/receipt-app/src/shared/data/account-master.ts) | [x] 勘定科目マスター ✅ | 79科目。MF準拠。法人/個人1マスタ管理、`target`（`corp`/`individual`/`both`）で分岐。概念ID + MF正式名称 + デフォルト税区分 + AI可否 + 表示順 |
| K2 | [tax-category-master.ts](file:///c:/dev/receipt-app/src/shared/data/tax-category-master.ts) | [x] 税区分マスター ✅ | 151件。MF正式名称完全一致。概念ID（例: `PURCHASE_TAXABLE_10`）方式。デフォルト表示27件 + 残りは顧問先単位で有効化 |
| K3 | [MockMasterAccountsPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockMasterAccountsPage.vue) | [x] 勘定科目マスタUI ✅ | `/master/accounts` に独立ページ化。「分類」列廃止→「補助科目」列追加。ヘルプアイコン（?マーク）でカスタムツールチップ表示（「補助科目は顧問先ごとの設定で入力します」） |
| K4 | [MockMasterTaxCategoriesPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockMasterTaxCategoriesPage.vue) | [x] 税区分マスタUI ✅ | `/master/tax` に独立ページ化（旧`/master/tax-categories`から短縮、2026-03-11 N1で変更） |
| K5 | [MockMasterHubPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockMasterHubPage.vue) | [x] マスタハブUI ✅ | `/master` にハブページ。勘定科目マスタ・税区分マスタへのリンク |

#### マスタ設計ルール（13ルール確定済み — 詳細は [master_design_rules.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/master_design_rules.md)）

| # | ルール | 要約 |
|---|--------|------|
| 1 | 適用期間 | `effective_from`（適用開始日）+ `effective_to`（適用終了日）。現役 = 終了日が空白 |
| 2 | 権限制御 | マスタ管理権限がないスタッフは `/master` アクセス不可。スタッフ管理画面は後で実装 |
| 3 | 論理削除 | 物理削除禁止。`deprecated` = true でグレーアウト表示 |
| 4 | 不変原則 | 税区分: 既存IDの税率・種類変更禁止。勘定科目: 名称変更可だがMF警告付き |
| 5 | MF警告 | 名称変更時に?マークでMFインポート影響を警告表示 |
| 6 | 操作方式 | インライン編集 + 保存ボタンで確定。✓選択で削除・コピー・追加 |
| 7 | 自動コピー | 新規顧問先作成時にマスタから自動コピー（連動） |
| 8 | 変更伝播 | 新規追加→自動反映。変更・非推奨→手動（通知+スタッフ確認） |
| 9 | AI可否 | マスタは初期値のみ。顧問先単位で上書き可能 |
| 10 | ソート順永続化 | ドラッグ並替え→`sort_order`更新→DB保存。`ORDER BY sort_order ASC` |
| 11 | デフォルト税区分連動 | ルール8に準じる（手動通知+スタッフ反映） |
| 12 | 税制改正強制適用 | 税区分変更（=税制改正）のみ全顧問先に強制。勘定科目は全て手動 |
| 13 | 変更履歴 | 別テーブル `master_change_log` でJSON保存（before/after） |

#### 顧問先設定への反映（実施済み）

| 対象 | ファイル | 変更内容 |
|------|---------|---------|
| 勘定科目タブ | [ScreenS_AccountSettings.vue](file:///c:/dev/receipt-app/src/views/ScreenS_AccountSettings.vue) | 「分類」列→「補助科目」列に差替え。ヘルプアイコン（?マーク）追加。カスタムツールチップ実装 |
| 税区分タブ | 同上 | マスタ連動済み |

### 優先度4: 一覧UIの変更

| # | 対象ファイル | 作業内容 | 依存 |
|---|------------|---------|------|
| D1 | [journalColumns.ts](file:///c:/dev/receipt-app/src/mocks/definitions/journalColumns.ts)（列定義） | [x] 列名変更: 取引日 → 日付 | — |
| D2 | [JournalListLevel3Mock.vue](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue)（仕訳一覧UI） | [x] null表示: 日付・勘定科目がnullの場合「未確定」と表記 | — |
| D3 | 同上 | [x] null表示: 金額がnullの場合「空白」表示（既存で対応済み） | — |
| D4 | 同上 | [x] 警告列のホバー: `on_document`（項目存在フラグ）分岐メッセージ実装済み | — |
| D5 | 同上 | [x] ソート: `compareWithNull`（null比較関数）でnull末尾/先頭に統一 | — |
| D6 | 同上 | [x] 金額null時の貸借合計計算: 既存の `?? 0` で対応済み | — |
| D7 | 同上 | [ ] 勘定科目列をマスター連動プルダウンに変更 | K1✅完了 → **実装可能** |
| D8 | 同上 | [ ] 税区分列をマスター連動プルダウンに変更 | K2✅完了 → **実装可能** |
| D9 | 同上 | [ ] null → 「未確定」科目への自動マッピング | K1✅完了 → **実装可能** |
| D10 | 同上 | [ ] nullセルの赤枠表示（勘定科目null・金額nullのセルを `border-red` で強調） | — |

#### D7 実装仕様（詳細）

- `account-master.ts` の全科目をプルダウン選択肢に表示
- 先頭に「未確定」科目を配置（STREAMED準拠）
- 顧問先設定で有効な科目のみ表示（`visible = true`）
- 科目選択時に `defaultTaxCategoryId` でデフォルト税区分を自動設定
- インライン編集: セルクリック → プルダウン展開 → 選択で確定
- 表示順: `sort_order` 順（マスタ設計ルール10）

#### D8 実装仕様（詳細）

- `tax-category-master.ts` の税区分をプルダウン選択肢に表示
- 顧問先設定で `visible = true` の税区分のみ表示（デフォルト27件）
- 伝票日がある場合は `effective_from` / `effective_to` でフィルタ
- `deprecated = true` の税区分はグレーアウト表示（選択不可）

#### D9 実装仕様（詳細）

- 勘定科目が `null` の仕訳行を自動的に「未確定」科目にマッピング
- 「未確定」は `account-master.ts` 内に正式科目として定義済み（STREAMED準拠）
- マッピング後もUI上は「未確定」と赤枠で表示（人間の修正を促す）

### 優先度5: フィクスチャ（テストデータ）の更新 ✅完了

| # | 対象ファイル | 作業内容 |
|---|------------|---------|
| I1 | [journal_test_fixture_30cases.ts](file:///c:/dev/receipt-app/src/mocks/data/journal_test_fixture_30cases.ts)（30件テストデータ） | [x] null値を含むテストケース追加（j025金額null、j028日付null、j030勘定科目null） |
| I2 | 同上 | [x] `on_document`（項目存在フラグ）の値をテストデータに追加 |

### 優先度6: Geminiプロンプト（AI指示文）の変更

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| G1 | Geminiプロンプト定義ファイル | [ ] `account`（勘定科目）null許容化 | 「判定できない場合はnullを返せ」を追加。概念IDで返す（`account-master.ts`の`id`） |
| G2 | 同上 | [ ] `amount`（金額）null許容化 | 「読み取れない場合はnullを返せ」を追加 |
| G3 | 同上 | [ ] `on_document`（項目存在フラグ）追加 | 「その項目が証憑に存在するかどうかもbooleanで返せ」を追加 |
| G4 | 同上 | [ ] `transaction_date`（日付）null許容化 | 「読み取れない場合はnullを返せ」を追加 |
| G5 | 同上 | [ ] 信頼度（confidence）低信頼度マーク | 推測で入れた値には低信頼度マークを付けさせる |

### 優先度7: 金額類推ロジック

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| F1 | 新規作成 | [ ] 金額類推ロジック | 金額がnullだが`amount_on_document = true`（項目存在）の場合、貸借を合わせるよう既知金額から不明瞭分を類推。例: 借方1,100円（確定）→ 貸方を1,100円に自動類推 |

### 優先度8: CSV出力

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| H1 | [mf-csv-date.ts](file:///c:/dev/receipt-app/src/features/journal/services/mf-csv-date.ts)（MF CSV日付変換） | [x] 作成済み | — |
| H2 | 新規作成 | [ ] CSV出力前null集計＋警告 | null（空値）フィールドの件数を集計し「N件のnull項目があります。出力しますか？」と警告表示 |
| H3 | [journal_v2_20260214.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v2_20260214.md)§9 | [ ] CSV出力前警告の方針記載 | MF CSVインポート時のnull項目の挙動を確認し方針をドキュメントに記載 |

### 優先度9: 個別仕訳ページ（画面未着手）

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| E1 | 未作成（個別仕訳編集画面） | [ ] 未入力項目の警告表示 | null項目を赤枠 + 警告アイコンで表示 |
| E2 | 同上 | [ ] プレースホルダー表示 | 空白フィールドに「必須」と薄く表示 |
| E3 | 同上 | [ ] マスター連動プルダウン | D7/D8と同じプルダウンを個別編集画面でも使用 |
| E4 | 同上 | [ ] インライン編集 | セルクリック→直接編集→保存ボタンで確定（マスタ設計ルール6準拠） |

### 優先度10: ドキュメント最終更新

| # | 対象ファイル | 作業内容 |
|---|------------|---------|
| J1 | [journal_v2_20260214.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v2_20260214.md)（仕訳スキーマ定義書） | [ ] null許容化・on_document・警告ラベル相関を正式反映 |
| J2 | [master_design_rules.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/master_design_rules.md) | [ ] 実装完了後に最終確認・更新 |

### 優先度11: 管理ページ群（スタッフ管理・顧問先管理・費用・正規化）

> 基本マスタ（K1-K5）完了後の管理ページ群。マスタ設計ルールに準拠。
> **スタッフ管理UI（権限設定）はマスタ管理権限制御の前提**（ルール2）。

#### 全管理ページ構成（2026-03-06 確定）

| # | 管理ページ | URL | 説明 |
|---|----------|------------|------|
| 1 | 顧問先管理 | `/master/clients` | ✅実装済み。顧問先の追加・編集・停止 |
| 2 | スタッフ管理 | `/master/staff` | ✅実装済み。スタッフの追加・編集・停止 |
| 3 | 勘定科目マスタ | `/settings/accounts/:clientId` | ✅実装済み。顧問先固有の勘定科目マスタ |
| 4 | 税区分マスタ | `/settings/tax/:clientId` | ✅実装済み。顧問先固有の税区分マスタ |
| 5 | 想定費用 | `/master/costs` | ✅ページ作成済み（未実装表示）。AI費用等の管理 |
| 6 | 設定管理 | `/master/settings` | ✅ページ作成済み（未実装表示） |

> **2026-03-11 N1適用**: 旧体系のURL（`/admin/clients`、`/master`ハブ、`/admin/billing`等）は全て上記に統一。
> NavBar上段バーは上記6項目＋進捗管理（`/progress`）の計7項目。「マスタ管理」ハブは廃止。
> 勘定科目・税区分は顧問先固有ページのため`/settings/`配下にclientId付きURLとして配置。
> アップロード（`/upload/:clientId`）・学習（`/learning/:clientId`）は仮ページ作成済み。

#### スタッフ管理UI（権限設定）— マスタ設計ルール2の前提

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K6 | [MockMasterStaffPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockMasterStaffPage.vue) | [x] スタッフ一覧表示 ✅ | ステータス・権限（管理者/一般）・名前・メールアドレス・UUIDの5列。ステータスフィルター・ソート・ページネーション実装済み |
| K7 | 同上 | [x] スタッフ追加・編集パネル ✅ | 名前・メール・パスワード（表示切替付き）・権限ラジオ。スライドインパネル方式 |
| K8 | 同上 | [x] 管理権限の設定UI ✅ | 管理者/一般の2種に簡略化（計画書の5種→2種）。パネル内にアクセス範囲説明を表示 |
| K9 | [useAuthStore.ts](file:///c:/dev/receipt-app/src/features/staff-management/composables/useAuthStore.ts) | [x] 権限アクセス制御の仕組み ✅ | `canAccess(path)`関数 + 管理者専用パス一覧で判定。ルーターガード組込みはDB構築後（Phase B） |

##### 権限種別（2026-03-08 実装確定: 2種に簡略化）

| 権限名 | アクセス可能 | 説明 |
|--------|---------|------|
| **管理者** | 全機能 | 顧問先管理・スタッフ管理・マスタ管理・想定費用・設定管理にアクセス可能 |
| **一般** | 業務機能のみ | 仕訳一覧・アップロード・出力・学習のみ。上記管理機能にはアクセス不可 |

> **管理者**: 全権限を持つ特別なロール。スタッフ管理権限を持つのは管理者のみ。
> **新規スタッフ**: デフォルトで「一般」権限。管理者が変更可能。

#### 顧問先管理UI

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K10 | [MockMasterClientsPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockMasterClientsPage.vue) | [x] 顧問先一覧表示 ✅ | ステータス・3コード・担当者名・種別・会社名・決算月・会計ソフト・電話番号・連絡手段の9列。ステータスフィルター・ソート・ページネーション実装済み |
| K11 | 同上 | [x] 顧問先追加モーダル ✅ | 基本情報/会計設定/報酬設定の3セクション。33プロパティ入力。スライドインパネル方式 |
| K12 | 同上 | [x] 顧問先編集 ✅ | 行クリックで編集パネル表示。全フィールド編集可能。3コード変更可 |
| K13 | 同上 | [x] 顧問先停止 ✅ | 物理削除なし。「休眠」「契約終了」の2種。復元ボタンあり |
| K14 | 同上 | [x] 新規作成時マスタ自動コピー ✅ | 新規追加時に通知表示。マスタの勘定科目・税区分（デフォルト27件）を自動コピー（ルール7） |

#### 想定費用UI

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K15 | 新規作成（想定費用ページ） | [ ] 報酬設定一覧 | 顧問先ごとの月額顧問報酬・記帳代行・月次合計（自動算出）・決算報酬・消費税申告報酬・年間総報酬（自動算出）|
| K16 | 同上 | [ ] 報酬編集 | インライン編集。保存ボタンで確定（ルール6準拠） |

#### 正規化マスタUI

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K17 | 新規作成（正規化マスタページ） | [ ] 正規化ルール一覧 | OCR読み取り文字列→正規科目名のマッピングテーブル。`/master/normalization` に配置 |
| K18 | 同上 | [ ] ルール追加・編集・削除 | インライン編集。保存ボタンで確定 |

#### 各マスタ間のID紐付け

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K19 | 新規作成（テーブル設計） | [ ] ID紐付け設計 | 顧問先ID ↔ 勘定科目 ↔ 税区分 ↔ 担当者 ↔ 権限の関連テーブル設計 |
| K20 | 同上 | [ ] ID紐付け実装 | PostgreSQL migration で関連テーブル作成（Phase C） |

#### 進捗管理UI（Composable化・本番移行基盤）

> 進捗管理ページ（`/progress`）のロジックをcomposable化し、本番API連携時の差分を最小化する。
> **パターン**: `useClients` / `useStaff` と同一構成。

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| K21 | [types.ts](file:///c:/dev/receipt-app/src/features/progress-management/types.ts)（新規） | [x] 型定義整備 ✅ | `ProgressRow` `MonthColumn` を export。全ページで共有可能 |
| K22 | [monthColumns.ts](file:///c:/dev/receipt-app/src/features/progress-management/utils/monthColumns.ts)（新規） | [x] 月カラム生成ユーティリティ ✅ | 現在月から12ヶ月遡りを動的計算。他ページ（月次レポート等）でも再利用可能 |
| K23 | [useProgress.ts](file:///c:/dev/receipt-app/src/features/progress-management/composables/useProgress.ts)（新規） | [x] composable切り出し ✅ | `useProgress()` で `progressRows` `monthColumns` `isLoading` を返す。API化時は内部fetch差替えのみ |
| K24 | [MockProgressDetailPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockProgressDetailPage.vue) | [x] composable利用に移行 ✅ | コンポーネント内ロジックを `useProgress()` 呼び出しに置換 |
| K25 | [journal_v2_20260214.md](file:///c:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v2_20260214.md) | [ ] DB設計への月次集計ビュー追加 | `monthly_journal_summary` ビュー（`client_id` × `month` × `journal_count`） |
| K26 | 進捗管理ページ全体 | [x] UI調整完了 ✅ | 21列構成（7固定+12月次動的+2集計）。全列ソート、0→「—」表示、罫線強化、列幅最適化 |

### 優先度12: OCR前の前処理とOCR後の前処理

| # | 対象ファイル | 作業内容 | 詳細 |
|---|------------|---------|------|
| M1 | 新規作成 | [ ] OCR前処理 | 画像回転補正・傾き補正・ノイズ除去・コントラスト調整 |
| M2 | 新規作成 | [ ] OCR後処理 | 不要文字除去・金額パターン正規化・日付フォーマット統一 |

---

## 次のタスク（全体ロードマップ）

> 本ファイル + [task_phase_a.md](file:///c:/dev/receipt-app/docs/genzai/04_mock/task_phase_a.md) の未完了タスクを統合。
> **方針転換（2026-03-06）**: ストリームド調査の結果、厳格な税務計算不要と判明。過去の⑤Run Aテストは無意味に。マスタ定義を先行し、定義に基づいたテストを後から行う方針。

### フェーズ1: マスタ・管理ページ群の完成（最優先）

> まずマスタデータとUI側の基盤を全て揃える。テストはマスタ定義完了後に行う。

| # | タスク | 状態 | 担当 | 出典 |
|---|--------|:---:|:---:|------|
| 1 | K1 勘定科目マスタデータ（79科目） | ✅ | AI | 優先度3 |
| 2 | K2 税区分マスタデータ（151件） | ✅ | AI | 優先度3 |
| 3 | K3 勘定科目マスタUI（`/master/accounts`） | ✅ | AI | 優先度3 |
| 4 | K4 税区分マスタUI（`/master/tax`） | ✅ | AI | 優先度3 |
| 5 | K5 マスタハブUI（`/master` → 廃止。`/master/accounts`にリダイレクト） | ✅ | AI | 優先度3 |
| 6 | 分類列→補助科目列差替え（マスタ+顧問先設定） | ✅ | AI | 優先度3 |
| 7 | マスタ設計ルール13項目確定 | ✅ | AI+人間 | master_design_rules.md |
| — | **▼ 型定義変更（スキーマ反映）** | | | |
| 8 | `account.ts` に `deprecated` / `effective_from` / `effective_to` / `ai_selectable` 追加 | ✅ | AI | tax_category_schema.md §2 |
| 9 | `tax-category.ts` に `deprecated` / `effective_from` / `effective_to` 追加 | ✅ | AI | tax_category_schema.md §1 |
| 10 | `account-master.ts` のデータに上記フィールドの値を設定 | ✅ | AI | tax_category_schema.md §2 |
| 11 | `tax-category-master.ts` のデータに上記フィールドの値を設定 | ✅ | AI | tax_category_schema.md §1 |
| — | **▼ マスタUI強化（ルール3,4,5,6,10準拠）** | | | |
| 12 | 勘定科目マスタUI — `deprecated`行のグレーアウト表示（ルール3） | ✅ | AI | master_design_rules.md |
| 13 | 税区分マスタUI — `deprecated`行のグレーアウト表示（ルール3） | ✅ | AI | master_design_rules.md |
| 14 | 勘定科目マスタUI — `effective_from`/`effective_to`列の表示（ルール1） | ✅ | AI | master_design_rules.md |
| 15 | 税区分マスタUI — `effective_from`/`effective_to`列の表示（ルール1） | ❌ | AI | master_design_rules.md |
| 16 | マスタUI — インライン編集（カスタム科目のみ）＋保存ボタンで確定（ルール4,6） | ❌ | AI | master_design_rules.md |
| 17 | マスタUI — チェックボックス選択→削除・コピー・追加・復元（ルール6） | ✅ | AI | master_design_rules.md |
| 18 | マスタUI — ドラッグ並替え→`sort_order`更新→DB保存（ルール10） | ✅ | AI | master_design_rules.md |
| 18a | マスタUI — デフォルト/カスタム科目の編集権限制御（ルール4） | ✅ | AI | master_design_rules.md |
| 19 | 顧問先設定 税区分タブ — 修正方針の?マーク警告（ルール5） | ❌ | AI | master_design_rules.md |
| — | **▼ スタッフ管理・顧問先管理・費用・正規化** | | | |
| 20 | K6 スタッフ管理UI — スタッフ一覧表示 | ✅ | AI | 優先度11 |
| 21 | K7 スタッフ管理UI — スタッフ追加・編集パネル | ✅ | AI | 優先度11 |
| 22 | K8 スタッフ管理UI — 管理権限の設定UI（2種: 管理者/一般） | ✅ | AI | 優先度11 |
| 23 | K9 スタッフ管理UI — 権限アクセス制御の仕組み（useAuthStore） | ✅ | AI | 優先度11 |
| 24 | K10 顧問先管理UI — 顧問先一覧表示 | ✅ | AI | 優先度11 |
| 25 | K11 顧問先管理UI — 顧問先追加モーダル（33プロパティ） | ✅ | AI | 優先度11 |
| 26 | K12 顧問先管理UI — 顧問先編集 | ✅ | AI | 優先度11 |
| 27 | K13 顧問先管理UI — 顧問先停止（物理削除なし） | ✅ | AI | 優先度11 |
| 28 | K14 顧問先管理UI — 新規作成時マスタ自動コピー（ルール7） | ✅ | AI | 優先度11 |
| 29 | K15 想定費用UI — 報酬設定一覧 | ❌ | AI | 優先度11 |
| 30 | K16 想定費用UI — 報酬編集（インライン） | ❌ | AI | 優先度11 |
| 31 | K17 正規化マスタUI — 正規化ルール一覧 | ❌ | AI | 優先度11 |
| 32 | K18 正規化マスタUI — ルール追加・編集・削除 | ❌ | AI | 優先度11 |
| 33 | K19 各マスタ間ID紐付け設計 | ❌ | AI | 優先度11 |
| 34 | K20 各マスタ間ID紐付け実装 | ❌ | AI | 優先度11 |

### フェーズ2: 一覧UI強化（マスタ連動）

| # | タスク | 状態 | 担当 | 出典 |
|---|--------|:---:|:---:|------|
| 35 | D1 列名変更: 取引日→日付 | ✅ | AI | 優先度4 |
| 36 | D2 null表示:「未確定」表記 | ✅ | AI | 優先度4 |
| 37 | D3 null表示: 金額「空白」 | ✅ | AI | 優先度4 |
| 38 | D4 警告列ホバー（on_document分岐） | ✅ | AI | 優先度4 |
| 39 | D5 ソート（compareWithNull） | ✅ | AI | 優先度4 |
| 40 | D6 金額null時の貸借合計 | ✅ | AI | 優先度4 |
| 41 | D7 勘定科目列をマスター連動プルダウンに変更 | ❌ | AI | 優先度4 |
| 42 | D8 税区分列をマスター連動プルダウンに変更 | ❌ | AI | 優先度4 |
| 43 | D9 null→「未確定」科目への自動マッピング | ❌ | AI | 優先度4 |
| 44 | D10 nullセルの赤枠表示 | ❌ | AI | 優先度4 |
| 45 | ① 取引日・摘要列の実装 | ❌ | AI | task_phase_a §① |
| 46 | 証票メモ列の実装 | ❌ | AI | task_phase_a §① |

### フェーズ3: テスト・スキーマ確定（マスタ定義に基づく新テスト）

> ⑤Run Aの旧テストは無意味（ストリームド調査で厳格な税務計算不要と判明）。
> マスタ定義完了後に新しいテスト基準で再テストする。

| # | タスク | 状態 | 担当 | 出典 |
|---|--------|:---:|:---:|------|
| 47 | ⑤ 正解データを新マスタ基準で再定義 | ❌ | 人間+AI | task_phase_a §⑤ |
| 48 | ⑤ 採点スクリプトをマスタ参照に変更 | ❌ | AI | task_phase_a §⑤ |
| 49 | ⑤ 新基準で採点＋合否判定 | ❌ | AI+人間 | task_phase_a §⑤ |
| 50 | ② tax分離設計確定（設計書のみ） | ❌ | AI | task_phase_a §② |
| 51 | G1-G5 Geminiプロンプト変更（null許容化+on_document+信頼度） | ❌ | AI | 優先度6 |

### フェーズ4: 借方/貸方・詳細ページ・CSV

| # | タスク | 状態 | 担当 | 出典 |
|---|--------|:---:|:---:|------|
| 52 | ③ 借方/貸方6列の実装 | ❌ | AI | task_phase_a §③ |
| 53 | F1 金額類推ロジック | ❌ | AI | 優先度7 |
| 54 | E1 個別仕訳ページ — 未入力項目の警告表示 | ❌ | AI | 優先度9 |
| 55 | E2 個別仕訳ページ — プレースホルダー表示 | ❌ | AI | 優先度9 |
| 56 | E3 個別仕訳ページ — マスター連動プルダウン | ❌ | AI | 優先度9 |
| 57 | E4 個別仕訳ページ — インライン編集 | ❌ | AI | 優先度9 |
| 58 | H2 CSV出力前null集計＋警告 | ❌ | AI | 優先度8 |
| 59 | H3 CSV出力前警告の方針記載 | ❌ | AI | 優先度8 |

### フェーズ5: 本番移行（Phase B/C）

| # | タスク | 状態 | 担当 | 出典 |
|---|--------|:---:|:---:|------|
| 60 | ④ 顧問先登録UI（プロンプト動的生成） | ❌ | AI | task_phase_a §④ |
| 61 | ⑥ 本番移行準備（tsconfig分離・型エラーゼロ） | ❌ | AI | task_phase_a §⑥ |
| 62 | J1-J2 ドキュメント最終更新 | ❌ | AI | 優先度10 |
| 63 | M1-M2 OCR前後処理 | ❌ | AI | 優先度12 |
| 64 | DBテーブル作成（PostgreSQL migration） | ❌ | AI | tax_category_schema.md |

### クリティカルパス（方針転換後）

```
型定義変更(#8-11) → マスタUI強化(#12-19) → スタッフ管理(#20-23) → 顧問先管理(#24-28) → 費用/正規化(#29-34)
       ↕ 並行可
  D7-D10プルダウン化 + ①取引日・摘要 + 証票メモ
       ↓
⑤新テスト → ②tax設計 → ③借方/貸方6列 → Phase A完了 → ⑥本番移行
```

### 全64タスクのサマリー

| フェーズ | タスク数 | ✅完了 | ❌未実施 |
|---------|:---:|:---:|:---:|
| 1（マスタ完成） | 39 | 23 | 16 |
| 2（一覧UI） | 12 | 6 | 6 |
| 3（テスト） | 5 | 0 | 5 |
| 4（借方/CSV） | 8 | 0 | 8 |
| 5（本番移行） | 5 | 0 | 5 |
| **合計** | **69** | **29** | **40** |

### 今すぐ着手すべきこと

| 担当 | タスク |
|:---:|--------|
| **AI** | #15 **税区分マスタUI — effective_from/to列表示**（残りのマスタUI強化） |
| **AI** | #16 **税区分マスタUI — インライン編集**（カスタムのみ） |
| **AI** | #19 **顧問先設定 税区分タブ — ?マーク警告**（ルール5） |
| **AI** | K15-K16 **想定費用UI** — 次のマイルストーン |
| **AI** | D7-D10 **プルダウン化** + ①取引日・摘要（並行可） |

## 進捗サマリー

| 優先度 | 状態 | 理由 |
|:---:|:---:|------|
| 1（型定義） | ✅完了 | 他の全作業がこの型に依存する。最初に固めないと手戻り |
| 2（警告ラベル） | ✅完了 | 型と警告の相関が整合しないとUI実装が矛盾する |
| 3（マスター作成） | ✅完了 | K1-K5全完了。マスタデータ+独立ページ+設計ルール13項目確定 |
| 4（一覧UI） | 🟡一部完了 | D1-D6✅完了。D7-D10❌はマスター完了につき**実装可能** |
| 5（テストデータ） | ✅完了 | I1-I2完了 |
| 6（プロンプト） | ❌未着手 | マスタ定義完了後に着手（方針転換後はフェーズ3） |
| 7（金額類推） | ❌未着手 | ③借方/貸方6列完了後に着手（フェーズ4） |
| 8（CSV出力） | 🟡一部完了 | H1✅完了。H2-H3❌未着手（フェーズ4） |
| 9（個別仕訳ページ） | ❌未着手 | D7-D10完了後に着手（フェーズ4） |
| 10（ドキュメント） | ❌未着手 | 全作業完了後に最終更新（フェーズ5） |
| **11（管理ページ群）** | **🟡一部完了** | K6-K9✅、K10-K14✅、K21-K24/K26✅完了。次は想定費用（K15-K16）→正規化（K17-K18）→ID紐付け（K19-K20） |
| 12（OCR前後処理） | ❌未着手 | 実データ投入時に着手（フェーズ5） |

> **方針転換（2026-03-06）**: ストリームド調査の結果、厳格な税務計算不要と判明。過去の⑤Run Aテストは無意味。マスタ定義を先行し、定義に基づいたテストを後から行う。⑤正解データ作成はボトルネックではなくなった。

---

## STREAMED（ストリームド）のnull表示（調査結果）

| 状態 | STREAMEDの表示 |
|------|---------------|
| 値なし（空欄） | `「-」` または空白 |
| 勘定科目未確定 | `「未確定」` テキスト（マスター内の正式科目として存在） |
| 読み取り不能（重大） | 🔴 赤アイコン（❗） |
| 読み取り不能（軽微） | 🟡 黄アイコン（⚠） |
| フィルタ検索 | 「空欄」で検索・抽出可能 |
| 勘定科目プルダウン | 先頭に「未確定（使用しない）」→ 以下通常科目 |
| デフォルト税区分 | 勘定科目ごとに`自動判定(仕入)`等を設定 |

---

## 2026-03-11 セッション記録

### 実装済み（コード変更確定）

#### 1. `compareWithNull`のdirection修正
- **ファイル**: `src/mocks/definitions/field-nullable-spec.ts` L93
- **修正内容**: 非null値の比較に`direction`が反映されていなかったバグを修正
- **影響範囲**: 全ソート列（日付・勘定科目・補助・税区分・金額）の降順ソートが正常動作するようになった
```diff
-  return compareFn(a, b);
+  const result = compareFn(a, b);
+  return direction === 'desc' ? -result : result;
```

#### 2. 金額列のソートを代表値方式に変更
- **ファイル**: `src/mocks/components/JournalListLevel3Mock.vue` L1902-1930
- **方針**: 文字列列（勘定科目・補助・税区分）は1行目の値、金額列は全エントリの合計
- **修正内容**:
  - `entries[0]?.amount`（1行目のみ）→ `entries.reduce(...)`（全エントリ合計）
  - `|| null`（falsyチェック）→ `some(e => e.amount != null)`（明示的null判定）で金額0がnullに変換されるバグも同時修正
  - 金額列のnull配置を独自実装：昇順=`null→0→1→2...`、降順=`...→2→1→0→null`

#### 3. 代表値方式の設計根拠
- **MF・弥生**: 金額ソート自体が存在しない。業界標準なし
- **ストリームド**: 各項目クリックでソート可能（金額含む）。複合仕訳の金額ソートルール未確認
- **本アプリの金額ソートは独自機能**。根拠は「ユーザーの直感」のみ

### 発見した問題（未修正）

#### A. 勘定科目マスタと仕訳一覧の不連携
- **事実**: 以下のページがそれぞれ**独立して**`ACCOUNT_MASTER`をコピー・フィルタしており、相互に連携していない

| ページ | URL | データソース | 連携 |
|-------|-----|------------|------|
| 事務所共通 勘定科目マスタ | `/master/accounts` | `MockMasterAccountsPage.vue` L165: `reactive([...ACCOUNT_MASTER])` | ❌独立 |
| 事務所共通 税区分マスタ | `/master/tax` | `MockMasterTaxCategoriesPage.vue` | ❌独立 |
| 顧問先別 勘定科目・税区分 | `/old/settings-accounts` | `ScreenS_AccountSettings.vue` L227: `reactive([...ACCOUNT_MASTER])`, L254: `reactive([...TAX_CATEGORY_MASTER])` | ❌独立 |
| 仕訳一覧ドロップダウン | `/mock/journal-list`（個別CLページURL確定後に変更予定） | `JournalListLevel3Mock.vue` L934: `ACCOUNT_MASTER`直接フィルタ | ❌独立 |

- **問題**: 顧問先別設定で科目を追加/非表示にしても、仕訳一覧のドロップダウンに反映されない
- **問題**: `selectAccount`（L1030）が`ACCOUNT_MASTER.find(a => a.name === accountName)`で事務所共通マスタから直接検索。顧問先別の税区分カスタマイズが反映されない

#### B. フィクスチャの勘定科目名がマスタに存在しない
- `journal_test_fixture_30cases.ts`の仕訳データに、`ACCOUNT_MASTER`に存在しない科目名がハードコードされている
  - L59: `メンテナンス費`（マスタに存在しない。「修繕費」が近い）
  - L534: `飲出羽`（意味不明な文字列）
- **根本原因**: フィクスチャの`account`が自由文字列で、マスタとの紐付けがない
- **対応方針**: 共有composable実装後に、フィクスチャの科目名をマスタのnameに揃える（DB実装時にはDB側で整合性が保証されるため、モック段階の暫定対応）

#### C. ドロップダウンの選択制御は実装済み
- テンプレートL372: `@mousedown.prevent="acc.selectable && selectAccount(...)"`で`selectable: false`の科目はクリック不可
- L370: CSSで`cursor-not-allowed text-gray-300`でグレーアウト表示
- **この点は問題なし**

### 次回セッション必須タスク（2026-03-11登録）

> **注意**: このセクションは最新のタスクリストである。過去のセッションで合意した内容はここに集約される。
> 古い「今すぐ着手すべきこと」（L395-403）は**このリストに統合済み**のため、矛盾する場合はこちらが優先。

| ID | タスク | 登録日 | 状態 | 備考 |
|:--:|--------|:------:|:----:|------|
| N1 | **URL名の適正化** — 全ページのルーティングパスを再設計し、AIでも階層構造が一目で分かる命名に統一 | 03-11 | ✅完了 | 下記N1詳細参照 |
| N1a | **settings/:clientId統一** — `/clients/:clientId/settings`を`/settings/:clientId`に統一。勘定科目・税区分を`/settings/accounts/:clientId`・`/settings/tax/:clientId`に配置 | 03-11 | ✅完了 | パターンB完全統一。旧URLは全てリダイレクト対応 |
| N1b | **仮ページ作成** — アップロード(`/upload/:clientId`)・学習(`/learning/:clientId`)の仮ページ | 03-11 | ✅完了 | `MockUploadPage.vue`・`MockLearningPage.vue`新規作成 |
| N1c | **formatDate型エラー修正** — ExportPage/ExportDetailPageの`formatDate(j.transaction_date)`にnullフォールバック追加 | 03-11 | ✅完了 | `?? ''`で型安全に |
| N1d | **ProgressDetailPage `row.id`型エラー** — `:key="row.id"`を`row.clientId`に修正 | 03-11 | ✅完了 | ProgressRow型にidが存在しないため |
| N2 | **共有composableのゼロベース再定義** — `useAccountSettings`を含む全composableの責務・相関を設計。相関図（mermaid）を本ドキュメントに作成 | 03-11 | ❌未着手 | 現状: 4ページが独立して`ACCOUNT_MASTER`をコピー。連携なし（問題Aの根本対応） |
| N3 | **顧問先UUIDの見える化** — 顧問先管理画面に顧問先UUIDを編集不可で表示。3コード（`clientCode`）とUUID（`uuid`）の取り違え防止 | 03-11 | ❌未着手 | `useClients.ts`のClient型: `id`（3コード-UUID形式）、`uuid`（UUID部分）、`clientCode`（3コード）の3つが存在 |
| N4 | **全UUIDの実装状況調査と紐付けロジック** — 顧問先UUID・担当UUID・証票単位UUID・仕訳単位UUIDの4種について、現在の実装状況を調査し、全てを紐付けするロジックを実装 | 03-11 | ❌未着手 | 仕訳フィクスチャの`id`は`j001`等の仮ID。証票は`document_id: 'receipt-001'`。本番用UUID未実装 |
| N5 | **仕訳一覧の編集UX改善** — ①勘定科目セルのドラッグ&ドロップ移動 ②右下マス押下でコピー（会計ソフト形式/Excel式） ③仕訳行で行全体を編集有効化せず、セル単位で部分的に編集有効化 | 03-11 | ❌未着手 | 現状: ドロップダウン選択のみ。セルコピー・ドラッグ移動なし |
| N6 | **5セグメント実装の適否確認** — 通帳・クレカ明細・売上・経費等の5つのセグメント分類が現在の設計と整合するか調査 | 03-11 | ❌未着手 | フィクスチャの`labels`に`RECEIPT`/`BANK_STATEMENT`/`CREDIT_CARD`/`TRANSPORT`/`MEDICAL`等のラベルが存在。5セグメントとの対応を確認 |
| N7 | **共有composable `useAccountSettings`の実装** — 顧問先別勘定科目・税区分データを一元管理。N2の相関図確定後に着手 | 03-11 | ❌未着手 | 実装詳細は下記参照 |

#### N7 実装詳細: `useAccountSettings`

**目的**: 顧問先別勘定科目・税区分データを一元管理し、全ページで同じデータソースを参照する

**実装内容**:
1. **新規作成**: `src/composables/useAccountSettings.ts`（または`src/features/`配下）
   - `ACCOUNT_MASTER`のreactiveコピーを保持
   - `TAX_CATEGORY_MASTER`のreactiveコピーを保持
   - 顧問先のclient type/hasRentalIncomeでフィルタしたcomputedを提供
   - 科目追加/削除/非表示のメソッドを提供
2. **修正**: `ScreenS_AccountSettings.vue`
   - L227の`reactive([...ACCOUNT_MASTER])`を`useAccountSettings()`に置換
   - L254の`reactive([...TAX_CATEGORY_MASTER])`を同composableに置換
3. **修正**: `JournalListLevel3Mock.vue`
   - L934-953の`filteredAccounts`を`useAccountSettings()`から取得に変更
   - L1030の`ACCOUNT_MASTER.find(...)`を顧問先別データから検索に変更

**メリット**:
- 本番実装時に、composable内部の`reactive([...MASTER])`を`API呼び出し + reactive(データ)`に置換するだけで済む
- PostgreSQL移行のデータソース切替ポイントが1箇所に集約される
- モック段階で顧問先別設定⇔仕訳一覧の連携動作を検証できる

#### N1 詳細: URL再構成（2026-03-11 完了）

**変更ファイル一覧**（9件変更 + 2件新規）:
- `router/index.ts` — ルート定義・リダイレクト
- `MockNavBar.vue` — 上段/下段メニュー遷移ロジック
- `useClients.ts` — パスマッチング正規表現
- `ScreenS_Settings.vue` — 設定ページ遷移先
- `MockMasterHubPage.vue` — ハブリンク
- `useAuthStore.ts` — 管理者専用パス一覧
- `MockExportPage.vue` — formatDate型エラー修正
- `MockExportDetailPage.vue` — formatDate型エラー修正
- `MockProgressDetailPage.vue` — row.id型エラー修正
- **[NEW]** `MockUploadPage.vue` — アップロード仮ページ
- **[NEW]** `MockLearningPage.vue` — 学習仮ページ

**最終URL構成マップ**:

```
顧問先固有ページ（パターンB: /xxx/:clientId）:
  /journal-list/:clientId                ← 仕訳一覧
  /drive-select/:clientId                ← Drive資料選別
  /upload/:clientId                      ← アップロード（仮ページ）
  /export/:clientId                      ← 出力
  /export-history/:clientId              ← ダウンロード履歴
  /export-detail/:clientId/:historyId    ← 出力詳細
  /learning/:clientId                    ← 学習（仮ページ）
  /settings/:clientId                    ← 設定トップ
  /settings/accounts/:clientId           ← 勘定科目マスタ
  /settings/tax/:clientId                ← 税区分マスタ

全社共通ページ（clientIdなし）:
  /progress                              ← 全社進捗一覧
  /master/clients                        ← 顧問先管理
  /master/staff                          ← スタッフ管理
  /master/costs                          ← 想定費用
  /master/settings                       ← 設定管理
```

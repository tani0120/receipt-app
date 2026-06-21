# 54. 補助科目(1:N)・部門(木構造)・ポート競合自動解決 — プロジェクトファイル

> **作成日**: 2026-06-17
> **セッション**: 6d3dc882（2026-06-16〜17）
> **最終更新**: 2026-06-20 08:55（Phase A検証完了: #1実装、#4-6検証済み）

---

## 1. 概要

MFクラウド会計の補助科目(1:N)・部門(木構造)をsugusuruに永続化し、顧問先科目画面に表示する実装。
加えて、import-client-accountsの不完全な保存、mfJournalImporterの既存バグ、nodemon再起動時のポート競合を修正した。

---

## 2. 経緯

### 発端: AIの設計ミス

AIが§53 Override方式の実装中に、補助科目を`Record<string, string>`（1:1型）で実装した。
MFの補助科目は1科目に複数紐づく（1:N）構造であり、実運用不可だった。

### ユーザーの原則指示

> 「MF管理画面で作成 → MCPで取得 → sugusuruはキャッシュ表示+MF-IDマッピングで送信」
> 「フロントは表示するだけ。バックエンドとの責務分離をしろ」

この原則は勘定科目・税区分・補助科目・部門の全てに共通。sugusuru側で独自に作成する機能は不要。

### 追加発見した問題

実装過程で以下の追加問題を発見・修正した:

1. **import-client-accounts（MFインポートボタン）が科目しか保存しない**: 税区分はマッピング用に取得していたが永続化せず、補助科目・部門は取得すらしていなかった
2. **mfJournalImporter.ts既存バグ**: `branch.debitor`/`branch.creditor`がnullの仕訳行でクラッシュ（sync-allが500エラー）
3. **ポート競合**: Windowsでnodemon再起動時に旧プロセスの子プロセスが残留し、新プロセスがEADDRINUSEでクラッシュ

---

## 3. 解決した問題一覧

### 当初8件

| # | 問題 | 対応 | 状態 |
|---|---|---|---|
| S1 | subAccountsが1:1型（Record） | MFのsub_accounts配列（1:N）をそのまま保存する方式に変更 | ✅ |
| S2 | GET /client/:clientId APIがsubAccountsを返さない | レスポンスにsubAccountsMap, departmentsフィールドを追加 | ✅ |
| S3 | fetchFromServerがsubAccountsを取得しない | clientAccountStore.tsのレスポンス解析にsubAccountsMap, departments追加 | ✅ |
| S4 | sync-allでMF補助科目を永続化しない | sync-all時にsub_accountsを科目データから抽出してJSONに保存 | ✅ |
| S5 | §53設計書（1:N ClientSubAccountテーブル）と実装（1:1 Record）の乖離 | §53設計書を実装に合わせて更新（本ファイルで記録） | ✅ |
| M1 | migrateFromLegacyのOverride抽出がMF連携時もマスタ比較 | MFデータと比較するよう修正 | ✅ |
| D1 | 部門のストア/UIが存在しない | MFのdepartmentsをキャッシュ保存+タグ表示（子部門は└プレフィックス） | ✅ |
| D2 | 部門名のみ保存、マスタ管理なし | MF-ID+name+parent_id+search_keyの4フィールドで保存 | ✅ |

### 追加3件

| # | 問題 | 対応 | 状態 |
|---|---|---|---|
| 追加1 | import-client-accountsが科目しか保存しない | 補助科目・部門・税区分も全て保存するよう追加 | ✅ |
| 追加2 | mfJournalImporter.tsのside nullバグ | ~~当初: nullガード追加で仕訳全体スキップ~~ → **誤り**。MF複合仕訳(N:M)のnullはパディング。片方null→continue、非null側のみ取込に修正（2026-06-20） | ✅ 再修正済 |
| 追加3 | ポート競合でnodemon再起動失敗 | server.tsでEADDRINUSE検出→自動kill-port→2秒待ち→リトライ | ✅ |

---

## 4. MCP送信時のID体系

MCP経由での仕訳送信時、全ての項目でMF-IDを使用する。sugusuru独自のローマ字IDはsugusuru内部参照用（AI推論、全社横断、MF未連携顧問先）であり、外部通信には使わない。

| 項目 | sugusuru内部ID | MCP送信ID | 全社マスタ |
|---|---|---|---|
| 勘定科目 | 独自ローマ字ID（`FUTSUUYOKIN_IND`等） | `mfAccountId` | ✅ ある（241件） |
| 税区分 | 独自ローマ字ID（`TAX_10_PURCHASE`等） | `mfTaxId` | ✅ ある（151件） |
| 補助科目 | なし（MF-IDがそのままID） | `mfSubId` | ❌ ない（事業者固有） |
| 部門 | なし（MF-IDがそのままID） | `mfDeptId` | ❌ ない（事業者固有） |

補助科目・部門に独自IDがない理由:
- 事業者ごとに完全に閉じている（事業者Aの「三井住友B支店」≠事業者Bの口座）
- 追加/削除はMF管理画面のみ（MCPにpostSubAccounts/postDepartmentsツールは存在しない）
- MF-IDの安定性はMFが保証する

---

## 5. 変更ファイル一覧

### 5-1. 型定義修正

| ファイル | 変更内容 |
|---|---|
| [mfMcpClient.ts](file:///c:/dev/receipt-app/src/api/services/mfMcpClient.ts) | `mcpFetchSubAccounts`の戻り値型をオブジェクトラッパー対応に修正。`mcpFetchDepartments`の戻り値型に`parent_id`, `search_key`を追加 |
| [mfMappingService.ts](file:///c:/dev/receipt-app/src/api/services/mfMappingService.ts) | `buildSubAccountMap`/`buildDepartmentMap`の型を実機データに合わせて修正 |

### 5-2. バックエンド保存

| ファイル | 変更内容 |
|---|---|
| [accountMasterApi.ts](file:///c:/dev/receipt-app/src/api/services/accountMasterApi.ts) | `ClientOverrideData.subAccounts`の1:1型（`Record<string, string>`）を削除。`persistSubAccounts()`/`restoreSubAccounts()`を新設（`sub-accounts-{clientId}.json`に保存）。`persistDepartments()`/`restoreDepartments()`を新設（`departments-{clientId}.json`に保存）。`getClientAccounts()`のレスポンスにsubAccountsMap, departmentsを追加。`restoreAll()`に補助科目・部門の復元を追加 |
| [accountMasterRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/accountMasterRoutes.ts) | GET /client/:clientId レスポンスにsubAccountsMap, departmentsを追加（S2修正） |
| [mfRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/mfRoutes.ts) | sync-allに補助科目抽出+部門取得の永続化を追加（S4/D1修正）。import-client-accountsに補助科目・部門・税区分の永続化を追加（追加1修正） |

### 5-3. フロントエンド

| ファイル | 変更内容 |
|---|---|
| [clientAccountStore.ts](file:///c:/dev/receipt-app/src/stores/clientAccountStore.ts) | `fetchFromServer()`でsubAccountsMap, departmentsを取得するよう修正（S3修正） |
| [MockClientAccountsPage.vue](file:///c:/dev/receipt-app/src/views/client/MockClientAccountsPage.vue) | 補助科目表示をrowspan方式の行展開に変更（`expandedRows` computed追加。補助科目がある科目は補助科目数だけtr行を生成し、他列はrowspanで結合）。部門一覧セクション新設（MF取得データをタグ表示、子部門は└プレフィックス付き） |

### 5-4. バグ修正・インフラ

| ファイル | 変更内容 |
|---|---|
| [mfJournalImporter.ts](file:///c:/dev/receipt-app/src/api/services/mfJournalImporter.ts) | `validateMfJournal()`の金額チェックで`branch.debitor`/`branch.creditor`がnullの場合のガードを追加（追加2修正） |
| [server.ts](file:///c:/dev/receipt-app/src/server.ts) | EADDRINUSEエラー時に`npx kill-port`を自動実行→2秒待ち→リトライする自動リカバリを実装（追加3修正）。旧動作（エラー出力してクラッシュ）から自動復帰に変更 |

---

## 6. データ保存形式

### 6-1. 補助科目（sub-accounts-{clientId}.json）

キーがsugusuru科目ID（ローマ字ID）、値がMFの補助科目配列（1:N）。

```json
{
  "FUTSUUYOKIN_IND": [
    { "mfSubId": "HdxUdB7R...", "name": "紀陽銀行北花田支店普通0317163", "mfTaxId": "uk0H3oqR...", "searchKey": null },
    { "mfSubId": "ex537bp3...", "name": "三井住友銀行大阪中央支店残高別普通8488533", "mfTaxId": "uk0H3oqR...", "searchKey": "" },
    { "mfSubId": "Ud%2BBbFk...", "name": "三井住友難波支店残高別普通2262157", "mfTaxId": "uk0H3oqR...", "searchKey": "" }
  ],
  "AZUKARIKIN_IND": [
    { "mfSubId": "iipfA1%2F...", "name": "社会保険料", "mfTaxId": "uk0H3oqR...", "searchKey": null },
    { "mfSubId": "ZAv%2Fpz...", "name": "雇用保険", "mfTaxId": "uk0H3oqR...", "searchKey": null },
    { "mfSubId": "xHZThig...", "name": "所得税", "mfTaxId": "uk0H3oqR...", "searchKey": null },
    { "mfSubId": "Hcr7yzJ...", "name": "住民税", "mfTaxId": "uk0H3oqR...", "searchKey": null }
  ]
}
```

### 6-2. 部門（departments-{clientId}.json）

フラット配列。`parentId`で木構造を表現。

```json
[
  { "mfDeptId": "gw1yDKuG...", "name": "テストtks", "parentId": null, "searchKey": "" },
  { "mfDeptId": "Llc9loul...", "name": "テストtks　子部門", "parentId": "gw1yDKuG...", "searchKey": "" },
  { "mfDeptId": "qPV3RWMU...", "name": "テストtks　子部門2", "parentId": "gw1yDKuG...", "searchKey": "" }
]
```

---

## 7. 検証結果

| # | 検証項目 | 結果 |
|---|---|---|
| 1 | `npx tsc --noEmit` — 型チェック | ✅ エラーゼロ |
| 2 | サーバー起動 — 旧データマイグレーション | ✅ 正常（補助科目・部門の復元ログ出力） |
| 3 | sync-all（c_wTdnMKDO） — 補助科目永続化 | ✅ 16件（8科目）を`sub-accounts-c_wTdnMKDO.json`に保存 |
| 4 | sync-all（c_wTdnMKDO） — 部門永続化 | ✅ 3件（親1+子2）を`departments-c_wTdnMKDO.json`に保存 |
| 5 | 顧問先科目画面 — 補助科目がrowspanで行展開 | ✅ 各補助科目が独立したtr行で表示 |
| 6 | 顧問先科目画面 — 部門一覧タグ表示 | ✅ 子部門は└プレフィックス付き |
| 7 | リロード後 — GET APIでデータ復元 | ✅ subAccountsMap(16件)+departments(3件)が消失なし |
| 8 | import-client-accounts — 全データ保存 | ✅ 科目+補助+部門+税区分を一括保存 |
| 9 | mfJournalImporter — side nullクラッシュ | ✅ nullガードで回避、警告ログ出力 |

### 実機データ（TSK / c_wTdnMKDO / あああ — 個人事業者）

**補助科目（16件、8科目）:**

| 科目 | 補助科目 |
|---|---|
| 現金（GENKIN_IND） | 小口現金 |
| 普通預金（FUTSUUYOKIN_IND） | 紀陽銀行北花田支店、三井住友大阪中央支店、三井住友難波支店 |
| 事業主貸（JIGYOUNUSHIKASHI_IND） | 源泉所得税 |
| 未払金（MIHARAIKIN_IND） | 三井住友カードOlive、ご本人Olive、ポイント |
| 預り金（AZUKARIKIN_IND） | 社会保険料、雇用保険、所得税、住民税 |
| 旅費交通費（RYOHIKOUTSUUHI_IND） | 通勤手当 |
| 接待交際費（SETTAIKOUSAIHI_IND） | 飲食費 |
| 給料賃金（KYUURYOUCHINGIN_CORP） | 住宅手当、残業手当 |

**部門（3件、木構造）:**

| 部門名 | 親部門 |
|---|---|
| テストtks | （ルート） |
| └ テストtks 子部門 | テストtks |
| └ テストtks 子部門2 | テストtks |

---

## 8. 関連プロジェクトファイルへの影響

今回の変更に伴い、以下のプロジェクトファイルの記載を更新した。

| プロジェクトファイル | 更新箇所 |
|---|---|
| [53_client_account_architecture.md](file:///c:/dev/receipt-app/docs/genzai/53_client_account_architecture.md) | §Q2のsubAccountを「ClientSubAccountテーブル」から「MFキャッシュ方式」に修正。§10 UI変更実績に補助科目rowspan展開・部門一覧セクションを追記。§12データファイルにsub-accounts/departmentsを追記 |
| [51_mf_import_infrastructure.md](file:///c:/dev/receipt-app/docs/genzai/51_mf_import_infrastructure.md) | §2-3のimport-client-accountsの保存対象を「科目のみ」から「科目+補助科目+部門+税区分」に修正 |
| [37_infra_mcp.md](file:///c:/dev/receipt-app/docs/genzai/37_infra_mcp.md) | §14-5の部門ツール（mfc_ca_getDepartments）の検証結果を「0件」から「3件取得済み（木構造）」に修正 |
| [43_master_factsheet.md](file:///c:/dev/receipt-app/docs/genzai/43_master_factsheet.md) | §8-1の`"subAccounts": null`を「sub-accounts-{clientId}.json に分離保存」に修正。§12-1の補助科目列の説明を「1:Nのrowspan行展開」に修正 |

---

## 9. 当初スコープ完了

全11件（当初8件+追加3件）が完了。以降の§10-13は後続調査（2026-06-17〜18）で判明した事項。

---

## 10. 独自ID化計画の撤回と仕訳データの現状

### 経緯: 独自ID化計画（撤回済み）

journal_pipeline_analysis.md §10-12では、勘定科目・税区分と同様に補助科目・部門にもsugusuru独自ローマ字IDを新設する計画があった。

```
当初計画:
  subAccountId  = {親科目ID}__SUB__{名前ローマ字}   例: FUTSUUYOKIN_IND__SUB__KIYOGINKO_KITAHANADASHITEN
  departmentId  = DEPT__{名前ローマ字}               例: DEPT__TESTTKS
```

§4で確定した通り、以下の理由で撤回:
- 補助科目・部門は事業者固有データ（事業者Aの「三井住友B支店」≠ 事業者Bの口座）
- 追加/削除はMF管理画面のみ（MCPにpostSubAccounts/postDepartmentsツールは存在しない）
- MF-IDの安定性はMFが保証する
- 全社横断で統合する必要がない

### 仕訳データ内の保存形式（現状）

仕訳データ（journals-*.json, confirmed_journals.json）の`sub_account`と`department`フィールドは**名前文字列**のまま保存されている。

| フィールド | 型定義（domain-journal.ts） | 現在の値の例 | MF送信時の変換 |
|---|---|---|---|
| sub_account | `string \| null`（L190） | `"紀陽銀行北花田支店"` | 名前 → `subAccountMap.get(名前)` → mfSubId |
| department | `string \| null`（L196） | `null` | 名前 → `departmentMap.get(名前)` → mfDeptId |

MF送信時の逆引きはjournalToMfConverter.ts L350-358で実装済み:
```typescript
// 補助科目（名前→MF-ID）
if (entry.sub_account) {
  const mfSubId = maps.subAccountMap.get(entry.sub_account)
  if (mfSubId) side.sub_account_id = mfSubId
}
// 部門（名前→MF-ID）
if (entry.department) {
  const mfDeptId = maps.departmentMap.get(entry.department)
  if (mfDeptId) side.department_id = mfDeptId
}
```

### 名前文字列保存のリスク評価

| リスク | 影響 | 発生確率 |
|---|---|---|
| MF側で補助科目名を変更 | 旧名の仕訳が新名のマスタとマッチしなくなる（MF送信時にmfSubIdが解決できない） | 低（口座名の変更は稀） |
| 同名の補助科目が異なる科目に存在 | journalToMfConverterの名前逆引きで誤マッチ | 低（MFの補助科目は親科目に紐づくため同名は稀） |
| CSV出力時に名前解決が不要 | 名前のまま出力できるため変換不要（これはメリット） | — |
| Supabase移行時にFK制約が張れない | 名前文字列ではFK参照不可。mfSubIdに移行するかテキストのまま残すか判断が必要 | 確実（移行時に判断必須） |

現時点では名前文字列保存で実害はない。将来mfSubIdベースに移行する場合はデータマイグレーションが必要。

---

## 11. 仕訳一覧での補助科目関連修正（2026-06-17 実装済み）

### 11-1. 補助科目1:Nバグ修正

**現象**: 勘定科目選択時に`clientSettings.subAccounts.value[accountId]`（`MfSubAccountEntry[]`）がそのまま`entry.sub_account`（string型）に代入されていた。テンプレートでJSON生表示（`[{mfSubId:"...", name:"..."}]`）が発生。

**修正箇所**（JournalListLevel3Mock.vue、3箇所）:

| 箇所 | 関数 | 修正内容 |
|---|---|---|
| 科目ドロップダウン選択時 | `selectAccountItem()` | 配列1件→name自動代入、複数件→null |
| 科目セルへのペースト時 | `handleAccountPaste()` | 同上 |
| 科目セルのドラッグ複製時 | フィルハンドル | 同上 |

修正ロジック: 配列1件→`name`を自動代入、複数件→`null`（ユーザーが補助科目ドロップダウンから選択）

### 11-2. 補助科目検索付きドロップダウン追加

補助科目列にプレーンテキスト入力しかなかった問題を解消。勘定科目に紐づく補助科目候補（`MfSubAccountEntry[]`）をドロップダウン表示し、テキスト入力で部分一致フィルタ可能にした。税区分ドロップダウンと同じUIパターン。

---

## 12. MF-ID依存箇所の全量調査（2026-06-17 調査済み）

### バックエンド

| ファイル | 箇所 | 内容 |
|---|---|---|
| accountMasterApi.ts | L380-389 | `MfSubAccountEntry`型定義: `mfSubId`, `name`, `mfTaxId`, `searchKey` |
| accountMasterApi.ts | L392-401 | `MfDepartmentEntry`型定義: `mfDeptId`, `name`, `parentId`, `searchKey` |
| accountMasterApi.ts | L422-426 | キャッシュストア: `clientSubAccountStore`（Map）, `clientDepartmentStore`（Map） |
| accountMasterApi.ts | L453-466 | `persistSubAccounts()`, `persistDepartments()` 永続化 |
| mfRoutes.ts | L533-586 | sync-allでMCP→`mfSubId: s.id`としてMF-IDを直接保存 |
| mfMappingService.ts | L221-248 | `buildSubAccountMap()` 名前→mfSubIdマップ、`buildDepartmentMap()` 名前→mfDeptIdマップ |
| journalToMfConverter.ts | L350-358 | MF送信時: `entry.sub_account`（名前）→`maps.subAccountMap.get(名前)`→mfSubId |

### フロントエンド

| ファイル | 箇所 | 内容 |
|---|---|---|
| clientAccountStore.ts | L34-36 | `subAccountsMap`: `{mfSubId, name, mfTaxId}`配列、`departmentsMap`: `{mfDeptId, name, parentId}`配列 |
| MockClientAccountsPage.vue | L232 | 部門タグ表示: `:key="dept.mfDeptId"` |
| MockClientAccountsPage.vue | L408 | 補助科目取得: `{mfSubId, name, mfTaxId}[]` |
| JournalListLevel3Mock.vue | L3529 | 補助科目型定義（MfSubAccountEntry互換） |
| JournalListLevel3Mock.vue | L3452,3949,4397 | 科目選択時の補助科目配列→name代入（§11-1で修正済み） |

### 仕訳データ内

| ファイル | フィールド | 値の形式 |
|---|---|---|
| domain-journal.ts L190 | `sub_account: string \| null` | 名前文字列（例: "紀陽銀行北花田支店"） |
| domain-journal.ts L196 | `department: string \| null` | 名前文字列（例: null） |
| exportMfCsv.ts L178-179 | 借方補助科目 / 借方部門 | `debit?.sub_account ?? ''` 名前そのまま出力 |

### 取引先マスタ（Vendor型）

取引先マスタにも補助科目・部門フィールドがあり、全て名前文字列（`string | null`）で保存されている。

| ファイル | フィールド | 用途 |
|---|---|---|
| vendor.type.ts L405 | `debit_sub_account: string \| null` | 借方補助科目（顧問先固有。globalでは基本null） |
| vendor.type.ts L424 | `debit_department: string \| null` | 借方部門（同上） |
| vendor.type.ts L439 | `credit_sub_account: string \| null` | 貸方補助科目（例: 銀行口座名） |
| vendor.type.ts L451 | `credit_department: string \| null` | 貸方部門（同上） |

### 科目確定パイプライン

| ファイル | 箇所 | 内容 |
|---|---|---|
| accountDetermination.ts L42-44 | `AccountDeterminationResult.subAccount / department` | 科目確定結果に補助科目・部門を含む（名前文字列） |
| accountDetermination.ts L252-253 | `result.subAccount = matchedVendor.debit_sub_account` | 取引先マスタの値をそのまま転記 |
| accountDetermination.ts L298-299 | `result.department = vendor.debit_department` | 同上（T番号一致時） |

### Supabaseヘルパー（移行時の影響箇所）

| ファイル | 箇所 | 内容 |
|---|---|---|
| helpers.ts L34-38 | `debit_sub_account`, `credit_sub_account` | DB行→Vendor型変換 |
| helpers.ts L66-70 | `debit_sub_account`, `credit_sub_account` | Vendor型→DB行変換 |

---

## 13. 残作業

| # | 内容 | 優先度 | 状態 |
|---|---|---|---|
| 1 | 補助科目のデフォルト税区分（mfTaxId）をsugusuru taxCategoryIdに紐付け | P1 | ✅ 実装済み（MfSubAccountEntry.taxCategoryIdフィールド追加。sync-all時にmfTaxIdToMasterIdマップで変換。16件全マッチ） |
| 2 | 仕訳データのsub_accountをmfSubIdベースに移行するか判断 | P2 | 未着手（§57完了後に判断） |
| 3 | 仕訳データのdepartmentをmfDeptIdベースに移行するか判断 | P2 | 未着手（§57完了後に判断） |
| 4 | sync-all実行で全データが正規化されることの実機検証 | P1 | ✅ 検証済み（科目108/108マッチ、税区分151/151マッチ、補助科目16件MF-ID永続化、部門3件）。仕訳: 当初32件エラースキップ→N:Mパディングバグが原因→修正後は2026期60件・2025期333件全取込。決算整理2件（MF#342減価償却、MF#343売上振替）はwarning通知+is_closing_entry=trueフラグで正しく処理。committed=false（承認待ち、設計通り） |
| 5 | confirmed仕訳にバリデーション警告が出ないことの検証 | P1 | ✅ 検証済み（confirmedToJournalRow()でlabels:[]ハードコード。validate-allはgetJournals()のみ対象。設計通り） |
| 6 | CSV出力で補助科目名・部門名が正しく表示されることの検証 | P1 | ✅ 検証済み（exportMfCsv.ts L178-188で名前文字列をそのまま出力。実データ1/3件に補助科目あり） |
| 7 | showImportedデフォルトOFF検討（旧showPastCsv） | P2 | 未着手（§57完了後に判断） |
| 8 | 取引先マスタのdebit_sub_account/debit_departmentの名前文字列依存 | P2 | 未着手（§57完了後に判断） |

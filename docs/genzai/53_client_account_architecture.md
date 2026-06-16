# 顧問先勘定科目アーキテクチャ — 確定版設計書

> 確定日: 2026-06-17
> 実装完了日: 2026-06-17
> ステータス: ✅ 設計確定・実装完了

---

## 1. 前提知識

### sugusuruマスタとは何か

MFクラウド会計のMCP（API）から取得した勘定科目と**全く同じもの**に、sugusuru独自の安定IDを付与したもの。

MFのIDは事業者（テナント）ごとにユニーク:
```
A社のMF: 現金 → id: kITjdy4v...
B社のMF: 現金 → id: xyz789...
C社のMF: 現金 → id: abc123...

全部同じ「現金」だがMF IDが違う
  ↓
sugusuru: 現金 → accountId: GENKIN_CORP（安定キー）
  ↓
仕訳送信時に名前照合で各社のMF IDに変換
```

**マスタはMCPデータと名前・カテゴリが完全一致（法人133件、個人108件、合計241件）**

### sugusuru独自に付与しているフィールド

| フィールド | 用途 | MCPとの関係 |
|---|---|---|
| `accountId` | 安定参照キー（MF IDの代替） | sugusuru独自。MF IDは事業者固有で使えないため |
| `target` | `corp`/`individual`。UI表示フィルタ | sugusuru独自。MF側は事業所ごとに法人/個人を返すので実質同等 |
| `accountGroup` | `BS_ASSET`等 | MCPの`ASSET`を変換 |
| `defaultTaxCategoryId` | `COMMON_EXEMPT`等 | MCPのtax_idを名前照合でsugusuru税区分IDに変換 |
| `sortOrder`, `hidden`, `isCustom` | 運用フィールド | sugusuru独自 |

---

## 2. 現状の問題

### 現行アーキテクチャ（MF未連携時）

```
全社マスタ（account-master.json）: 241件
  ↓ 初回アクセス時
顧問先データ作成: 241件を物理コピー（クローン）
  ↓ サーバー起動時
syncMasterAccountsToClients():
  ✅ マスタにあって顧問先にない → 追加
  ✅ IDが一致する行のフィールド更新
  ❌ 顧問先にあってマスタにない → 何もしない（削除なし）
```

### 133件 vs 145件問題

c_VdAnGFq3（法人・MF未連携）でcorp科目が145件表示される。正しくは133件。

**差分12件の原因:**

| 件数 | 原因 |
|---|---|
| 8件 | マスタのaccountIdリネーム（ローマ字ID移行）時に、顧問先データの旧IDが孤立。同期はaccountIdで照合するため、旧IDの行は「マスタにない独自科目」として残り続ける |
| 4件 | 過去のMFインポートで`_2`付きIDとして重複追加された残骸 |

**全社マスタでは顕在化しない理由:**
全社マスタはIDリネーム時に旧行を直接削除・置換する。顧問先データの同期には「削除」がないため、旧IDが蓄積する。

### 根本問題

MF未連携の場合、`顧問先データ == 全社マスタ` なのに:
```
コピー → 同期 → 差分補正（削除なし）
```
をやっている。同期処理そのものが問題の温床。

---

## 3. 確定アーキテクチャ

### 最終形

```
DB（現在JSON / 将来Supabase）:
  accounts_master           ← MCPデフォルト科目の安定IDコピー（全事業者共通241件）
  client_mf_accounts        ← MFインポート済みデータ（顧問先独自科目含む）
  client_account_overrides  ← 顧問先固有の設定のみ（hidden/sortOrder/defaultTaxCategoryId）

API:
  GET /clients/:id/accounts
    ↓
  ┌─ MF未連携 ─────────────────────────┐
  │ accounts_master                      │
  │ + client_account_overrides           │
  │ → EnrichedAccount[]                  │
  └──────────────────────────────────────┘
  ┌─ MF連携済み ───────────────────────┐
  │ client_mf_accounts                   │
  │ + client_account_overrides           │
  │ → EnrichedAccount[]                  │
  └──────────────────────────────────────┘

フロント:
  Store → EnrichedAccount[] → UI
  MasterもOverrideも知らない。
```

### 顧問先独自科目の扱い

**顧問先独自科目（例: 「扇風機費用」）は全社マスタに入れない。**

| 科目の種類 | 保持場所 | 他の顧問先への影響 |
|---|---|---|
| MFデフォルト科目（全事業者共通） | `accounts_master` | MF未連携の全顧問先に反映 |
| 顧問先独自科目（MF管理画面で追加） | `client_mf_accounts`にのみ保持 | **なし** |

```
顧問先AがMFで「扇風機費用」追加 → MFインポート再実行
  ↓
名前照合: マスタにない → generateMasterId()で新規ID生成
  ↓
A社のclient_mf_accountsにのみ保存
全社マスタ: 241件のまま。汚染されない。
200社あっても1社の独自科目は1社にしか存在しない。
```

### 全社マスタへの科目追加時のID生成

全社マスタのMCPインポート時（基準顧問先からMCPで取得）:
- 名前照合でマスタにない科目 → `generateMasterId()`（[generateMasterId.ts](file:///c:/dev/receipt-app/src/api/services/generateMasterId.ts)）でsugusuruのaccountIdを自動生成
- 実装: [mfAccountImportService.ts L177](file:///c:/dev/receipt-app/src/api/services/mfAccountImportService.ts#L177)

### 保存フロー

```
Frontend
  ↓
EnrichedAccount[]をPUT
  ↓
Backend
  Master（or MFデータ）と比較
  ↓ Diff抽出
  ↓
Overrideだけ保存

※フロントはOverrideの存在を知らない
※Supabase移行後、内部実装だけPATCH /overridesへ変更可能
```

---

## 4. 設計ルール（6項目確定）

### Rule 1: accountIdは安定参照キー
accountIdは業務キーとして全システムで参照される。通常運用で変更しない。

### Rule 2: accountId変更時は全参照を移行
変更が必要な場合は `renameAccountId(oldId, newId)` のような専用マイグレーション経由のみ。
更新対象:
- accounts_master
- client_account_overrides
- client_mf_accounts
- 仕訳データ（journal entries）
- tax_mappings

Supabase移行後は `FOREIGN KEY ON UPDATE CASCADE` で強制可能。

### Rule 3: フロントはOverrideの存在を知らない
フロントはEnrichedAccount[]のみ受け取る。Master/Override/MFデータの区別はバックエンドが吸収する。

### Rule 4: 保存APIは完成形を受け取る
保存APIはEnrichedAccount[]を受け取り、差分抽出はバックエンド責務。フロントにOverride生成ロジックを持たせない。

### Rule 5: MFインポート後にOverride孤立チェック
MFインポート後、Override.accountIdに対応する科目が存在するか確認。存在しない場合は警告ログを出力。

### Rule 6: 孤立Overrideは警告対象。自動削除しない
一時的な名称変更の可能性があるため、孤立Overrideは自動削除せず警告のみ。管理画面で可視化を推奨。

---

## 5. 設計判断（Q1-Q5確定）

### Q1: MF未連携→連携への移行時（✅ Override維持してマージ）

```
MF未連携時: Master + Override
  ↓ MF連携
MF連携後:   MFデータ + Override（維持）

accountIdで結合。起点がMasterからMFデータへ切り替わるだけ。
Overrideは残る。

例: hidden=trueのまま運用していた科目が、MF連携後にhidden=falseに戻るのはUX破綻。
```

### Q2: Override対象フィールド（✅ 3フィールド + subAccountは別エンティティ）

**Override対象:**
| フィールド | Override |
|---|---|
| `hidden` | ✅ |
| `sortOrder` | ✅ |
| `defaultTaxCategoryId` | ✅ |

**別エンティティ:**
| フィールド | 方式 |
|---|---|
| `subAccount` | `ClientSubAccount`テーブル（1:Nの関係。Overrideの1:1とは性質が異なる） |

### Q3: 税区分も同じ設計か（✅ YES、ただし後回し）

税区分も同じ「マスタ + Override」方式へ寄せる。ただし:
- 税区分は既にenrichRow/visibleInがバックエンドにある
- 勘定科目で成功パターンを確立してからTaxCategoryOverrideへ横展開

### Q4: JSON段階での実装範囲（✅ JSON段階から今やる）

理由:
- 133件問題はJSON実装で発生している。Supabase移行まで待つと半年維持
- JSON版→Supabase版で二回設計変更になる
- 今Override方式にすれば、Supabase移行は永続化層差し替えだけ

### Q5: MF連携済みでもOverride必要（✅ 必須）

MF連携済みの方がむしろOverrideが重要:
```
MFから現金を取得 → ユーザーがhidden=true → 翌日MF同期 → hiddenが消えると困る
```

最終形:
```
MasterAccount or MfAccount
+ ClientOverride
↓
EnrichedAccount
```

### 追加の重要な洞察

**saveClientAccounts()（241件全件PUT）が消える。**
Override方式なら差分だけ保存:
```json
{ "accountId": "GENKIN_CORP", "hidden": true }
```
Supabase移行時にPATCH型へ自然移行。

---

## 6. 実装済みコードの対応箇所

| 関数 | 実装内容 | ステータス |
|---|---|---|
| `getClientAccounts(clientId)` | マスタ直接参照 + Override合成。MFデータがあればMFベース | ✅ 実装完了 |
| `saveClientAccounts(clientId, accounts)` | diff抽出 → `overrides-{clientId}.json` に保存 | ✅ 実装完了 |
| `saveMfAccounts(clientId, accounts)` | MFインポートデータを `mf-accounts-{clientId}.json` に保存 | ✅ 新設 |
| `syncMasterAccountsToClients()` | **削除済み**。Override方式では同期不要 | ✅ 削除完了 |
| `syncMasterTaxCategoriesToClients()` | **削除済み**。Override方式では同期不要 | ✅ 削除完了 |
| `getClientTaxCategories(clientId)` | マスタ直接参照 + Override合成 | ✅ 実装完了 |
| `saveClientTaxCategories(clientId, taxes)` | diff抽出 → `tax-overrides-{clientId}.json` に保存 | ✅ 実装完了 |
| `detectOrphanedOverrides(clientId)` | 孤立Override検出（起動時自動実行） | ✅ 新設 |
| `renameAccountId(oldId, newId)` | IDリネームマイグレーションユーティリティ | ✅ 新設 |

### パイプライン参照先の変更（実装済み）

| 参照元 | 旧 | 新（実装済み） |
|---|---|---|
| MF送信マッピング | `loadSugusruAccounts()` = JSON直接読込 | `loadClientAccountsForMapping(clientId)` = `getClientAccounts(clientId)` 経由 |
| 科目名マップ | `getAccountNameMap()` = 全社マスタのみ | `getAccountNameMap(clientId?)` = clientId指定可能 |
| 仕訳バリデーション | `getClientAccountsForValidation(clientId)` | 変更なし（内部で`getClientAccounts(clientId)`を呼んでいるため自動対応） |
| MFインポート保存 | `saveClientAccounts()` | `saveMfAccounts()` に変更（mfRoutes.ts 3箇所） |

---

## 7. 「Master + Override → 再構成」との違い（過去の議論との整合性）

| 項目 | 以前のNG設計 | 今回の確定設計 |
|---|---|---|
| 再構成の場所 | **フロント**（composableチェーン） | **バックエンド**（APIレイヤー） |
| フロントの知識 | Master/Override/再構成ロジックを全部知っている | EnrichedAccount[]だけ知っている |
| SSOT | フロントが再構成するためSSOT崩壊 | バックエンドが唯一の合成元 |

**再構成自体は正当な設計パターン。フロントでやるのがNG。バックエンドでやるならOK。**
Rule 3（フロントはOverrideを知らない）がこれを保証する。

---

## 8. 設計上の懸念と対策

### 懸念1: accountId安定性

Override方式はaccountIdでの結合が前提。133件問題の本質はaccountIdリネーム時に顧問先側を更新しなかったこと。

**対策:** Rule 1（変更禁止）+ Rule 2（変更時は全参照マイグレーション）。Supabase移行後はFOREIGN KEY ON UPDATE CASCADEで強制。

### 懸念2: 保存API設計（移行戦略）

| 段階 | 方式 |
|---|---|
| JSON段階 | フロントはEnrichedAccount[]をPUT → バックエンドがdiff取ってOverride保存 |
| Supabase段階 | 内部実装をPATCH /overridesに変更。フロント変更なし |

フロントにOverride概念を漏らさない（Rule 3）ために、バックエンドdiff方式を採用。

### 懸念3: MF連携時のaccountId一致

MF未連携→連携への移行時、名前照合で同じaccountIdが使われるためOverrideは維持される。
ただしMF上でユーザーが科目名を変更した場合、名前不一致→新規ID→Overrideが孤立する。

**対策:** Rule 5（孤立チェック）+ Rule 6（自動削除しない）。

---

## 9. 科目追加ルール（MCP実機テストで確定）

### MCP実機テスト結果（2026-06-17）

MFに存在しない科目ID（`FAKE_SENPUUKIHI`）で仕訳送信を試行:

```
❌ エラー: mfc_ca_postJournals: 
invalid_request_body_value
"The specified value for one of the request body keys is not valid. 
 Target: account_id - FAKE_SENPUUKIHI"
```

**結論: MFに存在しないaccount_idでは仕訳送信不可能。**

### MF送信方式別の挙動

| 送信方式 | 科目の指定方法 | MFにない科目 |
|---|---|---|
| MCP API（`mfc_ca_postJournals`） | `account_id`（MF内部ID） | `invalid_request_body_value`で拒否 |
| CSV手動インポート | 科目名（テキスト） | MFが自動で科目を新規作成して成功 |

### 確定した科目追加ルール

**全顧問先一律で、sugusuru側での勘定科目追加は禁止。**

科目の追加はMF管理画面（または各会計ソフト側）で行い、MFインポートでsugusuruに取り込む。
MF未連携先も同様。sugusuru側で独自科目を追加するUIは提供しない。

理由:
- MF連携済み: account_idなしでMCP送信不可（実機確認済み）
- MF未連携: 科目追加UIを作る開発コストに対し、利用頻度が極めて低い。全社マスタ241件で大半のケースをカバーできる

### MF連携済みの科目追加フロー

```
ユーザーが新科目（扇風機費）を必要とする場合:
  ↓
MF管理画面で「扇風機費」を追加 → MF IDが付与される
  ↓
sugusuruの個別企業勘定科目画面でMFインポートボタン押下
  ↓
MCPでMF科目一覧取得 → 名前照合 → マスタにない → generateMasterId()で新規accountId生成
  ↓
client_mf_accountsに保存（全社マスタは汚染されない）
```

### 孤立チェックが原理的に不要な根拠

sugusuru側で科目追加を禁止したため、独自科目が存在するのはMFインポート経由のみ。
MFインポートは名前照合でaccountIdを生成するため、Overrideが孤立するケースはMF側で科目名を変更した場合のみ。
Rule 5/6は安全弁として残すが、優先度は低い。

---

## 10. UI変更実績

### 個別企業 勘定科目画面（MockClientAccountsPage.vue）

| 要素 | 状態 | 備考 |
|---|---|---|
| 科目追加ボタン | ❌ 廃止済み（L71コメント） | 「追加ボタン廃止。科目の追加はMF側で行う」 |
| MFインポートボタン | ✅ 維持 | MFから科目取得 |
| 保存ボタン | ✅ 維持 | hidden/sortOrder等の変更保存 |

### 個別企業 税区分画面（MockClientTaxPage.vue）

| 要素 | 状態 | 変更日 |
|---|---|---|
| ＋追加ボタン | ❌ 廃止（2026-06-17） | コメント化 |
| チェックボックス列（□列） | ❌ 廃止（2026-06-17） | col/th/td全て削除 |
| 一括操作（削除・コピー・追加） | ❌ 廃止（2026-06-17） | script関数も削除 |
| MFインポートボタン | ✅ 維持 | |
| 保存ボタン | ✅ 維持 | |
| 個別行の表示/非表示 | ✅ 維持 | hideRow/showRow |

---

## 11. パイプライン修正（✅ 実装完了）

### loadSugusruAccounts() → loadClientAccountsForMapping()（✅ 完了）

**目的:** 顧問先独自科目の仕訳をMFに送信できるようにする

**実装:** `loadSugusruAccounts()`を`loadClientAccountsForMapping(clientId)`に変更。内部で`getClientAccounts(clientId)`を呼び、その顧問先のEnrichedAccount[]で名前照合マップを作る

**変更ファイル:** [mfMappingService.ts](file:///c:/dev/receipt-app/src/api/services/mfMappingService.ts)

### getAccountNameMap()（✅ 完了）

**目的:** 仕訳一覧で顧問先独自科目の名前を表示する

**実装:** `clientId?`引数を追加。指定時はその顧問先のEnrichedAccount[]からマップ生成。未指定時は全社マスタ（後方互換）

**変更ファイル:** [accountMasterApi.ts](file:///c:/dev/receipt-app/src/api/services/accountMasterApi.ts)

### saveClientAccounts() / saveMfAccounts()（✅ 完了）

| 呼出元 | 旧 | 新（実装済み） |
|---|---|---|
| accountMasterRoutes.ts（PUT API） | 全件上書き | `saveClientAccounts()` → diff抽出 → Override保存 |
| mfRoutes.ts L533, L548, L916（MFインポート） | `saveClientAccounts()` | `saveMfAccounts()` → MFデータ全件保存 |
| accountMaster.repository.mock.ts | `saveClientAccounts()` | 変更なし（内部でdiff→Override保存に自動対応） |

---

## 12. タスク完了状況

### 全9項目 ✅ 実装完了（2026-06-17）

| # | 項目 | 根拠 | ステータス |
|---|---|---|---|
| 1 | Override方式のバックエンド実装 | §3 確定アーキテクチャ | ✅ AccountOverride型 + 合成ロジック + 永続化 |
| 2 | syncMasterAccountsToClients()の削除 | §2 根本問題 | ✅ 科目sync + 税区分sync 両方削除 |
| 3 | loadSugusruAccounts()のclientId対応 | §11 パイプライン修正 | ✅ loadClientAccountsForMapping(clientId) |
| 4 | getAccountNameMap()のclientId対応 | §11 パイプライン修正 | ✅ clientId?引数追加（後方互換） |
| 5 | saveClientAccounts()のdiff保存方式変更 | §11 パイプライン修正 | ✅ diff→Override保存 + saveMfAccounts新設 |
| 6 | 133件 vs 145件の差分12件 | §2 | ✅ Override方式移行で自然解消 |
| 7 | 税区分のOverride方式横展開 | Q3 | ✅ TaxCategoryOverride型 + 合成 + diff保存 |
| 8 | 孤立Override検出（Rule 5/6） | §9 | ✅ detectOrphanedOverrides() + 起動時自動実行 |
| 9 | accountIdリネームマイグレーション | Rule 2 | ✅ renameAccountId(oldId, newId) |

### 新規データファイル（実装で追加）

| ファイル | 用途 |
|---|---|
| `overrides-{clientId}.json` | 科目Override（hidden / sortOrder / defaultTaxCategoryId） |
| `mf-accounts-{clientId}.json` | MFインポートデータ（MF連携済みのベースデータ） |
| `tax-overrides-{clientId}.json` | 税区分Override（hidden） |

### 旧ファイルとの関係

| 旧ファイル | 新方式での扱い |
|---|---|
| `accounts-{clientId}.json` | 起動時に自動マイグレーション。overrides / mf-accountsに分離 |
| `tax-categories-{clientId}.json` | 後方互換として維持。tax-overridesへのマイグレーション済み |

### 未解決（設計判断が未確定）

なし。全項目が設計確定・実装完了済み。


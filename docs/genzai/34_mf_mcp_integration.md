# MF MCP連携 — 調査・設計・移行戦略

> 作成: 2026-05-17
> 最終更新: 2026-05-19（リダイレクトURI修正・マルチテナント分離バグ修正・実データ取得検証完了）
> 準拠: `.agent/workflows/load_context.md` L12-17: Supabase移行前倒し原則
> 前提: MFクラウド確定申告（パーソナルプラン）契約中
> 会計API仕様書: https://developers.api-accounting.moneyforward.com/
> 認可サーバー: https://developers.biz.moneyforward.com/docs/
> MCPサーバー: https://developers.biz.moneyforward.com/mcp

## 概要

マネーフォワード（MF）クラウド会計の**MCPサーバー**と独自システムを連携し、
モック/localStorageベースのデータ層をMF実データ取得に段階的に移行する。
個人アカウントで基盤を構築し、将来的に会計事務所アカウントへ横展開する戦略。

> **⚠️ データ取得方式**
> 会計API（`api-accounting.moneyforward.com`）はCloudflare WAFで全面ブロック（403）。
> **MCPサーバー（全プラン無料・2026年3月GA）経由でのアクセスを採用。**
> 認証のみOAuth 2.0を使用し、データ取得は全てMCPツール経由で行う。

**認証方式: OAuth 2.0（認可コードフロー） / データ取得: MCPサーバー（JSON-RPC）**

---

## 1. 認証方式の選定根拠

### 1-1. OAuth 2.0 を採用した理由

MFクラウドのAPIには**OAuth 2.0**と**APIキー**の2方式が存在するが、
**クラウド会計API（仕訳・勘定科目等）はOAuth 2.0のみ対応。APIキーは非対応。**

| サービス                              | APIキー       | OAuth 2.0   |
| ------------------------------------- | ------------- | ----------- |
| 認可サーバーAPI（事業者情報取得等）   | ✅ 対応       | ✅ 対応     |
| **クラウド会計API（仕訳・勘定科目）** | **❌ 非対応** | **✅ 対応** |
| 連結会計等の一部サービス              | ✅ 対応       | ✅ 対応     |

> **結論**: 主要ユースケース（仕訳取得・登録、勘定科目取得）がOAuth必須のため、
> 認証方式を2本立てにせず**OAuth一本に統一**する。
> APIキーで使える事業者情報取得もOAuthスコープ（`mfc/admin/tenant.read`）で取れる。

### 1-2. 参考URL

- [会計API仕様書（OpenAPI / Redoc）](https://developers.api-accounting.moneyforward.com/) ★本丸
- [OpenAPI YAML（生成AI向け）](https://developers.api-accounting.moneyforward.com/v3/openapi.yaml)
- [認可サーバーAPI](https://developers.biz.moneyforward.com/docs/api/auth)
- [APIキーによる認証の概要](https://developers.biz.moneyforward.com/docs/common/api-keys/overview)
- [OAuthによる認可の概要](https://developers.biz.moneyforward.com/docs/common/oauth)

---

## 2. API利用可能プランと制限

### 2-1. プラン別API利用可否

| プラン               | API利用 | 仕訳件数制限                  | 用途                       |
| -------------------- | ------- | ----------------------------- | -------------------------- |
| 無料プラン（フリー） | ✅ 可能 | **年50件**（API経由でも適用） | 開発・疎通テスト専用       |
| パーソナルミニ       | ✅ 可能 | 上限なし（レート制限あり）    | 個人事業・小規模運用       |
| パーソナル           | ✅ 可能 | 上限なし（レート制限あり）    | 個人事業・本番運用         |
| パーソナルプラス     | ✅ 可能 | 上限なし（レート制限あり）    | 個人事業・電話サポート付き |
| スモールビジネス     | ✅ 可能 | 上限なし（レート制限あり）    | 法人・小規模               |
| ビジネス             | ✅ 可能 | 上限なし（レート制限あり）    | 法人・本格運用             |

> **重要**: API経由でもプランの機能制限（仕訳件数等）はそのまま適用される。
> 無料プランは年50件の壁があるため、テスト以外の用途には不適。

### 2-2. 共通制限事項

| 制限       | 内容                                                     |
| ---------- | -------------------------------------------------------- |
| レート制限 | 1,000リクエスト/時（目安。サービスにより異なる場合あり） |
| 認証方式   | OAuth 2.0（Authorization Code Flow）                     |
| 追加料金   | なし（有償プラン契約が前提）                             |

---

## 3. 法人・個人のAPI仕様差異

### 3-1. 通信・構造レベルの差異：**なし**

| 項目                   | 法人 | 個人 | 差異 |
| ---------------------- | ---- | ---- | ---- |
| エンドポイントURL      | 同一 | 同一 | なし |
| JSONレスポンス構造     | 同一 | 同一 | なし |
| 認証フロー（OAuth）    | 同一 | 同一 | なし |
| APIバージョン（v1/v3） | 同一 | 同一 | なし |

> API側では個人/法人を区別したエンドポイントの切り分けは行われていない。
> `office_id`（事業者ID）単位でアクセスし、個人も法人も「1つの事業者」として扱われる。

### 3-2. データレベルの差異：**あり（マスタが異なる）**

| 項目                           | 法人（`CORPORATE`）            | 個人（`INDIVIDUAL`）         | 影響                                     |
| ------------------------------ | ------------------------------ | ---------------------------- | ---------------------------------------- |
| 勘定科目体系                   | 役員借入金、法人税等           | 事業主借/貸、所得税等        | 科目マスタを事業所ごとに保持する必要あり |
| 決算期（`accounting_periods`） | 会社ごとに任意（例: 4月〜3月） | **1月〜12月 固定**           | 日付バリデーションに影響                 |
| 法人番号（`corporate_number`） | 13桁の法人番号                 | `null`                       | 表示制御に使用                           |
| インボイス番号                 | `T` + 法人番号                 | `T` + マイナンバー or `null` | 表示制御に使用                           |

### 3-3. 設計上の対策

```
独自システムのDB設計:
  事業所マスタ（tenants）
    ├── code                ← MFの事業者コード（例: 'XXXX-XXXX'）
    ├── type                ← 'CORPORATE' | 'INDIVIDUAL'（大文字。API値そのまま）
    ├── is_real_estate      ← 不動産事業フラグ
    └── accounting_periods  ← 会計期間配列（期間指定APIの引数に使用）

→ type に基づいてマスタ（科目・税区分）を完全分離し、
  プログラムの分岐は最小限に抑える。
```

---

## 4. 参考：会計API仕様（⚠️ WAFブロック中 — 直接アクセス不可）

> **ベースURL**: `https://api-accounting.moneyforward.com`
> **仕様書**: https://developers.api-accounting.moneyforward.com/
> **⚠️ Cloudflare WAF 403**: 全エンドポイントがブロック中。実際のデータ取得は**§14 MCPサーバー経由**で行う。
> 以下は将来WAFが解除された場合の参考情報として残す。

### 4-1. 認可サーバーAPI vs 会計API

| API             | エンドポイント   | 返るデータ                        | 現在の利用状況                                   |
| --------------- | ---------------- | --------------------------------- | ------------------------------------------------ |
| 認可サーバーAPI | `GET /v2/tenant` | `tenant_code`, `tenant_name` のみ | ✅ **唯一の直接API呼び出し**（`mfApiClient.ts`） |
| **会計API**     | `/v3/*`          | 仕訳・科目・税区分等の業務データ  | ❌ WAFブロック → **MCPサーバー経由**             |

### 4-2. 主要エンドポイント → 対応MCPツール対照表

| 会計APIエンドポイント        | MCPツール                        | 用途         |
| ---------------------------- | -------------------------------- | ------------ |
| `GET /v3/office`             | `mfc_ca_currentOffice`           | 事業者情報   |
| `GET /v3/accounts`           | `mfc_ca_getAccounts`             | 勘定科目一覧 |
| `GET /v3/taxes`              | `mfc_ca_getTaxes`                | 税区分一覧   |
| `GET /v3/journals`           | `mfc_ca_getJournals`             | 仕訳一覧     |
| `POST /v3/journals`          | `mfc_ca_postJournals`            | 仕訳作成     |
| `GET /v3/term_settings`      | `mfc_ca_getTermSettings`         | 会計年度設定 |
| `GET /v3/departments`        | `mfc_ca_getDepartments`          | 部門一覧     |
| `GET /v3/sub_accounts`       | `mfc_ca_getSubAccounts`          | 補助科目一覧 |
| `GET /v3/trade_partners`     | `mfc_ca_getTradePartners`        | 取引先一覧   |
| `GET /v3/connected_accounts` | `mfc_ca_getConnectedAccounts`    | 連携サービス |
| `GET /v3/trial_balance/*`    | `mfc_ca_getReportsTrialBalance*` | 残高試算表   |
| `GET /v3/transition/*`       | `mfc_ca_getReportsTransition*`   | 推移表       |

### 4-3. MCPツール全量スキーマ（2026-05-20 実機ダンプ）

> `tools/list` を実際に呼び出して取得した**正式なツール定義**。全19ツール。
> ダンプスクリプト: `src/scripts/mcp_tools_dump.ts`
> JSON全量: `data/test-results/mcp_tools_dump.json`

#### READ系（15ツール）

| # | ツール名 | 引数 | 概要 |
|---|---|---|---|
| 1 | `mfc_ca_currentOffice` | なし | 事業者情報+会計期間（降順） |
| 2 | `mfc_ca_en_ja_dictionary` | なし | MF専用の英日辞書。**AIは最初にこれを呼ぶことが推奨** |
| 3 | `mfc_ca_getAccounts` | `available?: boolean` | 勘定科目一覧 |
| 4 | `mfc_ca_getConnectedAccounts` | なし | 連携サービス一覧（銀行口座等） |
| 5 | `mfc_ca_getDepartments` | なし | 部門一覧 |
| 6 | `mfc_ca_getJournalById` | `id: string`【必須】 | 仕訳個別取得 |
| 7 | `mfc_ca_getJournals` | `start_date?, end_date?, account_id?, is_realized?, page?, per_page?` | 仕訳一覧。**start_dateまたはend_dateのいずれかが必要** |
| 8 | `mfc_ca_getReportsTransitionBalanceSheet` | `type: "monthly"`【必須】, `fiscal_year?, start_month?, end_month?, include_tax?, with_sub_accounts?` | BS推移表（月次のみ対応） |
| 9 | `mfc_ca_getReportsTransitionProfitLoss` | `type: "monthly"`【必須】, `fiscal_year?, start_month?, end_month?, include_tax?, with_sub_accounts?` | PL推移表（月次のみ対応） |
| 10 | `mfc_ca_getReportsTrialBalanceBalanceSheet` | `fiscal_year?, start_month?, end_month?, start_date?, end_date?, include_tax?, journal_types?, with_sub_accounts?` | BS残高試算表 |
| 11 | `mfc_ca_getReportsTrialBalanceProfitLoss` | 同上 | PL残高試算表 |
| 12 | `mfc_ca_getSubAccounts` | `account_id?: string` | 補助科目一覧 |
| 13 | `mfc_ca_getTaxes` | `available?: boolean` | 税区分一覧 |
| 14 | `mfc_ca_getTermSettings` | なし | 全会計年度設定（開始日降順） |
| 15 | `mfc_ca_getTradePartners` | `available?: boolean` | 取引先一覧 |

#### WRITE系（4ツール）

| # | ツール名 | 引数 | 概要 |
|---|---|---|---|
| 16 | `mfc_ca_postJournals` | `journal`【必須】: `{ branches[], journal_type, transaction_date, memo?, tags? }` | 仕訳作成（最大300行） |
| 17 | `mfc_ca_putJournals` | `id`【必須】, `journal`【必須】 | 仕訳更新 |
| 18 | `mfc_ca_postTradePartners` | `trade_partners[]`【必須】: `{ name, corporate_number?, invoice_registration_number?, search_key?, available? }` | 取引先作成 |
| 19 | `mfc_ca_postTransactions` | `connected_account_id`【必須】, `transactions[]`【必須】: `{ content, date, side, value, memo? }` | 明細作成 |

#### 仕訳作成の詳細スキーマ（`mfc_ca_postJournals`）

```json
{
  "journal": {
    "branches": [
      {
        "debitor": {
          "account_id": "勘定科目ID【必須】",
          "value": "金額【必須】",
          "tax_id": "税区分ID",
          "sub_account_id": "補助科目ID",
          "department_id": "部門ID",
          "trade_partner_code": "取引先コード",
          "invoice_kind": "INVOICE_KIND_NOT_TARGET | INVOICE_KIND_QUALIFIED | INVOICE_KIND_UNQUALIFIED_80"
        },
        "creditor": {
          "account_id": "勘定科目ID【必須】",
          "value": "金額【必須】"
        },
        "remark": "摘要"
      }
    ],
    "journal_type": "journal_entry | adjusting_entry【必須】",
    "transaction_date": "取引日【必須】",
    "memo": "メモ",
    "tags": ["タグ配列"]
  }
}
```

#### 重要な制約

| 制約 | 内容 |
|---|---|
| `select_tenant` | **ツールなし。** MCPは1トークン=1事業所固定。テナント切替はアプリ側で管理 |
| 推移表の`type` | `"monthly"`のみ対応【必須パラメータ】 |
| 仕訳一覧の日付 | `start_date`または`end_date`のいずれかが必要 |
| 未取込明細 | 取得するツールなし。仕訳化済みのもののみ取得可能 |
| `journal_types` | `"journal_entry"`（通常仕訳）、`"adjusting_entry"`（決算整理仕訳）の2種 |
| `invoice_kind` | 3種: `NOT_TARGET`（対象外）、`QUALIFIED`（適格）、`UNQUALIFIED_80`（非適格80%） |

---

## 6. OAuth認証フロー

### 6-1. 事前準備

1. MFクラウド「管理コンソール」で**全権管理**権限を持つユーザーが操作
2. 「アプリポータル」（`https://app-portal.moneyforward.com/`）で新規アプリ登録
3. `Client ID` と `Client Secret` を取得
4. リダイレクトURLを設定（開発: `http://localhost:5173/api/mf/auth/callback`）
5. **「ユーザー」メニューで自分に「アプリ連携」権限を付与**（これがないと事業者選択でエラー）

### 6-2. OAuthスコープ（2026-05-19 最終確認済み）

```
# --- READ スコープ（10個） ---
mfc/admin/tenant.read               ← 事業者情報の取得（認可サーバーAPI用・対応MCPツールなし）
mfc/accounting/offices.read          ← 事業所情報（currentOffice）
mfc/accounting/accounts.read         ← 勘定科目・補助科目の参照
mfc/accounting/departments.read      ← 部門情報の参照
mfc/accounting/journal.read          ← 仕訳データの取得（一覧・個別）
mfc/accounting/report.read           ← 試算表・推移表の取得
mfc/accounting/taxes.read            ← 税区分の参照
mfc/accounting/trade_partners.read   ← 取引先の参照
mfc/accounting/connected_account.read ← 連携サービス一覧の参照
mfc/accounting/transaction.read      ← 連携サービス明細の読み取り

# --- WRITE スコープ（3個・MCPサーバー接続に必須） ---
mfc/accounting/journal.write         ← MCPサーバーが要求（実際のwrite操作は行わない）
mfc/accounting/trade_partners.write  ← MCPサーバーが要求（実際のwrite操作は行わない）
mfc/accounting/transaction.write     ← MCPサーバーが要求（実際のwrite操作は行わない）
```

> **⚠️ MCPサーバー（beta）はwriteスコープなしでは `insufficient_scope`（403）を返す。**
> readのみのトークンではMCPサーバーへの接続自体が不可能。
> writeスコープは接続要件として付与するが、**アプリケーション側でwrite APIは呼び出さない**運用とする。

> **⚠️ 旧スコープ `mfc/accounting/read` `mfc/accounting/write` は無効。**
> サブスコープ（`journal.read`等）を明示的に指定しないとスコープエラーになる。
> 複数スコープはスペース区切りで指定する。

### 6-3. 認可フロー

```
1. 独自システム → MF認可画面にリダイレクト
   https://api.biz.moneyforward.com/authorize?
     client_id=...&
     redirect_uri=...&
     response_type=code&
     scope=mfc/admin/tenant.read mfc/accounting/journal.read ...&
     state={CSRFトークン}

2. ユーザーがMFにログイン
3. 事業者選択画面で「どの事業所のデータにアクセスを許可するか」を選択・承認
4. MF → 独自システムに認可コード付きでリダイレクト
5. 独自システム → 認可コードでアクセストークン + リフレッシュトークンを取得
6. アクセストークンを使ってAPIリクエスト
```

### 6-4. トークン管理の設計

| 項目                         | 仕様                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| アクセストークン有効期限     | **1時間**（MF公式確定値）                                                                          |
| リフレッシュトークン有効期限 | **540日**（MF公式確定値・変更不可）                                                                |
| リフレッシュ方式             | **ローリング方式**: 使用ごとに新トークン発行。**旧リフレッシュトークンは即時無効化（再利用不可）** |
| 旧アクセストークンの扱い     | リフレッシュ後、**古いアクセストークンも即時無効化**（MF公式チュートリアルで確認済み・2026-05-19） |
| 保管場所                     | **サーバーサイドのDB**（フロントには絶対に露出させない）                                           |
| 現在の保管先                 | `data/mf-tokens.json`（`.gitignore`済み）+ メモリキャッシュ。Supabase移行時にDBへ差し替え          |
| 再認可が必要なケース         | 社長が手動でアプリ連携を解除した時・540日間一度もAPIを叩かなかった時（実質上ほぼ発生しない）       |

> **⚠️ セキュリティ必須事項**
>
> - `Client ID` / `Client Secret` / トークンは `.env.local` に格納し、gitに含めない
> - `load_context.md` L101: APIキー・トークン・パスワードのgit対象禁止ルールを厳守
> - `data/mf-tokens.json` は `.gitignore` L51 + L77（`/data/**`）で二重ガード済み（2026-05-19確認）

---

## 7. マルチテナント設計

### 7-1. 確認済みの事業者一覧（2026-05-17）

| 事業者名    | 種別 | 事業者番号 |
| ----------- | ---- | ---------- |
| （個人名A） | 個人 | XXXX-XXXX  |
| （法人名B） | 法人 | YYYY-YYYY  |

### 7-2. DB設計（テナント管理）

```
users（ユーザーテーブル）
  ├── user_id          PK（ユーザーの一意ID）
  ├── email            メールアドレス
  └── role             'personal' | 'office'（個人/会計事務所）

tenants（事業所テーブル）
  ├── tenant_id        PK
  ├── user_id          FK → users.user_id（親ユーザー）
  ├── mf_office_id     MFの事業所ID（APIアクセスキー）
  ├── name             事業所名
  ├── type             'corporate' | 'individual'
  ├── tax_scheme       'general_tax' | 'simplified_tax' | 'tax_exempt'
  ├── fiscal_year_start  現在期の期首日
  ├── fiscal_year_end    現在期の期末日
  └── created_at       作成日時

oauth_tokens（トークンテーブル）
  ├── token_id         PK
  ├── tenant_id        FK → tenants.tenant_id（事業所単位で発行）
  ├── access_token     アクセストークン（暗号化保存）
  ├── refresh_token    リフレッシュトークン（暗号化保存）
  ├── expires_at                アクセストークンの有効期限（1時間）
  ├── refresh_token_expires_at  リフレッシュトークンの有効期限（540日・更新ごとにリセット）
  └── updated_at       最終更新日時
```

### 7-3. トークンと事業所の関係

```
1アクセストークン = 1事業所（office_id）に紐付く

複数事業所を操作する場合:
  事業所A用トークン → office_id=A のAPIリクエストに使用
  事業所B用トークン → office_id=B のAPIリクエストに使用
  → 事業所数分のトークンをDBに保持し、リクエストごとに使い分ける
```

---

## 8. 移行戦略

### フェーズ1：個人アカウントでの基盤構築（現在〜）

| 手順 | 内容                                                                | 状態                                                                            |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1-1  | アプリポータルにアプリ登録（`sugu-suru`）                           | ✅ 完了                                                                         |
| 1-2  | Client ID / Client Secret 取得                                      | ✅ 完了                                                                         |
| 1-3  | リダイレクトURL設定（`http://localhost:5173/api/mf/auth/callback`） | ✅ 完了                                                                         |
| 1-4  | アプリポータルでユーザーに「アプリ連携」権限付与                    | ✅ 完了                                                                         |
| 1-5  | OAuth認証フローの実装（バックエンド）                               | ✅ 完了                                                                         |
| 1-6  | MF上で「法人テスト用事業所」（（法人名B））を追加作成               | ✅ 完了                                                                         |
| 1-7  | OAuthスコープ修正（サブスコープ指定に変更）                         | ✅ 完了                                                                         |
| 1-8  | MFログイン → 事業者選択画面までの疎通テスト                         | ✅ 完了                                                                         |
| 1-9  | 事業者選択 → 認可完了 → トークン取得テスト                          | ✅ 完了（2026-05-17）                                                           |
| 1-10 | 事業者情報取得API（`GET /v2/tenant`）疎通テスト                     | ✅ 完了（tenant_code: XXXX-XXXX, tenant_name: （個人名A））                     |
| 1-11 | 会計API直接アクセス（`api-accounting.moneyforward.com`）テスト      | ❌ **失敗** — Cloudflare WAF 403（全環境ブロック）                              |
| 1-12 | **MCPサーバー経由のアクセスに方針転換**                             | ✅ 完了（2026-05-18）`mfMcpClient.ts` 実装済み                                  |
| 1-13 | アプリポータルで「クラウド会計・確定申告」権限を付与                | ⬜ **未着手（P0ブロッカー・人間操作が必要）**                                   |
| 1-14 | ~~CursorにMCPサーバーを設定・疎通テスト~~                           | ~~取消~~（`mfMcpClient.ts` でバックエンド直接接続を実装済み。Cursor設定は不要） |
| 1-15 | MCPサーバー経由で仕訳一覧を取得（疎通テスト）                       | ⬜ コード実装済み・実疎通テスト未実施（1-13完了後に確認）                       |
| 1-16 | 事業所切替UIの実装                                                  | 未着手                                                                          |
| 1-17 | デバッグコード（`/debug-token`）削除                                | ✅ 完了（2026-05-18）                                                           |

### フェーズ2：会計事務所アカウントへの移行（将来）

#### 2-0. 前提: なぜOAuth必須か

| データ種別                    | APIキー       | OAuth 2.0   |
| ----------------------------- | ------------- | ----------- |
| 事業者情報（tenant）          | ✅ 対応       | ✅ 対応     |
| **仕訳（journals）**          | **❌ 非対応** | **✅ 対応** |
| **勘定科目（account_items）** | **❌ 非対応** | **✅ 対応** |
| **クラウド会計API全般**       | **❌ 非対応** | **✅ 対応** |

> MF公式: 「クラウド会計APIはOAuth 2.0を使用しています。APIキーでの認可には対応していません」
> APIキーは認可サーバーAPI・連結会計等の一部サービスのみ対応。

#### 2-1. 実装手順

| 手順 | 内容                                     | 注意事項                                               |
| ---- | ---------------------------------------- | ------------------------------------------------------ |
| 2-1  | 会計事務所アカウント（パートナー）を取得 | **パートナー契約 + API利用申請・審査が必要な場合あり** |
| 2-2  | Callback URLを本番ドメインに設定         | 例: `https://yourapp.com/oauth/callback`               |
| 2-3  | 顧問先一覧画面に「MF連携」ボタンを実装   | 認可URLを生成して顧問先担当者に送付                    |
| 2-4  | 顧問先担当者がMFログイン→アプリ許可      | **初回のみブラウザ操作が必要**                         |
| 2-5  | refresh_token をDB（Supabase）に永続保存 | **暗号化必須。本番運用の肝**                           |
| 2-6  | 以後はrefresh_tokenで自動同期            | 毎回ログイン不要・許可不要                             |

#### 2-2. 会計事務所SaaSの運用フロー

```
顧問先一覧
  ↓
「MF連携」ボタン → 認可URL生成 → 顧問先に送付
  ↓
顧問先担当者: MFログイン → 「許可」
  ↓
redirect_uri に code返却 → backend で token交換
  ↓
refresh_token を暗号化してSupabaseに保存
  ↓
以後: 夜間バッチで仕訳同期（refresh_tokenで自動更新）

会計事務所SaaS
  ├ A社 token → 仕訳取得
  ├ B社 token → 仕訳取得
  ├ C社 token → 仕訳取得
  └ D社 token → 仕訳取得
```

#### 2-3. 運用上の課題（顧問先100社超で顕在化）

| 課題       | 内容                                        | 対策                   |
| ---------- | ------------------------------------------- | ---------------------- |
| token失効  | refresh_token の `invalid_grant` エラー多発 | token状態監視バッチ    |
| 担当者変更 | 顧問先の認可した担当者が退職→tokenが無効化  | 再認可UI               |
| MFA変更    | 顧問先がMFAを変更→セッション切断            | 接続状況ダッシュボード |
| 権限変更   | 顧問先がアプリの権限を取り消し              | エラー検知→メール通知  |

#### 2-4. 必要になる機能（フェーズ2で実装）

| 機能                   | 優先度 | 概要                                                |
| ---------------------- | ------ | --------------------------------------------------- |
| 接続状況ダッシュボード | P0     | 各顧問先のtoken状態（有効/失効/期限切れ）を一覧表示 |
| 再認可UI               | P0     | token失効した顧問先に認可URLを再送付                |
| token状態監視バッチ    | P1     | 定期的にrefresh_tokenの有効性をチェック             |
| エラー通知             | P1     | token失効・API呼び出し失敗時のメール/Slack通知      |

---

## 9. ⚠️ ファクトチェック結果

### 確認済み（✅ 真）

| 項目                                                     | 根拠                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 無料プランでもAPI利用可能                                | MF公式サイト                                                                 |
| 無料プランは年50件の仕訳制限                             | MF公式サイト（API経由でも適用）                                              |
| 法人・個人でAPI仕様は同一                                | MF公式：エンドポイント・構造に差異なし                                       |
| 1アカウントで複数事業所作成可能                          | MF公式：画面右上から「新規事業者作成」                                       |
| 事業所ごとにOAuthトークンを個別管理                      | MF API仕様：認可は事業所単位                                                 |
| **クラウド会計APIはOAuth 2.0のみ対応**                   | MF公式: 「APIキーでの認可には対応していません」                              |
| **事業者情報（tenant）はAPIキーでもOAuthでも取得可能**   | `/v2/tenant` は両方対応                                                      |
| **スコープはサブスコープ（`journal.read`等）を明示指定** | 疎通テストで確認（旧形式はエラー）                                           |
| **アプリポータルで「アプリ連携」権限が必要**             | 疎通テストで確認（権限なしだと事業者選択でエラー）                           |
| **APIキー対応はエンドポイントごとに異なる**              | MF公式: 「呼び出すエンドポイントがどちらに対応しているかによって異なります」 |
| **`GET /v2/tenant` で事業者情報取得成功**                | 疎通テスト完了（tenant_code: XXXX-XXXX, tenant_name: （個人名A））           |

### APIキー vs OAuth：エンドポイント別対応状況

| エンドポイント              | APIキー | OAuth | 備考          |
| --------------------------- | ------- | ----- | ------------- |
| `/v2/tenant`（事業者情報）  | ✅      | ✅    | 両方対応      |
| `/auth/exchange`（JWT交換） | ✅      | -     | APIキー専用   |
| 仕訳（journals）            | ❌      | ✅    | **OAuth必須** |
| 勘定科目（account_items）   | ❌      | ✅    | **OAuth必須** |
| クラウド会計API全般         | ❌      | ✅    | **OAuth必須** |
| 連結会計等の一部サービス    | ✅      | ✅    | 両方対応      |

> **結論**: 仕訳・勘定科目を扱う限りOAuth一択。APIキーは混在させない。

---

## 10. 独自システム側の設計影響

### 10-1. 現在のアーキテクチャとの関係

| 現在の層                       | MF MCP連携後の変化                                             |
| ------------------------------ | -------------------------------------------------------------- |
| `repositories/mock/`           | → MCPサーバー経由のデータ取得に段階的に置換                    |
| `repositories/types.ts`        | → MFレスポンス型を追加定義                                     |
| `composables/`                 | → データ取得先がモック→MCPに変わるだけ（インターフェース不変） |
| `constants/clientFieldDefs.ts` | → MFから取得した科目マスタで補完/上書き                        |
| `constants/vendorOptions.ts`   | → `tax_scheme`に基づく選択肢フィルタリング追加                 |

### 10-2. `load_context.md` との整合性

| ルール                                         | 対応                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| L74: composableはモジュールスコープのrefで保持 | MF MCPレスポンスもref保持パターンを踏襲                  |
| L76: Repository/composableにロジック禁止       | MCPクライアントは`api/services/`に配置                   |
| L80: Repositoryはデータの出し入れだけ          | MCPクライアントも同方針（変換ロジックはhelpers）         |
| L130: ロジックはAPI側に書け                    | MF連携ロジックは`api/routes/`または`api/services/`に配置 |

---

## 11. 次のアクション

| 優先度 | アクション                                                                   | 状態                                                                    | 前提条件 |
| ------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------- |
| ~~P0~~ | ~~アプリポータルで「クラウド会計・確定申告」権限をユーザーに付与~~           | ✅ 完了（2026-05-19）                                                   | —        |
| ~~P0~~ | ~~CursorにMCPサーバーを設定（beta URL）~~                                    | ~~取消~~（`mfMcpClient.ts` L27でURLをハードコード済み。Cursor設定不要） | —        |
| ~~P0~~ | ~~`MF_REDIRECT_URI` の誤設定修正（5173→8080）~~                              | ✅ 完了（2026-05-19）`.env.local` + MFアプリポータル両方修正            | —        |
| ~~P0~~ | ~~`mfRoutes.ts` / `mfMcpClient.ts` clientIdテナント分離バグ修正~~            | ✅ 完了（2026-05-19）全エンドポイントにclientIdクエリ追加               | —        |
| ~~P0~~ | ~~/api/mf/office 等でMCPサーバー経由の疎通テスト~~                           | ✅ 完了（2026-05-19）法人・個人 実データ取得確認                        | —        |
| ~~P1~~ | ~~MCPサーバー経由で仕訳一覧を取得（実データ確認）~~                          | ✅ 完了（2026-05-18）                                                   | —        |
| ~~P1~~ | ~~デバッグコード（`/debug-token`）削除~~                                     | ✅ 完了（2026-05-18）                                                   | —        |
| ~~P1~~ | ~~デッドコード（`fetchAccountingOffice`・`fetchOffice`）削除 → MCP化で置換~~ | ✅ 完了（2026-05-18）MCPクライアント実装済み                            | —        |
| ~~P1~~ | ~~`mfAuthService.ts` リフレッシュ競合（Race condition）対策~~                | ✅ 完了（2026-05-19）シングルフライトパターン実装                       | —        |
| **P1** | 仕訳取得・仕訳登録の業務フロー実装（レシートOCR→仕訳連携）                   | ⬜ 未着手                                                               | —        |
| **P1** | AIコマンド機能 Phase 1 実装（[35_ai_command_design.md](35_ai_command_design.md)） | ⬜ 未着手                                                               | Vertex AI SDK |
| **P2** | テナント管理テーブルの設計・実装（Supabase migration SQL）                   | ⬜ 未着手                                                               | —        |
| **P2** | `mfAuthRoutes.ts` logout に clientId 追加（テナント別ログアウト）            | ⬜ 未着手（現在 'default' 固定）                                        | —        |
| **P3** | AIコマンド機能 Phase 2 実装（Chrome拡張 Chatwork連携）                       | ⬜ 未着手                                                               | Phase 1完了 |

---

## 12. ⚠️ セキュリティルール（2026-05-17制定）

### 🔴 禁止: AIツールによる `.env.local` の編集

```
❌ 禁止: AIが .env.local を replace_file_content / write_to_file で編集する
   → diff出力にシークレット値が含まれ、会話ログに残る

✅ 正解: AIが「この行を追加してください」と指示し、ユーザーが手動で編集する
```

**理由**: 2026-05-17にClient Secretがツール出力のdiffに含まれるインシデントが発生。
再発行で対処済みだが、再発防止のためルール化。

### 対象ファイル

| ファイル                   | AIによる編集                    |
| -------------------------- | ------------------------------- |
| `.env.local`               | **禁止**                        |
| `.env`                     | **禁止**                        |
| `.env.production`          | **禁止**                        |
| `service-account-key.json` | **禁止**                        |
| `.env.example`             | ✅ 許可（プレースホルダーのみ） |

---

## 13. 実装済みファイル一覧（2026-05-19更新）

| ファイル                              | 役割                                                                                                                | 最終更新   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| `src/api/services/mfAuthService.ts`   | OAuth認証サービス（認可URL生成・トークン取得・リフレッシュ・永続化）。シングルフライト対応済み                      | 2026-05-19 |
| `src/api/services/mfMcpClient.ts`     | MCPサーバークライアント（JSON-RPC通信・全19ツール対応）。**★tokenKey引数追加・clientCache Map化済み（2026-05-19）** | 2026-05-19 |
| `src/api/services/mfApiClient.ts`     | 認可サーバーAPIクライアント（事業者情報取得のみ。会計APIはMCP経由に移行済み）                                       | 2026-05-18 |
| `src/api/routes/mfAuthRoutes.ts`      | OAuth認証ルート（4エンドポイント: `/auth/url`, `/auth/callback`, `/auth/status`, `/auth/logout`）                   | 2026-05-18 |
| `src/api/routes/mfRoutes.ts`          | データ取得ルート（6エンドポイント）。**★全エンドポイントに`clientId`クエリ追加済み（2026-05-19）**                  | 2026-05-19 |
| `src/api/index.ts`                    | ルート登録追加（`/api/mf` 配下に2ルート）                                                                           | 2026-05-18 |
| `src/server.ts`                       | ルート登録追加（`/api/mf` 配下に2ルート）                                                                           | 2026-05-18 |
| `data/mf-tokens.json`                 | トークン永続化ファイル（`.gitignore`で除外済み。Supabase移行時にDB化）                                              | 随時       |
| `.env.local`                          | `MF_CLIENT_ID` / `MF_CLIENT_SECRET` / `MF_REDIRECT_URI=http://localhost:8080/...`                                   | 2026-05-19 |
| `.env.example`                        | MF APIプレースホルダー                                                                                              | 2026-05-18 |
| `src/views/portal/MockPortalPage.vue` | ゲストポータルページ（MF連携バナー・モーダル・OAuthフロー開始）                                                     | 2026-05-18 |
| `src/views/MfConnectedPage.vue`       | OAuthコールバック後のサンクスページ（`/mf/connected`）                                                              | 2026-05-18 |

---

## 14. MCPサーバー（データ取得の正規ルート）

### 14-1. 背景

会計API（`api-accounting.moneyforward.com`）はCloudflare WAFで全面ブロック（403）。
MFが2026年3月26日に全プラン向けに公開した**MCPサーバー**経由でデータを取得する。
**本システムの全データ取得はMCPサーバー経由で行う。**

### 14-2. MCPサーバー情報

| 項目             | 詳細                                                           |
| ---------------- | -------------------------------------------------------------- |
| 提供開始         | 2026年3月26日（全プラン）                                      |
| 提供形態         | リモートMCPサーバー（環境構築不要）                            |
| 料金             | 追加料金なし                                                   |
| 対応クライアント | Claude Desktop, Claude Code, Claude Cowork, Cursor, Gemini CLI |

### 14-3. MCPサーバーURL

| バージョン       | URL                                                           | 特徴                       |
| ---------------- | ------------------------------------------------------------- | -------------------------- |
| alpha            | `https://alpha.mcp.developers.biz.moneyforward.com/mcp/ca/v3` | 1時間ごとに再認証必要      |
| **beta（推奨）** | `https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3`  | 認証時間延長・再認証自動化 |

### 14-4. 設定ファイル例

```json
"mcpServers": {
  "mfc_ca": {
    "url": "https://beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3"
  }
}
```

### 14-5. MCPツール全19個 — 取得可能フィールド詳細

> 全ツール2026-05-18にMCP経由で実データ取得・検証済み

---

#### 1. `mfc_ca_currentOffice` — 事業者情報（✅個人・法人 両方検証済み）

| フィールド                         | 型      | 個人                  | 法人                    | 説明                             |
| ---------------------------------- | ------- | --------------------- | ----------------------- | -------------------------------- |
| `name`                             | String  | （個人名A）           | （法人名B）             | 事業者名                         |
| `code`                             | String  | XXXX-XXXX             | YYYY-YYYY               | 事業者コード                     |
| `type`                             | String  | `INDIVIDUAL`          | `CORPORATE`             | 個人/法人判定の根幹フラグ        |
| `is_real_estate`                   | Boolean | `true`/`false`        | ⚠️ **フィールドなし**   | 不動産所得（**個人のみ**）       |
| `is_manufacturing`                 | Boolean | `false`               | `false`                 | 製造原価報告書の要否             |
| `employee_count`                   | String  | ⚠️ **フィールドなし** | `NOT_SELECTED`          | 従業員数区分（**法人のみ**）     |
| `pl_name_value_display_option`     | String  | ⚠️ **フィールドなし** | `SWITCH_NAME_AND_VALUE` | PL表示オプション（**法人のみ**） |
| `accounting_periods`               | Array   | 1月〜12月固定         | **任意（例:7月〜6月）** | 会計期間配列（降順）             |
| `accounting_periods[].fiscal_year` | Number  | 2026                  | 2025                    | 会計年度                         |
| `accounting_periods[].start_date`  | String  | 2026-01-01            | 2025-07-01              | 期首日                           |
| `accounting_periods[].end_date`    | String  | 2026-12-31            | 2026-06-30              | 期末日                           |

---

#### 2. `mfc_ca_getTermSettings` — 会計年度設定（✅個人・法人 両方検証済み）

| フィールド                  | 型     | 個人                  | 法人                    | 説明                                 |
| --------------------------- | ------ | --------------------- | ----------------------- | ------------------------------------ |
| `fiscal_year`               | Number | 2026                  | 2025                    | 会計年度                             |
| `start_date`                | String | 2026-01-01            | 2025-07-01              | 期首日（個人:1/1固定, 法人:任意）    |
| `end_date`                  | String | 2026-12-31            | 2026-06-30              | 期末日（個人:12/31固定, 法人:任意）  |
| `tax_method`                | String | `FREE`                | `INDIVIDUAL_ALLOCATION` | **課税形式**（下表参照）             |
| `accounting_method`         | String | ⚠️ **フィールドなし** | `TAX_EXCLUDED_INCLUDED` | 経理方式（**法人のみ**。税抜内税等） |
| `business_types`            | Array  | `["SERVICES"]`        | `[]`                    | 業種（法人は空の場合あり）           |
| `prefecture`                | String | （都道府県名）        | （都道府県名）          | 所在地                               |
| `sales_rounding_method`     | String | `ROUND_DOWN`          | `ROUND_DOWN`            | 売上消費税端数処理                   |
| `purchases_rounding_method` | String | `ROUND_DOWN`          | `ROUND_DOWN`            | 仕入消費税端数処理                   |

`tax_method` の値一覧:

| 値                        | 意味                 |
| ------------------------- | -------------------- |
| `FREE`                    | 免税事業者           |
| `GENERAL`                 | 一般課税（本則課税） |
| `SIMPLIFIED`              | 簡易課税             |
| `INDIVIDUAL_ALLOCATION`   | 個別対応方式         |
| `PROPORTIONAL_ALLOCATION` | 一括比例配分方式     |

---

#### 3. `mfc_ca_getAccounts` — 勘定科目（✅個人108件・法人133件 検証済み）

| フィールド                 | 型      | 個人/法人差異        | 実測値例                                              | 説明               |
| -------------------------- | ------- | -------------------- | ----------------------------------------------------- | ------------------ |
| `id`                       | String  | なし                 | `cqFKUwCs6dv...`（Base64エンコード）                  | 勘定科目ID         |
| `name`                     | String  | **あり**（下表参照） | `現金`, `事業主借`                                    | 科目名             |
| `account_group`            | String  | **あり**             | `ASSET`, `LIABILITY`, `CAPITAL`, `REVENUE`, `EXPENSE` | 勘定科目グループ   |
| `category`                 | String  | なし                 | `CASH_AND_DEPOSITS`                                   | 科目カテゴリ       |
| `financial_statement_type` | String  | なし                 | `BALANCE_SHEET`, `PROFIT_AND_LOSS`                    | BS/PL区分          |
| `available`                | Boolean | なし                 | `true`                                                | 利用可否           |
| `search_key`               | String  | なし                 | `""`                                                  | 検索キー           |
| `tax_id`                   | String  | なし                 | `uk0H3oqR...`                                         | デフォルト税区分ID |
| `sub_accounts`             | Array   | なし                 | （補助科目の配列。インライン）                        | 紐づく補助科目     |

法人のみの勘定科目（個人にない）:

| 科目名         | グループ  | カテゴリ                                    |
| -------------- | --------- | ------------------------------------------- |
| 資本金         | CAPITAL   | CAPITAL_STOCK                               |
| 繰越利益剰余金 | CAPITAL   | RETAINED_EARNINGS_BROUGHT_FORWARD           |
| 役員報酬       | EXPENSE   | SELLING_GENERAL_AND_ADMINISTRATIVE_EXPENSES |
| 法人税等       | EXPENSE   | CORPORATE_INCOME_TAXES_CURRENT              |
| 法人税等調整額 | EXPENSE   | CORPORATE_INCOME_TAXES_DEFERRED             |
| 未払法人税等   | LIABILITY | OTHER_CURRENT_LIABILITIES                   |

個人のみの勘定科目（法人にない）:

| 科目名   | 説明                  |
| -------- | --------------------- |
| 事業主借 | 個人資金→事業への入金 |
| 事業主貸 | 事業資金→個人への出金 |
| 元入金   | 個人事業の資本金相当  |

---

#### 4. `mfc_ca_getSubAccounts` — 補助科目（✅検証済み・16件取得）

| フィールド   | 型          | 実測値例                 | 説明               |
| ------------ | ----------- | ------------------------ | ------------------ |
| `id`         | String      | `Zp5Hxw%2BPOb4...`       | 補助科目ID         |
| `account_id` | String      | `cqFKUwCs6dv...`         | 親の勘定科目ID     |
| `name`       | String      | `小口現金`, `社会保険料` | 補助科目名         |
| `search_key` | String/null | `null`                   | 検索キー           |
| `tax_id`     | String      | `uk0H3oqR...`            | デフォルト税区分ID |

---

#### 5. `mfc_ca_getTaxes` — 税区分（✅検証済み・151件取得）

| フィールド     | 型      | 実測値例         | 説明                                |
| -------------- | ------- | ---------------- | ----------------------------------- |
| `id`           | String  | `JADP5Ohw2u5...` | 税区分ID                            |
| `name`         | String  | `課税売上 10%`   | 税区分名（正式名）                  |
| `abbreviation` | String  | `課売 10%`       | 略称                                |
| `tax_rate`     | Number  | `0.1`            | 税率（0.1 = 10%）                   |
| `available`    | Boolean | `false`          | 利用可否（免税事業者は多くがfalse） |
| `search_key`   | String  | `""`             | 検索キー                            |

---

#### 6. `mfc_ca_getDepartments` — 部門（✅検証済み・0件）

| フィールド    | 型    | 説明                       |
| ------------- | ----- | -------------------------- |
| `departments` | Array | 空配列（部門未設定の場合） |

> 個人事業の場合は部門を使わないケースが多い。

---

#### 7. `mfc_ca_getTradePartners` — 取引先（✅検証済み・2件取得）

| フィールド                    | 型      | 実測値例      | 説明                                   |
| ----------------------------- | ------- | ------------- | -------------------------------------- |
| `code`                        | String  | `A0000000001` | 取引先コード（自動採番）               |
| `name`                        | String  | （取引先名）  | 取引先名称                             |
| `search_key`                  | String  | `""`          | 検索名称                               |
| `corporate_number`            | String  | `""`          | 法人番号（未登録の場合は空文字）       |
| `invoice_registration_number` | String  | `""`          | インボイス番号（未登録の場合は空文字） |
| `available`                   | Boolean | `true`        | 利用可否                               |

---

#### 8. `mfc_ca_getConnectedAccounts` — 連携サービス（✅検証済み・0件）

| フィールド           | 型    | 説明                              |
| -------------------- | ----- | --------------------------------- |
| `connected_accounts` | Array | 空配列（銀行/クレカ未連携の場合） |

---

#### 9. `mfc_ca_getJournals` — 仕訳一覧（✅検証済み・3件取得）

検索パラメータ:

| パラメータ    | 型      | 説明              |
| ------------- | ------- | ----------------- |
| `start_date`  | String  | 取引日の開始日    |
| `end_date`    | String  | 取引日の終了日    |
| `account_id`  | String  | 勘定科目IDで絞込  |
| `is_realized` | Boolean | 未実現仕訳フラグ  |
| `page`        | Integer | ページ番号        |
| `per_page`    | Integer | 1ページあたり件数 |

レスポンス（各仕訳の実フィールド）:

| フィールド                              | 型          | 実測値例                  | 説明                           |
| --------------------------------------- | ----------- | ------------------------- | ------------------------------ |
| `id`                                    | String      | `MM7qz%2BRtX4R...`        | 仕訳ID                         |
| `number`                                | Integer     | `1`                       | 仕訳番号                       |
| `transaction_date`                      | String      | `2025-03-09`              | 取引日                         |
| `journal_type`                          | String      | `journal_entry`           | 通常/決算整理                  |
| `entered_by`                            | String      | `JOURNAL_TYPE_AI_OCR`     | 入力方法（AI OCR/通常/連携等） |
| `is_realized`                           | Boolean     | `true`                    | 実現済みか                     |
| `memo`                                  | String      | `""`                      | メモ                           |
| `tags`                                  | Array       | `[]`                      | タグ                           |
| `term_period`                           | Integer     | `2025`                    | 所属会計年度                   |
| `create_time`                           | String      | `2025-03-12T14:29:09Z`    | 作成日時                       |
| `update_time`                           | String      | `2025-03-12T14:29:09Z`    | 更新日時                       |
| `voucher_file_ids`                      | Array       | `["f636b61e-..."]`        | 証憑ファイルID                 |
| `branches[].debitor.account_id`         | String      | `RzBJyPxd...`             | 借方科目ID                     |
| `branches[].debitor.account_name`       | String      | `消耗品費`                | 借方科目名（名前解決済み）     |
| `branches[].debitor.value`              | Integer     | `1259`                    | 借方金額                       |
| `branches[].debitor.tax_id`             | String/null | `null`                    | 借方税区分ID                   |
| `branches[].debitor.tax_name`           | String      | `""`                      | 借方税区分名                   |
| `branches[].debitor.tax_long_name`      | String      | `""`                      | 借方税区分正式名               |
| `branches[].debitor.tax_value`          | Integer     | `0`                       | 借方税額                       |
| `branches[].debitor.department_id`      | String/null | `null`                    | 借方部門ID                     |
| `branches[].debitor.department_name`    | String/null | `null`                    | 借方部門名                     |
| `branches[].debitor.sub_account_id`     | String/null | `null`                    | 借方補助科目ID                 |
| `branches[].debitor.sub_account_name`   | String/null | `null`                    | 借方補助科目名                 |
| `branches[].debitor.trade_partner_code` | String/null | `null`                    | 借方取引先コード               |
| `branches[].debitor.trade_partner_name` | String/null | `null`                    | 借方取引先名                   |
| `branches[].debitor.invoice_kind`       | String      | `INVOICE_KIND_NOT_TARGET` | インボイス区分                 |
| `branches[].creditor.*`                 | —           | （debitorと同構造）       | 貸方                           |
| `branches[].remark`                     | String      | `（店舗名）`              | 摘要                           |

---

#### 10. `mfc_ca_getJournalById` — 仕訳個別（フィールドは9と同一）

---

#### 11-12. 残高試算表（BS/PL）

`mfc_ca_getReportsTrialBalanceBalanceSheet` / `mfc_ca_getReportsTrialBalanceProfitLoss`

検索パラメータ:

| パラメータ                  | 型      | 説明                              |
| --------------------------- | ------- | --------------------------------- |
| `fiscal_year`               | Integer | 会計年度（省略時: 最新）          |
| `start_month` / `end_month` | Integer | 集計月範囲                        |
| `start_date` / `end_date`   | String  | 集計日範囲                        |
| `include_tax`               | Boolean | 税込/税抜                         |
| `journal_types`             | Array   | `journal_entry`/`adjusting_entry` |
| `with_sub_accounts`         | Boolean | 補助科目の金額も取得              |

レスポンス列（固定）:

| 列                | 説明                          |
| ----------------- | ----------------------------- |
| `opening_balance` | 前期残高                      |
| `debit_amount`    | 借方金額                      |
| `credit_amount`   | 貸方金額                      |
| `closing_balance` | 期末残高                      |
| `ratio`           | 構成比（分母0の場合は`null`） |

---

#### 13-14. 推移表（BS/PL）

`mfc_ca_getReportsTransitionBalanceSheet` / `mfc_ca_getReportsTransitionProfitLoss`

| パラメータ                  | 型      | 説明                               |
| --------------------------- | ------- | ---------------------------------- |
| `type`                      | String  | **必須** `monthly`（月次のみ対応） |
| `fiscal_year`               | Integer | 会計年度                           |
| `start_month` / `end_month` | Integer | 集計月範囲                         |
| `include_tax`               | Boolean | 税込/税抜                          |
| `with_sub_accounts`         | Boolean | 補助科目も取得                     |

---

#### 15. `mfc_ca_en_ja_dictionary` — 英日辞書（✅検証済み）

MF会計用語の英日対訳辞書。パラメータなし。現時点では`dictionary: {}`（空）。

---

#### 16. `mfc_ca_postJournals` — 仕訳作成（WRITE）

最大**300行**/1リクエスト。フィールドは仕訳一覧(9)の`branches`構造と同一。

必須: `transaction_date`, `journal_type`, `branches`

---

#### 17. `mfc_ca_putJournals` — 仕訳更新（WRITE）

必須: `id`（仕訳ID）, `transaction_date`, `journal_type`, `branches`

---

#### 18. `mfc_ca_postTradePartners` — 取引先作成（WRITE）

| フィールド                    | 型      | 必須 | 説明           |
| ----------------------------- | ------- | ---- | -------------- |
| `name`                        | String  | ✅   | 取引先名称     |
| `search_key`                  | String  | —    | 検索名称       |
| `corporate_number`            | String  | —    | 法人番号       |
| `invoice_registration_number` | String  | —    | インボイス番号 |
| `available`                   | Boolean | —    | 利用可否       |

---

#### 19. `mfc_ca_postTransactions` — 明細作成（WRITE）

| フィールド               | 型      | 必須 | 説明                               |
| ------------------------ | ------- | ---- | ---------------------------------- |
| `connected_account_id`   | String  | ✅   | 連携サービスID                     |
| `transactions[].date`    | String  | ✅   | 取引日                             |
| `transactions[].content` | String  | ✅   | 取引内容                           |
| `transactions[].side`    | String  | ✅   | `INCOME`（収入）/`EXPENSE`（支出） |
| `transactions[].value`   | Integer | ✅   | 金額                               |
| `transactions[].memo`    | String  | —    | メモ（最大200文字）                |

### 14-6. 事前準備（必須）

1. [アプリポータル](https://app-portal.moneyforward.com/) にログイン
2. 左メニュー「ユーザー」→ 連携操作を行うユーザーをクリック
3. 「編集」→ 「アプリ連携権限」で以下にチェック：
   - ☑ **アプリ連携**
   - ☑ **クラウド会計・確定申告**
4. 「保存」をクリック

> 管理コンソールの「全権管理」権限が必要。

### 14-7. 注意事項

- 認可コードがAIツールの学習に使用されないよう、**データ収集を許可しない設定**で利用
- 複数事業者利用時は操作開始時に事業者情報を確認
- 事業者切り替え時は**チャットセッションを一度終了**してから再設定
- 技術的サポートは**公認メンバー（士業事務所）向けのみ**

---

## 15. Cloudflare WAFブロック調査記録（2026-05-17〜18）

### 15-1. テスト結果

| 環境            | 方法            | 結果              |
| --------------- | --------------- | ----------------- |
| ローカル        | Node.js fetch   | ❌ Cloudflare 403 |
| ローカル        | PowerShell curl | ❌ Cloudflare 403 |
| GCP Cloud Shell | curl            | ❌ Cloudflare 403 |
| ブラウザ直接    | URLアクセス     | ❌ Cloudflare 403 |

### 15-2. Cloudflareエラー詳細

```
<title>Attention Required! | Cloudflare</title>
<h1>Sorry, you have been blocked</h1>
<h2>You are unable to access api-accounting.moneyforward.com</h2>
cf-ray: 9fd343b1ca309643
```

### 15-3. 結論

`api-accounting.moneyforward.com` は**allowlist運用のプライベートAPIゲートウェイ**。
MF自身のWebアプリ（`accounting.moneyforward.com`）もこのドメインを叩いていない（BFF構成）。
仕様書は公開されているが、直接アクセスにはパートナー契約またはIP登録が必要と推定。

---

## 16. マルチテナント実動作確認記録（2026-05-19）

### 16-1. 判明した根本バグ

| バグ                          | 内容                                                                             | 修正                                                      |
| ----------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `MF_REDIRECT_URI` 誤設定      | `localhost:5173`（Vite）を指していたためコールバックがHonoに届かなかった         | `.env.local` + MFアプリポータルを `localhost:8080` に修正 |
| `mfRoutes.ts` テナント固定    | 全6エンドポイントが `getAuthStatus()` を `'default'` 固定で呼んでいた            | 全エンドポイントに `?clientId=` クエリ追加                |
| `mfMcpClient.ts` テナント固定 | `getOrCreateClient()` が `getValidAccessToken()` を `'default'` 固定で呼んでいた | 全関数に `tokenKey` 引数追加・`clientCache` を Map 化     |

### 16-2. 実データ取得確認結果

| clientId     | 顧問先     | 事業者名             | 種別         | 課税方式                            | 会計期間  |
| ------------ | ---------- | -------------------- | ------------ | ----------------------------------- | --------- |
| `{CLIENT_ID_A}` | テスト法人 | **テスト法人Ａ** | `CORPORATE`  | `INDIVIDUAL_ALLOCATION`（個別対応） | 7月〜6月  |
| `{CLIENT_ID_B}` | テスト個人 | **テスト個人A**         | `INDIVIDUAL` | `FREE`（免税）・不動産所得あり      | 1月〜12月 |

### 16-3. 確認済みエンドポイント

| エンドポイント                        | 法人                         | 個人                                    | データ差異  |
| ------------------------------------- | ---------------------------- | --------------------------------------- | ----------- |
| `GET /api/mf/office?clientId=`        | テスト法人A                 | テスト個人A                                | ✅ 完全分離 |
| `GET /api/mf/term-settings?clientId=` | 個別対応・7月決算            | 免税・12月決算                          | ✅ 完全分離 |
| `GET /api/mf/accounts?clientId=`      | 法人科目体系（法人税等含む） | 個人科目（事業主借/貸・不動産科目含む） | ✅ 完全分離 |
| `GET /api/mf/auth/status?clientId=`   | authenticated: true          | authenticated: true                     | ✅ 正常     |

### 16-4. ゼロスタート連携フロー（確定版）

```
前提: MFアプリポータルのリダイレクトURI = http://localhost:8080/api/mf/auth/callback
前提: .env.local の MF_REDIRECT_URI = http://localhost:8080/api/mf/auth/callback

①顧問先が http://localhost:5173/#/guest/{clientId} にアクセス
  → MF連携バナー「設定する」が表示される（未連携の場合）

②「設定する」→「マネーフォワードへ進む」をクリック
  → GET /api/mf/auth/url?clientId={clientId} で認可URL取得
  → 別タブでMFログイン画面が開く

③顧問先が自分のMFアカウントでログイン
  → 事業者選択画面で連携する事業者を選択
  → 「許可する」をクリック

④MFが http://localhost:8080/api/mf/auth/callback?code=XXX&state=YYY にリダイレクト
  → HonoがcodeとstateからclientIdを復元（pendingStatesマップ）
  → exchangeCodeForToken(code, clientId) でトークン取得・保存

⑤ http://localhost:5173/#/mf/connected?mf_auth=success にリダイレクト
  → MfConnectedPage.vue「連携が完了しました」表示

⑥以降はリフレッシュトークンで自動更新（顧問先の操作不要）
```

---

## 関連ドキュメント

| ドキュメント                                                                                         | 関連                                          |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [load_context.md](../../.agent/workflows/load_context.md)                                            | Supabase移行前倒し原則・API設計方針           |
| [28_api_migration_plan.md](28_api_migration_plan.md)                                                 | API化計画（既存ロジックのAPI移動）            |
| [33_jp_literal_consolidation.md](33_jp_literal_consolidation.md)                                     | 定数集約化（MF連携でもimportパターンを踏襲）  |
| [MF公式: 開発者サイト](https://developers.biz.moneyforward.com/docs/)                                | APIドキュメント・認証方式・チュートリアル     |
| [MF公式: OAuthによる認可](https://developers.biz.moneyforward.com/docs/common/oauth)                 | OAuth 2.0の認可フロー詳細                     |
| [MF公式: APIリファレンス](https://developers.biz.moneyforward.com/docs/api)                          | エンドポイント仕様（認可サーバーAPI）         |
| [MF公式: MCPサーバー](https://developers.biz.moneyforward.com/mcp)                                   | MCPサーバー（会計データアクセスの正規ルート） |
| [MF公式: MCPサーバー利用ガイド](https://biz.moneyforward.com/support/account/guide/others/ot10.html) | MCP設定手順・事前準備                         |
| [MF公式: API利用ガイド](https://biz.moneyforward.com/support/account/guide/others/ot09.html)         | API利用手順                                   |
| [35_ai_command_design.md](35_ai_command_design.md)                                                   | AIコマンド機能 設計定義書（自然言語→MCP連携） |

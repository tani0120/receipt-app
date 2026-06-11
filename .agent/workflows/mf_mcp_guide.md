# MFクラウド会計 MCP 利用ガイド

> [!CAUTION]
> **秘密情報（トークン・クライアントシークレット等）は本ドキュメントに一切記載しない。**
> 実際の値は `.env.local` と `data/mf-tokens.json` に保存されている（いずれも `.gitignore` 対象）。

## 前提: なぜMCPが必要か

> [!WARNING]
> **MF会計API（`api-accounting.moneyforward.com`）はCloudflare WAFで全面403ブロックされており、HTTPで直接呼べない。**
> 会計データへのアクセスは **MF公式MCPサーバー経由のみ** 可能（2026-05-18確定）。

```
【呼べる】
  認可サーバーAPI（api.biz.moneyforward.com）
    └ /authorize, /token, /v2/tenant
    └ OAuth認可・トークン取得・事業者情報のみ

【呼べない ← WAFブロック】
  会計API（api-accounting.moneyforward.com）
    └ 勘定科目、仕訳、税区分、取引先 … 全部403

【代替手段 ← これを使う】
  MF公式MCPサーバー（beta.mcp.developers.biz.moneyforward.com）
    └ JSON-RPC over HTTP（StreamableHTTP / SSEフォールバック）
    └ OAuth アクセストークンで認証
```

---

## アーキテクチャ

```
┌─────────────┐     OAuth Token     ┌───────────────────────┐
│ mfAuthService│ ─────────────────→ │ MF MCPサーバー（beta） │
│  .ts         │                    │ StreamableHTTP / SSE   │
└──────┬───────┘                    └───────────┬───────────┘
       │                                        │
       │ accessToken                             │ JSON-RPC
       ↓                                        ↓
┌─────────────┐    callMcpTool()    ┌───────────────────────┐
│ mfMcpClient │ ──────────────────→ │ mfc_ca_*ツール群      │
│  .ts         │ ←────────────────── │ （20ツール）          │
└──────┬───────┘   JSONレスポンス    └───────────────────────┘
       │
       ↓ ラッパー関数
  mcpFetchAccounts(), mcpCreateJournal(), ...
```

### ファイル構成

| ファイル | 責務 |
|---|---|
| `src/api/services/mfAuthService.ts` | OAuth認可・トークン管理（リフレッシュ自動化） |
| `src/api/services/mfMcpClient.ts` | MCPサーバー接続・ツール呼び出し（本体） |
| `src/api/services/mfApiClient.ts` | 認可サーバーAPI直接呼び出し（tenantのみ） |
| `.env.local` | クライアントID・シークレット・トークンキー |
| `data/mf-tokens.json` | アクセス/リフレッシュトークン永続化（`.gitignore`対象） |

---

## MCPツール全20件

### 参照系（READ）— 14ツール

| ツール名 | ラッパー関数 | 説明 |
|---|---|---|
| `mfc_ca_currentOffice` | `mcpFetchCurrentOffice()` | 事業者情報+会計期間 |
| `mfc_ca_getTermSettings` | `mcpFetchTermSettings()` | 会計年度設定（税区分方式含む） |
| `mfc_ca_getAccounts` | `mcpFetchAccounts()` | 勘定科目一覧 |
| `mfc_ca_getSubAccounts` | `mcpFetchSubAccounts()` | 補助科目一覧 |
| `mfc_ca_getTaxes` | `mcpFetchTaxes()` | 税区分一覧 |
| `mfc_ca_getDepartments` | `mcpFetchDepartments()` | 部門一覧 |
| `mfc_ca_getTradePartners` | `mcpFetchTradePartners()` | 取引先一覧 |
| `mfc_ca_getConnectedAccounts` | `mcpFetchConnectedAccounts()` | 連携サービス一覧 |
| `mfc_ca_getJournals` | `mcpFetchJournals()` | 仕訳一覧（日付・科目フィルタ） |
| `mfc_ca_getJournalById` | `mcpFetchJournalById()` | 仕訳1件取得 |
| `mfc_ca_getReportsTrialBalanceBS` | `callMcpTool()` | 残高試算表（BS） |
| `mfc_ca_getReportsTrialBalancePL` | `callMcpTool()` | 残高試算表（PL） |
| `mfc_ca_getReportsTransitionBS` | `callMcpTool()` | 推移表（BS） |
| `mfc_ca_getReportsTransitionPL` | `callMcpTool()` | 推移表（PL） |

### 書込系（WRITE）— 4ツール

| ツール名 | ラッパー関数 | 説明 |
|---|---|---|
| `mfc_ca_postJournals` | `mcpCreateJournal()` | **仕訳作成** |
| `mfc_ca_putJournals` | `mcpUpdateJournal()` | 仕訳更新 |
| `mfc_ca_postTradePartners` | `mcpCreateTradePartner()` | 取引先作成 |
| `mfc_ca_postTransactions` | `callMcpTool()` | 明細作成（連携サービス必須） |

### ユーティリティ — 2ツール

| ツール名 | 説明 |
|---|---|
| `mfc_ca_en_ja_dictionary` | MF用語の英日辞書 |
| `mfc_ca_listTools` | ツール一覧（SDK組み込み） |

---

## 基本的な使い方

### 1. 汎用呼び出し（`callMcpTool`）

```ts
import { callMcpTool } from '@/api/services/mfMcpClient'

const tokenKey = 'c_XXXXXXXXXX'  // 顧問先のトークンキー

// 任意のツールを呼び出す
const result = await callMcpTool<{ accounts: Account[] }>(
  'mfc_ca_getAccounts',      // ツール名
  { available: true },       // 引数（省略可）
  tokenKey                   // トークンキー（省略時: 'default'）
)
```

### 2. ラッパー関数（推奨）

```ts
import { mcpFetchAccounts, mcpCreateJournal } from '@/api/services/mfMcpClient'

// 勘定科目一覧
const accounts = await mcpFetchAccounts(tokenKey)

// 仕訳作成
const journal = await mcpCreateJournal({
  transaction_date: '2026-06-01',
  journal_type: 'journal_entry',
  branches: [{
    debitor: { account_id: '科目ID', value: 1000 },
    creditor: { account_id: '科目ID', value: 1000 },
    remark: '摘要テキスト',
  }],
  memo: 'メモ',
  tags: ['タグ1'],
}, tokenKey)
```

### 3. スクリプトから実行

```bash
npx tsx src/scripts/test_receipt_to_journal.ts
```

> [!IMPORTANT]
> スクリプト実行前に `dotenv.config({ path: '.env.local' })` が必要。
> `data/mf-tokens.json` にリフレッシュトークンが保存されている必要がある。

---

## 認証フロー

### 初回認証（ブラウザ操作が必要）

```
1. アプリ起動（npm run dev）
2. ブラウザで顧問先管理画面を開く
3. 「MF連携」ボタン → MF認可画面にリダイレクト
4. MFにログイン → 認可 → コールバック
5. data/mf-tokens.json にトークン保存
```

### 以降のアクセス（自動）

```
mfAuthService.getValidAccessToken(tokenKey)
  ├ トークン有効 → そのまま返す
  └ 期限切れ → refreshAccessToken() で自動更新
                └ MF仕様: リフレッシュトークンは1回限り。新トークンで上書き保存
```

> [!WARNING]
> **リフレッシュトークンは1回限り有効。** 同時に2つのプロセスがリフレッシュすると片方が失敗する。
> → シングルフライト保証（`refreshInFlight` Map）で防止済み。

---

## 制約・既知の問題

### API直接呼び出し不可（WAFブロック）

| エンドポイント | 状態 |
|---|---|
| `api-accounting.moneyforward.com/*` | ❌ **Cloudflare WAF 403** |
| `api.biz.moneyforward.com/authorize` | ✅ 呼べる（認可） |
| `api.biz.moneyforward.com/token` | ✅ 呼べる（トークン） |
| `api.biz.moneyforward.com/v2/tenant` | ✅ 呼べる（事業者情報） |
| `beta.mcp.developers.biz.moneyforward.com/mcp/ca/v3` | ✅ MCP経由で全操作可能 |

### MCPの制限

| 制限 | 詳細 |
|---|---|
| **仕訳削除不可** | `deleteJournals`ツールが存在しない。テスト仕訳はMF画面で手動削除 |
| **明細取得不可** | `getTransactions`ツールが存在しない（2026年7月に追加予定？） |
| **明細登録に連携サービス必須** | `postTransactions`は`connected_account_id`が必須。未登録の事業者では使えない |
| **レート制限** | 429エラー発生時あり。`mcpFetchJournals`は自動で並列数縮退+リトライ |
| **1回のリクエストで最大300行** | `postJournals`のbranches上限 |

### invoice_kind（インボイス区分）送信ルール

実機テスト（2026-05-23）で確認済み:

| 値 | 動作 |
|---|---|
| `INVOICE_KIND_QUALIFIED` | ✅ 受理（適格請求書あり） |
| `INVOICE_KIND_UNQUALIFIED_80` | ✅ 受理（経過措置80%控除） |
| `INVOICE_KIND_NOT_TARGET` | ⚠️ 対象外税区分とセットなら受理。課税税区分とセットなら拒否 |
| 省略 | ✅ MFが税区分から自動判定（推奨） |

### 取引先登録の注意

- `invoice_registration_number`は **13桁半角数字のみ**（T接頭辞なし）
- MFが国税庁DBに照会して**実在を検証**する。存在しない番号は拒否
- 桁数不正（12桁以下、14桁以上）も拒否
- 番号なし（省略）は許容

---

## テスト用スクリプト

| スクリプト | 内容 |
|---|---|
| `src/scripts/test_receipt_to_journal.ts` | レシートOCR→仕訳登録テスト（1円） |
| `src/scripts/test_post_journal.ts` | postJournals/postTransactionsテスト |
| `src/scripts/test_connected.ts` | 連携サービス一覧確認 |
| `src/scripts/mcp_response_dump.ts` | 全ツールのレスポンス構造ダンプ |
| `src/scripts/fetch_mf_accounts.ts` | 勘定科目取得 |

実行方法:
```bash
npx tsx src/scripts/<スクリプト名>.ts
```

---

## 実証済みフロー

### レシート → MF仕訳登録（2026-06-11 実証済み）

```
鳥貴族 谷町四丁目店のレシート
  ↓ OCR（手動読み取り）
  ↓ 日付: 2026-06-01, 金額: ¥1（テスト）
  ↓ 
  ↓ mcpFetchAccounts() → 接待交際費ID / 現金ID 取得
  ↓ mcpCreateJournal() → 仕訳登録
  ↓
  ✅ 仕訳ID取得。MF仕訳帳に即反映（is_realized=true）
```

| 項目 | 結果 |
|---|---|
| 仕訳登録 | ✅ 成功 |
| is_realized | `true`（即確定。仕訳帳に直接載る） |
| 摘要 | `鳥貴族 谷町四丁目店` |
| メモ | `【テスト1円】鳥貴族 谷町四丁目店 T2120001160795` |
| タグ | `AI_TEST, レシートOCR, 要削除` |

# 44_初回表示遅延問題と解決策

> 作成日: 2026-05-31
> ステータス: ✅ 解決済み（Supabase移行でさらに改善予定）

## 問題の概要

`npm run dev`実行後、ブラウザでマスタ一覧ページを開いてもデータが表示されない。
ユーザーが手動でリロードするまでデータが永久に非表示のままになる。

## 根本原因

### 起動順序の競合

```
時刻 0.0秒  npm run dev（run-p で並列起動）
時刻 0.3秒  Vite起動完了 → ブラウザにページ配信
時刻 0.5秒  ブラウザがAPI fetch実行 → ECONNREFUSED（APIサーバー未起動）
時刻 2.6秒  APIサーバー起動完了（もう誰もfetchしない）
時刻 ???秒  ユーザーが手動リロード → やっとデータ表示
```

- Vite（0.3秒）がAPIサーバー（2.6秒）より先に起動する
- ブラウザのfetchがECONNREFUSEDで失敗する
- Piniaストアの`fetchFresh()`にリトライ機能がなく、失敗したまま放置される
- 一覧ページの`initPage()`も同様にリトライなし

### APIサーバー起動時間の内訳（実測値）

| フェーズ | 所要時間 |
|---|---|
| tsxコンパイル | 0.5秒 |
| JSONファイル全件読み込み（clients 14件、vendors 250件、journals 1537件 等） | 1.0秒 |
| Honoルーティング設定 + HTTPサーバー起動 | 1.1秒 |
| **合計** | **2.6秒** |

> JSONファイル全件読み込みがボトルネック。Supabase移行後はPostgreSQLが別プロセスで常時起動しているため、この問題は構造的に解消される。

## 実施した修正（2件）

### 修正1: fetchWithRetry + apiClient共通化

**変更ファイル:**

| ファイル | 変更内容 |
|---|---|
| `src/utils/fetchWithRetry.ts` | **新規** — 指数バックオフ付きfetch（1+2+4=7秒） |
| `src/utils/apiClient.ts` | **新規** — ストア共通HTTPクライアント（fetchWithRetryを内包） |
| `src/stores/clientStore.ts` | ローカルapiGet/Post/Put削除 → `createApiClient` |
| `src/stores/staffStore.ts` | 同上 |
| `src/stores/leadStore.ts` | 同上 |
| `src/stores/accountMasterStore.ts` | fetchWithRetry直接使用 → `createApiClient` |
| `src/stores/taxMasterStore.ts` | 同上 |

**設計:**

```typescript
// src/utils/fetchWithRetry.ts
// ネットワークエラー（ECONNREFUSED等）時のみリトライ。
// HTTP応答あり（4xx/5xx含む）はリトライしない。
// maxRetries=3, baseDelay=1000ms → 最大待機: 1+2+4=7秒

// src/utils/apiClient.ts
// 各ストアでコピペされていたapiGet/apiPost/apiPutを集約。
// createApiClient(baseUrl) → { get, post, put }
```

**副次効果:** 5ストアにコピペされていたapiGet/apiPost/apiPutを`apiClient.ts`に集約。Supabase移行時も1ファイル変更で済む。

### 修正2: wait-onによる起動順序制御

**変更ファイル:** `package.json` 1行

```diff
- "dev:frontend": "vite",
+ "dev:frontend": "wait-on tcp:8080 && vite",
```

ViteがAPIサーバー（ポート8080）の起動を待ってから起動する。ECONNREFUSEDの根本原因を除去。

## 実測結果

### 修正前

```
ECONNREFUSED: 毎回4件発生（/api/clients, /api/staff, /api/auth/current, /api/notifications）
初回データ表示: ユーザーが手動リロードするまで永久に非表示
```

### 修正後

```
[0.00s] npm run dev 開始
[3.17s] APIサーバー起動完了
[3.60s] API初回応答成功
[3.60s] ECONNREFUSED: 0件
[3.75s] 全データ取得完了（顧問先14件、一覧12件）
```

| 指標 | 修正前 | 修正後 |
|---|---|---|
| ECONNREFUSED | 4件（毎回発生） | **0件** |
| データ表示 | 手動リロードまで永久失敗 | **自動表示（3.75秒）** |
| 起動順序 | Vite先→API後（競合） | **API先→Vite後（保証）** |

## Supabase移行後の展望

| 項目 | 現状 | 移行後 |
|---|---|---|
| サーバー起動時間 | 2.6秒（JSON全件読み込み） | 1秒未満（DB接続のみ） |
| fetchWithRetry | 保険として残す | ネットワーク瞬断対策として活用 |
| apiClient.ts | REST API用 | Supabase Client用に差し替え |
| wait-on | 開発環境の起動順序制御 | 不要になる可能性あり |

## 関連ファイル

- `src/utils/fetchWithRetry.ts` — 指数バックオフ付きfetch
- `src/utils/apiClient.ts` — ストア共通HTTPクライアント
- `src/stores/clientStore.ts` — 顧問先ストア
- `src/stores/staffStore.ts` — スタッフストア
- `src/stores/leadStore.ts` — 見込先ストア
- `src/stores/accountMasterStore.ts` — 勘定科目マスタストア
- `src/stores/taxMasterStore.ts` — 税区分マスタストア
- `package.json` — dev:frontendスクリプト（wait-on追加）

# 部品カタログ

> コマンド（34_command_catalog.md）を構成する部品の定義。
> 部品 = 入力 / 処理 / 出力 の3ジャンル。
> AI部品には「目的・許可・禁止・プロンプト」を定義する。
> 最終更新: 2026-05-25

---

## 入力部品

### MCP取得（MFクラウド会計から直接取得）

| 部品名 | MCP API | 用途 | 使用コマンド |
|---|---|---|---|
| getJournals | mfc_ca_getJournals | 仕訳一覧取得 | 仕訳系全般, 分析系 |
| getJournalById | mfc_ca_getJournalById | 仕訳1件取得 | 仕訳取消 |
| getAccounts | mfc_ca_getAccounts | 科目マスタ取得 | 仕訳生成, 科目一覧 |
| getTaxes | mfc_ca_getTaxes | 税区分マスタ取得 | 仕訳生成 |
| getPL | getReportsTrialBalanceProfitLoss | PL試算表 | 財務分析 (financial_analysis) |
| getBS | getReportsTrialBalanceBalanceSheet | BS試算表 | BS表示 |
| getTransitionPL | getReportsTransitionProfitLoss | PL推移表 | 財務分析 (financial_analysis) |
| getTransitionBS | getReportsTransitionBalanceSheet | BS推移表 | BS推移表示 |
| getTradePartners | mfc_ca_getTradePartners | 取引先一覧 | 取引先一覧 |
| getDepartments | mfc_ca_getDepartments | 部門一覧 | 部門別分析 |
| getSubAccounts | mfc_ca_getSubAccounts | 補助科目一覧 | 補助科目一覧 |
| getConnectedAccounts | mfc_ca_getConnectedAccounts | 連携サービス | 口座カードリスト |
| getTermSettings | mfc_ca_getTermSettings | 会計年度設定 | 年度算出 |
| currentOffice | mfc_ca_currentOffice | 事業者情報 | 事業者情報 |

> 詳細: [37_infra_mcp.md](37_infra_mcp.md)

### DB取得（ローカルDB。初回のみMCP→DB保存）

| 部品名 | テーブル | 用途 | 使用コマンド |
|---|---|---|---|
| fetchJournals | mf_journals | 仕訳検索（remark_text ILIKE） | 仕訳生成, 消込, 分析系10本 |
| fetchAccounts | mf_accounts | 科目マスタ | 仕訳生成, 取引先一覧 |
| fetchTaxes | mf_taxes | 税区分マスタ | 仕訳生成 |

> fetchは「DBにあればDB、なければMCP→DB保存→返却」のパターン。
> 詳細: [38_infra_db.md](38_infra_db.md)

### ファイル取得

| 部品名 | 入力 | 用途 | 使用コマンド |
|---|---|---|---|
| fileReceive | PDF/CSV/画像 | 客からの資料を取り込み | 仕訳生成（領収書） |
| csvParse | CSVファイル | 銀行明細CSVを構造化 | 仕訳投入 (journal_write) |

### ユーザー入力

| 部品名 | 入力 | 用途 | 使用コマンド |
|---|---|---|---|
| naturalLanguage | 自然言語テキスト | AIルーティング経由でコマンドに変換 | 全コマンド |
| fileUpload | ファイル | ドラッグ&ドロップ/選択 | 仕訳生成 |

---

## 処理部品

### ロジック（AIなし。コードで確定。ブレない）

| 部品名 | 処理内容 | 使用コマンド |
|---|---|---|
| matchByRemark | 摘要ILIKE検索 + 科目集計 + 使用回数 | 仕訳生成, 過去同一取引 |
| aggregate | 科目別/取引先別の集計 | ランキング系全般 |
| aggregateByDepartment | 部門別集計 | 部門別分析 |
| aggregateByMonth | 月別集計 | 財務分析 (financial_analysis) |
| pairing | 売掛/買掛と入出金のペアリング | 消込リスト |
| calcChange | 増減算出（昨期比） | 増減ランキング |
| formatRanking | ランキング出力整形 | ランキング系全般 |
| dateDiff | 日数算出（回収/支払サイト） | 回収/支払サイト |
| diffCompare | 2ソースの差分比較 | MFデータ比較 |
| dateCalc | 日付計算（「先月」→ start_date/end_date） | Layer 1パターンマッチ |
| idParse | テキストからIDを抽出 | 仕訳取得（ID） |

### AI（馬鹿。裁量最小。各部品に許可/禁止/プロンプトを定義）

---

#### aiSuggest（コマンド提案）← 方針転換: 2026-05-22追加

| 項目 | 内容 |
|---|---|
| 目的 | ユーザーの自由テキストからコマンド候補を1〜3個提案する |
| 入力 | ユーザーの自然言語テキスト + コマンドカタログJSON |
| 出力 | JSON: suggestions配列（command, label, description） |
| モデル | **gemini-3.5-flash**（決定: 2026-05-22） |
| コスト | ~¥0.002/回（カタログ~800トークン + 出力~100トークン） |
| 使用箇所 | チャットUI → パターンマッチ不成功時 + パターンマッチ成功時の追加提案 |

```
やること:
  ✅ コマンドカタログから意図に合う候補を3〜5個選ぶ
  ✅ 各候補にユーザー入力に合わせた1行説明を付ける
  ✅ 該当なしの場合は suggestions を空配列で返す

やってはダメ:
  ❌ カタログに存在しないコマンドIDを生成しない
  ❌ コマンドを直接実行しない（候補を出すだけ）
  ❌ パラメータを返さない（人間が入力する）
  ❌ ユーザーの意図を推測で補完しない
```

```
システムプロンプト:
あなたは会計事務所向け業務アプリ「sugu-sru」のコマンドアシスタントです。
ユーザーの自然言語入力を受け取り、以下のコマンドカタログから
意図に合うものを3〜5個選んでください。

ルール:
1. カタログに存在するコマンドIDのみ返すこと。存在しないIDを生成するな。
2. 各候補に「このコマンドでできること」の1行説明を付けること。
   説明はユーザーの入力に合わせてカスタマイズせよ。
3. 入力が曖昧な場合は、広めに候補を出すこと（絞りすぎるな）。
4. パラメータは返すな（人間が入力する）。
5. 該当するコマンドが全くない場合は suggestions を空配列 [] で返せ。

レスポンス形式（JSON）:
{
  "suggestions": [
    { "command": "コマンドID", "label": "表示名", "description": "1行説明" }
  ]
}

コマンドカタログ:
{commandCatalogJson}
```

```
ユーザープロンプト:
ユーザー入力: 「{userText}」
顧問先: {clientName}（{clientId}）
```

---

#### nayose（名寄せ）

| 項目 | 内容 |
|---|---|
| 目的 | 表記ゆれを統合して同一取引先を特定する |
| 入力 | 摘要リスト（文字列配列）+ 対象摘要（1件） |
| 出力 | JSON配列: 同一取引先と判定された摘要の原文 |
| 使用コマンド | 仕訳投入 (journal_write), 仕訳取得・確認 (journal_view), マスタ参照 (master_ref) |

```
やること:
  ✅ 全角/半角の統合判定（NTTドコモ = NTTﾄﾞｺﾓ）
  ✅ カナ/英語の統合判定（グーグル = GOOGLE）
  ✅ 略称の統合判定（セブンイレブン = 7-ELEVEN）

やってはダメ:
  ❌ 科目を選ばない
  ❌ 金額を変えない
  ❌ 明らかに別サービスを統合しない（Google Workspace ≠ Google Play）
```

```
プロンプト:
以下は会計ソフトの仕訳摘要リストです。
新しい摘要「{input}」と同一の取引先と思われる摘要をすべて選んでください。

判定基準:
- 会社名の表記揺れ（全角/半角、カナ/英語、略称）
- ただし明らかに別サービスは区別

摘要リスト:
{remarks}

回答はJSON配列で、該当する摘要の原文をそのまま返してください。
```

---

#### aiSummarize（要約）

| 項目 | 内容 |
|---|---|
| 目的 | 数値データをテキストに変換する |
| 入力 | 構造化データ（JSON/テーブル） |
| 出力 | テキスト: 要約文 |
| 使用コマンド | 財務分析 (financial_analysis) |

```
やること:
  ✅ データの傾向を要約する
  ✅ 数値の大小関係を言語化する

やってはダメ:
  ❌ データにないことを推測しない
  ❌ 経営判断やアドバイスをしない
  ❌ 「〜すべき」等の断定表現を使わない
```

```
プロンプト:
以下のデータを{format}で要約してください。
{data}
データにないことは書かないでください。
数値は原文のまま使用してください。
```

---

#### aiReason（理由推定）

| 項目 | 内容 |
|---|---|
| 目的 | 月次変動等の原因を摘要から推定する |
| 入力 | 異常科目テーブル（科目名・月・金額・摘要一覧） |
| 出力 | テキスト: 理由を1行で推定 |
| 使用コマンド | 財務分析 (financial_analysis) |

```
やること:
  ✅ 摘要と金額のパターンから理由を1行で推定する
  ✅ 「〜と思われる」等の推定表現を使う

やってはダメ:
  ❌ 確定的な表現を使わない
  ❌ データにない情報を推測しない
  ❌ 業界動向等の外部知識で補完しない
```

```
プロンプト:
以下は{period}のPL推移表から、直近1年平均に対して±{threshold}%以上
かつ乖離額が年商の{rate}%以上の変動がある科目です。
{table}
各項目について、摘要と金額のパターンから変動の理由を1行で推定してください。
データにないことは書かないでください。
```

---

#### aiClassify（分類）

| 項目 | 内容 |
|---|---|
| 目的 | 資料の種類を判別する（銀行/カード/領収書） |
| 入力 | OCR/CSVパースで抽出された構造化データ |
| 出力 | 分類結果: "bank" / "card" / "receipt" / "unknown" |
| 使用コマンド | 仕訳生成の前段（自動振り分け） |

```
やること:
  ✅ データ構造から資料種別を判定する
  ✅ 判定できない場合は "unknown" を返す

やってはダメ:
  ❌ 判定結果を推測で補完しない
```

---

#### ocr（テキスト抽出）

| 項目 | 内容 |
|---|---|
| 目的 | 画像/PDFからテキストを抽出する |
| 入力 | 画像ファイル or PDFファイル |
| 出力 | JSON: 日付・店名・金額等の構造化データ |
| 使用コマンド | 仕訳生成（領収書）の前段 |

```
やること:
  ✅ 画像/PDFからテキストを抽出する
  ✅ 日付・店名・金額等を構造化して返す
  ✅ 読み取り信頼度を付与する

やってはダメ:
  ❌ 読み取れない文字を推測で補完しない
  ❌ 金額を丸めない（原文のまま）
  ❌ 科目や税区分を判定しない（それは仕訳生成の責務）
```

> **注意: aiSuggestがルーティングを兼ねる（方針転換: 2026-05-22）。**
> 旧Layer 2のAIルーティング（1コマンド返却）はaiSuggest（複数候補提案）に統合。
> フロー設計は [36_infra_ui.md §2-12](36_infra_ui.md) に記載。

---

## 出力部品

### 画面表示（sugu-sru）

| 部品名 | UIコンポーネント | 使用コマンド |
|---|---|---|
| tableView | テーブル表示（ランキング, 一覧, 推移） | 分析系全般, データ取得系 |
| listView | リスト表示（仕訳候補を1件ずつ提示） | 仕訳生成 |
| modalView | モーダル表示（確認, 承認, 最終確認） | 仕訳取得・確認 (journal_view), 仕訳投入 (journal_write) |
| textView | テキスト表示（要約, 概況, 根拠） | 財務分析 (financial_analysis), マスタ参照 (master_ref) |
| resultView | 結果表示（成功/失敗/件数） | 仕訳投入結果 |

### MF投入

| 部品名 | MCP API | 用途 | 実装ファイル | 使用コマンド | 状態 |
|---|---|---|---|---|---|
| convertToMfJournal | — | Sugusru仕訳→MF形式変換 | [journalToMfConverter.ts](../../src/api/services/journalToMfConverter.ts) | 仕訳投入 | ✅ |
| stripInvoiceKind | — | invoice_kind除去（API制限対応） | [mfJournalSender.ts](../../src/api/services/mfJournalSender.ts) | 仕訳投入 | ✅ |
| postJournals | mfc_ca_postJournals | 仕訳をMFに登録 | [mfMcpClient.ts](../../src/api/services/mfMcpClient.ts) | 仕訳投入 | ✅ |
| putJournals | mfc_ca_putJournals | 仕訳を修正 | [mfMcpClient.ts](../../src/api/services/mfMcpClient.ts) | 仕訳取消 | ✅ |
| applyMfSendResults | — | MF-ID紐付け（送信結果→DB書戾し） | [mfJournalSender.ts](../../src/api/services/mfJournalSender.ts) | 仕訳投入後 | ✅ |
| buildAllMaps | — | Sugusru→MF IDマッピング | [mfMappingService.ts](../../src/api/services/mfMappingService.ts) | 仕訳投入 | ✅ |

> 詳細: [39_mf_field_mapping.md](39_mf_field_mapping.md)

### DB保存

| 部品名 | テーブル | 用途 | 使用コマンド |
|---|---|---|---|
| saveJournals | mf_journals | 仕訳インデックス更新 | 仕訳投入後 |
| saveAccounts | mf_accounts | 科目マスタキャッシュ | fetchAccounts初回 |
| saveTaxes | mf_taxes | 税区分マスタキャッシュ | fetchTaxes初回 |
| saveNayoseCache | nayose_cache | 名寄せ結果キャッシュ | nayose実行後 |

### CSV出力

| 部品名 | 用途 | 使用コマンド |
|---|---|---|
| exportCsv | ランキング等をCSVエクスポート | 分析系（将来） |

---

## 基盤（コマンドの外側を支える）

> コマンドの流れ: **基盤 → 入力 → 処理 → 出力**
> 基盤 = 流れそのものを支える土台。各基盤にも入力/出力を定義する。
> 詳細は各 infra_*.md に記載。

---

### チャットUI（ユーザーとコマンドの接点）

| 項目 | 内容 |
|---|---|
| 入力 | ユーザーの自然言語テキスト or ボタンクリック |
| 出力 | AI応答（テキスト/テーブル/候補ボタン/パラメータフォーム） |
| 方式 | 同期レスポンス（Step 1） → SSEストリーミング（将来） |
| 詳細 | [36_infra_ui.md §2-12](36_infra_ui.md) |

#### 実装ファイル

| ファイル | 用途 | 状態 |
|---|---|---|
| `src/components/ai/AiFloatingButton.vue` | 右下固定ボタン。クリックでチャット開閉 | ✅ 実装済 |
| `src/components/ai/AiChatWindow.vue` | チャットウィンドウ本体。ドラッグ移動対応 | ✅ 実装済 |
| `src/components/ai/AiCommandBrowser.vue` | コマンドブラウザ（カテゴリタブ+検索フィルタ+actionTypeバッジ） | ✅ 実装済 |
| `src/components/ai/AiParamForm.vue` | コマンドパラメータ入力フォーム | 未実装 |
| `src/components/ai/AiConfirmModal.vue` | WRITE操作の確認モーダル | 未実装 |
| `src/composables/useAiCommand.ts` | API呼び出し+状態管理 | ✅ 実装済 |

#### バックエンドAPI

| ファイル | 用途 | 状態 |
|---|---|---|
| `src/api/routes/aiCommandRoutes.ts` | POST /api/ai-command | ✅ 実装済 |
| `src/api/services/aiPatternMatcher.ts` | パターンマッチ（高速パス） | ✅ 実装済（モック） |
| `src/api/services/aiSuggestService.ts` | AI提案（gemini-3.5-flash呼び出し） | 未実装 |
| `src/api/services/aiCommandExecutor.ts` | コマンド実行（コード側で引数確定） | 未実装 |
| `src/api/services/aiCommandLogger.ts` | 操作ログ記録 | 未実装 |

#### AI応答の構造

```
{
  type: 'text' | 'table' | 'suggestions' | 'params' | 'mixed',
  content: string,          // テキスト本文（Markdown対応）
  table?: { headers, rows },// テーブルデータ
  suggestions?: [           // AI提案のコマンド候補ボタン
    { command, label, description }
  ],
  params?: [                // パラメータ入力フォーム定義
    { key, label, type, options?, default? }
  ],
}
```

#### コマンドブラウザ（「その他のコマンドを見る」）

```
チャット内インライン展開（別ウィンドウではない）:

┌─────────────────────────────┐
│ コマンドを探す              │
│ [🔍 検索...]                │
│                             │
│ [仕訳] [分析] [データ]      ← カテゴリタブ（3カテゴリ）
│                             │
│ ▸ MF全データ同期  ⚡直接実行 │
│   事業者情報・科目・仕訳を一括│
│ ▸ 仕訳取得・確認  📡MCP     │
│   仕訳一覧の取得・検索・確認 │
│ ...                         │
│                             │
│ [閉じる]                    │
└─────────────────────────────┘

動作:
  カテゴリタブ → 仕訳/分析/データ切替
  検索ボックス → コマンド名・説明をフィルタ（クライアント側。API不要）
  コマンド押下 → actionTypeに応じて実行方式分岐
  AI不要（カタログJSONをフロントに持たせる）
```

---

### ルーティング（方針転換: 2026-05-22）

> 旧3層構造（L1パターンマッチ → L2 AIルーティング → L3フォールバック）を廃止。
> AI提案フロー + パターンマッチ高速パスに統一。

#### パターンマッチ（高速パス）

| 項目 | 内容 |
|---|---|
| 入力 | ユーザーの自然言語テキスト |
| 出力 | コマンド実行結果（ヒット時） |
| 方式 | コード側キーワードマッチ（AI不使用。0ms） |
| 実装 | `src/api/services/aiPatternMatcher.ts` |

#### AI提案（メインフロー）

| 項目 | 内容 |
|---|---|
| 入力 | ユーザーの自然言語テキスト + コマンドカタログJSON |
| 出力 | コマンド候補1〜3個（人間が選択する） |
| モデル | **gemini-3.5-flash** |
| コスト | ~¥0.002/回 |
| 実装 | `src/api/services/aiSuggestService.ts` |
| プロンプト | 処理部品 aiSuggest 参照 |

#### フォールバック（Layer 3）

| 項目 | 内容 |
|---|---|
| 入力 | ユーザーの自然言語テキスト |
| 出力 | AIが自律判断した実行結果 |
| 方式 | AIにFunction Callingの裁量を与える（やむを得ない場合のみ） |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

### MCP認証

| 項目 | 内容 |
|---|---|
| 入力 | clientId（顧問先ID） |
| 出力 | OAuthアクセストークン |
| 詳細 | [37_infra_mcp.md](37_infra_mcp.md) |

### テナント解決

| 項目 | 内容 |
|---|---|
| 入力 | 顧問先名 or コンテキスト（現在のページ） |
| 出力 | clientId |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

### 月次同期

| 項目 | 内容 |
|---|---|
| 入力 | 全テナントのclientId + MCPトークン |
| 出力 | DB更新（mf_journals, mf_accounts等） |
| タイミング | 毎月20日 00:00 JST |
| 詳細 | [38_infra_db.md](38_infra_db.md) |

### キャッシュ

| 項目 | 内容 |
|---|---|
| 入力 | MCP取得結果 |
| 出力 | DB保存（次回はDBから0.1秒で取得） |
| 方式 | DBにあればDB、なければMCP→DB保存→返却 |
| 詳細 | [38_infra_db.md](38_infra_db.md) |

### 操作ログ

| 項目 | 内容 |
|---|---|
| 入力 | コマンド実行の全情報（入力/ツール/結果） |
| 出力 | ログレコード（再実行ボタン + WRITE修復ボタン） |
| 実装 | `src/api/services/aiCommandLogger.ts` |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

### コスト管理

| 項目 | 内容 |
|---|---|
| 入力 | AI呼び出し回数 + トークン数 |
| 出力 | 月額利用状況 + 上限超過時の停止 |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

### エラーハンドリング

| 項目 | 内容 |
|---|---|
| 入力 | 例外・エラーレスポンス |
| 出力 | ユーザー向けメッセージ + エラーコード |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

### WRITE確認モーダル

| 項目 | 内容 |
|---|---|
| 入力 | AIが提案したWRITE操作（仕訳作成等） |
| 出力 | 人間の承認 or 拒否 |
| 実装 | `src/components/ai/AiConfirmModal.vue` |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

### コンテキスト認識

| 項目 | 内容 |
|---|---|
| 入力 | 現在のページ / 表示中UI / 選択テキスト |
| 出力 | コマンドに渡すパラメータ（clientId, 期間等） |
| 詳細 | [36_infra_ui.md](36_infra_ui.md) |

---

## 関連ドキュメント

| ファイル | 層 | 内容 |
|---|---|---|
| [34_command_catalog.md](34_command_catalog.md) | 完成品 | コマンドカタログ（7コマンド、実行方式・ロードマップ含む） |
| [34a_command_journal.md](34a_command_journal.md) | 完成品 | 仕訳系コマンドレシピ（P1〜P6） |
| [34b_command_business.md](34b_command_business.md) | 完成品 | 分析系コマンドレシピ（P7: 財務分析） |
| [36_infra_ui.md](36_infra_ui.md) | 基盤 | UI設計・フロー・ルーティング |
| [37_infra_mcp.md](37_infra_mcp.md) | 基盤 | MCP接続基盤 |
| [38_infra_db.md](38_infra_db.md) | 基盤 | DB基盤・月次同期 |
| [39_mf_field_mapping.md](39_mf_field_mapping.md) | 基盤 | MF↔Sugusruフィールド対応表（invoice_kind実機テスト結果含む） |



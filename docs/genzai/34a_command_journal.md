# 仕訳系コマンド レシピ集

> 各コマンドの部品組み合わせ手順。
> コマンド一覧: [34_command_catalog.md](34_command_catalog.md)
> 部品定義: [35_parts_catalog.md](35_parts_catalog.md)
> 最終更新: 2026-05-23

---

## MFデータ取込（仕訳、科目マスタ、税区分マスタ）

> 仕訳パイプラインはDB上のデータで動く。
> MFのデータをDBに入れるのが最初のステップ。

| 項目 | 内容 |
|---|---|
| 得たい結果 | MFクラウド会計のデータをローカルDBに取り込む |
| UIタグ | 管理 |
| 出力UI | 結果テキスト |

### パラメータ

| パラメータ | 選択肢 | デフォルト |
|---|---|---|
| 対象 | 全顧問先 / 特定の顧問先 | 全顧問先 |
| 範囲 | 3期分 / 2期分 / 今期分 / 前回差分のみ | 今期分 |
| 頻度 | 今すぐ / 毎月20日（自動） | 今すぐ |

### 部品レシピ

```
基盤:
  ルーティング → 「MFデータを取り込んで」→ MFデータ取込コマンド
  テナント解決 → 対象顧問先のclientIdを特定
  MCP認証 → clientIdからOAuthトークン取得

入力（3テーブル分をMCPから取得）:
  ① getJournals → MCP: 仕訳一覧
     - ページネーション: 100件/ページ。次ページがなくなるまで繰り返し
     - 範囲指定: start_date / end_date で期間フィルタ
     - 1社あたり 1〜5リクエスト（件数による）

  ② getAccounts → MCP: 科目マスタ
     - available: true でフィルタ
     - 1リクエストで全件取得

  ③ getTaxes → MCP: 税区分マスタ
     - available: true でフィルタ
     - 1リクエストで全件取得

処理（MCP結果をDB用に変換 + UPSERT）:
  ① remark_text生成（仕訳のみ。検索用フィールド）
     branches[].remark を結合して1フィールドにする
     例: branches = [{remark: "NTTドコモ"}, {remark: "ケータイ"}]
       → remark_text = "NTTドコモ ケータイ"

  ② UPSERT
     仕訳: id（仕訳ID）で ON CONFLICT → UPDATE
     科目: id（科目ID）で ON CONFLICT → UPDATE
     税区分: id（税区分ID）で ON CONFLICT → UPDATE

  ③ 古い期のデータ削除（3期前以前を自動DELETE）

出力:
  DB保存 → mf_journals, mf_accounts, mf_taxes
  resultView → 同期結果
    ┌────────────────────────────────────┐
    │ MFデータ取込 完了                    │
    │                                     │
    │ 対象: 株式会社○○                    │
    │ 範囲: 今期（2025-04 〜 2026-03）     │
    │                                     │
    │ mf_journals: 1,200件 UPSERT         │
    │ mf_accounts: 58件 UPSERT            │
    │ mf_taxes: 28件 UPSERT               │
    │                                     │
    │ 所要時間: 12秒                       │
    └────────────────────────────────────┘
```

### 3テーブル定義

| テーブル | MCP API | 件数目安 | UPSERT基準 | 主要カラム |
|---|---|---|---|---|
| mf_journals | getJournals | ~1,200件/年 × 3期 | 仕訳ID | transaction_date, remark_text, branches(JSONB), is_realized |
| mf_accounts | getAccounts | ~60件 | 科目ID | name, category, available |
| mf_taxes | getTaxes | ~30件 | 税区分ID | name, available |

### remark_text生成ロジック

```
MCP仕訳レスポンス:
  {
    id: "abc123",
    transaction_date: "2025-12-15",
    branches: [
      { remark: "NTTドコモ", account_id: "xxx", amount: 6136 },
      { remark: "ケータイリョウキン", account_id: "yyy", amount: -6136 }
    ]
  }

DB保存時:
  remark_text = branches.map(b => b.remark).filter(Boolean).join(' ')
  → "NTTドコモ ケータイリョウキン"

検索時:
  WHERE remark_text ILIKE '%ドコモ%'
  → ヒット
```

### レート制限と並列制御

```
1社あたり: 5〜9リクエスト（平均7）
200社: 1,400リクエスト

3社並列 × 2秒間隔 = 630リクエスト/時（制限1,000の63%）
200社 約16分で完了

エラー時: 1社失敗→ログに記録して次の社に進む（全体を止めない）
リトライ: 1社につき最大3回、30秒間隔
```

### 実行パターン

```
初回: 全顧問先 × 3期分（フル取込。約16分）
手動: 「○○社のデータを取り込んで」→ 今期分を即実行（約5秒）
自動: 毎月20日 → 全顧問先 × 前回差分のみ（約10分）
```

---

## パイプライン全体像

```
前提: MFデータ取込（MCP → DB化）✅ 済んでいること
  │
  ▼
客から資料をもらう（PDF/CSV/画像）
  │
  ▼
fileReceive / csvParse（入力部品）
  │
  ▼
aiClassify（処理部品AI）→ 銀行/カード/領収書を判別
  ├── 銀行/カード → 銀行/カード明細の仕訳候補
  └── 領収書 → 領収書の仕訳候補
        │
        ▼
仕訳生成（matchByRemark + nayose）
  │
  ▼
仕訳✓（1件ずつ人間が確認）
  │
  ▼
仕訳投入（postJournals → MF登録 + DB保存）
```

---

## 銀行/カード明細の仕訳候補

| 項目 | 内容 |
|---|---|
| 得たい結果 | 銀行/カード明細から仕訳候補を生成し、人間に提示する |
| UIタグ | 仕訳 |
| 出力UI | リスト→モーダル |

### 部品レシピ

```
入力:
  fetchJournals → DB(mf_journals) から過去仕訳を6〜12回分取得
  fetchAccounts → DB(mf_accounts) から科目マスタ取得
  fetchTaxes → DB(mf_taxes) から税区分マスタ取得

処理:
  matchByRemark → 摘要ILIKE検索 + 科目集計 + 使用回数

出力:
  listView → 仕訳候補を1件ずつ提示
    ┌─────────────────────────────────────────┐
    │ NTTドコモ ケータイリョウキン             │
    │                                         │
    │ 借方: 通信費     ¥6,136  課税仕入10%    │
    │ 貸方: 普通預金   ¥6,136                 │
    │                                         │
    │ 過去実績: 12回/12回 同一（信頼度:★★★）  │
    │                                         │
    │ [確定] [科目変更] [金額修正] [スキップ]  │
    └─────────────────────────────────────────┘
```

### 未確定事項

- 銀行/カード明細の「未仕訳」をどう特定するか
- MCPに「未仕訳明細」取得ツールがあるか → 要検証
- ない場合: ユーザーが明細リストを入力する方式

---

## 領収書の仕訳候補

| 項目 | 内容 |
|---|---|
| 得たい結果 | 領収書OCR結果から仕訳候補を生成する |
| UIタグ | 仕訳 |
| 出力UI | リスト→モーダル |

### 部品レシピ

```
入力:
  fileReceive → 領収書画像/PDFを取り込み
  ocr(AI) → テキスト抽出（日付・店名・金額）
  fetchJournals → 過去仕訳取得
  fetchAccounts / fetchTaxes → マスタ取得

処理:
  nayose(AI) → 店名の表記ゆれ吸収（セブンイレブン = 7-ELEVEN）
  matchByRemark → 過去仕訳検索 + 科目集計

出力:
  listView → 仕訳候補を提示（貸方は「現金」固定）
```

### 銀行/カード仕訳との違い

| 項目 | 銀行/カード | 領収書 |
|---|---|---|
| 貸方 | 普通預金（口座による） | 現金（固定） |
| nayose | 不要（摘要が安定） | 必須（店名の表記ゆれ多い） |
| ocr | 不要 | 必要 |

---

## 仕訳✓（確認・選択）

| 項目 | 内容 |
|---|---|
| 得たい結果 | 仕訳候補を1件ずつ確認し、承認リストを作成する |
| UIタグ | 仕訳 |
| 出力UI | モーダル |

### 部品レシピ

```
入力:
  前コマンド（銀行仕訳 or 領収書仕訳）の出力

処理:
  UIフロー（部品不要。UI操作のみ）
  1件ずつ: [確定] / [科目変更] / [金額修正] / [スキップ]

出力:
  modalView → 承認リスト一覧
    ┌─────────────────────────────────────────┐
    │ 承認リスト（8件）                        │
    │ ✅ NTTドコモ     通信費      ¥6,136     │
    │ ✅ Amazon        消耗品費    ¥3,200     │
    │ ⏸ ABCコンサル   （スキップ）            │
    │ 合計: 7件 ¥18,016                       │
    │ [全件MFに登録] [個別取消] [やり直し]     │
    └─────────────────────────────────────────┘
```

---

## 仕訳投入（MFへ登録）

| 項目 | 内容 |
|---|---|
| 得たい結果 | 承認済みリストをMFに一括登録する |
| UIタグ | 仕訳 |
| 出力UI | モーダル→結果テキスト |

### 部品レシピ

```
入力:
  仕訳✓の出力（承認済みリスト: SourceJournal[]）

処理:
  ① buildAllMaps(tokenKey)
     Sugusru概念ID → MF-ID の変換テーブルを生成（5分キャッシュ）
     科目: 108件マッチ / 税区分: 151件 / 補助科目: 16件 / 取引先: 2件

  ② convertToMfJournal(journal, maps)
     - validateBeforeConvert: 科目存在・税区分・金額・日付・貸借一致検証
     - toInvoiceKind: invoice_status → invoice_kind 変換（内部保持）
     - convertBranches: N:N → branches変換（対向金額一致方式）
     - 戻り値: { payload, errors, hasNonQualified, invoiceKind }

  ③ stripInvoiceKind
     MF APIがinvoice_kind送信を拒否するため、送信前に全branchから除去
     （課税方式変更時に壊れないため）

  ④ mcpCreateJournal(sendPayload, tokenKey)
     MCP経由でMFに送信。MfJournalResponse型でid/number取得

  ⑤ applyMfSendResults(journals, results)
     送信成功した仕訳に mf_journal_id / mf_journal_number / mf_sent_at を書き戻し
     status を 'exported' に変更

出力:
  MF投入 → postJournals でMFに登録
  DB保存 → mf_journal_id紐付け済み仕訳を永続化
  resultView → 投入結果（成功/失敗/件数 + 非適格警告）
    ┌────────────────────────────────────┐
    │ MF仕訳投入 完了                       │
    │                                     │
    │ 成功: 8件 / 失敗: 0件                │
    │ 所要時間: 3.2秒                       │
    │                                     │
    │ ⚠️ 非適格仕訳: 2件                   │
    │   MF管理画面で「非適格」に手動修正     │
    │   が必要です                          │
    └────────────────────────────────────┘

実装ファイル:
  journalToMfConverter.ts  … 変換ロジック
  mfJournalSender.ts       … 送信 + MF-ID紐付け + 429リトライ
  mfMappingService.ts      … IDマッピング
  mfMcpClient.ts           … MCPクライアント

詳細: 39_mf_field_mapping.md
```

### 実装状態: ✅ 部品実装済み（実機テスト確認済み 2026-05-23）

---

## 仕訳取消（修正・削除）

| 項目 | 内容 |
|---|---|
| 得たい結果 | MFに投入済みの仕訳を修正or削除する |
| UIタグ | 仕訳 |
| 出力UI | モーダル |

### 部品レシピ

```
入力:
  fetchJournals → DB検索で該当仕訳を特定

処理:
  putJournals → MCP WRITE で更新

出力:
  MF投入 → putJournals でMFを更新
  DB保存 → saveJournals でDBも更新
  resultView → 更新結果
```

---

## 売掛消込リスト / 買掛消込リスト

```
入力: fetchJournals（売掛/買掛 + 入金/出金の仕訳）
処理: pairing（摘要マッチでペアリング）
出力: tableView → 消込候補テーブル → modalView → 仕訳✓へ
```

---

## 仕訳ルールの言語化

```
入力: fetchJournals（過去仕訳全件）
処理: aggregate（摘要別パターン集計）+ aiSummarize(AI)（ルール化）
出力: textView → ルール一覧テキスト
```

---

## 過去同一取引の仕訳

```
入力: fetchJournals
処理: matchByRemark + nayose(AI)
出力: tableView → 過去仕訳テーブル
```

---

## 定期取引検出

```
入力: fetchJournals
処理: 頻度分析 + 標準偏差
出力: tableView → 定期取引テーブル
```

---

## 中間勘定パターン

```
入力: fetchJournals + fetchAccounts
処理: pairing（前受金/未払金の発生・消込パターン）
出力: tableView → パターンテーブル
```

---

## 残高不一致の根拠

```
入力: MCP(TB) + アプリデータ
処理: diffCompare + aiReason(AI)
出力: textView → 根拠5件
```

---

## 実装順序

```
★最優先: 銀行/カード仕訳候補 → 仕訳✓ → 仕訳投入（パイプライン通しで動かす）
  → fetchJournals, fetchAccounts, fetchTaxes, matchByRemark
  → listView, modalView, resultView
  → postJournals, saveJournals

次: 領収書仕訳候補
  → ocr, nayose, fileReceive 追加

次: 消込リスト
  → pairing 追加

次: 仕訳参考情報（ルール言語化, 定期取引等）
  → aiSummarize 追加
```

# コマンドカタログ

> コマンド = ユーザーが得たい結果。入力部品 + 処理部品 + 出力部品の組み合わせで実現する。
> 部品の詳細: [35_parts_catalog.md](35_parts_catalog.md)
> ✅ = 実機検証済み / 🔧 = 実装可能 / ❌ = 現行MCPでは困難
> 最終更新: 2026-05-22

---

## 設計方針

### 定義

```
AIコマンド = ユーザーが得たい結果
  例: 「銀行/カード明細の仕訳候補」「売上ランキング」「MFデータ同期」

レシピ = コマンドの作り方（部品の組み合わせ手順）
  1コマンド = 1レシピ。コマンドごとにレシピを作る。
  定義場所: 34a_command_journal.md / 34b_command_business.md

部品 = レシピを構成する素材（4ジャンル）
  入力部品: どこからデータを取るか（MCP, DB, ファイル, ユーザー入力）
  処理部品: データをどう加工するか（ロジック, AI）
  出力部品: 結果をどこに出すか（画面, MF, DB, CSV）
  基盤:     流れそのものを支える（ルーティング, 認証, ログ, エラー）
  定義場所: 35_parts_catalog.md
```

```
関係:
  コマンド ──は──→ レシピ ──で作る
  レシピ  ──は──→ 部品の組み合わせ
  部品    ──は──→ 入力 / 処理 / 出力 / 基盤

例:
  コマンド「銀行/カード明細の仕訳候補」
    レシピ:
      基盤: ルーティング → テナント解決 → MCP認証
      入力: fetchJournals + fetchAccounts + fetchTaxes
      処理: matchByRemark
      出力: listView → modalView

人間向け: UIボタン/メニュー（タグでグループ化）
AI向け: ルーティング用カタログ（AIがわかる言語で定義）
```

### なぜこの構造か

```
旧: S/J/B/A分類（業務機能基準）
  → S（前処理）はユーザーが呼ぶコマンドではなく部品だった
  → A（AI機能）はコマンドではなく処理部品だった
  → 分類と実態が乖離

新: 基盤 / 入力 / 処理 / 出力（システム構造基準）
  → コマンド = 部品の組み合わせレシピ
  → 部品カタログ（35_parts_catalog.md）で全部品を管理
  → 新コマンド追加 = 既存部品の組み合わせ + 必要なら新部品追加
```

### 大前提

```
AIは馬鹿。嘘をつく。ブレる。
  → AIの裁量を最小化する
  → AIは処理部品の1ジャンルに過ぎない
  → 36コマンド中、AIを使うのは10コマンドだけ

AIが決めてよいこと:
  ✅ 名寄せ（表記ゆれの統合判定）
  ✅ 言語化（データ→テキスト変換）
  ✅ 理由推定（参考情報として人間に提示）

AIが決めてはいけないこと:
  ❌ 科目の選択（人間が選ぶ）
  ❌ 仕訳の確定（人間が承認する）
  ❌ MFへの投入判断（人間が最終確認する）
```

### 処理フロー（Layer構造）

```
ユーザー入力
  ↓
Layer 1: コード側パターンマッチ（36_infra_ui.md）
  「科目一覧」→ 即MCP実行 → 表示（AIの裁量ゼロ）
  ↓ マッチしない
Layer 2: AIルーティング（35_parts_catalog.md aiRouting部品）
  「銀行明細を仕訳して」→ コマンドにマッチ → 部品組み合わせで実行
  ↓ マッチしない
Layer 3: オープン対応（フォールバック）
  AIに裁量を与える（やむを得ない場合のみ）
```

### ブレ防止の2層構造

| 層 | ブレの種類 | 対策 | 定義場所 |
|---|---|---|---|
| ルーティング | 入力→どのコマンドか | コマンド名・境界定義 | 本ファイル |
| 実行結果 | AIが毎回違う結果を返す | プロンプト + 許可/禁止 | 35_parts_catalog.md |

---

## コマンド一覧

### 仕訳系（UIタグ: 仕訳） → [34a_command_journal.md](34a_command_journal.md)

| コマンド名 | 入力 | 処理 | 出力先 | 出力UI | 状態 |
|---|---|---|---|---|---|
| **銀行/カード明細の仕訳候補** | DB: journals, accounts, taxes | matchByRemark | 画面 | リスト→モーダル | 未実装 |
| **領収書の仕訳候補** | DB: journals, accounts, taxes | matchByRemark + nayose(AI) | 画面 | リスト→モーダル | 未実装 |
| **仕訳✓（確認・選択）** | 前コマンドの出力 | UIフロー | 画面 | モーダル | 未実装 |
| **仕訳投入（MFへ登録）** | 承認済みリスト | postJournals | MF + DB | モーダル→結果テキスト | 未実装 |
| **仕訳取消（修正・削除）** | DB: journals | putJournals | MF + DB | モーダル | 未実装 |
| 売掛消込リスト | DB: journals（売掛+入金） | pairing | 画面 | テーブル→モーダル | 🔧 |
| 買掛消込リスト | DB: journals（買掛+出金） | pairing | 画面 | テーブル→モーダル | 🔧 |
| 仕訳ルールの言語化 | DB: journals | aggregate + aiSummarize(AI) | 画面 | テキスト | 🔧 |
| 過去同一取引の仕訳 | DB: journals | matchByRemark + nayose(AI) | 画面 | テーブル | 🔧 |
| 定期取引検出 | DB: journals | 頻度+標準偏差 | 画面 | テーブル | 🔧 |
| 中間勘定パターン | DB: journals, accounts | pairing | 画面 | テーブル | 🔧 |
| 残高不一致の根拠 | MCP: TB + アプリ | aiReason(AI) | 画面 | テキスト | ❌ |

---

### 分析系（UIタグ: 分析） → [34b_command_business.md](34b_command_business.md)

| コマンド名 | 入力 | 処理 | 出力先 | 出力UI | 状態 |
|---|---|---|---|---|---|
| 売上ランキング | MCP: PL + DB: journals | aggregate + nayose(AI) | 画面 | テーブル | ✅ |
| 経費ランキング | MCP: PL + DB: journals | aggregate | 画面 | テーブル | ✅ |
| 月次変動科目 | MCP: TransitionPL + DB: journals | aggregate + aiReason(AI) | 画面 | テーブル+テキスト | ✅ |
| ビジネスモデル概況 | MCP: PL + termSettings | aiSummarize(AI) | 画面 | テキスト | 🔧 |
| 売上先・仕入先・外注先一覧 | DB: journals, accounts | aggregate + nayose(AI) | 画面 | テーブル | 🔧 |
| 給与・役員報酬月次推移 | MCP: TransitionPL | 科目抽出 | 画面 | テーブル | 🔧 |
| 口座カードリスト | MCP: dataSources | なし | 画面 | テーブル | 🔧 |
| 過去3期計画 | MCP: PL × 3期 | aiSummarize(AI) | 画面 | テキスト | 🔧 |
| 回収/支払サイト | DB: journals | 日数算出 | 画面 | テーブル | 🔧 |
| 口座役割と資金の流れ | DB: journals + MCP: DS | aiSummarize(AI) | 画面 | テキスト | 🔧 |
| バッチ損益マージ | MCP: PL + アプリ | 統合 | 画面 | テーブル | 🔧 |
| 売上増減ランキング | MCP: PL × 2期 + DB: journals | aggregate + nayose(AI) | 画面 | テーブル | ✅ |
| 売上ランキング（部門別） | DB: journals + MCP: dept | 部門集計 | 画面 | テーブル | 🔧 |
| 売上増減（部門別） | DB: journals × 2期 + dept | 部門比較 | 画面 | テーブル | 🔧 |
| 仕入ランキング | DB: journals, accounts | 仕入集計 | 画面 | テーブル | 🔧 |
| 仕入増減ランキング | DB: journals × 2期 | 昨期比 | 画面 | テーブル | 🔧 |
| 外注ランキング | DB: journals, accounts | 外注集計 | 画面 | テーブル | 🔧 |
| 外注増減ランキング | DB: journals × 2期 | 昨期比 | 画面 | テーブル | 🔧 |

---

### 管理系（UIタグ: 管理）

| コマンド名 | 入力 | 処理 | 出力先 | 出力UI | 状態 |
|---|---|---|---|---|---|
| **MFデータ取込（仕訳、科目マスタ、税区分マスタ）** | MCP: journals, accounts, taxes × 対象顧問先 | UPSERT | DB | 結果テキスト | 未実装 |
| 連携不備全社リスト | MCP: DS × テナント | フィルタ | 画面 | テーブル | ❌ |
| 現金領収書未受領リスト | アプリ: 受領管理 | 日付比較 | 画面 | テーブル | ❌ |
| 未連携口座未受領リスト | MCP: DS + アプリ | 比較 | 画面 | テーブル | ❌ |

---

### データ取得系（UIタグ: データ / Layer 1パターンマッチ）

> Layer 1で処理。AIルーティング不要。コード側パターンマッチで即実行。

| コマンド名 | 入力 | 処理 | 出力先 | 出力UI | パターンID |
|---|---|---|---|---|---|
| 事業者情報 | MCP: currentOffice | なし | 画面 | テキスト | office_info |
| 科目一覧 | MCP: getAccounts | なし | 画面 | テーブル | accounts_list |
| 税区分一覧 | MCP: getTaxes | なし | 画面 | テーブル | taxes_list |
| 仕訳取得（期間） | MCP: getJournals | 日付計算 | 画面 | テーブル | journals_period |
| 仕訳取得（ID） | MCP: getJournalById | IDパース | 画面 | テキスト | journal_detail |
| PL試算表 | MCP: getPL | 年度算出 | 画面 | テーブル | pl_trial |
| BS試算表 | MCP: getBS | 年度算出 | 画面 | テーブル | bs_trial |
| PL推移表 | MCP: getTransitionPL | なし | 画面 | テーブル | pl_transition |
| BS推移表 | MCP: getTransitionBS | なし | 画面 | テーブル | bs_transition |
| 取引先一覧 | MCP: getTradePartners | なし | 画面 | テーブル | partners_list |
| 部門一覧 | MCP: getDepartments | なし | 画面 | テーブル | departments |
| 補助科目一覧 | MCP: getSubAccounts | なし | 画面 | テーブル | sub_accounts |
| 連携サービス一覧 | MCP: getConnectedAccounts | なし | 画面 | テーブル | connected |
| 会計年度設定 | MCP: getTermSettings | なし | 画面 | テキスト | term_settings |
| MFデータ比較 | MCP + アプリDB | 差分算出 | 画面 | テーブル | data_compare |

---

## ルーティングテスト結果

AIモデル変更時にルーティングがブレないかの回帰テスト。
テストスクリプト: [test_routing.ts](../../src/scripts/test_routing.ts)
テスト内容: 20ケース（仕訳パイプライン + 分析系 + 拒否テスト）× 4モデル

### 結果（2026-05-22実施）

| モデル | 正解率 | 平均ms | コスト/回 | 判定 |
|---|---|---|---|---|
| gemini-2.5-flash | 20/20 (100%) | 1731ms | ¥0.0004 | ✅ 採用可 |
| gemini-3-flash-preview | 19/20 (95%) | 5113ms | ¥0.0005 | ✅ 採用可 |
| gemini-3.1-flash-lite | 20/20 (100%) | 2165ms | ¥0.0003 | ✅ 採用可 |
| **gemini-3.5-flash** | **20/20 (100%)** | **3067ms** | **¥0.001** | **✅ 採用（決定）** |

> **決定: gemini-3.5-flash を採用。** 1万回呼んでも¥10。コストは無視できる。

---

## 関連ドキュメント

| ファイル | 層 | 内容 |
|---|---|---|
| [34a_command_journal.md](34a_command_journal.md) | 完成品 | 仕訳系コマンドの詳細レシピ |
| [34b_command_business.md](34b_command_business.md) | 完成品 | ビジネス系コマンドの詳細レシピ |
| [35_parts_catalog.md](35_parts_catalog.md) | 部品 | 入力/処理/出力の全部品定義 |
| [36_infra_ui.md](36_infra_ui.md) | 基盤 | UI設計・フロー設計・Layer 1/2/3 |
| [37_infra_mcp.md](37_infra_mcp.md) | 基盤 | MCP接続・認証・レート制限 |
| [38_infra_db.md](38_infra_db.md) | 基盤 | DB基盤・月次同期 |

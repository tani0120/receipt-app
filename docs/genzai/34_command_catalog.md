# コマンドカタログ

> コマンド = ユーザーが得たい結果。入力部品 + 処理部品 + 出力部品の組み合わせで実現する。
> 部品の詳細: [35_parts_catalog.md](35_parts_catalog.md)
> ✅ = 直接API実装済み / ⚠️ = 暫定MCP直叩き / 🔧 = 計画中
> 最終更新: 2026-05-25

---

## 設計方針

### 定義

```
AIコマンド = ユーザーが得たい結果
  例: 「MF全データ同期」「仕訳投入」「財務分析」

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
  コマンド「MF全データ同期」
    レシピ:
      基盤: ルーティング → テナント解決 → MCP認証
      入力: fetchCurrentOffice + fetchAccounts + fetchTaxes + fetchJournals + fetchTermSettings + fetchTradePartners
      処理: mapToClient + saveAccounts + saveTaxCategories + importJournals
      出力: チャット内結果テキスト

人間向け: UIボタン/メニュー（タグでグループ化）
AI向け: ルーティング用カタログ（AIがわかる言語で定義）
```

### なぜこの構造か

```
旧: 30コマンド（細分化しすぎ）
  → 「科目一覧」「税区分一覧」「部門一覧」等が個別コマンド
  → ユーザーに選択肢が多すぎ
  → データ取得にAI（Gemini FC）を経由してトークンを消費

新: 7コマンド（統合）
  → 「MF全データ同期」で全マスタ＋仕訳を一括取込
  → 全コマンドの最終形は直接API（Geminiトークン0）
  → AI解釈が必要な「財務分析」のみGemini FC維持
```

### 大前提

```
AIは馬鹿。嘘をつく。ブレる。
  → AIの裁量を最小化する
  → AIは処理部品の1ジャンルに過ぎない
  → 7コマンド中、AIを使うのは1コマンド（財務分析）だけ

AIが決めてよいこと:
  ✅ 名寄せ（表記ゆれの統合判定）
  ✅ 言語化（データ→テキスト変換）
  ✅ 理由推定（参考情報として人間に提示）

AIが決めてはいけないこと:
  ❌ 科目の選択（人間が選ぶ）
  ❌ 仕訳の確定（人間が承認する）
  ❌ MFへの投入判断（人間が最終確認する）
```

### 実行方式（3種類）

| 方式 | 説明 | Geminiトークン | 用途 |
|---|---|---|---|
| **direct_api** | 自前エンドポイント経由で直接実行 | **0** | MF全データ同期等、業務ロジック実装済み |
| **mcp_direct** | MCPツールを直接呼び出し（暫定） | **0** | 仕訳取得・消込等、業務ロジック未完成 |
| **ai_fc** | 層3 Function Calling | **¥1〜5/回** | 財務分析（AI解釈が必要） |

### 処理フロー（Layer構造）

```
ユーザー入力
  ↓
Layer 1: コード側パターンマッチ（36_infra_ui.md）
  「MFデータ取込」→ 直接API /api/mf/sync-all 実行（AIの裁量ゼロ）
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

## コマンド一覧（7コマンド）

唯一の真実: [commandCatalog.ts](../../src/api/services/commandCatalog.ts)

### 実装ロードマップ

全コマンドの最終形は**直接API**。P1から順に実装。

| 優先度 | コマンドID | コマンド名 | カテゴリ | 実行方式 | 状態 | コスト/回 |
|---|---|---|---|---|---|---|
| **P1** | `mf_sync_all` | MF全データ同期 | データ | direct_api | ⚠️ 一部実装済み | 0円 |
| **P2** | `journal_view` | 仕訳取得・確認 | 仕訳 | mcp_direct | ⚠️ 暫定MCP | 0円 |
| **P3** | `journal_write` | 仕訳投入 | 仕訳 | mcp_direct | ⚠️ 暫定MCP | 0円 |
| **P4** | `journal_cancel` | 仕訳取消 | 仕訳 | mcp_direct | 🔧 計画中 | 0円 |
| **P5** | `master_ref` | マスタ参照 | データ | mcp_direct | 🔧 計画中 | 0円 |
| **P6** | `matching` | 消込 | 仕訳 | mcp_direct | 🔧 計画中 | 0円 |
| **P7** | `financial_analysis` | 財務分析 | 分析 | ai_fc | ⚠️ 層3FC | ¥1〜5 |

---

### P1: MF全データ同期 → [詳細は34a_command_journal.md内で記載予定]

| 項目 | 内容 |
|---|---|
| **コマンドID** | `mf_sync_all` |
| **統合元** | sync_mf_data, accounts_list, taxes_list, departments, sub_accounts, connected, office_info, term_settings, partners_list |
| **入力** | MCP: currentOffice + getTermSettings + getAccounts + getTaxes + getJournals + getTradePartners + getDepartments + getSubAccounts + getConnectedAccounts |
| **処理** | mapOfficeToClient + mapTermSettingsToClient + saveClientAccounts + saveClientTaxCategories + importMfJournals |
| **出力先** | DB（clientStore, accountMasterStore） + チャット内結果テキスト |
| **取込期間** | 常に3期分（直近2期＋進行期） |
| **エンドポイント** | `POST /api/mf/sync-all` |
| **コスト** | 0円（MCP無料 + Gemini不使用） |

---

### P2: 仕訳取得・確認

| 項目 | 内容 |
|---|---|
| **コマンドID** | `journal_view` |
| **統合元** | journals_period, journal_detail, journal_confirm, past_similar |
| **入力** | MCP: getJournals, getJournalById |
| **処理** | 日付計算 + 絞り込み + 名寄せ(AI) |
| **出力先** | 画面（テーブル / モーダル） |
| **コスト** | 0円 |

---

### P3: 仕訳投入

| 項目 | 内容 |
|---|---|
| **コマンドID** | `journal_write` |
| **統合元** | bank_journal, receipt_journal, journal_post |
| **入力** | DB: journals, accounts, taxes + ユーザー入力（領収書画像等） |
| **処理** | matchByRemark + nayose(AI) + convertToMfJournal + postJournals |
| **出力先** | MF + DB + チャット結果テキスト |
| **コスト** | 0円 |

---

### P4: 仕訳取消

| 項目 | 内容 |
|---|---|
| **コマンドID** | `journal_cancel` |
| **統合元** | journal_cancel |
| **入力** | DB: journals |
| **処理** | putJournals / deleteJournals |
| **出力先** | MF + DB |
| **コスト** | 0円 |

---

### P5: マスタ参照

| 項目 | 内容 |
|---|---|
| **コマンドID** | `master_ref` |
| **統合元** | partner_list, data_sources, recurring_detect, suspense_pattern, journal_rules |
| **入力** | DB: journals, accounts + MCP: tradePartners, connectedAccounts |
| **処理** | aggregate + 頻度分析 + pairing |
| **出力先** | 画面（テーブル / テキスト） |
| **コスト** | 0円 |

---

### P6: 消込

| 項目 | 内容 |
|---|---|
| **コマンドID** | `matching` |
| **統合元** | ar_matching, ap_matching |
| **入力** | DB: journals（売掛/買掛 + 入出金） |
| **処理** | pairing（日付+金額+取引先で突合） |
| **出力先** | 画面（テーブル→モーダル） |
| **コスト** | 0円 |

---

### P7: 財務分析

| 項目 | 内容 |
|---|---|
| **コマンドID** | `financial_analysis` |
| **統合元** | pl_trial, bs_trial, pl_transition, bs_transition, sales_ranking, expense_ranking, monthly_variance, biz_overview, three_year_plan, sales_change, payroll_trend, collection_cycle, fund_flow, partner_list, data_sources |
| **入力** | MCP: PL/BS試算表 + 推移表 + DB: journals |
| **処理** | aggregate + aiSummarize(AI) + aiReason(AI) |
| **出力先** | 画面（テーブル + テキスト） |
| **将来構想** | 定型化し、顧問先への報告フォーマットをAPI直叩きで自動生成（設計未定） |
| **コスト** | ¥1〜5/回（Gemini FC） |

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
> ※ 7コマンド統合後はルーティングテストの再実施が必要。

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
| [39_mf_field_mapping.md](39_mf_field_mapping.md) | 基盤 | MF↔Sugusruフィールド対応表（invoice_kind実機テスト結果含む） |

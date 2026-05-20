# AIコマンド 定型パターン全カタログ

> ユーザー要望 + [MFC仕訳アナリスト（note記事）](https://note.com/kyon_copanda/n/ne1a9a90ccfb8) を統合
> ✅ = 実機検証済み / 🔧 = MVP実装可能 / 🔬 = 要追加調査 / ❌ = 現行MCPでは不可
> 最終更新: 2026-05-21
> 共通エンジン設計: [37_monthly_sync_design.md](37_monthly_sync_design.md)

---

## 優先度A: 即実装可能（MCPツールで完結）

| # | パターン名 | 定義書（動くコード） | 状態 |
|---|---|---|---|
| 1 | **売上ランキング（科目別/取引先別）** | [p01_sales_analysis.ts](file:///c:/dev/receipt-app/src/ai-commands/patterns/p01_sales_analysis.ts) | ✅ 検証済み |
| 2 | **経費ランキング（科目別/取引先別）** | [p02_expense_analysis.ts](file:///c:/dev/receipt-app/src/ai-commands/patterns/p02_expense_analysis.ts) | ✅ 検証済み |
| 3 | **月次変動科目（摘要+理由推定）** | [p03_monthly_variance.ts](file:///c:/dev/receipt-app/src/ai-commands/patterns/p03_monthly_variance.ts) | ✅ 検証済み |
| 4 | **ビジネスモデル概況** | — | 🔧 |
| 5 | **売上先・仕入先・外注先・顧問報酬一覧** | — | 🔧 |
| 6 | **給与・役員報酬の月次推移** | — | 🔧 |
| 7 | **毎月固定の定期取引 自動検出** | — | 🔧 |
| 8 | **口座カードリスト + 連携/未連携情報** | — | 🔧 |
| 9 | **過去3期分損益から月次計画** | — | 🔧 |
| 10 | **仕訳ルールの言語化** | — | 🔧 |
| 22 | **売上増減ランキング（科目別/取引先別）増減厐10位** | — | 🔧 |
| 23 | **売上ランキング（部門別）** | — | 🔧 |
| 24 | **売上増減ランキング（部門別）増減厐10位** | — | 🔧 |
| 25 | **仕入ランキング（科目別/取引先別）** | — | 🔧 |
| 26 | **仕入増減ランキング（科目別/取引先別）増減厐10位** | — | 🔧 |
| 27 | **外注ランキング（科目別/取引先別）** | — | 🔧 |
| 28 | **外注増減ランキング（科目別/取引先別）増減厐10位** | — | 🔧 |

---

## 優先度B: 実装可能だが設計に工夫が必要

| # | パターン名 | 使用ツール | 課題 |
|---|---|---|---|
| 11 | **回収サイト・支払サイトの取引先別計算** | `getJournals`（売掛/買掛+入金/出金） | 売掛と入金を摘要でマッチする必要あり |
| 12 | **売掛と入金消込リスト** | `getJournals`（売掛金科目+普通預金科目） | 消込ロジックの設計が複雑 |
| 13 | **買掛と出金消込リスト** | 同上（買掛金版） | 同上 |
| 14 | **中間勘定の発生・消込パターン** | `getJournals` + `getAccounts`（前受金/未払金/仮受金） | 対になる仕訳のペアリングが必要 |
| 15 | **口座ごとの役割分担と資金の流れ** | `getJournals` + `getDataSources` | 口座IDと仕訳の紐付け方法 |
| 16 | **領収書投げたら過去同じ取引の仕訳1年分** | `getJournals` + OCR結果 | OCR→摘要マッチの精度 |
| 17 | **バッチ処理後の売上経費とMFマージした損益** | `getReportsTrialBalanceProfitLoss` + アプリデータ | 2ソース統合ロジック |

---

## 優先度C: 現行MCPでは困難 or アプリ側機能が必要

| # | パターン名 | 理由 |
|---|---|---|
| 18 | **残高不一致の理由と根拠5つ** | MF残高 vs 実残高の比較。実残高データがMCPにない |
| 19 | **連携不備全社リスト + 該当口座やカード** | `getDataSources`で取得可能だが、全テナント横断は1テナント1トークン制約 |
| 20 | **現金領収書の最終日付と未受領資料シルト** | 領収書データはMCPにない。アプリ側の受領管理 |
| 21 | **未連携口座/カードの最終日付から未受領資料シルト** | `getDataSources`の`last_synced_at`は使えるが、未受領の概念はアプリ側 |

---

## 検証済みパターン詳細

### #1 売上ランキング ✅

```
ツール: getReportsTrialBalanceProfitLoss + getJournals
アプローチA: 摘要パース → 取引先別集計
アプローチB: PL試算表 → 科目別集計
定義書: src/ai-commands/patterns/p01_sales_analysis.ts
```

### #2 経費ランキング ✅

```
ツール: getReportsTrialBalanceProfitLoss + getJournals
アプローチA: PL試算表 → 経費科目別
アプローチB: 摘要パース → 取引先別（科目名付き）
定義書: src/ai-commands/patterns/p02_expense_analysis.ts
```

### #3 月次変動科目 ✅（摘要全件 + gemini-3.5-flash理由推定）

```
ツール: getReportsTransitionProfitLoss + getJournals + getAccounts
処理:
  Step 1: PL推移表取得（type: "monthly" 必須）
    → 月次列は /^\d{1,2}$/ で判定。settlement_balance/total除外
    → 「売上高合計」行のtotal列から年商を取得
  Step 2: 異常検出
    → 12ヶ月平均比 ±X%（ユーザー入力、デフォルト50%）
    → AND 乖離額 >= 年商×1%（小さい変動を除外）
    → 乖離額の絶対値で降順ソート → 上位10件
  Step 3: 摘要抽出
    → 全仕訳取得 → 科目名→科目IDマッピング
    → 異常科目×月の仕訳をフィルタ（transaction_date で月判定）
    → 全摘要を金額降順でカンマ区切り（金額付き）
  Step 4: AI理由推定
    → gemini-3.5-flash に摘要付きテーブルを渡す → 理由1行推定
実機結果:
  年商: ¥2,038,000 / 乖離額下限: ¥20,380
  フィルタ前: 13件 → フィルタ後: 3件
  通信費12月 ¥-22,636（乖離額¥-38,979）が1位で正しく検出
  摘要: （摘要なし）(¥30,672), ドコモ12月分(¥6,136), j-com(¥1,900)
  AI推定: 「摘要なし」のマイナス仕訳が計上され全体がマイナスに
  速度: 7.4秒
定義書: src/ai-commands/patterns/p03_monthly_variance.ts
```

### 設計判断の経緯（#3）

| 検討事項 | 採用 | 却下 | 理由 |
|---|---|---|---|
| ソート基準 | 乖離額の絶対値 | 乖離率 | 率だと少額ノイズが上位に来る |
| 乖離額下限 | 年商1% | 年商5% / 5万円固定 | 5%→個人で全件消える。固定→スケールしない |
| 摘要表示 | 全件カンマ区切り | 金額最大1件 | 最大1件が摘要なしだと原因不明 |
| 理由推定 | gemini-3.5-flash | なし | 摘要があればAIが推定可能 |

---

## 未検証パターン設計メモ

### #4: ビジネスモデル概況

```
ツール: getReportsTrialBalanceProfitLoss + getTermSettings
ロジック:
  → PL試算表から売上構成、経費構成、利益率を算出
  → 事業種別（個人/法人）、不動産有無を判定
  → 売上の科目名から業種を推定
AI要約:
  → 「飲食業+不動産賃貸の個人事業主。売上の63%が賃貸収入。」のような1段落要約
```

### #5: 売上先・仕入先・外注先・顧問報酬一覧

```
ツール: getJournals + getAccounts + 名寄せ
ロジック:
  → REVENUE科目 → 売上先（摘要パース）
  → EXPENSE科目で「仕入高」「外注工賃」「外注費」→ 仕入先/外注先
  → EXPENSE科目で「支払手数料」「顧問報酬」→ 顧問先
  → 各グループを名寄せ → テーブル出力
```

### #6: 給与・役員報酬の月次推移

```
ツール: getReportsTransitionProfitLoss({ type: "monthly" })
ロジック:
  → rows から「給料賃金」「役員報酬」「法定福利費」を抽出
  → 月次の値を横並びで出力
  → 急な増減があればフラグ
```

### #7: 毎月固定の定期取引 自動検出

```
ツール: getJournals（全件取得）
ロジック:
  → (科目ID, 摘要, 金額) のタプルで集計
  → 出現月数が 10/12 以上 → 定期取引と判定
  → 毎月の金額がほぼ同じ（標準偏差/平均 < 0.1）→「固定費」
  → 例: ドコモ携帯電話料 ¥22,000 × 12ヶ月
```

### #8: 口座カードリスト + 連携/未連携情報

```
ツール: getDataSources()
レスポンス（実機未検証）:
  → data_sources[].name     // "楽天銀行"
  → data_sources[].type     // "BANK" | "CREDIT_CARD" | "E_MONEY"
  → data_sources[].status   // "CONNECTED" | "DISCONNECTED" | "ERROR"
  → data_sources[].last_synced_at  // 最終同期日時
```

### #9: 過去3期分損益から月次計画

```
ツール:
  getReportsTrialBalanceProfitLoss({ fiscal_year: 2023 })
  getReportsTrialBalanceProfitLoss({ fiscal_year: 2024 })
  getReportsTrialBalanceProfitLoss({ fiscal_year: 2025 })
ロジック:
  → 3期分の売上・経費・利益を取得
  → 年成長率を算出
  → 2026年度の月次計画を単純外挿 or 季節指数で按分
AI:
  → 計画テーブル作成 + リスク要因コメント
```

### #10: 仕訳ルールの言語化

```
ツール: getJournals（全件取得）
ロジック:
  → (摘要パターン, 借方科目, 貸方科目) のタプルで集計
  → 頻出パターンを抽出
  → 「〇〇という摘要 → 借方:通信費 / 貸方:普通預金」のようにルール化
AI:
  → 「この事業者の仕訳ルール」として人間が読める形に言語化
活用:
  → 仕訳自動生成の精度向上（AIリファレンスとして使う）
```

### #22: 売上増減ランキング（科目別/取引先別）増減各10位

```
ツール: getReportsTrialBalanceProfitLoss × 2期分 + getJournals
ロジック:
  → 昨期・今期のPL試算表を取得
  → REVENUE科目の昨期月平均 vs 今期月平均を算出
  → 増加額トップ10 + 減少額トップ10
  → 取引先別は仕訳の摘要/trade_partner_nameで集計
出力:
  | 順位 | 科目/取引先 | 昨期月平均 | 今期月平均 | 増減額 | 増減率 |
```

### #23: 売上ランキング（部門別）

```
ツール: getJournals + getDepartments + getAccounts
ロジック:
  → REVENUE科目の仕訳をdepartment_idで集計
  → 部門名はgetDepartmentsで解決
  → 部門0件の場合は「部門設定なし」と報告してスキップ
出力:
  | 順位 | 部門 | 売上合計 | 構成比 |
```

### #24: 売上増減ランキング（部門別）増減各10位

```
ツール: getJournals × 2期分 + getDepartments
ロジック:
  → 昨期・今期の仕訳をdepartment_id × REVENUE科目で集計
  → 部門ごとの昨期月平均 vs 今期月平均を算出
  → 増加トップ10 + 減少トップ10
```

### #25: 仕入ランキング（科目別/取引先別）

```
ツール: getJournals + getAccounts
ロジック:
  → 科目名で「仕入高」「仕入値引」等をフィルタ（account_group or 科目名マッチ）
  → 取引先別: trade_partner_name or 摘要で集計
  → 金額降順でランキング
```

### #26: 仕入増減ランキング（科目別/取引先別）増減各10位

```
ツール: getJournals × 2期分 + getAccounts
ロジック:
  → #25の2期分版。昨期月平均 vs 今期月平均
  → 増加トップ10 + 減少トップ10
```

### #27: 外注ランキング（科目別/取引先別）

```
ツール: getJournals + getAccounts
ロジック:
  → 科目名で「外注工賃」「外注費」「業務委託費」等をフィルタ
  → 取引先別: trade_partner_name or 摘要で集計
  → 金額降順でランキング
```

### #28: 外注増減ランキング（科目別/取引先別）増減各10位

```
ツール: getJournals × 2期分 + getAccounts
ロジック:
  → #27の2期分版。昨期月平均 vs 今期月平均
  → 増加トップ10 + 減少トップ10
```

---

## 実装順序

```
Phase 1（即実装）:
  #1 売上ランキング   ← ✅ 完了（p01_sales_analysis.ts）
  #2 経費ランキング   ← ✅ 完了（p02_expense_analysis.ts）
  #3 月次変動科目     ← ✅ 完了（p03_monthly_variance.ts）
  #22 売上増減ランキング ← ✅ 完了（p22_sales_change_ranking.ts）AI名寄せ付き
  #25 仕入ランキング
  #26 仕入増減ランキング
  #27 外注ランキング
  #28 外注増減ランキング
  #4 ビジネスモデル概況
  #8 口座カードリスト

Phase 2（複合分析）:
  #5 売上先・仕入先・外注先一覧（名寄せ済み）
  #7 定期取引検出
  #10 仕訳ルール言語化
  #6 給与月次推移
  #9 過去3期計画

Phase 3（部門別・消込）:
  #11 回収/支払サイト
  #12-14 消込系
  #23 売上ランキング（部門別）
  #24 売上増減ランキング（部門別）

Phase 4（アプリ連携必要）:
  #15-17（口座役割、領収書、バッチ統合等）
  #18-21（残高不一致、連携不備、現金領収書、未連携口座）
```

### 共通エンジンアーキテクチャ

> 詳細: [37_monthly_sync_design.md](37_monthly_sync_design.md) セクション7

全パターンは共通パーツの組み合わせで実装。名寄せはDBキャッシュ優先、新規のみAI実行。

```
グループA: ランキング系（11個） = fetchAccounts + fetchJournals + aggregateByPartner + nayose + formatRanking
グループB: 月次推移系（3個） = fetchJournals + aggregateByMonth
グループC: PL概況系（2個） = fetchPL + aiSummarize
グループD: データソース系（4個） = fetchDataSources
グループE: 消込系（4個） = fetchJournals + 独自ペアリング
グループF: 単独系（4個） = 個別ロジック
```


---

## ファイル配置

```
src/ai-commands/
  engine/
    parts/
      fetchAccounts.ts          ← 科目取得+フィルタ（DBから）
      fetchJournals.ts          ← 仕訳取得（DB優先、MCPフォールバック）
      fetchPL.ts                ← PL試算表/推移表取得
      fetchDataSources.ts       ← 口座/カード取得
      aggregateByPartner.ts     ← 取引先別集計（未確定カウント含む）
      aggregateByDepartment.ts  ← 部門別集計
      aggregateByMonth.ts       ← 月別集計
      nayose.ts                 ← 名寄せ（DBキャッシュ優先。新規のみAI）
      calcChange.ts             ← 増減算出
      formatRanking.ts          ← テーブル出力（⚠未確定マーク対応）
      aiSummarize.ts            ← AI要約
    sync/
      monthlySync.ts            ← 月次同期バッチ（3社並列2秒間隔）
      diffDetector.ts           ← 差分検出（新規取引先/口座/カード）
      reportGenerator.ts        ← レポート自動生成+保管
  patterns/
    p01_sales_ranking.ts        ← パーツ組み合わせ（5〜10行）
    p02_expense_ranking.ts
    p03_monthly_variance.ts
    p22_sales_change_ranking.ts
    ...

命名規則: p{番号}_{pattern_id}.ts
  番号は追加順で固定。欠番あり
  実行: npx tsx src/ai-commands/patterns/p01_sales_ranking.ts
```

---

## セキュリティ方針

個人名・認証ID・GCPプロジェクトIDはすべて環境変数のみ。デフォルト値にハードコードしない。
詳細は [34_mf_mcp_integration.md セクション12](34_mf_mcp_integration.md) を参照。

---

## 関連ドキュメント

| ドキュメント | 関連 |
|---|---|
| [34_mf_mcp_integration.md](34_mf_mcp_integration.md) | MF MCP連携基盤（全19ツール・レート制限） |
| [35_ai_command_design.md](35_ai_command_design.md) | AIコマンド機能設計（UI・モード設計） |
| [37_monthly_sync_design.md](37_monthly_sync_design.md) | MFデータ月次同期+共通エンジン設計 |

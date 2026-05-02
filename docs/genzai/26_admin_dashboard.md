# 26_管理者ダッシュボード 設計・実装ドキュメント

> **作成日**: 2026-04-26  
> **最終更新**: 2026-05-02  
> **目的**: 事務所全体の業務効率・AI利用状況・スタッフ別/顧問先別の処理実績を可視化する管理画面  
> **ステータス**: ✅ 実装済み（v2 — 実データ連携完了）  
> **ルーティング**: `/#/admin-dashboard` → [MockAdminDashboardPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockAdminDashboardPage.vue)  
> **Composable**: [useAdminDashboard.ts](file:///c:/dev/receipt-app/src/composables/useAdminDashboard.ts)

---

## 1. 集計ロジック

### 1-a. 仕訳数（CSV出力実績）

| 項目 | 内容 |
|------|------|
| **定義** | 会計ソフト（MF等）に実際に渡したCSV行数 |
| **記録タイミング** | エクスポートページでCSV出力ボタン押下時 |
| **記録先** | `data/export-history-{clientId}.json` の `csvLineCount` フィールド |
| **カウント方法** | `buildMfCsvContent()` 戻り値の行数（ヘッダー行除外）。旧形式は `count` フォールバック |
| **スタッフ紐付け** | 出力者の `staffId` を同時記録 |
| **集計API** | `GET /api/admin/csv-summary` |
| **集計関数** | `exportHistoryStore.summarizeCsvLines()` |
| **フロント発火** | `useAdminDashboard` → `fetchCsvSummary()` |

> [!IMPORTANT]
> 仕訳数 ＝ **CSV出力行数**。journalStore上の作成済み仕訳（未出力分）は含まない。

#### 期間バケット

| 期間 | 判定ロジック | 例（2026年5月時点） |
|------|-------------|-------------------|
| 今月 | `exportDate.startsWith(thisMonthStr)` | `2026/05` 前方一致 |
| 月平均（1年移動平均） | 過去12ヶ月キーを生成 → 各月の合計 ÷ 12（データなし月=0） | `2025/06`〜`2026/05` |
| 昨年同月 | `exportDate.startsWith(lastYearSameMonthStr)` | `2025/05` 前方一致 |
| 今年暦年合計 | `exportDate.startsWith(thisYearStr)` | `2026` 前方一致 |
| 昨年暦年合計 | `exportDate.startsWith(lastYearStr)` | `2025` 前方一致 |

**分解軸:** 全社 / byClient（顧問先別） / byStaff（スタッフ別）。各軸で今月・今年・昨年のバケットを持つ。

---

### 1-b. 処理時間（活動ログ）

| 項目 | 内容 |
|------|------|
| **定義** | スタッフがページ上で実際に操作していた時間（アイドル除外） |
| **記録タイミング** | ページ離脱時に `sendBeacon` で自動送信 |
| **記録先** | `data/activity-log.json` |
| **アイドル除外** | 5分間無操作でタイマー停止。操作再開で復帰 |
| **最小記録閾値** | 3秒未満のセッションは記録しない |
| **集計API** | `GET /api/activity-log/summary` |
| **フロント発火①** | `MockAdminDashboardPage.vue` → `fetchActivityTotal()` で全スタッフ合計ms取得 |
| **フロント発火②** | `useAdminDashboard` → `fetchActivitySummary()` でスタッフ別・顧問先別に反映 |
| **表示形式** | `h:mm:ss`（`formatActiveTime()` で変換） |

---

### 1-c. API費用（aiMetrics）

| 項目 | 内容 |
|------|------|
| **定義** | Vertex AI / Gemini API呼び出しのコスト（円） |
| **記録タイミング** | パイプライン内でAI処理完了時、各ドキュメントの `aiMetrics.cost_yen` に自動記録 |
| **記録先** | `data/documents.json` の各ドキュメント内 `aiMetrics` フィールド |
| **集計API** | `GET /api/admin/ai-metrics/summary` |
| **集計関数** | `admin.ts` 内の `aggregateMetrics()` + summaryハンドラ |
| **集計ロジック** | `getDocuments()` で全件取得 → `aiMetrics` 有りをフィルタ → `Σ cost_yen` |
| **フロント発火** | `useAdminDashboard` → `fetchAiCostSummary()` |

**分解軸:** 全社 / byClient（`doc.clientId`） / byStaff（`doc.createdBy`）

---

### 1-d. トークン消費

| 項目 | 内容 |
|------|------|
| **定義** | AI処理時のプロンプト/出力トークン数 |
| **記録タイミング** | API費用と同一（AI処理完了時） |
| **記録先** | `data/documents.json` の `aiMetrics.prompt_tokens` / `completion_tokens` |
| **集計API** | `GET /api/admin/ai-metrics/summary`（API費用と同じエンドポイント） |
| **集計ロジック** | `Σ prompt_tokens`, `Σ completion_tokens`, 合計 = prompt + completion |
| **フロント発火** | `fetchAiCostSummary()` 内で `apiCost.promptTokens` 等に格納 |
| **表示形式** | `formatTokenCount()`（0 / 123K / 1.5M） |

---

## 2. フロント呼出チェーン

ダッシュボード表示時に以下の順序で直列実行される：

```
ダッシュボード表示
  └→ fetchRealKpi()            ← スタッフ・顧問先一覧取得、staffAnalysis/clientAnalysis初期化
      └→ fetchActivitySummary()   ← 処理時間（スタッフ別・顧問先別）
          └→ fetchCsvSummary()      ← 仕訳数（全期間・顧問先別・スタッフ別）
              └→ fetchAiCostSummary()  ← API費用・トークン数
```

| 関数 | 反映先フィールド |
|------|-----------------|
| `fetchRealKpi()` | `kpiCostQuality`（顧問先数・スタッフ数）、`staffAnalysis`（動的生成）、`clientAnalysis`（動的生成） |
| `fetchActivitySummary()` | `staffAnalysis[].performance.processingTime`、`clientAnalysis[].performance.velocityThisMonth` |
| `fetchCsvSummary()` | `kpiProductivity.journals`（全期間）、`clientAnalysis[].journalsThisMonth/ThisYear/LastYear`、`staffAnalysis[].thisMonthJournals` |
| `fetchAiCostSummary()` | `kpiProductivity.apiCost`（費用・トークン数・呼出回数）、`clientAnalysis[].apiCostThisYear` |

別途、`MockAdminDashboardPage.vue` 内で `fetchActivityTotal()` が独立実行（全スタッフ合計処理時間を取得）。

---

## 3. 集約対象フィールド

### 3-a. AI分類メタデータ（T-AUD-4a残り）

| フィールド | 型 | 定義場所 | 用途 |
|------------|------|----------|------|
| `aiPreviewExtractReason` | `string \| null` | [types.ts L391](file:///c:/dev/receipt-app/src/repositories/types.ts#L391) | AI判定根拠テキスト。精度検証時に「なぜその証票種別と判定したか」を確認 |
| `aiLineItems` | `AiLineItem[]` | [types.ts L377](file:///c:/dev/receipt-app/src/repositories/types.ts#L377) | AI抽出行データ配列。行ごとの金額・税区分の妥当性検証 |
| `aiMetrics` | `AiMetrics` | [types.ts L397](file:///c:/dev/receipt-app/src/repositories/types.ts#L397) | トークン数・処理時間・コスト等のパフォーマンス指標 |

### 3-b. 科目確定AIメタデータ（T-AUD-4c）

| フィールド | 型 | 定義場所 | 用途 |
|------------|------|----------|------|
| `ai_completed_at` | `string \| null` | [journal_phase5_mock.type.ts L202](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L202) | 科目AI処理完了時刻。処理時間計測・ボトルネック特定 |
| `prediction_method` | `string \| null` | [journal_phase5_mock.type.ts L203](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L203) | 推定方法（`keyword`/`alias`/`ai`/`rule`）。方法別の精度比較 |
| `prediction_score` | `number \| null` | [journal_phase5_mock.type.ts L204](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L204) | 推定信頼度（0.0-1.0）。低スコア仕訳の傾向分析 |
| `model_version` | `string \| null` | [journal_phase5_mock.type.ts L205](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L205) | AIモデルバージョン。バージョン間の精度比較 |

### 3-c. 学習ルールメタデータ（T-AUD-4b将来分）

| フィールド | 型 | 定義場所 | 用途 |
|------------|------|----------|------|
| `rule_id` | `string \| null` | [journal_phase5_mock.type.ts L169](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L169) | 適用ルールID。ルールDB実装後に使用 |
| `rule_confidence` | `number \| null` | [journal_phase5_mock.type.ts L170](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L170) | ルール信頼度。ルール精度のモニタリング |
| `created_by` | `string \| null` | [journal_phase5_mock.type.ts L174](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L174) | 仕訳作成者。監査証跡（Supabase RLS連携） |

---

## 4. 画面構成

### ルーティング

```
/#/admin-dashboard             → 全社指標タブ（デフォルト）
/#/admin-dashboard?tab=staff   → スタッフ別指標
/#/admin-dashboard?tab=client  → 顧問先別指標
/#/admin-dashboard?tab=cost    → AIコスト
```

### 4タブ構成

| タブ | キー | 表示内容 | データソース |
|------|------|----------|-------------|
| **全社指標** | `company` | コスト&品質、処理効率、生産性テーブル | csv-summary + activity-log + ai-metrics |
| **スタッフ別指標** | `staff` | 担当者個別分析（仕訳数・処理時間・速度） | staff API + csv-summary(byStaff) + activity-log |
| **顧問先別指標** | `client` | 顧問先別コスト・効率分析 | clients API + csv-summary(byClient) + ai-metrics(byClient) |
| **AIコスト** | `cost` | API費用・トークン消費量・月次推移 | ai-metrics/summary |

### 全社指標タブ詳細

#### コスト & 品質（登録・仕訳状況）
| 項目 | データソース |
|------|-------------|
| 登録顧問先数 | `GET /api/clients` → 全件数 |
| 稼働中 | status='active' の件数 |
| 休眠・契約停止 | status='inactive'+'suspension' の件数 |
| 担当者数 | `GET /api/staff` → 全件数 |

#### 処理効率
| 項目 | 計算式 | データソース |
|------|--------|-------------|
| 月仕訳数／処理時間 | csv-summary今月 / activityTotalMs | csv-summary + activity-log |
| 1h処理仕訳数 | 仕訳数 ÷ 処理時間h | computed（フロント） |
| 100仕訳処理時間 | 処理時間秒 ÷ 仕訳数 × 100 | computed（フロント） |

#### 生産性（仕訳数 & API費用）
| 期間 | 仕訳数 | API費用 | 処理時間 |
|------|--------|---------|----------|
| 今月 | csv-summary.thisMonth | ai-metrics.totalCostYen | activity-log合計（h:mm:ss） |
| 月平均（1年移動平均） | csv-summary.monthlyAvg | — | — |
| 昨年同月 | csv-summary.lastYearSameMonth | — | — |
| 今年暦年合計 | csv-summary.thisYear | apiCost.thisYear | — |
| 昨年暦年合計 | csv-summary.lastYear | apiCost.lastYear | — |

---

## 5. APIエンドポイント一覧

| エンドポイント | メソッド | 用途 | 定義ファイル |
|---|---|---|---|
| `/api/admin/csv-summary` | GET | CSV出力行数集計（全期間・顧問先別・スタッフ別） | [admin.ts](file:///c:/dev/receipt-app/src/api/routes/admin.ts) |
| `/api/admin/ai-metrics/summary` | GET | AI費用・トークン全体集計 | [admin.ts](file:///c:/dev/receipt-app/src/api/routes/admin.ts) |
| `/api/admin/ai-metrics/by-client` | GET | 顧問先別AI統計 | [admin.ts](file:///c:/dev/receipt-app/src/api/routes/admin.ts) |
| `/api/admin/ai-metrics/by-staff` | GET | スタッフ別AI統計 | [admin.ts](file:///c:/dev/receipt-app/src/api/routes/admin.ts) |
| `/api/admin/ai-metrics/client/:id` | GET | 特定顧問先のAI統計詳細 | [admin.ts](file:///c:/dev/receipt-app/src/api/routes/admin.ts) |
| `/api/activity-log/summary` | GET | 活動ログ集計（処理時間） | [activityLogRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/activityLogRoutes.ts) |
| `/api/activity-log` | POST | 活動ログ1件記録 | [activityLogRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/activityLogRoutes.ts) |
| `/api/clients` | GET | 顧問先一覧（件数集計用） | [clientRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/clientRoutes.ts) |
| `/api/staff` | GET | スタッフ一覧（件数集計用） | [staffRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/staffRoutes.ts) |

> [!NOTE]
> 旧 `/api/admin/journal-summary` は廃止。仕訳数はCSV出力実績（csv-summary）を正とする。

---

## 6. 活動トラッキング機能

### 計測方式
- **アイドル検出**: 5分無操作→タイマー停止。操作再開で復帰
- **イベント検出**: mousemove, keydown, click, scroll, touchstart
- **ページ離脱送信**: `navigator.sendBeacon`（フォールバック: fetch+keepalive）
- **複数タブ対応**: 各タブが独立JSコンテキスト。操作中タブのみ記録（二重計上なし）
- **暫定スタッフID**: `staff-0000`（Supabase Auth移行時に差し替え）

### 計測対象ページ
| パス | ページ種別 |
|------|-----------|
| `/journal-list/:clientId` | 仕訳一覧 |
| `/drive-select/:clientId` | Drive選別 |
| `/output/:clientId` | 出力 |
| `/export/:clientId` | エクスポート |
| `/export-history/:clientId` | エクスポート履歴 |

### 計測除外ページ
`/learning`, `/client-settings`, `/admin-dashboard`, `/upload-v2` 等

### 実装ファイル
- [useActivityTracker.ts](file:///c:/dev/receipt-app/src/composables/useActivityTracker.ts)（フロント）
- [activityLogStore.ts](file:///c:/dev/receipt-app/src/api/services/activityLogStore.ts)（サーバー永続化）
- [router/index.ts](file:///c:/dev/receipt-app/src/router/index.ts) L537-545（afterEachガード）

---

## 7. 今後の課題

| 優先度 | 機能 | 前提条件 |
|--------|------|----------|
| 🟡 中 | API費用の月次推移グラフ | 月次集計の永続化（Supabase移行後） |
| 🟡 中 | スタッフID動的取得（現在は`staff-0000`固定） | Supabase Auth連携 |
| 🟡 中 | API費用の期間別集計（月平均・昨年同月） | documents.jsonに`createdAt`での期間フィルタ追加 |
| 🟢 低 | AI精度タブ | `prediction_score`パイプライン通過後 |
| 🟢 低 | ルールタブ | 学習ルールDB実装後 |

---

## 8. 不要判断の根拠記録

以下のフィールドは「管理者ダッシュボード向け」として一般画面への表示を見送った。

| フィールド | 見送り理由 | 判断日 | 監査タスク |
|------------|-----------|--------|-----------|
| `aiPreviewExtractReason` | 証票ごとの判定理由は詳細モーダル向け。一覧では過剰 | 2026-04-26 | T-AUD-4a |
| `aiLineItems` | 配列データ。テーブル表示が必要で一覧パネルに不適 | 2026-04-26 | T-AUD-4a |
| `aiMetrics` | コスト・トークンは管理者のみ関心 | 2026-04-26 | T-AUD-4a |
| `ai_completed_at` | デバッグ・計測用。スタッフは不要 | 2026-04-26 | T-AUD-4c |
| `prediction_method` | 精度検証用。スタッフは「結果」だけ見ればよい | 2026-04-26 | T-AUD-4c |
| `prediction_score` | 低確信時はWARNINGラベルでカバー済み。数値表示は過剰 | 2026-04-26 | T-AUD-4c |
| `model_version` | バージョン比較は管理者のみ関心 | 2026-04-26 | T-AUD-4c |
| `rule_id` | 学習ルールDB未実装。将来タスク | 2026-04-26 | T-AUD-4b |
| `rule_confidence` | 同上 | 2026-04-26 | T-AUD-4b |
| `created_by` | Supabase RLS連携。将来タスク | 2026-04-26 | T-AUD-4b |

# 26_管理者ダッシュボード 将来設計ドキュメント

> **作成日**: 2026-04-26  
> **目的**: 一般ユーザー画面には表示しないが、管理者・開発者が参照すべきメタデータの集約先として「管理者ダッシュボード」の設計方針をまとめる  
> **ステータス**: 📋 設計段階（未実装）

---

## 1. 背景

108フィールド監査（T-AUD-4）で「一般画面には不要だが、管理者向けに有用」と判断されたフィールドが複数存在する。これらを集約する画面として「管理者ダッシュボード」を将来実装する。

### パイプラインでの位置

```
① アップロード → ② 証票分類AI → ③ 選別 → ④ 科目確定AI → ⑤ 仕訳一覧 → ⑥ エクスポート
       │                │                        │                              │
       └────────────────┴────────────────────────┴──────────────────────────────┘
                              ↓ メトリクス収集
                     ┌─────────────────────┐
                     │  管理者ダッシュボード  │
                     └─────────────────────┘
```

---

## 2. 集約対象フィールド

### 2-a. AI分類メタデータ（T-AUD-4a残り）

| フィールド | 型 | 定義場所 | 用途 |
|------------|------|----------|------|
| `aiClassifyReason` | `string \| null` | [types.ts L391](file:///c:/dev/receipt-app/src/repositories/types.ts#L391) | AI判定根拠テキスト。精度検証時に「なぜその証票種別と判定したか」を確認 |
| `aiLineItems` | `AiLineItem[]` | [types.ts L377](file:///c:/dev/receipt-app/src/repositories/types.ts#L377) | AI抽出行データ配列。行ごとの金額・税区分の妥当性検証 |
| `aiMetrics` | `AiMetrics` | [types.ts L397](file:///c:/dev/receipt-app/src/repositories/types.ts#L397) | トークン数・処理時間・コスト等のパフォーマンス指標 |

### 2-b. 科目確定AIメタデータ（T-AUD-4c）

| フィールド | 型 | 定義場所 | 用途 |
|------------|------|----------|------|
| `ai_completed_at` | `string \| null` | [journal_phase5_mock.type.ts L202](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L202) | 科目AI処理完了時刻。処理時間計測・ボトルネック特定 |
| `prediction_method` | `string \| null` | [journal_phase5_mock.type.ts L203](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L203) | 推定方法（`keyword`/`alias`/`ai`/`rule`）。方法別の精度比較 |
| `prediction_score` | `number \| null` | [journal_phase5_mock.type.ts L204](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L204) | 推定信頼度（0.0-1.0）。低スコア仕訳の傾向分析 |
| `model_version` | `string \| null` | [journal_phase5_mock.type.ts L205](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L205) | AIモデルバージョン。バージョン間の精度比較 |

### 2-c. 学習ルールメタデータ（T-AUD-4b将来分）

| フィールド | 型 | 定義場所 | 用途 |
|------------|------|----------|------|
| `rule_id` | `string \| null` | [journal_phase5_mock.type.ts L169](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L169) | 適用ルールID。ルールDB実装後に使用 |
| `rule_confidence` | `number \| null` | [journal_phase5_mock.type.ts L170](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L170) | ルール信頼度。ルール精度のモニタリング |
| `created_by` | `string \| null` | [journal_phase5_mock.type.ts L174](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L174) | 仕訳作成者。監査証跡（Supabase RLS連携） |

---

## 3. ダッシュボード画面設計案

### ルーティング

```
/admin/dashboard/:clientId
```

### 画面構成

```
┌──────────────────────────────────────────────────────┐
│  管理者ダッシュボード                                   │
├──────────┬───────────────────────────────────────────┤
│          │  [AI精度] [コスト] [処理時間] [ルール]       │
│ 顧問先    │                                            │
│ 選択      │  ┌─────────────────────────────────┐       │
│          │  │ AI精度サマリ                      │       │
│ TST-00011│  │  証票分類: 92.3%                  │       │
│ ABC-00023│  │  科目確定: 87.1%                  │       │
│          │  │  method別: keyword 95% / ai 82%   │       │
│          │  └─────────────────────────────────┘       │
│          │  ┌─────────────────────────────────┐       │
│          │  │ コスト・トークン（月次推移）       │       │
│          │  │  📊 グラフ                        │       │
│          │  └─────────────────────────────────┘       │
│          │  ┌─────────────────────────────────┐       │
│          │  │ 低スコア仕訳一覧                  │       │
│          │  │  score < 0.5 の仕訳をリスト表示   │       │
│          │  └─────────────────────────────────┘       │
└──────────┴───────────────────────────────────────────┘
```

### 4タブ構成

| タブ | 表示内容 | 主要フィールド |
|------|----------|----------------|
| **AI精度** | 証票分類・科目確定の精度統計、method別内訳 | `prediction_method`, `prediction_score` |
| **コスト** | トークン消費量・API呼出回数・月次推移 | `aiMetrics.token_count`, `aiMetrics.prompt_tokens` |
| **処理時間** | 分類AI・科目AI・前処理の所要時間 | `ai_completed_at`, `aiMetrics` |
| **ルール** | 学習ルール適用状況、ルール別精度 | `rule_id`, `rule_confidence` |

---

## 4. 実装優先度

| 優先度 | 機能 | 前提条件 |
|--------|------|----------|
| 🟢 低 | ダッシュボード画面全体 | Supabase移行後（集計クエリがDB依存） |
| 🟢 低 | AI精度タブ | `prediction_score`がパイプライン通過後 |
| 🟢 低 | コストタブ | `aiMetrics`がDBに永続化後 |
| 🟢 低 | ルールタブ | 学習ルールDB実装後 |

> [!NOTE]
> 管理者ダッシュボードは**全てSupabase移行後のタスク**。現在のJSON/ローカルストレージ構成では集計クエリが困難なため、DB移行完了を前提とする。

---

## 5. 不要判断の根拠記録

以下のフィールドは「管理者ダッシュボード向け」として一般画面への表示を見送った。

| フィールド | 見送り理由 | 判断日 | 監査タスク |
|------------|-----------|--------|-----------|
| `aiClassifyReason` | 証票ごとの判定理由は詳細モーダル向け。一覧では過剰 | 2026-04-26 | T-AUD-4a |
| `aiLineItems` | 配列データ。テーブル表示が必要で一覧パネルに不適 | 2026-04-26 | T-AUD-4a |
| `aiMetrics` | コスト・トークンは管理者のみ関心 | 2026-04-26 | T-AUD-4a |
| `ai_completed_at` | デバッグ・計測用。スタッフは不要 | 2026-04-26 | T-AUD-4c |
| `prediction_method` | 精度検証用。スタッフは「結果」だけ見ればよい | 2026-04-26 | T-AUD-4c |
| `prediction_score` | 低確信時はWARNINGラベルでカバー済み。数値表示は過剰 | 2026-04-26 | T-AUD-4c |
| `model_version` | バージョン比較は管理者のみ関心 | 2026-04-26 | T-AUD-4c |
| `rule_id` | 学習ルールDB未実装。将来タスク | 2026-04-26 | T-AUD-4b |
| `rule_confidence` | 同上 | 2026-04-26 | T-AUD-4b |
| `created_by` | Supabase RLS連携。将来タスク | 2026-04-26 | T-AUD-4b |

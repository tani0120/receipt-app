# Phase A: Streamed互換・設計パラダイム定義 タスクリスト

## Phase A全体の目的

status / label / readonly の意味論をイベント視点で再定義し、Streamed互換の設計前提を確立する

---

## タスク

### セットアップ
- [x] Phase Aフォルダ作成
- [x] README.md作成
- [x] plan_phaseA_concept_design_260208.md 作成
- [x] task_phaseA_260208.md 作成（このファイル）
- [x] worklog_phaseA_260208.md 作成

### Task A.0: Phase A 概要ドキュメント作成（自然言語）

#### 基本セクション
- [x] Streamed互換の長文を読み込み・整理
- [x] Phase Aの目的を自然言語で明記
- [x] Streamed互換の定義（再現vs互換）を整理
- [x] AIの位置づけ（判断しない、補助する、説明する）
- [x] このシステムが「やらないこと」をリスト化
- [x] 「自動化率を競わない」という前提を明文化
- [x] 税理士・会計士にとっての価値を言語化
- [x] UIイメージ（体験）を文章で記述
- [x] 設計への翻訳メモ（status/label/readonlyの再定義基盤）

#### 詳細セクション（Streamed互換の核心）
- [x] 学習ロジック詳細
  - モデル学習ではなくルール最適化
  - 人修正ログ → 閾値更新
  - 顧問先ローカルルール生成条件
- [x] ルール劣化・破棄ロジック詳細
  - 劣化検知の3シグナル（修正率、confidence低下、時間経過）
  - 修正率は「人が触った回数」であり、「誤り回数」ではない（監査視点）
  - 降格フロー（AUTO_RULE → SUGGEST_ONLY → DISABLED）
  - 破棄条件と安全弁
- [x] GA + AI 正規化詳細
  - GAの役割（重み探索）
  - AIの役割（境界判定のみ）
  - AIは"例外処理装置"であり、主処理系ではない（AI暴走防止）
  - コスト配分（15円/枚制約）
- [x] 自動化率の安全弁詳細
  - 上限85%制限
  - 金額・重要度ブレーキ
  - 定期リセット

#### レビュー
- [x] ユーザーレビュー（外部レビュワー: AI）

### Task A.1: status/label/readonly 再定義（v1.0確定）
- [ ] v0.1レビュー（Task A.0の概要ベース）
- [ ] 不明点・矛盾点の洗い出し
- [ ] v1.0として確定
- [ ] Phase 4への影響を明記

### Task A.2: Streamed互換（イベント駆動・責務分離）の概念定義
- [ ] Streamed互換とは何か
- [ ] status / label / readonly がイベントストリーム上でどう振る舞うか
- [ ] 「判断保留（NEEDS_INFO）」がどのイベントか
- [ ] APPROVED が不可逆イベントかどうか
- [ ] イベント駆動設計の責務分離

### Task A.3: Phase 4再設計の指針
- [ ] Phase 4のどこを修正するか
- [ ] uiMode の再設計
- [ ] 明細7項目disabled制御の実装方針

---

## 完了条件

- [ ] status/label/readonly v1.0 確定
- [ ] Streamed互換の概念定義完了
- [ ] Phase 4再設計指針確定
- [ ] Phase 4 再開可能な状態

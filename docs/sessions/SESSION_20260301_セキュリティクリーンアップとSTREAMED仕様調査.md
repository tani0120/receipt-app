# SESSION_20260301_セキュリティクリーンアップとSTREAMED仕様調査

**日付**: 2026-03-01
**目的**: 個人情報・実物画像のgit除去 + STREAMED型仕訳処理方法の全量比較完成
**会話ID**: 02ca0a77-e333-41a9-9c34-dc046057278f

---

## 🧠 プロジェクト現状スナップショット

### フェーズ進捗
| Phase | 内容 | 状態 |
|---|---|---|
| Phase A | UX探索モード（モックUI） | ✅ 完了 |
| STREAMED型移行 フェーズ1 | 設計方針書・仕様調査 | ✅ 完了 |
| STREAMED型移行 フェーズ2 | スキーマ移行（MF準拠） | ⬜ 未着手 |
| v1仮説テスト | total_amount定義検証 | ⬜ 未着手 |

### UIモック進捗
- 対象ファイル: `JournalListLevel3Mock.vue`
- 完了列数: 23列中23列
- 次の作業: STREAMED型移行フェーズ2（スキーマ移行）

---

## ✅ このセッションで確定したこと

| 項目 | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| STREAMED仕訳処理比較表 | 12種の概要のみ | 12種×詳細項目（科目判定/摘要/屋号/手入力等） | STREAMED公式情報から詳細を追記 |
| 3層設計原則 | なし | MF絶対/STREAMED参照/独自判断 | フェーズ2以降の設計方針策定 |
| 個人情報 | git管理下に存在 | 全て除去・仮名化 | セキュリティ対策 |
| 実物画像 | git管理下に6件 | 全件削除 | セキュリティ対策 |
| PROJECT_ID | コード内にハードコード | 削除 | セキュリティ対策 |

---

## 📂 ファイル操作ログ

### 新規作成したファイル
| ファイル | 目的 |
|---|---|
| `docs/genzai/09_streamed/streamed_design_policy.md` | STREAMED型エンジン設計方針書 |
| `docs/genzai/09_streamed/streamed_mf_csv_spec.md` | MF CSVインポート仕様書（319行） |
| `docs/genzai/09_streamed/streamed_naming_rule.md` | 09_streamedフォルダ命名規則 |
| `docs/genzai/07_test_plan/classify_postprocess.ts` | マスターファイル |
| `docs/genzai/07_test_plan/classify_schema.ts` | マスターファイル |
| `docs/genzai/07_test_plan/classify_test.ts` | マスターファイル |
| `docs/genzai/07_test_plan/hypothesis_log.md` | 仮説ログ |
| `docs/genzai/07_test_plan/issues_master.md` | 課題マスター |
| `docs/genzai/07_test_plan/v0_baseline/` 配下4件 | v0スナップショット |
| `docs/genzai/07_test_plan/v1_total_amount/` 配下2件 | v1仮説テストデータ |

### 変更したファイル
| ファイル | 変更内容 |
|---|---|
| `src/scripts/ground_truth.ts` | 個人名・企業名・T番号・住所を除去、正解データ配列を削除 |
| `src/scripts/classify_test.ts` | 個人名除去、PROJECT_ID/LOCATION/MODEL_ID定数を削除 |
| `docs/genzai/04_mock/run_a_review.md` | 全テスト結果（#1-#18）を削除（個人情報含む） |
| `docs/genzai/04_mock/task_phase_a.md` | タスク進捗更新 |
| `docs/genzai/07_test_plan/v0_baseline/ground_truth_v0.ts` | 個人名除去、正解データ削除 |
| `docs/genzai/07_test_plan/v0_baseline/classify_test_v0.ts` | 個人名除去 |
| `docs/genzai/07_test_plan/v1_total_amount/ground_truth_v1_*.ts` | 企業名・T番号・住所を仮名化 |
| `docs/genzai/07_test_plan/v1_total_amount/hypothesis_v1.md` | 和田税理士事務所→〇〇会計事務所 |

### 削除したファイル
| ファイル | 削除理由 | 意図的/事故 |
|---|---|---|
| `public/images/cafe-veloce-receipt.jpg` | 実物レシート画像 | 意図的 |
| `public/media__1771123803044.jpg` | 内容不明の画像 | 意図的 |
| `public/media__1771127858508.jpg` | 同上 | 意図的 |
| `public/media__1771127941690.jpg` | 同上 | 意図的 |
| `public/debug_images/audit_mirror_b_*.png` | デバッグ画像 | 意図的 |
| `public/golden_master.png` | UIスクリーンショット | 意図的 |
| `docs/genzai/07_test_plan/test_automation.md` | 再編成のため | 意図的 |

---

## ⚠️ 未解決・保留中・未確認

| 内容 | 保留理由 | 再開条件 |
|---|---|---|
| フェーズ2判断事項: 科目判定方式 | AI判定 vs 業種ルール | implementation_planレビュー後 |
| フェーズ2判断事項: 摘要生成方式 | 直接抽出 vs テンプレート合成 | 同上 |
| フェーズ2判断事項: 屋号処理 | 含める vs 除外 | 同上 |
| フェーズ2判断事項: 通帳・クレカ科目判定 | AI判定 vs 自動判定なし | 同上 |
| MF税区分の正式名称リスト | 実機確認が必要 | MF管理画面アクセス時 |

---

## ❌ やらないと決めたこと

| 内容 | 理由 |
|---|---|
| git履歴からの完全除去（BFG等） | 個人リポジトリのため現時点では不要 |
| freeze/配下の画像削除 | UIスクリーンショットのみで個人情報なし |

---

## 🔄 次のセッションへの引き継ぎ

- **次にやること**:
  - フェーズ2の4つの判断事項を決定（implementation_plan.md参照）
  - MF管理画面から税区分の正式名称リストを取得
  - classify_schema.tsのMF準拠移行を開始
- **参照すべきファイル（優先順）**:
  1. `docs/genzai/09_streamed/streamed_mf_csv_spec.md`（MF CSV仕様 + STREAMED比較表）
  2. `docs/genzai/09_streamed/streamed_design_policy.md`（エンジン責務定義）
  3. `brain/implementation_plan.md`（フェーズ2以降の設計方針 + 判断事項4件）
- **注意事項**:
  - ground_truth.tsの正解データ配列が空になっている（テスト実行不可）
  - テスト実行にはv1のground_truth（07_test_plan/v1_total_amount/配下）を使用すること

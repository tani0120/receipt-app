# SESSION_20260304_nullUI改善とナビバー整備

**日付**: 2026-03-04
**目的**: null表示ロジック実装 + グローバルナビバー新設 + mockプレフィックス除去
**会話ID**: b02e3257-a84f-4a8b-a24f-4cc91f2d6ff0

---

## 🧠 プロジェクト現状スナップショット
（毎セッション更新・常に最新状態を保つ）

### 型安全状況
| 層 | anyルール | 汚染件数 | 状態 |
|---|---|---|---|
| ドメイン型 (`journal.ts`) | 禁止 | 0 | ✅ |
| モック型 (`journal_phase5_mock.type.ts`) | 禁止 | 0 | ✅ |

### 確定済み設計（常に最新を保つ）
| 項目 | 現在の定義 | 確定日 |
|---|---|---|
| 警告ラベル3種 | `DATE_UNKNOWN` / `ACCOUNT_UNKNOWN` / `AMOUNT_UNCLEAR` | 2026-03-04 |
| null表示ルール（日付・科目） | 「未確定」と表記 | 2026-03-04 |
| null表示ルール（金額） | 空白表示 | 2026-03-04 |
| on_document分岐メッセージ | 証憑に記載なし / 読み取り失敗 | 2026-03-04 |

### フェーズ進捗
| Phase | 内容 | 状態 |
|---|---|---|
| Phase A | UX探索モード（モックUI） | ✅ 完了 |
| 優先度1: 型定義の整合 | journal.ts / mock型 | ✅ 完了 |
| 優先度2: 警告ラベル整備 | on_document相関 | ✅ 完了 |
| 優先度3: マスター作成 | 勘定科目・税区分マスタ | ⬜ 未着手 |
| 優先度4: 一覧UI変更 | D1-D6完了、D7-D10未着手 | 🔶 一部完了 |

### UIモック進捗
- 対象ファイル: `JournalListLevel3Mock.vue`
- 完了列数: 23列中23列
- 次の作業: マスタUI作成（K1-K4）→ プルダウン化（D7-D8）

---

## ✅ このセッションで確定したこと

| 項目 | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 警告ラベル | `MISSING_FIELD` / `UNREADABLE_FAILED` | `DATE_UNKNOWN` / `ACCOUNT_UNKNOWN` / `AMOUNT_UNCLEAR` | フィールド別に分離 |
| null日付・科目の表示 | 空白 | 「未確定」 | ユーザー混乱防止 |
| null金額の表示 | 空白 | 空白（維持） | 金額nullは「存在しない」の意 |
| ホバーメッセージ | 固定文字列 | on_document分岐 | 「記載なし」vs「読み取り失敗」の区別 |
| ソートnull処理 | 未定義 | `compareWithNull`で末尾/先頭統一 | 一貫性 |
| mockプレフィックス | `/mock/journal-list` 等 | `/journal-list` 等 | 技術負債の削減 |
| Vue Router ガード | `next()` コールバック方式 | `return` ベース（Vue Router 4） | `from` 未使用警告の根本解決 |
| グローバルナビバー | なし | 上部バー（ロゴ + 管理メニュー5項目） | 全ページ共通UI |
| プラン優先度組み替え | マスター作成が優先度10 | 優先度3に前倒し | プルダウン・未確定マッピングの前提 |
| STREAMED調査結果 | 基本表示のみ | プルダウン（先頭に未確定）・デフォルト税区分を追記 | 10_nullable_on_document_planに反映 |
| 顧問先管理リンク | @clickなし | `router.push('/clients')` | 既存ScreenAへ遷移 |

### 確定した型定義（コピペ用・最新のみ残す）
```typescript
// 警告ラベル（journal.ts）
type JournalLabel =
  | 'DATE_UNKNOWN'        // 日付不明
  | 'ACCOUNT_UNKNOWN'     // 勘定科目不明
  | 'AMOUNT_UNCLEAR'      // 金額不明瞭
  | 'UNREADABLE_ESTIMATED' // 判読困難（AI推測値）
  | 'TAX_RATE_MISMATCH'   // 税率不一致
  | 'BALANCE_MISMATCH';   // 貸借不一致
```

---

## 📂 ファイル操作ログ

### 新規作成したファイル
| ファイル | 目的 | commitハッシュ |
|---|---|---|
| `public/sugu-suru-logo.png` | ナビバーロゴ画像 | 未commit |

### 変更したファイル
| ファイル | 変更内容 | commitハッシュ |
|---|---|---|
| `src/domain/types/journal.ts` | 警告ラベル3種追加、on_documentコメント更新 | 未commit |
| `src/mocks/types/journal_phase5_mock.type.ts` | date_on_documentコメント更新 | 未commit |
| `src/mocks/components/JournalListLevel3Mock.vue` | null表示（未確定/空白）、ホバー分岐、compareWithNullソート | 未commit |
| `src/mocks/data/journal_test_fixture_30cases.ts` | j025/j028/j030にnull値テストケース追加 | 未commit |
| `src/mocks/components/MockNavBar.vue` | 上部バー新設（ロゴ+管理メニュー）、全ボタンリンク追加 | 未commit |
| `src/router/index.ts` | mockプレフィックス除去、`/master`ルート追加、Vue Router 4化 | 未commit |
| `docs/genzai/10_nullable_on_document_plan.md` | マスター作成を優先度3に前倒し、完了実績反映 | 未commit |

### 削除したファイル
| ファイル | 削除理由 | 意図的/事故 | commitハッシュ |
|---|---|---|---|
| なし | — | — | — |

---

## 🔴 技術的負債（戦略的放置中）

| 内容 | 件数 | 対処時期 | 放置の理由 |
|---|---|---|---|
| `/settings` が `MockSettingsPage.vue` を参照 | 1 | Supabase移行時 | バックエンドがまだない |
| `/master` も同じ `MockSettingsPage.vue` を参照 | 1 | マスタUI実装時 | 専用コンポーネント未作成 |

---

## ⚡ Antigravityへの注意事項

### 削除インシデント履歴
- 今セッションではなし

### 既知の悪いパターン
- `_from` リネームなど表面的な修正で負債を隠す行為（ユーザーに指摘された）

### 今セッションで発生した問題
- Vueテンプレートで `alert()` → `window.alert()` → 両方スコープ外でlintエラー。3回修正
- ロゴ画像生成後、背景透過・トリミングの限界（generate_imageツールでは余白除去不可）

### 対策ルール（毎回徹底）
- 負債は隠さず根本解決する（`_from` ではなくVue Router 4化）
- Vueテンプレートからグローバル関数を呼ぶ場合はscriptにメソッドを定義する

### `showNotImplemented` の設計判断
- `globalThis.alert` はES2020標準のグローバルオブジェクト参照。Vue script setup内で合法。lintエラーなし
- 未実装ページ（スタッフ管理・想定費用）のボタンに一時的に使用
- ページ実装後は `showNotImplemented('スタッフ管理')` → `router.push('/staff')` に1行置換するだけ
- **構造的な負債なし**

---

## ⚠️ 未解決・保留中・未確認

| 内容 | 保留理由 | 再開条件 |
|---|---|---|
| スタッフ管理ページ | 画面設計未決定 | 設計書作成後 |
| 想定費用ページ | 画面設計未決定 | 設計書作成後 |
| nullセルの赤枠表示（D10） | マスタUIが先 | K1-K4完了後 |
| プルダウン化（D7-D8） | マスタUIが先 | K1-K4完了後 |

---

## ❌ やらないと決めたこと

| 内容 | 理由 |
|---|---|
| OCR前後処理（M1-M2） | 実データ投入が近づいてから着手 |
| `from` を `_from` にリネーム | 負債隠蔽。Vue Router 4化で根本解決済み |

---

## 🔄 次のセッションへの引き継ぎ

- **次にやること**:
  - マスタUI作成（K1-K4）: 勘定科目マスター、税区分デフォルトルール、マスタ管理UI
  - `/master` ページの専用コンポーネント作成（`MockSettingsPage.vue` から独立）
- **UIモック進捗**: 23列中23列完了、次はマスタUI作成（K1-K4）
- **参照すべきファイル（優先順）**:
  1. `docs/genzai/10_nullable_on_document_plan.md`（優先度3: マスター作成）
  2. `docs/genzai/09_streamed/streamed_account_comparison.md`（STREAMED勘定科目一覧）
  3. `src/mocks/components/MockNavBar.vue`（ナビバー構造）
- **注意事項**:
  - 全ファイル未commitなのでcommit必須
  - `/settings` と `/master` が同じコンポーネントを指している（マスタUI作成時に分離）

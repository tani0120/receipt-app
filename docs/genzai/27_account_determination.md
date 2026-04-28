# 27_科目確定パイプライン — 設計決定まとめ

> **作成日**: 2026-04-27（議論結果）
> **正式化**: 2026-04-28（コード照合済み。docs/に移動）
> **目的**: 全概念の役割整理・学習ルール設計確定・実装優先順位
> **パイプライン位置**: ④科目確定AI（Step 4）

---

## 1. 確定版フロー

```
[前処理] 正規化 → 入出金方向確定

[第一層: 確定情報]
  T番号完全一致 → 即確定

[第二層: 取引先特定]
  正規化（normalizeVendorName） + 照合キー完全一致 + 別名（aliases）
  → 取引先確定

[第三層: 科目確定]
  ① 学習ルール照合（照合キー + 金額条件 → 一意な科目 + 複合仕訳）
  ② 全社マスタの科目情報 → 一意なら自動確定
  ③ 一意でない → 過去仕訳を表示 → 人間が選択

[第四層: 初見取引先]
  業種ベクトル（68種） × 入出金方向 → 業種辞書 → 科目候補提示

[第五層: 新規]
  Gemini推定 → 人間承認 → 照合キー登録

[第六層]
  不明 → 人間手入力
```

---

## 2. 各概念の役割（確定）

| 概念 | 目的 | 誰のため | 判断 |
|---|---|---|---|
| **照合キー** | 取引先特定 | システム | ✅ 維持（224件完成済み） |
| **学習ルール** | 人間が「照合キー + 金額 → 科目 + 複合仕訳」を明示的に決定 | 人間 | ✅ **別テーブルで維持** |
| **業種ベクトル** | 初見取引先の科目候補提示（コールドスタート対策） | システム | ✅ 維持（68種+業種辞書完成済み） |
| **金額条件** | 同一取引先で金額により科目を分ける | 人間/システム | ✅ MF方式（上限・下限）に変更 |
| **複合仕訳テンプレート** | 単科目ではなく仕訳セット（N行）で覚える | 人間 | ✅ **必要**（学習ルールに紐付け） |
| **過去仕訳表示** | 一意でない場合に人間が判断する材料 | 人間 | ✅ **最重要**（70%一意、30%選択肢） |
| 特徴語 | 取引先特定の補助 | システム | ⏸ 後回し（概念のみ。コード0行） |
| キーワードAND | 同一取引先で複数科目を絞り込む | システム | ⏸ 後回し（概念のみ。コード0行） |
| TF-IDF | キーワードの品質管理 | システム | ⏸ 後回し（キーワード蓄積後） |
| 選択履歴テーブル | 過去の科目選択を蓄積 | システム | ⏸ 後回し（過去仕訳表示で代替） |

---

## 3. 学習ルールの設計（確定 — コード照合済み 2026-04-28）

### 3-1. 顧問先マスタとの関係

| | 全社マスタ（Vendor型） | 学習ルール |
|---|---|---|
| 管理者 | システム | **人間** |
| 可視性 | 内部 | **画面で確認・編集** |
| 科目数 | 1行分のみ | **N行（複合仕訳対応）** |
| 金額条件 | 閾値1つ | **上限・下限（MF方式）** |
| テーブル | 同一テーブル | **別テーブル** |

> **統合しない理由**: 全社マスタは1行分の科目しか持てない。学習ルールは複合仕訳テンプレート（N行）を持つ必要がある。構造が異なる。

### 3-2. 型設計（現行コード: [learning_rule.type.ts](file:///c:/dev/receipt-app/src/mocks/types/learning_rule.type.ts)）

**LearningRule型（ルール本体）:**

```typescript
interface LearningRule {
  id: string                 // PK。journal.rule_id の FK元
  clientId: string           // 顧問先ID（LDI-00008形式）
  keyword: string            // 摘要マッチキーワード
  matchType: 'exact' | 'contains'  // 照合方式
  direction: 'expense' | 'income' | null  // 入出金条件
  sourceCategory: 'receipt' | 'bank' | 'credit' | 'all' | null  // 証票種別
  amountMin: number | null   // 金額下限（MF方式）
  amountMax: number | null   // 金額上限（MF方式）
  entries: LearningRuleEntryLine[]  // 仕訳テンプレート行
  isActive: boolean          // 有効/無効
  hitCount: number           // 累計適用回数
  generatedBy: 'ai' | 'human'  // 生成元
  createdAt: string          // ISO 8601
  updatedAt: string          // ISO 8601
}
```

**JournalEntryLine型（仕訳行 — [journal.ts](file:///c:/dev/receipt-app/src/domain/types/journal.ts) L169）:**

```typescript
interface JournalEntryLine {
  id: string | null           // 行PK（jre-{UUID}）。null=レガシー
  account: string | null      // 勘定科目
  account_on_document: boolean // 証憑上に科目記載があるか
  sub_account: string | null  // 補助科目
  department: string | null   // 部門（MF CSV「借方部門」列）
  amount: Yen | null          // 金額
  amount_on_document: boolean // 証憑上に金額記載があるか
  tax_category_id: string | null // 税区分
}
```

**LearningRuleEntryLine → JournalEntryLine 変換マッピング:**

| LearningRuleEntryLine | → | JournalEntryLine | 備考 |
|---|---|---|---|
| `id` | → | *(使用しない)* | テンプレート行ID。仕訳行IDは新規生成（`jre-{UUID}`） |
| `ruleId` | → | *(使用しない)* | 親journal.`rule_id` に記録 |
| `side` | → | `debit_entries[]` or `credit_entries[]` | 配列の振り分けに使用 |
| `account` | → | `account` | そのまま転記 |
| `subAccount` | → | `sub_account` | そのまま転記 |
| `taxCategory` | → | `tax_category_id` | そのまま転記 |
| `department` | → | `department` | そのまま転記 |
| `amountType` | → | `amount` | auto/total/fixed から金額を計算して格納 |
| `fixedAmount` | → | `amount` | fixed の場合にこの値を使用 |
| `displayName` | → | 親journal.`description` | 摘要文字列の構成要素として展開 |
| `description` | → | 親journal.`description` | 同上 |
| `targetMonth` | → | 親journal.`description` | 同上 |
| `displayOrder` | → | 配列順序 | `debit_entries[]`/`credit_entries[]` の順序 |
| *(なし)* | → | `account_on_document` | ルール適用時は `false`（証憑由来ではない） |
| *(なし)* | → | `amount_on_document` | ルール適用時は `true`（金額は証憑から取得） |

**LearningRuleEntryLine型（テンプレート1行）:**

```typescript
interface LearningRuleEntryLine {
  id: string                 // 行PK（Supabase learning_rule_entries テーブル）
  ruleId: string             // 親ルールFK
  side: 'debit' | 'credit'  // 借方/貸方
  account: string            // 勘定科目（ACCOUNT_MASTER ID）
  subAccount: string | null  // 補助科目
  taxCategory: string | null // 税区分
  department: string | null  // 部門
  amountType: 'auto' | 'total' | 'fixed'  // 金額タイプ
  fixedAmount: number | null // 固定金額（fixedの場合のみ）
  displayName: string | null // 摘要表示名（上書き方式）
  description: string | null // 取引内容（摘要の一部）
  targetMonth: string | null // 対象月（摘要の一部）
  displayOrder: number       // 表示順
}
```

**金額タイプの3択（ストリームド同等）:**

| amountType | 意味 | 使い方 |
|---|---|---|
| `auto` | 自動計算 | 単一仕訳=証憑金額、複合仕訳=他行との差額 |
| `total` | 取引金額 | 証憑記載の金額をそのまま使用 |
| `fixed` | 固定金額 | fixedAmountに指定した金額を常に使用 |

**金額条件（MF方式: 上限・下限）:**

| 条件 | amountMin | amountMax | 意味 |
|---|---|---|---|
| 条件なし | `null` | `null` | 全金額対象 |
| 同額一致 | `220000` | `220000` | 220,000円ちょうど（ストリームド方式） |
| 以上のみ | `10001` | `null` | 10,001円以上 |
| 以下のみ | `null` | `10000` | 10,000円以下 |
| 範囲 | `5000` | `10000` | 5,000〜10,000円 |

### 3-3. 照合方式

**ストリームド・MFともに「完全一致」と「部分一致」を人間が選べる。**

| | ストリームド | MF | 本システム |
|---|---|---|---|
| 完全一致（等しい） | ✅ | ✅ | ✅ |
| 部分一致（含む） | ✅ | ✅ | ✅ |
| デフォルト | 完全一致 | 部分一致 | **証票種別で自動切替** |
| 優先順位 | 完全一致優先 | 完全一致優先 | 完全一致優先 |

**証票種別による照合の違い:**

| 証票種別 | 摘要の性質 | デフォルト照合 | 理由 |
|---|---|---|---|
| 領収書・レシート・請求書 | OCR読取の店舗名 | **完全一致** | 店舗名が特定できる |
| 銀行明細 | 銀行付与の略記テキスト | **部分一致** | 「ﾌﾘｺﾐ ﾀﾅｶﾀﾛｳ」「振込手数料」等 |
| カード明細 | カード会社付与の略記 | **部分一致** | 「AMAZON.CO.JP」「ｽﾀﾊﾞ ﾐﾅﾐ」等 |

取引先特定（第二層）は引き続き:
- `normalizeVendorName()` → 法人格除去、全角半角統一、記号除去
- `match_key` 完全一致 → 正規化後の文字列で完全一致
- `aliases[]` → 「スタバ」「STARBUCKS」等の別名を登録

### 3-4. モックデータ（コード照合済み 2026-04-28）

[learning_rules_TST00011.ts](file:///c:/dev/receipt-app/src/mocks/data/learning_rules_TST00011.ts) — 15件で全パターン網羅:

| ID | キーワード | 照合 | 証票 | 金額 | 仕訳行数 | 特記 |
|---|---|---|---|---|---|---|
| LR-001 | タクシー | exact | receipt | — | 2行 | 単科目 |
| LR-003 | スターバックス | exact | receipt | ≤10,000 | 2行 | 金額分岐（会議費） |
| LR-003b | スターバックス | exact | receipt | ≥10,001 | 2行 | 金額分岐（接待交際費） |
| LR-011 | ゴルフ | contains | receipt | — | 3行 | 複合（接待交際費+ゴルフ場利用税） |
| LR-004 | NTT | contains | bank | — | 2行 | displayName=NTT東日本 |
| LR-005 | 家賃 | contains | bank | — | 2行 | targetMonth=当月分 |
| LR-007 | 振込手数料 | contains | bank | — | 2行 | hitCount=198（最多） |
| LR-008 | タナカタロウ | exact | bank | 220,000同額 | 3行 | 複合（外注費+仮払消費税） |
| LR-009 | 売上入金 | contains | bank | — | 2行 | income（入金） |
| LR-012 | 給与振込 | exact | bank | — | 5行 | 複合（給料+法定福利+源泉+社保） |
| LR-002 | Amazon | contains | credit | ≤10,000 | 2行 | 金額分岐（消耗品費） |
| LR-002b | Amazon | contains | credit | ≥10,001 | 2行 | 金額分岐（備品） |
| LR-006 | ENEOS | exact | credit | — | 2行 | sub=ガソリン代 |
| LR-010 | Adobe | exact | credit | — | 2行 | sub=クラウドサービス |
| LR-013 | AWS | contains | credit | — | 3行 | 複合（通信費+仮払消費税） |

### 3-5. ストリームド・MFとの比較

| 機能 | ストリームド | MF | 本システム |
|---|---|---|---|
| 照合キー | 支払先（摘要）一致 | 摘要の部分一致 | 正規化+完全一致+別名（取引先特定）/ 完全一致 or 部分一致選択（学習ルール） |
| 金額条件 | **同額一致のみ** | **以上・以下・範囲** | **以上・以下・範囲・同額（MF方式）** |
| 複合仕訳学習 | ✅（固定金額+差額自動計算） | ✅（複合自動仕訳ルール） | ✅（auto/total/fixedの3タイプ） |
| 科目候補提示 | なし | なし | ✅ 業種ベクトル（初見時） |
| 過去仕訳表示 | ✅ | ✅ | ✅（→ [25_past_journal.md](file:///c:/dev/receipt-app/docs/genzai/25_past_journal.md)） |
| 照合方式選択 | 完全一致 / 部分一致 | 完全一致 / 部分一致 | 完全一致 / 部分一致（証票種別で自動切替） |
| 摘要構成 | なし | なし | displayName / description / targetMonth（摘要表示名上書き方式） |
| 部門 | ✅ 設定部門と同じ | ✅ 部門指定 | ✅ department フィールド |

---

## 4. 実装優先順位

### 今やること

| 優先度 | 内容 | 根拠 | 状態 |
|---|---|---|---|
| 1 | 仕訳型に `vendor_id: string \| null` 追加 | 過去仕訳を取引先で絞り込むために必須 | ❌ 未着手 |
| 2 | 照合ロジック接続（照合キー → 全社マスタ → 科目適用） | 全社マスタ224件 + 照合関数は完成済み。繋ぐだけ | ❌ 未着手 |
| 3 | 仕訳一覧に「同一取引先の過去仕訳」表示 | 70%一意・30%選択肢。過去仕訳さえ見えれば人間が何とかする | ⚠️ UI実装済み（モック）→ [25_past_journal.md](file:///c:/dev/receipt-app/docs/genzai/25_past_journal.md) |
| 4 | 学習ルール型 — **実装完了** | `amountMin`+`amountMax`+`entries[]`+`matchType` | ✅ [learning_rule.type.ts](file:///c:/dev/receipt-app/src/mocks/types/learning_rule.type.ts) |
| 5 | 学習画面（`/learning/TST-00011`）を新型に対応 | 複合仕訳・照合方式選択・摘要構成 | ⚠️ モーダルUI実装済み → [MockLearningPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockLearningPage.vue) |

### 今やらないこと

| 概念 | 理由 |
|---|---|
| 特徴語 | 概念のみ。コード0行。取引先特定の精度が不足と分かってから |
| キーワードAND検索 | 概念のみ。コード0行。照合キー+金額で足りなければ追加 |
| TF-IDF | キーワードが大量蓄積されてから |
| 選択履歴テーブル | 過去仕訳表示で代替可能 |
| `keywords: string[]` 変更 | 後回し。単一キーワードで運用開始 |

---

## 5. 将来の設計方針（kintone方式議論 2026-04-28 で確定）

> 以下は実装フェーズ5（学習画面UI更新）以降で適用する設計原則。現行の型定義・モックデータには影響しない。

### 5-1. 学習画面は直接編集不可（リードオンリー）

学習ルール画面のプレビューで仕訳データを直接編集させない。条件を修正させることで「なぜこの科目になったか」のトレーサビリティを保証する。

### 5-2. 手動の個別除外を禁止

プレビューの「チェックボックスで除外」はNG。除外したいケースが出たら、ルール条件自体を金額分岐や証票種別で再編集させる。例外はルールの再定義で解決する。

### 5-3. 楽観的ロック（後出し負け）

Supabase移行後、`updated_at` カラムによる楽観的ロックを採用。システムの自動更新を優先し、人間側の古い画面からの保存はエラーとして弾く。

### 5-4. 保存前プレビュー（将来UI）

ルール保存前に「適用結果プレビュー」を表示する。確定済みデータと未確定データを分け、変更箇所を赤背景で通知する「Diff表示」を導入する。ただし、**ルール適用エンジン（優先度2）が動いて初めて意味がある**ため、エンジン実装後に着手。

---

## 6. 現有資産の扱い

| ファイル | 扱い |
|---|---|
| [learning_rule.type.ts](file:///c:/dev/receipt-app/src/mocks/types/learning_rule.type.ts) | **活用**（金額条件MF方式+複合仕訳+摘要構成 実装済み） |
| [learning_rules_TST00011.ts](file:///c:/dev/receipt-app/src/mocks/data/learning_rules_TST00011.ts) | **活用**（15件、全パターン網羅済み） |
| [MockLearningPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockLearningPage.vue) | **活用**（ストリームド同等の管理画面） |
| vendors_global.ts 224件 | **活用**（照合ロジックの核） |
| 業種ベクトル68種+業種辞書 | **活用**（初見取引先の科目候補） |
| normalizeVendorName() | **活用**（照合キー生成） |
| 仕訳一覧の科目選択UI | **活用**（人間の選択ポイント） |
| [MockHistoryImportPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockHistoryImportPage.vue) | **活用**（過去仕訳取込画面） |

---

## 7. 未解決の設計課題

| 課題 | 内容 | 関連 |
|---|---|---|
| `keywords: string[]` | 単一キーワード → 複数キーワードAND条件への変更 | §2 キーワードAND |
| 選択履歴の蓄積方法 | 過去仕訳表示で不足する場合に検討 | §2 選択履歴テーブル |
| 照合キー自動登録 | 仕訳確定時に新規照合キーを顧問先マスタに自動追加するか | 優先度2完了後 |
| 仕訳ステータス管理 | `status: 'draft' \| 'confirmed'` の導入要否 | pipeline_result.type.tsで不採用と判断済み。再検討の余地あり |

---

## 8. 核心思想

> **70%は照合キー+金額で一意に自動確定。30%は過去仕訳を見せて人間が選択。**
> **同じ取引先なら前と同じ科目にする（90%以上）。違う科目にする場合は人間が判断すべき状況。**
> **学習 = 人間が「この照合キー + この金額条件 → この科目（複合仕訳含む）」を強制的に決定する行為。**

---

## 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-04-27 | 議論結果として初版作成（アーティファクト） |
| 2026-04-28 | docs/に正式化。現行コード（learning_rule.type.ts）と照合し差分修正: `balance`→`auto`、`id`/`ruleId`/`department`/`displayName`/`description`/`targetMonth` 追加反映。§5将来設計方針（kintone議論結果）追記。§3-4モックデータ一覧表追加 |
| 2026-04-28 | JournalEntryLine型にid（PK）+department（部門）を追加（[journal.ts](file:///c:/dev/receipt-app/src/domain/types/journal.ts)）。LearningRuleEntryLine→JournalEntryLine変換マッピング表を§3-2に追加。テストデータ30件+変換関数を修正。[exportMfCsv.ts](file:///c:/dev/receipt-app/src/mocks/utils/exportMfCsv.ts)の借方部門/貸方部門列をdepartmentフィールドから出力するよう修正。vue-tsc 0エラー確認済み |

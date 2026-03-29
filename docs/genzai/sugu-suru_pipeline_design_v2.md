# 前処理〜仕訳候補出力 設計最終版 v2.0

---

## 1. 基本思想

- 「取引先特定 → ベクトル付与 → 勘定科目決定」
- 入出金ベクトル × 取引先ベクトル × 業種ベクトルの3軸で科目候補を絞り込む
- OCR・正規化・マスタ・特徴語を組み合わせる
- AIは補助。決定はルール。
- 会計領域の精度上限は93%。95%は現実的でない。
- 人間確認は全体の5〜15%に絞ることが目標
- 税額計算の責務はMoneyForward。sugu-suruの責務は「渡されたデータを過去仕訳と照合して正確に分類すること」
- 過去仕訳の正確性の責務は顧問先・担当税理士。過去仕訳が誤っていた場合はスコープ外（利用規約に明文化）

---

## 2. 入力ソース

| ソース | 形式 | source_type |
|---|---|---|
| 領収書・レシート | 画像・PDF | receipt |
| 請求書 | 画像・PDF | invoice |
| 口座明細 | CSV・PDF | bank |
| カード明細 | CSV・PDF | credit |
| 手入力（通常） | — | manual |
| 手入力（決算） | — | closing |

---

## 3. パイプライン全体フロー

```
[入力]
  画像・PDF → Vision OCR → raw_text
  CSV       → CSVパーサー → raw_text
  ※CSVはOCR不要。正規化ステップで合流。

[正規化]
  normalization_rulesに従い処理
  小文字化・全角半角統一・記号削除・カスタムルール
  電話番号・住所も正規化（照合精度を担保）

[構造抽出]
  regex_patternsに従い以下を抽出
  T番号・電話・住所・日付・金額・入出金区分

[取引先特定]
  第一層: T番号・電話・住所（証拠レベル固定）
  第二層: 会社名・屋号・エイリアス照合
  第三層: 特徴語スコアリング
  第四層: Gemini補助（第三層まで不明の場合のみ）
  ※各層で顧問先優先→全社フォールバック

[ベクトル付与]
  入出金ベクトル（確実・構造抽出で取得済み）
  取引先ベクトル（取引先名→業種推定）
  業種ベクトル・全社共通（辞書）
  業種ベクトル・顧問先固有（確定済み仕訳）

[過去仕訳マッチング]
  正規化取引先名 + インボイス番号 + 電話番号で照合
  confirmed_journalsから科目・税区分を取得
  一致した場合→科目・税区分を返す（ノールック確定候補）
  不一致の場合→業種ベクトルで候補リスト生成

[勘定科目決定]
  vendor_account_rules / industry_vector_masterに従い決定
  科目確定後→事業者区分（本則・簡易・免税）で税区分選択肢を絞り込み
  AIは絞られた選択肢から選ぶだけ。自由回答禁止。
  insufficient条件に該当する場合は推測せずinsufficientを返す

[仕訳候補出力]
  勘定科目・税区分・摘要・confidence

[バリデーション]
  source_type === 'closing' → スキップ
  それ以外 → CATEGORY_CONFLICTチェック（売上↔経費逆転の検知）

[人間が承認・拒否]
  journal_feedbackに記録

[夜間バッチ]
  weight更新・頻出語集計・TF-IDF再計算・stopwords昇格
```

---

## 4. OCR設計

| 項目 | 内容 |
|---|---|
| エンジン | Google Vision OCR |
| 用途 | 画像・PDFのテキスト抽出のみ |
| Geminiは不要 | OCR=構造抽出、Gemini=文章理解で役割が違う |
| OCR前処理 | 画像傾き補正・ノイズ除去・解像度確認 |

---

## 5. ベクトル設計（今回追加）

### 3軸の定義

| ベクトル | 定義 | 取得方法 |
|---|---|---|
| 入出金ベクトル | 入金 or 出金 | 構造抽出で確実に取得 |
| 取引先ベクトル | 取引先名から推定される業種属性 | キーワード辞書・AI事前知識 |
| 業種ベクトル | 顧問先の業種から決まる科目傾向 | 全社共通辞書・顧問先固有 |

### 取引先ベクトルの役割

取引先ベクトルは業種ベクトルへの橋渡し。

```
取引先名「○○食堂」
  → 取引先ベクトル：飲食店
  → 業種ベクトル（全社）：会議費 or 交際費
  → 業種ベクトル（顧問先）：金額で分岐
```

### 出金パターン別候補リスト

| 取引先ベクトル | 科目候補 | 分岐条件 |
|---|---|---|
| 飲食店 | 会議費・交際費・福利厚生費 | 金額・人数・目的 |
| 家電量販店 | 消耗品費・器具備品・仕入高 | 金額・顧問先業種 |
| ガソリンスタンド | 燃料費・車両費・旅費交通費 | 顧問先業種 |
| 駐車場（コインパーキング等） | 旅費交通費 | ほぼ確定 |
| 個人名 | 外注費・給与・役員報酬・立替清算 | 従業員マスタ・役員登記 |
| 士業法人 | 支払報酬料・外注費 | 法人格 |
| 保険会社 | 保険料・損害保険料 | ほぼ確定 |
| 金融機関 | 借入金・支払利息・手数料 | 摘要 |
| 通信・SaaS | 通信費・支払手数料 | ほぼ確定 |
| 不動産 | 地代家賃・修繕費 | 摘要 |
| 官公庁 | 租税公課・支払手数料 | ほぼ確定 |
| ECサイト | 消耗品費・仕入高・広告宣伝費 | 顧問先業種・金額 |

### 入金パターン別候補リスト

| 取引先ベクトル | 科目候補 | 分岐条件 |
|---|---|---|
| 法人名 | 売上高・売掛金回収・受取手数料 | 継続性 |
| 個人名 | 売上高・立替清算・雑収入・役員借入 | 金額・役員登記 |
| 金融機関 | 借入金・受取利息 | 摘要 |
| プラットフォーム（Google・Apple等） | 売上高・受取手数料 | 顧問先業種 |
| 官公庁 | 補助金・助成金・還付金 | 摘要 |
| 不明・数字のみ | insufficient | 確定 |

---

## 6. 過去仕訳マッチング設計（今回追加）

### マッチングキーの優先順位

| キー | 信頼度 | 備考 |
|---|---|---|
| インボイス番号 | 最高 | 国税庁登録・一意。業種も取得可能（Phase4） |
| 電話番号 | 高 | 比較的一意だが変更あり。正規化必須 |
| 正規化取引先名 | 中 | 表記ゆれ・略称に注意 |

### 一致判定ロジック

```
完全一致 → 自動確定候補（confidence高）
高類似（閾値以上） → 候補提示・人間確定
低類似 → 業種ベクトルへ
```

### 過去仕訳の保持ルール

- 直近12回（1年分）を保持。季節性・年次費用をカバー
- 科目変更があった場合はis_supersededフラグで論理除外（物理削除しない）
- 最新確定優先（updated_atが最新のものを正解とする）
- 人間が月次レビューで修正 → confirmed_journalsをUPDATE → 次回から自動的に修正後の科目が出る（学習処理不要）

### 連続性の人間への提示

```
同一取引先の直近12回を時系列で表示
  ├ 科目が全件一致 → ノールック確定候補
  ├ 科目が途中で変わっている → 変更理由を確認
  └ バラつきがある → 人間確認必須
```

---

## 7. insufficient定義（今回追加）

AIは以下の条件に該当する場合、推測せず `{"result": "insufficient", "reason": "xx"}` を返す。

| 条件 | 判定 |
|---|---|
| 個人名のみ（カタカナ・漢字人名） | insufficient |
| 数字・記号のみの摘要 | insufficient |
| 取引先名が2文字以下 | insufficient |
| 摘要が空欄 | insufficient |
| 既知プラットフォーム名のみで業種不明 | insufficient |

**プロンプト設計原則**

```
悪い指示：「勘定科目を推測してください」
良い指示：「以下のリストから選んでください。
　　　　　　選べない場合はinsufficientを返してください。
　　　　　　絶対に推測しないでください。」
```

3つの制御ポイント：選択肢を与える（自由回答禁止）・insufficientを正解の一つとして定義・推測を明示的に禁止

---

## 8. 科目・税区分の連動制御（今回追加）

```
科目確定
  ↓
事業者区分（本則・簡易・免税）で税区分の選択肢を絞る
  ↓
AIは絞られた選択肢から選ぶだけ
```

- 科目が決まれば税区分の選択肢は数個に絞られる
- 事業者区分はクライアント固定値（毎回判断不要）
- **精度の勝負は科目判定だけに集約される**

---

## 9. 取引先特定ロジック詳細

### 証拠レベル（階層固定）

```javascript
match_evidence = {
  T_number:     +100,  // 即確定（スコア計算スキップ）
  phone:        +80,
  address:      +70,
  alias_exact:  +50,
  name_partial: +30,
  keyword:      weight依存
}

// T番号一致は即確定、以降スキップ
if (T_number一致) → vendor確定
```

### 確定閾値

| スコア | 判定 |
|---|---|
| T番号一致 | 即確定 |
| score >= 10 | confirmed（確定） |
| score 5〜9 | candidate（候補） |
| score < 5 | unknown（不明） |

### 各層の処理

| 層 | 方法 | 顧問先 | 全社 |
|---|---|---|---|
| 第一層 | T番号完全一致 | ✅優先 | ✅FB |
| 第一層 | 電話番号完全一致 | ✅優先 | ✅FB |
| 第一層 | 住所一致 | ✅優先 | ✅FB |
| 第二層 | 会社名・屋号 | ✅優先 | ✅FB |
| 第二層 | エイリアス照合 | ✅優先 | ✅FB |
| 第三層 | 特徴語スコア | ✅優先 | ✅FB |
| 第四層 | Gemini補助 | — | — |

---

## 10. 特徴語スコアリング

### スコア計算

```javascript
score[vendor] = Σ(keyword_weight × adjusted_weight)
```

### TF-IDF的重み補正

```javascript
// global_frequencyが高い語は汎用語として自動減衰
global_frequency / total_vendors >= 0.3 → stopwords昇格
```

### 特徴語の品質基準

| 条件 | 内容 |
|---|---|
| 固有性 | その取引先にしか出ない語 |
| 安定性 | 出現率が高い語 |
| 短さ | 1〜2語。3語以上は除外 |

良い例：aws prime kindle office365 slack zoom

悪い例：service payment invoice fee

### 共起制御・否定キーワード

| 機能 | 採否 | 理由 |
|---|---|---|
| 共起制御 | ❌不採用 | Amazon問題はvendor分割で解決。管理コスト高 |
| 否定キーワード | ❌不採用 | 実務効果薄。複雑性のみ増加 |

---

## 11. Geminiの役割（限定4用途）

| 用途 | 内容 |
|---|---|
| OCRミス補正 | AMAZ0N → AMAZON |
| 特徴語候補抽出 | 明細テキストから固有語を抽出 |
| 曖昧名の正規化辞書生成 | Gemini提案→人間承認でaliasに追加 |
| 不明取引の推定 | 第四層のみ。insufficient定義に従う |

### Gemini出力スキーマ（固定）

```json
{
  "company_candidate": "",
  "keywords": [],
  "normalized_name": "",
  "variants": []
}
```

---

## 12. バリデーション設計

### 対象・除外

| source_type | バリデーション |
|---|---|
| receipt invoice bank credit manual | ✅対象 |
| closing | ❌除外 |

除外理由：STREAMEDのスコープ外 / 入力者が熟練スタッフ / 現マトリックスが決算仕訳に対応していない。データは保持する（削除しない）

### 判定ロジック

```javascript
debitGroups  = new Set(借方全行の分類)
creditGroups = new Set(貸方全行の分類)

for d in debitGroups:
  for c in creditGroups:
    if checkMatrix(d, c) === 'invalid' → 即エラー
    if checkMatrix(d, c) === 'warn':
      全行がisContra=true → ✅
      1つでもfalse      → ⚠️

優先順位: ❌ > ⚠️ > ✅
```

### ベクトル不一致チェック（今回追加）

売上↔経費の逆転は致命的エラー。過去仕訳マッチング後に必ず検知する。

```
過去仕訳マッチング
  ↓
ベクトルチェック（売上/経費/資産/負債）
  ↓
不一致 → 人間確認へ（自動確定させない）
一致　 → ノールック確定候補
```

同一ベクトル内の科目違い（通信費→消耗品費）は軽微。割り切って許容。

### isContra確定4科目

| 科目ID | 科目名 |
|---|---|
| SALES_RETURNS | 売上値引・返品（個人） |
| SALES_RETURNS_CORP | 売上値引・返品（法人） |
| PURCHASE_RETURNS | 仕入値引・返品（個人） |
| PURCHASE_RETURNS_CORP | 仕入値引・返品（法人） |

---

## 13. バッチ設計

| 処理 | タイミング | 理由 |
|---|---|---|
| weight更新 | 夜間バッチ | ノイズ防止 |
| frequent_words生成 | 夜間バッチ | 同上 |
| accuracy_rate更新 | 夜間バッチ | リアルタイム不要 |
| stopwords昇格 | 週次バッチ | 変化が遅い |
| tfidf再計算 | 週次バッチ | 同上 |

### weight更新ロジック（確定）

```javascript
accuracy_rate = match_count / (match_count + reject_count)

adjusted_weight =
  base_weight
  * Math.log(match_count + 1)  // 初期バイアス防止
  * accuracy_rate               // 正確さを加味

// 最低サンプル数未満はweight更新しない
if (match_count + reject_count < 10) → 更新スキップ
```

### 昇格・降格条件（確定）

```javascript
// frequent_words → vendor_keywords昇格
occurrence_count >= 3
AND occurrence_rate >= 0.6
AND 管理者承認

// stopwords自動昇格
global_frequency / total_vendors >= 0.3
```

---

## 14. 全マスタ・テーブル定義

### ① vendors（取引先マスタ）

```
vendor_id
company_name
normalized_name       ← 正規化後の名称（照合キー）
T_number
phone
address
vendor_vector         ← 取引先ベクトル（飲食・駐車場・SaaS等）★追加
default_account
scope: 'global' | 'client'
client_id
```

### ② vendor_alias（エイリアスマスタ）

```
alias_id
vendor_id
alias_name
scope: 'global' | 'client'
client_id
※Gemini提案→人間承認で自動追加
```

### ③ vendor_keywords（特徴語マスタ）

```
keyword_id
vendor_id
keyword
weight
global_frequency        ← TF-IDF補正用
scope: 'global' | 'client'
client_id

INDEX (keyword, client_id)  ← 必須
```

### ④ vendor_weights（取引先重みづけマスタ）

```
weight_id
vendor_id
client_id
match_count
reject_count
accuracy_rate
adjusted_weight
last_updated
```

### ⑤ vendor_account_rules（勘定科目デフォルトマスタ）

```
rule_id
vendor_id
account_id
tax_category
condition
priority
scope: 'global' | 'client'
client_id
```

### ⑥ confirmed_journals（確定済み仕訳マスタ）★追加

```
id
client_id             ← 顧問先ID
vendor_id             ← 取引先マスタFK
direction             ← 入金/出金
amount_min            ← 金額レンジ下限
amount_max            ← 金額レンジ上限
account_code          ← 勘定科目
tax_category          ← 税区分（科目連動）
confidence            ← 一致回数（信頼スコア）
confirmed_at          ← 確定日
updated_at            ← 修正日（修正伝播の証跡）
is_superseded         ← 修正済みフラグ（論理削除）
retention_count       ← 直近12回分を保持
```

### ⑦ industry_vector_master（業種ベクトルマスタ・全社共通）★追加

```
id
vendor_vector         ← 取引先ベクトル（飲食・駐車場等）
direction             ← 入金/出金
account_candidates    ← 科目候補リスト（JSON）
split_conditions      ← 分岐条件（金額・業種等）
```

### ⑧ frequent_words（頻出語マスタ）

```
word_id
vendor_id
word
occurrence_count
occurrence_rate
approved: boolean
client_id
```

### ⑨ stopwords（ストップワードマスタ）

```
word_id
word
reason: 'manual' | 'auto'
```

### ⑩ regex_patterns（regexマスタ）

```
pattern_id
pattern
extract_type: 'T_number' | 'phone' | 'address' | 'date' | 'amount' | 'direction'  ← direction追加
priority
scope: 'global' | 'client'
client_id
```

### ⑪ normalization_rules（正規化ルールマスタ）

```
rule_id
rule_type: 'lowercase' | 'zen_han' | 'symbol_remove' | 'custom'
pattern
replacement
priority
```

### ⑫ csv_formats（CSVフォーマットマスタ）

```
format_id
institution_name
column_date
column_amount
column_description
column_direction      ← 入出金区分カラム★追加
encoding: 'UTF-8' | 'Shift-JIS'
header_rows
scope: 'global' | 'client'
client_id
```

### ⑬ source_documents（証憑・仕訳紐付け）

```
document_id
journal_id
image_path
raw_text
source_type
vendor_id
content_hash        ← 重複アップロード防止
```

### ⑭ journal_feedback（承認・拒否ログ）

```
feedback_id
journal_id
action: 'approved' | 'rejected'
original_vendor_id
correct_vendor_id
matched_keywords[]
confidence_before
reject_reason: 'vendor_mismatch' | 'account_error' | 'vector_conflict' | 'other'  ← vector_conflict追加
timestamp
staff_id
```

### ⑮ batch_logs（バッチ実行ログ）

```
batch_id
batch_type: 'weight_update' | 'frequent_words' | 'tfidf_recalc' | 'stopwords'
status: 'success' | 'failed'
processed_count
timestamp
```

---

## 15. テーブル関係図

```
source_documents
  ↓
journals
  ↓
journal_feedback
  ↓（夜間・週次バッチ）
confirmed_journals     ← 修正時UPDATE→次回から自動伝播 ★追加
vendor_weights         ← accuracy_rate・adjusted_weight更新
vendor_keywords        ← frequent_wordsから昇格
                       ← global_frequency更新
stopwords              ← vendor_keywordsから汎用語を昇格
batch_logs             ← 全バッチ記録
```

---

## 16. モックファイル構成

```
src/mocks/data/
  vendor_master_global.ts
  vendor_master_client.ts
  vendor_alias_global.ts
  vendor_alias_client.ts
  vendor_keywords_global.ts
  vendor_keywords_client.ts
  vendor_weights.ts
  vendor_account_rules_global.ts
  vendor_account_rules_client.ts
  confirmed_journals.ts              ← ★追加
  industry_vector_master.ts          ← ★追加
  frequent_words.ts
  stopwords.ts
  regex_patterns.ts
  normalization_rules.ts
  csv_formats.ts
  source_documents.ts
  journal_feedback.ts
  batch_logs.ts
  journal_fixture.ts
  test_cases_ocr.ts
  test_cases_match.ts
  test_cases_vector.ts               ← ★追加（ベクトル分岐テスト）
  test_cases_insufficient.ts         ← ★追加（insufficient条件テスト）
```

---

## 17. リスク管理

| リスク | 内容 | 対策 |
|---|---|---|
| Amazon問題 | AWS・EC・Kindle・Primeを同一vendorにすると誤分類 | vendor_idを用途別に分割 |
| 電話・住所の揺れ | 正規化なしで照合精度が死ぬ | normalization_rulesで必ず正規化 |
| OCR誤認識 | 0/O・1/I混同 | Geminiミス補正＋regex補完 |
| accuracy_rate過学習 | サンプル少ない初期に崩れる | 10件未満はweight更新スキップ |
| 過去仕訳の誤り伝播 | 誤った科目が70%に波及 | ベクトル不一致チェックで致命的エラーのみ検知 |
| 冷スタート（新規開業） | 確定済み仕訳ゼロ | 初期3〜6ヶ月は人間確認100%と明文化 |
| insufficient未定義 | AIが無理に推測してくそ推論を返す | insufficient条件を明示的に定義してプロンプトに組み込む |

---

## 18. フェーズ定義（確定）

| フェーズ | 内容 | データ | 精度目標 |
|---|---|---|---|
| Phase1 | OCR・正規化・regex・マスタ照合・ベクトル付与ロジック検証 | TSモック | 70〜80% |
| Phase2 | 特徴語スコアリング・過去仕訳マッチングロジック検証 | TSモック | 85〜92% |
| Phase3 | フィードバックループ・weightロジック・insufficient制御検証 | TSモック | ロジック確定 |
| Phase4 | 実データによる精度検証・フィードバック蓄積 | Supabase移行後 | 90〜93% |

### Supabase移行タイミング

```
Phase1〜3でロジック・スキーマを完全確定
  ↓
TSモックデータをそのままSupabaseにINSERT
  ↓
Phase4へ（実データで精度検証）
```

---

## 19. 実装優先順位

1. MF CSVスキーマ確定（最優先・これが決まらないと何もテストできない）
2. ベクトル付与ロジック実装（入出金・取引先・業種の3軸）
3. 過去仕訳マッチング最小実装（正規化取引先名×金額レンジ）
4. insufficient定義・プロンプト制御実装
5. スコアリング階層化
6. vendor分割（Amazon問題対応）
7. weight更新ロジック実装
8. stopwords自動昇格
9. normalization_rules強化

---

## 20. 未決事項

| 項目 | 内容 |
|---|---|
| 全社マスタ初期投入 | 過去仕訳CSVから抽出推奨 |
| T番号検証 | 国税庁API呼び出しはPhase4以降 |
| CSVフォーマット対応範囲 | 主要5行は固定パーサー、それ以外はGeminiパース |
| 取引先検索機能 | 地方中小業者の業種不明ケースへの対応（Phase2以降） |
| 業種設定マスタ | 冷スタート補助として検討中（Phase2以降） |

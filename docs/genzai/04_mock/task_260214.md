# 統合タスクリスト：Phase A完了〜Phase 6実装（定義B準拠）

**作成日**: 2026-02-14（定義B準拠に更新）  
**最終更新**: 2026-02-16（status/label定義を最新化）  
**元ファイル**: C:\Users\kazen\.gemini\antigravity\brain\89a3b2f1-4a15-450d-b11d-cc1c56d76560\task.md.resolved  
**目的**: Phase A完了からPhase 6実装までの統合タスク管理（定義B準拠）

---

## 📋 現在のフォーカス

### 🎯 2026-02-14: 定義B採用完了 ✅

**完了した作業**:
- [x] 定義A vs 定義Bの全項目比較
- [x] 定義B（協力型フロー）を正式採用と決定
- [x] journal_v2_20260214.md 作成（定義B準拠）
- [x] 5ファイルを260214版として作成・修正完了

**設計の重要ポイント（最新版）**:
1. **statusは最小化**: 出力管理のみ（ENUM 1つ + null）
   - ❌ 廃止: pending, help, soudan, kakunin（協力型フロー→labelsに移行）
   - ✅ 採用: exported + null（Streamed準拠の最小設計）
   - 📝 理由: 協力機能はlabels（NEED_DOCUMENT/NEED_CONFIRM/NEED_CONSULT）で実現
2. **labelsは非排他的**: 警告・分類タグ（配列 21個）
   - 9個 → 17個 → 21個に拡張（2026-02-16に追加4個）
   - 追加: NEED_DOCUMENT, NEED_CONFIRM, NEED_CONSULT, EXPORT_EXCLUDE
3. **別カラム**: 同時に複数の状態を持つ（is_read、memo等）
   - ❌ 廃止: severity_level ENUM、risk_score
   - ✅ 採用: is_read（背景色管理）、memo（協力型フロー用）
4. **Streamed準拠**: 出力=完了、背景色、ゴミ箱30日
5. **本システム独自**: 要対応ラベル（3種）、メモ機能、出力対象外ラベル

**次のステップ**:
- Phase 5実装への準備（スキーマ確定完了）
- UI mockup作成（協力型フローのUI検証）

---

## 完了タスク（Phase A完了）

### 1. ファイル整理 ✅
- [x] 信頼できるファイルリスト作成
- [x] Phase A Day 1-3ファイルを OLD/kari_hokan/phaseA_old/ に移動
- [x] Phase 4フォルダを OLD/kari_hokan/ に移動

### 2. ブレインファイルのアーティファクト化 ✅
**目的**: 前の会話のブレインファイルを現在の会話で利用可能にする

- [x] 前の会話（738bd95a-...）のブレインファイル5つを読み取り
- [x] 現在の会話（d35e1d23-...）にアーティファクトとして再作成

### 3. 3段階実証設計アプローチへの更新 ✅
**背景**: スクショからDDLを直接逆算する方法は「想像設計」であり、UIを触らずに型・制約を推測するため失敗する

**核心的な変更**:
```
従来（想像設計）:
Phase 1: スクショ → DDL作成
↓
問題: UIを触らずに型・制約を推測 → 「このカラムいらない」→ Zod崩壊

新方式（実証設計）:
Phase 1: スクショ → 概念モデル（型・制約は曖昧）
Phase 1.5: UIモック → 30件テスト → 摩擦箇所記録（新規追加）
Phase 2: DDL確定（UIテスト結果を元に）
```

---

## 🎯 3階層UIの対応関係

- **レベル1 = ①顧問先全体処理一覧UI** → Phase 5.5-6で実装
- **レベル2 = ②個別顧問先_種別UI** → Phase 5.5-6で実装
- **レベル3 = ③個別顧問先_種別詳細UI（仕訳一覧）** → **Phase 5で実装**

---

## Phase 5（Day 15-21）：レベル3（③仕訳一覧）実装

### ステップ1: スクショ分析（レベル3のみ）
- [x] Streamedスクリーンショットを共有
- [x] レベル3（③仕訳一覧）のUI要素をすべて列挙
  - [x] アイコン（ステータス）
  - [x] 適格請求書判定（⭕❌）
  - [x] 黄色ハイライト（未読状態、is_read = false）
    - ❌ 古い表現: 「要確認状態」
    - ✅ 新しい定義（定義B）: 未読状態（is_read = false）で黄色背景
  - [x] 複合仕訳（行の複数段表示）
  - [x] 借方カラム（科目、補助科目、税区分、金額）
  - [x] 貸方カラム（科目、補助科目、税区分、金額）
  - [x] 取引先名
  - [x] 取引日
  - [x] 金額
  - [x] メモアイコン（📝）
  - [x] ルール適用アイコン
  - [x] 事故フラグアイコン（🟢🟡🔴）

**成果物**: UI要素リスト（20-30項目）

### ステップ2: 概念モデル作成（レベル3のみ、型・制約は曖昧）✅
- [x] UI要素から概念的な情報を抽出
  - [x] 事故フラグ
    - ❌ 古い定義: `severity`, `anomaly_flags`
    - ✅ 最新版: labels（21個）で管理、severityは削除
    - ラベル内訳（21個）:
      - 証憑種類 5個（TRANSPORT, RECEIPT, INVOICE, CREDIT_CARD, BANK_STATEMENT）
      - ルール 2個（RULE_APPLIED, RULE_AVAILABLE）
      - インボイス 3個（INVOICE_QUALIFIED, INVOICE_NOT_QUALIFIED, MULTI_TAX_RATE）
      - 事故フラグ 6個（DEBIT_CREDIT_MISMATCH, TAX_CALCULATION_ERROR, DUPLICATE_SUSPECT, DATE_ANOMALY, AMOUNT_ANOMALY, MISSING_RECEIPT）
      - OCR 2個（OCR_LOW_CONFIDENCE, OCR_FAILED）
      - 要対応 3個（NEED_DOCUMENT, NEED_CONFIRM, NEED_CONSULT）
      - 出力制御 1個（EXPORT_EXCLUDE）
      - その他 1個（HAS_MEMO）
  - [x] ルール表示 → `rule_id`, `rule_confidence`（概念確定、詳細はUIモックで決定）
  - [x] インボイス → `invoice_number`, `invoice_status`（概念確定、詳細はUIモックで決定）
  - [x] 背景色管理 → `is_read`（未読/既読）、`status = 'exported'`（グレー）
  - [x] 複合仕訳
    - ❌ 古い定義: `journal_type`（単一/複合）
    - ✅ 定義B: 既存構造（debit_entries配列）で対応済み、カラム不要
  - [x] メモアイコン → `memo`, `memo_author`, `memo_target`, `memo_created_at`
  - [x] 要対応フラグ → `labels`（NEED_DOCUMENT/NEED_CONFIRM/NEED_CONSULT）
    - ❌ 削除: status（help/soudan/kakunin）
    - ✅ 変更: labelsで管理（複数同時設定可能）
- [x] journal_v1との差分分析
- [x] 実装優先度決定（Tier 1-3）
- [x] **重要**: DDLは作成しない、型・NULL制約・indexは未確定

**成果物**: level3_ui_complete_analysis_260214.md（概念モデル含む）✅

### ステップ3: UIモック作成（フルスペック→削減アプローチ）

**実証設計の原則**: まずフルスペックを実装し、30件テストで「見ない項目」を記録してから削減

#### ステップ3.1: フルスペックUI要素チェックリスト作成 ✅
- [x] Streamedスクショから全UI要素を抽出
  - [x] テーブル列（No, アイコン, 日付, 摘要, 科目, 補助科目, 税区分, 金額）
  - [x] アイコン5列分（証憑種類、エラー、学習、軽減税率、メモ）
  - [x] ホバー表示（ルール詳細、インボイス番号、メモ内容）
  - [x] クリック時の動作（詳細遷移、モーダル表示）
- [x] 各UI要素の表示方法を定義
  - [x] テキスト表示（科目名、金額等）
  - [x] アイコン表示（🚗📄⭕❌🎓等）
  - [x] ホバー時のツールチップ
  - [x] クリック時のモーダル/遷移

**成果物**: phase5_level3_ui_fullspec_checklist_260214.md（全UI要素チェックリスト）✅

#### ステップ3.2a: 30件ダミーデータ設計（最優先、環境不要）✅

**実証設計の核心**: データ設計を先に固めることで、モック実装がスムーズ

- [x] 30件ダミーデータの全体設計
  - [x] 構成比決定（グリーン20件、イエロー7件、レッド3件）
  - [x] status分布（null 29件、exported 1件）
  - [x] 要対応ラベル分布（NEED_DOCUMENT 3件、NEED_CONFIRM 3件、NEED_CONSULT 2件）
  - [x] labels分布（全21種類を網羅）
  - [x] 複合仕訳を含める（3件以上）
  - [x] ルール適用済み/適用可能を含める
  - [x] インボイス適格/不適格を含める
  - [x] メモありを含める
- [ ] **各行の詳細データ設計（markdown形式）**
  - [ ] 行1-10: グリーン（正常）
  - [ ] 行11-20: グリーン（正常、バリエーション）
  - [ ] 行21-27: イエロー（要確認）
  - [ ] 行28-30: レッド（緊急）
- [ ] **全UI要素を網羅**
  - [ ] 全21種類のlabelsを使用
  - [ ] 全5種類のstatusを使用
  - [ ] ルール適用済み（`RULE_APPLIED`）を10件以上
  - [ ] ルール適用可能（`RULE_AVAILABLE`）を5件以上
  - [ ] インボイス適格（`INVOICE_QUALIFIED`）を15件以上
  - [ ] インボイス不適格（`INVOICE_NOT_QUALIFIED`）を5件以上
  - [ ] 複合仕訳（description欄に「複合仕訳（2行）」等と記載）を3件以上
  - [ ] メモあり（`HAS_MEMO`）を3件以上

**重要**: journal_v2_20260214.mdでは複合仕訳のスキーマ詳細が「省略」となっているため、モック段階では簡略化（description欄に記載）。UIモック検証後にDDL確定。

**成果物**: `docs/genzai/NEW/phaseA_streamed_compatible_design_260208/phase5_level3_test_fixture_30cases_260214.md`（30件ダミーデータ設計書、markdown形式）

---

#### ~~ステップ3.2b-1: 静止画UIモックアップ作成（Streamedを参考、独自性確保）~~

> **画像生成は難しく、実施しなかった**  
> AI画像生成ツールでは30件×19列の詳細UIの正確な再現が困難と判明。ステップ3.2b-2（Vueコンポーネント実装）で実施する方針に変更。

**著作権・デザイン権の尊重**: Streamedを参考にしつつ、独自のUIデザインを作成

- [x] ~~Streamedスクリーンショット分析~~
  - [x] ~~テーブル構造・列の配置~~
  - [x] ~~アイコンの種類・位置~~
  - [x] ~~背景色の使い方~~
  - [x] ~~ホバー・クリックの動作（推測）~~
- [x] ~~差別化ポイント決定~~
  - [x] ~~カラースキーム（独自色選定）~~
  - [x] ~~アイコンセット（Font Awesome等で独自選定）~~
  - [x] ~~列の順序・幅の調整~~
  - [x] ~~フィルター・ソート機能の独自設計~~
- [x] ~~静止画UIモックアップ生成~~
  - [x] ~~`generate_image`ツールで30件仕訳一覧の静止画を作成~~（実施せず）
  - [x] ~~定義B準拠（status 5種類、labels 17種類、is_read背景色）~~
  - [x] ~~全UI要素を視覚化~~
- [x] ~~デザイン方向性確認~~
  - [x] ~~デザインの方向性OK?~~
  - [x] ~~差別化できている?~~
  - [x] ~~実装可能?~~

**成果物**: 
- ✅ `phase5_ui_design_strategy_260214.md`（デザイン方針策定書）
- ❌ ~~`phase5_level3_ui_mockup_image_260214.png`（静止画UIモックアップ）~~（作成せず）


---

#### ステップ3.2b-2: Vueコンポーネント実装（静止画確定後）

**前提**: ステップ3.2b-1（静止画UIモックアップ）で方向性確定後に実施

**技術選定確定**（2026-02-14, 詳細調査完了）:
- ✅ **CSS**: TailwindCSS 4.1.18（既存プロジェクト準拠）
- ✅ **アイコン**: **Font Awesome 7.1.0 統一**
  - 理由: 色制御完全対応（`text-blue-500`）、プラットフォーム一貫性、既存43件のVueコンポーネントと統一
  - Emoji不採用理由: CSS `color`で色制御不可、プラットフォーム依存、大量表示でパフォーマンス悪化
- ✅ **ツールチップ**: 自作（Tailwindのgroupホバー）
- ✅ **複合仕訳**: **N対N配列構造** + rowspan表示
  - 1対1: 単純仕訳
  - 1対10: 経費精算（10項目）→ 現金
  - 10対1: 複数経費 → クレジットカード
  - N対N: あらゆるパターンに対応

**参考**: `emoji_vs_fontawesome_final_260214.md`（詳細調査レポート）

**ディレクトリ構造設計**（Phase 1パターン準拠）:

```
src/mocks/
├── types/
│   └── journal_phase5_mock.type.ts  ← 型定義（Phase 1のreceipt.types.tsと同じパターン）
├── data/
│   └── journal_test_fixture_30cases.ts  ← 30件テストデータ
├── columns/
│   └── journalColumns.ts  ← 列定義の単一ソース（00_safe_mock_development_rules.md §3参照）
├── unsafe/
│   └── （any許可の実験場。data/components/へのimport禁止）
└── components/
    └── JournalListLevel3Mock.vue  ← Vueコンポーネント
```

**設計思想**:
- Phase 1のSupabase実装パターン（`src/database/types/receipt.types.ts`）と一貫性
- モック段階で型を明確化し、Phase 5完了後のSupabase実装への移行をスムーズに
- 型定義とデータを分離し、TypeScript型安全性を最大化

---

##### **ステップ3.2b-2-1: モック専用型定義作成**

- [ ] `src/mocks/types/journal_phase5_mock.type.ts`作成
  - [ ] `JournalStatusPhase5`型定義（最小化: exported + null）
    - `'exported' | null`（出力管理のみ。要対応はlabelsで管理。2026-02-16確定）
  - [ ] `JournalLabelPhase5`型定義（21種類のラベル、TypeScript union型）
    - 証憑種類（5個）: TRANSPORT, RECEIPT, INVOICE, CREDIT_CARD, BANK_STATEMENT
    - ルール（2個）: RULE_APPLIED, RULE_AVAILABLE
    - インボイス（3個）: INVOICE_QUALIFIED, INVOICE_NOT_QUALIFIED, MULTI_TAX_RATE
    - 事故フラグ（6個）: DEBIT_CREDIT_MISMATCH, TAX_CALCULATION_ERROR, DUPLICATE_SUSPECT, DATE_ANOMALY, AMOUNT_ANOMALY, MISSING_RECEIPT
    - OCR（2個）: OCR_LOW_CONFIDENCE, OCR_FAILED
    - 要対応（3個）: NEED_DOCUMENT, NEED_CONFIRM, NEED_CONSULT
    - 出力制御（1個）: EXPORT_EXCLUDE
    - その他（1個）: HAS_MEMO
  - [ ] `JournalPhase5Mock`インターフェース定義
    - 基本フィールド定義（id, client_id, receipt_id, status, labels, 他）
    - 日付フィールドはISO 8601文字列形式（`string`型）
    - メモ関連フィールド（memo, memo_author, memo_target, memo_created_at）
    - ルール関連フィールド（rule_name, rule_confidence）
    - インボイス関連フィールド（invoice_number）
    - **N対N複合仕訳対応フィールド**:
      ```typescript
      debit_entries: Array<{
        account: string;
        sub_account: string | null;
        amount: number;
        tax_code: string | null;
      }>;
      credit_entries: Array<{
        account: string;
        sub_account: string | null;
        amount: number;
        tax_code: string | null;
      }>;
      // 単純仕訳: 配列長1
      // 複合仕訳: 1対10、10対1、N対N全対応
      ```
  - [ ] 型定義のみに集中（データは含めない）
  - [ ] journal_v2_20260214.mdの完全スキーマ定義を参照
  - [ ] TypeScriptコンパイルエラーがないことを確認

**参照**: `docs/genzai/02_database_schema/journal/journal_v2_20260214.md`（行163-227）

**成果物**: `src/mocks/types/journal_phase5_mock.type.ts`（約50行）

---

##### **ステップ3.2b-2-2: 30件テストフィクスチャTypeScript化**

**前提**: ステップ3.2a-2の設計書（`phase5_level3_test_fixture_30cases_260214.md`）完成後に実施

> ⚠️ `00_safe_mock_development_rules.md` Phase A準拠: 既存30件は原則凍結。変更は1-2件のみ、変更前の値をコメントで残すこと。新規データはFactory経由で31件目以降として追加。

- [ ] `src/mocks/data/journal_test_fixture_30cases.ts`作成
  - [ ] `JournalPhase5Mock`型をインポート
    - `import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type';`
  - [ ] `phase5_level3_test_fixture_30cases_260214.md`の内容をTypeScript化
  - [ ] 30件データを配列で定義（`mockJournalsPhase5: JournalPhase5Mock[]`）
  - [ ] 各行のデータ構成（設計書準拠）:
    - 行1-20: グリーン（正常）
    - 行21-27: イエロー（要確認）
    - 行28-30: レッド（緊急）
  - [ ] 全UI要素を網羅:
    - 全21種類のlabelsを使用
    - 全5種類のstatusを使用
    - ルール適用済み（RULE_APPLIED）を10件以上
    - ルール適用可能（RULE_AVAILABLE）を5件以上
    - インボイス適格（INVOICE_QUALIFIED）を15件以上
    - 複合仕訳（description欄に「複合仕訳（2行）」等と記載）を3件以上
    - メモあり（HAS_MEMO）を3件以上
  - [ ] 日付は'YYYY-MM-DD'形式、タイムスタンプはISO 8601形式
  - [ ] TypeScriptコンパイルエラーがないことを確認
  - [ ] 型安全性を確認（全フィールドが型定義に準拠）

**成果物**: `src/mocks/data/journal_test_fixture_30cases.ts`（約600行）

---

##### **ステップ3.2b-2-3: Vueモックコンポーネント作成**

> ⚠️ `00_safe_mock_development_rules.md` §3準拠: `journalColumns.ts` 経由で列定義すること。ヘッダー/ボディの直書き禁止。

- [ ] `src/mocks/columns/journalColumns.ts` 列定義ファイル作成
- [ ] `src/mocks/components/JournalListLevel3Mock.vue`コンポーネント作成
  - [ ] モックデータをインポート
    - `import { mockJournalsPhase5 } from '../data/journal_test_fixture_30cases';`
  - [ ] **全アイコンロジック実装（5列すべて、Font Awesome統一）**
    - **証憑種類アイコン**: `<i class="fa-solid fa-car"></i>`（TRANSPORT）、`<i class="fa-solid fa-receipt"></i>`（RECEIPT）、`<i class="fa-solid fa-file-invoice"></i>`（INVOICE）、`<i class="fa-regular fa-credit-card"></i>`（CREDIT_CARD）、`<i class="fa-solid fa-building-columns"></i>`（BANK_STATEMENT）
    - **ルールアイコン**: `<i class="fa-solid fa-graduation-cap"></i>`（RULE_APPLIED）、`<i class="fa-solid fa-circle"></i>`（RULE_AVAILABLE）
    - **インボイスアイコン**: `<i class="fa-solid fa-circle-check"></i>`（INVOICE_QUALIFIED）、`<i class="fa-solid fa-circle-xmark"></i>`（INVOICE_NOT_QUALIFIED）
    - **エラーレベルアイコン**: `<i class="fa-solid fa-circle"></i>` + `text-green-500`/`text-yellow-500`/`text-red-500`で色制御
    - **メモアイコン**: `<i class="fa-solid fa-note-sticky"></i>`（HAS_MEMO）
    - **TailwindCSSで色制御**: `text-blue-500`、`text-green-500`など
  - [ ] **全ホバー表示実装（Tailwind `group` + `group-hover`）**
    - ルール詳細ホバー（ルール名、信頼度、適用日時）
    - インボイス番号ホバー
    - メモ編集ホバー（作成者、相手、メモ欄、保存ボタン）
  - [ ] ハイライト表示実装
    - `is_read: false` → 黄色背景（`bg-yellow-50`）
    - `status = 'exported'` → グレー背景（`bg-gray-200`）
    - `is_read: true` → 白背景（`bg-white`）
  - [ ] **N対N複合仕訳の表示実装**
    - `Math.max(debit_entries.length, credit_entries.length)`でrowspan計算
    - 1対1: 通常表示
    - 1対10: 借方1行、貸方10行
    - 10対1: 借方10行、貸方1行
    - N対N: 全パターン対応
    - 複合仕訳マーク（`<i class="fa-solid fa-layer-group"></i>`）を証憑種類列に表示
  - [ ] **TailwindCSSでスタイリング**
  - [ ] **Font Awesome 7.1.0（`fa-solid`クラス）統一** + TailwindCSSで色制御

**参照**: 
- `src/components/ScreenB_JournalTable.vue`（既存テーブルパターン）
- Font Awesome: `<i class="fa-solid fa-アイコン名 text-色-明度"></i>`
- 技術選定根拠: `emoji_vs_fontawesome_final_260214.md`（詳細調査レポート）

**成果物**: `src/mocks/components/JournalListLevel3Mock.vue`（約200行）

---

##### **ステップ3.2b-2-4: ローカル確認**

- [ ] モック専用ルート設定
  - [ ] `src/router/index.ts`にルート追加
    - パス: `/mock/journal-list`
    - コンポーネント: `JournalListLevel3Mock.vue`
  - [ ] ナビゲーションメニューに追加（開発モードのみ）
- [ ] `npm run dev`でモックページ表示確認
  - [ ] ブラウザで`http://localhost:5173/mock/journal-list`を開く
  - [ ] 30件すべてが正しく表示されるか検証
  - [ ] アイコンが正しく表示されるか確認
  - [ ] 背景色が正しく表示されるか確認（黄色/白/グレー）
  - [ ] ホバー動作の確認
    - ルール詳細ホバーが表示されるか
    - メモ編集ホバーが表示されるか
    - ツールチップが正しく表示されるか
  - [ ] 複合仕訳の2段表示確認
    - rowspanが正しく機能しているか
    - 複合仕訳マークが表示されるか
- [ ] スクリーンショット撮影
  - [ ] 30件全体のスクリーンショット
  - [ ] ホバー時のスクリーンショット（3-5枚）
  - [ ] 複合仕訳表示のスクリーンショット

**重要**: この段階では削らない、すべて実装する

**成果物**: 
- `src/mocks/types/journal_phase5_mock.type.ts`（型定義、50行）
- `src/mocks/data/journal_test_fixture_30cases.ts`（30件データ、600行）
- `src/mocks/components/JournalListLevel3Mock.vue`（Vueコンポーネント、200行）
- モック専用ルート設定
- スクリーンショット3-8枚

**モック作成時に明確化が必要な詳細仕様**:

**ルール表示の詳細**:
- [ ] ホバー時に表示する情報
  - [ ] ルール名の表示方法
  - [ ] 適用日時の表示方法
  - [ ] 信頼度の表示方法（%表示？バー表示？）
- [ ] アイコンの種類判定ロジック
  - [ ] 🎓（ルール適用済み）の表示条件
  - [ ] 🔵（ルール適用可能）の表示条件
- [ ] ルール一覧画面への遷移方法
  - [ ] クリック時の動作
  - [ ] モーダル？別ページ？サイドパネル？

**インボイス判定の詳細**:
- [ ] ⭕❌アイコンのサイズ・位置
  - [ ] アイコンサイズ（16px？20px？24px？）
  - [ ] 配置位置（列の左？右？中央？）
- [ ] 不適格時の警告メッセージ
  - [ ] ホバー時のツールチップ内容
  - [ ] 警告アイコンの追加要否
- [ ] インボイス番号の表示方法
  - [ ] ホバー時に表示？
  - [ ] 別カラムとして表示？
  - [ ] 詳細画面でのみ表示？

**メモ表示の詳細**（2026-02-14確定）:
- [x] ホバー時の編集可否 → **編集可能** ✅
  - ホバー時にメモを書ける、修正できる、閲覧できる
  - 作成者、相手、メモ欄をホバー内で編集可能
- [ ] ホバーUIの詳細
  - [ ] モーダルサイズ・配置
  - [ ] 保存ボタンの配置
  - [ ] キャンセル時の挙動

**成果物**: `JournalListLevel3Mock.vue`

### ステップ4: 30件ダミーテスト
- [ ] 30件を上から確認（KPI: 3秒でOK）
- [ ] 記録項目:
  - [ ] 所要時間: XX分XX秒
  - [ ] 詳細画面に入った回数: XX/30件
  - [ ] 止まった箇所: X箇所
  - [ ] 不安になった箇所: X箇所
  - [ ] 色が信用できたか: Yes/No
  - [ ] アイコンの意味が分かったか: Yes/No
  - [ ] ハイライトの意味が分かったか: Yes/No
  - [ ] **使わなかった列**: XX列
  - [ ] **邪魔だったホバー**: XX
  - [ ] **欲しかった機能**: XX

**成功基準**: 詳細遷移率 < 30%

### ステップ5: 摩擦箇所を列挙
- [ ] 情報不足を列挙
  - [ ] 例: 事故の重大度が分からない
    - ❌ 古い定義: `risk_score`追加候補
    - ✅ 定義B: labels配列で管理、スコア化不要
  - [ ] 例: ルール名が見えない → `rule_name`表示必要
  - [ ] 例: メモの内容がプレビューできない → `memo_preview`追加候補
- [ ] 情報過多を列挙
  - [ ] 例: XXは一覧に不要 → 詳細画面に移動
  - [ ] **使わなかった列を列挙**
  - [ ] **邪魔だったホバーを列挙**
- [ ] 判断曖昧を列挙
  - [ ] 例: 色の意味が分からない
    - ❌ 古い定義: severity定義を見直し
    - ✅ 定義B: `is_read`（未読/既読）で背景色管理
  - [ ] 例: アイコンが多すぎる → アイコン数を削減
- [ ] 詳細遷移の理由を集計
  - [ ] 金額怪しい: X件
  - [ ] 科目不安: X件
  - [ ] OCR不鮮明: X件
  - [ ] ルール不明: X件
  - [ ] メモ確認: X件
- [ ] **欲しかった機能を列挙**
  - [ ] 例: 金額の大きさが分かりにくい → フォントサイズ変更
  - [ ] 例: 日付が見づらい → 日付フォーマット変更

**成果物**: `phase5_level3_ui_friction_report_260213.md`

---

#### Phase 1.5（UIモック後）で決定すべき仕様

##### is_readのタイミング決定
- [ ] 30件テストで「いつ既読にすべきか」を検証
  - [ ] A案: 詳細画面遷移時（推奨）
  - [ ] B案: 一覧画面で3秒表示
  - [ ] C案: 手動ボタン
- [ ] 摩擦レポートに記録
- [ ] 最適なタイミングを決定

**理由**: 実際に触らないと使いやすさが判断できない

##### メモUIの詳細決定
- [ ] 30件テストで「メモ入力の使いやすさ」を検証
  - [ ] A案: モーダル
  - [ ] B案: サイドパネル
  - [ ] C案: インライン
- [ ] ホバー表示の内容（全文/プレビュー）を決定
- [ ] 摩擦レポートに記録

**理由**: モックで実際の入力体験を検証すべき

##### 一括操作の詳細決定
- [ ] 30件テストで「どの一括操作が頻繁に使われるか」を記録
- [ ] 必要な一括操作を特定
  - [ ] 一括既読
  - [ ] 一括コピー
  - [ ] 一括出力対象外
  - [ ] 一括削除
- [ ] 確認ダイアログの要否を決定

**理由**: 頻繁に使われる操作は触らないと分からない

##### export_excludeの管理UI決定
- [ ] 詳細画面にチェックボックス配置
- [ ] 一覧画面での表示方法を決定
  - [ ] A案: 背景色（薄いグレー）
  - [ ] B案: アイコン
  - [ ] C案: 表示しない

**理由**: 出力対象外の視覚化が必要かはUIテストで判断

---

### ステップ6: DDL確定（レベル3：③仕訳一覧のみ）

#### 摩擦レポートを元に型・制約を決定
- [ ] 「情報不足」カラム → NOT NULL
  - ❌ 古い定義: risk_scoreが一覧で必須 → `risk_score INTEGER NOT NULL DEFAULT 0`
  - ✅ 定義B: labelsで管理、スコア不要
  - ❌ 古い定義: severityが一覧で必須 → `severity severity_level NOT NULL DEFAULT 'green'`
  - ✅ 定義B: `is_read`が一覧で必須 → `is_read BOOLEAN DEFAULT FALSE`
- [ ] 「情報過多」カラム → 削除
  - 例: XXは一覧に不要 → 詳細画面に移動
- [ ] 「詳細遷移多い」→ index追加
  - ❌ 古い定義: severityでソート頻度高 → `CREATE INDEX idx_journals_severity`
  - ❌ 古い定義: risk_scoreでソート頻度高 → `CREATE INDEX idx_journals_risk_score`
  - ✅ 定義B: `is_read`でフィルタ頻度高 → `CREATE INDEX idx_journals_is_read`

#### DDL作成（レベル3に特化、定義B準拠）
- [ ] ~~`CREATE TYPE journal_status AS ENUM ('pending', 'help', 'soudan', 'kakunin', 'exported')`~~
  - ✅ 最新版（2026-02-16確定）: status ENUMは廃止。`exported` + `null` で管理
- [ ] ❌ 廃止: `CREATE TYPE severity_level AS ENUM ('green', 'yellow', 'red')`
  - ✅ 定義B: severity型は作成しない（`is_read`で背景色管理）
- [ ] `ALTER TABLE journals`追加カラム:
  - [ ] `ADD COLUMN status journal_status NOT NULL DEFAULT 'pending'`
  - [ ] `ADD COLUMN is_read BOOLEAN DEFAULT FALSE`
  - [ ] `ADD COLUMN read_at TIMESTAMP NULL`
  - [ ] ❌ 廃止: `ADD COLUMN severity severity_level NOT NULL DEFAULT 'green'`
    - ✅ 定義B: severityカラムは作成しない
  - [ ] ❌ 廃止: `ADD COLUMN anomaly_flags TEXT[] DEFAULT '{}'`（labelsに統合）
  - [ ] ❌ 廃止: `ADD COLUMN risk_score INTEGER DEFAULT 0`
    - ✅ 定義B: risk_scoreカラムは作成しない
  - [ ] `ADD COLUMN labels TEXT[] DEFAULT '{}'`
  - [ ] `ADD COLUMN rule_id UUID REFERENCES journal_rules(id) NULL`
  - [ ] `ADD COLUMN rule_applied_at TIMESTAMP NULL`
  - [ ] `ADD COLUMN rule_confidence NUMERIC(3, 2) NULL`
  - [ ] `ADD COLUMN invoice_number VARCHAR(50) NULL`
  - [ ] `ADD COLUMN invoice_status VARCHAR(20) NULL`
  - [ ] `ADD COLUMN tax_category VARCHAR(20) NULL`
  - [ ] `ADD COLUMN memo TEXT NULL`
  - [ ] `ADD COLUMN memo_author VARCHAR(100) NULL`
  - [ ] `ADD COLUMN memo_target VARCHAR(100) NULL`
  - [ ] `ADD COLUMN memo_created_at TIMESTAMP NULL`
  - [ ] `ADD COLUMN exported_at TIMESTAMP NULL`
  - [ ] `ADD COLUMN exported_by VARCHAR(100) NULL`
  - [ ] `ADD COLUMN export_exclude BOOLEAN DEFAULT FALSE`
  - [ ] `ADD COLUMN export_exclude_reason VARCHAR(200) NULL`
  - [ ] `ADD COLUMN deleted_at TIMESTAMP NULL`
  - [ ] `ADD COLUMN deleted_by VARCHAR(100) NULL`
- [ ] インデックス作成:
  - [ ] `CREATE INDEX idx_journals_status ON journals(status)`
  - [ ] `CREATE INDEX idx_journals_is_read ON journals(is_read)`
  - [ ] ❌ 廃止: `CREATE INDEX idx_journals_severity ON journals(severity)`
    - ✅ 定義B: severityインデックスは作成しない
  - [ ] ❌ 廃止: `CREATE INDEX idx_journals_risk_score ON journals(risk_score DESC)`
    - ✅ 定義B: risk_scoreインデックスは作成しない
  - [ ] `CREATE INDEX idx_journals_rule_id ON journals(rule_id)`
  - [ ] `CREATE INDEX idx_journals_deleted_at ON journals(deleted_at)`
  - [ ] `CREATE INDEX idx_journals_labels ON journals USING GIN(labels)`
  - [ ] `CREATE INDEX idx_journals_status_read ON journals(status, is_read)`
  - [ ] `CREATE INDEX idx_journals_exported_at ON journals(exported_at)`
  - [ ] `CREATE INDEX idx_journals_created_at ON journals(created_at)`

#### status遷移ルール（定義B 2026-02-14確定）

- [ ] DB制約なし、UI層で制御
  - **理由**: 出力後に誤りを発見した場合の救済措置が必要
  - UI層で「出力取り消し」ボタン + 警告メッセージで対応
  - 会計ソフト側の手動削除を促す

```sql
-- TRIGGERなし（UI層で「出力取り消し」機能を実装）
```

#### 整合性制約（定義B 2026-02-14確定）

- [ ] 4つのCHECK制約（技術的整合性のみ）

```sql
-- 1. exported_at と status の同期
ALTER TABLE journals ADD CONSTRAINT check_exported_sync CHECK (
  (status = 'exported' AND exported_at IS NOT NULL)
  OR (status != 'exported' AND exported_at IS NULL)
);

-- 2. メモの整合性
ALTER TABLE journals ADD CONSTRAINT check_memo_author CHECK (
  (memo IS NULL) 
  OR (memo IS NOT NULL AND memo_author IS NOT NULL)
);

-- 3. 削除の整合性
ALTER TABLE journals ADD CONSTRAINT check_deleted_by CHECK (
  (deleted_at IS NULL) 
  OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
);

-- 4. 出力対象外の理由
ALTER TABLE journals ADD CONSTRAINT check_export_exclude_reason CHECK (
  (export_exclude = FALSE)
  OR (export_exclude = TRUE AND export_exclude_reason IS NOT NULL)
);
```

**業務ルールは強制しない**:
- help/soudan/kakunin にメモは必須にしない（使用率1%以下）
- メモは任意ツール（口頭・チャットが主）

#### インデックス維持コスト（定義B 2026-02-14確定）

**規模**: 200社 × 年間1万仕訳 = 日間5,500仕訳

**維持コスト**:
- INSERT時: 約0.3-0.9ms/仕訳
- 日間コスト: 約5秒/日
- ストレージ: 約300MB

**判断**: すべてのクエリパターンにインデックス作成（維持コストは無視できる）

- [ ] `CREATE TABLE journal_rules`（新規テーブル）:
  ```sql
  CREATE TABLE journal_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    rule_name VARCHAR(100) NOT NULL,
    vendor_pattern VARCHAR(100),
    debit_account VARCHAR(50),
    credit_account VARCHAR(50),
    confidence NUMERIC(3, 2) DEFAULT 0.0,
    apply_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

**成果物**: `phase5_level3_ddl_260213.sql`

**重要**: レベル1-2のDDL（clientsテーブル等）はPhase 5.5で確定

### ステップ7: 詳細タスク分割
- [ ] Week 1タスク（Day 15-17: 事故フラグシステム）
  - [ ] Day 15: スキーマ拡張DDL実行
    - [ ] `journal_status` ENUM型作成
    - [ ] ❌ 廃止: `severity_level` ENUM型作成
      - ✅ 定義B: severity_level型は作成しない
    - [ ] `journals`テーブルにカラム追加
    - [ ] インデックス作成
    - [ ] ❌ 廃止: status遷移ルールのTRIGGER作成
      - ✅ 定義B: TRIGGER作成しない（UI層で制御）
    - [ ] 整合性制約（check_exported_sync等）作成
  - [ ] Day 16: 事故検知関数実装（API層）
    - [ ] 貸借不一致検知
    - [ ] 金額異常検知
    - [ ] 重複検知
    - [ ] 税矛盾検知
  - [ ] Day 17: UI実装（フロント）
    - [ ] 背景色管理（is_read: 黄色/白/グレー）
    - [ ] 要対応ラベル表示（NEED_DOCUMENT/NEED_CONFIRM/NEED_CONSULT）
    - [ ] 事故フラグアイコン表示
    - [ ] ソート機能
- [ ] Week 2タスク（Day 18-20: ルール見える化）
  - [ ] Day 18: journal_rulesテーブル実装
    - [ ] DDL実行
    - [ ] API作成（CRUD）
  - [ ] Day 19: ルール一致ロジック実装
    - [ ] ルール適用関数
    - [ ] 信頼度計算
  - [ ] Day 20: ルール一覧UI実装
    - [ ] ルール一覧画面
    - [ ] ルール適用結果表示
- [ ] Day 21: 統合テスト
  - [ ] ブラウザ実機テスト
  - [ ] バグ修正
- [ ] テストポイント特定
  - [ ] PostgreSQL CHECK制約テスト
  - [ ] ルール一致性能テスト
  - [ ] UI操作性テスト
- [ ] リスク分析
  - [ ] スキーマ変更の影響範囲
  - [ ] API性能劣化
  - [ ] UI複雑度

**成果物**: `phase5_level3_implementation_plan_260213.md`

---

#### Phase 5以降で実装すべき詳細

##### ゴミ箱の物理削除（バッチ処理）
- [ ] 30日後の物理削除を実装
  - [ ] PostgreSQL cron拡張
  - [ ] Cloudflare Workers
  - [ ] 手動スクリプト
- [ ] 削除前の通知の要否を決定

**SQL**:
```sql
DELETE FROM journals 
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

##### labels配列の検索方法
- [ ] PostgreSQL配列演算子の実装
  - [ ] `@>` (contains): 特定ラベルを持つレコード
  - [ ] `&&` (overlap): 複数ラベルOR検索
- [ ] フロントエンドでのフィルタリングUI

**SQL例**:
```sql
-- 特定ラベル検索
SELECT * FROM journals WHERE labels @> ARRAY['DEBIT_CREDIT_MISMATCH'];

-- 複数ラベルOR検索
SELECT * FROM journals WHERE labels && ARRAY['DEBIT_CREDIT_MISMATCH', 'TAX_CALCULATION_ERROR'];
```

##### 複数人同時編集の競合解決
- [ ] 楽観的ロック（updated_at）の実装
- [ ] 競合時のエラーメッセージ

**SQL**:
```sql
UPDATE journals SET ... 
WHERE id = ? AND updated_at = ?;
```

##### 履歴管理
- [ ] Firestoreイベントログで十分か検証
- [ ] PostgreSQLに履歴テーブルが必要か判断

---

### ステップ8: Phase 5実装開始
- [ ] Day 15から実装開始
- [ ] 計画に従って進行

---

## Phase 5.5（Day 22-28）：レベル1-2の実証設計

### レベル1（①顧問先一覧）の実証設計（Day 22-23）
- [ ] UIモック作成（Vue顧問先一覧）
  - [ ] `ClientListLevel1Mock.vue`コンポーネント作成
  - [ ] 顧問先名、未処理件数、ステータス表示
- [ ] 30件ダミー顧問先テスト
  - [ ] 所要時間、詳細遷移率を記録
- [ ] 摩擦箇所列挙
  - [ ] 情報不足、情報過多、判断曖昧を分類
- [ ] DDL確定（`clients`テーブル）
  - [ ] 必要カラムの型・制約決定
  - [ ] インデックス設計

**成果物**: `phase5.5_level1_ui_friction_report_260213.md`

### レベル2（②種別選択）の実証設計（Day 24-25）
- [ ] UIモック作成（Vue種別選択）
  - [ ] `ReceiptTypeSelectionLevel2Mock.vue`コンポーネント作成
  - [ ] 種別ボタン、件数表示
- [ ] 摩擦箇所列挙
  - [ ] ボタンの配置、ラベル、アイコンの適切性
- [ ] DDL確定（`receipt_source_type`）
  - [ ] ENUM型またはテーブル設計

**成果物**: `phase5.5_level2_ui_friction_report_260213.md`

### 統合DDL確定（Day 26-28）
- [ ] Phase 1.5の摩擦レポートを統合
  - [ ] レベル1、レベル2、レベル3の摩擦レポートを統合分析
- [ ] 完全なDDL作成
  - [ ] `clients`テーブル確定
  - [ ] `receipt_source_type`確定
  - [ ] `journals`テーブル（Phase 5で確定済み）との整合性確認
- [ ] マイグレーション計画
  - [ ] 段階的移行手順
  - [ ] ロールバック手順

**成果物**: `phase5.5_client_management_plan_260213.md`

---

## Phase 6（Day 29-35）：レベル1-2の実装

### Week 1（Day 29-31）：顧問先管理実装
- [ ] `clients`テーブル実装
  - [ ] DDL実行
  - [ ] シードデータ投入
- [ ] 顧問先一覧UI実装
  - [ ] `ClientListLevel1.vue`コンポーネント実装
  - [ ] API連携
- [ ] 未処理件数カウントロジック実装
  - [ ] 集計クエリ最適化
  - [ ] キャッシュ戦略

### Week 2（Day 32-34）：種別管理実装
- [ ] データソース種別実装
  - [ ] `receipt_source_type` ENUM実装
  - [ ] API作成
- [ ] 種別選択UI実装
  - [ ] `ReceiptTypeSelectionLevel2.vue`コンポーネント実装
  - [ ] 件数表示ロジック
- [ ] 統合テスト
  - [ ] レベル1→レベル2→レベル3の遷移テスト
  - [ ] パフォーマンステスト

### Day 35：完了判定
- [ ] 3階層すべて動作確認
  - [ ] レベル1（顧問先一覧）動作確認
  - [ ] レベル2（種別選択）動作確認
  - [ ] レベル3（仕訳一覧）動作確認
- [ ] ユーザーレビュー
  - [ ] フィードバック収集
  - [ ] 優先度付け

---

## 完了条件

- [x] プロジェクトファイルの整理完了
- [x] ブレインファイルのアーティファクト化完了
- [x] 3段階実証設計への更新完了
  - [x] Phase 1: 型・制約を確定しない
  - [x] Phase 1.5: UIモック検証を追加
  - [x] Phase 2: DDL確定をUIテスト後に移動
- [x] 定義B（協力型フロー）を正式採用
- [x] journal_v2_20260214.md 作成（定義B準拠）
- [ ] Phase 5完了：レベル3（③仕訳一覧）の事故監視UI完成
- [ ] Phase 5.5完了：レベル1-2のDDL確定
- [ ] Phase 6完了：3階層すべて実装完了

---

## 次のアクション

**現在のフォーカス**:
- [x] Phase 5ステップ1〜3.2a 完了
- [x] Phase 5ステップ3.2b-1 スキップ（AI画像生成では詳細UI再現が困難）
- [/] Phase 5ステップ3.2b-2（Vueコンポーネント実装）進行中
  - 型定義・フィクスチャ・Vueコンポーネントは作成済み
  - ローカル確認・修正が残っている
- [ ] **次**: Phase A-0（columns.ts導入）を先に実施 → `00_safe_mock_development_rules.md` 参照

---

## Phase体系の対応関係

本プロジェクトには2つのPhase体系がある：

| 安全フェーズ（`00_safe_mock_development_rules.md`） | 機能フェーズ（本ファイル） | 関係 |
|---|---|---|
| Phase A-0（準備） | ステップ3.2b-2の前準備 | columns.ts導入、unsafe隔離 |
| Phase A（UX探索） | ステップ3.2b-2-3〜ステップ4 | UIモック作成・30件テスト |
| Phase B（構造固定） | ステップ4完了後 | CellComponent分離、Factory必須化 |
| Phase C（Backend接続） | ステップ6 | DDL確定・Supabase接続 |

> 安全フェーズは「どう作るか」、機能フェーズは「何を作るか」の定義。

---

## 重要な設計思想の記録

### Phase Aの再定義（定義B準拠、2026-02-14）

#### 元の理解（2026-02-12時点）
- Phase Aは「すべてのカラムを確定する」フェーズ
- status 5つ、labels 9つを確定
- 確定後は変更しない

#### 修正理由
**Streamedアイコン分析の結果**:
- labels 9個では不足（17個必要）
- しかし「labelsは配列型で拡張可能」という原則は正しい

**ユーザーからの指摘**:
> 「ステータスとラベルの排他性は維持しつつ、内容を変更する。使わないものを維持してもシステム的に意味がない」

#### 新しい理解（定義B準拠、2026-02-14確定）
- Phase Aは「設計の原則を確立する」フェーズ
- **原則**: statusは排他的、labelsは非排他的
- **具体値**: labels数、カラム数は柔軟に拡張可能
- labels 9個 → 17個は「計画的拡張」（手戻りではない）
- status承認型 → 協力型も「原則に従った変更」

---

### 想像設計 vs 実証設計

**想像設計の失敗パターン**:
1. スクショを見て「このUIならこのカラムが必要」と推測
2. DDLを先に作成（`anomaly_flags TEXT[] DEFAULT '{}'`）
3. UIを実装したら「このカラムいらない」
4. migration地獄、Zod崩壊

**実証設計の成功パターン**:
1. スクショから概念モデル作成（型は曖昧）
2. UIモックで実際に触る（30件テスト）
3. 摩擦箇所を記録（情報不足、詳細遷移率）
4. UIテスト結果を元にDDL確定

**Phase 1.5の重要性**:
- Figmaは感覚が嘘をつく
- 実際のホバー、クリック、スクロールの摩擦を検証
- 詳細遷移率が30%超えたら設計失敗
- 色が信用できないなら定義を見直し（定義Bでis_read採用）

---

**最終更新**: 2026-02-19（safe_mock_development_rules統合）  
**次のアクション**: Phase A-0（columns.ts導入）→ Phase 5ステップ3.2b-2-4（ローカル確認）

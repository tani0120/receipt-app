# 仕訳一覧 ステータス・ラベル表示仕様書（改訂版）

**作成日**: 2026-02-15  
**最終更新**: 2026-02-15  
**対象画面**: 仕訳一覧（JournalListLevel3Mock.vue）  
**改訂内容**: ステータスをexportedのみに変更、ラベルに要対応3種類+出力制御1種類追加（合計21種類）

---

## ステータス（status）

CSV出力状態を表す。

| ステータス値 | 説明 |
|------------|------|
| `null` | 未出力（デフォルト） |
| `'exported'` | 出力済み（CSV出力完了、編集不可） |

### 表示ルール
- ステータスはUIに直接表示されない
- `exported`の場合、編集操作が禁止される

---

## ラベル（labels）

仕訳の属性を表す配列。複数ラベル同時付与可能。

### 証票種別（証票列）

| ラベル値 | 表示文字 | 色 | 説明 |
|---------|---------|-----|------|
| `TRANSPORT` | **領** | 黒（`text-gray-800`） | 交通費・領収書 |
| `RECEIPT` | **レ** | 黒（`text-gray-800`） | レシート |
| `INVOICE` | **請** | 黒（`text-gray-800`） | 請求書 |
| `CREDIT_CARD` | **ク** | 黒（`text-gray-800`） | クレジットカード |
| `BANK_STATEMENT` | **銀** | 黒（`text-gray-800`） | 銀行明細 |

**表示ルール**: 最初の1文字を太字で表示。複数ラベルがある場合は並べて表示。

---

### 学習ルール（学習列）

| ラベル値 | 表示アイコン | 色 | 説明 |
|---------|------------|-----|------|
| `RULE_APPLIED` | `fa-graduation-cap` 🎓 | 緑（`text-green-600`） | 学習ルール適用済み |
| `RULE_AVAILABLE` | `fa-lightbulb` 💡 | 青（`text-blue-500`） | 学習可能（ルール候補あり） |

**表示ルール**: 両方のラベルが同時に存在する場合、両方表示。

---

### 警告・エラー（警告列）

#### エラーレベル（赤）

| ラベル値 | 表示アイコン | 色 | 説明 |
|---------|------------|-----|------|
| `DEBIT_CREDIT_MISMATCH` | `fa-triangle-exclamation` ⚠️ | 赤（`text-red-600`） | 貸借不一致 |
| `TAX_CALCULATION_ERROR` | `fa-triangle-exclamation` ⚠️ | 赤（`text-red-600`） | 税額計算エラー |
| `AMOUNT_ANOMALY` | `fa-triangle-exclamation` ⚠️ | 赤（`text-red-600`） | 金額異常 |
| `MISSING_RECEIPT` | `fa-triangle-exclamation` ⚠️ | 赤（`text-red-600`） | 領収書欠落 |
| `OCR_FAILED` | `fa-triangle-exclamation` ⚠️ | 赤（`text-red-600`） | OCR失敗 |

#### 警告レベル（黄）

| ラベル値 | 表示アイコン | 色 | 説明 |
|---------|------------|-----|------|
| `DUPLICATE_SUSPECT` | `fa-triangle-exclamation` ⚠️ | 黄（`text-yellow-600`） | 重複疑い |
| `DATE_ANOMALY` | `fa-triangle-exclamation` ⚠️ | 黄（`text-yellow-600`） | 日付異常 |
| `OCR_LOW_CONFIDENCE` | `fa-triangle-exclamation` ⚠️ | 黄（`text-yellow-600`） | OCR信頼度低 |

**表示ルール**: エラーと警告の両方がある場合、両方表示。

---

### 軽減税率（軽減列）

| ラベル値 | 表示文字 | スタイル | 説明 |
|---------|---------|---------|------|
| `MULTI_TAX_RATE` | **軽** | 緑文字+緑背景（`text-green-600 bg-green-50`） | 軽減税率対象 |

**表示ルール**: バッジ形式で表示（角丸、パディング付き）。

---

### 適格請求書（適格列）

| ラベル値 | 表示アイコン | 色 | 説明 |
|---------|------------|-----|------|
| `INVOICE_QUALIFIED` | ◯ | 青（`text-blue-600`） | 適格請求書 |
| `INVOICE_NOT_QUALIFIED` | ✕ | 灰（`text-gray-400`） | 非適格 |

**表示ルール**: どちらか一方のみ表示。両方ない場合は空白。

---

### メモ（メモ列）

| ラベル値 | 表示アイコン | 色 | 説明 |
|---------|------------|-----|------|
| `HAS_MEMO` | 💬 | 青（`text-blue-600`） | メモあり |

**表示ルール**: メモがある場合のみ表示。

---

### 要対応（要対応列）

| ラベル値 | 表示アイコン | 未選択 | 選択時 | 説明 |
|---------|------------|--------|--------|------|
| `NEED_DOCUMENT` | 📄 | グレー（`text-gray-400`） | 赤（`text-red-600`） | 資料が必要 |
| `NEED_CONFIRM` | ✅ | グレー（`text-gray-400`） | 赤（`text-red-600`） | 確認が必要 |
| `NEED_CONSULT` | 💬 | グレー（`text-gray-400`） | 赤（`text-red-600`） | 相談が必要 |

**表示ルール**: 
- 3つのアイコンを常時表示
- クリックで選択/未選択をトグル
- 選択時はラベルに追加、未選択時はラベルから削除
- 複数同時選択可能（例: 資料と相談の両方）

---

### 出力制御（内部利用）

| ラベル値 | 説明 |
|---------|------|
| `EXPORT_EXCLUDE` | CSV出力対象外 |

**表示ルール**: UIには表示されない（内部判定用）

---

## UI表示仕様

### フォントサイズ

- **ヘッダー**: 10px
- **テーブルボディ**: 10px
- **No.列**: 9px
- **証票列文字**: 10px
- **軽減バッジ**: 9px
- **アイコン**: 10px

### 配置

- **ヘッダー**: 上下左右中央揃え（`flex items-center justify-center`）
- **テーブルボディ**: 基本10px、中央揃え
- **金額列**: 右揃え（`justify-end`）、等幅フォント（`font-mono`）

### 行背景色（未読/既読）

| 条件 | 背景色 | クラス |
|------|--------|--------|
| `is_read = false` | 黄色ハイライト | `bg-yellow-100` |
| `is_read = true` | 白 | `bg-white` |

**既読になる条件**:
1. **手動既読**: ユーザーが既読ボタンをクリック
2. **編集時自動既読**: 摘要、勘定科目、資助科目、税区分、金額を編集
3. **詳細画面表示時**: 行クリックで仕訳詳細画面に遷移した時点

---

## 複合仕訳のrowspan表示

### rowspan表示とは

**rowspan**は、複合仕訳（1対多、多対1、N対N）を表示する際に、借方・貸方の行数差を吸収する技術です。

### 例: 1対2の複合仕訳

**データ**:
- 借方: 旅費交通費 5,000円（1行）
- 貸方: 現金 3,000円 + クレジットカード 2,000円（2行）

**表示イメージ**:

```
┌────┬──────┬──────┬────┬──────┬────┐
│ No.│ 摘要 │借方科目│金額│貸方科目│金額│
├────┼──────┼──────┼────┼──────┼────┤
│ 5  │タクシー│旅費交通費│5,000│  現金 │3,000│
│(結合)│(結合)│(結合)│(結合)│クレカ │2,000│
└────┴──────┴──────┴────┴──────┴────┘
```

- 左側の列（No.、摘要、借方科目、借方金額）が**2行分に縦結合**
- これにより「1つの借方」と「2つの貸方」の関係が明確

### 実装ロジック

`JournalListLevel3Mock.vue`（540-546行）:

```typescript
function getCombinedRows(journal: JournalPhase5Mock): Array<{ debit: JournalEntryLine | null, credit: JournalEntryLine | null }> {
  const maxRows = Math.max(journal.debit_entries.length, journal.credit_entries.length);
  return Array.from({ length: maxRows }, (_, i) => ({
    debit: journal.debit_entries[i] || null,
    credit: journal.credit_entries[i] || null
  }));
}
```

---

## データ型定義

```typescript
// ステータス
type JournalStatus = 'exported';  // exportedのみ

// ラベル（21種類）
type JournalLabel = 
  // 証憑種類
  | 'TRANSPORT'
  | 'RECEIPT'
  | 'INVOICE'
  | 'CREDIT_CARD'
  | 'BANK_STATEMENT'
  // 学習ルール
  | 'RULE_APPLIED'
  | 'RULE_AVAILABLE'
  // 請求書
  | 'INVOICE_QUALIFIED'
  | 'INVOICE_NOT_QUALIFIED'
  // 税率
  | 'MULTI_TAX_RATE'
  // エラー
  | 'DEBIT_CREDIT_MISMATCH'
  | 'TAX_CALCULATION_ERROR'
  | 'AMOUNT_ANOMALY'
  | 'MISSING_RECEIPT'
  | 'OCR_FAILED'
  // 警告
  | 'DUPLICATE_SUSPECT'
  | 'DATE_ANOMALY'
  | 'OCR_LOW_CONFIDENCE'
  // 要対応
  | 'NEED_DOCUMENT'
  | 'NEED_CONFIRM'
  | 'NEED_CONSULT'
  // 出力制御
  | 'EXPORT_EXCLUDE'
  // メモ
  | 'HAS_MEMO';
```

---

## 列定義（22列）

1. **選**: チェックボックス
2. **No.**: 連番（1-30）
3. **写真**: カメラアイコン（`fa-camera`）
   - hover: 画像モーダル表示
   - click: モーダル固定（回転・ズーム・ドラッグ機能）
4. **過去仕訳**: 虫眼鏡アイコン（`fa-magnifying-glass`）
   - 過去の類似仕訳を検索・参照
   - 表示条件: `journalIndex < 25`（将来的にデータ駆動に変更予定）
5. **コメント**: ステータスアイコン
6. **要対応**: 3つのアイコン（📄 ✅ 💬）を常時表示
   - クリックで選択/未選択をトグル
   - 選択: 赤、未選択: グレー
7. **証票**: 証票種別文字（領/レ/請/ク/銀）
8. **警告**: 警告アイコン（⚠️ 赤/黄）
9. **学習**: 学習アイコン（🎓 緑/💡 青）
10. **軽減**: 軽減税率バッジ（**軽** 緑背景）
11. **メモ**: メモアイコン（✏️ 灰色）
12. **適格**: 適格請求書マーク（◯ 青/✕ 灰）
13. **取引日**: 日付（YY/MM/DD形式）
14. **摘要**: 説明文
15. **借方勘定科目**: 勘定科目名
16. **借方補助**: 補助科目
17. **借方税区分**: 税区分
18. **借方金額**: 金額（右揃え、カンマ区切り、等幅フォント）
19. **貸方勘定科目**: 勘定科目名
20. **貸方補助**: 補助科目
21. **貸方税区分**: 税区分
22. **貸方金額**: 金額（右揃え、カンマ区切り、等幅フォント）
23. **ゴミ箱**: 削除アイコン（`fa-trash`）

---

## ソート機能

以下の列はヘッダークリックでソート可能（昇順⇔降順トグル）:

- No., 写真, 過去仕訳, コメント, 要対応, 証票, 警告, 学習, 軽減, メモ, 適格, 取引日, 摘要, 借方勘定科目, 借方金額, 貸方勘定科目, 貸方金額

---

## 実装ファイル

- **コンポーネント**: [src/mocks/components/JournalListLevel3Mock.vue](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue)
- **型定義**: [src/mocks/types/journal_phase5_mock.type.ts](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts)
- **テストデータ**: [src/mocks/data/journal_test_fixture_30cases.ts](file:///c:/dev/receipt-app/src/mocks/data/journal_test_fixture_30cases.ts)

---

## 改訂履歴

- **2026-02-15 (v3)**: ステータスをexportedのみに変更、ラベルに要対応3個と出力制御1個を追加（21種類に更新）
- **2026-02-15 (v2)**: 写真列・過去仕訳列を追加（22列に更新）、rowspan表示仕様を追加
- **2026-02-15 (v1)**: 初版作成

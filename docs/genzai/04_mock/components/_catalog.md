# UIコンポーネントカタログ

## 概要

Phase 5 仕訳一覧モックで実装されたUIコンポーネント（モーダル等）の一覧。

## 実装済みコンポーネント

### 1. 過去仕訳検索モーダル

| 項目 | 内容 |
|------|------|
| 名前 | PastJournalSearchModal |
| トリガー | 「過去仕訳」列の🔍アイコン（ホバー or クリック） |
| サイズ | 600px × 600px |
| 機能 | 過去仕訳の検索・絞り込み |
| 状態 | ✅ 実装完了 |
| 仕様書 | [past_journal_search_modal.md](file:///C:/dev/receipt-app/docs/genzai/04_mock/components/past_journal_search_modal.md) |

**主な機能**:
- 摘要、日付範囲、金額条件、勘定科目による絞り込み
- 出力状態フィルタ（未出力/出力済み）
- ページネーション（50件/ページ）
- ピン留め機能（モーダルを固定）
- タブ切り替え（システム上の過去仕訳 / 会計ソフト）

### 2. レシート画像モーダル

| 項目 | 内容 |
|------|------|
| 名前 | ReceiptImageModal |
| トリガー | 「写真」列の📷アイコン（ホバー or クリック） |
| サイズ | 400px × 500px |
| 機能 | レシート画像の表示 |
| 状態 | ✅ 実装完了 |
| 仕様書 | （今後作成予定） |

**主な機能**:
- レシート画像の拡大表示
- ピン留め機能
- 複数画像の切り替え（今後実装予定）

## 未実装コンポーネント

### 3. 仕訳詳細編集モーダル

| 項目 | 内容 |
|------|------|
| 名前 | JournalEditModal |
| トリガー | 行クリック or 編集ボタン |
| サイズ | 800px × 600px |
| 機能 | 仕訳の詳細表示・編集 |
| 状態 | ⏳ 未実装 |

**予定機能**:
- 複合仕訳の編集（N対N）
- ステータス変更（定義B: exported / null — 2026-02-14確定）
- メモの追加・編集
- ラベルの追加・削除

### 4. メモ詳細モーダル

| 項目 | 内容 |
|------|------|
| 名前 | MemoDetailModal |
| トリガー | サポート列のアイコンホバー |
| サイズ | 300px × 200px |
| 機能 | メモの詳細表示 |
| 状態 | ⏳ 未実装 |

**予定機能**:
- メモ内容の表示
- メモ作成者・対象者の表示
- メモ作成日時

### 5. CSV出力確認モーダル

| 項目 | 内容 |
|------|------|
| 名前 | ExportConfirmModal |
| トリガー | CSV出力ボタン |
| サイズ | 400px × 300px |
| 機能 | CSV出力の確認 |
| 状態 | ⏳ 未実装 |

**予定機能**:
- 出力件数の確認
- 出力対象外の除外確認
- 出力後のステータス変更警告

## 共通実装パターン

### ホバー＋ピン留めパターン

すべてのモーダルは以下のパターンを採用:

1. **ホバー**: アイコンにマウスホバーでモーダル表示
2. **ピン留め**: アイコンクリックでピン留め
3. **マウスアウト**: ピン留めしていない場合は閉じる
4. **閉じるボタン**: ×ボタンでピン解除＋閉じる

### 状態管理

```typescript
const showModal = ref<boolean>(false);        // 表示/非表示
const isModalPinned = ref<boolean>(false);    // ピン留め状態
```

### イベントハンドラ

```typescript
function showModal() { ... }                  // モーダル表示
function hideModal() { ... }                  // モーダル非表示（ピン留め時は無効）
function toggleModalPin() { ... }             // ピン留めトグル
function closeModal() { ... }                 // 閉じる＋ピン解除
```

## スタイルガイドライン

### モーダルコンテナ

```vue
<div class="bg-white rounded-lg shadow-2xl w-[Wpx] h-[Hpx] flex flex-col pointer-events-auto border-2 border-gray-300">
```

### ヘッダー

```vue
<div class="flex items-center justify-between p-3 border-b">
  <h3 class="text-sm font-bold">[タイトル]</h3>
  <div class="flex items-center gap-2">
    <span class="cursor-pointer text-lg">📌</span>
    <button class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
  </div>
</div>
```

### コンテンツエリア

```vue
<div class="flex-1 overflow-auto p-4">
  <!-- コンテンツ -->
</div>
```

## 本番実装時の変更点

### Pinia統合

各モーダルごとに専用のストアを作成:

```
stores/
├── pastJournalSearch.ts      # 過去仕訳検索モーダル
├── receiptImage.ts            # レシート画像モーダル
├── journalEdit.ts             # 仕訳編集モーダル
└── memoDetail.ts              # メモ詳細モーダル
```

### コンポーネント分離

モックでは`JournalListLevel3Mock.vue`に全て含まれているが、本番では分離:

```
components/
├── JournalList.vue            # メインコンポーネント
├── modals/
│   ├── PastJournalSearchModal.vue
│   ├── ReceiptImageModal.vue
│   ├── JournalEditModal.vue
│   └── MemoDetailModal.vue
└── common/
    ├── Modal.vue              # 共通モーダルコンポーネント
    └── PinButton.vue          # ピン留めボタン
```

### API連携

各モーダルで必要なAPIエンドポイント:

| モーダル | API |
|---------|-----|
| 過去仕訳検索 | `GET /api/journals/search` |
| レシート画像 | `GET /api/receipts/:id/image` |
| 仕訳編集 | `PUT /api/journals/:id` |
| メモ詳細 | `GET /api/journals/:id/memo` |

## 関連ドキュメント

- [UIコンポーネント管理戦略](file:///C:/Users/kazen/.gemini/antigravity/brain/9563cf91-6a77-4f50-949d-38ed9eae1fa6/ui_component_management_strategy.md)


# 過去仕訳検索モーダル仕様書

## 基本情報

| 項目 | 内容 |
|------|------|
| コンポーネント名 | PastJournalSearchModal |
| ファイルパス | `src/mocks/components/JournalListLevel3Mock.vue` |
| 作成日 | 2026-02-15 |
| 最終更新 | 2026-02-19 |

## 目的

過去の仕訳データを検索・絞り込みするためのモーダルウィンドウ

## トリガー条件

1. 「過去仕訳」列の🔍アイコンにマウスホバー → モーダル表示
2. 🔍アイコンをクリック → ピン留め（マウスアウトしても閉じない）
3. ×ボタンクリック → 閉じる＋ピン解除

## UIレイアウト

### サイズ
- 幅: 600px
- 高さ: 600px
- 背景: 白、影付き、角丸、ボーダー（2px, gray-300）

### 配置
- 🔍アイコンの右側に表示
- z-index: 50（他の要素より前面）

### 内部構成

#### 1. ヘッダー
- タイトル: 「過去仕訳検索」
- 閉じるボタン（×）
- 📌ピン留めアイコン

#### 2. タブ
- 「システム上の過去仕訳」（デフォルト、実装済み）
- 「会計ソフトの過去仕訳」（未実装）

#### 3. 検索フォーム
- **摘要**（テキスト入力）
- **日付範囲**（type="date"入力、デフォルト: 過去3ヶ月〜今日）
- **金額条件**（条件プルダウン + 数値入力）
  - 条件: 選択してください / 等しい / 以上 / 以下
- **借方勘定科目**（プルダウン）
- **貸方勘定科目**（プルダウン）
- **絞り込みボタン**

#### 4. フィルタボタン（2026-02-19追加）
- **未出力**ボタン: status=null の仕訳のみ表示（背景: 薄青）
- **出力済み**ボタン: status='exported' の仕訳のみ表示（背景: 白）
- トグル式（再クリックで解除、全件表示に戻る）

#### 5. ページネーション（2026-02-19追加）
- 50件/ページ
- ページ番号ボタンで遷移

#### 6. 結果表示テーブル
列構成:
- 日付
- 摘要
- 借方勘定科目
- 借方補助科目
- 借方税区分
- 貸方勘定科目
- 貸方補助科目
- 貸方税区分
- 証憑種別

## 機能仕様

### 検索・絞り込み

| フィルタ | 動作 | 実装 |
|---------|------|------|
| 摘要 | 摘要（`description`）に部分一致検索 | ✅ |
| 日付範囲 | `transaction_date`が指定期間内 | ✅ |
| 金額 | 等しい・以上・以下で絞り込み（借方・貸方の合計額） | ✅ |
| 借方勘定科目 | `debit_entries`に完全一致するエントリが存在 | ✅ |
| 貸方勘定科目 | `credit_entries`に完全一致するエントリが存在 | ✅ |

### 状態管理

```typescript
const showPastJournalModal = ref<boolean>(false);                          // モーダル表示/非表示
const isPastJournalModalPinned = ref<boolean>(false);                      // ピン留め状態
const pastJournalTab = ref<'streamed' | 'accounting'>('streamed');         // 選択タブ
const outputStatusFilter = ref<'unexported' | 'exported' | null>(null);    // 出力状態フィルタ
const currentPage = ref(1);                                                 // ページネーション
const pageSize = 50;                                                        // 1ページあたり件数
const pastJournalSearch = ref({
  vendor: '',                                                               // 摘要
  dateFrom: getThreeMonthsAgoString(),                                      // 開始日（過去3ヶ月）
  dateTo: getTodayString(),                                                 // 終了日（今日）
  amountCondition: '',                                                      // 金額条件
  amount: { condition: '', value: null as number | null },                   // 金額（条件+値）
  debitAccount: '',                                                         // 借方勘定科目
  creditAccount: ''                                                         // 貸方勘定科目
});
```

### イベントハンドラ

| 関数名 | 動作 |
|--------|------|
| `showPastJournalSearchModal()` | モーダル表示 |
| `hidePastJournalSearchModal()` | モーダル非表示（ピン留め時は無効） |
| `togglePastJournalSearchModalPin()` | ピン留めトグル＋検索条件リセット |
| `closePastJournalModal()` | モーダル閉じる＋ピン解除＋検索条件リセット |

### フィルタリングロジック

```typescript
const filteredPastJournals = computed(() => {
  let results = mockJournalsPhase5;

  // 支払先フィルタ
  if (pastJournalSearch.value.vendor) {
    results = results.filter(j =>
      j.description.includes(pastJournalSearch.value.vendor)
    );
  }

  // 日付範囲フィルタ
  if (pastJournalSearch.value.dateFrom) {
    results = results.filter(j => j.transaction_date >= pastJournalSearch.value.dateFrom);
  }
  if (pastJournalSearch.value.dateTo) {
    results = results.filter(j => j.transaction_date <= pastJournalSearch.value.dateTo);
  }

  // 金額フィルタ
  if (pastJournalSearch.value.amount !== null && pastJournalSearch.value.amountCondition) {
    results = results.filter(j => {
      const debitTotal = j.debit_entries.reduce((sum, e) => sum + e.amount, 0);
      const creditTotal = j.credit_entries.reduce((sum, e) => sum + e.amount, 0);
      const amount = Math.max(debitTotal, creditTotal);

      switch (pastJournalSearch.value.amountCondition) {
        case 'equal': return amount === pastJournalSearch.value.amount;
        case 'greater': return amount >= (pastJournalSearch.value.amount || 0);
        case 'less': return amount <= (pastJournalSearch.value.amount || 0);
        default: return true;
      }
    });
  }

  // 借方勘定科目フィルタ
  if (pastJournalSearch.value.debitAccount) {
    results = results.filter(j =>
      j.debit_entries.some(e => e.account === pastJournalSearch.value.debitAccount)
    );
  }

  // 貸方勘定科目フィルタ
  if (pastJournalSearch.value.creditAccount) {
    results = results.filter(j =>
      j.credit_entries.some(e => e.account === pastJournalSearch.value.creditAccount)
    );
  }

  // タブによる表示制御
  if (pastJournalTab.value === 'accounting') {
    return [];  // 会計ソフトデータは未実装
  }

  return results;
});
```

## データソース

### モック段階（現在）
- `mockJournalsPhase5`（journal_test_fixture_30cases.ts）

### 本番実装時
API: `GET /api/journals/search`

**リクエストパラメータ**:
```typescript
{
  client_id: string;           // 顧問先ID（必須）
  vendor?: string;             // 支払先（任意）
  date_from?: string;          // 開始日（YYYY-MM-DD、任意）
  date_to?: string;            // 終了日（YYYY-MM-DD、任意）
  amount_condition?: string;   // 金額条件（equal/greater/less、任意）
  amount?: number;             // 金額（任意）
  debit_account?: string;      // 借方勘定科目（任意）
  credit_account?: string;     // 貸方勘定科目（任意）
  limit?: number;              // 取得件数（デフォルト: 100）
  offset?: number;             // オフセット（ページネーション用）
}
```

**レスポンス**:
```typescript
{
  journals: Journal[];
  total: number;
  page: number;
  per_page: number;
}
```

## スタイル定義

### モーダルコンテナ
```vue
<div class="bg-white rounded-lg shadow-2xl w-[600px] h-[600px] flex flex-col pointer-events-auto border-2 border-gray-300">
```

### ヘッダー
```vue
<div class="flex items-center justify-between p-3 border-b">
  <h3 class="text-sm font-bold">過去仕訳検索</h3>
  <div class="flex items-center gap-2">
    <span class="cursor-pointer text-lg">📌</span>
    <button class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
  </div>
</div>
```

### タブ
```vue
<div class="flex border-b">
  <button :class="['px-4 py-2 text-xs font-medium', pastJournalTab === 'streamed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600']">
    システム上の過去仕訳
  </button>
</div>
```

## エッジケース・制約

| ケース | 動作 |
|--------|------|
| 日付範囲が空 | すべての仕訳を表示 |
| 金額が0 | 0円の仕訳のみ表示 |
| 検索結果が0件 | 「検索結果がありません」表示 |
| 会計ソフトタブ選択 | 「会計ソフトから取り込んだ過去仕訳はありません」表示 |
| 複数フィルタ組み合わせ | AND条件で絞り込み |

## スクリーンショット

### 初期表示
![過去仕訳検索モーダル初期表示](file:///C:/Users/kazen/.gemini/antigravity/brain/9563cf91-6a77-4f50-949d-38ed9eae1fa6/verification_1771146783412.png)

## 本番実装時の変更点

### 追加が必要な機能

1. ~~**ページネーション**~~ → ✅ モック実装済み（50件/ページ、ページ番号ボタン）

2. **ソート機能**
   - 各列ヘッダーをクリックでソート
   - 日付、金額優先

3. **詳細表示**
   - 行クリックで仕訳詳細モーダル
   - 編集・削除は不可（過去仕訳のため）

4. **CSV出力**
   - 検索結果のエクスポート
   - ファイル名: `past_journals_{yyyyMMdd_HHmmss}.csv`

5. **保存した検索条件**
   - よく使う検索条件を保存
   - プルダウンから選択して適用

### API連携実装

```typescript
// src/api/pastJournalSearch.ts
async function searchPastJournals(params: SearchParams): Promise<SearchResult> {
  const { data, error } = await supabase
    .from('journals')
    .select(`
      *,
      debit_entries:journal_entries!journal_id(*),
      credit_entries:journal_entries!journal_id(*)
    `, { count: 'exact' })
    .eq('client_id', params.client_id)
    .gte('transaction_date', params.date_from)
    .lte('transaction_date', params.date_to)
    .range(params.offset, params.offset + params.limit - 1);

  if (error) throw error;

  return {
    journals: data as Journal[],
    total: count || 0,
    page: Math.floor(params.offset / params.limit) + 1,
    per_page: params.limit
  };
}
```

### 状態管理（Pinia）

```typescript
// stores/pastJournalSearch.ts
export const usePastJournalSearchStore = defineStore('pastJournalSearch', {
  state: () => ({
    isVisible: false,
    isPinned: false,
    searchParams: {
      vendor: '',
      dateFrom: getThreeMonthsAgoString(),
      dateTo: getTodayString(),
      amountCondition: '',
      amount: null,
      debitAccount: '',
      creditAccount: ''
    },
    results: [] as Journal[],
    total: 0,
    currentPage: 1
  }),
  actions: {
    async search() {
      const data = await searchPastJournals({
        client_id: useAuthStore().currentClientId,
        ...this.searchParams,
        limit: 100,
        offset: (this.currentPage - 1) * 100
      });
      this.results = data.journals;
      this.total = data.total;
    },
    togglePin() {
      this.isPinned = !this.isPinned;
      if (!this.isPinned) {
        this.resetSearch();
      }
    },
    close() {
      this.isVisible = false;
      this.isPinned = false;
      this.resetSearch();
    },
    resetSearch() {
      this.searchParams = {
        vendor: '',
        dateFrom: getThreeMonthsAgoString(),
        dateTo: getTodayString(),
        amountCondition: '',
        amount: null,
        debitAccount: '',
        creditAccount: ''
      };
      this.results = [];
      this.total = 0;
      this.currentPage = 1;
    }
  }
});
```

## 関連ドキュメント

- [実装Walkthrough](file:///C:/dev/receipt-app/docs/genzai/04_mock/walkthroughs/past_journal_modal_walkthrough.md)
- [検索機能強化](file:///C:/dev/receipt-app/docs/genzai/04_mock/walkthroughs/search_enhancement_walkthrough.md)
- [フィルタ修正](file:///C:/dev/receipt-app/docs/genzai/04_mock/walkthroughs/filter_fixes_walkthrough.md)
- [JournalListLevel3Mock.vue](file:///C:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue)

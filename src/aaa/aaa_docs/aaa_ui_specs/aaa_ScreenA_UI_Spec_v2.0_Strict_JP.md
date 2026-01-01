# スクリーンA (顧問先管理一覧) UI設計書 v3.0 - 完全自立版

**対象:** 顧問先管理機能 (一覧および詳細、登録・編集)
**準拠レベル:** Strict (ソースコード参照禁止・本書のみで再現可能であること)

---

## 1. 画面構成 (Overview)

本機能は「一覧画面 (List View)」と「詳細画面 (Detail View)」、および「モーダル (Modal)」で構成される。

### 1-1. ルーティング定義
- **一覧:** `#/mirror_clients`
- **詳細:** `#/mirror_clients/:id` (例: `1001`)

---

## 2. 一覧画面 (List View) 仕様

### 2-1. レイアウト構造
- **ルートコンテナ:**
    - クラス: `h-full flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden`
    - アニメーション: `animate-fade-in` (0.4s ease-out)

### 2-2. ヘッダーエリア (Top Bar)
- **背景:** `bg-slate-50`
- **パディング:** `p-4`
- **ボーダー:** `border-b border-gray-200`
- **タイトル:**
    - アイコン: `fa-users` (text-blue-500)
    - テキスト: "顧問先管理一覧" (font-bold text-slate-700 text-sm)

- **フィルター群 (右側配置):**
    1.  **ステータス切り替え (Button Group):**
        - コンテナ: `bg-gray-200 rounded p-1 gap-1 flex`
        - **全て:** `px-3 py-1 text-xs font-bold rounded` (Active: `bg-white shadow text-slate-700`, Inactive: `text-gray-500 hover:text-gray-700`)
        - **稼働中:** Active: `bg-blue-600 text-white shadow`
        - **停止中:** Active: `bg-red-500 text-white shadow`
    2.  **検索ボックス:**
        - アイコン: `fa-search` (absolute left-2 top-2 text-gray-400 text-xs)
        - 入力欄: `pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded w-64 focus:border-blue-500`
        - プレースホルダー: "会社名 / ID で検索"
    3.  **新規登録ボタン:**
        - クラス: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold shadow-md flex items-center gap-2`
        - アイコン: `fa-plus`
        - テキスト: "新規顧問先登録"

### 2-3. テーブル (Data Table)
- **コンテナ:** `overflow-auto flex-1 p-0`
- **テーブルタグ:** `w-full text-left border-collapse`

#### ヘッダー (Thead)
- スタイル: `bg-slate-100 text-gray-500 text-xs uppercase sticky top-0 z-10 shadow-sm`
- **カラム定義:**
    1. **設定状況** (w-24, center): `p-3 border-b font-bold`
    2. **3コード** (w-24): `p-3 border-b font-bold`
    3. **会社名**: `p-3 border-b font-bold`
    4. **担当** (w-32): `p-3 border-b font-bold`
    5. **連絡** (w-16, center): `p-3 border-b font-bold`
    6. **決算月** (w-24): `p-3 border-b font-bold`
    7. **ソフト/税/基準** (w-40): `p-3 border-b font-bold`
    8. **Drive連携**: `p-3 border-b font-bold`
    9. **編集** (w-16, center): `p-3 border-b font-bold`

#### ボディ (Tbody)
- スタイル: `divide-y divide-gray-100 text-xs`
- **行スタイル (Row):**
    - 基本: `transition group`
    - 稼働中: `hover:bg-blue-50/30`
    - 停止中: `bg-red-50 hover:bg-red-100/50`

- **セル詳細:**
    1. **設定状況:**
        - 稼働中: `bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200`
        - 停止中: `bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-red-600`
    2. **3コード:** `font-mono font-bold text-slate-500`
    3. **会社名:**
        - リンクスタイル: `font-bold text-blue-600 hover:underline text-sm flex items-center gap-2`
        - 右横アイコン: `fa-arrow-up-right-from-square text-[10px]`
    4. **担当:** テキスト表示
    5. **連絡:**
        - Chatwork: `fa-brands fa-rocketchat` (text-red-500 text-lg)
        - Email: `fa-regular fa-envelope` (text-blue-500 text-lg)
    6. **決算月:** `{month}月決算` (font-bold)
    7. **ソフト/税/基準:**
        - 上段: ソフト名 (text-gray-500)
        - 下段: 税区分 / 端数処理
    8. **Drive連携:**
        - コンテナ: `flex flex-wrap gap-x-3 gap-y-1`
        - リンク共通: `drive-link-compact` (flex, items-center, gap-2px, text-[10px], text-blue-600)
        - アイコン: `fa-folder-open` (顧客保管), `fa-file-export` (仕訳出力), `fa-trash-can` (除外/gray), `fa-book` (過去/purple)
    9. **編集:**
        - ボタン: `text-gray-400 hover:text-blue-600` (fa-pen)

---

## 3. モーダル (Modal) 仕様

### 3-1. 新規/編集 共通レイアウト
- **オーバーレイ:** `fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm`
- **ウィンドウ:** `bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in`

### 3-2. ヘッダー
- 背景: `bg-slate-50`
- ボーダー: `border-b border-gray-200`
- パディング: `px-6 py-4`
- タイトル: `font-bold text-slate-700 text-lg` ("新規顧問先登録" or "顧問先編集")
- 閉じるボタン: 右上 `text-gray-400 hover:text-gray-600` (fa-times)

### 3-3. フォームコンテンツ
- パディング: `p-6`
- **グリッド:** `grid grid-cols-12 gap-6`

- **入力フィールド共通:**
    - ラベル: `block text-xs font-bold text-gray-500 uppercase mb-1`
    - 入力欄: `w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2`

- **フィールド構成:**
    1. **基本情報セクション (col-span-12):**
        - 会社名 (required)
        - クライアントコード (w-32, font-mono)
    2. **詳細設定 (col-span-6):**
        - 会計ソフト (Select: freee, MJS, 弥生)
        - 決算月 (Select: 1-12)
    3. **担当情報 (col-span-6):**
        - 担当者名
        - 連絡先 (Input)

### 3-4. フッター
- スタイル: `bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200`
- **左側:** 削除ボタン (編集時のみ, text-red-500 hover:text-red-700 text-sm font-bold)
- **右側:**
    - キャンセル: `text-gray-700 hover:text-gray-900 font-bold px-4`
    - 保存: `bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow`

---

## 4. 詳細画面 (Detail View) 仕様

### 4-1. レイアウト
- **ヘッダーバー:** 一覧と同様のデザインだが、タイトルが「顧問先詳細: {会社名}」
- **戻るボタン:** ヘッダー左端 (fa-arrow-left, text-gray-500 hover:text-blue-600)

### 4-2. コンテンツエリア
- **コンテナ:** `p-6 bg-gray-50 h-full overflow-auto`
- **カード:** `bg-white rounded-lg shadow p-6 mb-6 max-w-4xl mx-auto`
    - **タイトル:** `text-xl font-bold text-slate-800 mb-4 border-b pb-2` ("基本情報")
    - **データ表示:** Key-Value形式 (`grid grid-cols-2 gap-4`)
        - ラベル: `text-xs text-gray-400 font-bold uppercase`
        - 値: `text-sm font-bold text-slate-700`

---

## 5. モックデータ定義 (Immutable Mock Data)

```json
[
  {
    "code": "1001", "name": "株式会社エーアイシステム", "rep": "佐藤 健太", "isActive": true,
    "contact": { "type": "chatwork", "value": "https://chatwork.com" },
    "fiscalMonth": 3,
    "settings": { "software": "freee", "taxMethod": "税込", "calcMethod": "切捨" }
  },
  {
    "code": "1002", "name": "合同会社ベータ企画", "rep": "鈴木 一郎", "isActive": true,
    "contact": { "type": "email", "value": "test@example.com" },
    "fiscalMonth": 12,
    "settings": { "software": "マネーフォワード", "taxMethod": "税抜", "calcMethod": "四捨五入" }
  },
  {
    "code": "1003", "name": "Gamma Holdings", "rep": "高橋 まり", "isActive": false,
    "contact": { "type": "none", "value": "" },
    "fiscalMonth": 6,
    "settings": { "software": "弥生会計", "taxMethod": "税込", "calcMethod": "切捨" }
  }
]
```

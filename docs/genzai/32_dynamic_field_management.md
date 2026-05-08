# 32. フィールド動的管理 — インラインUI・ラベル一元化・連絡先テーブル動的列

## 概要

`ClientEditPage.vue` のフィールド管理を動的化した。
フィールドの追加・非表示・ラベル編集・コピーをレイアウト編集モードでインラインに行える。
連絡先テーブルの列も動的に管理可能にした。

## 対象ファイル

| ファイル | 役割 | 変更内容 |
|---|---|---|
| `DraggableFieldGrid.vue` | フィールド配置コンポーネント | ラベル一元管理・コピーボタン・＋追加ボタン追加 |
| `ClientEditPage.vue` | 顧問先編集画面 | 全slot（約50箇所）からlabel削除・AddFieldModal統合 |
| `AddFieldModal.vue` | **新規** フィールド追加専用モーダル | ラベル名・型・セクション入力のみ |
| `CustomFieldModal.vue` | フィールド管理モーダル（一覧） | タブ分け廃止→統一一覧・内部キー非表示 |
| `ContactTable.vue` | 連絡先テーブル | 動的列管理・ヘッダー編集・列追加 |
| `useFieldLayout.ts` | レイアウト管理composable | `addDynamicField`/`removeDynamicField` 追加 |
| `repositories/types.ts` | データ型定義 | `ClientContact.extra` 追加（動的列データ格納） |

---

## 設計判断

### ラベル管理責任の一元化（案B採用）

**問題**: slotコンテンツにscoped CSSが適用されない（Vue仕様）ため、DFGの`.dfg-editing .ce-field > label { display: none }`が効かず、ラベルが二重表示された。

**案Aの却下理由**:
`:deep()`セレクタでslot内のlabelを「隠す」だけ。DOM上にラベルが2つ存在する状態は変わらない。管理責任がDFGとClientEditPageの2箇所に分散し、変更時に常に2箇所修正が必要になる。場当たり的な技術的負債。

**案B（採用）**:
DFGが常にラベルを描画。ClientEditPageの全slot（約50箇所）から`<label>{{ field.label }}</label>`を削除。ラベルの描画責任がDFG1箇所に集約される。

```
変更前:
  DFG: [ドラッグハンドル] [ラベル編集input(v-if編集時)] [slot(ラベル+値)]
  → 編集時: inputとslot内labelが二重表示

変更後:
  DFG: [ドラッグハンドル] [ラベルエリア(input or label)] [slot(値のみ)]
  → ラベルは常にDFGが描画。slotは値だけ
```

### フィールド追加モーダルの分離

**問題**: DFGの＋ボタンが`showCustomFieldModal = true`でフィールド管理一覧モーダルを開いていた。追加したいだけなのに一覧が出る=UX不良。

**解決**: `AddFieldModal.vue`を新規作成。ラベル名・型・セクションの3入力のみのシンプルモーダル。追加後は即座にlayout.fieldsに反映されて画面に表示される。フィールド管理モーダル（一覧確認・一括操作用）とは別コンポーネントとして並立。

### 連絡先テーブルの動的列管理

**問題**: 5列（担当者名/連絡種別/連絡先/自由記載/連絡先備考）がハードコード。列ラベルの編集も列の追加/削除も不可。

**解決**:

```typescript
// 列定義（動的配列）
interface ContactColumn {
  key: string;          // 内部キー（不変）
  label: string;        // 表示ラベル（変更可能）
  type: 'text' | 'select' | 'textarea';
  options?: string[];   // select型の場合の選択肢
  isDefault?: boolean;  // デフォルト5列フラグ
}

// データ型拡張
interface ClientContact {
  name: string;
  method: string;
  value: string;
  usage: string;
  memo: string;
  extra?: Record<string, string>;  // 追加列データ
}
```

- **ヘッダー編集**: ダブルクリックでinputに切替
- **列追加**: ヘッダー右端の＋ボタン
- **セル編集**: ダブルクリックでinputに切替（isEditing依存なし）
- **データ構造**: 固定5列は既存フィールド、追加列は`extra`に格納

---

## DraggableFieldGrid テンプレート構造

```html
<div class="dfg-item">
  <!-- ドラッグハンドル（編集時のみ） -->
  <div v-if="isLayoutEditing" class="dfg-handle">...</div>

  <!-- ラベル（DFGが常に管理） -->
  <div class="dfg-label-area">
    <input v-if="isLayoutEditing" :value="field.label" class="dfg-label-input"
           @blur="onLabelBlur" @keydown.enter="blur">
    <label v-else class="dfg-label">{{ field.label }}</label>
  </div>

  <!-- コピーボタン（通常時、常時薄く表示） -->
  <button v-if="!isLayoutEditing" class="dfg-copy-btn" @click="copyFieldValue">
    <i class="fa-regular fa-copy"></i>
  </button>

  <!-- フィールド本体（スロット＝値のみ） -->
  <div class="dfg-content">
    <slot :name="field.key" :field="field">...</slot>
  </div>

  <!-- 非表示ボタン（編集時） -->
  <button v-if="isLayoutEditing" class="dfg-hide-btn">×</button>
</div>

<!-- セクション末尾: ＋フィールド追加ボタン -->
<button v-if="isLayoutEditing" class="dfg-add-field-btn" @click="emit('add-field')">
  ＋ フィールド追加
</button>
```

### emit一覧

| イベント | 引数 | 用途 |
|---|---|---|
| `update:order` | `keys: string[]` | ドラッグ並替 |
| `update:width` | `key, widthPercent` | 横幅変更 |
| `update:lineBreak` | `key, value` | 行区切り |
| `update:sectionHeight` | `height` | セクション高さ |
| `hide-field` | `key` | 非表示 |
| `label-edit` | `key, newLabel` | ラベル編集 |
| `add-field` | なし | フィールド追加モーダル表示 |

---

## useFieldLayout 追加API

| 関数 | 引数 | 用途 |
|---|---|---|
| `addDynamicField` | `FieldDef` | カスタムフィールドをfields配列に動的追加 |
| `removeDynamicField` | `fieldKey: string` | カスタムフィールドをfields配列から削除 |
| `updateLabelOverride` | `fieldKey, newLabel` | ラベル上書き（内部キーは不変） |
| `toggleFieldVisibility` | `fieldKey, visible` | 非表示切替（データは保持） |

### フィールドキー設計

- **既存フィールド**: 意味のある英字キー（`status`, `type`, `staffId`等）。不変。
- **カスタムフィールド**: `custom_{timestamp}_{乱数}` 形式のUUID。ラベルのみ変更可能。
- **ラベル変更**: `labelOverrides`辞書で管理。内部キーは変わらない。

---

## コピーボタン

- **表示**: 通常モード時、各フィールドの右上に常時薄く表示（opacity: 0.3）
- **ホバー**: opacity: 0.7
- **クリック**: DOMからフィールドの表示テキストを取得→`navigator.clipboard.writeText()`
- **フィードバック**: コピー後0.8秒間、緑色に変化（`.dfg-copied`クラス）
- **レイアウト編集時**: 非表示（`v-if="!isLayoutEditing"`）

---

## 自動取得フィールドの扱い

`alwaysReadonly`フラグ付きフィールドは以下の制限:

| 操作 | 可否 | 理由 |
|---|---|---|
| 追加 | ✗ | システム自動管理 |
| 編集 | ✗ | 値はシステムが生成 |
| コピー | ✓ | コピーボタンで対応 |
| 非表示 | ✓ | ×ボタンで対応 |
| ラベル変更 | ✓ | ラベルは表示用 |

対象: `clientId`(内部ID), `sharedEmail`(ログインメール), `accountingSoftwareDisplay`(会計ソフト表示)

---

## 今後の対応項目

| 項目 | 状態 | 備考 |
|---|---|---|
| 連絡先テーブル列削除 | 未実装 | 追加のみ実装済。削除UIの要件確認必要 |
| カスタムフィールドの値入力UI | 部分対応 | slot未定義のフィールドはデフォルトフォールバック（—表示）。型に応じたinput描画が必要 |
| フィールド追加のインライン化 | 未実装 | 現在はモーダル方式。使い心地確認後にインライン化を検討 |
| Supabase移行 | 未実装 | 現在localStorage保存。`field_layout_versions`テーブルへの移行準備完了 |
| 連絡先テーブル列定義の永続化 | 未実装 | 現在はデフォルト5列のみ。カスタム列定義の保存先が必要 |

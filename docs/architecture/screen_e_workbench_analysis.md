# ScreenE_Workbench.vue 暗黙ロジック分析

## 分析結果（2026-02-07 Phase 2.3 Step 2.3-1）

### 重要な発見

**ScreenE_Workbench.vueは`entry`変数を使用**

- `receipt`ではなく`entry`を用いている
- Composable [aaa_useJournalEditor()](file:///C:/dev/receipt-app/src/composables/useJournalEditor.ts#7-135) から取得
- データモデルが異なる可能性あり

---

## 暗黙ロジック一覧

### 1. entry存在チェック（v-if分岐）

**Line 13, 17, 25**:
```vue
<span v-if="entry">{{ entry.clientCode }}</span>
<span v-if="entry">{{ entry.status }}</span>
<div v-if="entry">...</div>
```

**問題**:
- `entry`が`null`の場合、Loading表示（Line 203-208）
- 「entryがあるかないか」で画面分岐
- これは`status`駆動ではない ❌

---

### 2. Optional Chaining使用箇所

**Line 171, 175**:
```vue
{{ entry.totalDebit?.toLocaleString() || 0 }}
{{ entry.totalCredit?.toLocaleString() || 0 }}
```

**問題**:
- `totalDebit` / `totalCredit` が`undefined`の可能性
- データ推測で表示を決定 ❌

**Line 180**:
```vue
{{ validation.balanceDiff?.toLocaleString() || 0 }}
```

---

### 3. evidenceUrl分岐（データ有無で判定）

**Line 29-40**:
```vue
<template v-if="entry.evidenceUrl">
  <iframe :src="entry.evidenceUrl" />
</template>
<template v-else>
  <div>証憑プレビューなし</div>
</template>
```

**問題**:
- `evidenceUrl`の有無でUI分岐
- これは`status`駆動ではない ❌

---

### 4. 仕訳行データ（entry.lines）

**Line 82**:
```vue
<tr v-for="(line, idx) in entry.lines" :key="idx">
```

**問題**:
- `entry.lines`が空配列または`undefined`の場合の動作が不明
- データ構造に依存した表示ロジック ❌

---

### 5. status文字列直接参照

**Line 18-19**:
```vue
:class="entry.status === 'remanded' ? 'bg-red-100' : 'bg-blue-50'"
{{ entry.status }}
```

**問題**:
- `status`を直接templateで参照
- これは許されない（ReceiptDetail.vueパターン） ❌

---

## 地雷原マップまとめ

### 🔴 優先度：高

1. **status直接参照** - Line 18-19
   - `entry.status === 'remanded'` 判定
   - → `uiMode` に変換すべき

2. **entry存在チェック** - Line 13, 17, 25
   - `v-if="entry"` による画面分岐
   - → status駆動に変更すべき

3. **evidenceUrl分岐** - Line 29-40
   - データ有無で表示切り替え
   - → 子コンポーネントに隔離すべき

### 🟡 優先度：中

4. **Optional Chaining** - Line 171, 175, 180
   - `totalDebit?.toLocale String()` など
   - → 親で正規化すべき

5. **entry.lines参照** - Line 82
   - v-forで直接参照
   - → props として完成形で渡すべき

---

## 次のステップ

**Step 2.3-2**: uiMode設計
- `entry.status` を `uiMode` にマップ
- Workbenchは `editable` / `readonly` のみ
- 他のモードは責務外

**Step 2.3-3**: template全置換
- status直接参照を除去
- optional chainingを除去
- データ推測ロジックを子コンポーネントに隔離

# 56: 仕訳セル編集 PATCH API — 更新経路の一元化（Phase C）

> 作成: 2026-06-19
> 前提: [55_update_path_unification.md](file:///c:/dev/receipt-app/docs/genzai/55_update_path_unification.md)（DL-050監査）

---

## 背景と目的

### 問題
仕訳セル編集時、フロントの`useJournals` composableが`shallowRef`でメモリ上の配列を直接変更し、`watch(deep: true)` + `autoSave`で全件PUT保存していた。この設計は以下の問題を引き起こしていた:

1. **セル編集消失バグ**: 複数箇所からの同時変更で競合が発生し、編集内容が消失
2. **全件PUT**: 1フィールド変更でも全仕訳が再保存される非効率
3. **更新経路の分散**: `localJournals`直接変更（19箇所）、`paginatedJournals`直接変更（12箇所）、v-model（4箇所）の3系統が混在

### 解決策
サーバー側にPATCH APIを追加し、フロント側の全更新経路を`updateJournalField()`に一元化。

```
変更前:
  Vue → localJournals直接変更 → watch(deep) → autoSave(PUT全件) → Server
  Vue → paginatedJournals直接変更 → watch(deep) → autoSave(PUT全件) → Server
  Vue → v-model → watch(deep) → autoSave(PUT全件) → Server

変更後:
  Vue → 楽観的UI更新 → updateJournalField(patch) → 500msデバウンス → PATCH API → Server
```

---

## アーキテクチャ

### データフロー

```
ユーザー操作（セル編集/ボタン操作/モーダル操作）
  ↓
updateJournalField(journalId, patch)
  ├─ 1. 楽観的UI更新: journals.value内のオブジェクトをObject.assign + triggerRef
  ├─ 2. _patchQueueにjournalId単位でマージ蓄積
  └─ 3. 500msデバウンスでflushPendingPatches()
                ↓
        PATCH /api/journals/:clientId/:journalId
                ↓
        journalStore.updateJournal() → Object.assign → save()
```

### 競合回避

| 仕組み | 説明 |
|---|---|
| **journalId単位マージ** | 同一仕訳への複数変更は`_patchQueue`（Map）でマージ。最終状態のみ送信 |
| **500msデバウンス** | 連続操作を1回のPATCHにまとめる |
| **fetchJournalList前flush** | データ取得前に保留PATCHを全送信し、整合性を保証 |

---

## 変更ファイル一覧

### サーバー側（Step 1）

| ファイル | 変更内容 |
|---|---|
| [journalStore.ts](file:///c:/dev/receipt-app/src/api/services/journalStore.ts#L136-L146) | `updateJournal(clientId, journalId, patch)` 追加。Object.assignでパッチ適用 → save() |
| [journalRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/journalRoutes.ts#L162-L175) | `PATCH /:clientId/:journalId` エンドポイント追加。journalId上書き禁止ガード付き |

### フロント側（Step 2-5）

| ファイル | 変更内容 |
|---|---|
| [JournalListLevel3Mock.vue](file:///c:/dev/receipt-app/src/components/JournalListLevel3Mock.vue) | 全43箇所の更新経路を`updateJournalField()`に統一 + localJournals廃止 |
| [MockDriveSelectPage.vue](file:///c:/dev/receipt-app/src/views/upload/MockDriveSelectPage.vue) | `journals.value.push()` → POST API経由に変更 + useJournals廃止 |
| [MockExportPage.vue](file:///c:/dev/receipt-app/src/views/export/MockExportPage.vue) | exported状態更新にPATCH API追加 |

---

## JournalListLevel3Mock.vue 変更詳細

### 追加した関数

| 関数 | 行 | 役割 |
|---|---|---|
| `updateJournalField()` | L5403 | 単一更新入口。楽観的UI + デバウンスPATCH |
| `flushPendingPatches()` | L5418 | 保留PATCHの即時送信。fetchJournalList()の先頭で呼出 |

### カテゴリ別修正箇所（全43箇所）

#### カテゴリB: paginatedJournals/journals直接変更（12箇所）

| # | 関数 | 変更内容 |
|---|---|---|
| B1+B10 | `commitCellEdit()` | invoice列・通常列の両パスにupdateJournalField追加 |
| B5 | テンプレート`@change` | voucher_type変更時にupdateJournalField追加 |
| B6 | `selectAccountItem()` | entries+is_read+labelsをPATCH送信 |
| B9 | `applyHintSuggestion()` | entries+is_read+labelsをPATCH送信 |
| B7 | `selectTaxItem()` | commitCellEdit()経由でカバー済み |
| B8 | `selectSubAccountItem()` | commitCellEdit()経由でカバー済み |
| B12 | `syncWarningLabels()` | 呼出元でlabelsをpatchに含める |

#### カテゴリA: localJournals直接変更 → journals + updateJournalField（19箇所）

| # | 関数 | 変更内容 |
|---|---|---|
| A1 | `snapshotJournal()` | localJournals → journals |
| A1 | `restoreSnapshot()` | localJournals → journals + 復元後全フィールドPATCH |
| A2 | `onMounted` syncWarningLabels | localJournals → journals |
| A3 | `setReadStatus()` | localJournals → journals + updateJournalField |
| A4 | `setExportExclude()` | localJournals → journals + updateJournalField |
| A5 | `copyJournal()` | localJournals.splice → POST API + fetchJournalList |
| A6 | `trashJournal()` | localJournals → journals + updateJournalField |
| A7 | `restoreJournal()` | localJournals → journals + updateJournalField |
| A10 | `toggleStaffNote()` | localJournals → journals + updateJournalField |
| A11 | `commentModalJournal` | localJournals → journals |
| A12 | `fixAllTaxMismatches()` | localJournals → journals + 対象仕訳PATCHループ |
| A14 | `closeCommentModal()` | staff_notes/labels/memoをまとめてPATCH |
| A15 | `openWarningConfirmModal()` | warning_dismissals/labelsをPATCH |
| A16 | `resetToDefaultOrder()` | localJournals → journals |
| A17 | `showBulkExportExcludeDialog()` | forEach内でupdateJournalField |
| A18 | `showBulkTrashDialog()` | forEach内でupdateJournalField |
| A19 | `showBulkCopyDialog()` | localJournals.splice → POST API + fetchJournalList |

#### カテゴリV: v-modelバインディング（4箇所）

`closeCommentModal()` でstuff_notes/labels/memo等をまとめてPATCH送信。

#### カテゴリC: 読み取り専用参照（8箇所）

全て `localJournals.value` → `journals.value` に置換。

#### カテゴリD: インフラ削除（3箇所）

| 項目 | 変更 |
|---|---|
| `useJournals` import | コメントアウト |
| `localJournals` const宣言 | コメントアウト |
| autoSave `watch(deep: true)` | 削除 |

---

## 他ファイル変更

### MockDriveSelectPage.vue

仕訳処理送信時の`journals.value.push(...newJournals)` → POST API経由に変更。

```diff
-journals.value.push(...newJournals);
+await fetch(`/api/journals/${encodeURIComponent(clientId.value)}`, {
+  method: 'POST',
+  headers: { 'Content-Type': 'application/json' },
+  body: JSON.stringify({ journals: newJournals }),
+});
```

### MockExportPage.vue

exported状態更新にPATCH API追加（楽観的UI更新 + PATCH並列送信）。

```diff
 target.status = "exported";
 target.exported_at = exportedAt;
 target.exported_by = currentStaffId.value ?? 'unknown';
 target.export_batch_id = historyId;
+fetch(`/api/journals/${encodeURIComponent(clientId.value)}/${encodeURIComponent(v.journalId)}`, {
+  method: 'PATCH',
+  headers: { 'Content-Type': 'application/json' },
+  body: JSON.stringify({ status: 'exported', exported_at: exportedAt, ... }),
+}).catch(err => console.error(...));
```

---

## PATCH APIエンドポイント仕様

### `PATCH /api/journals/:clientId/:journalId`

| 項目 | 値 |
|---|---|
| メソッド | PATCH |
| パス | `/api/journals/:clientId/:journalId` |
| Content-Type | application/json |
| ボディ | 変更フィールドのみのJSONオブジェクト |
| レスポンス | `{ ok: true }` |
| エラー | 400（journalId上書き試行）、404（対象仕訳なし）、500（保存失敗） |

#### ガード条件
- `body.journalId` が存在する場合は400エラー（ID変更は禁止）

#### ボディ例
```json
{
  "description": "更新後の摘要",
  "is_read": true,
  "updated_by": "staff_001",
  "updated_at": "2026-06-19T12:00:00.000Z"
}
```

---

## 検証結果

| 検証項目 | 結果 |
|---|---|
| `npx vue-tsc --noEmit` | ✅ エラー0件 |
| `localJournals` コード参照 | ✅ 0件（コメントのみ4件） |
| API `POST /api/journals/:clientId/list` | ✅ 正常応答 |
| API `PATCH /api/journals/:clientId/:journalId` | ✅ 正常応答 |
| ブラウザ画面表示 | ✅ 仕訳一覧正常表示 |

### 修正した副次バグ
- `journals` shallowRefの宣言位置がsetup内の後方（L5390）にあり、前方のcomputed/watchから参照不可 → L2801に移動して解消

---

## useJournals.ts の状態

| 利用元 | 状態 | 備考 |
|---|---|---|
| JournalListLevel3Mock.vue | ✅ 廃止済み | importコメントアウト |
| MockDriveSelectPage.vue | ✅ 廃止済み | importコメントアウト |
| MockExportPage.vue | ⚠️ 読み取り専用で維持 | syncWarningLabelsCoreに必要。将来的にAPI側バリデーションに移行予定 |

---

## 関連設計書

| ドキュメント | 関係 |
|---|---|
| [55_update_path_unification.md](file:///c:/dev/receipt-app/docs/genzai/55_update_path_unification.md) | DL-050監査。本設計の前提（サーバー側更新経路一元化） |
| [53_client_account_architecture.md](file:///c:/dev/receipt-app/docs/genzai/53_client_account_architecture.md) | 顧問先科目Override方式。Repository構造の前提 |
| [28_api_migration_plan.md](file:///c:/dev/receipt-app/docs/genzai/28_api_migration_plan.md) | API移行計画 |

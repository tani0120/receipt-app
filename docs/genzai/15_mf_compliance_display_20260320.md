# MF公式/非公式 表示修正レポート

> 作成日: 2026-03-20
> 対象ファイル: `MockMasterAccountsPage.vue`, `MockMasterTaxCategoriesPage.vue`

---

## 1. 今回実施した修正

### 1-1. MF公式列の表示変更

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| 列ヘッダー | ✅アイコン | 「MF公式」テキスト |
| tbody（MF公式） | `<i class="fa-solid fa-circle-check">` | `<span class="td-mf-badge mf-official">MF公式</span>` 緑背景バッジ |
| tbody（MF非公式） | 変更なし | `<i class="fa-solid fa-triangle-exclamation">` + ホバーメッセージ |

### 1-2. 科目名/税区分名 列のアイコン削除

| ページ | 変更 |
|--------|------|
| 勘定科目マスタ | 勘定科目列（科目名左）の「MF公式」バッジ削除 |
| 税区分マスタ | 税区分列（税区分名左）の「MF公式」バッジ削除 |

### 1-3. ゴミ箱アイコン削除

- 勘定科目マスタのMF公式列からゴミ箱アイコン（`fa-trash-can`）を削除

### 1-4. 一括ボタンの色分けと仕切り

チェックボックス選択時の一括操作ボタンを統一：

```
MF公式(青) MF非公式(赤) | 表示化(青) 非表示化(赤) | 削除(赤) コピー(青) 追加(青)
```

- 青: `#1976D2`（`.as-bulk-btn.blue`）
- 赤: `#e53935`（`.as-bulk-btn.red`）
- 仕切り: `.as-bulk-divider`（薄灰色縦線 1px）

### 1-5. `demoteFromMfChecked` 関数追加

- 両ページに「MF非公式に降格」する一括操作関数を追加
- 確認ダイアログ付き:「MFインポート時に項目の紐付けが必要になる可能性があります」

### 1-6. 構文エラー修正

- `MockMasterAccountsPage.vue` L86-88: `<th>MF公式</th>` の閉じタグ `</th>` 欠落を修正
- Viteコンパイルエラー（Element is missing end tag）の原因

### 1-7. CSSスタイル追加

| クラス | 用途 |
|--------|------|
| `.td-mf-badge` | バッジ共通スタイル（inline-block, 10px, bold） |
| `.td-mf-badge.mf-official` | MF公式バッジ（緑背景 `#e8f5e9` + 緑文字 `#2e7d32`） |
| `.td-mf-unknown` | MF非公式アイコン（オレンジ `#ff9800`） |
| `.as-bulk-btn.blue` | 青ボタン |
| `.as-bulk-btn.red` | 赤ボタン |
| `.as-bulk-divider` | 仕切り線 |

---

## 2. 内部状態の設計（現在の仕組み）

```
isCustom = false → MF公式（デフォルト科目/税区分）
isCustom = true  → MF非公式（カスタム科目/税区分）
```

- 専用の `isMfOfficial` フラグは存在しない
- `isCustom` フラグを流用している
- CSV出力時は「名称」で照合されるため、IDは無関係（`streamed_mf_csv_spec.md` §2参照）

### MF公式昇格シナリオ

1. 税制改正 → カスタム税区分を追加（`isCustom = true`）
2. MFが正式対応
3. `promoteToMfChecked` で `isCustom = false` に変更
4. CSV出力時にMF正式名称と完全一致していればインポート可能

---

## 3. MFマスタデータの鮮度維持

### 現在保持しているデータ

| ファイル | 件数 | 根拠 |
|---------|------|------|
| `src/shared/data/tax-category-master.ts` | 151件 | MFクラウド会計 税区分設定CSV |
| `src/shared/data/account-master.ts` | 個人79件+法人87件 | MFクラウド確定申告CSVエクスポート |

### 保留: MF API連携

- MFクラウド会計APIは**パートナー限定**公開
- `GET /api/external/v1/offices/{id}/account_items` — 勘定科目一覧
- `GET /api/external/v1/offices/{id}/excises` — 税区分一覧
- OAuth2認証が必要
- **ステータス: 保留（パートナー契約が前提）**

### 保留: CSVバリデーションスクリプト

- `npm run validate:mf-master` でMFからのCSVと内部データを差分比較
- 追加・名称変更・廃止を検出して一覧出力
- **ステータス: 保留（MF APIまたは手動CSV取得と合わせて実装予定）**

---

## 4. 検証結果

- `vue-tsc --noEmit`: **0エラー通過**
- ブラウザ確認:
  - `/master/accounts`: MF公式バッジ・一括ボタン色・仕切り — ✅正常表示
  - `/master/tax`: 同上 — ✅正常表示

### 残存warning（スコープ外）

| ファイル | warning | 理由 |
|---------|---------|------|
| `MockMasterAccountsPage.vue` | `hideRow`, `showRow`, `deleteRow` 未使用 | 一括操作で使用するが個別行からは未参照 |
| `MockMasterTaxCategoriesPage.vue` | `hideRow`, `showRow` 未使用 | 同上 |

> **2026-03-29**: 旧`ScreenS_AccountSettings.vue`（TAX_CATEGORY_MASTER直接参照4箇所）は到達不能レガシーとして物理削除済み。

# 税区分マスタ・勘定科目マスタページ — やりとり時系列

> 対象: `MockMasterAccountsPage.vue`, `MockMasterTaxCategoriesPage.vue`
> 出典: 会話 307bbef7（3/14-15）, d49b1766（3/17）

---

## 会話①: 307bbef7（2026-03-14〜15）

### フェーズ1: localStorage保存バグ修正（3/15 朝）

**発見したバグ**:

| # | バグ | 原因 |
|---|------|------|
| 1 | コピーのコピーがデフォルト順で消失 | `resetAccountOrder`/`resetTaxOrder`の`insertAfter`チェーンが1階層しか展開していなかった |
| 2 | `copyCounter`がリロードで0にリセット | 保存→リロード後に同じIDで新規コピー→ID衝突 |
| 3 | 顧問先の`saveChanges`で`CASH_COPY_`除外 | 意味不明なハードコード。現金のコピーだけ保存されない |

**修正内容**:
- `expandChildren`/`expandTaxChildren` 再帰展開関数を追加（深さ制限10）
- `getInitialCopyCounter` 関数で既存localStorage IDの`_COPY_N`/`NEW_N`から最大値算出
- コピー行の`effectiveFrom`を今日の日付、`effectiveTo`をnullに変更（税区分は既に正しかった）

---

### フェーズ2: 第2弾バグ修正（3/15 午前10時）

**マスタページ関連の発見**: `MockMasterAccountsPage.vue` L197 の `resetMasterToDefault` 未使用警告（スコープ外、低影響）

---

### フェーズ3: 勘定科目ページの税区分候補に顧問先税区分を反映（3/15 午前11時半）

**問題**: `MockClientAccountsPage.vue` の `filteredTaxCategories` と `getTaxCategoryName` が `TAX_CATEGORY_MASTER` を直接参照 → 顧問先税区分ページで追加・編集・非表示にした税区分が反映されない

**修正**: `clientTaxCategories` computedを追加し、localStorageから顧問先カスタム税区分を読み込んでマスタ+カスタムを合成

---

### フェーズ4: N2/N7 保存キー統一（3/15）

**マスタ税区分ページ直接修正**:
- `MockMasterTaxCategoriesPage.vue`: composable接続（`overrides: taxMasterOverrides`をdestructuring追加）
- `saveChanges()`でcomposableのoverridesとlocalStorageに同期

---

### フェーズ5: データフロー全体図（3/15）

**マスタ勘定科目 `/master/accounts`**:

| 項目 | ソース |
|------|--------|
| 行データ | `ACCOUNT_MASTER` + LS `sugu-suru:account-master:rows` |
| 表示/非表示 | `useAccountMaster.hiddenIds` |
| 税区分選択肢 | `TAX_CATEGORY_MASTER` 直接参照 |
| 保存先 | LS `sugu-suru:account-master:rows` |

**マスタ税区分 `/master/tax`**:

| 項目 | ソース |
|------|--------|
| 行データ | `TAX_CATEGORY_MASTER` + LS `sugu-suru:account-master:rows` |
| 表示/非表示 | `useTaxMaster.hiddenIds` |
| 保存先 | LS 同上 |

**マスタ関連 localStorage キー**:

| キー | 用途 |
|------|------|
| `sugu-suru:account-master:overrides` | マスタ勘定科目の非表示/カスタム |
| `sugu-suru:account-master:rows` | マスタ勘定科目ページの全行状態 |
| `sugu-suru:tax-master:overrides` | マスタ税区分の非表示/表示上書き |

---

## 会話②: d49b1766（2026-03-17）

### Q1: 列幅リサイズのスコープにマスタ2ページを含む

| pageKey | ページ |
|---------|--------|
| `master-accounts` | 勘定科目マスタ |
| `master-tax` | 税区分マスタ |

### 中期タスク（next_tasks.md記載）

| # | 内容 | 備考 |
|---|------|------|
| D7 | 勘定科目列をマスター連動プルダウンに変更 | 仕訳一覧側の話。マスタページ自体の修正ではない |
| D8 | 税区分列をマスター連動プルダウンに変更 | 同上 |

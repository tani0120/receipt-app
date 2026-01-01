
# UI Freeze Ironclad Specification (Appendix A)

## 0. 本文書の位置づけ（絶対）
本書は Phase C（Ironclad Contract）におけるストレステストの完全仕様である。
本書に定義されたテストを 1 つでも省略・簡略化・代替した場合、Phase C は **不合格** とする。

---

## 3. ストレスレベル定義（全段階必須）
| レベル | 内容 | 位置づけ |
|---|---|---|
| Lv1 | 欠損・null | 最低限 |
| Lv2 | 想定外コード | 通常異常 |
| Lv3 | 極端値 | 強 |
| Lv4 | 敵対的入力 | **最強・必須** |

**Lv4 を含まないテストは、ストレステストと認めない。**

## 4. テスト①：敵対的 API データ生成（Fuzz Input）
### 4.2 型破壊（必須）
- 数値: "NaN", "∞", "Infinity", "123abc", 9999999...
- 文字列: 0, 1, true, false, null, undefined, {}
- Boolean: "true", "false", 1, 0, null, "yes"

### 4.3 欠損・構造破壊（必須）
- key 自体を削除
- undefined / null 混在
- 空オブジェクト {} を丸ごと渡す

### 4.5 長さ攻撃（最重要）
- 10,000 文字
- 50,000 文字
- 改行なし
- 日本語のみ、英数字のみ

## 5. テスト②：Mapper 単体破壊テスト（最重要）
- throw しない
- return が 必ず UI Contract 型
- optional が残らない
- null / undefined を含まない
- 型が string / number に正規化されている

## 6. テスト③：UI 白化テスト（Visual Kill Test）
- Mapper 出力をそのまま UI に流して **白画面** にならないこと。
- Console Error 0 件。

## 7. テスト④：レイアウト耐性テスト（CSS Kill）
- 寿限無 10,000 文字
- `break-all`, `min-h`, `overflow-hidden` 等でレイアウト崩壊を防ぐこと。

## 8. テスト⑤：Contract 破壊テスト（思想的・必須）
- `as any` 禁止
- ビルド時に型違反を検出できること。

## 9. テスト⑥：Snapshot
- `stress_worst.png` (Lv4)
- `stress_longtext.png` (長文攻撃)

---

## 10. 最終合格条件（Ironclad 判定）
以下すべて Yes の場合のみ合格。
1. Mapper が throw しない
2. UI が白くならない
3. Contract が破れない
4. レイアウトが崩れない
5. コンソールエラー 0
6. 視覚差分が説明可能
7. 全証跡が存在

# MF MCP 仕訳送信 49パターン検証（TSK実機 2026-06-01）

## 結論

> [!CAUTION]
> **勘定科目（account_id）: その事業者の正規MF IDが必須。名前・省略・null・他社ID全て不可。**
> **税区分（tax_id）: 正規IDまたは省略（空文字含む）のみ可。名前・null・他社ID全て不可。**

| 項目 | 正規ID | 名前 | 省略 | 空文字 | null | デタラメ | 他社ID |
|---|---|---|---|---|---|---|---|
| **勘定科目** account_id | ✅ 唯一の方法 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **税区分** tax_id | ✅ | ❌ | ✅ MFが自動適用 | ✅ 省略と同じ | ❌ | ❌ | ❌ |

### 設計への影響

1. **MCP仕訳送信には、その事業者固有のMF IDが絶対に必要**（勘定科目は必須、税区分は任意だが指定するならID）
2. **他社のIDは使えない** → 全社マスタにMF IDを保持しても仕訳送信には使えない
3. **個別顧問先ごとにMF IDを保存する必要がある**（MFインポート時に取得・保存）
4. **MF IDが未取得の顧問先には仕訳を送信できない** → MFインポートが前提条件

---

## 経緯

1. 45_mf_id_comparison.mdの検証で「税区分・勘定科目ともにMF IDは事業者固有」と判明
2. 「事業者固有なら、そのIDなしで仕訳を送れるか？名前で送れるか？」という疑問が発生
3. account_id/tax_idに対して7種類の値パターンを全組み合わせ（7×7=49パターン）で実機テスト

---

## 実験方法

- **対象事業者**: TSK（`c_wTdnMKDO` / あああ / 谷風行寛 / 個人）
- **送信先**: MF MCPサーバー（`mfc_ca_postJournals`）
- **日付**: 2026-06-01
- **科目**: 借方=現金、貸方=売上高
- **税区分**: 借方=対象外、貸方=課税売上 10%
- **金額**: テスト番号+100円（101〜149円）
- **レートリミット対策**: 2秒間隔、レートリミット時10秒待機してリトライ
- **スクリプト**: `scripts/test-mf-journal-49patterns.ts`

### 7つの値パターン

| # | パターン | 勘定科目フィールドの値 | 税区分フィールドの値 |
|---|---|---|---|
| 1 | 正規ID | TSKのMF勘定科目ID | TSKのMF税区分ID |
| 2 | 名前 | `"現金"` / `"売上高"` | `"対象外"` / `"課税売上 10%"` |
| 3 | 省略 | JSONキー自体なし（undefined） | JSONキー自体なし（undefined） |
| 4 | 空文字 | `""` | `""` |
| 5 | null | `null` | `null` |
| 6 | デタラメID | `"AAABBBCCC123=="` | `"XXXYYYZZZ456=="` |
| 7 | 他社ID | TST（株式会社すぐする）の同名科目ID | TST（株式会社すぐする）の同名税区分ID |

---

## エラー分類

失敗パターンのエラーは3種類に分かれた：

| エラー種別 | コード | 意味 | 発生箇所 |
|---|---|---|---|
| **MCPブロック** | `MCP error -32602` | MCPスキーマバリデーションで弾かれた。MF APIに到達すらしていない | MCPサーバー |
| **API必須欠落** | `missing_required_request_body_key` | キーは送ったが値が空。MF APIが「必須フィールドがない」と拒否 | MF API |
| **API値不正** | `invalid_request_body_value` | 値が不正。MF APIが「そのIDは存在しない/形式が違う」と拒否 | MF API |

### エラー種別マトリクス

| | 税:正規ID | 税:名前 | 税:省略 | 税:空文字 | 税:null | 税:デタラメ | 税:他社ID |
|---|---|---|---|---|---|---|---|
| **科目:正規ID** | ✅ 受理 | API値不正 | ✅ 受理 | ✅ 受理 | MCPブロック | API値不正 | API値不正 |
| **科目:名前** | API値不正 | API値不正 | API値不正 | API値不正 | MCPブロック | API値不正 | API値不正 |
| **科目:省略** | MCPブロック | MCPブロック | MCPブロック | MCPブロック | MCPブロック | MCPブロック | MCPブロック |
| **科目:空文字** | API必須欠落 | API値不正 | API必須欠落 | API必須欠落 | MCPブロック | API値不正 | API値不正 |
| **科目:null** | MCPブロック | MCPブロック | MCPブロック | MCPブロック | MCPブロック | MCPブロック | MCPブロック |
| **科目:デタラメ** | API値不正 | API値不正 | API値不正 | API値不正 | MCPブロック | API値不正 | API値不正 |
| **科目:他社ID** | API値不正 | API値不正 | API値不正 | API値不正 | MCPブロック | API値不正 | API値不正 |

### 法則

- **null**: 勘定科目・税区分ともに`null`を送ると**MCPスキーマバリデーション**で弾かれる（APIに届かない）
- **省略（キーなし）**: 勘定科目が省略→MCPブロック（必須フィールド）。税区分が省略→受理（MFがデフォルト適用）
- **空文字**: 勘定科目が空文字→APIが「必須欠落」で拒否。税区分が空文字→**省略と同じ扱い**で受理
- **名前/デタラメID/他社ID**: APIが「値が不正」で拒否。**名前での送信は不可能**
- **他社ID**: デタラメIDと同じ扱いで拒否。**事業者間でIDの互換性はない**

---

## 結果データ


## パターン定義

| # | パターン | 勘定科目での値 | 税区分での値 |
|---|---|---|---|
| 1 | 正規ID | TSKのMF ID | TSKのMF ID |
| 2 | 名前 | `"現金"` / `"売上高"` | `"対象外"` / `"課税売上 10%"` |
| 3 | 省略 | キー自体なし | キー自体なし |
| 4 | 空文字 | `""` | `""` |
| 5 | null | `null` | `null` |
| 6 | デタラメID | `"AAABBBCCC123=="` | `"XXXYYYZZZ456=="` |
| 7 | 他社ID | TSTの同名科目ID | TSTの同名税区分ID |

## 結果マトリクス

| | 税:正規ID | 税:名前 | 税:省略 | 税:空文字 | 税:null | 税:デタラメ | 税:他社ID |
|---|---|---|---|---|---|---|---|
| **科目:正規ID** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **科目:名前** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **科目:省略** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **科目:空文字** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **科目:null** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **科目:デタラメID** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **科目:他社ID** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 全件詳細

| # | 勘定科目 | 税区分 | 結果 | 詳細 |
|---|---|---|---|---|
| 1 | 正規ID | 正規ID | ✅ | MF#53 |
| 2 | 正規ID | 名前 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: tax_i |
| 3 | 正規ID | 省略 | ✅ | MF#54 |
| 4 | 正規ID | 空文字 | ✅ | MF#55 |
| 5 | 正規ID | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 6 | 正規ID | デタラメID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: tax_i |
| 7 | 正規ID | 他社ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: tax_i |
| 8 | 名前 | 正規ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 9 | 名前 | 名前 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 10 | 名前 | 省略 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 11 | 名前 | 空文字 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 12 | 名前 | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 13 | 名前 | デタラメID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 14 | 名前 | 他社ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 15 | 省略 | 正規ID | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 16 | 省略 | 名前 | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 17 | 省略 | 省略 | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 18 | 省略 | 空文字 | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 19 | 省略 | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 20 | 省略 | デタラメID | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 21 | 省略 | 他社ID | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 22 | 空文字 | 正規ID | ❌ | missing_required_request_body_key: The specified value for one of the request body keys is required. Target: accoun |
| 23 | 空文字 | 名前 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: tax_i |
| 24 | 空文字 | 省略 | ❌ | missing_required_request_body_key: The specified value for one of the request body keys is required. Target: accoun |
| 25 | 空文字 | 空文字 | ❌ | missing_required_request_body_key: The specified value for one of the request body keys is required. Target: accoun |
| 26 | 空文字 | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 27 | 空文字 | デタラメID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: tax_i |
| 28 | 空文字 | 他社ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: tax_i |
| 29 | null | 正規ID | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 30 | null | 名前 | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 31 | null | 省略 | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 32 | null | 空文字 | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 33 | null | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 34 | null | デタラメID | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 35 | null | 他社ID | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 36 | デタラメID | 正規ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 37 | デタラメID | 名前 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 38 | デタラメID | 省略 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 39 | デタラメID | 空文字 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 40 | デタラメID | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 41 | デタラメID | デタラメID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 42 | デタラメID | 他社ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 43 | 他社ID | 正規ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 44 | 他社ID | 名前 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 45 | 他社ID | 省略 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 46 | 他社ID | 空文字 | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 47 | 他社ID | null | ❌ | MCP error -32602: invalid params: validating "arguments": validating root: validating /properties/journal: validating /properties/journal/properties/b |
| 48 | 他社ID | デタラメID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
| 49 | 他社ID | 他社ID | ❌ | invalid_request_body_value: The specified value for one of the request body keys is not valid. Target: accou |
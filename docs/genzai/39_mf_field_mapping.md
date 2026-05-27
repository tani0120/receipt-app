# MF API ↔ Sugusru フィールド対応表

> 根拠: [MfMcpJournal](file:///c:/dev/receipt-app/src/api/services/mfMcpClient.ts#L174-L208) / [JournalPhase5Mock](file:///c:/dev/receipt-app/src/types/journal_phase5_mock.type.ts#L73-L220) / [JournalEntryLine](file:///c:/dev/receipt-app/src/types/domain-journal.ts#L169-L211)
> 最終改訂: 2026-05-23（ゼロベース見直し。全項目に検証ステータスを付与）

**凡例:**
- ✅ 実機テスト済み（MF#番号 or エラーメッセージで確認）
- ⚠️ 推測（実機テスト未実施）
- 🐛 修正済みバグ（発見日と修正内容を記載）

---

## §1. 仕訳ヘッダー（MfMcpJournal ↔ JournalPhase5Mock）

| # | MF API フィールド | 型 | Sugusru フィールド | 型 | 変換ルール | 方向 | 検証 |
|---|---|---|---|---|---|---|---|
| 1 | `id` | string | `mf_journal_id` | string &#124; null | MF仕訳ID。送信成功後にapplyMfSendResultsで紐付け保存 | 出力のみ | ✅ MF#28〜#44 |
| 2 | `number` | number | `mf_journal_number` | number &#124; null | MF取引No。自動採番 | 出力のみ | ✅ MF#28〜#44 |
| 3 | `transaction_date` | string | `voucher_date` | string &#124; null | YYYY-MM-DD | 双方向 | ✅ MF#28〜#44 |
| 4 | `journal_type` | string | — | — | 固定値`'journal_entry'`で送信 | 入力のみ | ✅ MF#28〜#44 |
| 5 | `entered_by` | string | — | — | `JOURNAL_TYPE_EXTERNAL`（API経由は強制） | 出力のみ | ✅ GETレスポンスで確認 |
| 6 | `is_realized` | boolean | — | — | `true`=確定、`false`=未実現 | 出力のみ | ⚠️ 未テスト |
| 7 | `memo` | string | `description` | string | MFの「メモ」＝Sugusruの「摘要」 | 双方向 | ✅ MF#28〜#44 |
| 8 | `tags` | string[] | — | — | 送信時に`['SUGUSRU']`を付与 | 入力のみ | ✅ MF#28〜#44 |
| 9 | `term_period` | number | — | — | 会計年度。MF自動判定 | 出力のみ | ✅ GETレスポンスで確認 |
| 10 | `create_time` | string | — | — | ISO 8601 | 出力のみ | ✅ GETレスポンスで確認 |
| 11 | `update_time` | string | — | — | ISO 8601 | 出力のみ | ✅ GETレスポンスで確認 |
| 12 | `voucher_file_ids` | string[] | `document_id` | string &#124; null | MFの証憑ファイルID配列 | 出力のみ | ⚠️ 未テスト |

---

## §2. 仕訳行（MfMcpJournalSide ↔ JournalEntryLine）

> [!IMPORTANT]
> **構造差異:** MFは `branches[]` 配列（各要素に `debitor` + `creditor` + `remark`）。Sugusruは `debit_entries[]` と `credit_entries[]` の分離配列。

| # | MF API フィールド | 型 | Sugusru フィールド | 型 | 変換ルール | 方向 | 検証 |
|---|---|---|---|---|---|---|---|
| 1 | `account_id` | string | `account` | string &#124; null | 名前マッチで変換（buildAllMaps） | 双方向 | ✅ MF#28〜#44（108件マッチ） |
| 2 | `account_name` | string | — | — | MFが名前解決済みで返す | 出力のみ | ✅ |
| 3 | `value` | integer | `amount` | Yen &#124; null | **POST送信=税込額、GET取得=税抜額**。整数のみ。0・負数・小数は拒否。インポート時は`value+tax_value`で税込復元（実機テストMF#48-49で確認） | 双方向 | ✅ 下記§2-1参照 |
| 4 | `tax_id` | string &#124; null | `tax_category_id` | string &#124; null | 名前マッチで変換 | 双方向 | ✅ MF#40 |
| 5 | `tax_name` | string | — | — | 免税事業者ではnullが返る | 出力のみ | ✅ MF#40（null確認） |
| 6 | `sub_account_id` | string &#124; null | `sub_account` | string &#124; null | 名前→ID変換（buildAllMaps） | 入力のみ | ✅ MF#41（通勤手当） |
| 7 | `sub_account_name` | string &#124; null | — | — | MFが名前解決済みで返す | 出力のみ | ✅ MF#41 |
| 8 | `department_id` | string &#124; null | `department` | string &#124; null | 名前→ID変換 | 入力のみ | ⚠️ テスト事業者に部門なし |
| 9 | `department_name` | string &#124; null | — | — | MFが名前解決済みで返す | 出力のみ | ⚠️ |
| 10 | `trade_partner_code` | string &#124; null | `trade_partner_name` | string &#124; null | 名前→MFコード変換（tradePartnerMap） | 入力のみ | ✅ MF#42（A0000000001） |
| 11 | `trade_partner_name` | string &#124; null | `vendor_name` | string &#124; null | MFが名前解決済みで返す | 出力のみ | ✅ MF#42 |
| 12 | **`invoice_kind`** | string | `invoice_status`（ヘッダー） | string &#124; null | **§3参照。QUALIFIED/UNQUALIFIED_80はそのまま送信** | 条件付き | ✅ 全課税方式+送信テスト済み |
| 13 | `remark` | string | — | — | branch[0]にdescriptionを設定 | 双方向 | ✅ MF#28〜#44 |

### §2-1. value（金額）の制約（実機テスト確認済み 2026-05-23）

| 値 | MF APIの挙動 | エラーメッセージ | バリデーション |
|---|---|---|---|
| 正の整数（1以上） | ✅ 成功 | — | — |
| `0` | ❌ 拒否 | `missing_required_request_body_key: value` | `AMOUNT_ZERO` |
| 負数（`-1`等） | ❌ 拒否 | `invalid_request_body_value: 金額は整数で指定してください` | `AMOUNT_NEGATIVE` |
| 小数（`1.5`等） | ❌ 拒否 | MCPスキーマ: `type: 1.5 has type "number", want "integer"` | `AMOUNT_DECIMAL` |
| `null` | ❌ 拒否 | `missing_required_request_body_key: value` | `AMOUNT_NULL` |
| `NaN`/`Infinity` | ❌ JSON不可 | — | `AMOUNT_INVALID` |

### §2-2. N:N変換ルール（実機テスト確認済み 2026-05-23）

| パターン | テスト | 結果 |
|---|---|---|
| 1:1 | ✅ MF#28 | 成功 |
| 3:1（借方複数/貸方単一） | ✅ MF#29, #39 | 成功。対向金額一致方式 |
| 2:2（双方複数） | ✅ MF#43 | 成功 |
| 3:3（双方複数） | ✅ MF#44 | 成功 |

**変換ルール:**
- 各branchで **debitor.value === creditor.value** であること
- 長い側の金額が基準、短い側は同一科目を複製して対向金額に合わせる

---

## §3. インボイス区分

> [!CAUTION]
> **税務上の重大事項。以下のバグが存在していた:**
>
> 🐛 **hasNonQualifiedが常にfalse（修正済み 2026-05-23）**
> 存在しないenum値`INVOICE_KIND_NOT_QUALIFIED`と比較していたため、非適格仕訳の警告が一切出なかった。
> → 入力の`journal.invoice_status === 'not_qualified'`で判定するように修正。

### 構造比較

| 項目 | MF API | Sugusru |
|---|---|---|
| **配置レベル** | **行レベル**（借方のみ設定可能、貸方はエラー） | **ヘッダーレベル** |
| **enum値** | `INVOICE_KIND_QUALIFIED` / `INVOICE_KIND_UNQUALIFIED_80` / `INVOICE_KIND_NOT_TARGET` | `'qualified'` / `'not_qualified'` / `null` |
| **番号** | 取引先マスタの `invoice_registration_number` | `invoice_number`（T+13桁） |

### 課税方式別 invoice_kind 挙動（✅ 全方式実機テスト済み 2026-05-23）

| 課税方式 | QUALIFIED | UNQUALIFIED_80 | NOT_TARGET+対象外 | 省略(課税) | 省略(対象外) |
|---|---|---|---|---|---|
| **免税** | ✅ MF#17 | ✅ MF#18 | ✅ MF#19 | ✅→QUALIFIED MF#20 | ✅→NOT_TARGET MF#21 |
| **簡易** | ✅ MF#12 | ✅ MF#13 | ✅ MF#14 | ✅→QUALIFIED MF#15 | ✅→NOT_TARGET MF#16 |
| **本則・一括比例** | ✅ MF#7 | ✅ MF#8 | ✅ MF#10 | ✅→QUALIFIED MF#9 | ✅→NOT_TARGET MF#11 |
| **本則・個別対応** | ✅ | ✅ | ✅ | ✅→QUALIFIED | ✅→NOT_TARGET |

> [!WARNING]
> **以前のテスト結果「免税:❌ 拒否」「簡易:❌ 拒否」は全て誤りだった。** 全課税方式で全invoice_kindパターンが受理される（MF#7-#21で確認）。MFは課税方式に関係なくinvoice_kindを受け入れる。

### 送信ルール（実機テスト 2026-05-23確認済み — 以前の「送信不可」は誤り）

| invoice_kind | 税区分 | MF API | テスト |
|---|---|---|---|
| `QUALIFIED` | 課税仕入10% | ✅ 受理 | MF#7 |
| `UNQUALIFIED_80` | 課税仕入10% | ✅ 受理 | MF#8 |
| `NOT_TARGET` | **課税仕入10%** | ❌ 拒否「インボイスは不正な値です」 | — |
| `NOT_TARGET` | **対象外** | ✅ 受理 | MF#10 |
| 省略 | 課税仕入10% | ✅ 受理（自動=QUALIFIED） | MF#9 |
| 省略 | 対象外 | ✅ 受理（自動=NOT_TARGET） | MF#11 |
| `UNQUALIFIED_50` | — | ❌ enum未存在で自然停止 | — |
| `NOT_QUALIFIED_0` | — | ❌ enum未存在で自然停止 | — |

> [!IMPORTANT]
> **invoice_kindは送信可能。** 以前の「MF APIが拒否する」「送信後にMF画面で手動修正が必要」は完全な誤り。
> NOT_TARGETの拒否は「課税仕入なのにインボイス対象外」という税務矛盾をMFが検出したもの。
> MFは税区分からinvoice_kindを自動判定する能力があるため、省略しても正しく設定される。

### 現在の送信方式

- `convertSide`で`invoice_kind`をペイロードに含める
- `mfJournalSender`はペイロードをそのまま送信（`stripInvoiceKind`は廃止済み）
- 非適格仕訳はログ出力のみ（MF管理画面修正は不要）

---

## §4. 税務上の未対応事項

> [!CAUTION]
> **以下は「通すこと」を優先して税務ルールを無視した箇所の一覧。**

### 既存の整合性ルール（UIマスタ側のみ。送信バリデーションには適用されていない）

| ファイル | 関数 | 機能 |
|---|---|---|
| [account-category-rules.ts](file:///c:/dev/receipt-app/src/data/master/account-category-rules.ts) | `getCategoryDirection()` | 科目カテゴリ→方向（sales/purchase/common）の導出 |
| 同上 | `getAllowedTaxDeterminations()` | 科目+課税方式→許可される税区分自動判定値 |
| 同上 | `deriveCategoryDefaults()` | カテゴリ変更→accountGroup+taxDetermination+defaultTaxCategoryIdの自動連動 |
| [MockMasterTaxCategoriesPage.vue](file:///c:/dev/receipt-app/src/views/master/MockMasterTaxCategoriesPage.vue#L231-L251) | `filteredTaxRows` | 課税方式別の税区分フィルタ（免税→COMMON_EXEMPTのみ、簡易→T系+仕入+共通） |

> [!WARNING]
> **これらのルールはUIマスタ編集画面でのみ適用されている。** MF送信バリデーション（`validateBeforeConvert`）やjournal-listの仕訳入力画面には一切適用されていない。

### 未対応項目一覧

| # | 問題 | 内容 | 実機テスト結果 | 対応状態 |
|---|---|---|---|---|
| 1 | **科目-税区分の方向整合性** | PL_REVENUEにpurchase系税区分を使える | ✅ MF APIは許容（MF#2） | ✅ `TAX_DIRECTION_MISMATCH` |
| 2 | **課税方式別の税区分制限** | 全方式で制限が異なる | ✅ 免税でも課税仕入が通る（MF#45） | ✅ 免税:`TAX_EXEMPT_VIOLATION` 簡易:`TAX_SIMPLIFIED_VIOLATION` 本則一括:`TAX_PROPORTIONAL_VIOLATION` |
| 3 | **経過措置期間の分岐** | `UNQUALIFIED_80`固定だった | ✅ `UNQUALIFIED_50`はMF APIに未存在 | ✅ 日付で`UNQUALIFIED_50`/`NOT_QUALIFIED_0`を送信。MF未対応ならenumエラーで自然停止 |
| 4 | **簡易課税の事業区分** | SourceJournalに課税方式情報がなかった | — | ✅ `consumption_tax_mode`追加済み（general/general_proportional/general_individual/simplified/exempt） |
| 5 | **消費税額の検証** | 税込経理が基本。MFに委譲 | — | ✅ 対応不要 |
| 6 | **適格/非適格の判断** | 人間が判断。AIは設定しない | — | ✅ 人間判断 |
| 7 | **インボイス番号の検証** | MF取引先マスタに`invoice_registration_number` | ✅ **MFが国税庁DBに実際に照会して検証する**。存在しない番号は拒否。桁数チェック（13桁半角数字のみ）もあり | ✅ MF側検証確認済み |
| 8 | **帳簿記載要件** | Sugusru側の責務ではない | — | ✅ 対忚不要 |

### 課税方式別税区分制限（実機データ検証済み 2026-05-23）

| 課税方式 | MF available=true | Sugusru側制限（UIマスタ側のみ実装済み） | MF送信バリデーション |
|---|---|---|---|
| **免税** | **0件**（全件false） | `COMMON_EXEMPT`のみ表示 | ✅ `TAX_EXEMPT_VIOLATION` |
| **簡易課税** | **78件** | T系（事業区分付き売上）+ 仕入系 + 共通系。原則用売上不可 | ✅ `TAX_SIMPLIFIED_VIOLATION` |
| **本則（一括比例）** | **44件** | 「共通課税仕入」「非課税対応仕入」が**ない** | ✅ `TAX_PROPORTIONAL_VIOLATION` |
| **本則（個別対応）** | **73件** | 「共通課税仕入」「非課税対応仕入」が**ある** | ✅ 制限なし（全税区分許可） |

> [!IMPORTANT]
> **MF APIの`available`フラグが正。** 課税方式ごとに使える税区分がMF側で制御されている。
> 現在はSugusru側ではIDパターンマッチ（`_T[1-6]`/`_COMMON_`/`_NT_`）で代替実装済み。
> 将来的に`MfMappingTables`にavailable情報を追加するとより正確になるが、現状でも実用上十分。

---

## §5. バリデーション一覧（validateBeforeConvert）

| チェック項目 | エラー型 | 対応日 | 検証 |
|---|---|---|---|
| 日付null | `DATE_NULL` | 初版 | ✅ |
| 日付フォーマット（YYYY-MM-DD） | `DATE_FORMAT` | 2026-05-23 | ✅ |
| 日付が無効（2月30日等） | `DATE_FORMAT` | 2026-05-23 | ✅ |
| 借方0件 | `ENTRIES_EMPTY` | 2026-05-23 | ✅ |
| 貸方0件 | `ENTRIES_EMPTY` | 2026-05-23 | ✅ |
| 科目null | `ACCOUNT_NOT_FOUND` | 初版 | ✅ |
| 科目MF未マッチ | `ACCOUNT_NOT_FOUND` | 初版 | ✅ |
| 金額null | `AMOUNT_NULL` | 初版 | ✅ |
| 金額0円 | `AMOUNT_ZERO` | 2026-05-23 | ✅ 実機テスト確認 |
| 金額負数 | `AMOUNT_NEGATIVE` | 2026-05-23 | ✅ 実機テスト確認 |
| 金額小数 | `AMOUNT_DECIMAL` | 2026-05-23 | ✅ 実機テスト確認 |
| 金額NaN/Infinity | `AMOUNT_INVALID` | 2026-05-23 | ✅ |
| 税区分MF未マッチ | `TAX_NOT_FOUND` | 初版 | ✅ |
| 貸借不一致 | `DEBIT_CREDIT_MISMATCH` | 初版 | ✅ |
| 科目-税区分方向整合性 | `TAX_DIRECTION_MISMATCH` | 2026-05-23 | ✅ |
| 免税事業者の課税税区分 | `TAX_EXEMPT_VIOLATION` | 2026-05-23 | ✅ |
| 簡易課税の原則用売上税区分 | `TAX_SIMPLIFIED_VIOLATION` | 2026-05-23 | ✅ |
| 本則一括比例の個別対応用税区分 | `TAX_PROPORTIONAL_VIOLATION` | 2026-05-23 | ✅ |
| 経過措置期間の日付分岐 | `toInvoiceKind`内 | 2026-05-23 | ✅ MF enum追加待ち |

---

## §6. 既存部品の棚卸し

| 部品 | ファイル | 状態 |
|---|---|---|
| MCPクライアント（callMcpTool） | [mfMcpClient.ts](file:///c:/dev/receipt-app/src/api/services/mfMcpClient.ts) | ✅ |
| postJournals（mcpCreateJournal） | 同上 | ✅ |
| putJournals（mcpUpdateJournal） | 同上 | ✅ |
| 科目一覧取得（mcpFetchAccounts） | 同上 | ✅ |
| 税区分一覧取得（mcpFetchTaxes） | 同上 | ✅ |
| Sugusru→MFマッピング | [mfMappingService.ts](file:///c:/dev/receipt-app/src/api/services/mfMappingService.ts) | ✅ |
| debit/credit → branches変換 | [journalToMfConverter.ts](file:///c:/dev/receipt-app/src/api/services/journalToMfConverter.ts) | ✅ |
| バリデーション | 同上 | ✅（§5参照。税務チェック実装済み） |
| 1件送信 | [mfJournalSender.ts](file:///c:/dev/receipt-app/src/api/services/mfJournalSender.ts) | ✅ |
| バッチ送信（429リトライ付き） | 同上 | ✅ |
| MF-ID紐付け | 同上（applyMfSendResults） | ✅ |
| 科目-税区分方向整合性チェック | [journalToMfConverter.ts](file:///c:/dev/receipt-app/src/api/services/journalToMfConverter.ts) | ✅ `TAX_DIRECTION_MISMATCH` |
| 免税事業者の課税税区分制限 | 同上 | ✅ `TAX_EXEMPT_VIOLATION` |
| 簡易課税の売上税区分制限 | 同上 | ✅ `TAX_SIMPLIFIED_VIOLATION` |
| 本則一括比例の個別対応用制限 | 同上 | ✅ `TAX_PROPORTIONAL_VIOLATION` |
| 経過措置期間の日付分岐 | 同上（`toInvoiceKind`） | ✅ UNQUALIFIED_50/NOT_QUALIFIED_0 |
| 科目/税区分方向マップ | [mfMappingService.ts](file:///c:/dev/receipt-app/src/api/services/mfMappingService.ts) | ✅ `accountDirectionMap`/`taxDirectionMap` |
| **未マッチ科目のUI警告** | — | ❌ 未実装（35件） |

---

## §7. 修正履歴

| 日付 | 内容 |
|---|---|
| 2026-05-23 初版 | 対応表作成。実機テストMF#28〜#39 |
| 2026-05-23 改訂1 | tax_id/sub_account_id/trade_partner_code実機テスト追加（MF#40〜#42） |
| 2026-05-23 改訂2 | 2:2/3:3 N:N実機テスト追加（MF#43〜#44） |
| 2026-05-23 改訂3 | value境界値テスト（0/負数/小数）。全てMF API拒否確認 |
| 2026-05-23 改訂4 | バリデーション全面強化（AMOUNT_NEGATIVE/DECIMAL/INVALID/DATE_FORMAT/ENTRIES_EMPTY追加） |
| 2026-05-23 改訂5 | 🐛 hasNonQualifiedバグ修正（存在しないenum値→invoice_statusベース判定） |
| 2026-05-23 改訂6 | 🐛 convertSide防御コード追加（`?? ''`/`?? 0`→throw Error） |
| 2026-05-23 改訂7 | **全面改訂。** 全項目に検証ステータス付与。税務上の未対応事項§4を新設 |
| 2026-05-23 改訂8 | 実機調査実施。UNQUALIFIED_50未存在確認、免税+課税仕入通過確認(MF#45)、売上+仕入税区分通過確認(MF#2) |
| 2026-05-23 改訂9 | **税務バリデーション実装:** `TAX_DIRECTION_MISMATCH`、`TAX_EXEMPT_VIOLATION`、`toInvoiceKind`日付分岐、`SourceJournal.consumption_tax_mode`追加、`MfMappingTables`に方向マップ追加 |
| 2026-05-23 改訂10 | **UNQUALIFIED_50設計変更:** 80%代替送信→50を実際に送信。MF未対応ならenumエラーで自然停止（過大控除防止）。2029/10以降の`NOT_QUALIFIED_0`も同様 |
| 2026-05-23 改訂11 | **全課税方式バリデーション完了:** `TAX_SIMPLIFIED_VIOLATION`（簡易:原則用売上禁止）、`TAX_PROPORTIONAL_VIOLATION`（本則一括:COMMON/NT系禁止）追加。`consumption_tax_mode`に`general_proportional`/`general_individual`追加 |
| 2026-05-23 改訂12 | **インボイス番号実機テスト:** MF APIが国税庁DBに実際に照会して検証することを確認。T+13桁→「13桁半角数字のみ」で拒否、13桁数字→「国税庁に存在しない」で拒否、12桁→桁数チェックで拒否。Sugusru側検証不要。取引先削除APIは存在しない |
| 2026-05-23 改訂13 | **🐛 invoice_kind送信不可は完全な誤り。** QUALIFIED/UNQUALIFIED_80は送信可能（MF#7,#8）。NOT_TARGETは対象外税区分とセットなら受理（MF#10）、課税税区分とセットなら拒否。`stripInvoiceKind`廃止。senderはペイロードをそのまま送信。MF管理画面での手動修正は不要 |
| 2026-05-23 改訂14 | **🐛 簡易課税でinvoice_kind設定→拒否も誤り。** MFを簡易に変更してテスト。QUALIFIED(MF#12)/UNQUALIFIED_80(MF#13)/NOT_TARGET+対象外(MF#14)全て受理。省略時は課税→QUALIFIED(MF#15)、対象外→NOT_TARGET(MF#16) |
| 2026-05-23 改訂15 | **🐛 免税でinvoice_kind設定→拒否も誤り。** MFを免税に変更してテスト。QUALIFIED(MF#17)/UNQUALIFIED_80(MF#18)/NOT_TARGET(MF#19)全受理。省略→課税:QUALIFIED(MF#20)、対象外:NOT_TARGET(MF#21)。**結論: 全課税方式で全invoice_kindが受理される。MFは課税方式でinvoice_kindを制限しない** |
| 2026-05-23 改訂16 | **MF→Sugusru逆変換コンバーター実装。** `mfJournalImporter.ts`新規作成。MfMcpJournal→ConfirmedJournal変換。科目・税区分は逆マップ（reverseAccountMap/reverseTaxMap）でSugusru概念IDに変換。invoice_kindはSugusru形式に逆変換。mf_rawで生レスポンスまるごと保持。保存先をjournalStore→confirmedJournalStore（過去仕訳CSV）に変更 |

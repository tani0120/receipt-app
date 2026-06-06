# ID属性化リネーム設計書（v5統合版）

## 背景

### 調査経緯

1. **v1**（AI生成）: 「88箇所」「60ファイル以上」→ 実測で全て嘘と判明
2. **v2**（実測修正）: 子エンティティ（`LearningRuleEntryLine.id`等）の見落とし
3. **v3**（子エンティティ追加）: src/types/のみ調査。src/全体は未調査
4. **v4**（ゼロベース再調査）: src/全体で未属性化id **192件**を検出。カテゴリ分類と方針決定
5. **v5**（実装完了+検証）: 全10エンティティの変更完了。BOM混入・JournalRow型・テストスクリプト等の追加問題9件を発見修正。12API+4ページ+操作テストで正常動作確認

## 目的

`id`→属性別ID（`accountId`, `taxCategoryId`等）にリネームし、フィールド名だけで所属エンティティが特定できるようにする。

---

## ✅ 全完了 — 出口条件達成

| # | 条件 | 結果 |
|---|---|---|
| 1 | src/types/配下の全インターフェースで`id`フィールドがゼロ | ✅ |
| 2 | `vue-tsc --noEmit` エラーゼロ | ✅ |
| 3 | ブラウザ動作確認（マスタ・顧問先・仕訳画面が正常表示） | ✅ |
| 4 | 全データファイル（JSON）のフィールド名変更完了 | ✅ |
| 5 | 全APIレスポンスで旧`id`フィールド残存ゼロ | ✅ |

---

## 対象エンティティ（全10件完了）

| # | インターフェース | ファイル | 新ID | データファイル |
|---|---|---|---|---|
| 1 | Account | shared-account.ts | accountId | account-master.json + accounts-c_*.json (11件) |
| 2 | TaxCategory | shared-tax-category.ts | taxCategoryId | tax-category-master.json + tax-categories-c_*.json (18件) |
| 3 | JournalPhase5Mock | journal_phase5_mock.type.ts | journalId | journals-c_*.json (7件) |
| 4 | JournalEntryLine | domain-journal.ts | entryId | （3と同一JSON内entries） |
| 5 | ConfirmedJournal | confirmed_journal.type.ts | journalId | confirmed_journals.json 親1537件 |
| 6 | ConfirmedJournalEntry | confirmed_journal.type.ts | entryId | confirmed_journals.json 子3230件 |
| 7 | DocumentMock | document_mock.type.ts | documentId | document_mock_data.ts |
| 8 | Document | document.types.ts | documentId | なし |
| 9 | AuditLog | document.types.ts | auditLogId | なし |
| 10 | DocumentViewModel | documentViewModel.ts | documentId | なし |

> [!NOTE]
> LearningRule→ruleId、LearningRuleEntryLine→entryIdも実装済み。

### 親子関係

| 親 | 子 | 親ID | 子ID |
|---|---|---|---|
| LearningRule | LearningRuleEntryLine | ruleId ✅ | entryId ✅ |
| ConfirmedJournal | ConfirmedJournalEntry | journalId ✅ | entryId ✅ |
| JournalPhase5Mock | JournalEntryLine | journalId ✅ | entryId ✅ |

> [!WARNING]
> `JournalEntryLine.entryId`は`string | null`（レガシーデータでnull）。

### 対象外（変更不可な外部API型）

| 型 | ファイル | 理由 |
|---|---|---|
| MfMcpAccount.id | mfMcpClient.ts | MF APIレスポンス型 |
| MfMcpTax.id | mfMcpClient.ts | 同上 |
| MfMcpJournal.id | mfMcpClient.ts | 同上 |
| MfJournalResponse.id | mfMcpClient.ts | 同上 |
| McpToolInfo.id | mfMcpClient.ts | MCPツール定義 |

---

## 実装時に発見・修正した追加問題

### 🔴 致命的

| # | 問題 | ファイル | 影響 |
|---|---|---|---|
| 1 | **BOM混入**（30ファイル） | data/*.json | JSON.parse失敗→サーバー再起動時に全データ消失 |
| 2 | JournalRow型の旧`.id`参照 | journalListService.ts L244-245 | コンパイルエラー（仕訳ソート不能） |

### 🟡 波及修正

| # | 問題 | ファイル |
|---|---|---|
| 3 | JournalRow/JournalEntry型の`id`フィールド | journalListService.ts L28,L41 |
| 4 | confirmedToJournalRow内のid構築 | journalListService.ts L98,L106,L117 |
| 5 | SourceJournal `id`リテラル（8箇所） | test_mf_send.ts |
| 6 | SugAccount/SugTax型の`id` | test_validation.ts L38,L45,L114 |
| 7 | CLIENT_IDのundefined可能性 | test_validation.ts L13 |

### ⚪ コメント

| # | 問題 | ファイル |
|---|---|---|
| 8 | `TaxCategory.id`→`taxCategoryId` | shared-account.ts L33 |
| 9 | `row.id`→`row.taxCategoryId` | accountMasterStore.ts L456 |

---

## 最終検証結果（2026-06-06 23:39 JST）

### API検証（12エンドポイント全クリア）

| API | 件数 | undefined | 旧id |
|---|---|---|---|
| マスタ科目 | 241 | ✅ 0 | ✅ なし |
| マスタ税区分 | 151 | ✅ 0 | ✅ なし |
| 顧問先科目(c_wTdnMKDO) | 71 | ✅ 0 | ✅ なし |
| 顧問先科目(c_rODnkCDN) | 82 | ✅ 0 | ✅ なし |
| 顧問先科目(c_VdAnGFq3) | 82 | ✅ 0 | ✅ なし |
| 顧問先税区分(c_wTdnMKDO) | 36 | ✅ 0 | ✅ なし |
| 顧問先税区分(c_rODnkCDN) | 36 | ✅ 0 | ✅ なし |
| 仕訳一覧(c_VdAnGFq3) | 36 | ✅ 0 | ✅ なし |
| フィルタ(corp) | 133 | — | — |
| フィルタ(individual) | 108 | — | — |
| 検索(現金) | 2 | — | — |
| 税区分(5方式別) | 各正常 | — | — |

### ブラウザ実地テスト（4ページ全クリア）

| ページ | データ | コンソール | undefined |
|---|---|---|---|
| `/master/accounts` | ✅ 96行 | ✅ なし | ✅ なし |
| `/master/tax` | ✅ 42行 | ✅ なし | ✅ なし |
| `/client-settings/accounts/c_wTdnMKDO` | ✅ 46行 | ✅ なし | ✅ なし |
| `/journal-list/c_VdAnGFq3` | ✅ 8行 | ✅ なし | ✅ なし |

### 操作テスト

| 操作 | 結果 |
|---|---|
| マスタ科目ソート（列クリック） | ✅ 正常 |
| マスタ科目検索（「現金」） | ✅ 2件ヒット |
| 税区分の課税方式フィルタ切替 | ✅ 5方式全正常 |
| 科目フィルタ（corp/individual） | ✅ 133/108件 |

---

## 教訓

> [!CAUTION]
> Node.jsの`writeFileSync`でJSON一括置換する際、PowerShellのエンコーディング設定により**UTF-8 BOM（0xEF 0xBB 0xBF）が混入する**ことがある。
> JSON.parseはBOMを不正文字として拒否するため、サーバー起動時にデータが全消失する致命的な障害を引き起こす。
> **対策**: 一括変換後は必ず `[System.IO.File]::ReadAllBytes()` で先頭3バイトを確認すること。

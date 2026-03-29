# Phase C 技術的負債

**作成日**: 2026-02-27
**目的**: アーキテクチャ・型統一・本番化に関わる構造的負債を管理
**解決時期**: Phase C実装開始時（本番昇格前）

---

## 振り分け基準（Phase B / C 共通）

| 分類 | Phase B | Phase C |
|------|---------|---------|
| **性質** | テスト精度・挙動に影響 | アーキテクチャ・型統一・本番化 |
| **放置リスク** | 中（精度測定が歪む） | 高（構造崩壊） |
| **対象** | 精度改善、学習ロジック、警告ロジック、軽微整合 | スキーマ統一、型移行、RPC実装、as any全除去、API層zod整合 |
| **判断基準** | Run B〜学習ロジック設計に影響するか？ | 本番昇格に必要か？ |

> [!CAUTION]
> Phase Cに入るまで、新規コードで旧firestore型（`drAccount`, `lineNo`等）を**絶対に使わない**こと。
> zodスキーマ（`@/features/journal`）が唯一のSSOT。

---

## 🔴 C-1: JournalService.ts 新旧スキーマ統一

- **ファイル**: [JournalService.ts](file:///C:/dev/receipt-app/src/services/JournalService.ts) 全体
- **問題**: `types/journal.ts`がzodスキーマからの推論型に移行済みだが、`JournalService.ts`は旧`firestore.ts`の`JournalLine`フィールド（`drAccount`, `crAccount`, `lineNo`, `drAmount`, `crAmount`）を使用
- **影響**: 14件のコンパイルエラー。型の二重管理（`types/journal.ts`自身のコメントで禁止事項に明記）
- **根本原因**: 旧Firestoreスキーマ → 新zodスキーマの移行が不完全
- **解決策**:
  1. `JournalService.ts`のmockデータを新型に合わせて再構築
  2. `calculateBalance()`を新フィールド（`debit`, `credit`）で計算
  3. `validateJournal()`を新フィールド（`accountCode`）で検証
  4. `status`のenum値を新型（`'Submitted'|'Approved'|'READY_FOR_WORK'|'REMANDED'`）に統一
  5. `transactionDate`/`updatedAt`をstring型に変更（新型はISO文字列）
- **影響範囲**: JournalService.ts内で完結（外部からの呼び出しは型が変わる）

---

## 🔴 C-2: firestore.ts 旧JournalLine型の廃止

- **ファイル**: [firestore.ts](file:///C:/dev/receipt-app/src/types/firestore.ts) L199-L244
- **問題**: 旧`JournalLine`が残存。新型は`@/features/journal`のzodスキーマ由来
- **影響**: 旧型を参照するコードが新旧混在を引き起こす
- **解決策**: C-1完了後に旧`JournalLine`を`@deprecated`マーク → 参照0件を確認して削除
- **前提**: C-1が先に完了していること

---

## 🟠 C-3: jobRepository.ts `as unknown as Record`

- **ファイル**: [jobRepository.ts](file:///C:/dev/receipt-app/src/repositories/jobRepository.ts) L31
- **問題**: `data as unknown as Record<string, unknown>` — P0+P1修正で`as any`を除去したが、本質的には`FirestoreRepository.updateJob`の引数型と`Partial<JobApi>`の乖離が原因
- **解決策**: `FirestoreRepository.updateJob`の引数型を`Partial<JobApi>`に合わせるか、アダプター層で正しく変換

---

## 🟠 C-4: api/routes/jobs.ts `as any` + `catch (e: any)`

- **ファイル**: [jobs.ts](file:///C:/dev/receipt-app/src/api/routes/jobs.ts)
- **問題**:
  - L50: `data as any` — zodバリデーション結果を`Partial<JobApi>`にキャスト
  - L16, L30: `catch (e: any)` — エラーハンドリングでany使用（2箇所）
- **解決策**:
  - L50: `JobSchema.partial()`の推論結果と`Partial<JobApi>`を整合させる
  - L16,30: `catch (e: unknown)` + `e instanceof Error`型ガード

---

## 🟠 C-5: legacy_to_v2.ts TODO残骸（6件）

- **ファイル**: [legacy_to_v2.ts](file:///C:/dev/receipt-app/src/libs/adapters/legacy_to_v2.ts)
- **問題**: 仮値TODOが6件残存
  - L68: `person_in_charge_id: 'unknown_staff'`
  - L69: `contract_start_date: old.updatedAt`
  - L117: `type: 'development'`
  - L127: `applied_hourly_rate: 0`
  - L128: `calculated_cost: 0`
  - L176: `merchant_name: ''`
- **影響**: 本番データで仮値が混入する
- **解決策**: 各フィールドの正しいマッピング元を特定して実装

---

## 🟠 C-6: useJournalEntryRPC.ts 空実装

- **ファイル**: [useJournalEntryRPC.ts](file:///C:/dev/receipt-app/src/composables/useJournalEntryRPC.ts) L10-26
- **問題**: 3関数が全てTODO（`console.log`のみ）
- **影響**: RPC呼び出しが動作しない
- **解決策**: Supabase RPC実装

---

## 🟡 C-7: Composable層 `as any`（13件）

- **ファイル**:
  - [AIRulesMapper.ts](file:///C:/dev/receipt-app/src/composables/AIRulesMapper.ts) L14-20（3件: Firestore Timestamp変換）
  - [DataConversionMapper.ts](file:///C:/dev/receipt-app/src/composables/DataConversionMapper.ts) L13（1件: raw as any）
  - [mapper.ts](file:///C:/dev/receipt-app/src/composables/mapper.ts) L64-76, L321-329, L456（6件: Timestamp + taxDetails）
  - [useAIRules.ts](file:///C:/dev/receipt-app/src/composables/useAIRules.ts) L108（1件: window拡張）
  - [useDataConversion.ts](file:///C:/dev/receipt-app/src/composables/useDataConversion.ts) L57-58（2件: プロパティ注入）
- **解決策**: Firestore→Supabase移行時にTimestamp型がなくなるため自然解決する部分が多い

---

## 🟡 C-8: UI層 `as any`（8件）

- **ファイル**:
  - [ScreenH_TaskDashboard.vue](file:///C:/dev/receipt-app/src/views/ScreenH_TaskDashboard.vue) L512
  - [ScreenB_JournalStatus.vue](file:///C:/dev/receipt-app/src/views/ScreenB_JournalStatus.vue) L93
  - [ReceiptDetail.vue](file:///C:/dev/receipt-app/src/views/ReceiptDetail.vue) L91
  - [ScreenB_Restore_Mock.vue](file:///C:/dev/receipt-app/src/views/debug/ScreenB_Restore_Mock.vue) L239
  - [ScreenE_JournalEntry.vue](file:///C:/dev/receipt-app/src/components/ScreenE_JournalEntry.vue) L481, L647-649, L722
  - [ScreenE_LogicMaster.vue](file:///C:/dev/receipt-app/src/components/ScreenE_LogicMaster.vue) L451-452
  - [JournalListLevel3Mock.vue](file:///C:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue) L105
- **2026-03-29変更**: ~~ScreenS_AccountSettings.vue~~は到達不能レガシーとして物理削除済み。9件→8件に減少
- **解決策**: UI再定義時に型を正しく定義。一部はPhase Cのmock→本番切替で解消

---

## 🟡 C-9: Firestore接続TODO（6件）

- **ファイル**:
  - [useJournalEntries.ts](file:///C:/dev/receipt-app/src/hooks/useJournalEntries.ts) L32, L78, L105, L126（4件）
  - [features/receipt/index.ts](file:///C:/dev/receipt-app/src/features/receipt/index.ts) L78
  - [features/client/index.ts](file:///C:/dev/receipt-app/src/features/client/index.ts) L78
  - [ReceiptDetail.vue](file:///C:/dev/receipt-app/src/views/ReceiptDetail.vue) L102（`// TODO: API呼び出し`）
- **解決策**: Supabase移行時に実装

---

## 🟡 C-11: テストコード `as any`（14件）

監査で「許容」と判定したが、記録として管理する。

| ファイル | 件数 |
|---------|:---:|
| [JobMapper.test.ts](file:///C:/dev/receipt-app/src/__tests__/JobMapper.test.ts) | 3件 |
| [ClientMapper.test.ts](file:///C:/dev/receipt-app/src/__tests__/ClientMapper.test.ts) | 7件 |
| [schema-mapper.spec.ts](file:///C:/dev/receipt-app/src/utils/__tests__/schema-mapper.spec.ts) | 3件 |
| [test_scenarios.ts](file:///C:/dev/receipt-app/src/mocks/test_scenarios.ts) | 1件 |

- **判定**: テストコード内のas anyは型安全性への影響が限定的。本番コード優先
- **解決策**: 各テストのmockデータを正しい型で構築し直す

---

## 🟡 C-12: 責務混在（4件）

機械検出だけでは判定できないため、個別確認が必要な候補:

| # | ファイル | 問題 | 深刻度 |
|---|---------|------|:---:|
| 1 | [ScreenE_JournalEntry.vue](file:///C:/dev/receipt-app/src/components/ScreenE_JournalEntry.vue) L481 | `transactionDate`直接書き換え → 業務ロジックがVue内 | 🟠 |
| 2 | [ScreenE_JournalEntry.vue](file:///C:/dev/receipt-app/src/components/ScreenE_JournalEntry.vue) L647-649 | `isLocked`/`journalEditMode`制御 → ステート管理がVue内 | 🟠 |
| 3 | [mapper.ts](file:///C:/dev/receipt-app/src/composables/mapper.ts) L321,329 | `taxDetails?.rate`直接アクセス → 税計算ロジックがMapper内 | 🟡 |
| 4 | [useBankLogic.ts](file:///C:/dev/receipt-app/src/composables/useBankLogic.ts) L60 | 信頼度スコア計算 → 業務判定ロジックがcomposable内 | 🟡 |

- **解決策**: UI再定義時にロジックをcomposable/serviceに分離

---

## 🟡 C-13: 計画的TODO（Phase C対象 1件）

| ファイル | 行 | 内容 |
|---------|:---:|------|
| [JournalListLevel3Mock.vue](file:///C:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue) | L612 | 過去仕訳検索（未実装機能） |

---

## 🟠 C-16: labels責務分離（classificationLabels / warningLabels / export_exclude）

- **ファイル**: [JournalListLevel3Mock.vue](file:///C:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue)、[MockExportPage.vue](file:///C:/dev/receipt-app/src/mocks/views/MockExportPage.vue)、[journal_phase5_mock.type.ts](file:///C:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts)、[journalWarningSync.ts](file:///C:/dev/receipt-app/src/mocks/utils/journalWarningSync.ts)
- **現状**: `journal.labels`に分類・警告・操作（EXPORT_EXCLUDE）が混在
- **2026-03-27進捗**: `syncWarningLabelsCore()`を[journalWarningSync.ts](file:///c:/dev/receipt-app/src/mocks/utils/journalWarningSync.ts)に抽出済み。JournalListLevel3MockとMockExportPageの両方で共有。warning_details/warning_dismissals追加済み。EXCLUDE_LABELSリストを[exportMfCsv.ts](file:///c:/dev/receipt-app/src/mocks/utils/exportMfCsv.ts)に一元定義済み
- **問題**:
  - 責務不明確（入力データ / 計算結果 / ユーザー操作が同じ配列）
  - `journal.labels.push()`による副作用的mutation
  - 将来のcomputed化・ruleEngine化を阻害
- **方針**:
  - `classificationLabels`（不変、DB永続）: TRANSPORT, RECEIPT, INVOICE_QUALIFIED等
  - `warningLabels`（計算結果、DBに持たない）: CATEGORY_CONFLICT, TAX_UNKNOWN, VOUCHER_TYPE_CONFLICT, TAX_ACCOUNT_MISMATCH, SAME_ACCOUNT_BOTH_SIDES, DESCRIPTION_UNKNOWN等。`syncWarningLabelsCore()`で都度計算
  - `export_exclude`（BOOLEAN、DB永続）: labelsから排除し独立カラム化
- **解決策**:
  1. `export_exclude`をDBカラム化し、labelsから`EXPORT_EXCLUDE`を排除
  2. `labels` = classificationLabelsのみに純粋化
  3. `useJournalValidation` composable導入（computed + pure function）
  4. warningLabelsはwatch+mutationではなくcomputed生成に変更

---

## 🟡 C-10: classify_schema.ts Geminiスキーマ内HandwrittenFlag文字列

- **ファイル**: [classify_schema.ts](file:///C:/dev/receipt-app/src/scripts/classify_schema.ts) L359
- **問題**: `enum: ['NONE', 'NON_MEANINGFUL', 'MEANINGFUL']` — Gemini APIへの送信用JSONスキーマ定義
- **現状判断**: API送信用のJSON定義なので文字列は技術的に必要。ただし`Object.values(HandwrittenFlag)`から自動生成すれば定数連動可能
- **解決策**: `enum: Object.values(HandwrittenFlag)`に変更してdomain定数と連動

---

## 🟡 C-14: sharp CJS/ESM問題

- **出典**: [証票分類パイプライン設計書.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/証票分類パイプライン設計書.md) §10-4
- **問題**: `import sharp from 'sharp'`が`esModuleInterop`に依存。CJS/ESMの相互運用問題
- **影響**: `tsconfig.pipeline.json`作成時（RC-2）に顕在化する可能性
- **解決策**: `import sharp from 'sharp'` → `import * as sharp from 'sharp'`、または`tsconfig.pipeline.json`で`esModuleInterop: true`を明示設定

---

## 🟡 C-15: receiptsテーブルRLSポリシーが過剰に許可的

- **出典**: [supabase_security_report_260214.md](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/supabase_security_report_260214.md)
- **問題**: `receipts`テーブルのRLSポリシーが警告レベル。アクセス制御が不十分
- **影響**: 本番環境でデータ漏洩のリスク
- **解決策**: client_idベースのフィルタリングポリシーに修正（RC-6 RLS本番化時に同時対処）

---

## 🟡 C-17: syncWarningLabelsCore 対症療法の根本修正

- **ファイル**: [journalWarningSync.ts](file:///C:/dev/receipt-app/src/mocks/utils/journalWarningSync.ts)、[MockExportPage.vue](file:///C:/dev/receipt-app/src/mocks/views/MockExportPage.vue)
- **2026-03-27進捗**: syncWarningLabelsCoreをjournalWarningSync.tsに抽出済み。9種のバリデーション（ACCOUNT_UNKNOWN, TAX_UNKNOWN, DESCRIPTION_UNKNOWN, DATE_UNKNOWN, AMOUNT_UNCLEAR, DEBIT_CREDIT_MISMATCH, CATEGORY_CONFLICT, VOUCHER_TYPE_CONFLICT, TAX_ACCOUNT_MISMATCH, SAME_ACCOUNT_BOTH_SIDES）を実装。AccountForValidation/TaxCategoryForValidation型で最小依存。warning_details自動格納。warning_dismissals対応
- **現状**: 出力ページの`onMounted`で`syncWarningLabelsCore()`を手動実行（対症療法は残存）
- **問題**: 新しいページが増えるたびに同じ呼び出しを追加する必要がある
- **解決策**: C-16のuseJournalValidation導入により、全ページで自動的にバリデーション済みデータを取得可能にする。onMounted手動呼び出しは削除

---

## 🟡 C-18: Supabase型移行準備（V2計画残り16件）

- **出典**: 実装計画V2 Step 1-3（J〜V拡張 + W〜AD）
- **判断**: モック段階では実質的価値なし。Supabase接続時に実施
- **対象**:

### 型不一致（8件）

| # | 項目 | モック型 | PostgreSQL型 |
|:--|:---|:---|:---|
| J拡張 | statusのnull→'pending'変更 | `'exported' \| null` | ENUM |
| K拡張 | クライアントstatusのENUM化 | ✅ 実施済み（ClientStatus型追加） | — |
| L拡張 | スタッフstatusのENUM化 | string | ENUM(active/inactive) |
| O拡張 | voucher_dateの型準備 | ✅ TODOコメント追記済み | DATE |
| P拡張 | document_idのUUID準備 | string | VARCHAR(20) |
| Q拡張 | deleted_atの型準備 | ✅ TODOコメント追記済み | TIMESTAMPTZ |
| R拡張 | memo_created_atの型準備 | ✅ TODOコメント追記済み | TIMESTAMPTZ |
| V | rule_idのFK準備 | string \| null | VARCHAR(20) |

### composable層（6件）

| # | 項目 | 現状 | Supabase移行後 |
|:--|:---|:---|:---|
| W | useJournals repository差し替え | localStorage直接 | Supabase repository |
| X | useClients repository差し替え | localStorage直接 | 同上 |
| Y | useStaff repository差し替え | localStorage直接 | 同上 |
| Z | useAccountSettings repository差し替え | localStorage直接。2026-03-29: フォールバック内部化完了（scope='client'データ取得失敗時にcomposable内部でマスタデータをフォールバック返却。呼び出し側のmasterSettings参照・三項演算子フォールバック全廃止）。開発品質ルール（`.agent/workflows/code_quality.md`）策定済み。到達不能レガシー`ScreenS_AccountSettings.vue`物理削除済み | Supabase repository |
| AA | useProgress repository差し替え | localStorage直接 | 同上 |
| AB | useUnsavedGuard ロジック変更 | localStorage依存 | Supabase対応 |

### domain層（2件）

| # | 項目 | 現状 | Supabase移行後 |
|:--|:---|:---|:---|
| AC | JournalEntryLineテーブル対応 | 埋め込みオブジェクト | 別テーブルの行 |
| AD | JournalLabel/JournalLabelMock型対応 | TypeScript union型 | TEXT[]またはENUM配列 |

---

## 解決済み（2026-02-27に対処完了）

| 項目 | 対処 |
|------|------|
| `as any as Job` 二重キャスト | Job型で直接構築に変更 |
| `JournalService.ts` `(data as any).remandCount` | Job型にremandCount追加 |
| `ai-rules.ts` 4箇所のas any | zodスキーマとLearningRuleUi整合 |
| `LogicSelector.ts` | 削除（import先不在で壊れていたため） |
| `has_handwritten_memo` → `handwritten_flag` | 全ファイル移行完了 |
| domain層新設 | `src/domain/types/journal.ts` |
| `JournalLabelPhase5` → `JournalLabel` | リネーム+mocks層で`JournalLabelMock`に分離 |
| `classify_postprocess.ts` HandwrittenFlag | 定数参照に変更済み |

---

## チェックリスト

- [ ] C-1: JournalService.ts 新zodスキーマ移行
- [ ] C-2: firestore.ts 旧JournalLine廃止
- [ ] C-3: jobRepository.ts 型整合
- [ ] C-4: jobs.ts as any + catch any除去
- [ ] C-5: legacy_to_v2.ts TODO解消
- [ ] C-6: useJournalEntryRPC.ts RPC実装
- [ ] C-7: Composable as any除去
- [ ] C-8: UI層 as any除去
- [ ] C-9: Firestore→Supabase TODO実装
- [ ] C-10: classify_schema.ts HandwrittenFlag定数連動
- [ ] C-11: テストコード as any対処
- [ ] C-12: 責務混在分離
- [ ] C-13: 計画的TODO対処（1件）
- [ ] C-14: sharp CJS/ESM問題
- [ ] C-15: receiptsテーブルRLSポリシー修正
- [ ] C-16: labels責務分離（classificationLabels / warningLabels / export_exclude）
- [ ] C-17: syncWarningLabelsCore対症療法の根本修正
- [ ] C-18: Supabase型移行準備（16件）

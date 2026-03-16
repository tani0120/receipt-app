# Phase B リファクタリング計画

**作成日**: 2026-02-27
**目的**: コードは動作するが構造改善が必要な項目を管理
**解決時期**: Phase B（UI再定義〜構造固定）
**移管元**: `04_mock/task_phase_a.md` §5.1（2026-02-27移管）

---

## 振り分け基準（技術的負債 vs リファクタリング）

| 分類 | 05_technical_debt | 06_refactoring |
|------|-------------------|----------------|
| **性質** | 壊れている（型崩壊・設計違反・データ汚染） | 壊れていないが美しくない |
| **放置リスク** | 高（バグ・精度劣化） | 中（保守性低下） |
| **優先度** | 修正必須 | 余力時 |

---

## A. 型安全の厳格化

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| A1 | `getValue()`の`any`排除 | L1662: `eslint-disable`付き`any` | `keyof`制約 or 列定義型連動方式に書き換え |
| A2 | `non-null assertion (!)`解消 | 12箇所（`commentModalJournal!` 8件 + `staff_notes!` 4件） | computed保証 + `v-if`でガード → `!`不要化 |
| A3 | Domain型強制（ガイド ルール3） | Phase Aでは未適用 | `createMockJournal()`形式必須化 |
| A4 | 生成関数化（ガイド ルール4） | Phase Aでは直書き許容 | `src/mocks/factories/journalFactory.ts`でFactory必須化 |
| A5 | `noUncheckedIndexedAccess`追加 | tsconfig未設定 | 新規コード安定後に追加 |
| A6 | `exactOptionalPropertyTypes`追加 | tsconfig未設定 | 同上 |
| A7 | `noPropertyAccessFromIndexSignature`追加 | tsconfig未設定 | 同上 |
| A8 | `api/components/composables`の`any` 160件修正 | warn状態 | 段階的にerrorへ引き上げ |
| A9 | `unused-vars` 69件削除 | warn状態 | 削除（`@ts-expect-error`不使用） |

---

## B. コンポーネント分離

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| B1 | CellComponent分離 | 全10列が`JournalListLevel3Mock.vue`に直書き | `PhotoCell`, `CommentCell`, `NeedActionCell`等に分離 |
| B2 | `getCellComponent`方式導入 | v-if連鎖 | `cellComponents: Record<string, Component>` + 動的`<component :is>` |
| B3 | モーダル分離 | コメントモーダル・画像プレビュー等がVue内 | 各モーダルを独立コンポーネントに |
| B4 ②④⑤ | staff_notes分離（構造改善部分） | staff_notesとlabels混在 | ② NEED_*を`JournalLabelPhase5`型から削除 ④ Vueフィルタの参照先をstaff_notesに変更 ⑤ 全動作検証 |

> [!NOTE]
> B4①③（`syncLabelsFromStaffNotes`廃止 + fixture汚染データ除去）は設計違反のため [technical_debt_phase_b.md](file:///C:/dev/receipt-app/docs/genzai/05_technical_debt/technical_debt_phase_b.md) B-13, B-14 で管理。

---

## C. データ・Fixture管理

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| C1 | Fixture完全凍結 | Phase Aでは1-2件変更可 | 凍結。新規はFactory経由のみ |
| C2 | 拡張型のDomain型統合 | `journal_extensions.ts`分離 | `JournalEntry`本体に統合 → `journal_extensions.ts`削除 |

---

## D. ESLint・ビルド

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| D1 | `unsafe/` import制限の物理ルール | 未設定 | `unsafe/`→`data/` `components/`へのimport→error |
| D2 | `unsafe/`以外の`any`→error | 現状warn | error化 |
| D3 | `as any`→error | 現状warn | error化 |
| D4 | flat config (`eslint.config.js`) 移行 | 旧形式 | Phase B以降で移行 |

---

## F. 文書整備

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| F1 | ルール文書にPhase B移行チェックリスト追加 | 移行条件は§1に記載あるが詳細なし | 本一覧をルール文書に組み込み |
| F2 | `non-null assertion`禁止ルール明文化 | 暗黙の許容 | 「新規`!`追加禁止」をルール§4に追加 |

---

## G. UI追加機能

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| G1 | 列表示ON/OFF | 未実装 | ユーザーが列を非表示にする機能 |
| G2 | カラムグループ化 | 未実装 | 借方/貸方のグループヘッダー（**必須**） |

---

## H. Hono RPC型・APIパイプライン整合（2026-03-14追記）

| # | タスク | 現状 | 発見経緯 | 対応 |
|---|--------|------|----------|------|
| H1 | Hono RPC `$post` 型がUI用フィールドを要求 | `useAccountingSystem.ts` L1218: `client.api.clients.$post()` の型定義が `driveLinks`, `fiscalMonthLabel`, `softwareLabel` 等のUI用フィールド12個を要求。`as unknown as ClientApi` で回避中 | モック12件にclientId/報酬フィールド追加時に発見 | Hono API側の型定義を`ClientApi`と一致させる。UI用フィールドをAPI型から分離 |
| H2 | `createClient`/`updateClient` がZodパイプライン未通過 | `createClient`はRPC直接呼び出し後`fetchClients()`→API 500→catch空処理で終了。clients.valueに反映されない | fetchClients内部フロー追跡で発見 | `processClientPipeline`経由でclients.value反映、またはローカルState更新ロジック追加 |
| H3 | `mockClientsPreload`のダブルキャスト | L1144: `c as unknown as ClientApi` — `mockClientsPreload`は既に`ClientApi[]`型なのに二重キャスト。型安全性が損なわれる | モック12件修正時に発見 | `ClientApi[]`型が正しければキャスト不要。型エラーが出る場合はモックデータかスキーマ側を修正 |
| H4 | `fetchClients`内モック注入ロジック | L1270-1283: API応答にモックデータを強制注入（`Force Inject/Overwrite Mocks`）。本番移行時に削除必要 | fetchClientsフロー追跡で発見 | Phase C（RC-8 モック差し替え）と同時に削除。削除忘れ防止のため`// TODO: Remove in Phase C`コメント追加推奨 |
| H5 | `zod_schema.ts` JobSchemaの日本語プロパティ名 | L393: `未処理: z.string().optional()`, L406: `表示件数: z.string().optional()` — スキーマに日本語プロパティが混在 | スキーマ調査時に発見。`⚠️`コメント付きだが未修正 | `unprocessed`/`displayCount`等の英語名にリネーム。参照箇所の更新が必要 |
| H6 | `zod_schema.ts` JobSchemaの`z.any()`使用 | L251: `apiResponse: z.any()`, L273: `debits: z.array(z.any())`, L274: `credits: z.array(z.any())` — 型安全ルール§①⑤違反 | スキーマ調査時に発見。ファイル先頭に「⛔ z.any()禁止」ルールがあるが違反状態 | `apiResponse`は`z.unknown()`、`debits`/`credits`は専用のLineSchema配列に置換 |
| H7 | JobSchema肥大化（470+フィールド） | L220-481: Phase 4-1〜4-4で大量のoptionalフィールドが一括追加された。「optional地獄」の原因 | clientId調査でスキーマ全体を確認した際に再認識 | PostgreSQL移行設計（KI:「PostgreSQL移行設計」）でoptional 242個→20個に削減予定。Phase Cで解消 |

> [!NOTE]
> H1はAPI型定義の再設計（Phase C: RC-5 Supabase Mapper導入）と同時に解消すべき。
> H2はAPI未接続のため現時点では実害なし（モック初期化のみで動作）。
> H3はモックデータがClientApi型と完全一致すれば自動解消。
> H4はRC-8（モック差し替え）と同時に解消。
> H5-H6は型安全性ルール違反。ファイル先頭に禁止ルールが明記されており優先度高。
> H7はPostgreSQL移行設計で既に計画済み。

---

## I. composable統合（2026-03-15追記）

> N2保存キー統一（2026-03-15）で税区分のcomposable⇔ページ連携は解決済み。
> **2026-03-16: useAccountSettings実装完了**。I1-I3全件解決。以下は残存負債。

| # | タスク | 現状 | 対応 |
|---|--------|------|------|
| ~~I1~~ | ~~`useAccountSettings`新規作成~~ | ✅完了（2026-03-16） | `src/features/account-settings/composables/useAccountSettings.ts`作成済み。全6ページリファクタリング完了 |
| ~~I2~~ | ~~勘定科目マスタの`rows`キーと`overrides`キー二重管理~~ | ✅完了（2026-03-16） | `saveAccounts()`内で統一保存。ただし`_accountMasterOverrides`公開によるカプセル化破壊が残存（I5参照） |
| ~~I3~~ | ~~仕訳一覧の`selectAccount`がACCOUNT_MASTER直接参照~~ | ✅完了（2026-03-16） | `useAccountSettings('master').accounts`経由に変更済み |
| I4 | `useAccountSettings.ts` L6-7: ACCOUNT_MASTER/TAX_CATEGORY_MASTER直接import | 未解決 | composable内部4箇所で使用（defaultOrder/defaultIds/saveAccounts/saveTaxCategories）。本番API移行時にuseAccountMaster/useTaxMasterから取得する方式に変更が必要。**Phase C RC-5と同時に解消** |
| I5 | `useAccountSettings.ts` L343-344: `_accountMasterOverrides`/`_taxMasterOverrides`公開 | 未解決 | 内部composableのoverridesを外部に漏洩。MockMasterAccountsPage L199が直接参照。専用メソッド追加で代替すべき |
| I6 | `ScreenS_AccountSettings.vue`: ルーター未登録の死んだコンポーネント | 未解決 | ACCOUNT_MASTER/TAX_CATEGORY_MASTERを直接importしたまま。router/index.tsに参照ゼロ。削除またはリファクタリングが必要 |

---

## チェックリスト

- [ ] A1: getValue() any排除
- [ ] A2: non-null assertion解消 (12箇所)
- [ ] A3: Domain型強制
- [ ] A4: Factory必須化
- [ ] A5-A7: tsconfig厳格化3オプション
- [ ] A8: any 160件 warn→error
- [ ] A9: unused-vars 69件削除
- [ ] B1: CellComponent分離
- [ ] B2: getCellComponent方式導入
- [ ] B3: モーダル分離
- [ ] B4②④⑤: staff_notes構造改善
- [ ] C1: Fixture凍結
- [ ] C2: journal_extensions.ts統合・削除
- [ ] D1-D4: ESLint設定強化4件
- [ ] F1: ルール文書にチェックリスト追加
- [ ] F2: non-null assertion禁止明文化
- [ ] G1: 列表示ON/OFF
- [ ] G2: カラムグループ化（必須）
- [ ] H1: Hono RPC $post型のUI用フィールド要求を解消
- [ ] H2: createClient/updateClientのローカルState反映
- [ ] H3: mockClientsPreloadのダブルキャスト解消
- [ ] H4: fetchClients内モック注入ロジックにTODOコメント追加
- [ ] H5: JobSchema日本語プロパティ名リネーム
- [ ] H6: JobSchema z.any()をz.unknown()/専用型に置換
- [ ] H7: JobSchema肥大化解消（PostgreSQL移行設計と連動）
- [x] I1: useAccountSettings新規作成（✅ 2026-03-16完了）
- [x] I2: 勘定科目マスタのrows/overridesキー二重管理解消（✅ 2026-03-16完了。ただしI5残存）
- [x] I3: 仕訳一覧selectAccountのACCOUNT_MASTER直接参照を解消（✅ 2026-03-16完了）
- [ ] I4: useAccountSettings.tsのACCOUNT_MASTER/TAX_CATEGORY_MASTER直接import解消（Phase C RC-5と同時）
- [ ] I5: _overrides公開によるカプセル化破壊解消
- [ ] I6: ScreenS_AccountSettings.vue死んだコンポーネントの削除/リファクタリング

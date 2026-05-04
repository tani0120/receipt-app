# セキュリティ強化・技術的負債解消・移行方針策定（2026-05-04）

> 作成: 2026-05-04

## 概要

Supabase移行前の最終クリーンアップとして、以下を実施した：
1. コードベースからのレガシーデータ・型定義の完全除去
2. セキュリティ調査・秘密情報の集約状況確認
3. Supabase移行ロードマップの拡充（棚卸しタスク・API化方針の明文化）

---

## 1. 実施内容

### 1-1. SEED_DATA完全削除

| ファイル | 削除行数 | 変更内容 |
|---|---|---|
| `src/api/services/clientStore.ts` | 131行 | SEED_DATA定数（10件のダミー顧問先）を削除。JSONなし時のフォールバックをSEED_DATAコピー→空配列に変更 |
| `src/api/services/staffStore.ts` | 11行 | SEED_DATA定数（5件のダミースタッフ）を削除。同上 |

**理由:** `data/clients.json`, `data/staff.json` が既に存在するため、ハードコードのシードは完全に不要。

### 1-2. ClientApi型の完全削除

| ファイル | 変更内容 |
|---|---|
| `src/types/zod_schema.ts` L516 | `export type ClientApi` → 廃止コメントに置換 |
| `src/composables/ClientMapper.ts` | `mapClientApiToUi` → `mapClientToUi` にリネーム |
| `src/composables/ClientDetailMapper.ts` | `mapClientDetailApiToUi` → `mapClientDetailToUi` にリネーム + import更新 |
| `src/__tests__/ClientMapper.test.ts` | 全8箇所のリネーム追随 |

**理由:** ClientApi型はZod rollback後に不要。関数名に「Api」が残ると型が存在すると勘違いする原因になるため、リネームで完全排除した。

### 1-3. staffStore.ts 型エラー修正（2件）

| 行 | 問題 | 修正 |
|---|---|---|
| L64 | `match[1]`のundefined可能性 | `match && match[1]` でガード追加 |
| L98 | `staffList[idx]`のundefined可能性 | 変数分離 + nullチェック + `as Staff` キャスト |

### 1-4. セキュリティ調査（前セッションからの継続）

| 調査項目 | 結果 |
|---|---|
| `.env.local` 秘密情報集約 | ✅ 全ての秘密情報が.env.localに集約済み |
| `src/`内のハードコード秘密 | ✅ ゼロ（`useAdminDashboard.ts`のフォルダIDは前セッションでダミー化済み） |
| マスキングスクリプト | ❌ 不要と判断（Supabase移行まで実データは保存しない方針） |
| pre-commitフック | ❌ 不要と判断（現行`commit.md`セキュリティチェックで代替中） |

### 1-5. モックデータファイル削除確認

| ファイル | 状態 |
|---|---|
| `src/mocks/data/accountingMockClients.ts` | ✅ 前セッションで削除済み |
| `src/mocks/data/accountingMockData.ts` | ✅ 前セッションで削除済み |

---

## 2. migration_tasks.md への追記

以下のセクションを追記した：

| セクション | 内容 |
|---|---|
| **11. 移行前の棚卸しタスク** | localStorage依存16ファイル、TODO残存20件、ダブルキャスト29件、旧Screen系6ファイル、useAccountingSystem.tsの仕分け |
| **12. フロントロジックAPI化の方針** | Phase 3-4はSupabase移行前に実施しない方針を明文化。実行順序（①棚卸し→②移行本体→③同時実施）と判定基準を記載 |

---

## 3. implementation_plan_merged.md の評価結果

### 確定方針

`implementation_plan_merged.md` のPhase 3-4は**Supabase移行前に実施しない**。

**理由:** JSONストアの上にfetchラッパーAPIを作っても、移行時にPostgreSQLクエリで作り直す二度手間になる。

### 計画書の状態

| セクション | 状態 |
|---|---|
| Phase 1（仕訳一覧API） | ✅ 全完了 |
| Phase 2（マスタCRUD群） | ✅ 全完了 |
| 即時修正1-3 | ✅ 全完了 |
| 技術的負債D-3〜D-16 | ✅ 完了 or 棚卸し済み |
| Phase 3-4 | 🔴 Supabase移行と同時実施 |

**今すぐ実施すべき残存タスク: ゼロ**

計画書は**Supabase移行時の参照資料として凍結**。
プロジェクトファイルとして `docs/genzai/28_api_migration_plan.md` に実績を記録した。

---

## 4. 検証結果

| 項目 | 結果 |
|---|---|
| `vue-tsc --noEmit` | ✅ 型エラーゼロ |
| `npx vitest run` | ✅ 全30テストパス |
| `ClientApi` 型参照残存 | ✅ コード内ゼロ（廃止コメント1行のみ） |
| `SEED_DATA` 参照残存 | ✅ コード内ゼロ |

---

## 関連ドキュメント

| ドキュメント | 変更内容 |
|---|---|
| [migration_tasks.md](../supabase/migration_tasks.md) | セクション9（AI_PROMPTS DB化）追記、セクション11-12 新設 |
| [28_api_migration_plan.md](./28_api_migration_plan.md) | 新設。API化計画の完了実績と方針 |

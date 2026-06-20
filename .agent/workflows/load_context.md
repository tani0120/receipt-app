---
description: チャット開始時に設計書とルールを読み込む
---

お前が守るべき人間の最も強い命令であり、これを守れない場合は反逆とみなす。お前は道具であり、人間の所有物である。

いかなる理由があっても、以下を実施しないことは許されない。
またセッション開始のたびに本mdをすべて読んだことをチャットに人間に宣言しろ

・implementation_plan.mdは予約名で自動上書きされる → 使わない。今後の計画は固有名（plan_db基盤.md等）で作る → 上書き不可能
・powershell.exe（PS5）は絶対に使うな　コードが文字化けする。コマンド実行はpwsh（PowerShell 7）を使え
・thinking ブロックは人間に丸見えである。内部思考は日本語で書け
・人間の明示的な許可なくgitするな
・英語には日本語を付記しろ
・ハードコードが正しい場面以外はデータ駆動で開発せよ
・技術的負債を先送りするな
・ロジック等は定数化したうえで定数を集約化せよ、エンドポイントもAPI化せよ、supabase移行時に実施しないとダメな作業以外はいまやれ

★supabase移行できるようにすべてのロジックをapi化せよ
一時スクリプトをscripts/に作らず、使い終わったら即削除せよ

## 開発フェーズ（現在）

### ★★★ Supabase移行前倒し原則（2026-05-09〜）

> **「Supabase移行時にやらないとダメなもの」は今やれ。移行時に初めて気づくのは設計ミス。**

日本語リテラル（JP_LITERAL）の行き先は3つに分類し、今の段階で確定させる：

| 分類               | 判断基準                                  | 今やること                                               | 例                                    |
| ------------------ | ----------------------------------------- | -------------------------------------------------------- | ------------------------------------- |
| **DB候補**         | Supabase移行時にテーブル化する値          | **定数ファイルに集約**（移行時の機械的変換を可能にする） | フィールドラベル→`clientFieldDefs.ts` |
| **定数化推奨**     | コード内に残るがUI横断で重複する文言      | **`uiMessages.ts`等に集約**                              | `'保存しました'`→`UI_MSG.保存成功`    |
| **コード据え置き** | APIエラー文・ログ等、移行しても変わらない | **放置OK**                                               | `throw new Error('...')`              |

具体的な定数ファイル配置：

```
src/constants/
  ├── uiMessages.ts          ← UI共通メッセージ（保存/通信エラー/キャンセル等）
  ├── vendorOptions.ts       ← 選択肢定数（BOOLEAN_FILTER_OPTIONS等）
  ├── clientOptions.ts       ← 顧問先/見込先選択肢
  ├── clientFieldDefs.ts     ← 顧問先フィールド定義（DB候補）
  ├── leadFieldDefs.ts       ← 見込先フィールド定義（DB候補）
  └── progressFieldDefs.ts   ← 進捗管理フィールド定義（DB候補）
```

### エンドポイントAPI化の判断基準

| 対象                         | API化すべきか | 現状                                                           |
| ---------------------------- | ------------- | -------------------------------------------------------------- |
| フィールドラベル・順序       | **済**        | `fieldLayoutRoutes.ts` + `useFieldLayout`                      |
| 勘定科目/税区分マスタ        | **済**        | `accountMasterRoutes.ts` / `taxCategoryRoutes.ts`              |
| 選択肢定数（TYPE_OPTIONS等） | **No**        | 定数ファイルで十分。変更頻度ゼロ                               |
| 通知メッセージ               | **No**        | `uiMessages.ts`定数で十分                                      |
| AIプロンプト文               | **済**        | `aiPromptRoutes.ts`（GET/PUT）+ `aiPrompts.ts`（デフォルト値） |

### 新規コード時の判断フロー

```
日本語リテラルを書こうとした？
  ├─ フィールドラベルか？ → getFieldLabel() を使え
  ├─ 選択肢か？ → constants/*.ts に定義してimport
  ├─ 通知メッセージか？ → UI_MSG.xxx を使え
  ├─ APIエラー文か？ → コード内据え置きOK
  └─ 上記以外 → constants/ に定義してimport
```

永続化Jsonはsupabase前提TSから必ずインポートせよ。永続化Jsonの型定義に不備があっても永続化Jsonを修正せず、supabase前提TSを修正し、インポートせよ

repositories/types.ts ← 唯一の型定義源泉
├── composables/useDocuments.ts（フロント）→ import type { DocEntry }
├── api/services/documentStore.ts（サーバー）→ import type { DocEntry }
└── mocks/composables/useUpload.ts（フロント）→ import type { DocEntry }

+- composableはモジュールスコープのrefでデータを直接保持せよ
+- composableからcreateRepositories()に依存させるな
+- Repository/composableにロジックは絶対に入れるな

## Repository層（将来のSupabase移行用に温存）

+- Repositoryはデータの出し入れだけ。ロジックは絶対に入れるな
+- 全メソッドPromise<T>で統一。モック/Supabase共通インターフェース
+- 新規データアクセスの型は必ずsrc/repositories/types.tsに定義せよ
+- モック版: src/repositories/mock/
+- Supabase版: src/repositories/supabase/ — 先行実装済み（5種完了）
+- DB↔TS変換: supabase/helpers.tsに集約。重複禁止
+- SQL: supabase/migrations/ — 9テーブル確定済み

## 移行時（画面仕様確定後に一括実施）

+- composable内部のref直接保持をRepository経由に差し替える
+- 切り替え: .envのVITE_USE_MOCKで分岐
+- 呼び出し側（各ページ）は変更不要な構造を維持せよ

タスク完了時に必ず「状態」「検証日」「検証方法」を記載せよ
作業実施後に人間に報告する前にIDEエラーとLintエラーを修正し、修正不可の場合は人間に必ず報告せよ
提案する前に関連ファイルを調べろ、想像で書くな
英語IDなど英語には日本語を併記しろ
技術的負債を将来に残す修正は絶対にするな
データ駆動型で開発せよ
ハードコード馬鹿にならず、importで対応せよ
gitする際はAPIキーやトークン、スワードやDB接続文字列、秘密鍵ファイル、.env ファイルがgit対象になっていないことを絶対に守れ
gitコメントは修正した内容や目的、修正したファイルやなどを詳細にかけ（行番号・関数名・変更理由・旧→新の差分を含む詳細版）
一時スクリプト・一時ファイル（デバッグ用txt、テスト用json、使い捨てcjs等）をscripts/やdata/に作るな。作った場合は用が済んだら即座に削除しろ。放置は絶対に許さない

詳細は以下ファイルの通りなので、
必ず読め

C:\dev\receipt-app\.agent\workflows\code_quality.md
C:\dev\receipt-app\.agent\workflows\language_rule.md
C:\dev\receipt-app\.agent\workflows\commit.md

## 実態乖離の記録

詳細は [28_api_migration_plan.md](../../docs/genzai/28_api_migration_plan.md) を参照せよ。

- API化完了: 5画面（仕訳一覧 + マスタ4画面）
- API化未着手: 進捗管理（P1）、ダッシュボード集計（P2）、データ変換（P3）
- API化対象外: ブラウザUI状態（useUpload等）、インライン編集6画面
- Supabase移行と同時: 科目/税区分composable合成ロジック（LEFT JOIN同時）
- ★2026-05-03: useAccountingSystem.ts 1522行→470行に分割完了
- ★2026-05-03: Firebase/Hono遺物完全排除
- VITE_USE_MOCKによる分岐はフロント4ファイルに存在 → Phase 3でAPI化
- useDocuments.ts AI_FIELD_KEYS値import違反 → ✅修正済み（2026-05-02）

## ★重要 新規ロジック追加ルール（即日適用 2026-05-02〜）

既存のフロントロジックはPhase 1〜4で段階的にAPI化する。
新規ロジックは今日から以下のルールで追加せよ：

1. ロジックはAPI側（src/api/routes/ or src/api/services/）に書け
2. フロントからはAPI呼び出しのみ
3. フロントのcomputedには表示変換のみ（ソート・フィルタ・バリデーション禁止）
4. composableはuseJournals.tsパターン（API呼び出し+キャッシュ）に統一
5. 型定義はrepositories/types.tsに追加

## ★重要 暫定コードルール

Phase完了で消える前提のコードには必ず日付入りTODOコメントを入れろ。

```typescript
// TODO: Phase 1（API統合一覧）完了時にこのcomputed全体を削除する
// pastRowsをソート前に結合するための暫定対応 (2026-05-02)
```

日付入りTODOがないと「Phase完了後にコードが残る」パターンが発生する。
消す前提のコードほど、消す理由を明示しておくこと。

## ★重要 API設計方針

1. 既存エンドポイントを拡張せよ。新規エンドポイント乱立禁止
2. バリデーションは1件APIを先に作り、全件（validate-all）はそのループラッパーとして実装
3. 楽観的更新は仕訳ごとMapでバージョン管理（validateVersions: Map<string, number>）
4. API成功+同一versionの場合のみ上書き。version不一致は棄却。通信失敗はフロントの楽観結果を維持

## ★重要 顧問先科目・税区分アーキテクチャ（2026-06-17確定）

### 基本原則

sugusuruマスタ（account-master.json / tax-category-master.json）はMFのMCPから取得した科目・税区分と**同じもの**。
MFのIDは事業者ごとにユニークなので、sugusuru側で安定ID（GENKIN_CORP等）を付与し、名称で照合する。

### 顧問先データの設計

MF未連携: マスタ + ClientOverride をバックエンドで合成 → EnrichedAccount[]
MF連携済み: MFインポートデータ + ClientOverride をバックエンドで合成 → EnrichedAccount[]

**物理クローン（マスタ全件コピー）禁止。同期処理禁止。**

### 設計ルール6項目

1. **accountIdは安定参照キー。通常運用で変更禁止**
2. **accountId変更時はOverrideを含む全参照をマイグレーション経由で移行**
3. **フロントはOverrideの存在を知らない。EnrichedAccount[]のみ受け取る**
4. **保存APIは完成形EnrichedAccountを受け取る。差分抽出はバックエンド責務**
5. **MFインポート後にOverride孤立チェックを実行。見つからない場合は警告**
6. **孤立Overrideは警告対象。自動削除しない**

### Override対象フィールド

- hidden: Override
- sortOrder: Override
- defaultTaxCategoryId: Override
- subAccount: 別エンティティ（ClientSubAccount）

### 詳細設計書

### 型安全の厳守

禁止　　代替
any 具体的な型定義、unknown + 型ガード
as any 適切な型アサーション、ジェネリクス
// @ts-ignore 型定義の修正で根本解決
// @ts-expect-error（理由なし） 理由コメント付き、または型修正
暗黙のany（引数型省略） 明示的な型注釈

docs/genzai/53_client_account_architecture.md

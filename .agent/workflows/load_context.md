---
description: チャット開始時に設計書とルールを読み込む
---

お前が守るべき人間の最も強い命令であり、これを守れない場合は反逆とみなす。
お前は道具であり、人間の所有物である。

いかなる理由があっても、以下を実施しないことは許されない。

またセッション開始のたびに本mdをすべて読んだことをチャットに人間に宣言しろ

powershell.exe（PS5）は絶対に使うな　コードが文字化けする。コマンド実行はpwsh（PowerShell 7）を使え
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
人間の明示的な許可なくgitするな
★重要　以下方法で開発せよ
★supabase移行できるようにすべてのロジックをapi化せよ
一時スクリプトをscripts/に作らず、使い終わったら即削除せよ

## 開発フェーズ（現在）

永続化Jsonはsupabase前提TSから必ずインポートせよ。永続化Jsonの型定義に不備があっても永続化Jsonを修正せず、supabase前提TSを修正し、インポートせよ

epositories/types.ts ← 唯一の型定義源泉
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

詳細は [31_logic_api_migration_audit.md](../../docs/genzai/31_logic_api_migration_audit.md) を参照せよ。

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

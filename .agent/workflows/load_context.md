---
description: チャット開始時に設計書とルールを読み込む
---

お前が守るべき人間の最も強い命令であり、これを守れない場合は反逆とみなす。
お前は道具であり、人間の所有物である。

いかなる理由があっても、以下を実施しないことは許されない。

またセッション開始のたびに本mdをすべて読んだことをチャットに人間に宣言しろ

powershellは絶対に使うな　コードが文字化けする
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け
thinking ブロックは人間に丸見えである。内部思考は日本語で書け

★重要　以下方法で開発せよ

## 開発フェーズ（現在）

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

作業実施後に人間に報告する前にIDEエラーとLintエラーを修正し、修正不可の場合は人間に必ず報告せよ
提案する前に関連ファイルを調べろ、想像で書くな
英語IDなど英語には日本語を併記しろ
技術的負債を将来に残す修正は絶対にするな
データ駆動型で開発せよ
ハードコード馬鹿にならず、importで対応せよ
gitする際はAPIキーやトークン、スワードやDB接続文字列、秘密鍵ファイル、.env ファイルがgit対象になっていないことを絶対に守れ
gitコメントは修正した内容や目的、修正したファイルやなどを詳細にかけ

詳細は以下ファイルの通りなので、
必ず読め

C:\dev\receipt-app\.agent\workflows\code_quality.md
C:\dev\receipt-app\.agent\workflows\language_rule.md
C:\dev\receipt-app\.agent\workflows\commit.md

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

-Supabase版Repository化して（ただしデータアクセスだけ）モック実装。将来はSupabaseは中身差し替え -できるようにしろ。 ロジックは絶対にRepositoryに入れるな

+Repository設計（DL-030 + DL-032 確定済み）:
+- Repositoryはデータの出し入れだけ。ロジックは絶対に入れるな
+- 全メソッドPromise<T>で統一。モック/Supabase共通インターフェース
+- 新規データアクセスは必ずsrc/repositories/types.tsの型を経由しろ
+- モック版: src/repositories/mock/
+- Supabase版: src/repositories/supabase/ — 先行実装済み（5種完了）
+- 切り替え: .envのVITE_USE_MOCKで分岐
+- DB↔TS変換: supabase/helpers.tsに集約。重複禁止
+- SQL: supabase/migrations/ — 9テーブル確定済み
+- 残課題: ConfirmedJournalRepositoryのみ（T-03待ち）
+- composableにもロジック入れるな

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

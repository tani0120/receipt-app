# 再起動後コンテキスト（2026-05-22）

## まず読め

@load_context を実行しろ。以下のファイルを全部読め：
- C:\dev\receipt-app\.agent\workflows\load_context.md
- C:\dev\receipt-app\.agent\workflows\code_quality.md
- C:\dev\receipt-app\.agent\workflows\language_rule.md
- C:\dev\receipt-app\.agent\workflows\commit.md

## 直前の状況

### Antigravity 2.0 強制アップデート問題
- 2026-05-19〜20にGoogleがAntigravity IDEの自動更新でAntigravity 2.0（Agent Manager）を強制配信
- IDE版が2.0に上書きされ、設定・拡張機能・チャット履歴が消失する問題が多発
- IDE再起動で2.0に切り替わる可能性が高かった

### 実施済みの対策
1. **自動更新を無効化済み** — `update.mode: "manual"`, `extensions.autoUpdate: false`
   - 設定ファイル: `C:\Users\kazen\AppData\Roaming\Antigravity\User\settings.json`
2. **バックアップ取得済み** — `C:\Users\kazen\Desktop\antigravity_backup_20260522\`
   - User/（settings.json, globalStorage, workspaceStorage, History）
   - extensions/（全拡張機能の実体）
   - app_storage.json, languagepacks.json
3. **復元手順書を作成済み** — `.agent/workflows/restore_antigravity_ide.md`
   - IDE版の再ダウンロード手順
   - settings.jsonの完全内容
   - 拡張機能38件の一括インストールコマンド
   - 動作確認チェックリスト
4. **git push済み** — コミットID: `e33a13c`

### もし2.0になってしまっていたら
復元手順に従え：
1. Antigravity関連を全てアンインストール
2. https://antigravity.google からIDE版のみクリーンインストール（黒格子アイコン）
3. デスクトップのバックアップから設定・拡張機能を復元
4. `update.mode: "manual"` を即設定

詳細: C:\dev\receipt-app\.agent\workflows\restore_antigravity_ide.md

## 開発中の作業

### MFクラウド会計 MCP連携（34_mf_mcp_integration.md）
- 設計書: `docs/genzai/34_mf_mcp_integration.md`
- テストスクリプト6件を `src/scripts/` に作成済み
  - test_ai_journal.ts — AI丸投げ仕訳推定
  - test_auto_journal.ts — 自動仕訳（パターン分析+投稿）
  - test_connected.ts — MCP接続確認
  - test_improved_candidate.ts — 改良版仕訳候補
  - test_nayose_candidate.ts — 名寄せ候補
  - test_post_journal.ts — 仕訳投稿

## 既知の問題
- `src/scripts/test_ai_journal.ts` に `any` 型が4箇所（L18, L20, L21, L28）— 既存、未修正

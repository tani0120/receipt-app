---
description: Antigravity IDE 復元手順（2.0強制アップデート対策）
---

# Antigravity IDE 復元手順

> 作成: 2026-05-22
> 目的: Antigravity 2.0（Agent Manager）への強制アップデート後にIDE版を復旧するための手順書

## 背景: 何が起きたか

2026年5月19〜20日、GoogleはAntigravity IDEの自動更新で**Antigravity 2.0（Agent Manager）**を強制配信した。

| 項目 | Antigravity IDE（旧） | Antigravity 2.0（新） |
|---|---|---|
| 種別 | VS Code系エディタ | エージェント管理ツール（ADE） |
| UI | ファイルツリー＋エディタ＋ターミナル | チャット中心 |
| アイコン背景 | **黒格子** | **白背景** |
| 用途 | 手動コーディング | 自律エージェント操作 |

**問題**: 自動更新によりIDE版が2.0に上書きされ、ワークスペース・チャット履歴・設定・拡張機能が消失するケースが多発。

---

## Step 0: バックアップ対象（アップデート前に退避）

以下のディレクトリ・ファイルを **別の場所にコピーしておく**。

```
■ 設定ファイル
C:\Users\kazen\AppData\Roaming\Antigravity\User\settings.json

■ 拡張機能（実体）
C:\Users\kazen\.vscode\extensions\

■ ワークスペース状態
C:\Users\kazen\AppData\Roaming\Antigravity\User\workspaceStorage\

■ グローバルストレージ
C:\Users\kazen\AppData\Roaming\Antigravity\User\globalStorage\

■ 操作履歴
C:\Users\kazen\AppData\Roaming\Antigravity\User\History\

■ Geminiエージェントデータ
C:\Users\kazen\.gemini\
```

### バックアップコマンド（一括）

```powershell
# pwsh（PowerShell 7）で実行
$backup = "C:\Users\kazen\Desktop\antigravity_backup_$(Get-Date -Format 'yyyyMMdd')"
New-Item $backup -ItemType Directory -Force

Copy-Item "C:\Users\kazen\AppData\Roaming\Antigravity\User" "$backup\User" -Recurse
Copy-Item "C:\Users\kazen\.vscode\extensions" "$backup\extensions" -Recurse
```

---

## Step 1: Antigravity IDE版のダウンロード

1. https://antigravity.google にアクセス
2. **「Antigravity IDE」** のダウンロードリンクを探す（Agent Managerではない方）
3. アイコンが **黒格子背景** であることを確認
4. Windows (x64) User版をダウンロード・インストール

> ⚠️ 注意: 「Antigravity 2.0」（白背景アイコン）はAgent Managerであり、IDE版ではない

---

## Step 2: 自動更新を即座に無効化

インストール直後、**最初に設定を開いて自動更新を止める**。

### 方法A: GUI
1. `Ctrl + ,` で設定を開く
2. `update.mode` → **manual** に変更
3. `extensions.autoUpdate` → **チェックを外す**

### 方法B: settings.json直接編集

ファイルパス: `C:\Users\kazen\AppData\Roaming\Antigravity\User\settings.json`

```json
{
  "update.mode": "manual",
  "extensions.autoUpdate": false
}
```

---

## Step 3: settings.json の復元

以下の内容を `settings.json` に書き込む（2026-05-22時点の設定）:

```json
{
  "update.mode": "manual",
  "extensions.autoUpdate": false,
  "editor.fontSize": 16,
  "editor.renderWhitespace": "all",
  "editor.wordWrap": "on",
  "emmet.triggerExpansionOnTab": true,
  "editor.minimap.showSlider": "always"
}
```

---

## Step 4: 拡張機能の再インストール

### 必須拡張機能（このプロジェクトで使用中）

以下のコマンドで一括インストール。CLIパスは環境に合わせて修正すること。

```powershell
# pwsh（PowerShell 7）で実行
# CLIパスを確認: antigravity-ide コマンドが使えない場合はフルパスで指定
$cli = "antigravity-ide"

# ===== 必須（プロジェクト開発用） =====
& $cli --install-extension vue.volar                              # Vue / Volar（Vue 3公式）
& $cli --install-extension dbaeumer.vscode-eslint                 # ESLint
& $cli --install-extension esbenp.prettier-vscode                 # Prettier（コードフォーマッタ）
& $cli --install-extension usernamehw.errorlens                   # Error Lens（エラー行内表示）
& $cli --install-extension gruntfuggly.todo-tree                  # TODO Tree（TODO/HACK検索）
& $cli --install-extension eamodio.gitlens                        # GitLens（Git履歴）
# google.geminicodeassist は2026-06-18にサービス終了のため削除
& $cli --install-extension ms-ceintl.vscode-language-pack-ja      # 日本語パック

# ===== 推奨（効率化） =====
& $cli --install-extension christian-kohler.path-intellisense     # パス補完
& $cli --install-extension formulahendry.auto-close-tag           # HTMLタグ自動閉じ
& $cli --install-extension formulahendry.auto-rename-tag          # HTMLタグ自動リネーム
& $cli --install-extension mosapride.zenkaku                      # 全角スペース可視化
& $cli --install-extension mechatroner.rainbow-csv                # CSVカラー表示
& $cli --install-extension streetsidesoftware.code-spell-checker   # スペルチェッカー
& $cli --install-extension xyz.local-history                       # ローカル履歴
& $cli --install-extension asuka.insertnumbers                     # 連番挿入
& $cli --install-extension yzhang.markdown-all-in-one             # Markdown支援
& $cli --install-extension vscode-icons-team.vscode-icons          # ファイルアイコン
& $cli --install-extension ritwickdey.liveserver                   # Live Server
& $cli --install-extension rangav.vscode-thunder-client            # Thunder Client（APIテスト）
& $cli --install-extension htmlhint.vscode-htmlhint               # HTMLHint
& $cli --install-extension smelukov.vscode-csstree                # CSS Tree
& $cli --install-extension editorconfig.editorconfig               # EditorConfig
& $cli --install-extension tomoki1207.pdf                          # PDF表示

# ===== その他（入れておく） =====
& $cli --install-extension figma.figma-vscode-extension            # Figma連携
& $cli --install-extension ms-python.python                        # Python
& $cli --install-extension ms-python.debugpy                       # Pythonデバッガ
& $cli --install-extension ms-python.vscode-python-envs            # Python環境管理
& $cli --install-extension golang.go                               # Go言語
& $cli --install-extension vscjava.vscode-java-debug               # Java デバッグ
& $cli --install-extension vscjava.vscode-java-dependency          # Java 依存関係
& $cli --install-extension vscjava.vscode-maven                    # Maven
& $cli --install-extension vscjava.vscode-gradle                   # Gradle
& $cli --install-extension meta.pyrefly                             # Pyrefly（型チェック）
& $cli --install-extension bradlc.vscode-tailwindcss                # Tailwind CSS
& $cli --install-extension llvm-vs-code-extensions.vscode-clangd    # C/C++ clangd
& $cli --install-extension ms-azuretools.vscode-docker              # Docker
& $cli --install-extension ms-azuretools.vscode-containers          # Containers
& $cli --install-extension mtxr.sqltools                            # SQL Tools
& $cli --install-extension github.vscode-github-actions             # GitHub Actions
& $cli --install-extension visualstudioexptteam.vscodeintellicode   # IntelliCode
& $cli --install-extension visualstudioexptteam.intellicode-api-usage-examples # IntelliCode API例
```

### 不要な拡張機能（インストールしなくてよい）

| 拡張機能 | 理由 |
|---|---|
| github.copilot-chat | Gemini使用のため不要 |
| shopify.ruby-lsp | Ruby不使用 |
| ms-vscode.powershell | pwsh標準で十分 |

---

## Step 5: ワークスペースの復元

1. `Ctrl + Shift + P` → 「フォルダーを開く」
2. `C:\dev\receipt-app` を選択
3. ターミナルで依存関係を確認:

```powershell
cd C:\dev\receipt-app
node -v    # v22系を確認
npm -v
npm ci     # node_modules再構築（必要な場合のみ）
```

---

## Step 6: Gemini Code Assist の再設定

1. `Ctrl + Shift + P` → 「Gemini: Sign In」
2. Googleアカウントでログイン
3. 設定でプロジェクトIDを確認（Gemini Code Assistは2026-06-18にサービス終了済み。不要。）

---

## Step 7: 動作確認チェックリスト

| # | 確認項目 | コマンド/操作 |
|---|---|---|
| 1 | IDE版であること（黒格子アイコン） | タスクバーのアイコンを目視 |
| 2 | 自動更新が無効 | 設定 → `update.mode` = `manual` |
| 3 | Vue/Volarが動作 | .vueファイルを開いて補完が出ること |
| 4 | ESLintが動作 | エラーのある.tsファイルで赤線が出ること |
| 5 | TypeScript型チェック | `npx vue-tsc --noEmit` がエラーなしで通ること |
| 6 | ビルド | `npx vite build` が成功すること |
| 7 | Gemini接続 | チャットでGeminiに質問して応答があること |
| 8 | 日本語表示 | メニューが日本語であること |

---

## 不要ファイルの削除（復旧完了後）

```powershell
# 旧アップデータの残骸を削除
Remove-Item "C:\Users\kazen\AppData\Local\antigravity-updater" -Recurse -Force
Remove-Item "C:\Users\kazen\AppData\Local\Temp\antigravity-stable-user-x64" -Recurse -Force
Remove-Item "C:\Users\kazen\AppData\Local\Temp\antigravity-ide-download.exe" -Force -ErrorAction SilentlyContinue
```

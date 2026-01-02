# UI Freeze Operational Bindings (PowerShell)

## 0. 基本原則
*   **フェーズ不可逆**: 前フェーズの証跡が `$FREEZE_DIR` に揃わない限り、次へ進むことを禁止する。
*   **証跡の絶対性**: ログファイル、スクリーンショット、YAML更新の3点が揃って初めて「完了」とみなす。
*   **環境固定**: 解像度は `1280x800` 固定、シェルは PowerShell を使用する。
*   **絶対パスの意識**: コマンド実行時は `$FREEZE_DIR` を基点とするか、絶対パスを意識すること。

## 1. 環境セットアップ (Initial Setup)

作業開始前に以下の変数定義とフォルダ構築を実行する。

```powershell
# 1. 変数定義（プロジェクトごとに書き換え）
$SCREEN_ID = "TargetScreenName" # 例: ScreenA
$TARGET_URL = "http://localhost:5173/#/aaa_clients"
$REFERENCE_IMG = "path/to/figma_exported_image.png" # Phase Aで使用
$FREEZE_DIR = "freeze/$SCREEN_ID"

# 2. 物理フォルダ作成
New-Item -ItemType Directory -Force -Path "$FREEZE_DIR/screenshots"
New-Item -ItemType Directory -Force -Path "$FREEZE_DIR/technical-proofs"

# 3. README.md の初期生成（ヒアドキュメントを使用）
# Git Hashの自動埋め込み
$README_CONTENT = @"
# UI Freeze Evidence: $SCREEN_ID
- Freeze Version: v1
- Captured At: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- Commit Hash: $(git rev-parse HEAD)
"@
$README_CONTENT | Out-File -FilePath "$FREEZE_DIR/README.md" -Encoding utf8

# 4. Checklist / Appendix-B のコピーと初期化
Copy-Item "ui-freeze-checklist.yaml" -Destination "$FREEZE_DIR/ui-freeze-checklist.yaml"
Copy-Item "ui-freeze-appendix-b.md" -Destination "$FREEZE_DIR/ui-freeze-appendix-b-signed.md"
```

## 2. Phase A：Visual Truth (見た目確定)
**【Gate 0 通過条件】Overlay Diff = 0px**

### Step A-1: 正解証跡の撮影
`browser_subagent` を以下の指示で実行し、画像を `$FREEZE_DIR/screenshots/golden_ui.png` に保存する。

> **Tool: browser_subagent Task:**
> 1. Navigate to `$TARGET_URL`
> 2. Set Viewport to `1280x800`.
> 3. Wait 3s (ensure fonts and icons are rendered).
> 4. Capture Screenshot as `golden_ui_raw.png`.
> 5. Compare `golden_ui_raw.png` with `$REFERENCE_IMG` (if available).
> 6. Generate `overlay_diff.png` showing pixel-level differences.
> 7. If any pixel differs, report "Visual Truth Failed" and stop.

### Step A-2: 判定
`overlay_diff.png` を目視（またはツール）で確認し、完全一致を確認したら `ui-freeze-checklist.yaml` の `phaseA.visual_truth` を `true` に更新する。

## 3. Phase B：Non-Destructive Refactor (構造整理)
**【Gate 1 通過条件】Before / After Overlay = 0px**

### Step B-1: Before 撮影（リファクタリング前）
リファクタリング着手直前に `browser_subagent` で `refactor_before.png` を撮影する。

### Step B-2: After 撮影（リファクタリング後）
リファクタリング完了後、以下の指示を実行。

> **Tool: browser_subagent Task:**
> 1. Capture Screenshot as `refactor_after.png` at `1280x800`.
> 2. Compare `refactor_before.png` and `refactor_after.png`.
> 3. If Diff > 0px, list the changed elements and report "Refactor Destructive".

## 4. Phase C：Ironclad Contract (契約確定)
**【Gate 2 通過条件】ビルド破壊証明 + 敵対的入力テスト合格**

### Step C-1: Mapper 破壊テスト (Vitest)
Appendix A の Lv4 ストレスレベルを網羅するテストを実行し、全件合格（Green）をログに残す。

```powershell
npx vitest run "src/**/$SCREEN_ID/mapper.test.ts" --reporter=verbose | Out-File -FilePath "$FREEZE_DIR/technical-proofs/mapper_test.log" -Encoding utf8
```

### Step C-2: Contract 破壊・ビルド停止証明 (Build Kill Test)
「型を破ればビルドが止まる」ことを物理的に証明する。

```powershell
# 1. Mapperの戻り値型を一時的に破壊（例: string -> number）
# (Note: Set proper path to contract file)
(Get-Content "src/path/to/contract.ts") -replace ': string', ': number' | Set-Content "src/path/to/contract.ts"

# 2. ビルド実行。エラーが出ることを期待。
try {
    npm run build-only 2> "$FREEZE_DIR/technical-proofs/build_fail.log"
    echo "ERROR: Build should have failed but succeeded."
} catch {
    echo "SUCCESS: Build failed as expected. Log saved."
}

# 3. 直ちにコードを復元
git checkout "src/path/to/contract.ts"
```

### Step C-3: UI 表示耐性テスト (CSS/Visual Kill)
極端な長文（10,000文字）を流し込んだ状態を撮影する。

> **Tool: browser_subagent Task:**
> 1. Inject a 10,000-character string (no spaces) into the primary text field.
> 2. Capture Screenshot as `stress_worst.png`.
> 3. Verify: No horizontal scroll, no layout collapse, no Console Errors.

## 5. Audit & Sign-off (最終監査)
すべての物理証跡が揃った後、禁止コードの有無を最終確認する。

```powershell
# 禁止コードの grep 監査
grep -r "as any" "src/path/to/ui" | Out-File "$FREEZE_DIR/technical-proofs/audit_any.log"
grep -r "throw" "src/path/to/ui" | Out-File "$FREEZE_DIR/technical-proofs/audit_throw.log"
```

### 最終成果物の確認リスト
- [ ] `$FREEZE_DIR/screenshots/golden_ui.png`
- [ ] `$FREEZE_DIR/screenshots/stress_worst.png`
- [ ] `$FREEZE_DIR/technical-proofs/build_fail.log`
- [ ] `$FREEZE_DIR/README.md` (Version, Hash, Date 記載済)
- [ ] `$FREEZE_DIR/ui-freeze-appendix-b-signed.md` (全項目 Yes ＋ 署名済)

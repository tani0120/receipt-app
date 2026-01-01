
# UI Freeze Binding Instructions

## 0. 基本原則
- **フェーズ不可逆**: 前フェーズの証跡が `$FREEZE_DIR` に揃わない限り、次へ進むことを禁止する。
- **証跡の絶対性**: ログファイル、スクリーンショット、YAML更新の3点が揃って初めて「完了」とみなす。
- **環境固定**: 解像度は 1280x800 固定、シェルは PowerShell を使用する。

## 1. 環境セットアップ (Initial Setup)
作業開始前に以下の変数定義とフォルダ構築を実行する。

```powershell
# 1. 変数定義（プロジェクトごとに書き換え）
$SCREEN_ID = "TargetScreenName" # 例: ScreenA
$TARGET_URL = "http://localhost:5173/#/path_to_ui"
$REFERENCE_IMG = "path/to/figma_exported_image.png"
$FREEZE_DIR = "freeze/$SCREEN_ID"

# 2. 物理フォルダ作成
New-Item -ItemType Directory -Force -Path "$FREEZE_DIR/screenshots"
New-Item -ItemType Directory -Force -Path "$FREEZE_DIR/technical-proofs"
```

## 2. Phase A：Visual Truth (見た目確定)
**【Gate 0 通過条件】Overlay Diff = 0px**

### Step A-1: 正解証跡の撮影
`browser_subagent` を以下の指示で実行し、画像を `$FREEZE_DIR/screenshots/golden_ui.png` に保存する。

**Tool: `browser_subagent` Task:**
```text
Navigate to $TARGET_URL
Set Viewport to 1280x800.
Wait 3s (ensure fonts and icons are rendered).
Capture Screenshot as "golden_ui_raw.png".
# (If Reference exists) Compare "golden_ui_raw.png" with "$REFERENCE_IMG".
# Generate "overlay_diff.png" showing pixel-level differences.
# If any pixel differs, report "Visual Truth Failed" and stop.
# (If No Reference) Save "golden_ui_raw.png" as "golden_ui.png". Create empty "overlay_diff.png" (black).
```

### Step A-2: 判定
`overlay_diff.png` を確認し、完全一致を確認したら `ui-freeze-checklist.yaml` の `phaseA.visual_truth` を `true` に更新する。

## 3. Phase B：Non-Destructive Refactor (構造整理)
**【Gate 1 通過条件】Before / After Overlay = 0px**

### Step B-1: Before 撮影
リファクタリング着手直前に `browser_subagent` で `refactor_before.png` を撮影する。

### Step B-2: After 撮影
リファクタリング完了後、以下の指示を実行。
```text
Capture Screenshot as "refactor_after.png" at 1280x800.
Compare "refactor_before.png" and "refactor_after.png".
If Diff > 0px, list the changed elements and report "Refactor Destructive".
```

## 4. Phase C：Ironclad Contract (契約確定)
**【Gate 2 通過条件】ビルド破壊証明 + 敵対的入力テスト合格**

### Step C-1: Mapper 破壊テスト
Appendix A の Lv4 ストレスレベルを網羅するテストを実行。
```powershell
npx vitest run "src/**/$SCREEN_ID/mapper.test.ts" --reporter=verbose | Out-File -FilePath "$FREEZE_DIR/technical-proofs/mapper_test.log" -Encoding utf8
```

### Step C-2: Contract 破壊証明
```powershell
# (Pseudo Code) Modify contract type, run build, verify failure, revert.
```

### Step C-3: UI 表示耐性テスト (Visual Kill)
```text
Inject a 10,000-character string (no spaces) into the primary text field.
Capture Screenshot as "stress_longtext.png".
Inject Worst Case Data (Lv4).
Capture Screenshot as "stress_worst.png".
Verify: No horizontal scroll, no layout collapse, no Console Errors.
```

## 5. Audit & Sign-off (最終監査)
- 禁止コード監査 (grep)
- 最終成果物確認 (Checklist)

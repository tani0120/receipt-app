# 前処理パイプライン統一 (2026-04-10)

## 概要

3箇所に分散していた画像前処理を `image_preprocessor.ts` 1ファイルに統一した。

## 背景

| ファイル | 変更前の状態 |
|---|---|
| `src/scripts/pipeline/image_preprocessor.ts` | 長辺1400px, gamma(1.5), grayscaleなし, sharpenなし |
| `src/api/services/pipeline/classify.service.ts` | 横幅2000px, grayscale, normalize, sharpen (inline実装) |
| `src/scripts/preprocess.ts` | 横幅2000px, grayscale, normalize, sharpen (inline実装) |

→ 3箇所がそれぞれsharpを直接呼び、パラメーターもバラバラだった。

## テスト実績（根拠）

| テスト | 前処理 | 精度 | 平均処理時間 |
|---|---|---|---|
| draft_1 | なし（生画像） | 100% | 17,992ms |
| draft_2_with_preprocess | あり（6ステップ） | 100% | 6,349ms |

→ 精度100%を維持しつつ **処理時間65%短縮** を実証。

## 確定パイプライン（6ステップ）

```
① rotate()           — EXIF自動回転補正
② resize(長辺2000px) — 長辺基準・アスペクト比維持 ★横幅→長辺に変更（縦長レシート対応）
③ grayscale()        — 白黒化（カラー情報除去、ファイルサイズ約1/3）
④ normalize()        — コントラスト正規化（ヒストグラム均等化）
⑤ sharpen(sigma=1.0) — 文字エッジ強調（かすれた感熱紙対策）
⑥ jpeg(quality=85)   — JPEG出力
```

### 採用しなかったもの

| 処理 | 理由 |
|---|---|
| gamma(1.5) | テスト未実施。normalize()と併用すると過剰補正のリスク |

## 変更内容

### ファイル1: `src/scripts/pipeline/image_preprocessor.ts`（正規モジュール化）

- パイプラインを確定6ステップに書き換え
- リサイズ: 長辺1400px → **長辺2000px**
- **grayscale()追加**
- **sharpen(sigma=1.0)追加**
- gamma(1.5) **削除**
- `AppliedSteps` 型に `grayscale`, `normalize`, `sharpen` フラグ追加

### ファイル2: `src/api/services/pipeline/classify.service.ts`（インライン削除）

- `PreprocessResult` インターフェース（55行）**削除**
- `preprocessForClassify()` 関数 **削除**
- `image_preprocessor.ts` を import して呼び出しに変更
- `sharp` の直接import **削除**

### ファイル3: `src/scripts/preprocess.ts`（バッチ用統一）

- ローカルの `preprocessImage()` 関数（20行）**削除**
- `image_preprocessor.ts` を import して呼び出しに変更
- `sharp` の直接import **削除**

### ファイル4: `src/api/services/pipeline/classify.service.ts`（モデルID修正）

- `gemini-2.5-flash-preview-04-17` → `gemini-2.5-flash`
- preview版が404（NOT_FOUND）になるため安定版に変更

## 変更後の構造

```
image_preprocessor.ts ── preprocessImage()  ← sharp呼び出しはここだけ
    ↑ import          ↑ import
classify.service.ts    preprocess.ts
```

## 検証結果

| チェック項目 | 結果 |
|---|---|
| `tsc --noEmit` | ✅ エラーゼロ（Exit code: 0） |
| APIサーバー起動 | ✅ 正常起動 |
| 前処理動作確認 | ✅ `3551KB → 909KB (74%削減)` |
| AI呼び出し | ⚠️ モデルID 404 → `gemini-2.5-flash` に修正 |

## 発見した既存問題

| 問題 | 詳細 | 対応 |
|---|---|---|
| `npm run dev` でAPIサーバー未起動 | `run-p` でtsxがサイレントクラッシュ。単独起動では問題なし | 今回のスコープ外（別途調査） |
| モデルID 404 | `gemini-2.5-flash-preview-04-17` が利用不可 | 本mdで修正済み |

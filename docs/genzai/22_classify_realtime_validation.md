# classify リアルタイムバリデーション仕様 (2026-04-11)

## 概要

スマホ/PC版アップロード画面で、AIパイプライン（`/api/pipeline/classify`）に接続し、
リアルタイムにバリデーション結果を返す。

## 対象ルート（4つ）＝ すべて同じAI処理＋バリデーション

| ルート | UI | ロール |
|---|---|---|
| `/upload/:clientId/staff/mobile` | スマホ用 | 事務所スタッフ |
| `/upload/:clientId/staff/pc` | PC用 | 事務所スタッフ |
| `/upload/:clientId/guest/mobile` | スマホ用 | 顧問先ゲスト |
| `/upload/:clientId/guest/pc` | PC用 | 顧問先ゲスト |

→ UIが違うだけで、AIパイプラインとバリデーションは共通

## 対象外

| ルート | 理由 |
|---|---|
| `/upload-docs/:clientId` | CSV・エクセル・謄本・税務届等。AIバリデーション不要 |

## やるべきこと

`analyzeReceiptMock`（ランダム結果）を、`/api/pipeline/classify` に接続する。

## バリデーション仕様

### AIが返す項目とバリデーション

| 項目 | AIが返す値 | バリデーション |
|---|---|---|
| `date` | `YYYY-MM-DD` or null | **nullならNG**（撮り直し） |
| `total_amount` | 数値 or null | **nullまたは0以下ならNG** |
| `issuer_name` | 文字列 or null | 警告のみ（NGにはしない） |
| `source_type` | 11種enum | `non_journal` / `other` → 除外フラグ |
| 重複 | SHA-256 + 日付+金額+取引先の一致 | ⚠警告表示（ブロックしない） |

### テスト用追加項目（AIレスポンスに含める）

| 項目 | 単位 | 用途 |
|---|---|---|
| `date` | `YYYY-MM-DD` | 証票の日付 |
| `duration_seconds` | **秒**（整数 or 小数） | 処理時間（msではない） |
| `token_count` | 整数 | 入力+出力トークン合計 |
| `cost_yen` | 円（小数） | 利用料（トークン×単価で算出） |

## 処理フロー

```
4ルートすべて
  → MockUploadPage.vue / MockUploadPcPage.vue
    → analyzeReceipt(file)
      → 現状: analyzeReceiptMock()     ← ランダム
      → 本番: POST /api/pipeline/classify  ← AIが判定
        → 前処理（image_preprocessor.ts）
        → Gemini classify
        → postprocess（バリデーション+fallback）
        → レスポンスを ReceiptAnalysisResult に変換
          → date/amount が null → ok: false, errorReason表示
          → date/amount が有効  → ok: true, 結果表示
```

## 通帳・クレカ明細の扱い

| 種別 | 特徴 | 処理 |
|---|---|---|
| レシート/領収書/請求書 | 1枚 = 1取引 | classify → 即OK |
| 通帳（`bank_statement`） | 1枚 = 複数行 | classify → **extractで行分割（将来実装）** |
| クレカ明細（`credit_card`） | 1枚 = 複数行 | classify → **extractで行分割（将来実装）** |

## 実装ステップ

1. classify API に `duration_seconds`, `token_count`, `cost_yen` を追加返却
2. `analyzeReceiptReal` を実装（POST `/api/pipeline/classify` に接続）
3. `ReceiptAnalysisResult` 型を拡張（テスト用項目追加）
4. フロント側バリデーション（date/amount nullチェック → ok: false）
5. 重複検出強化（日付+金額+取引先の内容ベース重複チェック）

## 今回のセッションで完了済み

- [x] 前処理パイプライン統一（`image_preprocessor.ts`）
- [x] モデルID修正（`gemini-2.5-flash`）
- [x] URLリネーム（`/client/` → 機能ベース、`/portal/` → `/guest/`）
- [x] 型チェックエラーゼロ確認

# Phase 6.3 環境変数設定ガイド

## 必須環境変数

### `.env.local` に追加

```bash
# Vertex AI設定
VITE_API_PROVIDER=vertex  # 'gemini' or 'vertex'
VERTEX_PROJECT_ID=sugu-suru
VERTEX_LOCATION=asia-northeast1
```

## 環境変数の説明

### `VITE_API_PROVIDER`
- **デフォルト**: `gemini`（Phase 6.2）
- **Phase 6.3**: `vertex`に変更
- **切り戻し**: `gemini`に戻せば即座にPhase 6.2に戻る

### `VERTEX_PROJECT_ID`
- GCPプロジェクトID
- **値**: `sugu-suru`

### `VERTEX_LOCATION`
- Vertex AIのリージョン
- **値**: `asia-northeast1`（東京）
- **重要**: Context CacheとモデルのリージョンEd一致が必須

## 設定手順

### 1. `.env.local`ファイル編集

```bash
# プロジェクトルートで実行
cd C:\dev\receipt-app
notepad .env.local
```

### 2. 以下の行を追加

```bash
VITE_API_PROVIDER=vertex
VERTEX_PROJECT_ID=sugu-suru
VERTEX_LOCATION=asia-northeast1
```

### 3. 開発サーバー再起動

```bash
# 既存サーバー停止: Ctrl+C
# 再起動
npm run dev
```

## 確認方法

### 1. ブラウザコンソールで確認

TestOCRページでレシート画像をアップロード後、コンソールに以下が表示されれば成功:

```
[OCR Service] Provider: Vertex AI (Phase 6.3)
```

### 2. Node.jsサーバーログで確認

ターミナルに以下が表示されれば成功:

```
[OCR API] リクエスト受信: clientId=CL-001
[Vertex] OCR実行開始: clientId=CL-001
[Cache] キー: CL-001:master_data.txt
```

## トラブルシューティング

### `[OCR Service] Provider: Gemini API (Phase 6.2)` が表示される

**原因**: 環境変数が読み込まれていない

**対処**:
1. `.env.local`の保存確認
2. 開発サーバー再起動（Ctrl+C → `npm run dev`）
3. ブラウザのハードリロード（Ctrl+Shift+R）

### `Vertex AI call failed` エラー

**原因**: ADC認証失敗

**対処**:
```bash
# ADC設定確認
gcloud auth application-default login

# プロジェクト確認
gcloud config get-value project  # → sugu-suru

# API有効化確認
gcloud services list --enabled | grep aiplatform
```

### `404 Not Found` エラー

**原因**: モデルまたはリージョンが不正

**対処**:
- `VERTEX_LOCATION=asia-northeast1` を確認
- モデル名が `gemini-2.5-flash` であることを確認

## Phase 6.2への切り戻し

緊急時は以下を実行:

### 1. `.env.local`編集

```bash
VITE_API_PROVIDER=gemini  # vertex → gemini に変更
```

### 2. 開発サーバー再起動

```bash
# Ctrl+C で停止
npm run dev
```

### 3. 確認

ブラウザコンソールに以下が表示されればPhase 6.2に戻っています:

```
[OCR Service] Provider: Gemini API (Phase 6.2)
```

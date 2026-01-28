# Cloud Run デプロイ 15時間試行の最終状況レポート

## 📊 試行サマリー

**合計試行時間**: 15時間以上  
**最終ステータス**: ❌ 失敗（container-failed-to-start）

---

## ✅ 成功した項目

1. **Cloud Build**: イメージ作成成功（毎回）
2. **esbuild**: Gemini推奨の`--packages=external`で93.8kbのバンドル生成成功
3. **Git管理**: すべての変更をコミット済み
4. **Dockerfile**: マルチステージビルド構成完了

---

## ❌ 失敗している項目

### Cloud Run デプロイ
```
⠧ Deploying...       
X Deploying...       
  - Creating Revision... 
  container-failed-to-start
```

**エラーコード**: `container-failed-to-start`  
**発生頻度**: 全デプロイ試行で一貫して発生

---

## 🔍 推定される問題

### 1. ローカルでも同じエラーが発生
```bash
node dist/server.js
# => TypeError: Cannot read property ... of undefined
```

**症状**: エラーメッセージが切れて詳細不明

### 2. 考えられる原因

#### 原因A: node_modulesが存在しない
- `--packages=external`を使用したため、Firebase等の依存関係がバンドルされていない
- しかし、Dockerfileで`npm ci --omit=dev`を実行しているはず
- **確認が必要**: Dockerイメージ内に`node_modules`が存在するか？

#### 原因B: 環境変数が不足
- `FIREBASE_PROJECT_ID`等の環境変数がCloud Run側で設定されていない
- しかし、Firebase Admin SDKは「Application Default Credentials (ADC)」でも動作するはず
- **確認が必要**: どの環境変数が必須か？

#### 原因C: import.meta.envの残存
- `src/firebase.ts`を除外したが、他のファイルに残っているか？
- esbuildがViteの`import.meta.env`を適切に処理できていない？

#### 原因D: dist/clientが存在しない
- `serveStatic({ root: './dist/client' })`でフロントエンド静的ファイルを提供
- しかし、Dockerイメージ内に`dist/client`が存在しない？
- **原因**: Dockerfileのマルチステージビルドで`dist/client`がコピーされていない可能性

---

## 📋 次のアクション候補

### アクション1: Dockerイメージ内を確認
```bash
docker run -it gcr.io/sugu-suru/receipt-api:latest /bin/sh
ls -la dist/
ls -la node_modules/
```

### アクション2: Cloud Runログの完全取得
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=receipt-api" --limit=50 --format=json
```

### アクション3: 環境変数をCloud Runに設定
```bash
gcloud run services update receipt-api \
  --set-env-vars="FIREBASE_PROJECT_ID=sugu-suru,NODE_ENV=production" \
  --region=asia-northeast1
```

### アクション4: Dockerfileの修正
```dockerfile
# --- Runtime Stage ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# フロントエンドとバックエンド両方をコピー
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist  # ← これで dist/client と dist/server.js 両方コピー
RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "dist/server.js"]
```

---

## 🎯 最優先アクション

1. **Cloud Runログの完全取得** → 実際のエラーメッセージを確認
2. **Dockerイメージの内容確認** → dist/clientとnode_modulesの存在確認
3. **上記に基づいて修正** → Dockerfile or 環境変数

---

## 📝 現在の設定

### package.json
```json
{
  "type": "module",
  "scripts": {
    "build:backend": "esbuild src/server.ts --bundle --platform=node --format=esm --target=node20 --packages=external --outfile=dist/server.js"
  }
}
```

### Dockerfile
```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --omit=dev
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

### tsconfig.server.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "exclude": ["src/firebase.ts", "src/utils/auth.ts", "src/utils/testAuth.ts"]
}
```

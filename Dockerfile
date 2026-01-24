FROM node:20-slim AS builder
WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# ソースコードのコピー
COPY . .

# ビルド実行（個別に実行して重複を回避）
RUN npm run build:frontend
RUN npm run build:backend

# ビルド結果の確認
RUN ls -la dist/ && echo "=== dist/client ===" && ls -la dist/client/ || echo "No client dir"

# --- Runtime ---
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# 依存関係の定義ファイルをコピー
COPY --from=builder /app/package*.json ./

# 本番依存関係のインストール
RUN npm ci --omit=dev

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist

# インストール結果の確認
RUN echo "=== Checking installation ===" && \
    ls -la dist/ && \
    ls -la node_modules/@hono/ && \
    node --version

EXPOSE 8080

CMD ["node", "dist/server.js"]

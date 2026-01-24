# --- Build Stage ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# フロントエンドとバックエンド両方をビルド
RUN npm run build
RUN npm run build:backend

# --- Runtime Stage ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package*.json ./
# dist ディレクトリ全体をコピー（client と server.js 両方）
COPY --from=builder /app/dist ./dist
# 本番用依存関係をインストール
RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "dist/server.js"]

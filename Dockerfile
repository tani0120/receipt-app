FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:frontend
RUN npm run build:backend

# ビルド結果の詳細確認
RUN echo "=== Build Results ===" && \
    ls -lah dist/ && \
    echo "=== Server Bundle ===" && \
    ls -lah dist/server.js && \
    echo "=== Client Dir ===" && \
    (ls -lah dist/client/ || echo "No client dir") && \
    echo "=== Server Content Preview ===" && \
    head -20 dist/server.js

FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# 実行環境の詳細確認
RUN echo "=== Runtime Environment ===" && \
    node --version && \
    npm --version && \
    echo "=== Hono Installation ===" && \
    ls -lah node_modules/@hono/ && \
    echo "=== Files to Run ===" && \
    ls -lah dist/

EXPOSE 8080

# ヘルスチェック追加（Cloud Runが起動を確認できるように）
HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

CMD ["node", "dist/server.js"]

<template>
  <div class="portal-page" style="font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif">

    <!-- 左上ロゴ -->
    <div class="top-logo">
      <img src="/sugu-suru-logo.png" alt="sugu-suru" class="brand-logo" />
    </div>

    <!-- 右上社名バッジ -->
    <div class="company-badge">
      <span class="client-badge-icon">🏢</span>
      <span class="client-badge-name">{{ clientName }}</span>
    </div>

    <main class="portal-main">

      <!-- 挨拶 -->
      <div class="greeting">
        <h1 class="greeting-title">資料アップロード</h1>
        <p class="greeting-sub">下のボタンから資料をお送りください</p>
      </div>

      <!-- メインアクションカード -->
      <div class="action-cards">

        <!-- 📄 領収書・レシート -->
        <div class="action-card">
          <div class="card-header">
            <span class="card-icon">📄</span>
            <div>
              <h2 class="card-title">領収書・レシートを送る</h2>
              <p class="card-desc">撮影またはスキャンした画像をアップロード</p>
            </div>
          </div>
          <div class="card-modes">
            <button class="mode-btn" @click="goUpload('mobile')">
              <div class="mode-icon-wrap mode-icon--mobile"><span>📱</span></div>
              <div class="mode-text">
                <span class="mode-label">スマホで撮影</span>
                <span class="mode-hint">カメラで撮ってそのまま送れます</span>
              </div>
              <span class="mode-arrow">→</span>
            </button>
            <button class="mode-btn" @click="goUpload('pc')">
              <div class="mode-icon-wrap mode-icon--pc"><span>💻</span></div>
              <div class="mode-text">
                <span class="mode-label">PCから送る</span>
                <span class="mode-hint">画像をまとめてアップロード</span>
              </div>
              <span class="mode-arrow">→</span>
            </button>
          </div>
        </div>

        <!-- 📎 その他の資料 -->
        <div class="action-card card--secondary">
          <div class="card-header">
            <span class="card-icon">📎</span>
            <div>
              <h2 class="card-title">その他の資料を送る</h2>
              <p class="card-desc">謄本・CSV・Excel・通帳コピーなど</p>
            </div>
          </div>
          <button class="docs-btn" @click="goUploadDocs">
            資料アップロードを開く →
          </button>
        </div>
      </div>

      <!-- 撮影ヒント -->
      <div class="tips-section">
        <h3 class="tips-title">💡 きれいに撮るコツ</h3>
        <div class="tips-grid">
          <div class="tip" v-for="tip in tips" :key="tip.icon">
            <span class="tip-icon">{{ tip.icon }}</span>
            <span class="tip-text">{{ tip.text }}</span>
          </div>
        </div>
      </div>

      <!-- フッター -->
      <p class="portal-footer">© sugu-suru</p>
    </main>

  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

// モック: clientIdから社名を取得
const clientNames: Record<string, string> = {
  'LDI-00008': '株式会社LDIデジタル',
}
const clientName = clientNames[clientId] || clientId

const tips = [
  { icon: '☀️', text: '明るい場所で撮影' },
  { icon: '📐', text: '真上からまっすぐ撮影' },
  { icon: '🔍', text: 'ピントを合わせてから撮影' },
  { icon: '📏', text: 'レシート全体が枠に入るように' },
]

const goUpload = (mode: 'mobile' | 'pc') => {
  router.push(`/portal/${clientId}/${mode}`)
}

const goUploadDocs = () => {
  router.push(`/portal/${clientId}/docs`)
}
</script>

<style scoped>
/* ===== ページ全体 ===== */
.portal-page {
  height: 100vh;
  overflow-y: auto;
  background: #fff;
  position: relative;
}

/* ===== 左上ロゴ ===== */
.top-logo {
  position: absolute;
  top: 20px; left: 24px;
  z-index: 10;
}
.brand-logo {
  height: 32px;
  object-fit: contain;
  opacity: 0.85;
}

/* ===== メイン ===== */
.portal-main {
  max-width: 480px;
  margin: 0 auto;
  padding: 60px 20px 40px;
}

/* ===== 挨拶 ===== */
.greeting {
  text-align: center;
  margin-bottom: 36px;
}
.greeting-title {
  font-size: 24px;
  font-weight: 900;
  color: #1e293b;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}
.greeting-sub {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

/* 右上社名バッジ */
.company-badge {
  position: absolute;
  top: 20px; right: 24px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}
.client-badge-icon {
  font-size: 14px; line-height: 1;
}
.client-badge-name {
  font-size: 13px; font-weight: 700; color: #1e40af;
}

/* ===== アクションカード ===== */
.action-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 28px;
}
.action-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  background: #fff;
  transition: box-shadow 0.2s;
}
.action-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}
.card--secondary {
  background: #fafbfc;
}

/* カードヘッダー */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}
.card-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}
.card-title {
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 2px;
}
.card-desc {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

/* モードボタン */
.card-modes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.mode-btn:hover {
  border-color: #93c5fd;
  background: #f8fafc;
}
.mode-btn:active {
  transform: scale(0.99);
}
.mode-icon-wrap {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
}
.mode-icon--mobile { background: #eff6ff; }
.mode-icon--pc     { background: #f0fdf4; }
.mode-text {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
}
.mode-label {
  font-size: 14px; font-weight: 700; color: #1e293b;
}
.mode-hint {
  font-size: 11px; color: #94a3b8; margin-top: 1px;
}
.mode-arrow {
  font-size: 16px; color: #cbd5e1; flex-shrink: 0;
  transition: color 0.2s;
}
.mode-btn:hover .mode-arrow { color: #3b82f6; }

/* その他ボタン */
.docs-btn {
  display: block; width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 13px; font-weight: 600; color: #475569;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  text-align: center;
}
.docs-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* ===== ヒント ===== */
.tips-section {
  border-top: 1px solid #f1f5f9;
  padding-top: 24px;
  margin-bottom: 20px;
}
.tips-title {
  font-size: 13px; font-weight: 700; color: #64748b;
  margin: 0 0 14px;
}
.tips-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 400px) {
  .tips-grid { grid-template-columns: 1fr; }
}
.tip {
  display: flex; align-items: center; gap: 8px;
}
.tip-icon { font-size: 16px; flex-shrink: 0; }
.tip-text { font-size: 12px; color: #64748b; }

/* ===== フッター ===== */
.portal-footer {
  text-align: center;
  font-size: 11px; color: #cbd5e1;
  margin-top: 32px;
}
</style>

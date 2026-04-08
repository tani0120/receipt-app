<template>
  <div class="portal-page">

    <!-- ===== 事務所ブランディングヘッダー ===== -->
    <header class="portal-header">
      <div class="header-inner">
        <div class="brand-area">
          <span class="brand-icon">🏢</span>
          <div>
            <h1 class="brand-name">すぐるす会計事務所</h1>
            <p class="brand-sub">資料アップロードポータル</p>
          </div>
        </div>
      </div>
    </header>

    <!-- ===== メインコンテンツ ===== -->
    <main class="portal-main">

      <!-- 挨拶 -->
      <div class="greeting-area">
        <p class="greeting-text">
          いつもお世話になっております。<br>
          下のボタンから資料をお送りください。
        </p>
      </div>

      <!-- セクション: 領収書・レシート -->
      <section class="portal-section">
        <h2 class="section-title">
          <span class="section-icon">📄</span>
          領収書・レシートを送る
        </h2>
        <p class="section-desc">
          撮影またはスキャンした画像をアップロードします。<br>
          AIが自動でチェックし、不備があればその場で教えます。
        </p>

        <div class="mode-grid">
          <!-- スマホ用 -->
          <button class="mode-card mode-mobile" @click="goUpload('mobile')">
            <div class="mode-icon-wrap mode-icon-mobile">
              <span class="mode-icon">📱</span>
            </div>
            <div class="mode-text">
              <h3 class="mode-title">スマホで撮影</h3>
              <p class="mode-desc">カメラで撮ってそのまま送れます</p>
            </div>
            <span class="mode-arrow">→</span>
          </button>

          <!-- PC用 -->
          <button class="mode-card mode-pc" @click="goUpload('pc')">
            <div class="mode-icon-wrap mode-icon-pc">
              <span class="mode-icon">💻</span>
            </div>
            <div class="mode-text">
              <h3 class="mode-title">PCから送る</h3>
              <p class="mode-desc">保存済みの画像をまとめて送れます</p>
            </div>
            <span class="mode-arrow">→</span>
          </button>
        </div>
      </section>

      <!-- セクション: その他の資料 -->
      <section class="portal-section section-docs">
        <h2 class="section-title">
          <span class="section-icon">📎</span>
          その他の資料を送る
        </h2>
        <p class="section-desc">
          謄本・CSV・Excel・通帳コピーなど
        </p>
        <button class="docs-btn" @click="goUploadDocs">
          資料アップロードを開く →
        </button>
      </section>

      <!-- 撮影ヒント -->
      <section class="portal-section section-tips">
        <h2 class="section-title">
          <span class="section-icon">💡</span>
          きれいに撮るコツ
        </h2>
        <div class="tips-grid">
          <div v-for="tip in tips" :key="tip.icon" class="tip-item">
            <span class="tip-icon">{{ tip.icon }}</span>
            <p class="tip-text">{{ tip.text }}</p>
          </div>
        </div>
      </section>

    </main>

    <!-- フッター -->
    <footer class="portal-footer">
      <p class="footer-text">© すぐるす会計事務所</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

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
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f0f4ff 100%);
  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ===== ヘッダー ===== */
.portal-header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

.header-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px 20px;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  font-size: 32px;
  line-height: 1;
}

.brand-name {
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: 11px;
  color: #94a3b8;
  margin: 2px 0 0;
}

/* ===== メイン ===== */
.portal-main {
  flex: 1;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 16px 40px;
}

/* ===== 挨拶 ===== */
.greeting-area {
  text-align: center;
  margin-bottom: 28px;
}

.greeting-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
  margin: 0;
}

/* ===== セクション ===== */
.portal-section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  font-size: 18px;
}

.section-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 16px;
  line-height: 1.7;
}

/* ===== モード選択グリッド ===== */
.mode-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.mode-card:hover {
  border-color: #93c5fd;
  background: #f0f7ff;
  transform: translateX(4px);
}

.mode-card:active {
  transform: scale(0.98);
}

.mode-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mode-icon-mobile { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.mode-icon-pc     { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }

.mode-icon {
  font-size: 24px;
}

.mode-text {
  flex: 1;
  min-width: 0;
}

.mode-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 2px;
}

.mode-desc {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.mode-arrow {
  font-size: 18px;
  color: #cbd5e1;
  flex-shrink: 0;
  transition: color 0.2s;
}

.mode-card:hover .mode-arrow {
  color: #3b82f6;
}

/* ===== その他の資料 ===== */
.section-docs {
  background: #fafafa;
  border: 1px dashed #d1d5db;
  box-shadow: none;
}

.docs-btn {
  display: block;
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.docs-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

/* ===== 撮影ヒント ===== */
.section-tips {
  background: #fffbeb;
  border: 1px solid #fde68a;
  box-shadow: none;
}

.tips-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 400px) {
  .tips-grid {
    grid-template-columns: 1fr;
  }
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.tip-text {
  font-size: 11px;
  color: #92400e;
  margin: 0;
  line-height: 1.4;
}

/* ===== フッター ===== */
.portal-footer {
  text-align: center;
  padding: 20px;
}

.footer-text {
  font-size: 10px;
  color: #cbd5e1;
  margin: 0;
}
</style>

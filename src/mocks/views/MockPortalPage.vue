<template>
  <div class="portal-page" style="font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif">

    <!-- ポータル共通ヘッダー -->
    <PortalHeader :clientName="clientName" />

    <main class="portal-main">

      <!-- ヒーローセクション -->
      <div class="hero">
        <div class="hero-icon-wrap">
          <span class="hero-icon">📂</span>
          <div class="hero-icon-ring"></div>
        </div>
        <h1 class="hero-title">資料を共有する</h1>
        <p class="hero-sub">パソコンやスマホで撮影して資料を共有できます</p>
      </div>

      <!-- CTAカード -->
      <div class="cta-card" @click="goUpload()">
        <div class="cta-inner">
          <div class="cta-icon-wrap">
            <svg class="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="cta-text">
            <span class="cta-label">ファイルをアップロード</span>
            <span class="cta-hint">PC・スマホ自動対応</span>
          </div>
          <div class="cta-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
        <div class="cta-shimmer"></div>
      </div>

      <!-- 対応ファイル形式 -->
      <div class="formats-section">
        <p class="formats-label">対応ファイル形式</p>
        <div class="formats-badges">
          <span class="format-badge" v-for="fmt in formats" :key="fmt.label">
            <span class="format-badge-icon">{{ fmt.icon }}</span>
            {{ fmt.label }}
          </span>
        </div>
      </div>

      <!-- 共有のコツ -->
      <div class="tips-section">
        <div class="tips-header">
          <span class="tips-icon">💡</span>
          <h3 class="tips-title">資料を共有するコツ</h3>
        </div>
        <ol class="tips-list">
          <li class="tip-item" v-for="(tip, i) in tips" :key="i">
            <span class="tip-number">{{ i + 1 }}</span>
            <div class="tip-content">
              <span class="tip-text">{{ tip.text }}</span>
              <span v-if="tip.note" class="tip-note">{{ tip.note }}</span>
            </div>
          </li>
        </ol>
        <p class="tips-footer-note">
          ※ PDF、写真、CSV、エクセル、会計ソフトデータなど<br>
          ほぼすべてのファイルに対応しています
        </p>
      </div>

      <!-- フッター -->
      <p class="portal-footer">© sugu-suru</p>
    </main>

  </div>
</template>

<script setup lang="ts">
import PortalHeader from '@/mocks/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const { clients } = useClients()
const clientName = clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId

const formats = [
  { icon: '📄', label: 'PDF' },
  { icon: '📷', label: '写真' },
  { icon: '📊', label: 'CSV' },
  { icon: '📗', label: 'エクセル' },
  { icon: '💰', label: '会計ソフト' },
]

const tips = [
  { text: '資料は1枚づつご共有ください', note: '※ 2枚以上の場合はエラーになります' },
  { text: '重ならないようにご共有ください', note: '※ 重なっているとエラーになります' },
  { text: 'スマホで撮影する場合は真上から撮影してください', note: null },
]

const goUpload = () => {
  router.push(`/upload/${clientId}/guest`)
}

</script>

<style scoped>
/* ===== ページ全体 ===== */
.portal-page {
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(160deg, #f0f6ff 0%, #e8f0fe 30%, #f7f4ff 60%, #fef7f0 100%);
  position: relative;
}

/* ===== メイン ===== */
.portal-main {
  max-width: 520px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) 40px;
}

/* ===== ヒーローセクション ===== */
.hero {
  text-align: center;
  margin-bottom: 36px;
}

.hero-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin-bottom: 20px;
}

.hero-icon {
  font-size: 36px;
  position: relative;
  z-index: 1;
  animation: floatIcon 3s ease-in-out infinite;
}

.hero-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
  animation: pulseRing 3s ease-in-out infinite;
}

@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pulseRing {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.7; }
}

.hero-title {
  font-size: 26px;
  font-weight: 900;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.hero-sub {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* ===== CTAカード ===== */
.cta-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15), 0 1px 3px rgba(0,0,0,0.06);
}

.cta-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.25), 0 2px 6px rgba(0,0,0,0.08);
}

.cta-card:active {
  transform: translateY(0) scale(0.99);
}

.cta-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
}

.cta-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cta-icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.cta-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cta-label {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
}

.cta-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
}

.cta-arrow {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.cta-arrow svg {
  width: 16px;
  height: 16px;
  color: #fff;
}

.cta-card:hover .cta-arrow {
  background: rgba(255,255,255,0.3);
}

/* シマー効果 */
.cta-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  animation: shimmer 3s ease-in-out infinite;
  z-index: 2;
  pointer-events: none;
}

@keyframes shimmer {
  0% { left: -100%; }
  30% { left: 150%; }
  100% { left: 150%; }
}

/* ===== 対応ファイル形式 ===== */
.formats-section {
  text-align: center;
  margin-bottom: 32px;
}

.formats-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 10px;
}

.formats-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.format-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(226, 232, 240, 0.6);
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.format-badge:hover {
  background: rgba(255,255,255,0.95);
  border-color: #c7d2fe;
  color: #4338ca;
}

.format-badge-icon {
  font-size: 13px;
}

/* ===== 共有のコツ ===== */
.tips-section {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 20px;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.tips-icon {
  font-size: 20px;
}

.tips-title {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tip-number {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tip-text {
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  color: #334155;
  line-height: 1.5;
}

.tip-note {
  font-size: clamp(10px, 2.5vw, 12px);
  color: #ef4444;
  font-weight: 500;
}

.tips-footer-note {
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  font-size: clamp(10px, 2.5vw, 12px);
  color: #64748b;
  line-height: 1.7;
  text-align: center;
}

/* ===== フッター ===== */
.portal-footer {
  text-align: center;
  font-size: 11px;
  color: #cbd5e1;
  margin-top: 32px;
}

/* ===== レスポンシブ ===== */
@media (max-width: 480px) {
  .portal-main {
    padding: 32px 16px 32px;
  }
  .hero-title {
    font-size: 22px;
  }
  .hero-sub {
    font-size: 13px;
  }
  .cta-inner {
    padding: 16px 18px;
  }
  .cta-label {
    font-size: 15px;
  }
}
</style>

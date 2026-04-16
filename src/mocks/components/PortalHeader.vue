<template>
  <!-- ポータル共通ヘッダー（左ロゴ＋右社名バッジ） -->
  <nav class="portal-header-bar">
    <div class="portal-header-inner">
      <!-- 左: ロゴ -->
      <div class="portal-logo">
        <img src="/sugu-suru-logo.png" alt="sugu-suru" class="portal-logo-img" />
      </div>
      <!-- 右: 社名バッジ -->
      <div class="portal-company-badge" v-if="clientName">
        <span class="portal-company-icon">🏢</span>
        <span class="portal-company-name">{{ clientName }}</span>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  /** 顧問先社名（例: 株式会社LDIデジタル） */
  clientName?: string
}>()
</script>

<style scoped>
/* ===== ポータル共通ヘッダー（フロー内ナビバー） ===== */
.portal-header-bar {
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 30;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.portal-header-inner {
  max-width: 1440px;
  margin: 0 auto;
  padding: clamp(8px, 2vw, 12px) clamp(12px, 3vw, 24px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 左: ロゴ */
.portal-logo-img {
  height: clamp(24px, 4vw, 32px);
  opacity: 0.85;
  display: block;
}

/* 右: 社名バッジ */
.portal-company-badge {
  display: inline-flex;
  align-items: center;
  gap: clamp(4px, 1vw, 6px);
  padding: clamp(4px, 1vw, 6px) clamp(10px, 2vw, 16px);
  border-radius: 20px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  flex-shrink: 0;
}
.portal-company-icon {
  font-size: clamp(11px, 2vw, 14px); line-height: 1;
}
.portal-company-name {
  font-size: clamp(10px, 2.5vw, 13px); font-weight: 700; color: #1e40af;
  white-space: nowrap;
}
</style>

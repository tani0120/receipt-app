<template>
  <!-- ポータル共通ヘッダー（左上ロゴ＋右上社名バッジ） -->
  <div class="portal-header-wrap">
    <!-- 左上ロゴ -->
    <div class="portal-logo">
      <img src="/sugu-suru-logo.png" alt="sugu-suru" class="portal-logo-img" />
    </div>
    <!-- 右上社名バッジ -->
    <div class="portal-company-badge" v-if="clientName">
      <span class="portal-company-icon">🏢</span>
      <span class="portal-company-name">{{ clientName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** 顧問先社名（例: 株式会社LDIデジタル） */
  clientName?: string
}>()
</script>

<style scoped>
/* ===== ポータル共通ヘッダー ===== */
.portal-header-wrap {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 30;
  pointer-events: none;
}

/* 左上ロゴ: top:20px left:24px（全ページ統一） */
.portal-logo {
  position: absolute;
  top: 20px; left: 24px;
  pointer-events: auto;
}
.portal-logo-img {
  height: 32px;
  opacity: 0.85;
}

/* 右上社名バッジ: top:20px right:24px（全ページ統一） */
.portal-company-badge {
  position: absolute;
  top: 20px; right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  pointer-events: auto;
}
.portal-company-icon {
  font-size: 14px; line-height: 1;
}
.portal-company-name {
  font-size: 13px; font-weight: 700; color: #1e40af;
}
</style>

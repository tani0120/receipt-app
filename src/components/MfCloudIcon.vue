<script setup lang="ts">
/**
 * MfCloudIcon.vue — MF連携由来フィールドを示すクラウドアイコン
 *
 * 使用例: <MfCloudIcon />
 * Props:
 *   size: アイコンサイズ（px）。デフォルト14
 *   tooltip: ホバー時ツールチップ。デフォルト「MF連携」
 */
withDefaults(defineProps<{
  size?: number
  tooltip?: string
}>(), {
  size: 14,
  tooltip: 'MF連携',
})
</script>

<template>
  <span class="mf-cloud-icon" :title="tooltip">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      :width="size"
      :height="size"
    >
      <path
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        fill="#fff"
        stroke="#3b82f6"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<style scoped>
.mf-cloud-icon {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
  cursor: help;
  transition: all 0.2s ease;
}
.mf-cloud-icon:hover {
  transform: scale(1.2);
  filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.45));
}
.mf-cloud-icon:hover :deep(svg path) {
  stroke: #2563eb;
  fill: #eff6ff;
}
.mf-cloud-icon svg {
  display: block;
}
</style>

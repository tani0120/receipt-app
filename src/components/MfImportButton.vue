<template>
  <button
    v-if="authenticated"
    class="cm-mf-import-btn"
    :disabled="loading"
    @click="$emit('import')"
    :title="tooltip"
  >
    <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
    <i v-else class="fa-solid fa-cloud-arrow-down"></i>
    MFインポート
  </button>
  <button v-else class="cm-mf-import-btn" disabled :title="disabledTooltip">
    <i class="fa-solid fa-cloud"></i>
    MF未連携
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** MF認証済みかどうか（falseの場合「MF未連携」表示） */
  authenticated: boolean;
  /** インポート処理中かどうか */
  loading?: boolean;
  /** ボタンのツールチップ */
  tooltip?: string;
  /** 未連携時のツールチップ */
  disabledTooltip?: string;
}>(), {
  loading: false,
  tooltip: 'MFからインポート',
  disabledTooltip: 'MF未連携',
});

defineEmits<{
  (e: 'import'): void;
}>();
</script>

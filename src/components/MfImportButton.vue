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

  <!-- エラーモーダル（内蔵） -->
  <div v-if="errorModalVisible" class="mf-error-overlay" @click.self="closeErrorModal">
    <div class="mf-error-modal">
      <div class="mf-error-header">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>{{ errorTitle }}</span>
        <button class="mf-error-close" @click="closeErrorModal">×</button>
      </div>
      <div class="mf-error-body">
        <p class="mf-error-message">{{ errorMessage }}</p>
        <div v-if="errorLog" class="mf-error-log-section">
          <p class="mf-error-log-label">以下をコピーして管理者に報告してください。</p>
          <pre class="mf-error-log" ref="errorLogRef">{{ errorLog }}</pre>
          <button class="mf-error-copy-btn" @click="copyErrorLog">
            <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'"></i>
            {{ copied ? 'コピー済み' : 'コピー' }}
          </button>
        </div>
      </div>
      <div class="mf-error-footer">
        <button class="mf-error-ok-btn" @click="closeErrorModal">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

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

// =============== エラーモーダル ===============
const errorModalVisible = ref(false);
const errorTitle = ref('');
const errorMessage = ref('');
const errorLog = ref('');
const copied = ref(false);
const errorLogRef = ref<HTMLPreElement | null>(null);

/** エラーモーダルを表示する */
function showError(title: string, message: string, log?: string) {
  errorTitle.value = title;
  errorMessage.value = message;
  errorLog.value = log ?? '';
  copied.value = false;
  errorModalVisible.value = true;
}

/** エラーモーダルを閉じる */
function closeErrorModal() {
  errorModalVisible.value = false;
}

/** エラーログをクリップボードにコピー */
async function copyErrorLog() {
  try {
    const text = [
      `[${new Date().toISOString()}]`,
      `タイトル: ${errorTitle.value}`,
      `メッセージ: ${errorMessage.value}`,
      `ログ:`,
      errorLog.value,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // フォールバック: テキスト選択
    if (errorLogRef.value) {
      const range = document.createRange();
      range.selectNodeContents(errorLogRef.value);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }
}

// 親コンポーネントから呼べるよう公開
defineExpose({ showError });
</script>

<style scoped>
/* エラーモーダル オーバーレイ */
.mf-error-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* エラーモーダル カード */
.mf-error-modal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 560px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ヘッダー */
.mf-error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #fff3e0;
  border-bottom: 1px solid #ffe0b2;
  color: #e65100;
  font-weight: 600;
  font-size: 14px;
}
.mf-error-header i {
  font-size: 16px;
}
.mf-error-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}
.mf-error-close:hover {
  color: #333;
}

/* ボディ */
.mf-error-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.mf-error-message {
  margin: 0 0 12px;
  color: #333;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* エラーログセクション */
.mf-error-log-section {
  border-top: 1px solid #eee;
  padding-top: 12px;
}
.mf-error-log-label {
  margin: 0 0 8px;
  color: #666;
  font-size: 12px;
  font-weight: 600;
}
.mf-error-log {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #333;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0 0 8px;
  user-select: text;
}

/* コピーボタン */
.mf-error-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #555;
  font-size: 12px;
  cursor: pointer;
}
.mf-error-copy-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

/* フッター */
.mf-error-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}
.mf-error-ok-btn {
  padding: 6px 24px;
  background: #1976D2;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
.mf-error-ok-btn:hover {
  background: #1565C0;
}
</style>

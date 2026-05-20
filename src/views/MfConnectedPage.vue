<script setup lang="ts">
/**
 * MfConnectedPage.vue — MF OAuth認証 完了ページ
 *
 * レイヤー: ★view★
 * 責務: OAuthコールバック後のサンクスページ（認証不要・社長向け）
 *
 * ルート: /mf/connected
 * クエリ: ?mf_auth=success|error  &reason=...
 *
 * 準拠:
 *   - load_context.md: 新規ロジック禁止（表示変換のみ）
 *   - 34_mf_mcp_integration.md §8 1-12: リダイレクトUI実装
 */
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

/** 認証結果 */
const authResult = computed<"success" | "error" | "denied" | "unknown">(() => {
  const mfAuth = route.query.mf_auth as string | undefined;
  const reason = route.query.reason as string | undefined;
  if (mfAuth === "success") return "success";
  if (mfAuth === "error" && reason === "access_denied") return "denied";
  if (mfAuth === "error") return "error";
  return "unknown";
});

/** エラー理由の日本語表示 */
const errorReason = computed(() => {
  const reason = route.query.reason as string | undefined;
  if (!reason) return "";
  const map: Record<string, string> = {
    access_denied: "連携が拒否されました",
    missing_params: "認証パラメータが不足しています",
    invalid_state: "セキュリティチェックに失敗しました",
    token_exchange_failed: "トークンの取得に失敗しました",
  };
  return map[reason] ?? reason;
});

/** ページを閉じる（window.openで開いたタブなので window.close() が有効） */
const closeWindow = () => {
  window.close();
};
</script>

<template>
  <div class="mf-connected-root">
    <div class="mf-connected-card">
      <!-- ロゴ -->
      <div class="mf-logo-area">
        <span class="mf-logo-text">sugu<span class="mf-logo-accent">-suru</span></span>
      </div>

      <!-- 成功 -->
      <template v-if="authResult === 'success'">
        <div class="mf-icon mf-icon--success">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="26" fill="#22C55E" fill-opacity="0.12" />
            <path
              d="M15 27L22 34L37 18"
              stroke="#22C55E"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1 class="mf-title">連携が完了しました</h1>
        <p class="mf-body">当社システムとの連携が完了しました。</p>
        <p class="mf-body">
          このページは閉じていただいて構いません。<br />担当者より改めてご連絡いたします。
        </p>
      </template>

      <!-- 拒否（access_denied） -->
      <template v-else-if="authResult === 'denied'">
        <div class="mf-icon mf-icon--warn">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="26" fill="#F59E0B" fill-opacity="0.12" />
            <path d="M26 16V27" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
            <circle cx="26" cy="35" r="2" fill="#F59E0B" />
          </svg>
        </div>
        <h1 class="mf-title">連携がキャンセルされました</h1>
        <p class="mf-body">
          連携の許可が行われませんでした。<br />再度ご連絡いただければ、担当者より改めてご案内いたします。
        </p>
      </template>

      <!-- エラー -->
      <template v-else>
        <div class="mf-icon mf-icon--error">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="26" fill="#EF4444" fill-opacity="0.12" />
            <path
              d="M18 18L34 34M34 18L18 34"
              stroke="#EF4444"
              stroke-width="3.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h1 class="mf-title">エラーが発生しました</h1>
        <p class="mf-body mf-body--error" v-if="errorReason">{{ errorReason }}</p>
        <p class="mf-body">お手数ですが、担当者までご連絡をお願いいたします。</p>
      </template>

      <!-- フッター -->
      <div class="mf-footer">
        <button class="mf-close-btn" @click="closeWindow">このタブを閉じる</button>
        <span class="mf-footer-text">ご不明な点は担当者までお声掛けください</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* -------- レイアウト -------- */
.mf-connected-root {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #eff6ff 100%);
  padding: 24px 16px;
  font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
}

.mf-connected-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.07),
    0 1px 4px rgba(0, 0, 0, 0.04);
  padding: 48px 40px 40px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  animation: card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* -------- ロゴ -------- */
.mf-logo-area {
  margin-bottom: 32px;
}

.mf-logo-text {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1e293b;
}

.mf-logo-accent {
  color: #16a34a;
}

/* -------- アイコン -------- */
.mf-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  animation: icon-pop 0.5s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes icon-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.mf-icon svg {
  width: 100%;
  height: 100%;
}

/* -------- テキスト -------- */
.mf-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 20px;
  line-height: 1.4;
  animation: fade-up 0.4s 0.3s both;
}

.mf-body {
  font-size: 15px;
  color: #475569;
  line-height: 1.8;
  margin: 0 0 12px;
  animation: fade-up 0.4s 0.35s both;
}

.mf-body--error {
  color: #dc2626;
  font-weight: 600;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* -------- フッター -------- */
.mf-footer {
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
  animation: fade-up 0.4s 0.5s both;
}

.mf-footer-text {
  font-size: 12px;
  color: #94a3b8;
  display: block;
  margin-top: 12px;
}

.mf-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 32px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  width: 100%;
}
.mf-close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* -------- スマホ対応 -------- */
@media (max-width: 480px) {
  .mf-connected-card {
    padding: 36px 24px 32px;
    border-radius: 16px;
  }
  .mf-title {
    font-size: 19px;
  }
}
</style>

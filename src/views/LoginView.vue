<template>
  <div class="login-container">
    <!-- ログインカード（中央） -->
    <div class="login-card">
      <h1 class="login-title">
        <img src="/sugu-suru-logo.png" alt="スグスル" class="login-logo" />
      </h1>

      <!-- エラーメッセージ -->
      <Transition name="shake">
        <div v-if="errorMessage" class="error-banner">
          <i class="fa-solid fa-circle-exclamation"></i>
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- ローディング -->
      <div v-if="isLoading" class="loading-area">
        <div class="loading-spinner"></div>
        <span class="loading-text">認証中...</span>
      </div>

      <!-- ログインフォーム -->
      <form v-else @submit.prevent="handleEmailLogin" class="login-form">
        <div class="input-group">
          <div class="input-icon"><i class="fa-solid fa-envelope"></i></div>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="UI_MSG.メールアドレス入力"
            required
            autocomplete="email"
          />
        </div>

        <div class="input-group">
          <div class="input-icon"><i class="fa-solid fa-lock"></i></div>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="UI_MSG.パスワード入力"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <span>ログイン</span>
          <i class="fa-solid fa-arrow-right btn-login-arrow"></i>
        </button>
      </form>

      <!-- 区切り線 -->
      <div class="divider">
        <span>または</span>
      </div>

      <!-- Googleログインボタン -->
      <button
        @click="handleGoogleLogin"
        class="btn-google"
        :disabled="isLoading"
      >
        <i class="fab fa-google"></i>
        Googleでログイン
      </button>

      <!-- フッター -->
      <div class="login-footer">
        <i class="fa-solid fa-shield-halved"></i>
        安全な接続で保護されています
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmail, signInWithGoogle } from '@/utils/auth';
import { UI_MSG } from '@/constants/uiMessages';

const router = useRouter();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

/**
 * メール/パスワードでログイン
 */
async function handleEmailLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = UI_MSG.ログイン入力必須;
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    await signInWithEmail(email.value, password.value);
    router.push('/');
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : UI_MSG.ログイン失敗;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Googleアカウントでログイン
 */
async function handleGoogleLogin() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await signInWithGoogle();
    router.push('/');
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : UI_MSG.Googleログイン失敗;
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* ===== ページ全体（イラスト全体背景） ===== */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #faf8f5;
  background-image: url('/login-bg.png');
  background-size: 50% auto;
  background-position: left bottom;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  font-family: 'Noto Sans JP', 'Inter', system-ui, sans-serif;
}

/* 画像の右端→背景色へのフェードオーバーレイ */
.login-container::before {
  content: '';
  position: absolute;
  left: 25%;
  top: 0;
  width: 35%;
  height: 100%;
  background: linear-gradient(to right, transparent 0%, #faf8f5 100%);
  z-index: 0;
  pointer-events: none;
}

/* 画像の上端→背景色へのフェードオーバーレイ */
.login-container::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  height: 40%;
  background: linear-gradient(to bottom, #faf8f5 0%, transparent 100%);
  z-index: 0;
  pointer-events: none;
}

/* ===== カード（中央配置） ===== */
.login-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 2.5rem 2.25rem 2rem;
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.6);
  width: 100%;
  max-width: 400px;
  animation: card-appear 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes card-appear {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ===== ロゴ ===== */
.login-title {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  height: 40px;
  width: auto;
  display: inline-block;
}

/* ===== エラー ===== */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
}

.error-banner i {
  color: #ef4444;
  font-size: 16px;
  flex-shrink: 0;
}

.shake-enter-active {
  animation: shake 0.4s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* ===== ローディング ===== */
.loading-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 36px 0;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 2px;
}

/* ===== 入力フィールド ===== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 0;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #cbd5e1;
  font-size: 14px;
  pointer-events: none;
  transition: color 0.3s;
  z-index: 1;
}

.input-group:focus-within .input-icon {
  color: #f59e0b;
}

.input-group input {
  width: 100%;
  padding: 13px 16px 13px 42px;
  background: #faf8f5;
  border: 2px solid #e8e4de;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.input-group input::placeholder {
  color: #94a3b8;
}

.input-group input:focus {
  outline: none;
  border-color: #f59e0b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

/* ===== ログインボタン ===== */
.btn-login {
  position: relative;
  width: 100%;
  padding: 13px;
  margin-top: 4px;
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  letter-spacing: 1px;
}

.btn-login::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.btn-login:hover:not(:disabled)::before {
  transform: translateX(100%);
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-login-arrow {
  font-size: 12px;
  transition: transform 0.3s;
}

.btn-login:hover:not(:disabled) .btn-login-arrow {
  transform: translateX(4px);
}

/* ===== 区切り線 ===== */
.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e8e4de, transparent);
}

.divider span {
  position: relative;
  background: white;
  padding: 0 16px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
}

/* ===== Googleボタン ===== */
.btn-google {
  width: 100%;
  padding: 13px;
  background: #faf8f5;
  color: #334155;
  border: 2px solid #e8e4de;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-google:hover:not(:disabled) {
  background: #fff;
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.btn-google:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-google:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-google i {
  font-size: 16px;
  background: linear-gradient(135deg, #ea4335, #fbbc05, #34a853, #4285f4);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ===== フッター ===== */
.login-footer {
  text-align: center;
  margin-top: 24px;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.login-footer i {
  font-size: 12px;
  color: #f59e0b;
}

/* ===== レスポンシブ ===== */
@media (max-width: 480px) {
  .login-card {
    margin: 0 16px;
    padding: 2rem 1.5rem 1.5rem;
  }
}
</style>

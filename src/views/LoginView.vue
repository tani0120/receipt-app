<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">AI会計システム</h1>
      <p class="login-subtitle">ログイン</p>

      <!-- エラーメッセージ -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- ローディング -->
      <div v-if="isLoading" class="loading-message">
        ログイン中...
      </div>

      <!-- ログインフォーム -->
      <form v-else @submit.prevent="handleEmailLogin" class="login-form">
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@sugu-suru.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="パスワードを入力"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          ログイン
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmail, signInWithGoogle } from '@/utils/auth';

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
    errorMessage.value = 'メールアドレスとパスワードを入力してください';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;

  try {
    await signInWithEmail(email.value, password.value);
    // ログイン成功後、ホーム画面にリダイレクト
    router.push('/');
  } catch (error: any) {
    errorMessage.value = error.message || 'ログインに失敗しました';
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
    // ログイン成功後、ホーム画面にリダイレクト
    router.push('/');
  } catch (error: any) {
    errorMessage.value = error.message || 'Googleログインに失敗しました';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
}

.login-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.login-subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #fcc;
}

.loading-message {
  text-align: center;
  padding: 2rem;
  color: #667eea;
  font-size: 1.1rem;
}

.login-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-login {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 1rem;
  color: #999;
}

.btn-google {
  width: 100%;
  padding: 0.875rem;
  background: white;
  color: #333;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-google:hover:not(:disabled) {
  border-color: #667eea;
  background: #f8f9ff;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google i {
  font-size: 1.2rem;
}
</style>

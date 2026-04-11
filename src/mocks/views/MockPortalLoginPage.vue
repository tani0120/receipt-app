<template>
  <div class="login-page" style="font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif">

    <!-- ポータル共通ヘッダー（ログインはバッジなし） -->
    <PortalHeader />

    <main class="login-main">

      <!-- サインインカード -->
      <div class="login-card">
        <h2 class="card-title">サインイン</h2>

        <!-- ソーシャルログイン -->
        <div class="social-btns">
          <button class="social-btn" @click="handleSocialLogin('google')">
            <svg class="social-svg" viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Googleでログイン</span>
          </button>
        </div>

        <!-- 区切り線 -->
        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">または</span>
          <span class="divider-line"></span>
        </div>

        <!-- メール+パスワード -->
        <form class="email-form" @submit.prevent="handleEmailLogin">
          <div class="input-group">
            <label class="input-label">電子メールアドレス</label>
            <input
              v-model="email"
              type="email"
              class="input-field"
              placeholder="メールアドレスを入力してください"
              autocomplete="email"
            />
          </div>
          <div class="input-group">
            <label class="input-label">パスワード</label>
            <div class="password-wrap">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input-field"
                placeholder="パスワードを入力してください"
                autocomplete="current-password"
              />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <!-- パスワードリセットリンク -->
          <div class="forgot-row">
            <button type="button" class="forgot-link" @click="showResetModal = true">
              パスワードをお忘れの方
            </button>
          </div>

          <button type="submit" class="submit-btn" :disabled="!canSubmit">
            サインイン
          </button>
        </form>
      </div>

      <!-- フッター -->
      <p class="login-footer">© sugu-suru</p>
    </main>

    <!-- パスワードリセットモーダル -->
    <transition name="modal">
      <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
        <div class="modal-card">
          <h3 class="modal-title">パスワードリセット</h3>
          <p class="modal-desc">登録済みのメールアドレスにリセットリンクを送信します。</p>
          <div class="input-group">
            <input
              v-model="resetEmail"
              type="email"
              class="input-field"
              placeholder="メールアドレス"
            />
          </div>
          <div class="modal-actions">
            <button class="modal-cancel" @click="showResetModal = false">キャンセル</button>
            <button class="modal-send" @click="handleReset">送信</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalHeader from '@/mocks/components/PortalHeader.vue'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const showResetModal = ref(false)
const resetEmail = ref('')

const canSubmit = computed(() => email.value.length > 0 && password.value.length > 0)

const navigateToPortal = () => {
  router.push(`/guest/${clientId}`)
}

const handleEmailLogin = () => {
  navigateToPortal()
}

const handleSocialLogin = (_provider: string) => {
  navigateToPortal()
}

const handleReset = () => {
  // Supabase Auth の resetPasswordForEmail() で実装予定
  alert('リセットリンクを送信しました（モック）')
  showResetModal.value = false
}
</script>

<style scoped>
/* ===== ページ全体 ===== */
.login-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== メイン ===== */
.login-main {
  width: 100%;
  max-width: 400px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ===== 左上ロゴ ===== */
.top-logo {
  position: absolute;
  top: 20px; left: 24px;
  z-index: 10;
}
.brand-logo {
  height: 32px;
  object-fit: contain;
  opacity: 0.85;
}

/* ===== サインインカード ===== */
.login-card {
  width: 100%;
}
.card-title {
  font-size: 24px; font-weight: 900; color: #1e293b;
  margin: 0 0 28px; text-align: center;
  letter-spacing: -0.01em;
}

/* ソーシャルボタン */
.social-btns {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 24px;
}
.social-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 12px 16px; border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 14px; font-weight: 600; color: #1e293b;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.social-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.social-svg {
  flex-shrink: 0;
}

/* 区切り */
.divider {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 24px;
}
.divider-line {
  flex: 1; height: 1px;
  background: #e2e8f0;
}
.divider-text {
  font-size: 12px; color: #94a3b8; font-weight: 500;
  white-space: nowrap;
}

/* フォーム */
.input-group {
  margin-bottom: 16px;
}
.input-label {
  display: block;
  font-size: 13px; font-weight: 600; color: #334155;
  margin-bottom: 6px;
}
.input-field {
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1e293b;
  font-size: 14px; font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.input-field::placeholder { color: #94a3b8; }
.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.password-wrap {
  position: relative;
}
.password-wrap .input-field {
  padding-right: 44px;
}
.eye-btn {
  position: absolute; right: 8px; top: 50%;
  transform: translateY(-50%);
  padding: 4px; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}
.eye-btn:hover { background: #f1f5f9; }

/* パスワードお忘れ */
.forgot-row {
  text-align: right;
  margin-bottom: 20px;
  margin-top: -8px;
}
.forgot-link {
  padding: 0; border: none;
  background: none;
  font-size: 12px; color: #3b82f6;
  cursor: pointer; font-family: inherit;
  font-weight: 500;
  transition: color 0.2s;
}
.forgot-link:hover { color: #2563eb; text-decoration: underline; }

/* サインインボタン */
.submit-btn {
  width: 100%;
  padding: 13px;
  border-radius: 8px; border: none;
  background: #1e293b;
  color: #fff;
  font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s ease;
}
.submit-btn:hover {
  background: #334155;
}
.submit-btn:active { transform: scale(0.99); }
.submit-btn:disabled {
  opacity: 0.35; cursor: not-allowed;
}

/* フッター */
.login-footer {
  margin-top: 40px;
  font-size: 11px; color: #cbd5e1;
  text-align: center;
}

/* ===== モーダル ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  max-width: 400px; width: 100%;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
}
.modal-title {
  font-size: 18px; font-weight: 800; color: #1e293b;
  margin: 0 0 6px;
}
.modal-desc {
  font-size: 13px; color: #64748b;
  margin: 0 0 16px; line-height: 1.6;
}
.modal-actions {
  display: flex; gap: 10px; margin-top: 16px;
}
.modal-cancel {
  flex: 1; padding: 10px;
  border-radius: 8px; border: 1px solid #e2e8f0;
  background: #fff; color: #64748b;
  font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  transition: background 0.2s;
}
.modal-cancel:hover { background: #f8fafc; }
.modal-send {
  flex: 1; padding: 10px;
  border-radius: 8px; border: none;
  background: #3b82f6; color: #fff;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: background 0.2s;
}
.modal-send:hover { background: #2563eb; }

/* トランジション */
.modal-enter-active,
.modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card,
.modal-leave-to .modal-card { transform: scale(0.95) translateY(10px); }
</style>

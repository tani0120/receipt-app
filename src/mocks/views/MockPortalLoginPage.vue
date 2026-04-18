<template>
  <div class="login-page">
    <PortalHeader :clientName="clientName" />

    <main class="login-main">

      <!-- ===== ヒーロー ===== -->
      <div class="hero">
        <h1 class="hero-title">資料共有をはじめる</h1>
        <p class="hero-sub">ご利用方法に合わせて、かんたんにセットアップできます</p>
      </div>

      <!-- ===== STEP 1: 共有方法を選ぶ ===== -->
      <section class="step-section">
        <div class="step-badge">STEP 1</div>
        <h2 class="step-title">共有方法を選ぶ</h2>

        <div class="method-cards">
          <button
            class="method-card"
            :class="{ 'method-card--active': shareMethod === 'pc' }"
            @click="selectShare('pc')"
          >
            <span class="method-icon">🖥️</span>
            <span class="method-label">パソコンのみ</span>
            <span class="method-radio"><span v-if="shareMethod === 'pc'" class="method-radio-dot"></span></span>
          </button>

          <p class="method-recommend-label">⭐ おすすめ</p>
          <button
            class="method-card method-card--recommend"
            :class="{ 'method-card--active': shareMethod === 'smartphone' }"
            @click="selectShare('smartphone')"
          >
            <span class="method-icon">📱</span>
            <span class="method-label">スマホも使う</span>
            <span class="method-radio"><span v-if="shareMethod === 'smartphone'" class="method-radio-dot"></span></span>
            <span class="method-sub">※ パソコンとスマホ両方から資料共有ができます</span>
          </button>
        </div>
      </section>

      <!-- ================================================================ -->
      <!--  パソコンのみ: メール認証（ログイン / 新規登録 切替）              -->
      <!-- ================================================================ -->
      <template v-if="shareMethod === 'pc'">
        <section class="step-section">
          <div class="step-badge">STEP 2</div>
          <h2 class="step-title">{{ isRegister ? 'アカウントを作成' : 'メールアドレスでログイン' }}</h2>
          <div class="form-card">
            <form @submit.prevent="isRegister ? handleEmailRegister() : handleEmailLogin()">
              <!-- 新規登録時のみ: 名前フィールド -->
              <div v-if="isRegister" class="input-group">
                <label class="input-label">お名前</label>
                <input v-model="displayName" type="text" class="input-field" placeholder="例: 田中太郎" autocomplete="name" />
              </div>
              <div class="input-group">
                <label class="input-label">メールアドレス</label>
                <input v-model="email" type="email" class="input-field" placeholder="例: info@example.co.jp" autocomplete="email" />
              </div>
              <div class="input-group">
                <label class="input-label">パスワード</label>
                <div class="pw-wrap">
                  <input v-model="password" :type="showPw ? 'text' : 'password'" class="input-field" :placeholder="isRegister ? '8文字以上で設定' : 'パスワードを入力'" :autocomplete="isRegister ? 'new-password' : 'current-password'" />
                  <button type="button" class="pw-toggle" @click="showPw = !showPw">{{ showPw ? '🙈' : '👁️' }}</button>
                </div>
              </div>
              <!-- 新規登録時のみ: パスワード確認 -->
              <div v-if="isRegister" class="input-group">
                <label class="input-label">パスワード（確認）</label>
                <div class="pw-wrap">
                  <input v-model="passwordConfirm" :type="showPw ? 'text' : 'password'" class="input-field" placeholder="もう一度入力" autocomplete="new-password" />
                </div>
                <p v-if="passwordConfirm && password !== passwordConfirm" class="field-error">パスワードが一致しません</p>
              </div>
              <button type="submit" class="submit-btn" :disabled="!canSubmit">
                {{ isRegister ? 'アカウントを作成' : 'ログイン' }}
              </button>
            </form>
            <p class="form-hint">※ Googleアカウントは不要です。メールとパスワードだけでOK</p>
            <div class="form-switch">
              <template v-if="isRegister">
                すでにアカウントをお持ちの方は
                <button class="switch-btn" @click="isRegister = false">ログイン</button>
              </template>
              <template v-else>
                はじめての方は
                <button class="switch-btn" @click="isRegister = true">アカウントを作成</button>
              </template>
            </div>
          </div>
        </section>

        <section class="done-section">
          <p class="done-icon">🎉</p>
          <h2 class="done-title">パソコンで資料共有OK！</h2>
          <p class="done-desc">ログイン後の資料共有ページを<strong>ブックマークに登録</strong>すると、<br>次回からすぐにアクセスできます。</p>
        </section>
      </template>

      <!-- ================================================================ -->
      <!--  スマホも使う: スマホ種類を選択                                    -->
      <!-- ================================================================ -->
      <template v-if="shareMethod === 'smartphone'">

        <!-- STEP 2: スマホの種類 -->
        <section class="step-section">
          <div class="step-badge">STEP 2</div>
          <h2 class="step-title">お使いのスマホを選ぶ</h2>

          <div class="method-cards">
            <button
              class="method-card"
              :class="{ 'method-card--active': phoneType === 'android' }"
              @click="phoneType = 'android'"
            >
              <span class="method-icon">🤖</span>
              <span class="method-label">Android</span>
              <span class="method-radio"><span v-if="phoneType === 'android'" class="method-radio-dot"></span></span>
              <span class="method-sub">Galaxy / Xperia / Pixel / AQUOS など</span>
            </button>

            <button
              class="method-card"
              :class="{ 'method-card--active': phoneType === 'iphone' }"
              @click="phoneType = 'iphone'"
            >
              <span class="method-icon">🍎</span>
              <span class="method-label">iPhone / iPad</span>
              <span class="method-radio"><span v-if="phoneType === 'iphone'" class="method-radio-dot"></span></span>
            </button>
          </div>
        </section>

        <!-- ============================================================ -->
        <!--  Android フロー（超シンプル: ログインだけ）                     -->
        <!-- ============================================================ -->
        <template v-if="phoneType === 'android'">
          <section class="step-section">
            <div class="step-badge">STEP 3</div>
            <h2 class="step-title">Googleアカウントでログイン</h2>
            <p class="step-note">Androidスマホをお使いの方は、Googleアカウントとドライブアプリをすでにお持ちです。<br>下のボタンを押すだけで完了します。</p>
            <div class="google-card">
              <button class="google-btn" @click="handleGoogleLogin">
                <svg class="google-svg" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Googleでログイン</span>
              </button>
            </div>
          </section>

          <section class="done-section">
            <p class="done-icon">🎉</p>
            <h2 class="done-title">パソコンとスマホで資料共有OK！</h2>
            <p class="done-desc">
              パソコン: ログイン後の資料共有ページをブックマークに登録。<br>
              スマホ: Googleドライブアプリの共有フォルダから写真をアップロード。
            </p>
          </section>
        </template>

        <!-- ============================================================ -->
        <!--  iPhone フロー（アカウント作成案内 + ドライブDL）               -->
        <!-- ============================================================ -->
        <template v-if="phoneType === 'iphone'">

          <!-- STEP 3: Googleアカウントでログイン -->
          <section class="step-section">
            <div class="step-badge">STEP 3</div>
            <h2 class="step-title">Googleアカウントでログイン</h2>

            <div class="google-card">
              <button class="google-btn" @click="handleGoogleLogin">
                <svg class="google-svg" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Googleでログイン</span>
              </button>
            </div>

            <!-- アカウント作成案内 -->
            <details class="accordion">
              <summary class="accordion-summary">
                <span class="accordion-icon">🔑</span>
                Googleアカウントをお持ちでない方はこちら
                <span class="accordion-arrow">▼</span>
              </summary>
              <div class="accordion-body">
                <p class="accordion-lead"><strong>無料で作成OK！</strong>会社・個人メール何でもOK！</p>
                <ol class="accordion-steps">
                  <li><a href="https://accounts.google.com/signup" target="_blank" rel="noopener" class="accordion-link">アカウント作成ページ ↗</a> を開く</li>
                  <li>名前を入力<span class="accordion-note">（個人名でもOK）</span></li>
                  <li>生年月日を入力</li>
                  <li>ログイン方法を選択<br><span class="accordion-note">→ お好きなGmailを作成 or 既存のメールアドレスを入力</span></li>
                  <li>あとは画面に従って入力するだけ！</li>
                  <li>このページに戻り「Googleでログイン」を押す</li>
                </ol>
              </div>
            </details>
          </section>

          <!-- STEP 4: ドライブアプリ -->
          <section class="step-section">
            <div class="step-badge">STEP 4</div>
            <h2 class="step-title">Googleドライブアプリをダウンロード</h2>
            <p class="step-note">iPhoneにはGoogleドライブアプリが入っていないため、<br>App Storeからダウンロードしてください。</p>

            <a href="https://apps.apple.com/jp/app/google-drive/id507874739" target="_blank" rel="noopener" class="app-badge">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div class="app-badge-text">
                <span class="app-badge-sub">App Store</span>
                <span class="app-badge-main">iPhone / iPad</span>
              </div>
            </a>
            <div class="return-note">
              <span class="return-note-icon">☝️</span>
              <p class="return-note-text">ダウンロードが完了したら、<br><strong>STEP 3の「Googleでログイン」ボタン</strong>を押してログインしてください。</p>
            </div>
          </section>

          <!-- 完了 -->
          <section class="done-section">
            <p class="done-icon">🎉</p>
            <h2 class="done-title">パソコンとスマホで資料共有OK！</h2>
            <p class="done-desc">
              パソコン: ログイン後の資料共有ページをブックマークに登録。<br>
              スマホ: Googleドライブアプリの共有フォルダから写真をアップロード。
            </p>
          </section>
        </template>
      </template>

      <p class="login-footer">© sugu-suru</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalHeader from '@/mocks/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const { clients } = useClients()
const clientName = clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId

/* STEP 1: パソコンのみ or スマホも使う */
type ShareMethod = 'pc' | 'smartphone'
const shareMethod = ref<ShareMethod | null>('smartphone')

/* STEP 2（スマホも使う時）: Android or iPhone */
type PhoneType = 'android' | 'iphone'
const phoneType = ref<PhoneType | null>(null)

const selectShare = (method: ShareMethod) => {
  shareMethod.value = method
  phoneType.value = null
  isRegister.value = false
}

/* メール認証（パソコンのみ）: ログイン / 新規登録 切替 */
const isRegister = ref(false)
const displayName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPw = ref(false)

const canSubmit = computed(() => {
  if (!email.value || !password.value) return false
  if (isRegister.value) {
    return displayName.value.length > 0
      && password.value.length >= 8
      && password.value === passwordConfirm.value
  }
  return true
})

/** ログイン後の共通処理: 共有方法をlocalStorageに保存して遷移 */
const completeLogin = () => {
  localStorage.setItem(`guest_share_${clientId}`, shareMethod.value ?? 'pc')
  router.push(`/guest/${clientId}`)
}

const handleEmailLogin = () => {
  // Supabase Auth の signInWithPassword() で実装予定
  completeLogin()
}

const handleEmailRegister = () => {
  // Supabase Auth の signUp() で実装予定
  completeLogin()
}

/* Google認証（スマホも使う） */
const handleGoogleLogin = () => {
  // Supabase Auth の signInWithOAuth({ provider: 'google' }) で実装予定
  // 成功後に grantFolderPermission() でDrive権限を付与
  completeLogin()
}
</script>

<style scoped>
/* ===== ページ全体 ===== */
.login-page {
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 30%, #f5f3ff 70%, #fef3f2 100%);
  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
}
.login-main {
  max-width: 640px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 32px) clamp(16px, 4vw, 24px) 48px;
}

/* ===== ヒーロー ===== */
.hero { text-align: center; margin-bottom: 32px; }
.hero-title {
  font-size: clamp(22px, 5vw, 28px);
  font-weight: 900; color: #1e293b; margin: 0 0 8px;
}
.hero-sub {
  font-size: clamp(13px, 3vw, 15px);
  color: #64748b; margin: 0; line-height: 1.6;
}

/* ===== STEPセクション ===== */
.step-section { margin-bottom: 28px; }
.step-badge {
  display: inline-block;
  padding: 4px 14px; border-radius: 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 12px; font-weight: 800;
  letter-spacing: 0.05em; margin-bottom: 8px;
}
.step-title {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: 800; color: #1e293b; margin: 0 0 12px;
}
.step-note {
  font-size: 13px; color: #64748b; line-height: 1.6;
  margin: 0 0 14px;
}

/* ===== 選択カード ===== */
.method-cards {
  display: flex; flex-direction: column; gap: 10px;
}
.method-recommend-label {
  margin: 4px 0 2px 4px;
  font-size: 13px; font-weight: 800; color: #d97706;
}
.method-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 4px 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #fff;
  cursor: pointer; font-family: inherit; text-align: left;
  transition: all 0.2s ease;
}
.method-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 8px rgba(99,102,241,0.1);
}
.method-card--active {
  border-color: #6366f1; background: #f5f3ff;
  box-shadow: 0 2px 10px rgba(99,102,241,0.15);
}
.method-card--recommend { border-color: #fbbf24; }
.method-card--recommend.method-card--active { border-color: #6366f1; }
.method-icon { grid-column: 1; grid-row: 1; font-size: 22px; }
.method-label {
  grid-column: 2; grid-row: 1;
  font-size: 15px; font-weight: 700; color: #1e293b;
}
.method-radio {
  grid-column: 3; grid-row: 1;
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s;
}
.method-card--active .method-radio { border-color: #6366f1; }
.method-radio-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #6366f1; animation: popIn 0.2s ease;
}
@keyframes popIn { 0% { transform: scale(0); } 100% { transform: scale(1); } }
.method-sub {
  grid-column: 2 / 4;
  font-size: 11px; color: #64748b; line-height: 1.4;
}

/* ===== メール認証フォーム ===== */
.form-card {
  background: #fff; border-radius: 16px;
  padding: clamp(18px, 4vw, 24px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.input-group { margin-bottom: 14px; }
.input-label {
  display: block; font-size: 13px; font-weight: 700;
  color: #334155; margin-bottom: 6px;
}
.input-field {
  width: 100%; padding: 11px 14px;
  border-radius: 10px; border: 1px solid #e2e8f0;
  background: #fff; color: #1e293b;
  font-size: 14px; font-family: inherit;
  outline: none; box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-field::placeholder { color: #94a3b8; }
.input-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.pw-wrap { position: relative; }
.pw-wrap .input-field { padding-right: 44px; }
.pw-toggle {
  position: absolute; right: 8px; top: 50%;
  transform: translateY(-50%);
  padding: 4px; border: none;
  background: transparent; cursor: pointer;
  font-size: 16px; line-height: 1;
}
.field-error {
  margin: 4px 0 0; font-size: 12px; color: #ef4444; font-weight: 600;
}
.submit-btn {
  width: 100%; padding: 12px;
  border-radius: 10px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s ease; margin-top: 4px;
}
.submit-btn:hover { box-shadow: 0 4px 14px rgba(99,102,241,0.3); }
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.form-hint {
  margin: 14px 0 0; font-size: 12px;
  color: #64748b; text-align: center;
}
.form-switch {
  margin-top: 12px; text-align: center;
  font-size: 13px; color: #64748b;
}
.switch-btn {
  background: none; border: none; padding: 0;
  color: #6366f1; font-weight: 700; font-size: 13px;
  cursor: pointer; text-decoration: underline;
  font-family: inherit;
}

/* ===== Google認証 ===== */
.google-card {
  background: #fff; border-radius: 16px;
  padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  text-align: center; margin-bottom: 14px;
}
.google-btn {
  display: inline-flex; align-items: center;
  gap: 12px; padding: 14px 36px;
  border-radius: 12px; border: 2px solid #e2e8f0;
  background: #fff; font-size: 16px;
  font-weight: 700; color: #1e293b;
  cursor: pointer; font-family: inherit;
  transition: all 0.25s ease;
}
.google-btn:hover {
  border-color: #4285F4;
  box-shadow: 0 4px 16px rgba(66,133,244,0.2);
  transform: translateY(-1px);
}
.google-svg { flex-shrink: 0; }

/* ===== アコーディオン ===== */
.accordion {
  background: #fff; border-radius: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  overflow: hidden;
}
.accordion-summary {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 18px;
  font-size: 14px; font-weight: 700; color: #475569;
  cursor: pointer; list-style: none;
  transition: background 0.2s;
}
.accordion-summary::-webkit-details-marker { display: none; }
.accordion-summary:hover { background: #f8fafc; }
.accordion-icon { font-size: 18px; }
.accordion-arrow {
  margin-left: auto; font-size: 10px; color: #94a3b8;
  transition: transform 0.2s;
}
details[open] .accordion-arrow { transform: rotate(180deg); }
.accordion-body { padding: 0 18px 18px; }
.accordion-lead {
  font-size: 13px; color: #7c3aed; font-weight: 700;
  margin: 0 0 10px;
}
.accordion-steps { margin: 0; padding: 0 0 0 20px; }
.accordion-steps li {
  font-size: 13px; color: #475569;
  line-height: 1.8; margin-bottom: 4px;
}
.accordion-link {
  color: #7c3aed; font-weight: 700;
  text-decoration: none; border-bottom: 1px dashed #7c3aed;
}
.accordion-note { font-size: 12px; color: #8b5cf6; font-weight: 500; }

/* ===== アプリバッジ ===== */
.app-badge {
  display: inline-flex; align-items: center;
  gap: 10px; padding: 12px 20px;
  border-radius: 12px; text-decoration: none;
  color: #fff; background: #1e293b;
  transition: all 0.2s ease;
}
.app-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.app-badge-text { display: flex; flex-direction: column; }
.app-badge-sub { font-size: 10px; opacity: 0.8; }
.app-badge-main { font-size: 14px; font-weight: 700; }

/* ===== STEP戻り案内 ===== */
.return-note {
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 14px; padding: 12px 16px;
  background: #fef3c7; border: 1px solid #fcd34d;
  border-radius: 10px;
}
.return-note-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.return-note-text {
  font-size: 13px; color: #92400e; line-height: 1.6; margin: 0;
}

/* ===== 完了セクション ===== */
.done-section {
  background: #f0fdf4; border: 2px solid #bbf7d0;
  border-radius: 16px; padding: 24px;
  text-align: center; margin-bottom: 28px;
}
.done-icon { font-size: 32px; margin: 0 0 8px; }
.done-title {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: 800; color: #16a34a; margin: 0 0 10px;
}
.done-desc {
  font-size: 13px; color: #475569;
  margin: 0; line-height: 1.7;
}

/* ===== フッター ===== */
.login-footer {
  margin-top: 32px; font-size: 11px;
  color: #cbd5e1; text-align: center;
}
</style>

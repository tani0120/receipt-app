<template>
  <div class="login-page">
    <PortalHeader :clientName="clientName" />

    <main class="login-main">

      <!-- ===== ヒーロー ===== -->
      <div class="hero">
        <h1 class="hero-title">資料共有をはじめる</h1>
        <p class="hero-sub">スマホでアプリを開いて写真を撮影、またはパソコンからファイルを画面に投げ入れるだけで資料を共有できます。</p>
        <p class="hero-sub">パソコンやスマホ、お好きな方法でお気軽に資料をご共有ください。</p>
      </div>

      <!-- ===== STEP 1: Googleアカウントの準備 ===== -->
      <section class="step-section">
        <div class="step-badge">STEP 1</div>
        <h2 class="step-title">Googleアカウントの準備</h2>

        <!-- 持っている方 -->
        <div class="info-card info-card--ok">
          <h3 class="info-card-title">Googleアカウントをお持ちの方</h3>
          <p class="info-card-desc">Androidスマホの方やGoogleアカウントをお持ちの方はSTEP 2へお進みください。</p>
        </div>

        <!-- 持っていない方 -->
        <details class="accordion">
          <summary class="accordion-summary">
            <span class="accordion-icon">🔑</span>
            Googleアカウントをお持ちでない方はこちら
            <span class="accordion-arrow">▼</span>
          </summary>
          <div class="accordion-body">
            <p class="accordion-lead">アカウント作成は<strong>無料</strong>です。会社・個人メール何でもOK！</p>
            <ol class="accordion-steps">
              <li><a href="https://accounts.google.com/signup" target="_blank" rel="noopener" class="accordion-link">アカウント作成ページ ↗</a> を開く</li>
              <li>名前を入力<span class="accordion-note">（個人名でもOK）</span></li>
              <li>生年月日を入力</li>
              <li>ログイン方法を選択<br><span class="accordion-note">→ お好きなGmailを作成 or 既存のメールアドレスを入力</span></li>
              <li>あとは画面に従って入力するだけ！</li>
            </ol>
            <p class="accordion-footer">アカウント作成後、このページに戻ってSTEP 2へお進みください。</p>
          </div>
        </details>
      </section>

      <!-- ===== STEP 2: Googleアカウントでログイン ===== -->
      <section class="step-section">
        <div class="step-badge">STEP 2</div>
        <h2 class="step-title">Googleアカウントでログイン</h2>
        <p class="step-note">『Googleでログイン』ボタンを押してください。<br>Googleドライブの共有アイテムに貴社専用フォルダが自動で表示されます。</p>

        <!-- 共有停止中：メッセージ表示 -->
        <div v-if="isRevoked" class="revoked-card">
          <span class="revoked-icon">🚫</span>
          <div>
            <p class="revoked-text">現在、共有が停止されています</p>
            <p class="revoked-note">担当者にお問い合わせください。</p>
          </div>
        </div>

        <!-- 未ログイン時：ログインボタン -->
        <div v-else-if="!isLoggedIn" class="google-card">
          <button class="google-btn" @click="handleGoogleLogin">
            <svg class="google-svg" viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Googleでログイン</span>
          </button>
          <p v-if="authError" class="auth-error">{{ authError }}</p>
        </div>

        <!-- ログイン済み：チェック表示 -->
        <div v-else class="login-done-card">
          <span class="login-done-icon">✅</span>
          <div>
            <p class="login-done-text">ログイン完了</p>
            <p class="login-done-email">{{ loggedInEmail }}</p>
          </div>
        </div>

      </section>

      <!-- ===== STEP 3: 利用環境の整備 ===== -->
      <section class="step-section">
        <div class="step-badge">STEP 3</div>
        <h2 class="step-title">利用環境の整備</h2>
        <p class="step-note">スマホやパソコンで資料共有するための利用環境の整備をお願いいたします。</p>

        <!-- スマホ -->
        <div class="usage-block">
          <h2 class="step-title">■ スマホをご利用の場合</h2>
          <div class="device-cards">
            <!-- Android -->
            <div class="device-card">
              <div class="device-header">
                <span class="device-icon">🤖</span>
                <span class="device-name">Androidスマホをお使いの方</span>
              </div>
              <p class="device-desc">Googleドライブのアプリが最初から入っています。<br>追加ダウンロードは不要です。すぐにお使いいただけます。</p>
              <div class="device-status device-status--ok">
                <span>✅</span> 準備完了
              </div>
            </div>

            <!-- iPhone -->
            <div class="device-card">
              <div class="device-header">
                <span class="device-icon">🍎</span>
                <span class="device-name">iPhoneをお使いの方</span>
              </div>
              <p class="device-desc">App Storeからドライブアプリをダウンロードしてください。<span class="accordion-note">（無料です）</span></p>
              <a href="https://apps.apple.com/jp/app/google-drive/id507874739" target="_blank" rel="noopener" class="app-badge">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div class="app-badge-text">
                  <span class="app-badge-sub">App Store</span>
                  <span class="app-badge-main">ダウンロード</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- パソコン -->
        <div class="usage-block">
          <h2 class="step-title">■ パソコンをご利用の場合</h2>
          <p class="usage-desc">SafariやChromeなどのブラウザからドライブURLにアクセスして、そのまま利用できます。<br>アプリのインストールも不要です。Windows・Macともに同じ手順で利用できます。</p>
        </div>
      </section>

      <!-- ===== STEP 4: 資料を共有する ===== -->
      <section class="step-section">
        <div class="step-badge">STEP 4</div>
        <h2 class="step-title">資料を共有する</h2>
        <p class="step-note">STEP 2でログインすると、Googleドライブの「共有アイテム」に貴社専用フォルダが表示されます。<br>そのフォルダに資料を入れるだけで共有完了です。</p>

        <!-- スマホ -->
        <div class="usage-block">
          <h2 class="step-title">■ スマホから共有する</h2>
          <div class="pc-steps">
            <div class="pc-step">
              <span class="pc-step-num">①</span>
              <div>
                <strong>Googleドライブアプリを開く</strong>
                <p class="pc-step-desc">アプリを開き、画面下の「共有アイテム」をタップしてください。貴社専用フォルダが表示されます。</p>
              </div>
            </div>
            <div class="pc-step">
              <span class="pc-step-num">②</span>
              <div>
                <strong>貴社フォルダを開く</strong>
                <p class="pc-step-desc">フォルダをタップして開きます。</p>
              </div>
            </div>
            <div class="pc-step">
              <span class="pc-step-num">③</span>
              <div>
                <strong>＋ボタンから資料を追加</strong>
                <p class="pc-step-desc">画面右下の「＋」ボタンをタップ →「写真と動画をアップロード」または「カメラ」を選んでください。<br>撮影した写真やスマホ内の資料がそのまま共有されます。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- パソコン -->
        <div class="usage-block">
          <h2 class="step-title">■ パソコンから共有する</h2>
          <div class="pc-steps">
            <div class="pc-step">
              <span class="pc-step-num">①</span>
              <div>
                <strong>ブラウザでGoogleドライブを開く</strong>
                <p class="pc-step-desc">SafariやChromeで <a href="https://drive.google.com" target="_blank" rel="noopener" class="accordion-link">drive.google.com ↗</a> を開き、左メニューの「共有アイテム」をクリックしてください。貴社専用フォルダが表示されます。</p>
              </div>
            </div>
            <div class="pc-step">
              <span class="pc-step-num">②</span>
              <div>
                <strong>領収書等の資料を準備する</strong>
                <p class="pc-step-desc">パソコン上の、送りたい資料（領収書や通帳のデータ）が入っているフォルダを開きます。</p>
              </div>
            </div>
            <div class="pc-step">
              <span class="pc-step-num">③</span>
              <div>
                <strong>「ドラッグ＆ドロップ」で入れる</strong><span class="pc-step-fastest">（これが最速！）</span>
                <p class="pc-step-desc">送りたい資料を選択し、ブラウザの画面の中にそのままマウスで引きずって（ドラッグ＆ドロップ）離してください。<br>これだけで、こちらへの共有が完了します！</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== ポータルへ進む ===== -->
      <section v-if="isLoggedIn" class="portal-section">
        <button class="portal-btn" @click="goToPortal">
          <span>ポータルへ進む</span>
          <span class="portal-btn-arrow">→</span>
        </button>
      </section>

      <p class="login-footer">© sugu-suru</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalHeader from '@/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import { useShareStatus } from '@/composables/useShareStatus'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const { clients } = useClients()
const clientName = computed(() => clients.value.find(c => c.clientId === clientId)?.companyName ?? clientId)

/** 認証エラーメッセージ */
const authError = ref('')

/** ログイン済みフラグ（ページ内表示切替用） */
const isLoggedIn = ref(false)
/** ログイン済みメールアドレス */
const loggedInEmail = ref('')
/** 共有停止中フラグ */
const isRevoked = ref(false)

/** 2回目以降のアクセス：localStorageにログイン済みデータがあればポータルへ自動リダイレクト */
onMounted(async () => {
  // 共有ステータスチェック
  const { loadAll, getStatusFromCache } = useShareStatus()
  await loadAll()
  const status = getStatusFromCache(clientId)
  if (status === 'revoked') {
    router.replace('/404')
    return // 共有停止中は404ページにリダイレクト
  }

  const stored = localStorage.getItem(`guest_google_${clientId}`)
  if (stored) {
    router.replace(`/guest/${clientId}`)
  }
})

/** ログイン後の共通処理（遷移せずページ内に留まる） */
const completeLogin = () => {
  authError.value = ''
  isLoggedIn.value = true
  const stored = localStorage.getItem(`guest_google_${clientId}`)
  if (stored) {
    try {
      const data = JSON.parse(stored)
      loggedInEmail.value = data.email || ''
    } catch { /* */ }
  }
}

/** ポータルへ遷移 */
const goToPortal = () => {
  router.push(`/guest/${clientId}`)
}

/* Google認証 — Google Identity Services (GIS) */
interface GoogleCredentialResponse {
  credential: string
  select_by: string
}
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
  }) => void
  prompt: () => void
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

/** JWTペイロードデコード（base64url → JSON） */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  const payload = parts[1]
  if (!payload) throw new Error('不正なJWTトークン')
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

const handleGoogleLogin = () => {
  authError.value = ''
  if (!window.google?.accounts?.id) {
    authError.value = 'Google認証スクリプトが読み込まれていません。ページを再読み込みしてください。'
    return
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response: GoogleCredentialResponse) => {
      try {
        const payload = decodeJwtPayload(response.credential)
        const email = payload.email as string
        console.log('[GoogleLogin] 成功:', email, payload.name)

        // Googleアカウント情報をlocalStorageに保存
        localStorage.setItem(`guest_google_${clientId}`, JSON.stringify({
          email,
          name: payload.name,
          picture: payload.picture,
          sub: payload.sub,
        }))

        // Drive共有フォルダへのアクセス権を自動付与
        const client = clients.value.find(c => c.clientId === clientId)
        const folderId = client?.sharedFolderId
        if (folderId && email) {
          try {
            const res = await fetch('/api/drive/grant-permission', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folderId, email, role: 'writer' }),
            })
            const data = await res.json()
            if (res.ok) {
              console.log('[GoogleLogin] Drive権限付与成功:', data)
            } else {
              console.warn('[GoogleLogin] Drive権限付与失敗:', data.error)
            }
          } catch {
            console.warn('[GoogleLogin] Drive権限付与API接続失敗')
          }
        }

        // sharedEmailをサーバーに永続化（フォルダ再作成時の自動権限付与に必要）
        if (!client?.sharedEmail || client.sharedEmail !== email) {
          try {
            await fetch(`/api/clients/${clientId}/shared-email`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            })
            console.log('[GoogleLogin] sharedEmail保存:', email)
          } catch {
            console.warn('[GoogleLogin] sharedEmail保存失敗')
          }
        }

        completeLogin()
      } catch (err) {
        console.error('[GoogleLogin] JWT解析失敗:', err)
        authError.value = 'Googleログインに失敗しました'
      }
    },
  })
  window.google.accounts.id.prompt()
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
.step-badge--optional {
  background: linear-gradient(135deg, #64748b, #94a3b8);
}
.step-title {
  font-size: clamp(16px, 4vw, 20px);
  font-weight: 800; color: #1e293b; margin: 0 0 12px;
}
.step-note {
  font-size: 13px; color: #64748b; line-height: 1.6;
  margin: 0 0 14px;
}
.step-list {
  margin: 6px 0 16px 8px; padding-left: 4px;
  font-size: 13px; color: #475569; line-height: 1.8;
  list-style: none;
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
.auth-error {
  margin: 10px 0 0; padding: 10px 14px;
  font-size: 13px; font-weight: 600; color: #dc2626;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 8px; text-align: center;
}

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

/* ===== デバイスカード ===== */
.device-cards {
  display: flex; flex-direction: column; gap: 12px;
}
.device-card {
  background: #fff; border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.device-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.device-icon { font-size: 20px; }
.device-name {
  font-size: 15px; font-weight: 700; color: #1e293b;
}
.device-desc {
  font-size: 13px; color: #64748b; line-height: 1.6;
  margin: 0 0 12px;
}
.device-status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 8px;
  font-size: 13px; font-weight: 700;
}
.device-status--ok {
  background: #f0fdf4; color: #16a34a;
  border: 1px solid #bbf7d0;
}

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

/* ===== 情報カード（STEP 1: 持っている方向け） ===== */
.info-card {
  background: #fff; border-radius: 14px;
  padding: 18px 20px; margin-bottom: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.info-card--ok {
  border-left: 4px solid #16a34a;
}
.info-card-title {
  font-size: 14px; font-weight: 700; color: #1e293b;
  margin: 0 0 6px;
}
.info-card-desc {
  font-size: 13px; color: #64748b; line-height: 1.6;
  margin: 0;
}


/* ===== 利用方法ブロック ===== */
.usage-block {
  margin-bottom: 24px;
}

.usage-desc {
  font-size: 13px; color: #64748b; line-height: 1.7;
  margin: 0 0 16px;
}

/* ===== PC手順ステップ ===== */
.pc-steps {
  background: #fff; border-radius: 14px;
  padding: 20px; margin-bottom: 14px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.pc-step {
  display: flex; gap: 12px;
  margin-bottom: 18px;
}
.pc-step:last-child { margin-bottom: 0; }
.pc-step-num {
  flex-shrink: 0;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-radius: 50%;
  font-size: 14px; font-weight: 800;
}
.pc-step strong {
  font-size: 14px; color: #1e293b;
}
.pc-step-desc {
  font-size: 13px; color: #64748b; line-height: 1.6;
  margin: 4px 0 0;
}
.pc-step-fastest {
  font-size: 12px; color: #7c3aed; font-weight: 700;
  margin-left: 4px;
}

/* ===== アコーディオンフッター ===== */
.accordion-footer {
  font-size: 13px; color: #475569; line-height: 1.6;
  margin: 10px 0 0; font-weight: 600;
}

/* ===== ログイン完了カード ===== */
.login-done-card {
  display: flex; align-items: center; gap: 14px;
  background: #f0fdf4; border: 2px solid #bbf7d0;
  border-radius: 16px; padding: 20px 24px;
}
.login-done-icon { font-size: 28px; }
.login-done-text {
  font-size: 16px; font-weight: 800; color: #16a34a;
  margin: 0 0 2px;
}
.login-done-email {
  font-size: 13px; color: #64748b; margin: 0;
}

/* ===== ポータルへ進むボタン ===== */
.portal-section {
  text-align: center; margin-bottom: 28px;
}
.portal-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 48px;
  border-radius: 14px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 18px; font-weight: 800;
  cursor: pointer; font-family: inherit;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(99,102,241,0.3);
}
.portal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(99,102,241,0.4);
}
.portal-btn-arrow {
  font-size: 20px; transition: transform 0.2s;
}
.portal-btn:hover .portal-btn-arrow {
  transform: translateX(4px);
}

/* ===== 共有停止カード ===== */
.revoked-card {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg, #fef2f2, #fff1f2);
  border: 1px solid #fecaca;
  border-radius: 14px; padding: 18px 20px;
  margin-top: 16px;
}
.revoked-icon { font-size: 28px; }
.revoked-text {
  font-size: 15px; font-weight: 700; color: #dc2626;
  margin: 0 0 4px 0;
}
.revoked-note {
  font-size: 13px; color: #991b1b; margin: 0;
}

/* ===== フッター ===== */
.login-footer {
  margin-top: 32px; font-size: 11px;
  color: #cbd5e1; text-align: center;
}
</style>

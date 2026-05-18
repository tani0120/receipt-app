<template>
  <div class="portal-page" style="font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif">

    <!-- ポータル共通ヘッダー -->
    <PortalHeader :clientName="clientName" />

    <main class="portal-main">

      <!-- ===== 初回設定バナー（未連携時のみ表示） ===== -->
      <div v-if="!mfLinked" class="mf-setup-banner">
        <div class="mf-setup-banner-inner">
          <div class="mf-setup-banner-text">
            <span class="mf-setup-badge">初回設定（1回のみ）</span>
            <p class="mf-setup-title">マネーフォワードとの連携設定が必要です</p>
            <p class="mf-setup-desc">連携設定をお願いいたします。一度設定すると次回以降は不要です。</p>
          </div>
          <button class="mf-setup-btn" @click="showMfModal = true">
            設定する
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <!-- ===== 連携済みバッジ（認証済み時のみ表示） ===== -->
      <div v-else class="mf-linked-badge">
        <span class="mf-linked-icon">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
            <circle cx="10" cy="10" r="10" fill="#22c55e" fill-opacity="0.15"/>
            <path d="M6 10.5l3 3 5-5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="mf-linked-label">MF連携済み</span>
      </div>

      <!-- ===== MF連携設定モーダル ===== -->
      <Teleport to="body">
        <div v-if="showMfModal" class="mf-modal-overlay" @click.self="showMfModal = false">
          <div class="mf-modal">
            <div class="mf-modal-header">
              <span class="mf-modal-icon">🔗</span>
              <h2 class="mf-modal-title">マネーフォワードとの連携設定</h2>
            </div>
            <p class="mf-modal-lead">マネーフォワードと当社システムの連携設定をお願いいたします。<br>なお、一度の設定で完了いたしますので、次回以降は認証は不要です。</p>
            <ol class="mf-modal-steps">
              <li class="mf-modal-step">
                <span class="mf-step-num">1</span>
                <div class="mf-step-body">
                  <span class="mf-step-title">マネーフォワードのアカウントを選択</span>
                  <span class="mf-step-note">MFに登録済みのメールアドレスが表示されます</span>
                </div>
              </li>
              <li class="mf-modal-step">
                <span class="mf-step-num">2</span>
                <div class="mf-step-body">
                  <span class="mf-step-title">連携する事業者（貴社名）を選択して「次へ」</span>
                  <span class="mf-step-note">会社名と事業者番号が一覧で表示されます</span>
                </div>
              </li>
              <li class="mf-modal-step">
                <span class="mf-step-num">3</span>
                <div class="mf-step-body">
                  <span class="mf-step-title">権限の確認画面が表示されます</span>
                  <span class="mf-step-note">内容をご確認のうえ「許可する」を押してください（チェック操作は不要です）</span>
                </div>
              </li>
              <li class="mf-modal-step">
                <span class="mf-step-num">4</span>
                <div class="mf-step-body">
                  <span class="mf-step-title">「連携が完了しました」のページが表示されたら完了です</span>
                </div>
              </li>
            </ol>
            <div class="mf-modal-actions">
              <button class="mf-modal-cancel" @click="showMfModal = false">キャンセル</button>
              <button class="mf-modal-go" @click="goToMf">
                マネーフォワードへ進む
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ヒーローセクション -->
      <div class="hero">
        <div class="hero-icon-wrap">
          <span class="hero-icon">📂</span>
          <div class="hero-icon-ring"></div>
        </div>
        <h1 class="hero-title">資料を共有する</h1>
        <p class="hero-sub">パソコンやスマホで撮影して資料を共有できます</p>
      </div>

      <!-- ===== 共有ボタン ===== -->
      <div class="action-cards">
        <!-- パソコンから共有 -->
        <div class="action-card" @click="goUpload()">
          <div class="action-card-inner">
            <div class="action-icon-wrap action-icon--pc">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div class="action-text">
              <span class="action-label">🖥️ パソコンから共有</span>
              <span class="action-hint">ファイルを選択して資料を送付</span>
            </div>
            <div class="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- スマホから共有（共有フォルダがあれば表示） -->
        <a v-if="hasDriveFolder" :href="driveUrl" target="_blank" rel="noopener" class="action-card action-card--drive">
          <div class="action-card-inner">
            <div class="action-icon-wrap action-icon--drive">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M8.01 18.26l2.09 3.62 7.83-4.52-2.09-3.62z" fill="#3B82F6"/>
                <path d="M15.84 13.74H22.5l-7.83-13.56h-6.66z" fill="#F59E0B"/>
                <path d="M1.5 18.26h6.51L15.84.18H8.01z" fill="#22C55E"/>
              </svg>
            </div>
            <div class="action-text">
              <span class="action-label">📱 スマホから共有</span>
              <span class="action-hint">Googleドライブアプリで写真を送付</span>
            </div>
            <div class="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </a>
        <!-- スマホボタン（共有フォルダ未設定時） -->
        <div v-if="!hasDriveFolder" class="action-card action-card--disabled">
          <div class="action-card-inner">
            <div class="action-icon-wrap action-icon--drive" style="opacity: 0.4">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M8.01 18.26l2.09 3.62 7.83-4.52-2.09-3.62z" fill="#3B82F6"/>
                <path d="M15.84 13.74H22.5l-7.83-13.56h-6.66z" fill="#F59E0B"/>
                <path d="M1.5 18.26h6.51L15.84.18H8.01z" fill="#22C55E"/>
              </svg>
            </div>
            <div class="action-text">
              <span class="action-label" style="color: #94a3b8">📱 スマホから共有</span>
              <span class="action-hint" style="color: #ef4444">共有フォルダが未作成のため利用できません。<br>担当スタッフにお問い合わせください。</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 使い方ヒント -->
      <div class="usage-hints">
        <div class="hint-item">
          <span class="hint-icon">⭐</span>
          <span class="hint-text">このページを<strong>ブックマークに登録</strong>すると、次回からすぐにアクセスできます</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">📱</span>
          <span class="hint-text">スマホからはGoogleドライブアプリの共有フォルダから直接アップロードできます</span>
        </div>
      </div>

      <!-- 対応ファイル形式 -->
      <div class="formats-section">
        <p class="formats-label">対応ファイル形式</p>
        <div class="formats-badges">
          <span class="format-badge" v-for="fmt in formats" :key="fmt.label">
            <span class="format-badge-icon">{{ fmt.icon }}</span>
            {{ fmt.label }}
          </span>
        </div>
      </div>

      <!-- 共有のコツ -->
      <div class="tips-section">
        <div class="tips-header">
          <span class="tips-icon">💡</span>
          <h3 class="tips-title">資料を共有するコツ</h3>
        </div>
        <ol class="tips-list">
          <li class="tip-item" v-for="(tip, i) in tips" :key="i">
            <span class="tip-number">{{ i + 1 }}</span>
            <div class="tip-content">
              <span class="tip-text">{{ tip.text }}</span>
              <span v-if="tip.note" class="tip-note">{{ tip.note }}</span>
            </div>
          </li>
        </ol>
        <p class="tips-footer-note">
          ※ PDF、写真、CSV、エクセル、会計ソフトデータなど<br>
          ほぼすべてのファイルに対応しています
        </p>
      </div>

      <!-- フッター -->
      <p class="portal-footer">© sugu-suru</p>
    </main>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PortalHeader from '@/components/PortalHeader.vue'
import { useClients } from '@/features/client-management/composables/useClients'
import { useRoute, useRouter } from 'vue-router'
import { useShareStatus } from '@/composables/useShareStatus'
import { UI_MSG } from '@/constants/uiMessages'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const { clients } = useClients()

/** 共有停止中なら404にリダイレクト */
onMounted(async () => {
  const { loadAll, getStatusFromCache } = useShareStatus()
  await loadAll()
  const status = getStatusFromCache(clientId)
  if (status === 'revoked') {
    router.replace('/404')
  }
})

const client = computed(() => clients.value.find(c => c.clientId === clientId))
const clientName = computed(() => client.value?.companyName ?? clientId)

/* Drive統一: スマホボタンは常時表示（sharedFolderIdの有無で制御） */

/* Drive共有フォルダURL */
const hasDriveFolder = computed(() => !!client.value?.sharedFolderId)
const driveUrl = computed(() => {
  const folderId = client.value?.sharedFolderId
  return folderId ? `https://drive.google.com/drive/folders/${folderId}` : ''
})

const formats = [
  { icon: '📄', label: 'PDF' },
  { icon: '📷', label: UI_MSG.ポータル_写真 },
  { icon: '📊', label: 'CSV' },
  { icon: '📗', label: UI_MSG.ポータル_エクセル },
  { icon: '💰', label: UI_MSG.ポータル_会計ソフト },
]

const tips = [
  { text: UI_MSG.ポータル_注意1, note: UI_MSG.ポータル_注意1補足 },
  { text: UI_MSG.ポータル_注意2, note: UI_MSG.ポータル_注意2補足 },
  { text: UI_MSG.ポータル_注意3, note: null },
]

const goUpload = () => {
  router.push(`/upload/${clientId}/guest`)
}

/** MF連携状態（APIから動的に取得） */
const mfLinked = ref(false)
const showMfModal = ref(false)

// ページ表示時にclientId別の認証状態を取得
onMounted(async () => {
  try {
    const res = await fetch(`/api/mf/auth/status?clientId=${encodeURIComponent(clientId)}`)
    if (res.ok) {
      const data = await res.json() as { authenticated: boolean }
      mfLinked.value = data.authenticated
    }
  } catch {
    // 取得失敗時は未連携とみなす（バナー表示）
  }
})

/**
 * モーダル「マネーフォワードへ進む」ボタン
 * /api/mf/auth/url をclientId付きで呼び出してOAuthフローを開始
 */
const goToMf = async () => {
  showMfModal.value = false
  try {
    const res = await fetch(`/api/mf/auth/url?clientId=${encodeURIComponent(clientId)}`)
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } else {
      alert('認証URLの取得に失敗しました。担当者までお問い合わせください。')
    }
  } catch {
    alert('ネットワークエラーが発生しました。時間をおいて再度お試しください。')
  }
}


</script>

<style scoped>
/* ===== ページ全体 ===== */
.portal-page {
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(160deg, #f0f6ff 0%, #e8f0fe 30%, #f7f4ff 60%, #fef7f0 100%);
  position: relative;
}

/* ===== メイン ===== */
.portal-main {
  max-width: 520px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 24px) clamp(16px, 4vw, 24px) 40px;
}

/* ===== ヒーローセクション ===== */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  margin-bottom: 28px;
}
.hero-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px; height: 64px;
}
.hero-icon {
  font-size: 32px;
  position: relative;
  z-index: 1;
}
.hero-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
  animation: ringPulse 2.5s ease-in-out infinite;
}
@keyframes ringPulse {
  0%,100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
}
.hero-title {
  font-size: clamp(20px, 5vw, 26px);
  font-weight: 900;
  color: #1e293b;
  margin: 0;
}
.hero-sub {
  font-size: clamp(12px, 3vw, 14px);
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* ===== アクションカード ===== */
.action-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.action-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: block;
}
.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(99,102,241,0.15);
}
.action-card--drive:hover {
  box-shadow: 0 6px 24px rgba(34,197,94,0.15);
}
.action-card-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
}
.action-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.action-icon--pc {
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  color: #6366f1;
}
.action-icon--drive {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #16a34a;
}
.action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.action-label {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.action-hint {
  font-size: 12px;
  color: #64748b;
}
.action-arrow {
  color: #94a3b8;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.action-card:hover .action-arrow {
  transform: translateX(3px);
}

/* ===== 使い方ヒント ===== */
.usage-hints {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hint-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.6);
  border-radius: 10px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}
.hint-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

/* ===== 対応ファイル形式 ===== */
.formats-section {
  text-align: center;
  margin-bottom: 24px;
}
.formats-label {
  font-size: 12px; color: #94a3b8; font-weight: 600;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.formats-badges {
  display: flex; flex-wrap: wrap; gap: 6px;
  justify-content: center;
}
.format-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 8px;
  background: rgba(255,255,255,0.7);
  font-size: 12px; color: #475569; font-weight: 500;
  border: 1px solid rgba(0,0,0,0.04);
}
.format-badge-icon { font-size: 13px; }

/* ===== 共有のコツ ===== */
.tips-section {
  background: #fff;
  border-radius: 16px;
  padding: clamp(16px, 4vw, 22px);
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  margin-bottom: 16px;
}
.tips-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
}
.tips-icon { font-size: 20px; }
.tips-title {
  font-size: 15px; font-weight: 800; color: #1e293b; margin: 0;
}
.tips-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.tip-item {
  display: flex; align-items: flex-start; gap: 10px;
}
.tip-number {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.tip-content { display: flex; flex-direction: column; }
.tip-text { font-size: 13px; color: #334155; line-height: 1.5; }
.tip-note { font-size: 11px; color: #94a3b8; margin-top: 1px; }
.tips-footer-note {
  font-size: 11px; color: #94a3b8;
  margin: 12px 0 0; line-height: 1.6; text-align: center;
}

/* ===== 連携済みバッジ ===== */
.mf-linked-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 14px;
  padding: 9px 16px;
  margin-bottom: 16px;
  box-sizing: border-box;
  animation: fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both;
}
.mf-linked-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.mf-linked-label {
  font-size: 13px;
  font-weight: 700;
  color: #16a34a;
  letter-spacing: 0.02em;
}

/* ===== 初回設定バナー ===== */
.mf-setup-banner {
  background: linear-gradient(135deg, #fff7ed, #fef3c7);
  border-radius: 14px;
  border: 1.5px solid #fcd34d;
  margin-bottom: 20px;
  overflow: hidden;
  animation: fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mf-setup-banner-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}
.mf-setup-banner-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mf-setup-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: fit-content;
  margin-bottom: 3px;
}
.mf-setup-title {
  font-size: 13px;
  font-weight: 800;
  color: #92400e;
  margin: 0;
  line-height: 1.4;
}
.mf-setup-desc {
  font-size: 11px;
  color: #b45309;
  margin: 0;
  line-height: 1.5;
}
.mf-setup-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 9px 16px;
  border: none;
  border-radius: 8px;
  background: #f59e0b;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}
.mf-setup-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}

/* ===== MF連携モーダル ===== */
.mf-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: overlay-in 0.2s ease;
}
@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.mf-modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  padding: 28px 24px 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  animation: modal-in 0.25s cubic-bezier(0.16,1,0.3,1);
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.mf-modal-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
}
.mf-modal-icon { font-size: 24px; }
.mf-modal-title {
  font-size: 17px; font-weight: 900; color: #1e293b; margin: 0;
}
.mf-modal-lead {
  font-size: 13px; color: #475569; line-height: 1.7;
  margin: 0 0 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.mf-modal-steps {
  list-style: none; margin: 0 0 22px; padding: 0;
  display: flex; flex-direction: column; gap: 14px;
}
.mf-modal-step {
  display: flex; align-items: flex-start; gap: 12px;
}
.mf-step-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff; font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mf-step-body {
  display: flex; flex-direction: column; gap: 2px; padding-top: 2px;
}
.mf-step-title {
  font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.4;
}
.mf-step-note {
  font-size: 11px; color: #64748b; line-height: 1.5;
}
.mf-modal-actions {
  display: flex; gap: 10px; justify-content: flex-end;
}
.mf-modal-cancel {
  padding: 10px 18px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  background: #fff; color: #64748b;
  font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.mf-modal-cancel:hover { background: #f8fafc; }
.mf-modal-go {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  border: none; border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(245,158,11,0.3);
}
.mf-modal-go:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(245,158,11,0.4);
}

/* ===== フッター ===== */
.portal-footer {
  margin-top: 24px;
  font-size: 11px; color: #cbd5e1; text-align: center;
}
</style>

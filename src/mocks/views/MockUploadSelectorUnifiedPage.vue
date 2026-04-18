<template>
  <div class="selector-page" style="font-family: 'Noto Sans JP', sans-serif">

    <!-- ===== 2カラムレイアウト ===== -->
    <main class="two-col">

      <!-- ========== 左カラム: 顧問先招待フロー ========== -->
      <aside class="col-left">

        <!-- ◆共有設定（上段カード） -->
        <div class="share-card">
          <div class="share-header">
            <h2 class="share-title">◆ 共有設定</h2>
            <transition name="badge-fade" mode="out-in">
              <span v-if="currentStatus === 'active'" key="active" class="share-badge share-badge--active">
                <span class="badge-dot badge-dot--green"></span>共有OK
              </span>
              <span v-else-if="currentStatus === 'revoked'" key="revoked" class="share-badge share-badge--revoked">
                <span class="badge-dot badge-dot--red"></span>解除済
              </span>
              <span v-else key="none" class="share-badge share-badge--none">
                <span class="badge-dot badge-dot--gray"></span>未設定
              </span>
            </transition>
          </div>
          <div class="share-segment">
            <div class="share-segment-track">
              <div
                class="share-segment-indicator"
                :class="currentStatus === 'active' ? 'indicator--right' : 'indicator--left'"
              ></div>
              <button
                class="share-seg-btn"
                :class="currentStatus !== 'active' ? 'share-seg--selected' : 'share-seg--dimmed'"
                @click="setStatus('revoked')"
              >共有停止</button>
              <button
                class="share-seg-btn"
                :class="currentStatus === 'active' ? 'share-seg--selected' : 'share-seg--dimmed'"
                @click="setStatus('active')"
              >共有OKにする</button>
            </div>
          </div>
        </div>

        <!-- ◆顧問先への招待（下段カード） -->
        <div class="flow-card">
          <h2 class="col-title">◆ 顧問先への招待（PC・スマホ統合）</h2>

          <!-- ===== 招待フロー ===== -->
          <div class="flow-section">
            <h3 class="flow-heading">【初回（はじめての登録）】</h3>

            <!-- ① 招待リンク発行 -->
            <div class="step">
              <span class="step-num">①</span>
              <div class="step-body">
                <p class="step-title">招待リンクの発行</p>
                <p class="step-note">PC独自システム用 + スマホDrive共有用の両方に対応</p>
                <button class="invite-btn" @click="generateInvite">
                  🔗 招待リンクを発行
                </button>
                <div class="url-box" v-if="inviteUrl">
                  <span class="url-label">招待リンクURL：</span>
                  <div class="url-row">
                    <input class="url-input" :value="inviteUrl" readonly @click="selectAll" />
                    <button class="copy-btn" :class="{ 'copy-btn--copied': copiedKey === 'invite' }" @click="copyText(inviteUrl, 'invite')">
                      <span class="copy-icon" :class="{ 'copy-icon--pop': copiedKey === 'invite' }">📋</span>
                      <span v-if="copiedKey === 'invite'" class="copy-toast">コピー済</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="step-arrow">↓</div>

            <!-- ② 共有 -->
            <div class="step">
              <span class="step-num">②</span>
              <div class="step-body">
                <p class="step-title">招待リンクをチャットワーク等で送付</p>
                <p class="step-note">ChatWork・LINE・メール等で顧問先に送る</p>
              </div>
            </div>
            <div class="step-arrow">↓</div>

            <!-- ③ 顧問先がGoogleでログイン -->
            <div class="step">
              <span class="step-num">③</span>
              <div class="step-body">
                <p class="step-title">顧問先が「Googleでログイン」をタップ</p>
                <div class="google-login-box">
                  <div class="google-login-demo">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Googleでログイン</span>
                  </div>
                  <p class="google-note">
                    ★ メールアドレスの入力は不要。ボタンを押してアカウントを選ぶだけ
                  </p>
                </div>
                <div class="email-info-box">
                  <p class="email-info-title">📧 Gmailがなくても大丈夫！</p>
                  <ul class="email-info-list">
                    <li>会社メール（info@tanaka.co.jp 等）でもOK</li>
                    <li>個人メール（yahoo, outlook 等）でもOK</li>
                    <li>どんなメールでもGoogleアカウントを作成可能</li>
                    <li>Gmailアドレスの取得は不要です</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="step-arrow">↓</div>

            <!-- ④ 自動で全部完了 -->
            <div class="step">
              <span class="step-num">④</span>
              <div class="step-body">
                <p class="step-title">自動で全部完了！</p>
                <div class="auto-list">
                  <div class="auto-item">
                    <span class="auto-check">✅</span>
                    <span>PC独自システム: ログイン完了</span>
                  </div>
                  <div class="auto-item">
                    <span class="auto-check">✅</span>
                    <span>Googleメールアドレス: 自動取得</span>
                  </div>
                  <div class="auto-item">
                    <span class="auto-check">✅</span>
                    <span>共有ドライブ: フォルダ作成 + 権限付与</span>
                  </div>
                  <div class="auto-item">
                    <span class="auto-check">✅</span>
                    <span>顧問先マスタ: 共有用メールを自動記録</span>
                  </div>
                </div>
                <div class="notify-box">
                  <p class="notify-text">
                    📬 登録が完了すると<strong>進捗管理画面</strong>に通知されます
                  </p>
                  <p class="notify-sub">（スタッフ側での追加作業は不要です）</p>
                </div>
              </div>
            </div>
            <div class="step-arrow">↓</div>

            <!-- ⑤ 利用開始 -->
            <div class="step">
              <span class="step-num">⑤</span>
              <div class="step-body">
                <p class="step-title">利用開始</p>
                <div class="usage-cards">
                  <div class="usage-card usage-card--pc">
                    <span class="usage-icon">💻</span>
                    <div>
                      <p class="usage-label">PC</p>
                      <p class="usage-desc">ブックマーク → D&Dアップロード</p>
                    </div>
                  </div>
                  <div class="usage-card usage-card--mobile">
                    <span class="usage-icon">📱</span>
                    <div>
                      <p class="usage-label">スマホ</p>
                      <p class="usage-desc">Googleドライブアプリ → 共有フォルダに写真アップロード</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 2回目以降 ===== -->
          <div class="flow-section flow-repeat">
            <h3 class="flow-heading">【2回目以降】</h3>
            <p class="repeat-text">
              <strong>PC:</strong> ブックマーク or 同じURL → <strong>自動ログイン</strong> → 即使える<br>
              <strong>スマホ:</strong> Googleドライブアプリ → 共有フォルダを開く → 写真アップロード<br>
              <span class="repeat-note">（招待コードは2回目以降不要）</span>
            </p>
          </div>
        </div>
      </aside>

      <!-- ========== 右カラム: アップロードカード ========== -->
      <section class="col-right">

        <!-- 社内用 -->
        <div class="card-section section-staff">
          <div class="card-section-header">
            <span class="section-badge badge-staff">🏢 社内用</span>
            <p class="section-note">スタッフがこの画面から直接アップロード（PC・スマホ自動対応）</p>
          </div>
          <div class="card-row">
            <button class="sel-card card-staff-upload" @click="go(staffPath)">
              <div class="card-icon-area icon-staff-upload"><span>📤</span></div>
              <h3 class="card-label">アップロード</h3>
              <p class="card-sub">PC・スマホ自動判定</p>
            </button>
            <button class="sel-card card-drive-upload" @click="go(drivePath)">
              <div class="card-icon-area icon-drive-upload"><span>📁</span></div>
              <h3 class="card-label">ドライブから取り込み</h3>
              <p class="card-sub">スマホ推奨・メモリ不使用</p>
              <span class="drive-tag">Google Drive</span>
            </button>
          </div>
        </div>

        <!-- 顧問先用 -->
        <div class="card-section section-client">
          <div class="card-section-header">
            <span class="section-badge badge-client">👤 顧問先に共有</span>
            <p class="section-note">カードをクリックでURLコピー</p>
          </div>
          <div class="card-row card-row--triple">
            <div class="sel-card card-client-mobile" @click="copyText(portalLoginUrl, 'portal')">
              <div class="card-icon-area icon-client-mobile"><span>🔗</span></div>
              <h3 class="card-label">顧問先ログインURL</h3>
              <p class="card-sub">PC・スマホ共通</p>
              <span class="copy-tag" :class="{ copied: copiedKey === 'portal' }">
                <span class="copy-icon" :class="{ 'copy-icon--pop': copiedKey === 'portal' }">📋</span>
                {{ copiedKey === 'portal' ? 'コピーしました！' : 'URLをコピー' }}
              </span>
            </div>
            <div class="sel-card card-drive-guest" @click="copyText(driveGuestUrl, 'driveGuest')">
              <div class="card-icon-area icon-drive-guest"><span>📁</span></div>
              <h3 class="card-label">Drive共有フォルダ</h3>
              <p class="card-sub">顧問先スマホ用</p>
              <span class="copy-tag" :class="{ copied: copiedKey === 'driveGuest' }">
                <span class="copy-icon" :class="{ 'copy-icon--pop': copiedKey === 'driveGuest' }">📋</span>
                {{ copiedKey === 'driveGuest' ? 'コピーしました！' : 'URLをコピー' }}
              </span>
            </div>
            <button class="sel-card card-client-pc" @click="go('/guest/' + clientId)">
              <div class="card-icon-area icon-client-pc"><span>👁</span></div>
              <h3 class="card-label">ポータルを確認</h3>
              <p class="card-sub">ログインをスキップ</p>
            </button>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShareStatus } from '@/composables/useShareStatus'
import type { ShareStatus } from '@/repositories/types'

const route = useRoute()
const router = useRouter()
const clientId = route.params.clientId as string

const origin = window.location.origin

// URL群（統合版: PC・スマホ共通）
const staffPath       = `/upload/${clientId}/staff`
const drivePath       = `/drive-upload/${clientId}`
const staffUrl        = `${origin}/#${staffPath}`
const portalLoginUrl  = `${origin}/#/guest/${clientId}/login`
const driveGuestUrl   = `${origin}/#/drive-upload/${clientId}/guest`

// 共有設定（Repository経由）
const { loadAll, updateStatus, saveInviteCode, getStatusFromCache, getInviteCodeFromCache } = useShareStatus()
const currentStatus = ref<ShareStatus | null>(null)

async function refreshStatus() {
  await loadAll()
  currentStatus.value = getStatusFromCache(clientId)
}

onMounted(() => { refreshStatus() })

async function setStatus(status: ShareStatus) {
  await updateStatus(clientId, status)
  currentStatus.value = status
}

// 招待リンク（Repository経由で保存）
const inviteUrl = ref<string | null>(null)
const generateInvite = async () => {
  const code = Math.random().toString(36).slice(2, 8)
  await saveInviteCode(clientId, code)
  inviteUrl.value = `${origin}/#/invite/${code}`
  // 招待リンク発行時、ステータスが未設定ならpendingにする
  if (!currentStatus.value) {
    await setStatus('pending')
  }
}

// ページロード時、保存済みの招待コードがあれば復元
onMounted(async () => {
  await refreshStatus()
  const savedCode = getInviteCodeFromCache(clientId)
  if (savedCode) {
    inviteUrl.value = `${origin}/#/invite/${savedCode}`
  }
})

// コピー
const copiedKey = ref<string | null>(null)
const copyText = async (text: string, key: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { copiedKey.value = null }, 2500)
  } catch {
    window.prompt('URLをコピーしてください:', text)
  }
}

const selectAll = (e: Event) => {
  (e.target as HTMLInputElement).select()
}

const go = (path: string) => {
  router.push(path)
}
// staffUrl は未使用警告回避用（将来利用）
void staffUrl
</script>

<style scoped>
/* ===== ページ ===== */
.selector-page {
  height: 100%;
  overflow-y: auto;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
}

/* ===== 2カラム ===== */
.two-col {
  flex: 1;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 16px 40px;
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
}

/* ===== 左カラム ===== */
.col-left {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.col-title {
  font-size: 15px; font-weight: 800; color: #1e293b;
  margin: 0 0 16px; padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
}

/* フローセクション */
.flow-section { margin-bottom: 20px; }
.flow-heading {
  font-size: 13px; font-weight: 700; color: #334155;
  background: #f8fafc; padding: 6px 10px; border-radius: 8px;
  margin: 0 0 14px;
}

/* ステップ */
.step {
  display: flex; gap: 10px; margin-bottom: 4px;
}
.step-num {
  flex-shrink: 0;
  width: 26px; height: 26px;
  background: none; color: #2563eb;
  font-size: 14px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin-top: 1px;
}
.step-body { flex: 1; min-width: 0; }
.step-title { font-size: 13px; font-weight: 700; color: #1e293b; margin: 3px 0 4px; }
.step-note  { font-size: 11px; color: #64748b; margin: 2px 0 6px; }

.step-arrow {
  text-align: center; color: #cbd5e1;
  font-size: 16px; margin: 2px 0 6px; padding-left: 36px;
}

/* 招待ボタン */
.invite-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-size: 12px; font-weight: 700;
  border: none; cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.invite-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.invite-btn:active { transform: scale(0.97); }

/* URL表示ボックス */
.url-box { margin-top: 8px; }
.url-label { font-size: 10px; color: #64748b; }
.url-row {
  display: flex; gap: 4px; margin-top: 4px;
}
.url-input {
  flex: 1; min-width: 0;
  padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 10px; font-family: monospace; color: #334155;
  background: #f8fafc; outline: none;
}
.url-input:focus { border-color: #93c5fd; }
.copy-btn {
  position: relative;
  padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px;
  cursor: pointer; background: #fff; font-size: 12px;
  transition: all 0.25s ease;
  -webkit-tap-highlight-color: transparent;
  display: inline-flex; align-items: center; gap: 2px;
}
.copy-btn:hover { background: #f0f7ff; }
.copy-btn--copied {
  background: #dcfce7 !important;
  border-color: #86efac !important;
}

/* コピーアイコンのポップアニメーション */
.copy-icon {
  display: inline-block;
  transition: transform 0.15s ease;
}
.copy-icon--pop {
  animation: copyPop 0.45s ease;
}
@keyframes copyPop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.45) rotate(-8deg); }
  50%  { transform: scale(0.9) rotate(4deg); }
  70%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* コピー完了トースト */
.copy-toast {
  font-size: 9px;
  font-weight: 700;
  color: #166534;
  white-space: nowrap;
  animation: toastSlideIn 0.3s ease;
}
@keyframes toastSlideIn {
  0%   { opacity: 0; transform: translateX(-4px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* Googleログインデモ */
.google-login-box {
  margin-top: 6px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.google-login-demo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #3c4043;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.google-note {
  font-size: 11px; color: #2563eb; margin: 8px 0 0;
  font-weight: 600;
}

/* メール案内ボックス */
.email-info-box {
  margin-top: 8px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #93c5fd;
  border-radius: 10px;
}
.email-info-title {
  font-size: 12px; font-weight: 800; color: #1e40af;
  margin: 0 0 6px;
}
.email-info-list {
  margin: 0; padding: 0 0 0 16px;
  font-size: 11px; color: #1e40af; line-height: 1.8;
}

/* 自動完了リスト */
.auto-list {
  display: flex; flex-direction: column; gap: 4px;
  margin: 6px 0;
}
.auto-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #334155;
  padding: 4px 8px; background: #f0fdf4;
  border-radius: 6px;
}
.auto-check { font-size: 12px; }

/* 通知ボックス */
.notify-box {
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 10px; padding: 10px 12px; margin-top: 6px;
}
.notify-text { font-size: 11px; color: #166534; margin: 0; }
.notify-text strong { color: #15803d; }
.notify-sub { font-size: 10px; color: #4ade80; margin: 4px 0 0; }

/* 利用開始カード */
.usage-cards {
  display: flex; flex-direction: column; gap: 6px;
  margin-top: 6px;
}
.usage-card {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 8px;
  font-size: 11px;
}
.usage-card--pc {
  background: #f0f7ff; border: 1px solid #bfdbfe;
}
.usage-card--mobile {
  background: #fefce8; border: 1px solid #fde68a;
}
.usage-icon { font-size: 20px; }
.usage-label { font-weight: 700; color: #1e293b; margin: 0; }
.usage-desc { color: #475569; margin: 2px 0 0; }

/* URL一覧 */
.url-group { margin-top: 10px; }
.url-group-label {
  font-size: 11px; font-weight: 700; color: #475569;
  margin: 0 0 6px; padding: 3px 0;
  border-bottom: 1px solid #f1f5f9;
}
.url-group-note { font-size: 10px; color: #64748b; margin: 0 0 4px; }
.url-entry { margin-bottom: 6px; }
.url-entry-label { font-size: 10px; color: #64748b; display: block; margin-bottom: 2px; }

/* 2回目以降 */
.flow-repeat {
  background: #f8fafc; border-radius: 10px;
  padding: 14px; border: 1px dashed #d1d5db;
}
.repeat-text { font-size: 12px; color: #475569; margin: 8px 0 0; line-height: 1.8; }
.repeat-note { font-size: 10px; color: #94a3b8; }

/* ===== 右カラム ===== */
.col-right { display: flex; flex-direction: column; gap: 16px; }

.card-section {
  background: #fff; border-radius: 16px;
  padding: 18px; box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}
.card-section-header { margin-bottom: 12px; }
.section-badge {
  display: inline-block; font-size: 13px; font-weight: 700;
  padding: 4px 12px; border-radius: 8px; margin-bottom: 4px;
}
.badge-staff  { background: #dbeafe; color: #1e40af; }
.badge-client { background: #dcfce7; color: #166534; }
.section-note { font-size: 11px; color: #94a3b8; margin: 4px 0 0; }

/* カード行 */
.card-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 480px) { .card-row { grid-template-columns: 1fr; } }

.sel-card {
  border: 2px solid #e2e8f0; border-radius: 14px;
  padding: 16px 12px 12px; text-align: center;
  cursor: pointer; transition: all 0.2s ease;
  background: #fff; font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.sel-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.sel-card:active { transform: scale(0.97); }
.card-staff-upload:hover { border-color: #3b82f6; background: #f0f7ff; }
.card-client-mobile:hover { border-color: #22c55e; background: #f0fdf4; }
.card-client-pc:hover     { border-color: #22c55e; background: #f0fdf4; }
.card-drive-upload:hover  { border-color: #f59e0b; background: #fffbeb; }
.card-drive-guest:hover   { border-color: #f59e0b; background: #fffbeb; }
.card-row--single { grid-template-columns: 1fr; }
.card-row--triple { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 640px) { .card-row--triple { grid-template-columns: 1fr; } }

.card-icon-area {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 8px; font-size: 24px;
  transition: transform 0.2s;
}
.sel-card:hover .card-icon-area { transform: scale(1.08); }
.icon-staff-upload  { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.icon-client-mobile { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.icon-client-pc     { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.icon-drive-upload  { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.icon-drive-guest   { background: linear-gradient(135deg, #fef3c7, #fde68a); }

.drive-tag {
  display: inline-block; font-size: 9px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
  background: #fef3c7; color: #92400e;
  margin-top: 6px;
}

.card-label { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.card-sub   { font-size: 10px; color: #94a3b8; margin: 0; }

.copy-tag {
  display: inline-block; font-size: 10px; font-weight: 600;
  padding: 3px 10px; border-radius: 6px;
  background: #f1f5f9; color: #475569;
  margin-top: 6px; transition: all 0.3s ease;
}
.copy-tag.copied { background: #dcfce7; color: #166534; }

/* ===== 共有方法カード ===== */
.flow-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}

/* ===== 共有設定カード ===== */
.share-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 22px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
  transition: box-shadow 0.2s ease;
}
.share-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.share-title {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

/* ステータスバッジ */
.share-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 120px;
  justify-content: center;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.badge-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.badge-dot--green { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
.badge-dot--red   { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.3); }
.badge-dot--gray  { background: #cbd5e1; }
.share-badge--active  { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.share-badge--revoked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.share-badge--none    { background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; }

/* バッジトランジション */
.badge-fade-enter-active,
.badge-fade-leave-active { transition: all 0.25s ease; }
.badge-fade-enter-from { opacity: 0; transform: scale(0.9) translateY(-2px); }
.badge-fade-leave-to   { opacity: 0; transform: scale(0.9) translateY(2px); }

/* セグメントコントロール */
.share-segment {
  margin-top: 2px;
}
.share-segment-track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
  gap: 0;
}
.share-segment-indicator {
  position: absolute;
  top: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.indicator--left  { left: 3px; }
.indicator--right { left: calc(50%); }

.share-seg-btn {
  position: relative;
  z-index: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.25s ease;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  text-align: center;
}
.share-seg--selected {
  color: #1e293b;
}
.share-seg--dimmed {
  color: #94a3b8;
}
.share-seg--dimmed:hover {
  color: #64748b;
}
</style>

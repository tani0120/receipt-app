<template>
  <div class="selector-page" style="font-family: 'Noto Sans JP', sans-serif">

    <!-- ===== 2カラムレイアウト ===== -->
    <main class="two-col">

      <!-- ========== 左カラム: 共有フロー ========== -->
      <aside class="col-left">
        <h2 class="col-title">◆ アップロードURL共有方法</h2>

        <!-- ===== 初回セクション ===== -->
        <div class="flow-section">
          <h3 class="flow-heading">【初回（はじめての登録）】</h3>

          <!-- ① 招待リンク発行 -->
          <div class="step">
            <span class="step-num">①</span>
            <div class="step-body">
              <p class="step-title">招待リンクの発行</p>
              <button class="invite-btn" @click="generateInvite">
                🔗 招待リンクを発行
              </button>
              <div class="url-box" v-if="inviteUrl">
                <span class="url-label">招待リンクURL：</span>
                <div class="url-row">
                  <input class="url-input" :value="inviteUrl" readonly @click="selectAll" />
                  <button class="copy-btn" @click="copyText(inviteUrl, 'invite')">
                    {{ copiedKey === 'invite' ? '✅' : '📋' }}
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
              <p class="step-title">招待リンクURLを顧問先に共有</p>
              <p class="step-note">ChatWork・LINE・メール等で送付</p>
            </div>
          </div>
          <div class="step-arrow">↓</div>

          <!-- ③ タップ -->
          <div class="step">
            <span class="step-num">③</span>
            <div class="step-body">
              <p class="step-title">顧問先が招待リンクをタップ</p>
            </div>
          </div>
          <div class="step-arrow">↓</div>

          <!-- ④ 登録画面 -->
          <div class="step">
            <span class="step-num">④</span>
            <div class="step-body">
              <p class="step-title">登録画面が表示される</p>
              <p class="step-note">★ 3つの方法で登録可能</p>
              <div class="auth-options">
                <div class="auth-opt">
                  <span class="auth-icon">🔵</span>
                  <span>Googleで登録</span>
                  <span class="auth-tag">ワンタップ</span>
                </div>
                <div class="auth-opt">
                  <span class="auth-icon">⚫</span>
                  <span>Apple IDで登録</span>
                </div>
                <div class="auth-opt">
                  <span class="auth-icon">📧</span>
                  <span>メール+パスワードで登録</span>
                </div>
              </div>
            </div>
          </div>
          <div class="step-arrow">↓</div>

          <!-- ⑤ 登録完了 -->
          <div class="step">
            <span class="step-num">⑤</span>
            <div class="step-body">
              <p class="step-title">登録完了</p>
              <div class="notify-box">
                <p class="notify-text">
                  📬 登録が完了すると<strong>進捗管理画面</strong>に通知されます
                </p>
                <p class="notify-sub">（スタッフ側での追加作業は不要です）</p>
              </div>
            </div>
          </div>
          <div class="step-arrow">↓</div>

          <!-- ⑥ URL一覧 -->
          <div class="step">
            <span class="step-num">⑥</span>
            <div class="step-body">
              <p class="step-title">アップロード用URL</p>

              <div class="url-group">
                <p class="url-group-label">＜社内用＞</p>
                <div class="url-entry">
                  <span class="url-entry-label">スマホ用：</span>
                  <div class="url-row">
                    <input class="url-input" :value="staffMobileUrl" readonly @click="selectAll" />
                    <button class="copy-btn" @click="copyText(staffMobileUrl, 'sm')">
                      {{ copiedKey === 'sm' ? '✅' : '📋' }}
                    </button>
                  </div>
                </div>
                <div class="url-entry">
                  <span class="url-entry-label">PC用：</span>
                  <div class="url-row">
                    <input class="url-input" :value="staffPcUrl" readonly @click="selectAll" />
                    <button class="copy-btn" @click="copyText(staffPcUrl, 'sp')">
                      {{ copiedKey === 'sp' ? '✅' : '📋' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="url-group">
                <p class="url-group-label">＜顧問先用＞</p>
                <div class="url-entry">
                  <span class="url-entry-label">スマホ用：</span>
                  <div class="url-row">
                    <input class="url-input" :value="portalMobileUrl" readonly @click="selectAll" />
                    <button class="copy-btn" @click="copyText(portalMobileUrl, 'pm')">
                      {{ copiedKey === 'pm' ? '✅' : '📋' }}
                    </button>
                  </div>
                </div>
                <div class="url-entry">
                  <span class="url-entry-label">PC用：</span>
                  <div class="url-row">
                    <input class="url-input" :value="portalPcUrl" readonly @click="selectAll" />
                    <button class="copy-btn" @click="copyText(portalPcUrl, 'pp')">
                      {{ copiedKey === 'pp' ? '✅' : '📋' }}
                    </button>
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
            ブックマーク or 同じURL → <strong>自動ログイン</strong> → 即使える<br>
            <span class="repeat-note">（招待コードは2回目以降不要）</span>
          </p>
        </div>
      </aside>

      <!-- ========== 右カラム: アップロードカード ========== -->
      <section class="col-right">

        <!-- 共有設定 -->
        <div class="card-section section-share">
          <div class="card-section-header">
            <span class="section-badge badge-share">⚙️ 共有設定</span>
            <div class="share-status-row">
              <span class="share-label">現在の状態：</span>
              <span v-if="currentStatus === 'active'" class="share-st-badge share-st-active">共有OK</span>
              <span v-else-if="currentStatus === 'pending'" class="share-st-badge share-st-pending">未承認</span>
              <span v-else-if="currentStatus === 'revoked'" class="share-st-badge share-st-revoked">解除済</span>
              <span v-else class="share-st-badge share-st-none">未設定</span>
            </div>
          </div>
          <div class="share-actions">
            <button
              v-if="currentStatus !== 'active'"
              class="share-action-btn share-btn-approve"
              @click="setStatus('active')"
            >✅ 共有OKにする</button>
            <button
              v-if="currentStatus !== 'pending' && currentStatus !== null"
              class="share-action-btn share-btn-pending"
              @click="setStatus('pending')"
            >⏳ 未承認に戻す</button>
            <button
              v-if="currentStatus === 'active' || currentStatus === 'pending'"
              class="share-action-btn share-btn-revoke"
              @click="setStatus('revoked')"
            >⛔ 共有解除</button>
          </div>
        </div>

        <!-- 社内用 -->
        <div class="card-section section-staff">
          <div class="card-section-header">
            <span class="section-badge badge-staff">🏢 社内用</span>
            <p class="section-note">スタッフがこの画面から直接アップロード</p>
          </div>
          <div class="card-row">
            <button class="sel-card card-staff-mobile" @click="go(staffMobilePath)">
              <div class="card-icon-area icon-staff-mobile"><span>📱</span></div>
              <h3 class="card-label">スマホで撮影</h3>
              <p class="card-sub">カメラ起動→即AI検証</p>
            </button>
            <button class="sel-card card-staff-pc" @click="go(staffPcPath)">
              <div class="card-icon-area icon-staff-pc"><span>💻</span></div>
              <h3 class="card-label">PCから送る</h3>
              <p class="card-sub">ファイル選択・D&amp;D</p>
            </button>
          </div>
        </div>

        <!-- 顧問先用 -->
        <div class="card-section section-client">
          <div class="card-section-header">
            <span class="section-badge badge-client">👤 顧問先に共有</span>
            <p class="section-note">カードをクリックでURLコピー</p>
          </div>
          <div class="card-row">
            <div class="sel-card card-client-mobile" @click="copyText(portalMobileUrl, 'pm')">
              <div class="card-icon-area icon-client-mobile"><span>📱</span></div>
              <h3 class="card-label">スマホ用URL</h3>
              <span class="copy-tag" :class="{ copied: copiedKey === 'pm' }">
                {{ copiedKey === 'pm' ? '✅ コピー済み' : '📋 URLをコピー' }}
              </span>
            </div>
            <div class="sel-card card-client-pc" @click="copyText(portalPcUrl, 'pp')">
              <div class="card-icon-area icon-client-pc"><span>💻</span></div>
              <h3 class="card-label">PC用URL</h3>
              <span class="copy-tag" :class="{ copied: copiedKey === 'pp' }">
                {{ copiedKey === 'pp' ? '✅ コピー済み' : '📋 URLをコピー' }}
              </span>
            </div>
          </div>
          <button class="preview-btn" @click="go('/portal/' + clientId)">
            👁 顧問先ポータルをプレビュー →
          </button>
        </div>

        <!-- 資料 -->
        <div class="docs-area">
          <button class="docs-btn" @click="go('/client/upload-docs/' + clientId)">
            📎 謄本・CSV・Excel等の資料を送る
          </button>
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

// URL群
const staffMobilePath = `/client/upload/${clientId}/mobile`
const staffPcPath     = `/client/upload/${clientId}/pc`
const staffMobileUrl  = `${origin}/#${staffMobilePath}`
const staffPcUrl      = `${origin}/#${staffPcPath}`
const portalMobileUrl = `${origin}/#/portal/${clientId}/mobile`
const portalPcUrl     = `${origin}/#/portal/${clientId}/pc`

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

/* ===== ヘッダー ===== */
.selector-header {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0; z-index: 20;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.header-inner { max-width: 1200px; margin: 0 auto; padding: 12px 20px; }
.header-title { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0; }
.header-sub   { font-size: 11px; color: #94a3b8; margin: 2px 0 0; }

/* ===== 2カラム ===== */
.two-col {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 16px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
}

/* ===== 左カラム ===== */
.col-left {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
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
  background: #3b82f6; color: #fff;
  font-size: 12px; font-weight: 700;
  border-radius: 50%;
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
  padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px;
  cursor: pointer; background: #fff; font-size: 12px;
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.copy-btn:hover { background: #f0f7ff; }

/* 認証オプション */
.auth-options { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.auth-opt {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 8px;
  background: #f8fafc; font-size: 11px; color: #334155;
}
.auth-icon { font-size: 14px; }
.auth-tag {
  font-size: 9px; font-weight: 700; color: #3b82f6;
  background: #dbeafe; padding: 1px 6px; border-radius: 4px;
  margin-left: auto;
}

/* 通知ボックス */
.notify-box {
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 10px; padding: 10px 12px; margin-top: 6px;
}
.notify-text { font-size: 11px; color: #166534; margin: 0; }
.notify-text strong { color: #15803d; }
.notify-sub { font-size: 10px; color: #4ade80; margin: 4px 0 0; }

/* URL一覧 */
.url-group { margin-top: 10px; }
.url-group-label {
  font-size: 11px; font-weight: 700; color: #475569;
  margin: 0 0 6px; padding: 3px 0;
  border-bottom: 1px solid #f1f5f9;
}
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
.card-staff-mobile:hover { border-color: #3b82f6; background: #f0f7ff; }
.card-staff-pc:hover     { border-color: #8b5cf6; background: #f5f3ff; }
.card-client-mobile:hover { border-color: #22c55e; background: #f0fdf4; }
.card-client-pc:hover     { border-color: #22c55e; background: #f0fdf4; }

.card-icon-area {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 8px; font-size: 24px;
  transition: transform 0.2s;
}
.sel-card:hover .card-icon-area { transform: scale(1.08); }
.icon-staff-mobile  { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.icon-staff-pc      { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.icon-client-mobile { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.icon-client-pc     { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }

.card-label { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.card-sub   { font-size: 10px; color: #94a3b8; margin: 0; }

.copy-tag {
  display: inline-block; font-size: 10px; font-weight: 600;
  padding: 3px 10px; border-radius: 6px;
  background: #f1f5f9; color: #475569;
  margin-top: 6px; transition: all 0.3s ease;
}
.copy-tag.copied { background: #dcfce7; color: #166534; }

.preview-btn {
  display: block; width: 100%; text-align: center;
  margin-top: 10px; padding: 8px;
  border: none; border-radius: 8px;
  background: transparent; cursor: pointer;
  font-family: inherit; font-size: 11px; color: #64748b;
  transition: color 0.2s;
}
.preview-btn:hover { color: #22c55e; }

.docs-area { text-align: center; }
.docs-btn {
  font-size: 12px; color: #64748b;
  background: rgba(255,255,255,0.9); border: 1px dashed #cbd5e1;
  border-radius: 12px; padding: 12px 20px;
  cursor: pointer; transition: all 0.2s ease; font-family: inherit;
}
.docs-btn:hover { background: #fff; border-color: #94a3b8; color: #334155; }

/* 共有設定セクション */
.section-share { border: 2px solid #e2e8f0; }
.badge-share { background: #fef3c7; color: #92400e; }

.share-status-row {
  display: flex; align-items: center; gap: 8px;
  margin-top: 8px;
}
.share-label { font-size: 12px; color: #64748b; }
.share-st-badge {
  display: inline-block; padding: 3px 12px; border-radius: 6px;
  font-size: 12px; font-weight: 700;
}
.share-st-active  { background: #dcfce7; color: #166534; }
.share-st-pending { background: #dbeafe; color: #1e40af; }
.share-st-revoked { background: #fee2e2; color: #991b1b; }
.share-st-none    { background: #f1f5f9; color: #94a3b8; }

.share-actions {
  display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;
}
.share-action-btn {
  padding: 6px 14px; border-radius: 8px;
  font-size: 11px; font-weight: 700;
  border: 1px solid #e2e8f0; cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.share-btn-approve { background: #dcfce7; color: #166534; border-color: #86efac; }
.share-btn-approve:hover { background: #bbf7d0; }
.share-btn-pending { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
.share-btn-pending:hover { background: #bfdbfe; }
.share-btn-revoke { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
.share-btn-revoke:hover { background: #fecaca; }
</style>

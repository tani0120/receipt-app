<template>
  <div class="error-page-wrap">
    <!-- ===== 第三者: 情報ゼロ ===== -->
    <div v-if="role === 'third_party'" class="third-party-page">
      <div class="tp-dot"></div>
      <p class="tp-msg">ページが見つかりません。</p>
    </div>

    <!-- ===== 顧問先: PortalHeader + 前のページに戻る ===== -->
    <div v-else-if="role === 'client'" class="client-page">
      <PortalHeader :clientName="clientName" />
      <main class="client-main">
        <div class="client-card">
          <div class="client-icon">📄</div>
          <h1 class="client-title">お探しのページにアクセスできませんでした。</h1>
          <p class="client-sub">お手数ですが、前のページからやり直してください。</p>
          <button class="client-btn" @click="goBack">
            <i class="fa-solid fa-arrow-left"></i> 前のページに戻る
          </button>
        </div>
      </main>
    </div>

    <!-- ===== スタッフ: NavBar + エラー情報 + コピー ===== -->
    <div v-else-if="role === 'staff'" class="staff-page">
      <MockNavBar />
      <main class="staff-main">
        <div class="staff-card">
          <!-- ヘッダー -->
          <div class="staff-header">
            <div class="staff-code" :class="codeColorClass">{{ errorCode }}</div>
            <div class="staff-hdr-text">
              <h1>エラーが発生しました</h1>
              <div class="staff-hdr-sub">{{ errorLabel }}</div>
            </div>
          </div>

          <!-- エラー情報 -->
          <div class="staff-body">
            <div class="log-label"><i class="fa-solid fa-clipboard-list"></i> エラー情報</div>
            <div class="log-box">
              <button class="copy-btn" @click="copyLog" :class="{ copied: isCopied }">
                <i :class="isCopied ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
                {{ isCopied ? 'コピー済み' : 'コピー' }}
              </button>
              <div class="log-row"><span class="log-key">エラーコード:</span> <span class="log-val">{{ errorCode }}</span></div>
              <div class="log-row"><span class="log-key">パス:</span> <span class="log-val">{{ currentPath }}</span></div>
              <div class="log-row"><span class="log-key">リクエストID:</span> <span class="log-val">{{ requestId }}</span></div>
              <div class="log-row"><span class="log-key">発生日時:</span> <span class="log-val">{{ timestamp }}</span></div>
              <div v-if="errorMessage" class="log-row"><span class="log-key">詳細:</span> <span class="log-val">{{ errorMessage }}</span></div>
            </div>

            <!-- 401: 再ログイン -->
            <div v-if="errorCode === 401" class="report-msg relogin">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>セッションが切れました。<b>再ログイン</b>してください。</span>
            </div>
            <!-- 408/429/503: リトライ -->
            <div v-else-if="isRetryable" class="report-msg">
              <i class="fa-solid fa-rotate-right"></i>
              <span>しばらく待ってから<b>再度お試しください</b>。解消しない場合は管理者に報告してください。</span>
            </div>
            <!-- 413: サイズ変更 -->
            <div v-else-if="errorCode === 413" class="report-msg">
              <i class="fa-solid fa-compress"></i>
              <span>ファイルを分割するか、サイズを小さくして<b>再度アップロード</b>してください。</span>
            </div>
            <!-- その他: 管理者報告 -->
            <div v-else class="report-msg">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>上記の内容をコピーし、<b>管理者</b>に報告してください。</span>
            </div>
          </div>

          <!-- フッター -->
          <div class="staff-footer">
            <router-link v-if="errorCode === 401" to="/login" class="btn btn-relogin">
              <i class="fa-solid fa-right-to-bracket"></i> 再ログイン
            </router-link>
            <router-link to="/master/progress" class="btn btn-home">
              <i class="fa-solid fa-house"></i> ホームに戻る
            </router-link>
          </div>
        </div>
      </main>
    </div>

    <!-- ロード中（判定待ち） -->
    <div v-else class="third-party-page">
      <p class="tp-msg">ページが見つかりません。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getErrorRole, type ErrorRole } from '@/utils/errorRole'
import PortalHeader from '@/components/PortalHeader.vue'
import MockNavBar from '@/components/MockNavBar.vue'

const route = useRoute()
const router = useRouter()

// ロール判定（非同期）
const role = ref<ErrorRole | null>(null)
onMounted(async () => {
  // 【開発用】?role= でロール強制オーバーライド（本番デプロイ前に削除）
  const queryRole = route.query.role as string | undefined
  if (queryRole === 'staff' || queryRole === 'client' || queryRole === 'third_party') {
    role.value = queryRole
    return
  }
  role.value = await getErrorRole()
})

// クエリパラメータからエラー情報取得
const errorCode = computed(() => Number(route.query.code) || 404)
const errorMessage = computed(() => (route.query.message as string) || '')
const currentPath = computed(() => (route.query.path as string) || route.fullPath)
const requestId = computed(() => (route.query.requestId as string) || '-')

// 発生日時
const timestamp = new Date().toLocaleString('ja-JP', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
}).replace(/\//g, '-')

// エラーコード→ラベル変換（apiMessages.tsのマスターを参照）
import { ステータスから文面 } from '@/api/helpers/apiMessages'
const errorLabel = computed(() => ステータスから文面(errorCode.value))

// エラーコードの色
const codeColorClass = computed(() => {
  const code = errorCode.value
  if (code === 401 || code === 403) return 'code-purple'
  if (code === 408 || code === 429 || code === 502 || code === 503) return 'code-orange'
  if (code === 404) return 'code-yellow'
  return 'code-red' // 400, 413, 500
})

// リトライ可能なエラーか
const isRetryable = computed(() => [408, 429, 503].includes(errorCode.value))

// 顧問先の社名（localStorageから取得を試みる）
const clientName = ref('')
onMounted(() => {
  // guest_google_*のキーからクライアント情報を取得
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('guest_google_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.companyName) clientName.value = data.companyName
      } catch { /* 無視 */ }
    }
  }
})

// コピー機能
const isCopied = ref(false)
function copyLog() {
  const lines = [
    `エラーコード: ${errorCode.value}`,
    `パス: ${currentPath.value}`,
    `リクエストID: ${requestId.value}`,
    `発生日時: ${timestamp}`,
  ]
  if (errorMessage.value) lines.push(`詳細: ${errorMessage.value}`)
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  })
}

// 顧問先用「前のページに戻る」
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
/* ===== 共通 ===== */
.error-page-wrap {
  min-height: 100vh;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

/* ===== 第三者 ===== */
.third-party-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #f0f4f8 0%, #e8edf5 40%, #f5f0fa 70%, #faf5f0 100%);
}
.tp-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #cbd5e1; margin-bottom: 32px;
  animation: pulse 2.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,100% { opacity: .3; transform: scale(1) }
  50% { opacity: .8; transform: scale(1.5) }
}
.tp-msg {
  font-size: 20px; color: #94a3b8; font-weight: 400; letter-spacing: .5px;
}

/* ===== 顧問先 ===== */
.client-page {
  min-height: 100vh; display: flex; flex-direction: column;
  background: linear-gradient(160deg, #f0f4f8 0%, #e8edf5 40%, #f5f0fa 70%, #faf5f0 100%);
}
.client-main {
  flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 20px;
}
.client-card {
  text-align: center; padding: 48px 44px;
  background: rgba(255,255,255,.75); backdrop-filter: blur(16px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,.06), 0 1px 4px rgba(0,0,0,.04);
  border: 1px solid rgba(255,255,255,.6);
  max-width: 440px; width: 90%;
  animation: fadeUp .5s ease-out;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px) }
  to { opacity: 1; transform: translateY(0) }
}
.client-icon { font-size: 56px; margin-bottom: 16px; }
.client-title {
  font-size: 18px; font-weight: 700; color: #1e293b;
  margin: 0 0 8px; line-height: 1.6;
}
.client-sub {
  font-size: 13px; color: #94a3b8; margin: 0 0 28px; line-height: 1.8;
}
.client-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 28px; background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-size: 14px; font-weight: 600;
  border-radius: 12px; border: none; cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.client-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,.3) }
.client-btn:active { transform: scale(.97) }

/* ===== スタッフ ===== */
.staff-page {
  min-height: 100vh; display: flex; flex-direction: column; background: #f5f7fa;
}
.staff-main {
  flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 20px;
}
.staff-card {
  width: 100%; max-width: 520px; background: #fff; border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04);
  border: 1px solid #e5e7eb; overflow: hidden; animation: fadeUp .4s ease-out;
}
.staff-header {
  padding: 28px 32px 20px; display: flex; align-items: center; gap: 16px;
}
.staff-code {
  font-size: 36px; font-weight: 900;
  font-family: 'JetBrains Mono', monospace; line-height: 1;
}
.code-yellow { color: #f59e0b }
.code-red { color: #ef4444 }
.code-purple { color: #8b5cf6 }
.code-orange { color: #f97316 }

.staff-hdr-text h1 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 2px }
.staff-hdr-sub { font-size: 12px; color: #94a3b8 }

.staff-body { padding: 0 32px 24px }
.log-label {
  font-size: 11px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 1px;
  margin: 0 0 8px; display: flex; align-items: center; gap: 6px;
}
.log-box {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 16px 18px; padding-right: 80px;
  font-size: 12px; color: #334155; line-height: 2; position: relative;
}
.log-row { display: flex; gap: 4px }
.log-key {
  color: #64748b; font-weight: 600; white-space: nowrap;
  font-family: 'Noto Sans JP', sans-serif; font-size: 11px;
}
.log-val {
  color: #1e293b; font-family: 'JetBrains Mono', monospace; font-size: 12px;
}
.copy-btn {
  position: absolute; top: 10px; right: 10px;
  padding: 6px 12px; font-size: 11px; font-weight: 600;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
  color: #64748b; cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: all .15s;
}
.copy-btn:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe }
.copy-btn.copied { background: #ecfdf5; color: #059669; border-color: #a7f3d0 }

.report-msg {
  margin: 14px 0 0; padding: 12px 16px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
  font-size: 12px; color: #92400e; line-height: 1.7;
  display: flex; align-items: flex-start; gap: 8px;
}
.report-msg i { color: #f59e0b; margin-top: 2px; flex-shrink: 0 }
.report-msg.relogin { background: #eff6ff; border-color: #bfdbfe; color: #1e40af }
.report-msg.relogin i { color: #3b82f6 }

.staff-footer { padding: 0 32px 28px; display: flex; gap: 10px }
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 24px; font-size: 13px; font-weight: 600;
  border-radius: 10px; border: none; cursor: pointer;
  transition: transform .15s, box-shadow .15s; text-decoration: none;
}
.btn-home { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff }
.btn-home:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,.25) }
.btn-relogin { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff }
.btn-relogin:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(217,119,6,.25) }
</style>

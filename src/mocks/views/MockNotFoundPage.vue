<template>
  <div class="error-page">
    <!-- ===== 第三者: 情報ゼロ ===== -->
    <div v-if="role === 'third_party'" class="error-content">
      <p class="error-msg-minimal">ページが見つかりません。</p>
    </div>

    <!-- ===== 顧問先: 次の行動のみ ===== -->
    <div v-else-if="role === 'client'" class="error-content error-client">
      <div class="error-icon">📄</div>
      <h1 class="error-title">お探しのページにアクセスできませんでした。</h1>
      <p class="error-contact">
        担当者にご連絡ください。<br>
        <span class="error-contact-detail">Tel: 03-XXXX-XXXX</span><br>
        <span class="error-contact-detail">Mail: support@example.com</span>
      </p>
      <router-link to="/" class="error-home-link">
        <i class="fa-solid fa-house"></i> ホームへ戻る
      </router-link>
    </div>

    <!-- ===== スタッフ: 全開示 ===== -->
    <div v-else-if="role === 'staff'" class="error-content error-staff">
      <div class="error-badge">{{ errorCode }}</div>
      <h1 class="error-title-staff">
        {{ errorCode }} - {{ errorLabel }}
      </h1>
      <p class="error-path">
        <span class="error-label">パス:</span> {{ currentPath }}
      </p>
      <p v-if="errorMessage" class="error-detail">
        <span class="error-label">詳細:</span> {{ errorMessage }}
      </p>

      <!-- 対応手順 -->
      <div class="error-guide">
        <h2 class="error-guide-title">対応手順</h2>
        <div class="error-guide-table">
          <div class="error-guide-row">
            <span class="error-guide-code">404</span>
            <span class="error-guide-desc">ルート定義を確認 → 再デプロイ</span>
          </div>
          <div class="error-guide-row">
            <span class="error-guide-code">403</span>
            <span class="error-guide-desc">ロール設定確認（app_metadata.role）</span>
          </div>
          <div class="error-guide-row">
            <span class="error-guide-code">500</span>
            <span class="error-guide-desc">Supabaseログ確認 → Slack #dev-alert</span>
          </div>
          <div class="error-guide-row">
            <span class="error-guide-code">503</span>
            <span class="error-guide-desc">status.supabase.com確認 → 上長報告</span>
          </div>
        </div>
      </div>

      <div class="error-meta">
        <p><span class="error-label">発生日時:</span> {{ timestamp }}</p>
        <p><span class="error-label">リクエストID:</span> {{ requestId }}</p>
      </div>

      <router-link to="/mode-select" class="error-home-link error-home-link-staff">
        <i class="fa-solid fa-arrow-left"></i> ダッシュボードへ戻る
      </router-link>
    </div>

    <!-- ロード中（判定待ち） -->
    <div v-else class="error-content">
      <p class="error-msg-minimal">ページが見つかりません。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getErrorRole, type ErrorRole } from '@/utils/errorRole'

const route = useRoute()

// ロール判定（非同期）
const role = ref<ErrorRole | null>(null)
onMounted(async () => {
  // 判定完了まで第三者用を表示（情報漏洩しない）
  role.value = await getErrorRole()
})

// クエリパラメータからエラー情報取得（スタッフのみ表示）
const errorCode = computed(() => Number(route.query.code) || 404)
const errorMessage = computed(() => (route.query.message as string) || '')
const currentPath = computed(() => (route.query.path as string) || route.fullPath)

// エラーコード→ラベル変換
const errorLabel = computed(() => {
  const labels: Record<number, string> = {
    400: '不正なリクエスト',
    401: '認証エラー',
    403: '権限がありません',
    404: 'ページが見つかりません',
    408: 'リクエストタイムアウト',
    429: 'レート制限超過',
    500: 'サーバー内部エラー',
    503: 'サービス利用不可',
  }
  return labels[errorCode.value] || '予期しないエラー'
})

// メタ情報
const timestamp = new Date().toLocaleString('ja-JP')
const requestId = Math.random().toString(36).slice(2, 10)
</script>

<style scoped>
/* ===== 共通レイアウト ===== */
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

.error-content {
  text-align: center;
  padding: 48px 32px;
  max-width: 560px;
  width: 100%;
}

/* ===== 第三者: 最小限 ===== */
.error-msg-minimal {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

/* ===== 顧問先 ===== */
.error-client {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.error-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px;
  line-height: 1.6;
}

.error-contact {
  font-size: 13px;
  color: #64748b;
  line-height: 2;
  margin: 0 0 28px;
}

.error-contact-detail {
  font-weight: 600;
  color: #334155;
}

.error-home-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
}

.error-home-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
}

.error-home-link:active {
  transform: scale(0.97);
}

/* ===== スタッフ ===== */
.error-staff {
  text-align: left;
  background: #0f172a;
  border-radius: 16px;
  padding: 36px;
  color: #e2e8f0;
}

.error-badge {
  display: inline-block;
  font-size: 48px;
  font-weight: 900;
  color: #f87171;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  line-height: 1;
  margin-bottom: 8px;
}

.error-title-staff {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 20px;
}

.error-path,
.error-detail {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0;
  font-family: 'JetBrains Mono', monospace;
  word-break: break-all;
}

.error-label {
  color: #64748b;
  font-weight: 600;
  font-family: 'Noto Sans JP', sans-serif;
}

/* 対応手順 */
.error-guide {
  margin: 24px 0;
  padding: 16px;
  background: #1e293b;
  border-radius: 10px;
  border: 1px solid #334155;
}

.error-guide-title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px;
}

.error-guide-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-guide-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 12px;
}

.error-guide-code {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #fbbf24;
  min-width: 32px;
}

.error-guide-desc {
  color: #94a3b8;
}

/* メタ情報 */
.error-meta {
  margin: 20px 0;
  padding: 12px 16px;
  background: #1e293b;
  border-radius: 8px;
  border: 1px solid #334155;
}

.error-meta p {
  margin: 2px 0;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: #64748b;
}

.error-home-link-staff {
  background: linear-gradient(135deg, #475569, #334155);
  font-size: 13px;
  padding: 10px 20px;
}

.error-home-link-staff:hover {
  box-shadow: 0 4px 16px rgba(71, 85, 105, 0.4);
}
</style>

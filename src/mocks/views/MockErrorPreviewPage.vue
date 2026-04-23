<template>
  <div class="preview-page">
    <h1 class="preview-heading">エラーページ プレビュー（4パターン）</h1>
    <p class="preview-sub">本番では同じURL <code>/#/404</code> でロール判定により自動切替</p>

    <div class="preview-grid">
      <!-- 1. 第三者 -->
      <div class="preview-card">
        <div class="preview-label">① 第三者（未ログイン）</div>
        <div class="preview-frame frame-light">
          <div class="error-content">
            <p class="error-msg-minimal">ページが見つかりません。</p>
          </div>
        </div>
      </div>

      <!-- 2. 顧問先 -->
      <div class="preview-card">
        <div class="preview-label">② 顧問先（ゲストログイン済み）</div>
        <div class="preview-frame frame-light">
          <div class="error-content error-client">
            <div class="error-icon">📄</div>
            <h2 class="error-title">お探しのページにアクセスできませんでした。</h2>
            <p class="error-contact">
              担当者にご連絡ください。<br>
              <span class="error-contact-detail">Tel: 03-XXXX-XXXX</span><br>
              <span class="error-contact-detail">Mail: support@example.com</span>
            </p>
            <span class="error-home-link"><i class="fa-solid fa-house"></i> ホームへ戻る</span>
          </div>
        </div>
      </div>

      <!-- 3. スタッフ（404） -->
      <div class="preview-card">
        <div class="preview-label">③ スタッフ（404）</div>
        <div class="preview-frame frame-dark">
          <div class="error-content error-staff">
            <div class="error-badge">404</div>
            <h2 class="error-title-staff">404 - ページが見つかりません</h2>
            <p class="error-path"><span class="error-label">パス:</span> /staff/unknown-page</p>
            <div class="error-guide">
              <h3 class="error-guide-title">対応手順</h3>
              <div class="error-guide-table">
                <div class="error-guide-row"><span class="error-guide-code">404</span><span class="error-guide-desc">ルート定義を確認 → 再デプロイ</span></div>
                <div class="error-guide-row"><span class="error-guide-code">403</span><span class="error-guide-desc">ロール設定確認（app_metadata.role）</span></div>
                <div class="error-guide-row"><span class="error-guide-code">500</span><span class="error-guide-desc">Supabaseログ確認 → Slack #dev-alert</span></div>
                <div class="error-guide-row"><span class="error-guide-code">503</span><span class="error-guide-desc">status.supabase.com確認 → 上長報告</span></div>
              </div>
            </div>
            <div class="error-meta">
              <p><span class="error-label">発生日時:</span> 2026-04-23 10:30:00</p>
              <p><span class="error-label">リクエストID:</span> a3f8b2c1</p>
            </div>
            <span class="error-home-link error-home-link-staff"><i class="fa-solid fa-arrow-left"></i> ダッシュボードへ戻る</span>
          </div>
        </div>
      </div>

      <!-- 4. スタッフ（500 エラー情報付き） -->
      <div class="preview-card">
        <div class="preview-label">④ スタッフ（500 エラー情報付き）</div>
        <div class="preview-frame frame-dark">
          <div class="error-content error-staff">
            <div class="error-badge error-badge-500">500</div>
            <h2 class="error-title-staff">500 - サーバー内部エラー</h2>
            <p class="error-path"><span class="error-label">パス:</span> /api/clients</p>
            <p class="error-detail"><span class="error-label">詳細:</span> DB接続エラー</p>
            <div class="error-guide">
              <h3 class="error-guide-title">対応手順</h3>
              <div class="error-guide-table">
                <div class="error-guide-row"><span class="error-guide-code">404</span><span class="error-guide-desc">ルート定義を確認 → 再デプロイ</span></div>
                <div class="error-guide-row"><span class="error-guide-code">403</span><span class="error-guide-desc">ロール設定確認（app_metadata.role）</span></div>
                <div class="error-guide-row"><span class="error-guide-code error-guide-code-active">500</span><span class="error-guide-desc error-guide-desc-active">Supabaseログ確認 → Slack #dev-alert</span></div>
                <div class="error-guide-row"><span class="error-guide-code">503</span><span class="error-guide-desc">status.supabase.com確認 → 上長報告</span></div>
              </div>
            </div>
            <div class="error-meta">
              <p><span class="error-label">発生日時:</span> 2026-04-23 10:30:00</p>
              <p><span class="error-label">リクエストID:</span> f7e2d9a4</p>
            </div>
            <span class="error-home-link error-home-link-staff"><i class="fa-solid fa-arrow-left"></i> ダッシュボードへ戻る</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// プレビュー専用。ロール判定なし。静的表示のみ。
</script>

<style scoped>
/* ===== プレビューレイアウト ===== */
.preview-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  padding: 20px 24px 40px;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

.preview-heading {
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 4px;
}

.preview-sub {
  text-align: center;
  font-size: 11px;
  color: #64748b;
  margin: 0 0 16px;
}

.preview-sub code {
  background: #334155;
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .preview-grid { grid-template-columns: 1fr; }
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  padding-left: 4px;
}

.preview-frame {
  border-radius: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  min-height: 220px;
  max-height: 380px;
  border: 1px solid #334155;
}

.frame-light {
  background: #f8f9fa;
}

.frame-dark {
  background: #0f172a;
}

/* ===== 第三者 ===== */
.error-msg-minimal {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
  padding: 80px 0;
  text-align: center;
}

/* ===== 顧問先 ===== */
.error-content {
  text-align: center;
  padding: 20px 20px;
  width: 100%;
  margin: auto;
}

.error-client {
  background: white;
  border-radius: 12px;
  margin: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.error-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.error-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
  line-height: 1.6;
}

.error-contact {
  font-size: 12px;
  color: #64748b;
  line-height: 2;
  margin: 0 0 20px;
}

.error-contact-detail {
  font-weight: 600;
  color: #334155;
}

.error-home-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  cursor: pointer;
}

/* ===== スタッフ ===== */
.error-staff {
  text-align: left;
  padding: 18px;
  color: #e2e8f0;
}

.error-badge {
  font-size: 32px;
  font-weight: 900;
  color: #fbbf24;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  line-height: 1;
  margin-bottom: 6px;
}

.error-badge-500 {
  color: #f87171;
}

.error-title-staff {
  font-size: 14px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 8px;
}

.error-path,
.error-detail {
  font-size: 12px;
  color: #94a3b8;
  margin: 3px 0;
  font-family: 'JetBrains Mono', monospace;
  word-break: break-all;
}

.error-label {
  color: #64748b;
  font-weight: 600;
  font-family: 'Noto Sans JP', sans-serif;
}

.error-guide {
  margin: 10px 0;
  padding: 12px;
  background: #1e293b;
  border-radius: 8px;
  border: 1px solid #334155;
}

.error-guide-title {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 10px;
}

.error-guide-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-guide-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 11px;
}

.error-guide-code {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #fbbf24;
  min-width: 28px;
}

.error-guide-code-active {
  color: #f87171;
  text-decoration: underline;
}

.error-guide-desc {
  color: #94a3b8;
}

.error-guide-desc-active {
  color: #f1f5f9;
  font-weight: 600;
}

.error-meta {
  margin: 14px 0;
  padding: 10px 12px;
  background: #1e293b;
  border-radius: 6px;
  border: 1px solid #334155;
}

.error-meta p {
  margin: 2px 0;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: #64748b;
}

.error-home-link-staff {
  background: linear-gradient(135deg, #475569, #334155);
  font-size: 12px;
  padding: 8px 16px;
  margin-top: 8px;
}
</style>

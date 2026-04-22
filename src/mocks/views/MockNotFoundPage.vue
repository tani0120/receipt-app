<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <span class="not-found-code">404</span>
      <h1 class="not-found-title">ページが見つかりません</h1>
      <p class="not-found-desc">お探しのページは存在しないか、アクセス権限がありません。</p>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #f0f6ff 0%, #e8f0fe 30%, #f7f4ff 60%, #fef7f0 100%);
}
.not-found-content {
  text-align: center;
  padding: 40px;
}
.not-found-code {
  font-size: 96px;
  font-weight: 900;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}
.not-found-title {
  font-size: 22px;
  color: #1e293b;
  margin: 16px 0 8px;
}
.not-found-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}
</style>

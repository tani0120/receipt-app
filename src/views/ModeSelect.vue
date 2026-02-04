<template>
  <div class="mode-select-container">
    <div class="mode-select-card">
      <h1 class="title">AI会計システム</h1>
      <p class="subtitle">使用するバージョンを選択してください</p>

      <div class="button-group">
        <button @click="$router.push('/legacy/journal-status')" class="btn btn-legacy">
          <div class="btn-icon">
            <i class="fas fa-briefcase"></i>
          </div>
          <div class="btn-content">
            <h2>従来版を使う</h2>
            <p>既存の機能をそのまま使用</p>
          </div>
        </button>

        <button @click="$router.push('/mvp/upload')" class="btn btn-mvp">
          <div class="btn-icon">
            <i class="fas fa-rocket"></i>
          </div>
          <div class="btn-content">
            <h2>MVP版を使う</h2>
            <p>Phase 6 新UI（開発中）</p>
          </div>
        </button>
      </div>

      <p class="note">
        ※ 開発者向け: URL直接アクセスも可能です<br>
        MVP版: <code>/mvp/upload</code> | 従来版: <code>/legacy/journal-status</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 完全にdumb - ボタンだけ
</script>

<style scoped>
.mode-select-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mode-select-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.btn-legacy {
  border-color: #3b82f6;
}

.btn-legacy:hover {
  background: #eff6ff;
  border-color: #2563eb;
}

.btn-mvp {
  border-color: #8b5cf6;
}

.btn-mvp:hover {
  background: #f5f3ff;
  border-color: #7c3aed;
}

.btn-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.5rem;
}

.btn-legacy .btn-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-mvp .btn-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-content h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #333;
}

.btn-content p {
  font-size: 0.9rem;
  color: #666;
}

.note {
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  line-height: 1.6;
}

.note code {
  background: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #667eea;
}
</style>

<template>
  <div class="h-full flex flex-col bg-gray-50 font-sans">
    <!-- マスタ管理ハブ -->
    <div class="flex-1 overflow-auto p-6">
      <div class="master-hub">
        <h1 class="hub-title">マスタ管理</h1>
        <p class="hub-desc">事務所全体で共通のマスターデータを管理します。各顧問先の設定には「設定」画面をご利用ください。</p>
        <div class="hub-cards">
          <router-link to="/master/accounts" class="hub-card">
            <i class="fa-solid fa-book hub-card-icon"></i>
            <div class="hub-card-body">
              <span class="hub-card-title">勘定科目マスタ</span>
              <span class="hub-card-desc">全事業形態の勘定科目を管理</span>
            </div>
            <i class="fa-solid fa-chevron-right hub-card-arrow"></i>
          </router-link>
          <router-link to="/master/tax-categories" class="hub-card">
            <i class="fa-solid fa-receipt hub-card-icon"></i>
            <div class="hub-card-body">
              <span class="hub-card-title">税区分マスタ</span>
              <span class="hub-card-desc">課税方式別の税区分を管理</span>
            </div>
            <i class="fa-solid fa-chevron-right hub-card-arrow"></i>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.master-hub {
  max-width: 640px;
  margin: 0 auto;
}
.hub-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}
.hub-desc {
  font-size: 13px;
  color: #888;
  margin-bottom: 24px;
}
.hub-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hub-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.hub-card:hover {
  border-color: #1976D2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.12);
}
.hub-card-icon {
  font-size: 24px;
  color: #1976D2;
  width: 40px;
  text-align: center;
}
.hub-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hub-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.hub-card-desc {
  font-size: 12px;
  color: #999;
}
.hub-card-arrow {
  color: #ccc;
  font-size: 14px;
}
</style>

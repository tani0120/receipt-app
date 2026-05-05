
<template>
  <div id="app" class="flex flex-col h-full bg-slate-50 text-slate-700 font-sans h-screen overflow-hidden">
    <!-- 統一ナビバー（ログインページ・顧問先ポータル以外） -->
    <MockNavBar v-if="!hideNavBar" />

    <!-- Main Content -->
    <main :class="[
      'flex-1 overflow-hidden relative',
      hideNavBar ? 'bg-white p-0' : 'bg-slate-100 p-4'
    ]">
         <router-view v-slot="{ Component, route: viewRoute }">
            <transition name="fade" mode="out-in">
              <div :key="viewRoute.path" class="h-full">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
    </main>

    <!-- グローバルトースト通知（全画面共通） -->
    <GlobalToast />
  </div>
</template>

<script setup lang="ts">
import MockNavBar from '@/components/MockNavBar.vue';
import GlobalToast from '@/components/GlobalToast.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

/** ナビバー非表示条件: ログインページ・顧問先ポータル・ゲスト許可ルート */
const hideNavBar = computed(() =>
  route.path === '/login'
  || route.path.startsWith('/portal')
  || route.path.startsWith('/guest')
  || route.path.endsWith('/guest')
  || !!route.meta.guestAllowed
);
</script>

<style>
/* Global styles are imported in main.ts */
</style>


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
  </div>
</template>

<script setup lang="ts">
import MockNavBar from '@/mocks/components/MockNavBar.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();

/** ナビバー非表示条件: ログインページ・顧問先ポータル */
const hideNavBar = computed(() =>
  route.path === '/login'
  || route.path.startsWith('/portal')
  || route.path.startsWith('/guest')
);
</script>

<style>
/* Global styles are imported in main.ts */
</style>

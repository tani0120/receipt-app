
<template>
  <div id="app" class="flex flex-col bg-slate-50 text-slate-700 font-sans h-screen overflow-hidden">
    <!-- 統一ナビバー（ログインページ・顧問先ポータル以外） -->
    <MockNavBar v-if="!hideNavBar" />

    <!-- Main Content -->
    <main :class="[
      'flex-1 overflow-hidden relative',
      hideNavBar ? 'bg-white p-0' : 'bg-slate-100 p-4'
    ]">
         <router-view v-slot="{ Component, route: viewRoute }">
            <KeepAlive :max="5">
              <component :is="Component" :key="viewRoute.path" />
            </KeepAlive>
          </router-view>
    </main>

    <!-- グローバルトースト通知（全画面共通） -->
    <GlobalToast />

    <!-- AIコマンド チャットUI（ログイン・ポータル・ゲスト以外） -->
    <template v-if="!hideNavBar">
      <AiChatWindow :is-open="aiChatOpen" @close="aiChatOpen = false" />
      <AiFloatingButton :is-open="aiChatOpen" @toggle="aiChatOpen = !aiChatOpen" />
    </template>
  </div>
</template>

<script setup lang="ts">
import MockNavBar from '@/components/MockNavBar.vue';
import GlobalToast from '@/components/GlobalToast.vue';
import AiFloatingButton from '@/components/ai/AiFloatingButton.vue';
import AiChatWindow from '@/components/ai/AiChatWindow.vue';
import { useRoute } from 'vue-router';
import { computed, ref } from 'vue';

/** AIチャットウィンドウ開閉状態 */
const aiChatOpen = ref(false);

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

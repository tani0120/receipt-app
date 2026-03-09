
<template>
  <div id="app" class="flex flex-col h-full bg-slate-50 text-slate-700 font-sans h-screen overflow-hidden">
    <!-- 統一ナビバー -->
    <MockNavBar />

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden relative bg-slate-100 p-4">
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
</script>

<style>
/* Global styles are imported in main.ts */
</style>

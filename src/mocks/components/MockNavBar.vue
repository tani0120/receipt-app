<template>
  <div>
    <!-- 上部バー（白背景・ナビバーの1.2倍高）ロゴ + 管理メニュー -->
    <div class="bg-white border-b border-gray-200 flex items-center justify-between px-3" style="height: 41px; font-family: 'Noto Sans JP', sans-serif">
      <!-- 左: ロゴ（トリミング済みPNG） -->
      <img src="/sugu-suru-logo.png" alt="sugu-suru" style="height: 30px" />
      <!-- 右: 管理メニュー -->
      <div class="flex items-center gap-1 text-[12px] font-medium text-gray-600">
        <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-sky-50 hover:text-sky-700 transition-all" @click="router.push('/clients')">
          <i class="fa-solid fa-building text-[10px]"></i>顧問先管理
        </button>
        <span class="text-gray-300">|</span>
        <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-sky-50 hover:text-sky-700 transition-all" @click="showNotImplemented('スタッフ管理')">
          <i class="fa-solid fa-users text-[10px]"></i>スタッフ管理
        </button>
        <span class="text-gray-300">|</span>
        <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-sky-50 hover:text-sky-700 transition-all" @click="router.push('/master')">
          <i class="fa-solid fa-database text-[10px]"></i>マスタ管理
        </button>
        <span class="text-gray-300">|</span>
        <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-sky-50 hover:text-sky-700 transition-all" @click="showNotImplemented('想定費用')">
          <i class="fa-solid fa-calculator text-[10px]"></i>想定費用
        </button>
        <span class="text-gray-300">|</span>
        <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-sky-50 hover:text-sky-700 transition-all" @click="router.push('/settings')">
          <i class="fa-solid fa-gear text-[10px]"></i>設定管理
        </button>
      </div>
    </div>
    <div class="bg-sky-600 px-3 py-1.5 flex items-center gap-4 text-[11px] tracking-[0.5px] text-white font-semibold" style="font-family: 'Noto Sans JP', sans-serif">
    <button class="flex items-center gap-1 hover:text-sky-100 transition-colors" :class="{ 'text-sky-200 border-b-2 border-white pb-0.5': isActive('home') }" @click="router.push('/journal-list')">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"/></svg>
      ホーム
    </button>
    <button class="flex items-center gap-1 hover:text-sky-100 transition-colors" :class="{ 'text-sky-200 border-b-2 border-white pb-0.5': isActive('upload') }">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
      アップロード
    </button>
    <button class="flex items-center gap-1 hover:text-sky-100 transition-colors" :class="{ 'text-sky-200 border-b-2 border-white pb-0.5': isActive('export') }">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      出力
    </button>
    <button class="flex items-center gap-1 hover:text-sky-100 transition-colors" :class="{ 'text-sky-200 border-b-2 border-white pb-0.5': isActive('learning') }">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
      学習
    </button>
    <button class="flex items-center gap-1 hover:text-sky-100 transition-colors" :class="{ 'text-sky-200 border-b-2 border-white pb-0.5': isActive('settings') }" @click="router.push('/settings')">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      設定
    </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const props = defineProps<{
  activeItem?: string;
}>();

const isActive = (item: string): boolean => {
  if (props.activeItem) return props.activeItem === item;
  // ルートパスから自動判定
  if (item === 'settings' && route.path === '/settings') return true;
  if (item === 'home' && route.path === '/journal-list') return true;
  return false;
};

const showNotImplemented = (name: string) => {
  globalThis.alert(`${name}は未実装です`);
};
</script>

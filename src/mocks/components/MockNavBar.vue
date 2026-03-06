<template>
  <div>
    <!-- 上段バー（白背景）ロゴ + 管理メニュー -->
    <div class="bg-white border-b border-gray-200 flex items-center justify-between px-3" style="height: 41px; font-family: 'Noto Sans JP', sans-serif">
      <!-- 左: ロゴ -->
      <img src="/sugu-suru-logo.png" alt="sugu-suru" style="height: 30px" />
      <!-- 右: 管理メニュー（データ駆動） -->
      <div class="flex items-center gap-1 text-[12px] font-medium text-gray-600">
        <template v-for="(item, index) in topItems" :key="item.key">
          <button
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all"
            :class="isTopActive(item) ? 'bg-sky-50 text-sky-700' : 'hover:bg-sky-50 hover:text-sky-700'"
            @click="handleTopClick(item)"
          >
            <i :class="item.icon" class="text-[10px]"></i>{{ item.label }}
          </button>
          <span v-if="index < topItems.length - 1" class="text-gray-300">|</span>
        </template>
      </div>
    </div>
    <!-- 下段バー（sky-600）ナビゲーション -->
    <div class="bg-sky-600 px-3 py-1.5 flex items-center gap-4 text-[11px] tracking-[0.5px] text-white font-semibold" style="font-family: 'Noto Sans JP', sans-serif">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="flex items-center gap-1 transition-colors"
        :class="isNavActive(item) ? 'text-sky-200 border-b-2 border-white pb-0.5' : 'hover:text-sky-100'"
        @click="handleNavClick(item)"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            v-for="(d, i) in item.svgPaths"
            :key="i"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="d"
          />
        </svg>
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// --- 上段バー: 管理メニュー項目定義 ---
interface TopItem {
  key: string;
  label: string;
  icon: string;
  path: string | null;
}

const topItems: TopItem[] = [
  { key: 'clients',  label: '顧問先管理',   icon: 'fa-solid fa-building',    path: null },
  { key: 'staff',    label: 'スタッフ管理', icon: 'fa-solid fa-users',       path: null },
  { key: 'master',   label: 'マスタ管理',   icon: 'fa-solid fa-database',    path: '/master' },
  { key: 'cost',     label: '想定費用',     icon: 'fa-solid fa-calculator',  path: null },
  { key: 'settings', label: '設定管理',     icon: 'fa-solid fa-gear',        path: null },
];

const isTopActive = (item: TopItem): boolean =>
  item.path !== null && route.path.startsWith(item.path);

const handleTopClick = (item: TopItem): void => {
  if (item.path) {
    router.push(item.path);
  } else {
    globalThis.alert(`${item.label}は未実装です`);
  }
};

// --- 下段バー: ナビゲーション項目定義 ---
interface NavItem {
  key: string;
  label: string;
  svgPaths: string[];
  path: string | null;
}

const navItems: NavItem[] = [
  {
    key: 'home',
    label: 'ホーム',
    svgPaths: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4'],
    path: '/journal-list',
  },
  {
    key: 'upload',
    label: 'アップロード',
    svgPaths: ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'],
    path: null,
  },
  {
    key: 'export',
    label: '出力',
    svgPaths: ['M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
    path: null,
  },
  {
    key: 'learning',
    label: '学習',
    svgPaths: ['M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'],
    path: null,
  },
  {
    key: 'settings',
    label: '設定',
    svgPaths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
    path: '/settings',
  },
];

const isNavActive = (item: NavItem): boolean =>
  item.path !== null && route.path === item.path;

const handleNavClick = (item: NavItem): void => {
  if (item.path) {
    router.push(item.path);
  } else {
    globalThis.alert(`${item.label}は未実装です`);
  }
};
</script>

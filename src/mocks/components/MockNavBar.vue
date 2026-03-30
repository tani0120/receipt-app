<template>
  <div>
    <!-- 上段バー（白背景）ロゴ + 管理メニュー -->
    <div class="bg-white border-b border-gray-200 flex items-center justify-between px-3" style="height: 53px; font-family: 'Noto Sans JP', sans-serif">
      <!-- 左: ロゴ + 旧ページリンク -->
      <div class="flex items-center gap-3">
        <img src="/sugu-suru-logo.png" alt="sugu-suru" style="height: 30px" />
        <!-- クライアント名動的表示 -->
        <div v-if="currentClient && !isMasterPage" class="flex items-center gap-2 border-l-2 border-sky-400 pl-3 ml-2">
          <span class="bg-sky-600 text-white font-extrabold px-2 py-0.5 rounded text-[13px] tracking-wider shadow-sm">{{ currentClient.threeCode }}</span>
          <span class="text-[14px] font-bold text-sky-800">{{ currentClient.companyName }}</span>
        </div>
        <div class="relative">
          <button
            class="text-[11px] text-gray-400 hover:text-sky-600 transition-colors flex items-center gap-1"
            @click="showLegacyMenu = !showLegacyMenu"
          >
            <i class="fa-solid fa-clock-rotate-left"></i>旧ページ
            <i class="fa-solid fa-caret-down text-[9px]"></i>
          </button>
          <div v-if="showLegacyMenu" class="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[180px] py-1">
            <button v-for="item in legacyItems" :key="item.path" class="w-full text-left px-3 py-1.5 text-[11px] text-gray-600 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2" @click="goLegacy(item.path)">
              <i :class="item.icon" class="text-[10px] w-3 text-center"></i>{{ item.label }}
            </button>
          </div>
        </div>
      </div>
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
    <!-- 下段バー（sky-600）ナビゲーション: 個別会社エリアのみ表示 -->
    <div v-if="currentClient && !isMasterPage" class="bg-sky-600 px-3 py-1.5 flex items-center text-[11.5px] tracking-[0.5px] text-white font-semibold" style="font-family: 'Noto Sans JP', sans-serif">
      <!-- 左: ナビ項目 -->
      <div class="flex items-center gap-4">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useClients } from '@/features/client-management/composables/useClients';

const router = useRouter();
const route = useRoute();

// --- クライアント情報（useClients composableから取得） ---
const { currentClient } = useClients();

// マスタページ（/master/）では顧問先コンテキストを非表示にする
const isMasterPage = computed(() => route.path.startsWith('/master/'));

// --- 旧ページメニュー ---
const showLegacyMenu = ref(false);
const legacyItems = [
  { label: 'B:仕訳ステータス', icon: 'fa-solid fa-calculator', path: '/old/journals/demo' },
  { label: 'C:回収状況',       icon: 'fa-solid fa-calendar-days', path: '/old/collection/demo' },
  { label: 'D:AIルール',       icon: 'fa-solid fa-brain', path: '/old/ai-rules/demo' },
  { label: 'G:データ変換',     icon: 'fa-solid fa-arrow-right-arrow-left', path: '/old/data-conversion/demo' },
  { label: 'H:タスク管理',     icon: 'fa-solid fa-list-check', path: '/old/tasks/demo' },
  { label: 'Z:管理者設定',     icon: 'fa-solid fa-screwdriver-wrench', path: '/old/admin' },
];
const goLegacy = (path: string) => {
  showLegacyMenu.value = false;
  router.push(path);
};

// --- 上段バー: 管理メニュー項目定義 ---
interface TopItem {
  key: string;
  label: string;
  icon: string;
  path: string | null;
  managedPaths: string[];
}

const topItems: TopItem[] = [
  { key: 'progress', label: '進捗管理',       icon: 'fa-solid fa-bars-progress',   path: '/master/progress',       managedPaths: ['/master/progress'] },
  { key: 'clients',  label: '顧問先管理',     icon: 'fa-solid fa-building',        path: '/master/clients',    managedPaths: ['/master/clients'] },
  { key: 'staff',    label: 'スタッフ管理',   icon: 'fa-solid fa-users',           path: '/master/staff',      managedPaths: ['/master/staff'] },
  { key: 'accounts', label: '勘定科目マスタ', icon: 'fa-solid fa-book',            path: '/master/accounts',   managedPaths: ['/master/accounts'] },
  { key: 'tax',      label: '税区分マスタ',   icon: 'fa-solid fa-percent',         path: '/master/tax',        managedPaths: ['/master/tax'] },
  { key: 'costs',    label: '想定費用',       icon: 'fa-solid fa-calculator',      path: '/master/costs',      managedPaths: ['/master/costs'] },
  { key: 'settings', label: '設定管理',       icon: 'fa-solid fa-gear',            path: '/master/settings',   managedPaths: ['/master/settings'] },
];

const isTopActive = (item: TopItem): boolean =>
  item.managedPaths.some(p => route.path.startsWith(p));

const handleTopClick = (item: TopItem): void => {
  if (item.path) {
    // 事務所共通ページはそのまま遷移（/master/xxx）
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
    path: '/client/journal-list',
  },
  {
    key: 'drive',
    label: 'Drive資料選別',
    svgPaths: ['M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'],
    path: '/client/drive-select',
  },
  {
    key: 'upload',
    label: 'アップロード',
    svgPaths: ['M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'],
    path: '/client/upload',
  },
  {
    key: 'export',
    label: '出力',
    svgPaths: ['M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'],
    path: '/client/export',
  },
  {
    key: 'learning',
    label: '学習',
    svgPaths: ['M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'],
    path: '/client/learning',
  },
  {
    key: 'settings',
    label: '設定',
    svgPaths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
    path: '/client/settings',
  },
];

const isNavActive = (item: NavItem): boolean => {
  if (item.path === null) return false;
  // settingsトップは /client/settings/:clientId パターン
  if (item.key === 'settings') return route.path.match(/^\/client\/settings\/[^/]+$/) !== null;
  return route.path.startsWith(item.path + '/');
};

const handleNavClick = (item: NavItem): void => {
  if (item.path) {
    const cid = currentClient.value?.clientId ?? 'ABC-00001';
    // 全て /xxx/:clientId 形式に統一
    router.push(`${item.path}/${cid}`);
  } else {
    globalThis.alert(`${item.label}は未実装です`);
  }
};
</script>

<template>
  <div class="home-layout">
    <!-- 左サイドバー（20%） -->
    <aside class="home-sidebar">
      <div class="sidebar-header">
        <i class="fa-solid fa-grip sidebar-header-icon"></i>
        <span>メニュー</span>
        <span class="sidebar-header-hint">ドラッグで並替</span>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="(item, index) in sortedMenuItems"
          :key="item.key"
          class="menu-btn"
          :class="{
            'menu-btn--disabled': !item.path,
            'menu-btn--dragging': dragIndex === index,
            'menu-btn--drop-above': dropTarget === index && dragIndex !== null && dragIndex > index,
            'menu-btn--drop-below': dropTarget === index && dragIndex !== null && dragIndex < index,
          }"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent="onDragOver(index)"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
          @click="handleMenuClick(item)"
        >
          <div class="menu-btn-icon" :style="{ background: item.color }">
            <i :class="item.icon"></i>
          </div>
          <div class="menu-btn-body">
            <span class="menu-btn-label">{{ item.label }}</span>
            <span v-if="!item.path" class="menu-btn-wip">作成中</span>
          </div>
          <i class="fa-solid fa-grip-vertical menu-btn-grip"></i>
        </button>
      </nav>
    </aside>

    <!-- 右メインコンテンツ（80%） -->
    <main class="home-main">
      <div class="calendar-placeholder">
        <div class="placeholder-icon">
          <i class="fa-regular fa-calendar-days"></i>
        </div>
        <h2 class="placeholder-title">カレンダー</h2>
        <p class="placeholder-sub">今後ここにスケジュール・期限管理カレンダーを表示予定</p>
        <div class="placeholder-badge">
          <i class="fa-solid fa-code"></i>
          実装予定
        </div>
      </div>
    </main>

    <!-- 作成中トースト -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="showToast" class="wip-toast">
          <i class="fa-solid fa-hammer"></i>
          <span>{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUser } from '@/mocks/composables/useCurrentUser'

const router = useRouter()
const { currentStaffId } = useCurrentUser()

// ===== トースト =====
const showToast = ref(false)
const toastMessage = ref('')

function showWipToast(label: string) {
  toastMessage.value = `「${label}」は作成中です...`
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2500)
}

// ===== メニュー定義 =====
interface MenuItem {
  key: string
  label: string
  icon: string
  color: string
  path: string | null
}

const defaultMenuItems: MenuItem[] = [
  { key: 'pipeline',   label: '見込管理',     icon: 'fa-solid fa-chart-line',             color: 'linear-gradient(135deg, #f97316, #ea580c)', path: null },
  { key: 'progress',   label: '進捗管理',     icon: 'fa-solid fa-bars-progress',          color: 'linear-gradient(135deg, #3b82f6, #2563eb)', path: '/master/progress' },
  { key: 'clients',    label: '顧問先管理',   icon: 'fa-solid fa-building',               color: 'linear-gradient(135deg, #06b6d4, #0891b2)', path: '/master/clients' },
  { key: 'collection', label: '資料回収',     icon: 'fa-solid fa-folder-open',            color: 'linear-gradient(135deg, #14b8a6, #0d9488)', path: '/collection' },
  { key: 'partners',   label: '提携管理',     icon: 'fa-solid fa-handshake',              color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', path: null },
  { key: 'staff',      label: 'スタッフ管理', icon: 'fa-solid fa-users',                  color: 'linear-gradient(135deg, #10b981, #059669)', path: '/master/staff' },
  { key: 'master',     label: 'マスタ管理',   icon: 'fa-solid fa-warehouse',              color: 'linear-gradient(135deg, #6366f1, #4f46e5)', path: '/master' },
  { key: 'costs',      label: '想定費用',     icon: 'fa-solid fa-calculator',             color: 'linear-gradient(135deg, #f59e0b, #d97706)', path: '/master/costs' },
  { key: 'settings',   label: '設定管理',     icon: 'fa-solid fa-gear',                   color: 'linear-gradient(135deg, #64748b, #475569)', path: '/master/settings' },
  { key: 'conversion', label: 'CSV変換',       icon: 'fa-solid fa-arrow-right-arrow-left', color: 'linear-gradient(135deg, #ec4899, #db2777)', path: '/csv-convert' },
  { key: 'tasks',      label: 'タスク管理',   icon: 'fa-solid fa-list-check',             color: 'linear-gradient(135deg, #ef4444, #dc2626)', path: '/task-board' },
]

// ===== スタッフ別メニュー順序永続化 =====
const menuOrder = ref<string[]>([])

const storageKey = computed(() =>
  `home_menu_order_${currentStaffId.value || 'default'}`
)

function loadMenuOrder() {
  try {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      const keys = JSON.parse(saved) as string[]
      // 保存済みキーが全メニューをカバーしているか検証
      const allKeys = defaultMenuItems.map(m => m.key)
      if (keys.length === allKeys.length && keys.every(k => allKeys.includes(k))) {
        menuOrder.value = keys
        return
      }
    }
  } catch { /* 破損データは無視 */ }
  menuOrder.value = defaultMenuItems.map(m => m.key)
}

function saveMenuOrder() {
  localStorage.setItem(storageKey.value, JSON.stringify(menuOrder.value))
}

const sortedMenuItems = computed<MenuItem[]>(() => {
  const map = new Map(defaultMenuItems.map(m => [m.key, m]))
  return menuOrder.value.map(key => map.get(key)!).filter(Boolean)
})

onMounted(() => {
  loadMenuOrder()
})

// ===== ドラッグ＆ドロップ =====
const dragIndex = ref<number | null>(null)
const dropTarget = ref<number | null>(null)

function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number) {
  dropTarget.value = index
}

function onDragLeave() {
  dropTarget.value = null
}

function onDrop(targetIndex: number) {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return
  const newOrder = [...menuOrder.value]
  const moved = newOrder.splice(dragIndex.value, 1)[0]
  if (moved) newOrder.splice(targetIndex, 0, moved)
  menuOrder.value = newOrder
  saveMenuOrder()
  dropTarget.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dropTarget.value = null
}

// ===== メニュークリック =====
function handleMenuClick(item: MenuItem) {
  if (item.path) {
    router.push(item.path)
  } else {
    showWipToast(item.label)
  }
}
</script>

<style scoped>
/* ===== レイアウト ===== */
.home-layout {
  display: flex;
  height: 100%;
  margin: -16px;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
}

/* ===== 左サイドバー ===== */
.home-sidebar {
  width: 240px;
  min-width: 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 18px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f1f5f9;
}

.sidebar-header-icon {
  font-size: 14px;
  color: #94a3b8;
}

.sidebar-header-hint {
  margin-left: auto;
  font-size: 10px;
  font-weight: 500;
  color: #cbd5e1;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  gap: 6px;
}

/* ===== メニューボタン ===== */
.menu-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.menu-btn:hover {
  border-color: #93c5fd;
  background: linear-gradient(135deg, #f0f9ff, #eff6ff);
  box-shadow:
    0 4px 12px rgba(59, 130, 246, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
}

.menu-btn:active {
  transform: scale(0.97);
  cursor: grabbing;
}

.menu-btn--disabled {
  opacity: 0.5;
  border-style: dashed;
  border-color: #e2e8f0;
}

.menu-btn--disabled:hover {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
}

.menu-btn--dragging {
  opacity: 0.3;
  transform: scale(0.95);
}

.menu-btn--drop-above {
  border-top: 3px solid #3b82f6;
  padding-top: 9px;
}

.menu-btn--drop-below {
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 9px;
}

.menu-btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.menu-btn-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.menu-btn-label {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.menu-btn-wip {
  font-size: 10px;
  font-weight: 600;
  color: #f59e0b;
}

.menu-btn-grip {
  font-size: 11px;
  color: #d1d5db;
  opacity: 0;
  transition: opacity 0.15s;
}

.menu-btn:hover .menu-btn-grip {
  opacity: 1;
}

/* ===== 右メインコンテンツ ===== */
.home-main {
  flex: 1;
  background: linear-gradient(160deg, #f8fafc 0%, #f0f4f8 40%, #f5f0fa 70%, #faf5f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.calendar-placeholder {
  text-align: center;
  padding: 60px 48px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.04),
    0 1px 4px rgba(0, 0, 0, 0.02);
  max-width: 480px;
  width: 100%;
  animation: fadeUp 0.5s ease-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #eff6ff, #ede9fe);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #3b82f6;
}

.placeholder-title {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px;
}

.placeholder-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 24px;
  line-height: 1.7;
}

.placeholder-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}

/* ===== トースト ===== */
.wip-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: #1e293b;
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Noto Sans JP', sans-serif;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

.wip-toast i {
  color: #fbbf24;
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.25s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>

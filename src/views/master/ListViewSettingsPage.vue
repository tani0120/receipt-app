<template>
  <div class="lvs-page">
    <!-- ヘッダー -->
    <div class="lvs-header">
      <button class="lvs-back-btn" @click="goBack">
        <i class="fa-solid fa-arrow-left"></i> {{ entityLabel }}管理に戻る
      </button>
      <h1 class="lvs-title">一覧の設定</h1>
      <p class="lvs-desc">表示する列やフィルタ条件を定義した一覧ビューを管理します。一番上のビューがデフォルト表示になります。</p>
    </div>

    <!-- ビュー一覧（D&D並替対応） -->
    <VueDraggable
      v-model="editableViewsList"
      class="lvs-list"
      handle=".lvs-item-handle"
      :animation="200"
      ghost-class="lvs-ghost"
      @end="onDragEnd"
    >
      <div
        v-for="(view, idx) in editableViewsList"
        :key="view.key"
        class="lvs-item"
      >
        <div class="lvs-item-handle">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
        <div class="lvs-item-info">
          <span class="lvs-item-name">{{ view.name }}</span>
          <span class="lvs-item-cols">{{ view.columns ? view.columns.length + '列' : '全列' }}</span>
          <span v-if="idx === 0" class="lvs-item-default">デフォルト</span>
        </div>
        <div class="lvs-item-actions">
          <button class="lvs-action-btn" title="編集" @click="editView(view.key)">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="lvs-action-btn" title="複製" @click="duplicateView(view.key)">
            <i class="fa-regular fa-copy"></i>
          </button>
          <button class="lvs-action-btn danger" title="削除" @click="deleteView(view.key)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </VueDraggable>

    <!-- 固定ビュー（すべて） -->
    <div class="lvs-list">
      <div class="lvs-item lvs-item-builtin">
        <div class="lvs-item-handle lvs-handle-disabled">
          <i class="fa-solid fa-lock"></i>
        </div>
        <div class="lvs-item-info">
          <span class="lvs-item-name">（すべて）</span>
          <span class="lvs-item-cols">全列・レイアウト管理順</span>
        </div>
        <div class="lvs-item-actions">
          <span class="lvs-builtin-label">編集不可</span>
        </div>
      </div>
    </div>

    <!-- 追加ボタン -->
    <div class="lvs-add-area">
      <button class="lvs-add-btn" @click="addView">
        <i class="fa-solid fa-plus"></i> 一覧を追加する
      </button>
    </div>

    <!-- 確認モーダル -->
    <ConfirmModal
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-label="confirmState.confirmLabel"
      :cancel-label="confirmState.cancelLabel"
      :variant="confirmState.variant"
      @confirm="confirmState.onConfirm"
      @cancel="confirmState.onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ListViewDef } from '@/components/list-view/types';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { VueDraggable } from 'vue-draggable-plus';

const route = useRoute();
const router = useRouter();

/** エンティティタイプ判定（URLパスから） */
const entityType = computed(() => {
  if (route.path.includes('/progress/')) return 'progress';
  if (route.path.includes('/leads/')) return 'lead';
  return 'client';
});
const entityLabel = computed(() => {
  if (entityType.value === 'progress') return '進捗';
  if (entityType.value === 'lead') return '見込先';
  return '顧問先';
});

/** ビューデータ */
const views = ref<ListViewDef[]>([]);
const editableViews = computed(() => views.value.filter(v => !v.isBuiltin));

/** D&D用の書き込み可能な配列 */
const editableViewsList = ref<ListViewDef[]>([]);

/** API: ビュー一覧取得 */
const loadViews = async () => {
  try {
    const res = await fetch(`/api/list-views/${entityType.value}`);
    const data = await res.json();
    views.value = data.views ?? [];
  } catch (e) {
    console.error('[ListViewSettings] ビュー取得失敗:', e);
  }
};

/** API: ビュー一覧保存 */
const saveViews = async () => {
  try {
    await fetch(`/api/list-views/${entityType.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ views: views.value }),
    });
  } catch (e) {
    console.error('[ListViewSettings] ビュー保存失敗:', e);
  }
};

/** 戻る */
const goBack = () => {
  const pathMap: Record<string, string> = { progress: '/master/progress', lead: '/master/leads', client: '/master/clients' };
  router.push(pathMap[entityType.value] ?? '/master/clients');
};

/** 編集 */
const editView = (viewKey: string) => {
  const nameMap: Record<string, string> = { progress: 'ProgressViewEdit', lead: 'LeadViewEdit', client: 'ClientViewEdit' };
  router.push({ name: nameMap[entityType.value] ?? 'ClientViewEdit', params: { viewKey } });
};

/** 追加 */
const addView = () => {
  const key = crypto.randomUUID().slice(0, 8);
  const newView: ListViewDef = {
    key,
    name: '新しい一覧',
    columns: null,
    defaultFilters: [],
    defaultSorts: [],
  };
  views.value.push(newView);
  saveViews().then(() => editView(key));
};

/** 複製 */
const duplicateView = (viewKey: string) => {
  const src = views.value.find(v => v.key === viewKey);
  if (!src) return;
  const key = crypto.randomUUID().slice(0, 8);
  const dup: ListViewDef = {
    ...JSON.parse(JSON.stringify(src)),
    key,
    name: src.name + '（コピー）',
  };
  const idx = views.value.findIndex(v => v.key === viewKey);
  views.value.splice(idx + 1, 0, dup);
  saveViews();
};

/** 削除 */
const confirmState = ref({
  show: false,
  title: '',
  message: '',
  confirmLabel: '削除',
  cancelLabel: 'キャンセル',
  variant: 'danger' as const,
  onConfirm: () => {},
  onCancel: () => { confirmState.value.show = false; },
});

const deleteView = (viewKey: string) => {
  const view = views.value.find(v => v.key === viewKey);
  if (!view) return;
  confirmState.value = {
    ...confirmState.value,
    show: true,
    title: '一覧を削除',
    message: `「${view.name}」を削除してよろしいですか？`,
    onConfirm: () => {
      views.value = views.value.filter(v => v.key !== viewKey);
      saveViews();
      confirmState.value.show = false;
    },
    onCancel: () => { confirmState.value.show = false; },
  };
};

/** D&D完了時にviewsを更新して保存 */
const onDragEnd = () => {
  const builtins = views.value.filter(v => v.isBuiltin);
  views.value = [...editableViewsList.value, ...builtins];
  saveViews();
};

onMounted(async () => {
  await loadViews();
  editableViewsList.value = editableViews.value;
});

// KeepAlive復帰時（ビュー編集ページから戻った時）にAPIから再取得
let isFirstActivation = true;
onActivated(async () => {
  if (isFirstActivation) {
    isFirstActivation = false;
    return;
  }
  await loadViews();
});

watch(editableViews, (newVal) => {
  editableViewsList.value = [...newVal];
});
</script>

<style scoped>
.lvs-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: 'Inter', 'Hiragino Sans', sans-serif;
}

.lvs-header {
  margin-bottom: 32px;
}

.lvs-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #4a7cf7;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 16px;
}
.lvs-back-btn:hover {
  text-decoration: underline;
}

.lvs-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.lvs-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* ビュー一覧 */
.lvs-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

.lvs-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.lvs-item:hover {
  border-color: #94a3b8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.lvs-item-handle {
  cursor: grab;
  color: #94a3b8;
  font-size: 14px;
  padding: 4px;
}
.lvs-item-handle:active {
  cursor: grabbing;
}
.lvs-handle-disabled {
  cursor: default;
  color: #cbd5e1;
}

.lvs-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.lvs-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.lvs-item-cols {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.lvs-item-default {
  font-size: 11px;
  font-weight: 600;
  color: #4a7cf7;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.lvs-item-actions {
  display: flex;
  gap: 4px;
}

.lvs-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.lvs-action-btn:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #334155;
}
.lvs-action-btn.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.lvs-item-builtin {
  background: #f8fafc;
  border-color: #e2e8f0;
  border-style: dashed;
}

.lvs-builtin-label {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
}

/* 追加ボタン */
.lvs-add-area {
  padding: 8px 0;
}

.lvs-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4a7cf7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.lvs-add-btn:hover {
  background: #3b6ce6;
}

/* SortableJSゴースト */
.lvs-ghost {
  opacity: 0.4;
  background: #eff6ff;
}
</style>

<template>
  <!-- Adapter: Composable（Ref） → Dumb Component（Props） の橋渡し -->
  <DriveFileListView v-bind="props" />
</template>

<script setup lang="ts">
import { reactive, watchEffect } from 'vue';
import { useDriveFileListMock } from '@/composables/useDriveFileListMock';
import DriveFileListView from '@/components/DriveFileListView.vue';
import type { DriveFileListProps } from '@/types/DriveFileList.types';

/**
 * Adapter: DriveFileList Container
 *
 * 役割:
 * - Composable（Ref/Reactive）を取得
 * - UI契約（DriveFileListProps = 値のみ）に変換
 * - Dumb Component に渡す
 *
 * これにより:
 * - UI契約の純度を維持（Vue非依存）
 * - リアクティブ性を実現
 * - 責務分離が明確
 */

// 1. Composable から状態を取得（Ref）
const state = useDriveFileListMock();

// 2. UI契約（値のみ）を作成
const props = reactive<DriveFileListProps>({
  clients: state.clients,
  selectedClientId: null,
  files: [],
  isLoadingFiles: false,
  processingFileId: null,
  createdJobId: null,
  error: null,

  onSelectClient: state.onSelectClient,
  onProcessFile: state.onProcessFile,
});

// 3. Ref → 値 の変換（Adapter の核心）
watchEffect(() => {
  props.selectedClientId = state.selectedClientId.value;
  props.files = state.files.value;
  props.isLoadingFiles = state.isLoadingFiles.value;
  props.processingFileId = state.processingFileId.value;
  props.createdJobId = state.createdJobId.value;
  props.error = state.error.value;
});
</script>


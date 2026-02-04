<template>
  <div>
    <h1>Drive File List (Phase 6.1 MVP)</h1>

    <!-- エラー表示 -->
    <div v-if="error" style="color: red; margin-bottom: 1rem">
      エラー: {{ error }}
    </div>

    <!-- 成功メッセージ（jobId生成時） -->
    <div v-if="createdJobId" style="color: green; margin-bottom: 1rem">
      成功: jobId = {{ createdJobId }}
    </div>

    <!-- 顧問先選択 -->
    <section style="margin-bottom: 2rem">
      <h2>顧問先選択</h2>
      <table border="1" style="border-collapse: collapse">
        <thead>
          <tr>
            <th style="padding: 0.5rem">選択</th>
            <th style="padding: 0.5rem">顧問先ID</th>
            <th style="padding: 0.5rem">3コード</th>
            <th style="padding: 0.5rem">顧問先名</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="client in clients"
            :key="client.clientId"
            :style="{
              backgroundColor:
                selectedClientId === client.clientId ? '#e0e0e0' : 'transparent',
            }"
          >
            <td style="padding: 0.5rem; text-align: center">
              <button @click="onSelectClient(client.clientId)">選択</button>
            </td>
            <td style="padding: 0.5rem">{{ client.clientId }}</td>
            <td style="padding: 0.5rem">{{ client.code }}</td>
            <td style="padding: 0.5rem">{{ client.name }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ファイル一覧 -->
    <section v-if="selectedClientId">
      <h2>ファイル一覧</h2>

      <!-- 読み込み中 -->
      <div v-if="isLoadingFiles">読み込み中...</div>

      <!-- ファイル一覧テーブル -->
      <table v-else border="1" style="border-collapse: collapse">
        <thead>
          <tr>
            <th style="padding: 0.5rem">操作</th>
            <th style="padding: 0.5rem">File ID</th>
            <th style="padding: 0.5rem">ファイル名</th>
            <th style="padding: 0.5rem">MIME Type</th>
            <th style="padding: 0.5rem">アップロード日時</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in files" :key="file.fileId">
            <td style="padding: 0.5rem; text-align: center">
              <button
                @click="onProcessFile(file.fileId)"
                :disabled="processingFileId === file.fileId"
              >
                {{
                  processingFileId === file.fileId ? '処理中...' : 'OCR実行'
                }}
              </button>
            </td>
            <td style="padding: 0.5rem">{{ file.fileId }}</td>
            <td style="padding: 0.5rem">{{ file.name }}</td>
            <td style="padding: 0.5rem">{{ file.mimeType }}</td>
            <td style="padding: 0.5rem">{{ file.uploadedAt }}</td>
          </tr>
        </tbody>
      </table>

      <!-- ファイルがない場合 -->
      <div v-if="files.length === 0 && !isLoadingFiles">
        ファイルがありません
      </div>
    </section>

    <!-- 顧問先未選択時のメッセージ -->
    <section v-else style="margin-top: 2rem; color: gray">
      顧問先を選択してください
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DriveFileListProps } from '@/types/DriveFileList.types';

/**
 * Dumb Component: DriveFileListView
 * - Props をそのまま描画
 * - .value 不要（値のみを受け取る）
 * - Vue を知らない（UI契約のみに依存）
 */
defineProps<DriveFileListProps>();
</script>

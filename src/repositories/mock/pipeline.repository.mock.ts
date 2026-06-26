/**
 * pipeline.repository.mock.ts — PipelineRepository モック実装（サーバーサイド用）
 *
 * 【依存方向】
 * サーバー → PipelineRepository(Mock) → インメモリ処理
 *
 * 準拠: DL-030
 */

import type { PipelineRepository, UploadCompleteResult } from '../types'

/** モック用: メトリクスは標準出力に記録 */
export const mockPipelineRepo: PipelineRepository = {
  uploadChunk: async (_chunk: Blob, _uploadId: string) => {
    // モックでは何もしない（サーバー側Expressルートが処理）
  },

  uploadComplete: async (_params): Promise<UploadCompleteResult> => {
    // モックでは空の結果を返す（サーバー側Expressルートが処理）
    return {}
  },

  sendMetrics: (data: Record<string, unknown>) => {
    console.log('[pipeline/metrics]', JSON.stringify(data))
  },

  sendMetricsBeacon: (data: Record<string, unknown>) => {
    console.log('[pipeline/metrics/beacon]', JSON.stringify(data))
  },

  clearHashes: () => {
    console.log('[pipeline/hashes] クリア')
  },
}

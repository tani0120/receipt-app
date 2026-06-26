/**
 * pipeline.repository.http.ts — PipelineRepository HTTP実装（フロントエンド用）
 *
 * 【依存方向】
 * フロント → PipelineRepository(HTTP) → /api/pipeline/*
 *
 * 【責務】
 * - チャンクアップロード（512KB単位のバイナリ送信）
 * - アップロード完了通知（チャンク結合+ハッシュ+サムネイル）
 * - メトリクス送信（fire-and-forget）
 * - 重複ハッシュ記録クリア
 *
 * Supabase移行時: このファイルをSupabase Storage API版に差し替えるだけで移行完了。
 *
 * 準拠: DL-030
 */

import type { PipelineRepository, UploadCompleteResult } from '../types'

const METRICS_URL = '/api/pipeline/metrics'

export const httpPipelineRepo: PipelineRepository = {
  uploadChunk: async (chunk: Blob, uploadId: string) => {
    const res = await fetch('/api/pipeline/upload-chunk', {
      method: 'POST',
      headers: {
        'X-Upload-Id': uploadId,
        'Content-Type': 'application/octet-stream',
      },
      body: chunk,
    })
    if (!res.ok) {
      throw new Error(`チャンク送信失敗 ${res.status}`)
    }
  },

  uploadComplete: async (params): Promise<UploadCompleteResult> => {
    const res = await fetch('/api/pipeline/upload-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      throw new Error(`アップロード完了失敗 ${res.status}`)
    }
    return await res.json()
  },

  sendMetrics: (data: Record<string, unknown>) => {
    fetch(METRICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {})
  },

  sendMetricsBeacon: (data: Record<string, unknown>) => {
    const json = JSON.stringify(data)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(METRICS_URL, new Blob([json], { type: 'application/json' }))
    } else {
      fetch(METRICS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      }).catch(() => {})
    }
  },

  clearHashes: () => {
    fetch('/api/pipeline/hashes', { method: 'DELETE' }).catch(() => {
      // サーバー未起動時は無視（モックモードでは不要）
    })
  },
}

/**
 * drive.repository.http.ts — DriveRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-2
 */

import { createApiClient } from '../../utils/apiClient'
import type { DriveRepository } from '../types'

const api = createApiClient('/api/drive')

export const httpDriveRepo: DriveRepository = {
  getFiles: async (folderId, withThumbnails) => {
    const params = new URLSearchParams({ folderId })
    if (withThumbnails) params.set('withThumbnails', 'true')
    return api.get(`/files?${params}`)
  },

  createFolder: async (data) => {
    return api.post('/folder', data)
  },

  checkFolder: async (folderId) => {
    return api.get(`/folder/check?folderId=${encodeURIComponent(folderId)}`)
  },

  upload: async (formData) => {
    const res = await fetch('/api/drive/upload', { method: 'POST', body: formData })
    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
    return res.json()
  },

  migrate: async (data) => {
    return api.post('/migrate', data)
  },

  getMigrateStatus: async (jobId) => {
    return api.get(`/migrate/status/${jobId}`)
  },

  getMigrateJobs: async (clientId) => {
    return api.get(`/migrate/jobs/${encodeURIComponent(clientId)}`)
  },

  downloadSupporting: async (clientId, params) => {
    const qs = new URLSearchParams()
    if (params?.jobId) qs.set('jobId', params.jobId)
    if (params?.all) qs.set('all', 'true')
    const qsStr = qs.toString()
    return api.get(`/download-supporting/${encodeURIComponent(clientId)}${qsStr ? '?' + qsStr : ''}`)
  },

  downloadExcluded: async (clientId, params) => {
    const qs = new URLSearchParams()
    if (params?.jobId) qs.set('jobId', params.jobId)
    if (params?.all) qs.set('all', 'true')
    const qsStr = qs.toString()
    return api.get(`/download-excluded/${encodeURIComponent(clientId)}${qsStr ? '?' + qsStr : ''}`)
  },

  getSupportingHistory: async (clientId) => {
    return api.get(`/supporting-history/${encodeURIComponent(clientId)}`)
  },

  getExcludedHistory: async (clientId) => {
    return api.get(`/excluded-history/${encodeURIComponent(clientId)}`)
  },

  saveSupportingMeta: async (clientId, data) => {
    return api.post(`/save-supporting-meta/${encodeURIComponent(clientId)}`, data)
  },

  grantPermission: async (data) => {
    return api.post('/grant-permission', data)
  },

  revokePermission: async (data) => {
    return api.post('/revoke-permission', data)
  },

  getExcludedCount: async (clientId) => {
    return api.get(`/excluded-count/${encodeURIComponent(clientId)}`)
  },

  pollClient: async (clientId) => {
    return api.post(`/poll/${encodeURIComponent(clientId)}`, {}) as Promise<{ ok: boolean; added?: number; error?: string }>
  },

  pollAll: async () => {
    return api.post('/poll-all', {}) as Promise<{ ok: boolean; targetCount: number; totalAdded: number; totalErrors: number; details: Array<{ clientId: string; companyName: string; added: number; error: string | null }> }>
  },
}

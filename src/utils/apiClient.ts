/**
 * apiClient — ストア共通HTTPクライアント
 *
 * 各ストアでコピペされていたapiGet/apiPost/apiPutを共通化。
 * fetchWithRetryを内部で使用し、API未起動時の自動リトライを一元管理。
 *
 * 使い方:
 *   const api = createApiClient('/api/clients')
 *   const data = await api.get<{ clients: Client[] }>('')
 *   await api.post('/list', { page: 1 })
 *   await api.put(`/${id}`, { name: 'new' })
 *
 * Supabase移行時: このファイルのfetch呼び出しを置き換えるだけで全ストア移行完了。
 */
import { fetchWithRetry } from '@/utils/fetchWithRetry'

export interface ApiClient {
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body: unknown) => Promise<T>
  put: (path: string, body: unknown) => Promise<void>
  patch: <T>(path: string, body: unknown) => Promise<T>
  del: (path: string) => Promise<void>
}

/**
 * APIベースURLを受け取り、get/post/putメソッドを返すファクトリ。
 * GET のみ fetchWithRetry（API起動待ちリトライ）を適用。
 * POST/PUT はユーザー操作トリガーのため、リトライ不要。
 */
export function createApiClient(baseUrl: string): ApiClient {
  return {
    async get<T>(path: string): Promise<T> {
      const res = await fetchWithRetry(`${baseUrl}${path}`)
      if (!res.ok) throw new Error(`API GET ${baseUrl}${path} failed: ${res.status}`)
      return res.json()
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      const res = await fetchWithRetry(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`API POST ${baseUrl}${path} failed: ${res.status}`)
      return res.json()
    },

    async put(path: string, body: unknown): Promise<void> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`API PUT ${baseUrl}${path} failed: ${res.status}`)
    },

    async patch<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`API PATCH ${baseUrl}${path} failed: ${res.status}`)
      return res.json()
    },

    async del(path: string): Promise<void> {
      const res = await fetch(`${baseUrl}${path}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`API DELETE ${baseUrl}${path} failed: ${res.status}`)
    },
  }
}

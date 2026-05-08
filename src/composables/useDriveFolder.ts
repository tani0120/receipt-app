/**
 * useDriveFolder — Google Driveフォルダ操作composable
 *
 * 責務: フォルダ作成・リネームのAPI呼び出しを一元管理
 * 参照元: ClientEditPage / MockMasterClientsPage / LeadListPage / LeadEditPage
 *
 * ルール: Drive APIの直接fetchはこのcomposable経由に統一。
 *         各ページでの直接fetch('/api/drive/folder')は禁止。
 */

const API_BASE = '/api/drive/folder'

export function useDriveFolder() {
  /**
   * Driveフォルダ作成
   * @param folderName フォルダ名（例: "ABC_株式会社ABC商事"）
   * @param sharedEmail 共有先メールアドレス（省略可）
   * @returns 作成されたフォルダID
   */
  async function createFolder(folderName: string, sharedEmail?: string): Promise<string> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName, sharedEmail: sharedEmail || undefined }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    const data = await res.json() as { folderId: string }
    return data.folderId
  }

  /**
   * Driveフォルダリネーム
   * @param folderId 対象フォルダID
   * @param newName 新しいフォルダ名
   * @returns 成功時は新しい名前、失敗時はnull
   */
  async function renameFolder(folderId: string, newName: string): Promise<string | null> {
    const res = await fetch(`${API_BASE}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, newName }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    return newName
  }

  return { createFolder, renameFolder }
}

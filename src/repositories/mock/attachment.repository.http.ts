/**
 * attachment.repository.http.ts — AttachmentRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, P3-5a
 */

import type { AttachmentRepository } from '../types'

export const httpAttachmentRepo: AttachmentRepository = {
  upload: async (entityId, formData) => {
    const res = await fetch(`/api/attachments/${entityId}`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error(`Attachment upload failed: ${res.status}`)
    return res.json()
  },

  deleteFile: async (entityId, fileId) => {
    const res = await fetch(`/api/attachments/${entityId}/${fileId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Attachment delete failed: ${res.status}`)
  },
}

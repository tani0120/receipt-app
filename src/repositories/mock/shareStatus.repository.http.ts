/**
 * shareStatus.repository.http.ts — ShareStatusRepository HTTP実装
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { ShareStatusRecord } from '../types'
import type { ShareStatusRepository } from '../types'

export const httpShareStatusRepo: ShareStatusRepository = {
  getAll: async () => {
    const res = await honoClient.api['share-status'].$get()
    const data = await res.json() as { records: ShareStatusRecord[] }
    return data.records ?? []
  },

  getByClientId: async (clientId) => {
    try {
      const res = await honoClient.api['share-status'][':clientId'].$get({ param: { clientId } })
      const data = await res.json() as { record: ShareStatusRecord }
      return data.record
    } catch {
      return undefined
    }
  },

  updateStatus: async (clientId, status) => {
    await honoClient.api['share-status'][':clientId'].$put({
      param: { clientId },
      json: { status },
    })
  },

  saveInviteCode: async (clientId, _code) => {
    // saveInviteCodeはサーバー側でコード生成するため、POST /inviteを呼ぶ
    await honoClient.api['share-status'].invite.$post({ json: { clientId } })
  },

  generateInviteCode: async (clientId) => {
    const res = await honoClient.api['share-status'].invite.$post({ json: { clientId } })
    return await res.json() as { code: string }
  },

  resolveInviteCode: async (code) => {
    try {
      const res = await honoClient.api['share-status'].invite[':code'].$get({ param: { code } })
      const data = await res.json() as { clientId: string | null }
      return data.clientId ?? null
    } catch {
      return null
    }
  },
}

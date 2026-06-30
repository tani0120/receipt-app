/**
 * 根拠資料メタデータ Repository モック実装
 *
 * supportingSearchService をラップして SupportingSearchRepository interface を実装。
 * Supabase移行時にDB版に差し替え。
 *
 * 準拠: DL-030, DL-050
 */

import type { SupportingSearchRepository } from '@/repositories/types'
import * as service from '@/api/services/migration/supportingSearchService'

export const mockSupportingSearchRepo: SupportingSearchRepository = {
  async saveSupportingMeta(clientId, items) {
    return service.saveSupportingMeta(clientId, items)
  },
  async searchSupporting(clientId, query) {
    return service.searchSupporting(clientId, query)
  },
  async getSupportingMetaCount(clientId) {
    return service.getSupportingMetaCount(clientId)
  },
}

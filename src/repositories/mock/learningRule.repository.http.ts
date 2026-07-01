/**
 * learningRule.repository.http.ts — LearningRuleRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, DL-042
 */

import { createApiClient } from '../../utils/apiClient'
import type { LearningRuleRepository } from '../types'
import type { LearningRule } from '../../types/learning_rule.type'

const api = createApiClient('/api/learning-rules')

export const httpLearningRuleRepo: LearningRuleRepository = {
  getByClientId: async (clientId) => {
    return api.get<{ rules: LearningRule[] }>(`/${clientId}`)
  },

  list: async (clientId, query) => {
    return api.post(`/${clientId}/list`, query)
  },

  create: async (clientId, rule) => {
    return api.post(`/${clientId}`, rule)
  },

  update: async (clientId, ruleId, rule) => {
    await api.put(`/${clientId}/${ruleId}`, rule)
  },

  deleteById: async (clientId, ruleId) => {
    await api.del(`/${clientId}/${ruleId}`)
  },
}

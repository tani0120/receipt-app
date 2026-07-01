/**
 * learningRule.repository.http.ts — LearningRuleRepository HTTP実装（フロントエンド用）
 *
 * 準拠: DL-030, DL-042
 */

import { honoClient } from '../../utils/honoClient'
import type { LearningRuleRepository } from '../types'
import type { LearningRule } from '../../types/learning_rule.type'

export const httpLearningRuleRepo: LearningRuleRepository = {
  getByClientId: async (clientId) => {
    const res = await honoClient.api['learning-rules'][':clientId'].$get({ param: { clientId } })
    return await res.json() as { rules: LearningRule[] }
  },

  list: async (clientId, query) => {
    const res = await honoClient.api['learning-rules'][':clientId'].list.$post({
      param: { clientId },
      json: query as Record<string, unknown>,
    })
    return await res.json() as Awaited<ReturnType<LearningRuleRepository['list']>>
  },

  create: async (clientId, rule) => {
    const res = await honoClient.api['learning-rules'][':clientId'].$post({
      param: { clientId },
      json: rule as Record<string, unknown>,
    })
    return await res.json() as { rule: LearningRule }
  },

  update: async (clientId, ruleId, rule) => {
    await honoClient.api['learning-rules'][':clientId'][':ruleId'].$put({
      param: { clientId, ruleId },
      json: rule as Record<string, unknown>,
    })
  },

  deleteById: async (clientId, ruleId) => {
    await honoClient.api['learning-rules'][':clientId'][':ruleId'].$delete({
      param: { clientId, ruleId },
    })
  },
}

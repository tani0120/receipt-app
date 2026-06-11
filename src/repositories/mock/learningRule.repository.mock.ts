/**
 * learningRule.repository.mock.ts — LearningRuleRepositoryモック実装（サーバー用）
 *
 * 準拠: DL-030, DL-042
 */

import * as store from '../../api/services/learningRuleStore'
import type { LearningRuleRepository } from '../types'

export const mockLearningRuleRepo: LearningRuleRepository = {
  getByClientId: async (clientId) => {
    const rules = store.getByClientId(clientId)
    return { rules }
  },

  list: async (clientId, query) => {
    const { sourceFilter = 'all', filterMode = 'all', searchText = '' } = query
    const allRules = store.getByClientId(clientId)

    // カテゴリ別カウント（全ルール対象）
    const sourceCounts = {
      all: allRules.length,
      receipt: allRules.filter(r => r.sourceCategory === 'receipt').length,
      bank: allRules.filter(r => r.sourceCategory === 'bank').length,
      credit: allRules.filter(r => r.sourceCategory === 'credit').length,
    }

    // ソースカテゴリフィルタ
    let filtered = sourceFilter === 'all'
      ? allRules
      : allRules.filter(r => r.sourceCategory === sourceFilter)

    // ステータス別カウント（ソースフィルタ後）
    const statusCounts = {
      all: filtered.length,
      active: filtered.filter(r => r.isActive).length,
      inactive: filtered.filter(r => !r.isActive).length,
    }

    // 生成元別カウント（全ルール対象）
    const generatedByCounts = {
      ai: allRules.filter(r => r.generatedBy === 'ai').length,
      human: allRules.filter(r => r.generatedBy === 'human').length,
    }

    // 有効/無効フィルタ
    if (filterMode === 'active') filtered = filtered.filter(r => r.isActive)
    if (filterMode === 'inactive') filtered = filtered.filter(r => !r.isActive)

    // キーワード検索
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      filtered = filtered.filter(r =>
        r.keyword.toLowerCase().includes(q) ||
        r.entries.some(e =>
          e.account.toLowerCase().includes(q) ||
          (e.subAccount && e.subAccount.toLowerCase().includes(q))
        )
      )
    }

    return { rules: filtered, sourceCounts, statusCounts, generatedByCounts }
  },

  create: async (clientId, rule) => {
    const created = store.create(clientId, { ...rule, clientId })
    return { rule: created }
  },

  update: async (clientId, ruleId, rule) => {
    store.update(clientId, ruleId, rule)
  },

  deleteById: async (clientId, ruleId) => {
    store.remove(clientId, ruleId)
  },
}

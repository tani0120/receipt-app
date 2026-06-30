/**
 * AIコマンドログ Repository モック実装
 *
 * aiLogStore をラップして AiLogRepository interface を実装。
 * Supabase移行時にDB版に差し替え。
 *
 * 準拠: DL-030, DL-050
 */

import type { AiLogRepository } from '@/repositories/types'
import * as store from '@/api/services/aiLogStore'

export const mockAiLogRepo: AiLogRepository = {
  // ── 操作ログ ──
  async addCommandLog(entry) {
    return store.addCommandLog(entry)
  },
  async getAllCommandLogs() {
    return store.getAllCommandLogs()
  },
  async getCommandLogById(id) {
    return store.getCommandLogById(id)
  },
  async getCommandLogsByStaff(staffId) {
    return store.getCommandLogsByStaff(staffId)
  },
  async getWriteCommandLogs() {
    return store.getWriteCommandLogs()
  },

  // ── 会話履歴 ──
  async createChatSession(staffId) {
    return store.createChatSession(staffId)
  },
  async addMessageToSession(sessionId, message) {
    return store.addMessageToSession(sessionId, message)
  },
  async getChatSession(sessionId) {
    return store.getChatSession(sessionId)
  },
  async getAllChatSessions() {
    return store.getAllChatSessions()
  },

  // ── コスト管理 ──
  async getMonthlyCost(category) {
    return store.getMonthlyCost(category)
  },
  async getMonthlyTotalCost() {
    return store.getMonthlyTotalCost()
  },
  async getAllMonthlyCosts() {
    return store.getAllMonthlyCosts()
  },
  async getStaffMonthlyCosts() {
    return store.getStaffMonthlyCosts()
  },
  async getStaffAnnualCost(staffId) {
    return store.getStaffAnnualCost(staffId)
  },
  async getClientMonthlyCosts() {
    return store.getClientMonthlyCosts()
  },
  async getCrossMonthlyCosts() {
    return store.getCrossMonthlyCosts()
  },
  async getModelMonthlyCosts() {
    return store.getModelMonthlyCosts()
  },
  async getAnnualTotalCost() {
    return store.getAnnualTotalCost()
  },
  async getCostLimits() {
    return store.getCostLimits()
  },
  async updateCostLimit(category, limit) {
    return store.updateCostLimit(category, limit)
  },
  async isOverLimit(category) {
    return store.isOverLimit(category)
  },
}

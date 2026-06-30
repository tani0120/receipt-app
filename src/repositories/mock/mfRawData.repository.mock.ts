/**
 * MfRawDataRepository モック実装（Phase 3.7）
 *
 * 既存の mfRawDataStore をラップし、Promise<T> インターフェースに変換。
 * Supabase移行時にDB版に差し替え。
 */

import type { MfRawDataRepository } from '../types'
import {
  saveMfRawData,
  loadMfRawData,
  listMfRawPatterns,
} from '../../api/services/mfRawDataStore'

export const mockMfRawDataRepo: MfRawDataRepository = {
  async saveMfRawData(envelope) {
    saveMfRawData(envelope)
  },

  async loadMfRawData(pattern) {
    return loadMfRawData(pattern)
  },

  async listMfRawPatterns() {
    return listMfRawPatterns()
  },
}

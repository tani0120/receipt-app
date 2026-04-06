/**
 * normalizeVendorName() ユニットテスト（DL027-1）
 *
 * 検証対象: src/mocks/utils/pipeline/vendorIdentification.ts
 * 追加処理: § 3b ひらがな→カタカナ変換（DL-027 D6）
 */
import { describe, it, expect } from 'vitest'
import { normalizeVendorName } from './vendorIdentification'

describe('normalizeVendorName', () => {
  // § 1 NFKC + § 2 法人格除去 + § 4 小文字化
  it('全角英数 + 法人格除去 → 半角小文字', () => {
    expect(normalizeVendorName('株式会社 ＬＤＩデジタル')).toBe('ldiデジタル')
  })

  // § 2 法人格除去（括弧付き）
  it('（有）除去', () => {
    expect(normalizeVendorName('（有）田中商事')).toBe('田中商事')
  })

  // § 3 記号除去 + カタカナ維持
  it('中黒除去・カタカナ維持', () => {
    expect(normalizeVendorName('エン・ジャパン')).toBe('エンジャパン')
  })

  // § 3b ひらがな→カタカナ変換（DL-027 D6 新規追加）
  it('ひらがな→カタカナ変換', () => {
    expect(normalizeVendorName('えん・じゃぱん')).toBe('エンジャパン')
  })

  // § 2b 英語法人格除去 + § 4 小文字化
  it('英語法人格除去 + 小文字化', () => {
    expect(normalizeVendorName('Amazon Co., Ltd.')).toBe('amazon')
  })

  // 通帳摘要（カタカナ）はそのまま維持
  it('通帳カタカナ摘要はそのまま', () => {
    expect(normalizeVendorName('カンサイデンリョク')).toBe('カンサイデンリョク')
  })

  // 漢字は維持（読み仮名変換はしない。DL-027 D5）
  it('漢字 + 法人格除去 → 漢字維持', () => {
    expect(normalizeVendorName('関西電力株式会社')).toBe('関西電力')
  })

  // null / 空文字
  it('null → null', () => {
    expect(normalizeVendorName(null)).toBeNull()
  })

  it('空文字 → null', () => {
    expect(normalizeVendorName('')).toBeNull()
  })

  // 追加: 半角カナ → NFKC → 全角カナ（§1で変換済み）
  it('半角カナ → 全角カナ（NFKC）', () => {
    expect(normalizeVendorName('ｱﾏｿﾞﾝ')).toBe('アマゾン')
  })

  // 追加: ひらがな混在の漢字名
  it('法人格内のひらがなもカタカナ化', () => {
    expect(normalizeVendorName('かんさいでんりょく')).toBe('カンサイデンリョク')
  })
})

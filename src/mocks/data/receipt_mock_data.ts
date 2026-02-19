/**
 * Receipt モックデータ
 *
 * 目的: 領収書画像表示の検証用
 * 将来: Supabase Storage連携時に実際のURLに置き換え
 */

import type { ReceiptMock } from '../types/receipt_mock.type'

export const MOCK_RECEIPTS: ReceiptMock[] = [
  {
    id: 'receipt-001',
    client_id: 'client-001',
    image_url: '/images/cafe-veloce-receipt.jpg',
    uploaded_at: '2025-01-20T13:12:00Z',
    file_name: 'カフェベローチェ_領収書_20250219.jpg'
  }
]

// ヘルパー関数: receipt_idから画像URLを取得
export function getReceiptImageUrl(receiptId: string | null): string | null {
  if (!receiptId) return null
  const receipt = MOCK_RECEIPTS.find(r => r.id === receiptId)
  return receipt?.image_url || null
}

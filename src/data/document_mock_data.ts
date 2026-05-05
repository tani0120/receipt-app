/**
 * Document モックデータ
 *
 * 目的: 証票画像表示の検証用
 * 将来: Supabase Storage連携時に実際のURLに置き換え
 */

import type { DocumentMock } from '../types/document_mock.type'

export const MOCK_DOCUMENTS: DocumentMock[] = [
  {
    id: 'receipt-001',
    client_id: 'client-001',
    image_url: '/images/cafe-veloce-receipt.jpg',
    uploaded_at: '2025-01-20T13:12:00Z',
    file_name: 'カフェベローチェ_領収書_20250219.jpg'
  }
]

// ヘルパー関数: document_idから画像URLを取得
export function getDocumentImageUrl(documentId: string | null): string | null {
  if (!documentId) return null
  const document = MOCK_DOCUMENTS.find(r => r.id === documentId)
  return document?.image_url || null
}

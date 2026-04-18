/**
 * useDocuments — 資料管理 composable
 *
 * 【設計原則】
 * - モジュールスコープのrefでデータを直接保持（フェーズルール準拠）
 * - composableからcreateRepositories()に依存しない
 * - ロジックはcomposable内に入れない（算出関数はutils/documentUtils.tsに分離）
 *
 * 【移行時】
 * - ref直接保持 → DocumentRepository経由に差し替え
 * - 呼び出し側（各ページ）は変更不要
 *
 * 準拠: DL-039
 */
import { ref, computed } from 'vue'
import type { DocEntry, DocStatus } from '@/repositories/types'

// ============================================================
// モジュールスコープref（ページ遷移しても保持される）
// ============================================================
const allDocuments = ref<DocEntry[]>([])

// ============================================================
// モックデータ（Phase B TODO: API取り込みに差し替え）
// ============================================================
const MOCK_DOCUMENTS: DocEntry[] = [
  // --- Drive経由（スマホからアップロード想定）---
  {
    id: 'doc-001',
    clientId: 'LDI-00008',
    source: 'drive',
    fileName: 'IMG_20250305_143200.jpg',
    fileType: 'image/jpeg',
    fileSize: 471040,
    fileHash: null,
    driveFileId: 'drive-f001',
    thumbnailUrl: '/mock-receipts/medical_receipt.png',
    previewUrl: '/mock-receipts/medical_receipt.png',
    status: 'pending',
    receivedAt: '2026-04-17T14:32:00+09:00',
  },
  {
    id: 'doc-002',
    clientId: 'LDI-00008',
    source: 'drive',
    fileName: 'scan_003.pdf',
    fileType: 'application/pdf',
    fileSize: 614400,
    fileHash: null,
    driveFileId: 'drive-f002',
    thumbnailUrl: '/mock-receipts/delivery_note.png',
    previewUrl: '/mock-receipts/delivery_note.png',
    status: 'pending',
    receivedAt: '2026-04-17T14:35:00+09:00',
  },
  {
    id: 'doc-003',
    clientId: 'LDI-00008',
    source: 'drive',
    fileName: '写真 2025-03-04 12.45.30.jpg',
    fileType: 'image/jpeg',
    fileSize: 604160,
    fileHash: null,
    driveFileId: 'drive-f003',
    thumbnailUrl: '/mock-receipts/convenience_receipt.png',
    previewUrl: '/mock-receipts/convenience_receipt.png',
    status: 'pending',
    receivedAt: '2026-04-16T09:15:00+09:00',
  },
  {
    id: 'doc-004',
    clientId: 'LDI-00008',
    source: 'drive',
    fileName: 'IMG_4872.jpg',
    fileType: 'image/jpeg',
    fileSize: 737280,
    fileHash: null,
    driveFileId: 'drive-f004',
    thumbnailUrl: '/mock-receipts/izakaya_receipt.png',
    previewUrl: '/mock-receipts/izakaya_receipt.png',
    status: 'pending',
    receivedAt: '2026-04-16T12:00:00+09:00',
  },
  // --- PCアップロード（スタッフが直接投入）---
  {
    id: 'doc-005',
    clientId: 'LDI-00008',
    source: 'upload',
    fileName: 'document(1).pdf',
    fileType: 'application/pdf',
    fileSize: 675840,
    fileHash: null,
    driveFileId: null,
    thumbnailUrl: '/mock-receipts/bank_passbook.png',
    previewUrl: '/mock-receipts/bank_passbook.png',
    status: 'pending',
    receivedAt: '2026-04-15T10:30:00+09:00',
  },
  {
    id: 'doc-006',
    clientId: 'LDI-00008',
    source: 'upload',
    fileName: 'CamScanner_20250303.pdf',
    fileType: 'application/pdf',
    fileSize: 563200,
    fileHash: null,
    driveFileId: null,
    thumbnailUrl: '/mock-receipts/invoice.png',
    previewUrl: '/mock-receipts/invoice.png',
    status: 'pending',
    receivedAt: '2026-04-15T10:35:00+09:00',
  },
  {
    id: 'doc-007',
    clientId: 'LDI-00008',
    source: 'upload',
    fileName: 'IMG_20250302_091500.jpg',
    fileType: 'image/jpeg',
    fileSize: 645120,
    fileHash: null,
    driveFileId: null,
    thumbnailUrl: '/mock-receipts/credit_card_statement.png',
    previewUrl: '/mock-receipts/credit_card_statement.png',
    status: 'pending',
    receivedAt: '2026-04-14T09:00:00+09:00',
  },
  {
    id: 'doc-008',
    clientId: 'LDI-00008',
    source: 'upload',
    fileName: 'photo_2025_03_02.jpg',
    fileType: 'image/jpeg',
    fileSize: 696320,
    fileHash: null,
    driveFileId: null,
    thumbnailUrl: '/mock-receipts/business_card.png',
    previewUrl: '/mock-receipts/business_card.png',
    status: 'pending',
    receivedAt: '2026-04-14T09:05:00+09:00',
  },
  // --- MHL（合同会社MHLメディカル）---
  {
    id: 'doc-009',
    clientId: 'MHL-00009',
    source: 'drive',
    fileName: 'receipt_mhl_001.jpg',
    fileType: 'image/jpeg',
    fileSize: 420000,
    fileHash: null,
    driveFileId: 'drive-mhl-001',
    thumbnailUrl: '/mock-receipts/medical_receipt.png',
    previewUrl: '/mock-receipts/medical_receipt.png',
    status: 'pending',
    receivedAt: '2026-04-17T16:00:00+09:00',
  },
  {
    id: 'doc-010',
    clientId: 'MHL-00009',
    source: 'drive',
    fileName: 'receipt_mhl_002.jpg',
    fileType: 'image/jpeg',
    fileSize: 380000,
    fileHash: null,
    driveFileId: 'drive-mhl-002',
    thumbnailUrl: '/mock-receipts/convenience_receipt.png',
    previewUrl: '/mock-receipts/convenience_receipt.png',
    status: 'pending',
    receivedAt: '2026-04-16T11:00:00+09:00',
  },
  {
    id: 'doc-011',
    clientId: 'MHL-00009',
    source: 'upload',
    fileName: 'scan_mhl_003.pdf',
    fileType: 'application/pdf',
    fileSize: 550000,
    fileHash: null,
    driveFileId: null,
    thumbnailUrl: '/mock-receipts/invoice.png',
    previewUrl: '/mock-receipts/invoice.png',
    status: 'pending',
    receivedAt: '2026-04-15T08:00:00+09:00',
  },
]

// 初期化（モックデータ投入）
if (allDocuments.value.length === 0) {
  allDocuments.value = [...MOCK_DOCUMENTS]
}

// ============================================================
// Composable
// ============================================================
export function useDocuments() {
  /** 顧問先IDでフィルタした資料一覧 */
  function getByClientId(clientId: string) {
    return computed(() =>
      allDocuments.value.filter(d => d.clientId === clientId)
    )
  }

  /** 資料の選別ステータスを更新（データ書き換えのみ） */
  function updateStatus(id: string, status: DocStatus) {
    const doc = allDocuments.value.find(d => d.id === id)
    if (doc) doc.status = status
  }

  return {
    /** 全顧問先の全資料（ref） */
    allDocuments,
    /** 顧問先単位でフィルタ */
    getByClientId,
    /** ステータス更新 */
    updateStatus,
  }
}

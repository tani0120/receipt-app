export const RECEIPT_STATUSES = [
    'uploaded',
    'preprocessed',
    'ocr_done',
    'suggested',
    'reviewing',
    'confirmed',
    'rejected',
] as const

export type ReceiptStatus = typeof RECEIPT_STATUSES[number]

export function isReceiptStatus(v: unknown): v is ReceiptStatus {
    return typeof v === 'string' && RECEIPT_STATUSES.includes(v as ReceiptStatus)
}

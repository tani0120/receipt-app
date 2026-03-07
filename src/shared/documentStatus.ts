export const DOCUMENT_STATUSES = [
    'uploaded',
    'preprocessed',
    'ocr_done',
    'suggested',
    'reviewing',
    'confirmed',
    'rejected',
] as const

export type DocumentStatus = typeof DOCUMENT_STATUSES[number]

export function isDocumentStatus(v: unknown): v is DocumentStatus {
    return typeof v === 'string' && DOCUMENT_STATUSES.includes(v as DocumentStatus)
}

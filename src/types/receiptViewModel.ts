import type { ReceiptStatus } from '@/shared/receiptStatus'

export interface ReceiptViewModel {
    id: string
    status: ReceiptStatus
    clientId: string
    driveFileId: string

    /**
     * UI表示用スナップショット
     * 壊れてもUIが死なない前提
     */
    displaySnapshot?: {
        ocrText?: string
        amountGuess?: number
        merchantGuess?: string
    }
}

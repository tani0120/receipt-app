import type { DocumentStatus } from '../shared/documentStatus'

export interface DocumentViewModel {
    documentId: string
    status: DocumentStatus
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

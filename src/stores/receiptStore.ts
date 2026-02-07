import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isReceiptStatus } from '@/shared/receiptStatus'
import type { ReceiptViewModel } from '@/types/receiptViewModel'

function normalizeReceipt(raw: unknown): ReceiptViewModel {
    const rawObj = raw as Record<string, unknown>
    return {
        id: String(rawObj.id ?? ''),
        clientId: String(rawObj.clientId ?? ''),
        driveFileId: String(rawObj.driveFileId ?? ''),
        status: isReceiptStatus(rawObj.status) ? rawObj.status : 'uploaded',
        displaySnapshot: rawObj.displaySnapshot as ReceiptViewModel['displaySnapshot'],
    }
}

export const useReceiptStore = defineStore('receipt', () => {
    const receipts = ref<ReceiptViewModel[]>([])

    function setReceipts(raws: unknown[]) {
        receipts.value = raws.map(normalizeReceipt)
    }

    const suggestedReceipts = computed(() =>
        receipts.value.filter(r => r.status === 'suggested')
    )

    const confirmedReceipts = computed(() =>
        receipts.value.filter(r => r.status === 'confirmed')
    )

    return {
        receipts,
        setReceipts,
        suggestedReceipts,
        confirmedReceipts,
    }
})

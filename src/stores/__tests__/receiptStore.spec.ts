import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReceiptStore } from '@/stores/receiptStore'

describe('receiptStore - normalizeReceipt (Task 3)', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    // Test 1: 不正statusを'uploaded'に変換
    it('should default to uploaded for invalid status', () => {
        const store = useReceiptStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'INVALID_STATUS' // 不正な値
        }

        store.setReceipts([raw])

        expect(store.receipts[0].status).toBe('uploaded')
    })

    // Test 2: statusがundefinedの場合
    it('should default to uploaded when status is undefined', () => {
        const store = useReceiptStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test'
            // status なし
        }

        store.setReceipts([raw])

        expect(store.receipts[0].status).toBe('uploaded')
    })

    // Test 3: 正常なstatusはそのまま
    it('should keep valid status unchanged', () => {
        const store = useReceiptStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'suggested'
        }

        store.setReceipts([raw])

        expect(store.receipts[0].status).toBe('suggested')
    })

    // Test 4: displaySnapshotがなくても動作
    it('should work without displaySnapshot', () => {
        const store = useReceiptStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'uploaded'
            // displaySnapshot なし
        }

        store.setReceipts([raw])

        expect(store.receipts[0].displaySnapshot).toBeUndefined()
    })

    // Test 5: 必須フィールドの検証
    it('should have all required fields', () => {
        const store = useReceiptStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'uploaded'
        }

        store.setReceipts([raw])
        const receipt = store.receipts[0]

        expect(receipt.id).toBeDefined()
        expect(receipt.clientId).toBeDefined()
        expect(receipt.driveFileId).toBeDefined()
        expect(receipt.status).toBeDefined()
    })
})

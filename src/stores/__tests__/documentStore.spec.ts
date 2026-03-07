import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDocumentStore } from '@/stores/documentStore'

describe('documentStore - normalizeDocument (Task 3)', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    // Test 1: 不正statusを'uploaded'に変換
    it('should default to uploaded for invalid status', () => {
        const store = useDocumentStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'INVALID_STATUS' // 不正な値
        }

        store.setDocuments([raw])

        expect(store.documents[0].status).toBe('uploaded')
    })

    // Test 2: statusがundefinedの場合
    it('should default to uploaded when status is undefined', () => {
        const store = useDocumentStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test'
            // status なし
        }

        store.setDocuments([raw])

        expect(store.documents[0].status).toBe('uploaded')
    })

    // Test 3: 正常なstatusはそのまま
    it('should keep valid status unchanged', () => {
        const store = useDocumentStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'suggested'
        }

        store.setDocuments([raw])

        expect(store.documents[0].status).toBe('suggested')
    })

    // Test 4: displaySnapshotがなくても動作
    it('should work without displaySnapshot', () => {
        const store = useDocumentStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'uploaded'
            // displaySnapshot なし
        }

        store.setDocuments([raw])

        expect(store.documents[0].displaySnapshot).toBeUndefined()
    })

    // Test 5: 必須フィールドの検証
    it('should have all required fields', () => {
        const store = useDocumentStore()
        const raw = {
            id: '1',
            clientId: 'test',
            driveFileId: 'test',
            status: 'uploaded'
        }

        store.setDocuments([raw])
        const doc = store.documents[0]

        expect(doc.id).toBeDefined()
        expect(doc.clientId).toBeDefined()
        expect(doc.driveFileId).toBeDefined()
        expect(doc.status).toBeDefined()
    })
})

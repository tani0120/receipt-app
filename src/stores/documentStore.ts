import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isDocumentStatus } from '@/shared/documentStatus'
import type { DocumentViewModel } from '@/types/documentViewModel'

function normalizeDocument(raw: unknown): DocumentViewModel {
    const rawObj = raw as Record<string, unknown>
    return {
        id: String(rawObj.id ?? ''),
        clientId: String(rawObj.clientId ?? ''),
        driveFileId: String(rawObj.driveFileId ?? ''),
        status: isDocumentStatus(rawObj.status) ? rawObj.status : 'uploaded',
        displaySnapshot: rawObj.displaySnapshot as DocumentViewModel['displaySnapshot'],
    }
}

export const useDocumentStore = defineStore('document', () => {
    const documents = ref<DocumentViewModel[]>([])

    function setDocuments(raws: unknown[]) {
        documents.value = raws.map(normalizeDocument)
    }

    const suggestedDocuments = computed(() =>
        documents.value.filter(r => r.status === 'suggested')
    )

    const confirmedDocuments = computed(() =>
        documents.value.filter(r => r.status === 'confirmed')
    )

    return {
        documents,
        setDocuments,
        suggestedDocuments,
        confirmedDocuments,
    }
})

import {
    collection,
    query,
    getDocs,
    limit,
    orderBy,
    doc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ClientDocument } from '../types/schema_v2';

const COLLECTION_CLIENTS = 'clients';

export const clientRepository = {
    /**
     * Fetch Clients List (V2)
     */
    async getClients(limitCount: number = 100): Promise<ClientDocument[]> {
        try {
            const q = query(
                collection(db, COLLECTION_CLIENTS),
                orderBy('updatedAt', 'desc'),
                limit(limitCount)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as ClientDocument));
        } catch (e) {
            console.error('[ClientRepo] Failed to fetch clients:', e);
            return [];
        }
    },

    /**
     * Update Client (Partial)
     */
    async updateClient(id: string, data: Partial<ClientDocument>): Promise<void> {
        const ref = doc(db, COLLECTION_CLIENTS, id);
        // Explicitly update updatedAt
        await updateDoc(ref, {
            ...data,
            updatedAt: Timestamp.now()
        });
    }
};

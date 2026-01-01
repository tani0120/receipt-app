import { db } from '@/Mirror_sandbox/Mirror_firebase';
import { collection, doc, updateDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Client } from '@/Mirror_sandbox/Mirror_types/Mirror_client';

const COLLECTION_NAME = 'clients';

export const ClientService = {
    /**
     * クライアント一覧をリアルタイム購読
     * @param onSuccess データ更新時のコールバック
     * @param onError エラー時のコールバック
     * @returns unsubscribe関数
     */
    subscribeClientList(onSuccess: (clients: Client[]) => void, onError: (error: Error) => void): () => void {
        const q = query(collection(db, COLLECTION_NAME), orderBy('clientCode', 'asc'));

        return onSnapshot(
            q,
            (snapshot) => {
                const clients = snapshot.docs.map((doc) => doc.data() as Client);
                onSuccess(clients);
            },
            (error) => {
                console.error('ClientService: subscribeClientList error', error);
                onError(error);
            }
        );
    },

    /**
     * クライアント情報の更新
     * @param clientCode 更新対象のクライアントコード
     * @param data 更新データ
     */
    async updateClient(clientCode: string, data: Partial<Client>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, clientCode);
            await updateDoc(docRef, {
                ...data,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            console.error('ClientService: updateClient error', error);
            throw error;
        }
    }
};

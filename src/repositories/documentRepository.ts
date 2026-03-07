
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase'; // プロジェクトのFirebase初期化設定に合わせてパス調整
import type {
  WorkLogDocument,
  DocumentRecord,
  DocumentId
} from '../types/schema_v2';

const COLLECTION_WORK_LOGS = 'work_logs';
const COLLECTION_DOCUMENTS = 'receipts'; // Firestoreコレクション名はDB互換維持のため'receipts'のまま

export const documentRepository = {
  /**
   * Fetch a single WorkLog by ID
   * (Status, Time, Worker info)
   */
  async getWorkLog(id: DocumentId): Promise<WorkLogDocument | null> {
    try {
      const ref = doc(db, COLLECTION_WORK_LOGS, id);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as WorkLogDocument) : null;
    } catch (e) {
      console.error('[DocumentRepo] Failed to fetch WorkLog:', e);
      throw e;
    }
  },

  /**
   * Fetch a single Document by ID
   * (OCR data, Accounting amounts)
   */
  async getDocument(id: DocumentId): Promise<DocumentRecord | null> {
    try {
      const ref = doc(db, COLLECTION_DOCUMENTS, id);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as DocumentRecord) : null;
    } catch (e) {
      console.error('[DocumentRepo] Failed to fetch Document:', e);
      throw e;
    }
  },

  /**
   * Fetch recent WorkLogs for Dashboard
   * (Used in Screen H Pilot)
   */
  async getRecentWorkLogs(limitCount: number = 20): Promise<WorkLogDocument[]> {
    try {
      const q = query(
        collection(db, COLLECTION_WORK_LOGS),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as WorkLogDocument);
    } catch (e) {
      console.error('[DocumentRepo] Failed to fetch recent logs:', e);
      return [];
    }
  },

  /**
   * Update WorkLog
   */
  async updateWorkLog(id: DocumentId, data: Partial<WorkLogDocument>): Promise<void> {
    const ref = doc(db, COLLECTION_WORK_LOGS, id);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };
    await updateDoc(ref, updateData);
  },

  /**
   * Update Document
   */
  async updateDocument(id: DocumentId, data: Partial<DocumentRecord>): Promise<void> {
    const ref = doc(db, COLLECTION_DOCUMENTS, id);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };
    await updateDoc(ref, updateData);
  },

  /**
   * Save Dual Entry (WorkLog + Document)
   * atomic batch write
   */
  async saveDualEntry(workLog: WorkLogDocument, document: DocumentRecord): Promise<void> {
    const batch = writeBatch(db);

    // WorkLog
    const workLogRef = doc(db, COLLECTION_WORK_LOGS, workLog.id);
    batch.set(workLogRef, { ...workLog, updatedAt: Timestamp.now() }, { merge: true });

    // Document
    const documentRef = doc(db, COLLECTION_DOCUMENTS, document.id);
    batch.set(documentRef, { ...document, updatedAt: Timestamp.now() }, { merge: true });

    await batch.commit();
  },

  /**
   * Fetch WorkLogs for List View (Screen B)
   * Ordered by updatedAt desc
   */
  async getWorkLogs(limitCount: number = 50): Promise<WorkLogDocument[]> {
    try {
      const q = query(
        collection(db, COLLECTION_WORK_LOGS),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as WorkLogDocument);
    } catch (e) {
      console.error('[DocumentRepo] Failed to fetch list:', e);
      return [];
    }
  }
};

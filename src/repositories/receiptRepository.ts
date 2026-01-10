
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
  ReceiptDocument,
  DocumentId
} from '../types/schema_v2';

const COLLECTION_WORK_LOGS = 'work_logs';
const COLLECTION_RECEIPTS = 'receipts';

export const receiptRepository = {
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
      console.error('[ReceiptRepo] Failed to fetch WorkLog:', e);
      throw e;
    }
  },

  /**
   * Fetch a single Receipt by ID
   * (OCR data, Accounting amounts)
   */
  async getReceipt(id: DocumentId): Promise<ReceiptDocument | null> {
    try {
      const ref = doc(db, COLLECTION_RECEIPTS, id);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as ReceiptDocument) : null;
    } catch (e) {
      console.error('[ReceiptRepo] Failed to fetch Receipt:', e);
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
      console.error('[ReceiptRepo] Failed to fetch recent logs:', e);
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
   * Update Receipt
   */
  async updateReceipt(id: DocumentId, data: Partial<ReceiptDocument>): Promise<void> {
    const ref = doc(db, COLLECTION_RECEIPTS, id);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };
    await updateDoc(ref, updateData);
  },

  /**
   * Save Dual Entry (WorkLog + Receipt)
   * atomic batch write
   */
  async saveDualEntry(workLog: WorkLogDocument, receipt: ReceiptDocument): Promise<void> {
    const batch = writeBatch(db);

    // WorkLog
    const workLogRef = doc(db, COLLECTION_WORK_LOGS, workLog.id);
    batch.set(workLogRef, { ...workLog, updatedAt: Timestamp.now() }, { merge: true });

    // Receipt
    const receiptRef = doc(db, COLLECTION_RECEIPTS, receipt.id);
    batch.set(receiptRef, { ...receipt, updatedAt: Timestamp.now() }, { merge: true });

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
      console.error('[ReceiptRepo] Failed to fetch list:', e);
      return [];
    }
  }
};

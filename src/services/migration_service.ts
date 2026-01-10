import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection
} from 'firebase/firestore';
import { db } from '../firebase'; // Assuming initialized db export
import type { Client as LegacyClient, Job as LegacyJob } from '../types/firestore';
import {
  convertLegacyClient,
  convertLegacyJobToWorkLog,
  convertLegacyJobToReceipt
} from '../libs/adapters/legacy_to_v2';

// Standard V2 Collection Names
const V2_COLLECTION_CLIENTS = 'clients_v2';
const V2_COLLECTION_WORK_LOGS = 'work_logs';
const V2_COLLECTION_RECEIPTS = 'receipts';

// Legacy Collection Names
const LEGACY_COLLECTION_CLIENTS = 'clients';
const LEGACY_COLLECTION_JOBS = 'jobs';

export class MigrationService {
  /**
   * Migrate a single Client from Legacy to V2
   */
  async migrateClient(clientId: string, dryRun: boolean = false): Promise<any | undefined> {
    const legacyRef = doc(db, LEGACY_COLLECTION_CLIENTS, clientId);
    const snapshot = await getDoc(legacyRef);

    if (!snapshot.exists()) {
      console.warn(`[Migration] Legacy Client not found: ${clientId}`);
      return;
    }

    const legacyData = snapshot.data() as LegacyClient;
    const v2Data = convertLegacyClient(legacyData);

    if (dryRun) {
      console.group(`[DRY-RUN] Migrate Client: ${clientId}`);
      console.log('Legacy:', legacyData);
      console.log('V2 Transformed:', v2Data);
      console.groupEnd();
    } else {
      const v2Ref = doc(db, V2_COLLECTION_CLIENTS, v2Data.id);
      await setDoc(v2Ref, v2Data, { merge: true });
      console.log(`[Migration] Client migrated: ${clientId} -> ${V2_COLLECTION_CLIENTS}/${v2Data.id}`);
    }
    return v2Data;
  }

  /**
   * Migrate a single Job from Legacy to V2 (Splits into WorkLog and Receipt)
   */
  async migrateJob(jobId: string, dryRun: boolean = false): Promise<{ workLog: any, receipt: any } | undefined> {
    const legacyRef = doc(db, LEGACY_COLLECTION_JOBS, jobId);
    const snapshot = await getDoc(legacyRef);

    if (!snapshot.exists()) {
      console.warn(`[Migration] Legacy Job not found: ${jobId}`);
      return undefined;
    }

    const legacyData = snapshot.data() as LegacyJob;
    const workLogData = convertLegacyJobToWorkLog(legacyData);
    const receiptData = convertLegacyJobToReceipt(legacyData);

    if (dryRun) {
      console.group(`[DRY-RUN] Migrate Job: ${jobId}`);
      console.log('Legacy:', legacyData);
      console.log('V2 WorkLog:', workLogData);
      console.log('V2 Receipt:', receiptData);
      console.groupEnd();
    } else {
      // 1. Save WorkLog
      const workLogRef = doc(db, V2_COLLECTION_WORK_LOGS, workLogData.id);
      await setDoc(workLogRef, workLogData, { merge: true });

      // 2. Save Receipt
      const receiptRef = doc(db, V2_COLLECTION_RECEIPTS, receiptData.id);
      await setDoc(receiptRef, receiptData, { merge: true });

      console.log(`[Migration] Job migrated: ${jobId} -> WorkLog & Receipt`);
    }

    return { workLog: workLogData, receipt: receiptData };
  }
}

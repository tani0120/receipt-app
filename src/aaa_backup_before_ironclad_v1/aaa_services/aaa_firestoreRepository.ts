import { db } from "../aaa_firebase";
import type { Client, Job, SystemSettings, JobStatus, BankAccount, CreditCard } from "../aaa_types/aaa_firestore";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    deleteDoc,
    Timestamp
} from "firebase/firestore";

// Collection References
const clientsRef = collection(db, "clients");
const jobsRef = collection(db, "jobs");
const settingsRef = collection(db, "system_settings");

/**
 * Firestore Repository
 * Wrapper functions to keep components clean from direct DB access.
 */
export const FirestoreRepository = {
    // ========================================================================
    // Clients
    // ========================================================================

    /**
     * Get all clients from Firestore
     */
    async getAllClients(): Promise<Client[]> {
        const snapshot = await getDocs(clientsRef);
        return snapshot.docs.map(doc => doc.data() as Client);
    },

    /**
     * Get a single client by Client Code (Document ID)
     * @param clientCode e.g., 'AMT'
     */
    async getClient(clientCode: string): Promise<Client | null> {
        const docSnap = await getDoc(doc(clientsRef, clientCode));
        return docSnap.exists() ? (docSnap.data() as Client) : null;
    },

    /**
     * Add a new client
     * @param clientData
     */
    async addClient(clientData: Client): Promise<void> {
        const docRef = doc(clientsRef, clientData.clientCode);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            throw new Error("Client code already exists");
        }

        await setDoc(docRef, {
            ...clientData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
    },

    /**
     * Update an existing client
     * @param clientCode
     * @param data
     */
    async updateClient(clientCode: string, data: Partial<Client>): Promise<void> {
        const docRef = doc(clientsRef, clientCode);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ========================================================================
    // Jobs
    // ========================================================================

    /**
     * Get Jobs for a specific client, ordered by Transaction Date
     * @param clientCode
     */
    async getJobsByClient(clientCode: string): Promise<Job[]> {
        const q = query(
            jobsRef,
            where("clientCode", "==", clientCode)
            // orderBy("transactionDate", "desc") // Requires Index
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Job));
    },

    /**
     * Subscribe to jobs for a specific client (Real-time)
     * @param clientCode
     * @param callback
     * @returns Unsubscribe function
     */
    subscribeToJobsByClient(clientCode: string, callback: (jobs: Job[]) => void): () => void {
        const q = query(
            jobsRef,
            where("clientCode", "==", clientCode)
            // orderBy("transactionDate", "desc") // Requires Index
        );

        return onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Job));
            callback(jobs);
        });
    },

    /**
     * Subscribe to ALL jobs (Admin Dashboard)
     * @param callback
     * @returns Unsubscribe function
     */
    subscribeToAllJobs(callback: (jobs: Job[]) => void): () => void {
        const q = query(
            jobsRef,
            orderBy("updatedAt", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const jobs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Job));
            callback(jobs);
        });
    },

    /**
     * Create a new Job
     * @param jobData Partial job data (without ID)
     */
    async addJob(jobData: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<string> {
        const now = Timestamp.now();
        const newJob = {
            ...jobData,
            createdAt: now,
            updatedAt: now
        };
        const docRef = await addDoc(jobsRef, newJob);
        // We might want to update the doc with its own ID if we use that convention,
        // but typically doc.id is enough. For strictly typed return, we can do this:
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    },

    /**
     * Update Job Status
     * @param jobId
     * @param status
     */
    async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
        const jobDoc = doc(jobsRef, jobId);
        await updateDoc(jobDoc, {
            status,
            updatedAt: Timestamp.now()
        });
    },

    /**
     * Get a single Job by ID
     * @param jobId
     */
    async getJobById(jobId: string): Promise<Job | null> {
        const docSnap = await getDoc(doc(jobsRef, jobId));
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Job;
        }
        return null;
    },

    /**
     * Update a Job with partial data
     * @param jobId
     * @param data
     */
    async updateJob(jobId: string, data: Partial<Job>): Promise<void> {
        const jobDoc = doc(jobsRef, jobId);
        await updateDoc(jobDoc, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // ========================================================================
    // System Settings
    // ========================================================================

    /**
     * Get Global System Settings
     */
    async getSystemSettings(): Promise<SystemSettings | null> {
        const docSnap = await getDoc(doc(settingsRef, "v1"));
        return docSnap.exists() ? (docSnap.data() as SystemSettings) : null;
    },

    // ========================================================================
    // Sub-Collections: Bank Accounts
    // clients/{clientCode}/bank_accounts
    // ========================================================================

    async getBankAccounts(clientCode: string): Promise<BankAccount[]> {
        const ref = collection(db, `clients/${clientCode}/bank_accounts`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BankAccount));
    },

    async addBankAccount(clientCode: string, data: Omit<BankAccount, 'id' | 'updatedAt'>): Promise<string> {
        const ref = collection(db, `clients/${clientCode}/bank_accounts`);
        const newDoc = {
            ...data,
            updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(ref, newDoc);
        return docRef.id;
    },

    async deleteBankAccount(clientCode: string, bankId: string): Promise<void> {
        await deleteDoc(doc(db, `clients/${clientCode}/bank_accounts`, bankId));
    },

    // ========================================================================
    // Sub-Collections: Credit Cards
    // clients/{clientCode}/credit_cards
    // ========================================================================

    async getCreditCards(clientCode: string): Promise<CreditCard[]> {
        const ref = collection(db, `clients/${clientCode}/credit_cards`);
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CreditCard));
    },

    async addCreditCard(clientCode: string, data: Omit<CreditCard, 'id' | 'updatedAt'>): Promise<string> {
        const ref = collection(db, `clients/${clientCode}/credit_cards`);
        const newDoc = {
            ...data,
            updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(ref, newDoc);
        return docRef.id;
    },

    async deleteCreditCard(clientCode: string, cardId: string): Promise<void> {
        await deleteDoc(doc(db, `clients/${clientCode}/credit_cards`, cardId));
    }
};

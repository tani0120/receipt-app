import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import type { Client } from "../types/firestore";

/**
 * Initial Clients Data (Derived from @01_顧問先マスタ.csv / Existing Mock Data)
 */
const SEED_CLIENTS: Client[] = [
    {
        clientCode: 'AMT',
        companyName: 'アマテラス商事',
        repName: '鈴木 一郎',
        contactInfo: 'Chatwork: https://chatwork.com',
        fiscalMonth: 3,
        status: 'active',
        sharedFolderId: 'mock_AMT_shared_id',
        originalFolderId: 'mock_AMT_original_id',
        accountingSoftware: 'mf',
        taxType: '青色',
        driveLinked: true,
        updatedAt: Timestamp.now()
    },
    {
        clientCode: 'GLB',
        companyName: 'グローバルテック',
        repName: '佐藤 花子',
        contactInfo: '',
        fiscalMonth: 6,
        status: 'active',
        sharedFolderId: 'mock_GLB_shared_id',
        originalFolderId: 'mock_GLB_original_id',
        accountingSoftware: 'freee',
        taxType: '白色',
        driveLinked: true,
        updatedAt: Timestamp.now()
    },
    {
        clientCode: 'EDL',
        companyName: 'エンドレス建設',
        repName: '鈴木 一郎',
        contactInfo: 'Chatwork: https://chatwork.com',
        fiscalMonth: 9,
        status: 'suspension', // Assuming 'isActive: false' maps to suspension or inactive
        sharedFolderId: 'mock_EDL_shared_id',
        originalFolderId: 'mock_EDL_original_id',
        accountingSoftware: 'yayoi',
        taxType: '青色',
        driveLinked: false,
        updatedAt: Timestamp.now()
    },
    {
        clientCode: 'TNK',
        companyName: '田中 歯科医院',
        repName: '田中 医師',
        contactInfo: 'Email: tanaka@example.com',
        fiscalMonth: 12,
        status: 'active',
        sharedFolderId: 'mock_TNK_shared_id',
        originalFolderId: 'mock_TNK_original_id',
        accountingSoftware: 'mf',
        taxType: '青色',
        driveLinked: true,
        updatedAt: Timestamp.now()
    },
    {
        clientCode: 'SMP',
        companyName: 'サンプル株式会社',
        repName: '見本 太郎',
        contactInfo: 'TeL: 03-1234-5678',
        fiscalMonth: 3,
        status: 'active',
        sharedFolderId: 'mock_SMP_shared_id',
        originalFolderId: 'mock_SMP_original_id',
        accountingSoftware: 'yayoi',
        taxType: '青色',
        driveLinked: true,
        updatedAt: Timestamp.now()
    }
];

/**
 * Seed Clients Collection
 * Checks if client exists before writing to avoid accidental overwrites.
 */
export async function seedClientsData() {
    console.log("🌱 Starting Database Seeding...");
    const clientsRef = collection(db, "clients");

    let addedCount = 0;
    let skippedCount = 0;

    for (const client of SEED_CLIENTS) {
        const clientDocRef = doc(clientsRef, client.clientCode);
        const docSnap = await getDoc(clientDocRef);

        if (docSnap.exists()) {
            console.log(`⚠️ Client ${client.clientCode} already exists. Skipping.`);
            skippedCount++;
        } else {
            await setDoc(clientDocRef, client);
            console.log(`✅ Added Client: ${client.companyName} (${client.clientCode})`);
            addedCount++;
        }
    }

    console.log(`\n🎉 Seeding Complete!`);
    console.log(`   Added: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}`);

    return { addedCount, skippedCount };
}

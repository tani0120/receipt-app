import { db } from "../firebase";
import { collection, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import type { Client } from "../types/firestore";

/**
 * Initial Clients Data (Derived from @01_顧問先マスタ.csv / Existing Mock Data)
 */
const SEED_CLIENTS: Client[] = [
    {
        clientId: 'AMT1',
        clientCode: 'AMT',
        companyName: 'アマテラス商事',
        repName: '鈴木 一郎',
        contactInfo: 'Chatwork: https://chatwork.com',
        fiscalMonth: 3,
        status: 'active',
        sharedFolderId: 'mock_AMT_shared_id',
        processingFolderId: 'mock_AMT_original_id',
        archivedFolderId: 'mock_AMT_archived_id',
        excludedFolderId: 'mock_AMT_excluded_id',
        csvOutputFolderId: 'mock_AMT_csv_output_id',
        learningCsvFolderId: 'mock_AMT_learning_csv_id',
        taxFilingType: 'blue',
        consumptionTaxMode: 'general',
        accountingSoftware: 'mf',
        driveLinked: true,
        updatedAt: Timestamp.now()
    },
    {
        clientId: 'GLB1',
        clientCode: 'GLB',
        companyName: 'グローバルテック',
        repName: '佐藤 花子',
        contactInfo: '',
        fiscalMonth: 6,
        status: 'active',
        sharedFolderId: 'mock_GLB_shared_id',
        processingFolderId: 'mock_GLB_original_id',
        archivedFolderId: 'mock_GLB_archived_id',
        excludedFolderId: 'mock_GLB_excluded_id',
        csvOutputFolderId: 'mock_GLB_csv_output_id',
        learningCsvFolderId: 'mock_GLB_learning_csv_id',
        taxFilingType: 'white',
        consumptionTaxMode: 'general',
        accountingSoftware: 'freee',
        driveLinked: true,
        updatedAt: Timestamp.now()
    },
    {
        clientId: 'EDL1',
        clientCode: 'EDL',
        companyName: 'エンドレス建設',
        repName: '鈴木 一郎',
        contactInfo: 'Chatwork: https://chatwork.com',
        fiscalMonth: 9,
        status: 'suspension', // Assuming 'isActive: false' maps to suspension or inactive
        sharedFolderId: 'mock_EDL_shared_id',
        processingFolderId: 'mock_EDL_original_id',
        archivedFolderId: 'mock_EDL_archived_id',
        excludedFolderId: 'mock_EDL_excluded_id',
        csvOutputFolderId: 'mock_EDL_csv_output_id',
        learningCsvFolderId: 'mock_EDL_learning_csv_id',
        taxFilingType: 'blue',
        consumptionTaxMode: 'general',
        accountingSoftware: 'yayoi',
        driveLinked: false,
        updatedAt: Timestamp.now()
    },
    {
        clientId: 'TNK1',
        clientCode: 'TNK',
        companyName: '田中 歯科医院',
        repName: '田中 医師',
        contactInfo: 'Email: tanaka@example.com',
        fiscalMonth: 12,
        status: 'active',
        sharedFolderId: 'mock_TNK_shared_id',
        processingFolderId: 'mock_TNK_original_id',
        archivedFolderId: 'mock_TNK_archived_id',
        excludedFolderId: 'mock_TNK_excluded_id',
        csvOutputFolderId: 'mock_TNK_csv_output_id',
        learningCsvFolderId: 'mock_TNK_learning_csv_id',
        taxFilingType: 'blue',
        consumptionTaxMode: 'general',
        accountingSoftware: 'mf',
        driveLinked: true,
        updatedAt: Timestamp.now()
    },
    {
        clientId: 'SMP1',
        clientCode: 'SMP',
        companyName: 'サンプル株式会社',
        repName: '見本 太郎',
        contactInfo: 'TeL: 03-1234-5678',
        fiscalMonth: 3,
        status: 'active',
        sharedFolderId: 'mock_SMP_shared_id',
        processingFolderId: 'mock_SMP_original_id',
        archivedFolderId: 'mock_SMP_archived_id',
        excludedFolderId: 'mock_SMP_excluded_id',
        csvOutputFolderId: 'mock_SMP_csv_output_id',
        learningCsvFolderId: 'mock_SMP_learning_csv_id',
        taxFilingType: 'blue',
        consumptionTaxMode: 'general',
        accountingSoftware: 'yayoi',
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

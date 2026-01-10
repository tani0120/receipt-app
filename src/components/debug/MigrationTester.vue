<script setup lang="ts">
import { ref } from 'vue';
import { MigrationService } from '../../services/migration_service';
import { db } from '@/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const migrationService = new MigrationService();

const clientId = ref('1001');
const jobId = ref('1001_job01');
const statusMessage = ref('');
const debugResult = ref<any>(null);
const isProcessing = ref(false);

const log = (msg: string) => {
  statusMessage.value = msg;
  console.log(`[MigrationTester] ${msg}`);
};

// --- Seeding ---
const handleSeedMockData = async () => {
    if (!confirm('Legacy用モックデータ(1001, 1001_job01)をFirestoreに書き込みますか？')) return;

    try {
        isProcessing.value = true;

        // 1. Seed Client
        const clientData = {
            clientCode: '1001',
            companyName: '株式会社 テスト商事 (Legacy)',
            status: 'active',
            defaultTaxRate: 0.10,
            updatedAt: Timestamp.now(),
            users: ['user_a']
        };
        await setDoc(doc(db, 'clients', '1001'), clientData);
        log('Seeded Legacy Client: 1001');

        // 2. Seed Job
        const jobData = {
            id: '1001_job01',
            clientCode: '1001',
            status: 'done',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            transactionDate: Timestamp.now(),
            driveFileUrl: 'https://example.com/file.pdf',
            lines: [
                { amount: 10000, taxAmount: 1000, description: 'PC monitor' },
                { amount: 500, taxAmount: 50, description: 'Cable' }
            ],
            confidenceScore: 0.95
        };
        await setDoc(doc(db, 'jobs', '1001_job01'), jobData);
        log('Seeded Legacy Job: 1001_job01');

        alert('Seed Completed! Now you can try Dry Run.');
    } catch (e) {
        console.error(e);
        log('Seed Error: ' + e);
        alert('Seed Failed');
    } finally {
        isProcessing.value = false;
    }
};

/**
 * Handle Client Migration
 */
const handleClientMigration = async (dryRun: boolean) => {
  if (!clientId.value) {
    alert('Client ID is required');
    return;
  }

  isProcessing.value = true;
  log(`Starting Client Migration (${dryRun ? 'Dry Run' : 'Exec'})...`);

  try {
    await migrationService.migrateClient(clientId.value, dryRun);
    if (!dryRun) alert('Client Migration Completed! Check Console or Firestore.');
    log(`Client Migration Finished (${dryRun ? 'Dry Run' : 'Exec'}).`);
  } catch (error) {
    console.error(error);
    log('Error during Client Migration. Check Console.');
    alert('Error occurred');
  } finally {
    isProcessing.value = false;
  }
};

/**
 * Handle Job Migration
 */
const handleJobMigration = async (dryRun: boolean) => {
  if (!jobId.value) {
    alert('Job ID is required');
    return;
  }

  isProcessing.value = true;
  log(`Starting Job Migration (${dryRun ? 'Dry Run' : 'Exec'})...`);

  try {
    const result = await migrationService.migrateJob(jobId.value, dryRun);
    if (dryRun) debugResult.value = result; // Capture result

    if (!dryRun) alert('Job Migration Completed! Check Console or Firestore.');
    log(`Job Migration Finished (${dryRun ? 'Dry Run' : 'Exec'}).`);
  } catch (error) {
    console.error(error);
    log('Error during Job Migration. Check Console.');
    alert('Error occurred');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="migration-tester p-6 border rounded-lg bg-gray-50 shadow-sm">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Migration Service Debugger</h2>

    <!-- Status Display -->
    <div v-if="statusMessage" class="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm font-mono">
      {{ statusMessage }}
    </div>

    <!-- JSON Result Display -->
    <div v-if="debugResult" class="mb-6 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs font-mono">
      <div class="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
         <span class="font-bold">Last Output JSON</span>
         <button @click="debugResult = null" class="text-gray-400 hover:text-white"><i class="fa-solid fa-times"></i></button>
      </div>
      <pre>{{ JSON.stringify(debugResult, null, 2) }}</pre>
    </div>

    <!-- Seeding Section -->
    <div class="mb-6 pb-6 border-b border-gray-200">
      <h3 class="text-lg font-semibold mb-3">0. Test Data Seeding</h3>
      <div class="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
         <div class="text-sm text-yellow-800 flex-1">
            <strong>Legacy Mock Data:</strong>
            <ul class="list-disc ml-5 mt-1 text-xs">
                <li>Client: 1001 (株式会社 テスト商事)</li>
                <li>Job: 1001_job01 (Status: done, Lines: 2)</li>
            </ul>
         </div>
         <button
           @click="handleSeedMockData"
           :disabled="isProcessing"
           class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors shadow-sm font-bold"
         >
           <i class="fa-solid fa-database"></i> Seed Mock Data
         </button>
      </div>
    </div>

    <!-- Client Migration Section -->
    <div class="mb-6 pb-6 border-b border-gray-200">
      <h3 class="text-lg font-semibold mb-3">1. Client Migration (Legacy -> V2)</h3>
      <div class="flex gap-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">Legacy Client ID (Client Code)</label>
          <input
            v-model="clientId"
            type="text"
            placeholder="e.g. AMT"
            class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="handleClientMigration(true)"
            :disabled="isProcessing"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Dry Run
          </button>
          <button
            @click="handleClientMigration(false)"
            :disabled="isProcessing"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Execute!
          </button>
        </div>
      </div>
    </div>

    <!-- Job Migration Section -->
    <div>
      <h3 class="text-lg font-semibold mb-3">2. Job Migration (Legacy -> WorkLog & Receipt)</h3>
      <div class="flex gap-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">Legacy Job ID</label>
          <input
            v-model="jobId"
            type="text"
            placeholder="e.g. job_12345"
            class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="handleJobMigration(true)"
            :disabled="isProcessing"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Dry Run
          </button>
          <button
            @click="handleJobMigration(false)"
            :disabled="isProcessing"
            class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Execute!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal CSS fallback if Tailwind is not working */
.migration-tester {
  max-width: 800px;
  margin: 0 auto;
}
</style>

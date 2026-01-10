
<template>
  <div class="p-8 bg-slate-50 min-h-screen font-sans">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">顧問先管理</h1>
        <p class="text-slate-500 mt-1">顧問先の一覧確認と情報の編集が行えます。</p>
      </div>

      <!-- Stats Card -->
      <div class="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
        <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
           <!-- Users Icon -->
           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        </div>
        <div>
           <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">総顧問先数</p>
           <p class="text-2xl font-bold text-slate-800 leading-none">{{ totalCount }}</p>
        </div>
      </div>
    </div>

    <!-- Controls Area -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
      <div class="relative w-full max-w-lg">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="検索: 会社名、コード、代表者名..."
          class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 text-slate-700"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <!-- Right side actions (e.g. Export, Add New) could go here -->
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-start gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
            <h3 class="font-bold">データの読み込みに失敗しました</h3>
            <p class="text-sm mt-1">{{ error.message }}</p>
        </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col justify-center items-center py-20 text-slate-400">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
        <p>読み込み中...</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-100">
          <thead>
            <tr class="bg-slate-50/50">
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">コード</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">会社名 / 代表者</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">決算月</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ステータス</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Drive連携</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">会計ソフト</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">アクション</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="client in filteredClients" :key="client.clientCode" class="group hover:bg-slate-50/80 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                      {{ client.clientCode }}
                  </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-900">{{ client.companyName }}</span>
                    <span class="text-xs text-slate-500 mt-0.5" v-if="client.repName">{{ client.repName }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-slate-700 font-medium">
                      {{ client.fiscalMonth }}月
                  </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border"
                  :class="getStatusClass(client)"
                >
                  {{ getStatusLabel(client) }}
                </span>
              </td>
               <td class="px-6 py-4">
                  <div class="flex flex-col gap-1 text-xs">
                     <a :href="client.sharedFolderId ? `https://drive.google.com/drive/folders/${client.sharedFolderId}` : '#'" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1">
                        <i class="fa-regular fa-folder-open"></i> 顧客保管
                     </a>
                     <!-- Other links can be simulated or derived -->
                  </div>
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {{ client.accountingSoftware || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="openEditModal(client)"
                  class="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                  title="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="filteredClients.length === 0 && !loading">
                <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p class="text-lg font-medium">条件に一致する顧問先は見つかりませんでした</p>
                        <p class="text-sm mt-1">検索条件を変更して再度お試しください</p>
                    </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Modal -->
    <!-- Edit Modal (Component) -->
    <ScreenA_Detail_EditModal
        :visible="isEditModalOpen"
        :initial-data="editingClient"
        @close="closeEditModal"
        @save="onModalSave"
    />
  </div>
</template>

<script setup lang="ts">
import { useClientListRPC } from '@/composables/useClientListRPC';
import ScreenA_Detail_EditModal from '@/components/ScreenA_Detail_EditModal.vue';
import type { ClientUi } from '@/types/ui.type';

// Logic is strictly imported from the Composable
const {
    // State
    loading,
    error,
    searchQuery,

    // Computed
    totalCount,
    filteredClients,

    // Modal & Actions
    isEditModalOpen,
    editingClient,
    openEditModal,
    closeEditModal,
    handleUpdateClient,

    // UI Helpers
    getStatusLabel,
    getStatusClass
} = useClientListRPC();

// Mapping logic: Form (Component) -> ClientUi (API)
const mapFormToClientUi = (original: ClientUi, form: any): ClientUi => {
    return {
        ...original,
        clientCode: form.code,
        companyName: form.name,
        repName: form.rep,
        staffName: form.staffName,
        type: form.type,
        fiscalMonth: form.fiscalMonth,
        status: form.isActive ? 'active' : 'inactive', // Simple map

        // Contact
        contact: {
            type: form.contact.type,
            value: form.contact.value
        },

        // Settings
        accountingSoftware: form.settings.software,
        taxMethod: form.settings.taxMethod,
        taxCalculationMethod: form.settings.taxCalculationMethod,
        roundingSettings: form.settings.roundingSettings,

        // Complex mappings
        consumptionTaxMode: form.settings.consumptionTax === 'exempt' ? 'exempt' :
                            form.settings.consumptionTax.startsWith('simplified') ? 'simplified' : 'general',
        simplifiedTaxCategory: form.settings.consumptionTax.startsWith('simplified') ?
                               parseInt(form.settings.consumptionTax.split('_')[1]) as any : undefined,

        taxFilingType: form.settings.taxType === '青色' ? 'blue' : 'white',

        isInvoiceRegistered: form.settings.isInvoiceRegistered,
        invoiceRegistrationNumber: form.settings.invoiceRegistrationNumber,

        // Label updates (Optional, but good for optimistic UI)
        softwareLabel: form.settings.software,
        calculationMethodLabel: form.settings.calcMethod,

        // Preserve others
        driveLinked: original.driveLinked,
        driveLinks: original.driveLinks,
        sharedFolderId: original.sharedFolderId,
        processingFolderId: original.processingFolderId,
        archivedFolderId: original.archivedFolderId,
        excludedFolderId: original.excludedFolderId,
        csvOutputFolderId: original.csvOutputFolderId,
        learningCsvFolderId: original.learningCsvFolderId,
        defaultTaxRate: original.defaultTaxRate,
        actions: original.actions
    };
};

const onModalSave = async (formData: any) => {
    if (!editingClient.value) return;

    // Map form data back to ClientUi structure
    const updatedClient = mapFormToClientUi(editingClient.value, formData);

    // Update the ref so handleUpdateClient picks it up
    Object.assign(editingClient.value, updatedClient);

    await handleUpdateClient();
};
</script>

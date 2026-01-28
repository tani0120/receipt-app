<template>
  <div class="h-full flex flex-col bg-slate-50 relative overflow-hidden">
    <!-- Header Section -->
    <div class="p-6 pb-0 shrink-0">
        <div class="flex justify-between items-start mb-6">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">顧問先一覧</h1>
                <p class="text-slate-500 text-sm mt-1">税務・会計データの連携状況管理</p>
            </div>
            <div class="flex gap-3">
                <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
                    <i class="fa-solid fa-download"></i> CSV出力
                </button>
                <button @click="openNewModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> 新規登録
                </button>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div class="text-xs font-bold text-slate-400 mb-1">登録顧問先数</div>
                <div class="text-2xl font-bold text-slate-700">{{ stats.total }} <span class="text-sm font-normal text-slate-400">社</span></div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500">
                <div class="text-xs font-bold text-slate-400 mb-1">稼働中</div>
                <div class="text-2xl font-bold text-blue-600">{{ stats.active }} <span class="text-sm font-normal text-slate-400">社</span></div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div class="text-xs font-bold text-slate-400 mb-1">決算月 (今月)</div>
                <div class="text-2xl font-bold text-green-600">{{ stats.fiscalThisMonth }} <span class="text-sm font-normal text-slate-400">社</span></div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-l-red-500">
                <div class="text-xs font-bold text-slate-400 mb-1">申告月 (今月)</div>
                <div class="text-2xl font-bold text-red-500">{{ stats.filingThisMonth }} <span class="text-sm font-normal text-slate-400">社</span></div>
            </div>
        </div>

        <!-- Search & Filter Bar -->
        <div class="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center shadow-sm z-10 relative">
            <div class="flex items-center gap-4 flex-1">
                <div class="relative w-96">
                    <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" v-model="searchQuery" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" placeholder="会社名、コード、担当者で検索...">
                </div>
                <!-- Filter Tabs -->
                <div class="flex p-1 bg-slate-100 rounded-lg">
                    <button v-for="tab in filters" :key="tab.val"
                        @click="activeFilter = tab.val"
                        :class="['px-4 py-1.5 text-xs font-bold rounded-md transition', activeFilter === tab.val ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700']">
                        {{ tab.label }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Table Section (Strict Columns) -->
    <div class="px-6 pb-6 flex-1 overflow-hidden flex flex-col">
        <div class="bg-white border border-slate-200 rounded-b-xl shadow-sm flex-1 overflow-hidden flex flex-col">
            <!-- Table Header -->
            <!-- Columns: Status(105) | Code(87) | Name(450) | Staff(120) | Contact(60) | Fiscal(94) | Soft(192) | Drive(200) | Edit(40) | Spacer -->
            <div class="grid grid-cols-[105px_87px_450px_120px_60px_94px_192px_200px_40px_1fr] bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                <div class="px-4 py-3 flex items-center">設定状況</div>
                <div @click="toggleSort('code')" class="px-4 py-3 flex items-center cursor-pointer hover:bg-slate-100 transition">
                    3コード
                    <i v-if="sortKey === 'code'" :class="['ml-1 fa-solid', sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down']"></i>
                    <i v-else class="ml-1 fa-solid fa-sort text-slate-300"></i>
                </div>
                <div @click="toggleSort('name')" class="px-4 py-3 flex items-center cursor-pointer hover:bg-slate-100 transition">
                    会社名
                    <i v-if="sortKey === 'name'" :class="['ml-1 fa-solid', sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down']"></i>
                    <i v-else class="ml-1 fa-solid fa-sort text-slate-300"></i>
                </div>
                <div @click="toggleSort('staff')" class="px-4 py-3 flex items-center cursor-pointer hover:bg-slate-100 transition">
                    担当
                    <i v-if="sortKey === 'staff'" :class="['ml-1 fa-solid', sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down']"></i>
                    <i v-else class="ml-1 fa-solid fa-sort text-slate-300"></i>
                </div>
                <div class="px-4 py-3 flex items-center text-center justify-center">連絡</div>
                <div @click="toggleSort('fiscal')" class="px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition">
                    決算月
                    <i v-if="sortKey === 'fiscal'" :class="['ml-1 fa-solid', sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down']"></i>
                    <i v-else class="ml-1 fa-solid fa-sort text-slate-300"></i>
                </div>
                <div @click="toggleSort('software')" class="px-4 py-3 flex items-center cursor-pointer hover:bg-slate-100 transition">
                    ソフト/税/基準
                    <i v-if="sortKey === 'software'" :class="['ml-1 fa-solid', sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down']"></i>
                    <i v-else class="ml-1 fa-solid fa-sort text-slate-300"></i>
                </div>
                <div class="px-4 py-3 flex items-center">Drive連携</div>
                <div class="px-2 py-3 flex items-center justify-center"></div> <!-- Edit Button Column -->
                <div></div> <!-- Spacer -->
            </div>

            <!-- Table Body -->
            <div class="overflow-y-auto divide-y divide-slate-100 flex-1 custom-scrollbar">
                <div v-for="client in sortedClients" :key="client.clientCode"
                     @click="navigateToDetail(client.clientCode)"
                     class="grid grid-cols-[105px_87px_450px_120px_60px_94px_192px_200px_40px_1fr] hover:bg-blue-50/50 transition cursor-pointer group items-center">

                    <!-- 1. 設定状況 -->
                    <div class="px-4 py-3">
                        <span v-if="client.isActive" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> 稼働中
                        </span>
                        <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> 停止中
                        </span>
                    </div>

                    <!-- 2. 3コード (Client Code 3 chars) - CLICK TO EDIT -->
                    <div @click.stop="openEditModal(client)" class="px-4 py-3 font-mono text-sm font-bold text-slate-600 cursor-pointer hover:text-blue-600 hover:underline" title="クリックして編集">
                        {{ client.clientCode.slice(0, 3) }}
                    </div>

                    <!-- 3. 会社名 (Fixed 400px) -->
                    <div class="px-4 py-3">
                        <div class="font-bold text-slate-700 truncate text-sm Group-hover:text-blue-600 transition">
                            {{ client.type === 'individual' ? client.repName : client.companyName }}
                        </div>
                    </div>

                    <!-- 4. 担当 (Show staffName) -->
                    <div class="px-4 py-3 flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                            {{ client.staffName ? client.staffName.charAt(0) : '-' }}
                        </div>
                        <span class="text-xs text-slate-600 font-medium truncate">{{ client.staffName || '未割当' }}</span>
                    </div>

                    <!-- 5. 連絡 (Icons Only) -->
                    <div class="px-4 py-3 flex justify-center">
                        <a v-if="client.contact.type === 'chatwork'" :href="client.contact.value" target="_blank" @click.stop class="hover:opacity-75 transition">
                             <i class="fa-solid fa-comment-dots text-red-500 text-lg"></i>
                        </a>
                        <a v-else-if="client.contact.type === 'email'" :href="`mailto:${client.contact.value}`" @click.stop class="hover:opacity-75 transition">
                             <i class="fa-regular fa-envelope text-blue-500 text-lg"></i>
                        </a>
                        <span v-else class="text-xs text-slate-300">-</span>
                    </div>

                    <!-- 6. 決算月 -->
                    <div class="px-4 py-3 text-center">
                        <span class="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600 border border-slate-200">
                            {{ client.fiscalMonth }}月
                        </span>
                    </div>

                    <!-- 7. ソフト/税/基準 (Account Config) -->
                    <div class="px-4 py-3">
                         <div class="text-[10px] text-slate-500 font-mono tracking-tight flex items-center">
                                <span class="w-[56px] truncate" title="ソフト">{{ client.softwareLabel }}</span>
                                <span class="text-slate-300 mx-1">/</span>
                                <span class="w-[24px] text-center" title="税区分">{{ client.taxMethodLabel }}</span>
                                <span class="text-slate-300 mx-1">/</span>
                                <span class="w-[48px] text-center" title="計上基準">{{ client.calcMethodShortLabel }}</span>
                         </div>
                    </div>

                    <!-- 8. drive連携 (Text Links) -->
                    <div class="px-4 py-3 flex items-center gap-2 text-[10px] font-bold text-blue-600">
                        <a :href="client.driveLinks.storage" target="_blank" @click.stop class="hover:underline hover:text-blue-800">顧客共有</a>
                        <span class="text-slate-300">|</span>
                        <a :href="client.driveLinks.journalOutput" target="_blank" @click.stop class="hover:underline hover:text-blue-800">仕訳出力</a>
                        <span class="text-slate-300">|</span>
                        <a :href="client.driveLinks.journalExclusion" target="_blank" @click.stop class="hover:underline hover:text-blue-800">仕訳除外</a>
                    </div>

                    <!-- 9. Edit Button -->
                     <div class="px-2 py-3 flex justify-center">
                        <button @click.stop="openEditModal(client)" class="text-slate-400 hover:text-blue-600 transition">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>

                    <!-- 10. Spacer -->
                    <div></div>

                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <aaa_ClientModal
        :visible="isModalVisible"
        :mode="modalMode"
        :initialData="selectedClient"
        @close="closeModal"
        @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { aaa_useAccountingSystem } from '@/composables/useAccountingSystem';
import aaa_ClientModal from './ClientModal.vue';
import type { ClientUi } from '@/types/ui.type'; // Import UI type

const router = useRouter();
const { clients, fetchClients, createClient, updateClient } = aaa_useAccountingSystem();

// --- State ---
const searchQuery = ref('');
const activeFilter = ref('all');
const filters = [
  { label: 'すべて', val: 'all' },
  { label: '稼働中', val: 'active' },
  { label: '停止中', val: 'inactive' },
  { label: '決算月', val: 'fiscal' }
];

const sortKey = ref<string | null>('code');
const sortOrder = ref<'asc' | 'desc'>('asc');

const isModalVisible = ref(false);
const modalMode = ref<'new' | 'edit'>('new');
const selectedClient = ref<any>(null); // Use any for modal compatibility or strict type

// --- Stats Logic ---
const stats = computed(() => {
    const list = clients.value;
    const currentMonth = new Date().getMonth() + 1;
    return {
        total: list.length,
        active: list.filter(c => c.isActive).length,
        driveLinked: list.filter(c => c.driveLinked).length,
        fiscalThisMonth: list.filter(c => c.fiscalMonth === currentMonth).length,
        filingThisMonth: list.filter(c => c.fiscalMonth === currentMonth).length // Needs actual logic for Filing Month vs Fiscal Month usually, but using same for now as placeholder or distinct logic if available
    };
});

// --- Filter & Sort Logic ---
const sortedClients = computed(() => {
    let list = clients.value;

    // 1. Text Search
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(c =>
            c.companyName.toLowerCase().includes(q) ||
            c.clientCode.toLowerCase().includes(q) ||
            (c.repName && c.repName.toLowerCase().includes(q))
        );
    }

    // 2. Tab Filter
    if (activeFilter.value === 'active') {
        list = list.filter(c => c.isActive);
    } else if (activeFilter.value === 'inactive') {
        list = list.filter(c => !c.isActive);
    } else if (activeFilter.value === 'fiscal') {
        const currentMonth = new Date().getMonth() + 1;
        list = list.filter(c => c.fiscalMonth === currentMonth);
    }

    // 3. Sorting
    if (sortKey.value) {
        list = [...list].sort((a, b) => { // Create copy to sort
            let valA: any = '';
            let valB: any = '';

            // Mapping sortKey to actual fields
            switch(sortKey.value) {
                case 'code':
                    valA = a.clientCode;
                    valB = b.clientCode;
                    break;
                case 'name':
                    valA = a.type === 'individual' ? a.repName : a.companyName; // Sort by display name
                    valB = b.type === 'individual' ? b.repName : b.companyName;
                    break;
                case 'staff':
                     valA = a.staffName || '';
                     valB = b.staffName || '';
                     break;
                 case 'fiscal':
                     valA = a.fiscalMonth;
                     valB = b.fiscalMonth;
                     break;
                 case 'software':
                     valA = a.softwareLabel || '';
                     valB = b.softwareLabel || '';
                     break;
                 default:
                     return 0;
            }

            if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return list;
});

const toggleSort = (key: string) => {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey.value = key;
        sortOrder.value = 'asc';
    }
};

// --- Actions ---

const openNewModal = () => {
    modalMode.value = 'new';
    selectedClient.value = null;
    isModalVisible.value = true;
};

const openEditModal = (client: ClientUi) => {
    modalMode.value = 'edit';
    // We pass the UI object. The modal should handle it or we might need to fetch raw data?
    // For now, passing UI object is usually fine if modal uses it for display.
    // However, saving back might require conversion.
    // Let's pass a safe copy.
    selectedClient.value = JSON.parse(JSON.stringify(client));
    isModalVisible.value = true;
};

const closeModal = () => {
    isModalVisible.value = false;
};

const navigateToDetail = (code: string) => {
    router.push({ name: 'ScreenA_Detail', params: { code } });
};

const handleSave = async (formData: any) => {
    // Helper to map consumption tax composite
    let consumptionTaxMode = 'general';
    let simplifiedTaxCategory: number | undefined = undefined;

    if (formData.settings.consumptionTax === 'exempt') {
        consumptionTaxMode = 'exempt';
    } else if (formData.settings.consumptionTax && formData.settings.consumptionTax.startsWith('simplified_')) {
        consumptionTaxMode = 'simplified';
        simplifiedTaxCategory = Number(formData.settings.consumptionTax.split('_')[1]);
    }

    const payload = {
        clientCode: formData.code,
        companyName: formData.name,
        repName: formData.rep,
        staffName: formData.staffName, // Added
        type: formData.type || 'corp', // Added
        fiscalMonth: Number(formData.fiscalMonth),
        status: (formData.isActive ? 'active' : 'inactive') as 'active' | 'inactive' | 'suspension',
        accountingSoftware: formData.settings.software,

        contactInfo: formData.contact.value, // Simplified mapping

        // Tax Settings
        taxFilingType: (formData.settings.taxType === '青色' ? 'blue' : 'white') as 'blue' | 'white',
        consumptionTaxMode: consumptionTaxMode as 'general' | 'simplified' | 'exempt',
        simplifiedTaxCategory: simplifiedTaxCategory as 1 | 2 | 3 | 4 | 5 | 6 | undefined,
        taxMethod: formData.settings.taxMethod as 'inclusive' | 'exclusive',

        // New Fields
        taxCalculationMethod: formData.settings.taxCalculationMethod as 'stack' | 'back',
        roundingSettings: formData.settings.roundingSettings as 'floor' | 'round' | 'ceil',
        isInvoiceRegistered: Boolean(formData.settings.isInvoiceRegistered),
        invoiceRegistrationNumber: formData.settings.invoiceRegistrationNumber,

        calculationMethod: (formData.settings.calcMethod === '発生主義' ? 'accrual' : (formData.settings.calcMethod === '現金主義' ? 'cash' : 'interim_cash')) as 'accrual' | 'cash' | 'interim_cash',
    };

    if (modalMode.value === 'new') {
        try {
            await createClient({
                ...payload,
                status: (formData.isActive ? 'active' : 'inactive') as 'active' | 'inactive' | 'suspension'
            });
            closeModal();
        } catch (e) {
            console.error(e);
            alert('登録に失敗しました');
        }
    } else {
        // Edit Mode - Should update existing client
        try {
            await updateClient(payload.clientCode, payload);
            closeModal();
        } catch (e) {
            console.error(e);
            alert('更新に失敗しました');
        }
    }
};

onMounted(() => {
    fetchClients();
});
</script>

<style scoped>
/* Custom Scrollbar for Table Body */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>

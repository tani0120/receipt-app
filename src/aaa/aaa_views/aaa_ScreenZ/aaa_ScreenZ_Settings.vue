<template>
    <div class="animate-fade-in space-y-8 pb-12">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-cogs"></i> システム設定・環境設定
            </h2>
            <StandardButton variant="primary" @click="saveSettings">
                <i class="fa-solid fa-save mr-2"></i> 設定を保存
            </StandardButton>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Basic Config -->
            <section class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 class="font-bold text-slate-600 mb-6 pb-2 border-b border-slate-100">基本情報設定</h3>
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-bold text-slate-500 mb-2">システム運用会社名</label>
                        <input v-model="data.settings.companyName" type="text" class="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-500 mb-2">管理者メールアドレス</label>
                        <input v-model="data.settings.adminEmail" type="email" class="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-500 mb-2">通知用 Slack Webhook URL</label>
                        <input v-model="data.settings.slackWebhook" type="password" class="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition bg-slate-50 text-slate-400 font-mono text-xs">
                    </div>
                </div>
            </section>

            <!-- Rules & Security -->
            <section class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 class="font-bold text-slate-600 mb-6 pb-2 border-b border-slate-100">計算・セキュリティルール</h3>
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-bold text-slate-500 mb-2">消費税計算 端数処理</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer border p-3 rounded hover:bg-slate-50 transition w-full justify-center" :class="data.settings.taxRounding === 'floor' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300'">
                                <input type="radio" v-model="data.settings.taxRounding" value="floor" class="hidden">
                                <i class="fa-solid fa-arrow-down-short-wide"></i> 切り捨て
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer border p-3 rounded hover:bg-slate-50 transition w-full justify-center" :class="data.settings.taxRounding === 'round' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300'">
                                <input type="radio" v-model="data.settings.taxRounding" value="round" class="hidden">
                                <i class="fa-solid fa-arrows-spin"></i> 四捨五入
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer border p-3 rounded hover:bg-slate-50 transition w-full justify-center" :class="data.settings.taxRounding === 'ceil' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300'">
                                <input type="radio" v-model="data.settings.taxRounding" value="ceil" class="hidden">
                                <i class="fa-solid fa-arrow-up-short-wide"></i> 切り上げ
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-500 mb-2">IP制限 (CIDR)</label>
                        <input v-model="data.settings.allowedIp" type="text" placeholder="ex: 192.168.1.1/32" class="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none transition font-mono">
                         <p class="text-xs text-gray-400 mt-1"><i class="fa-solid fa-info-circle"></i> 管理画面へのアクセスを許可するIPアドレス</p>
                    </div>

                    <div class="pt-4 border-t border-slate-100">
                        <label class="flex items-center justify-between cursor-pointer group">
                            <div>
                                <div class="font-bold text-slate-700">メンテナンスモード</div>
                                <div class="text-xs text-slate-400">一般ユーザーのアクセスを遮断します</div>
                            </div>
                            <div class="relative">
                                <input type="checkbox" v-model="data.settings.maintenanceMode" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                            </div>
                        </label>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { aaa_useAdminDashboard } from '@/aaa/aaa_composables/aaa_useAdminDashboard';
import StandardButton from '@/aaa/aaa_components/aaa_UI_StandardButton.vue';

const { data } = aaa_useAdminDashboard();

const saveSettings = () => {
    alert('設定を保存しました。\nシステム全体に即時反映されます。');
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

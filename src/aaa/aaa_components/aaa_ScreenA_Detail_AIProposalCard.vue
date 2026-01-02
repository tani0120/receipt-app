<template>
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
        <h2 class="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-robot text-purple-500"></i> AI提案ルール
        </h2>
        <div class="flex-1 overflow-auto border border-slate-100 rounded-lg">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                        <th class="px-4 py-3 whitespace-nowrap">コード / 会社名</th>
                        <th class="px-4 py-3">AI提案内容・理由・効果</th>
                        <th class="px-4 py-3 w-32">アクション</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                    <!-- Phase A: Mock Row -->
                    <tr class="hover:bg-slate-50/50">
                        <td class="px-4 py-3 align-top">
                            <div class="font-mono font-bold">AMT</div>
                            <div class="text-xs text-slate-500">アマテラス商事</div>
                        </td>
                        <td class="px-4 py-3 align-top">
                            <p class="leading-relaxed">
                                <span class="font-bold text-purple-600">提案:</span> ドールト社の領収書は駐車場だが、過去仕訳では3回「旅費交通費」で計上。次回から「旅費交通費」で統一する。
                            </p>
                        </td>
                        <td class="px-4 py-3 align-top">
                            <div class="flex flex-col gap-1.5">
                                <button @click="$emit('approve')" class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-bold transition">承認</button>
                                <button @click="$emit('edit', 'ドールト社の領収書は駐車場だが、過去仕訳では3回「旅費交通費」で計上。次回から「旅費交通費」で統一する。')" class="px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs rounded transition">修正</button>
                                <button @click="$emit('reject')" class="px-2 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs rounded font-bold transition">却下</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
defineEmits(['approve', 'reject', 'edit']);
</script>

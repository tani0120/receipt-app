<template>
    <label :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'" class="group">
        <input type="radio" :value="value" :checked="modelValue === value" @change="!disabled && $emit('update:modelValue', value)" :disabled="disabled" class="peer sr-only">
        <div class="border-2 rounded-lg p-3 text-center transition"
             :class="disabled
                 ? 'border-gray-200 bg-gray-50'
                 : 'border-gray-100 peer-checked:border-orange-400 peer-checked:bg-orange-50 group-hover:border-gray-200'">
            <div class="text-xs font-bold" :class="disabled ? 'text-gray-400' : 'text-slate-700'">{{ label }}</div>
            <div v-if="badge" class="text-[10px] mt-1 font-bold" :class="disabled ? 'text-amber-500' : 'text-gray-400'">{{ badge }}</div>
        </div>
    </label>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    value: string
    label: string
    disabled?: boolean
    badge?: string
}>()
defineEmits(['update:modelValue'])
</script>

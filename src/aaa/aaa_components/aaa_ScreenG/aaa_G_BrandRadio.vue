<template>
    <label class="cursor-pointer group">
        <input type="radio" :value="value" :checked="modelValue === value" @change="$emit('update:modelValue', value)" class="peer sr-only">
        <div class="border-2 border-gray-100 peer-checked:border-orange-400 peer-checked:bg-orange-50 rounded-lg p-3 text-center transition group-hover:border-gray-200">
            <div class="text-xs font-bold text-slate-700">{{ label }}</div>
        </div>
    </label>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
    value: string
    label: string
}>()
defineEmits(['update:modelValue'])
</script>

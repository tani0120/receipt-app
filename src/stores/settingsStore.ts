/**
 * 設定ストア — 基本情報パネルの値を画面間で共有
 *
 * ScreenS_Settings.vue の基本情報パネルで設定した値を
 * MockClientAccountsPage.vue / MockClientTaxPage.vue で参照する。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type EntityType = 'corporate' | 'individual';
export type TaxMethod = 'general' | 'simplified' | 'exempt';

export const useSettingsStore = defineStore('settings', () => {
    /** 法人/個人 */
    const entityType = ref<EntityType>('corporate');

    /** 不動産所得あり（個人の場合のみ有効） */
    const hasRealEstate = ref(false);

    /** インボイス登録事業者 */
    const invoiceRegistered = ref(true);

    /** 課税方式 */
    const taxMethod = ref<TaxMethod>('general');

    return { entityType, hasRealEstate, invoiceRegistered, taxMethod };
});

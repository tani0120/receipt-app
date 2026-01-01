import type { Client } from './aaa_firestore';

export type { Client };

// UI向けの拡張型が必要な場合はここに追記
export interface ClientUI extends Client {
    // UI computed properties (optional)
    isActive: boolean;
    displayFiscalMonth: string;
}

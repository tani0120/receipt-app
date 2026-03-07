/**
 * ClientRaw - APIモックのDB取得結果を模擬する型
 * Phase A: clients.ts のモックデータ用
 * Phase B: DB接続時に ClientSchema に移行予定
 */
export interface ClientRaw {
    clientCode: string;
    companyName: string;
    repName?: string;
    staffName?: string;
    type?: 'corp' | 'individual';
    fiscalMonth?: number;
    status?: 'active' | 'inactive' | 'suspension';
    contactInfo?: string;
    accountingSoftware?: 'yayoi' | 'freee' | 'mf' | 'tkc' | 'other';
    taxFilingType?: 'blue' | 'white';
    consumptionTaxMode?: 'general' | 'simplified' | 'exempt';
    simplifiedTaxCategory?: number;
    defaultTaxRate?: number;
    taxMethod?: 'inclusive' | 'exclusive';
    calculationMethod?: 'accrual' | 'cash' | 'interim_cash';
    isInvoiceRegistered?: boolean;
    invoiceRegistrationNumber?: string;
    taxCalculationMethod?: 'stack' | 'back';
    roundingSettings?: 'floor' | 'round' | 'ceil';
    driveLinked?: boolean;
}

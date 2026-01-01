export interface InstitutionFingerprint {
    id: string; // "bank_mufj", "card_rakuten"
    name: string; // "三菱UFJ銀行"
    type: 'bank' | 'credit_card' | 'other';
    features: {
        primaryColors: string[]; // ["#d90b16"]
        keywords: string[]; // ["カ) ミツビシユー", "振込手数料"]
        headerPatterns?: string[]; // specific header text or layout markers
    };
}

export interface AccountBalance {
    clientId: string;
    fiscalYear: number;
    month: number; // 1-12
    accountId: string; // 勘定科目・補助科目ID
    accountName: string; // "三菱UFJ 普通"
    closingBalance: number; // 月末残高
    // For validation
    source: 'GL' | 'Manual';
}

export type DetectionCategory =
    | 'ASSET_FINANCE'
    | 'CLARIFICATION'
    | 'COMPLIANCE'
    | 'AR_AP'
    | 'ROUTINE';

export interface DetectionAlert {
    id: string;
    category: DetectionCategory;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    // Actionable metadata
    relatedJournalId?: string;
    requiredMaterial?: string[]; // ["Invoice", "Contract"]
    isResolved: boolean;
}

export interface MonthlyCollectionStatus {
    clientId: string;
    year: number;
    month: number;
    items: {
        name: string; // "NTT", "Rent"
        isReceived: boolean;
        sourceType: 'Monthly' | 'Seasonal' | 'Event';
    }[];
}

export interface LearningRuleUi {
    id: string;
    clientId: string;           // 顧問先ID
    priority: number;           // 1(高) ~ 5(低)
    status: 'active' | 'inactive' | 'draft';

    // Trigger (If)
    trigger: {
        type: 'description' | 'vendor' | 'amount';
        keyword: string;        // "タクシー", "Amazon"
        amountRange?: { min?: number; max?: number };
    };

    // Result (Then)
    result: {
        debitAccount: string;   // 借方勘定科目
        targetTaxClass?: string;      // 税区分 (Optional)
    };

    // Meta
    confidence: number;         // 0.0 ~ 1.0 (AI確信度)
    hitCount: number;           // 適用回数
    lastUsedAt?: string;
    generatedBy: 'ai' | 'human';
}

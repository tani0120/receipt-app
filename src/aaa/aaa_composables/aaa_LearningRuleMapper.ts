import { Timestamp } from 'firebase/firestore';
import type { LearningRuleApi } from '@/aaa/aaa_types/aaa_zod.type';
import type { LearningRuleUi } from '@/aaa/aaa_types/aaa_ui.type';

// Helpers (Same as JobMapper, duplicated for isolation or imported? Standard practice: pure functions)
function toDate(ts: Timestamp | null | undefined, defaultValue: Date = new Date(0)): Date {
    if (!ts) return defaultValue;
    if (typeof (ts as any).toDate === 'function') {
        return (ts as Timestamp).toDate();
    }
    if (typeof (ts as any).seconds === 'number') {
        return new Timestamp((ts as any).seconds, (ts as any).nanoseconds).toDate();
    }
    return defaultValue;
}

function toDateLabel(date: Date, format: string = 'YYYY/MM/DD'): string {
    if (date.getTime() === 0) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
}

function mapTargetField(field: string | undefined): 'description' | 'vendor' | 'amount_range' {
    const valid = ['description', 'vendor', 'amount_range'];
    if (valid.includes(field as string)) return field as 'description' | 'vendor' | 'amount_range';
    return 'description'; // Fallback
}

function mapTargetFieldLabel(field: 'description' | 'vendor' | 'amount_range'): string {
    const map: Record<string, string> = {
        description: '摘要',
        vendor: '取引先名',
        amount_range: '金額範囲'
    };
    return map[field] || '不明';
}

export function mapLearningRuleApiToUi(api: LearningRuleApi): LearningRuleUi {
    const id = api.id || '';
    const clientCode = api.clientCode || '';
    const keyword = api.keyword || '';

    const targetField = mapTargetField(api.targetField);
    const targetFieldLabel = mapTargetFieldLabel(targetField);

    const accountItem = api.accountItem || '';
    const subAccount = api.subAccount || '';
    const taxClass = api.taxClass || '';

    const confidenceScore = api.confidenceScore || 0;
    const hitCount = api.hitCount || 0;

    const isActive = api.isActive ?? false;

    const updatedAt = toDate(api.updatedAt);
    const updatedAtLabel = toDateLabel(updatedAt);

    return {
        id,
        clientCode,
        keyword,
        targetField,
        targetFieldLabel,
        accountItem,
        subAccount,
        taxClass,
        confidenceScore,
        hitCount,
        isActive,
        updatedAt,
        updatedAtLabel
    };
}

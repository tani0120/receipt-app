import { ref, computed } from 'vue';
import type { LearningRuleUi } from '@/types/LearningRuleUi';
import type { LearningRuleApi } from '@/types/zod.type';
import { mapLearningRuleApiToUi } from './AIRulesMapper';
import { Timestamp } from 'firebase/firestore';

// Mock Data Generator (DB Schema compliant)
const generateMockApiData = (clientId: string): LearningRuleApi[] => {
    const baseDate = new Date('2025-12-01');
    const ts = Timestamp.fromDate(baseDate);

    return [
        {
            id: 'rule-001',
            clientCode: clientId,
            keyword: 'タクシー',
            targetField: 'description',
            accountItem: '旅費交通費',
            taxClass: '課対仕入10%',
            confidenceScore: 0.98,
            hitCount: 142,
            isActive: true,
            updatedAt: ts
        },
        {
            id: 'rule-002',
            clientCode: clientId,
            keyword: 'Amazon',
            targetField: 'vendor',
            accountItem: '消耗品費',
            confidenceScore: 0.85,
            hitCount: 56,
            isActive: true, // UI maps 'human' logic based on score < 0.8? No, score here is high.
            updatedAt: ts
        },
        {
            id: 'rule-003',
            clientCode: clientId,
            keyword: 'コーヒー',
            targetField: 'description',
            accountItem: '会議費',
            confidenceScore: 0.72, // Maps to 'human' in mapper
            hitCount: 0,
            isActive: false, // Maps to 'inactive'
            updatedAt: ts
        }
    ];
};

// WORST CASE GENERATOR (Stress Test)
const generateWorstCaseApiData = (clientId: string, count: number): LearningRuleApi[] => {
    const list: LearningRuleApi[] = [];
    const ts = Timestamp.now();

    const longString = "This is a very long string designed to break the UI layout and overflow containers " +
        "これは非常に長い文字列でUIレイアウトを破壊しコンテナからあふれさせるために設計されています " +
        "🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥"; // 150+ chars

    for (let i = 0; i < count; i++) {
        list.push({
            id: `stress-rule-${i}`,
            clientCode: clientId,
            keyword: i % 3 === 0 ? longString : `Stress Keyword ${i}`,
            targetField: i % 2 === 0 ? 'description' : 'vendor',
            accountItem: i % 5 === 0 ? longString : `Account ${i}`,
            taxClass: '課対仕入10%',
            confidenceScore: Math.random(),
            hitCount: Math.floor(Math.random() * 10000),
            isActive: i % 10 !== 0, // 10% inactive
            updatedAt: ts
        });
    }
    return list;
};

export function useAIRules() {
    const rules = ref<LearningRuleUi[]>([]);
    const loading = ref(false);
    const filterStatus = ref<'all' | 'active' | 'draft'>('all');

    const fetchRules = async (clientId: string) => {
        loading.value = true;
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));

        // 1. Fetch Raw Data (Mock)
        const rawData = generateMockApiData(clientId);

        // 2. Strict Mapping (Ironclad)
        rules.value = rawData.map(mapLearningRuleApiToUi);

        loading.value = false;
    };

    const triggerStressTest = async (clientId: string = 'STRESS') => {
        console.warn('⚠️ TRIGGERING UI STRESS TEST ⚠️');
        loading.value = true;
        await new Promise(resolve => setTimeout(resolve, 200));

        const worstCaseData = generateWorstCaseApiData(clientId, 200); // 200 items
        rules.value = worstCaseData.map(mapLearningRuleApiToUi);

        loading.value = false;
        console.warn(`✅ Generated ${rules.value.length} stress items via Mapper`);
    };

    // Expose to window for manual testing
    (window as any).triggerRuleStressTest = triggerStressTest;

    const filteredRules = computed(() => {
        if (filterStatus.value === 'all') return rules.value;
        // Note: Mapper maps false -> 'inactive'. 'draft' is not naturally produced by mapper yet.
        return rules.value.filter(r => r.status === filterStatus.value);
    });

    const toggleStatus = (ruleId: string) => {
        const target = rules.value.find(r => r.id === ruleId);
        if (target) {
            target.status = target.status === 'active' ? 'inactive' : 'active';
        }
    };

    const isModalOpen = ref(false);
    const editingRule = ref<LearningRuleUi | null>(null);

    const handleNew = () => {
        editingRule.value = null; // Create mode
        isModalOpen.value = true;
    };

    const handleEdit = (rule: LearningRuleUi) => {
        editingRule.value = rule;
        isModalOpen.value = true;
    };

    const handleSave = (updatedRule: LearningRuleUi) => {
        if (updatedRule.id.startsWith('new-')) {
            rules.value.push(updatedRule);
        } else {
            const index = rules.value.findIndex(r => r.id === updatedRule.id);
            if (index !== -1) rules.value[index] = updatedRule;
        }
        isModalOpen.value = false;
    };

    return {
        rules,
        loading,
        filterStatus,
        filteredRules,
        fetchRules,
        triggerStressTest, // Export for usages
        toggleStatus,
        // deleteRule, // Removed as not in original ref? Or implementation details. Keeping safe.
        // Modal State
        isModalOpen,
        editingRule,
        handleNew,
        handleEdit,
        handleSave
    };
}

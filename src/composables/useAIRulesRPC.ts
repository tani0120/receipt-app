
import { ref } from 'vue';
import { client } from '@/client';
import type { LearningRuleUi } from '@/types/LearningRuleUi';

export interface ClientWithRulesUi {
    id: string;
    name: string;
    activeRules: number;
    totalRules: number;
}

export function useAIRulesRPC() {
    const clients = ref<ClientWithRulesUi[]>([]);
    const rules = ref<LearningRuleUi[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Dashboard: List Clients
    const fetchClients = async () => {
        loading.value = true;
        try {
            const res = await client.api['ai-rules'].clients.$get();
            if (!res.ok) throw new Error('Failed to fetch clients');
            clients.value = await res.json();
        } catch (e) {
            console.error(e);
            error.value = 'クライアント一覧の取得に失敗しました';
        } finally {
            loading.value = false;
        }
    };

    // Rule List for Client
    const fetchRules = async (clientId: string) => {
        loading.value = true;
        try {
            const res = await client.api['ai-rules'][':clientId'].rules.$get({ param: { clientId } });
            if (!res.ok) throw new Error('Failed to fetch rules');
            rules.value = await res.json();
        } catch (e) {
            console.error(e);
            error.value = 'ルールの取得に失敗しました';
        } finally {
            loading.value = false;
        }
    };

    // Create Rule
    const createRule = async (clientId: string, data: LearningRuleUi) => {
        try {
            const res = await client.api['ai-rules'][':clientId'].rules.$post({
                param: { clientId },
                json: {
                    priority: data.priority,
                    status: data.status,
                    trigger: data.trigger,
                    result: data.result,
                    generatedBy: data.generatedBy
                }
            });
            if (!res.ok) throw new Error('Failed to create rule');
            const newRule = await res.json();
            rules.value.push(newRule);
            return newRule;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    // Update Rule
    const updateRule = async (clientId: string, ruleId: string, data: Partial<LearningRuleUi>) => {
        try {
            const res = await client.api['ai-rules'][':clientId'].rules[':ruleId'].$put({
                param: { clientId, ruleId },
                json: {
                    priority: data.priority,
                    status: data.status,
                    trigger: data.trigger,
                    result: data.result,
                    generatedBy: data.generatedBy
                }
            });
            if (!res.ok) throw new Error('Failed to update rule');
            const updated = await res.json();
            const idx = rules.value.findIndex(r => r.id === ruleId);
            if (idx !== -1) rules.value[idx] = updated;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    // Delete Rule
    const deleteRule = async (clientId: string, ruleId: string) => {
        try {
            const res = await client.api['ai-rules'][':clientId'].rules[':ruleId'].$delete({
                param: { clientId, ruleId }
            });
            if (!res.ok) throw new Error('Failed to delete rule');
            rules.value = rules.value.filter(r => r.id !== ruleId);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    return {
        clients,
        rules,
        loading,
        error,
        fetchClients,
        fetchRules,
        createRule,
        updateRule,
        deleteRule
    };
}


import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { LearningRuleUi } from '../../types/LearningRuleUi';

const app = new Hono();

// Mock Data
const MOCK_CLIENTS = [
    { id: '1001', name: '株式会社 テスト商事', activeRules: 12, totalRules: 15 },
    { id: '1002', name: '合同会社 サンプル', activeRules: 5, totalRules: 8 },
    { id: '1003', name: '鈴木商店', activeRules: 0, totalRules: 0 },
    { id: '2001', name: '田中建設', activeRules: 3, totalRules: 3 },
];

// In-memory rule storage
// Map<ClientId, LearningRuleUi[]>
const MOCK_RULES: Record<string, LearningRuleUi[]> = {
    '1001': [
        {
            id: 'rule-001',
            clientId: '1001',
            status: 'active',
            priority: 3,
            trigger: { type: 'description', keyword: 'タクシー' },
            result: { debitAccount: '旅費交通費', targetTaxClass: '課対仕入10%' },
            confidence: 0.98,
            hitCount: 142,
            generatedBy: 'ai',
            lastUsedAt: '2025-12-20',
            actions: [{ type: 'edit', label: '編集', isEnabled: true }, { type: 'delete', label: '削除', isEnabled: true }]
        },
        {
            id: 'rule-002',
            clientId: '1001',
            status: 'active',
            priority: 3,
            trigger: { type: 'vendor', keyword: 'Amazon' },
            result: { debitAccount: '消耗品費', targetTaxClass: '課対仕入10%' },
            confidence: 0.85,
            hitCount: 56,
            generatedBy: 'human',
            lastUsedAt: '2025-12-18',
            actions: [{ type: 'edit', label: '編集', isEnabled: true }, { type: 'delete', label: '削除', isEnabled: true }]
        },
    ],
    '1002': [
        {
            id: 'rule-003',
            clientId: '1002',
            status: 'draft',
            priority: 2,
            trigger: { type: 'vendor', keyword: 'Adobe' },
            result: { debitAccount: '通信費', targetTaxClass: '課対仕入10%' },
            confidence: 0.92,
            hitCount: 0,
            generatedBy: 'ai',
            actions: [{ type: 'edit', label: '編集', isEnabled: true }, { type: 'delete', label: '削除', isEnabled: true }]
        }
    ]
};

// --- Routes ---

// 1. Get Clients
app.get('/clients', (c) => {
    return c.json(MOCK_CLIENTS);
});

// 2. Get Rules for Client
app.get('/:clientId/rules', (c) => {
    const clientId = c.req.param('clientId');
    const rules = MOCK_RULES[clientId] || [];
    return c.json(rules);
});

// 3. Create Rule
const CreateRuleSchema = z.object({
    priority: z.number().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    trigger: z.object({
        type: z.enum(['description', 'vendor', 'amount']),
        keyword: z.string(),
        amountRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional()
    }),
    result: z.object({
        debitAccount: z.string(),
        targetTaxClass: z.string().optional(),
        subAccount: z.string().optional()
    }),
    generatedBy: z.enum(['ai', 'human']).optional()
});

app.post(
    '/:clientId/rules',
    zValidator('json', CreateRuleSchema),
    (c) => {
        const clientId = c.req.param('clientId');
        const data = c.req.valid('json');

        const newRule: LearningRuleUi = {
            id: `rule-${Date.now()}`,
            clientId,
            priority: data.priority ?? 3,
            status: (data.status as any) ?? 'active',
            trigger: data.trigger as any,
            result: data.result,
            confidence: 1.0, // Manual creation = 100% confidence
            hitCount: 0,
            generatedBy: (data.generatedBy as any) ?? 'human',
            lastUsedAt: new Date().toISOString().split('T')[0],
            actions: [
                { type: 'edit', label: '編集', isEnabled: true },
                { type: 'delete', label: '削除', isEnabled: true }
            ]
        };

        if (!MOCK_RULES[clientId]) MOCK_RULES[clientId] = [];
        MOCK_RULES[clientId].push(newRule);

        // Update stats
        const client = MOCK_CLIENTS.find(c => c.id === clientId);
        if (client) {
            client.totalRules++;
            if (newRule.status === 'active') client.activeRules++;
        }

        return c.json(newRule, 201);
    }
);

// 4. Update Rule
const UpdateRuleSchema = CreateRuleSchema.partial();

app.put(
    '/:clientId/rules/:ruleId',
    zValidator('json', UpdateRuleSchema),
    (c) => {
        const clientId = c.req.param('clientId');
        const ruleId = c.req.param('ruleId');
        const data = c.req.valid('json');

        const rules = MOCK_RULES[clientId];
        if (!rules) return c.json({ error: 'Client not found' }, 404);

        const index = rules.findIndex(r => r.id === ruleId);
        if (index === -1) return c.json({ error: 'Rule not found' }, 404);

        const currentRule = rules[index];
        const wasActive = currentRule.status === 'active';

        const updatedRule = {
            ...currentRule,
            ...data,
            trigger: data.trigger ? { ...currentRule.trigger, ...data.trigger } : currentRule.trigger,
            result: data.result ? { ...currentRule.result, ...data.result } : currentRule.result
        };

        rules[index] = updatedRule as any;

        // Update Stats if status changed
        const client = MOCK_CLIENTS.find(c => c.id === clientId);
        if (client) {
            const isActive = updatedRule.status === 'active';
            if (wasActive && !isActive) client.activeRules--;
            if (!wasActive && isActive) client.activeRules++;
        }

        return c.json(updatedRule);
    }
);

// 5. Delete Rule
app.delete('/:clientId/rules/:ruleId', (c) => {
    const clientId = c.req.param('clientId');
    const ruleId = c.req.param('ruleId');

    const rules = MOCK_RULES[clientId];
    if (!rules) return c.json({ error: 'Client not found' }, 404);

    const index = rules.findIndex(r => r.id === ruleId);
    if (index === -1) return c.json({ error: 'Rule not found' }, 404);

    const deletedRule = rules[index];
    rules.splice(index, 1);

    // Update Stats
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    if (client) {
        client.totalRules--;
        if (deletedRule.status === 'active') client.activeRules--;
    }

    return c.json({ success: true });
});

export default app;

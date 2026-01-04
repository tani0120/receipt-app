
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import moment from 'moment'

const app = new Hono()

// --- 1. Zod Schemas ---

const CollectionConfigSchema = z.object({
    cash: z.boolean().default(false),
    invoice: z.boolean().default(false),
    payroll: z.boolean().default(false),
    social: z.boolean().default(false)
})

const CollectionClientSchema = z.object({
    jobId: z.string(),
    code: z.string(),
    name: z.string(),
    fiscalMonth: z.number(),
    type: z.enum(['corp', 'individual']),
    // Grid Data (24 months)
    cells: z.array(z.object({
        monthIndex: z.number(), // 1-24
        year: z.number(),
        month: z.number(),
        isFiscalMonth: z.boolean(),
        style: z.enum(['active-1', 'active-2', 'inactive']), // active-1: year 1, active-2: year 2, inactive: diagonal
        status: z.enum(['check', 'cross', 'triangle', 'none', 'future']), // icon type
        isFuture: z.boolean()
    }))
})

const CollectionGridResponseSchema = z.object({
    viewYearStart: z.number(),
    clients: z.array(CollectionClientSchema),
    config: CollectionConfigSchema
})

// --- 2. Mock Data & Logic (Ported from Vue) ---

// Mock Config Store
let MOCK_CONFIG = {
    cash: false,
    invoice: false,
    payroll: false,
    social: false
}

// Mock Clients
const MOCK_CLIENTS = [
    {
        clientCode: '1001',
        companyName: '株式会社 テスト商事',
        fiscalMonth: 3,
        type: 'corp' as const,
        jobId: '1001'
    },
    {
        clientCode: '1003',
        companyName: '鈴木商店',
        fiscalMonth: 12,
        type: 'individual' as const,
        jobId: '1003'
    }
];

// Re-export Schema if needed, or delete if truly unused.
// However, zValidator uses ConfigSchema.
// CollectionClientSchema is used in CollectionGridResponseSchema.
// CollectionGridResponseSchema is unused, but good for docs. I will keep it but export it or suppress unused.
// Actually, I can just remove CollectionGridResponseSchema if it's not used.

export { CollectionConfigSchema, CollectionClientSchema, CollectionDetailSchema };

// Logic Helpers (Server-Side Calculation)
const currentDateMock = moment('2025-12-28'); // Fixed Date for Consistency

const getFiscalTermEnd = (client: typeof MOCK_CLIENTS[0], targetDate: moment.Moment) => {
    const fiscalMonth = client.type === 'individual' ? 12 : client.fiscalMonth;
    const month = targetDate.month() + 1;
    let year = targetDate.year();
    if (month > fiscalMonth) {
        year++;
    }
    return moment(`${year}-${String(fiscalMonth).padStart(2, '0')}-01`).endOf('month');
};

const getActiveTerm1End = (client: typeof MOCK_CLIENTS[0]) => {
    const checkDate = currentDateMock.clone().subtract(2, 'years');
    const today = currentDateMock;

    for (let i = 0; i < 5; i++) {
        const termEnd = getFiscalTermEnd(client, checkDate);
        const filingOffset = client.type === 'individual' ? 3 : 2;
        const filingDeadline = termEnd.clone().add(filingOffset, 'months').endOf('month');

        if (today.isSameOrBefore(filingDeadline)) {
            return termEnd;
        }
        checkDate.add(1, 'year');
    }
    return getFiscalTermEnd(client, today);
};

const calculateCellData = (client: typeof MOCK_CLIENTS[0], viewYearStart: number) => {
    const term1End = getActiveTerm1End(client);
    const term1Start = term1End.clone().subtract(1, 'year').add(1, 'day');
    const term2End = term1End.clone().add(1, 'year');
    const term2Start = term1End.clone().add(1, 'day');

    const cells: {
        monthIndex: number;
        year: number;
        month: number;
        isFiscalMonth: boolean;
        style: 'active-1' | 'active-2' | 'inactive';
        status: 'check' | 'cross' | 'triangle' | 'none' | 'future';
        isFuture: boolean;
    }[] = [];
    for (let m = 1; m <= 24; m++) {
        const year = m <= 12 ? viewYearStart : viewYearStart + 1;
        const month = m <= 12 ? m : m - 12;
        const cellDate = moment(`${year}-${String(month).padStart(2, '0')}-01`);

        // Style
        let style = 'inactive';
        if (cellDate.isBetween(term1Start, term1End, 'month', '[]')) style = 'active-1';
        else if (cellDate.isBetween(term2Start, term2End, 'month', '[]')) style = 'active-2';

        // Fiscal Month Marker
        const fiscalMonth = client.type === 'individual' ? 12 : client.fiscalMonth;
        const isFiscalMonth = (fiscalMonth === month);

        // Status Icon (Using generic logic from Vue: mod calculation)
        // Mimic Source: (client.jobId.charCodeAt(2) || 0) + m
        const charCode = client.jobId ? client.jobId.charCodeAt(2) : 0;
        const seed = charCode + m;
        const mod = seed % 10;
        let status = 'none';

        const isFuture = cellDate.isAfter(currentDateMock, 'month');

        if (style !== 'inactive' && !isFuture) {
            if (mod < 2) status = 'cross';
            else if (mod === 2) status = 'triangle';
            else status = 'check';
        } else if (isFuture) {
            status = 'future';
        }

        cells.push({
            monthIndex: m,
            year,
            month,
            isFiscalMonth,
            style: style as 'active-1' | 'active-2' | 'inactive',
            status: status as 'check' | 'cross' | 'triangle' | 'none' | 'future', // Cast to Zod Enum
            isFuture
        });
    }
    return cells;
}


// --- 3. Routes ---


// --- 1.1 Detail Schemas ---

const CollectionFileSchema = z.object({
    id: z.string(),
    name: z.string(),
    timestamp: z.string(), // ISO
    status: z.enum(['collected', 'missing', 'ignored']),
    driveLink: z.string().optional()
});

const CollectionDetailSchema = z.object({
    jobId: z.string(),
    code: z.string(),
    name: z.string(),
    history: z.array(z.object({
        year: z.number(),
        month: z.number(),
        status: z.enum(['check', 'cross', 'triangle', 'none']),
        files: z.array(CollectionFileSchema),
        memo: z.string().optional(),
        actions: z.array(z.object({
            type: z.string(),
            label: z.string(),
            isEnabled: z.boolean()
        })).optional()
    }))
});

// --- 2.1 Mock Detail Data ---

const generateMockHistory = (viewYearStart: number) => {
    const history = [];
    for (let m = 1; m <= 24; m++) {
        const year = m <= 12 ? viewYearStart : viewYearStart + 1;
        const month = m <= 12 ? m : m - 12;

        // Random files
        const files = [];
        if (Math.random() > 0.7) {
            files.push({
                id: `f-${year}-${month}-1`,
                name: `請求書_${year}${month}.pdf`,
                timestamp: moment(`${year}-${String(month).padStart(2, '0')}-05`).toISOString(),
                status: 'collected' as const,
                driveLink: 'https://drive.google.com'
            });
        }

        history.push({
            year,
            month,
            status: files.length > 0 ? 'check' as const : 'cross' as const,
            files: files,
            actions: files.length > 0 ?
                [{ type: 'download_all', label: '一括DL', isEnabled: true }] :
                [{ type: 'request', label: '資料催促', isEnabled: true }]
        });
    }
    return history;
};

// ... existing route ...

const route = app
    // GET / - Get Grid Data
    .get('/', (c) => {
        const yearParam = c.req.query('year');
        const viewYearStart = yearParam ? parseInt(yearParam) : 2025;

        const clientData = MOCK_CLIENTS.map(c => ({
            jobId: c.jobId,
            code: c.clientCode,
            name: c.companyName,
            fiscalMonth: c.fiscalMonth,
            type: c.type,
            cells: calculateCellData(c, viewYearStart)
        }));

        return c.json({
            viewYearStart,
            clients: clientData,
            config: MOCK_CONFIG
        });
    })

    // GET /:code - Get Detail Data
    .get('/:code', (c) => {
        const code = c.req.param('code');
        const viewYearStart = 2025; // Default or pass via Query if needed

        const client = MOCK_CLIENTS.find(cl => cl.clientCode === code);

        if (!client) {
            return c.json({ error: 'Client not found' }, 404);
        }

        const detail = {
            jobId: client.jobId,
            code: client.clientCode,
            name: client.companyName,
            history: generateMockHistory(viewYearStart)
        };

        return c.json(detail);
    })

    // PUT /config - Update Config
    .put('/config', zValidator('json', CollectionConfigSchema), async (c) => {
        const data = c.req.valid('json');
        MOCK_CONFIG = data;
        return c.json({ success: true, config: MOCK_CONFIG });
    })

export default route


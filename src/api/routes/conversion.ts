
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

// --- 1. Zod Schema (Equivalent to InternalConversionLog + Safety) ---
const ConversionLogSchema = z.object({
    id: z.string().default('unknown'),
    timestamp: z.string().default('Invalid Date'),
    clientName: z.string().min(1).default('（名称未設定）'),
    sourceSoftware: z.string().default('不明'),
    targetSoftware: z.string().default('不明'),
    fileName: z.string().default('unknown.csv'),
    size: z.number().nonnegative().default(0),
    downloadUrl: z.string().default('#'),
    isDownloaded: z.boolean().default(false),
})

// --- 2. BFF Logic: Helper for formatting (Moved from Frontend) ---
function formatFileSize(bytes: number): string {
    if (bytes <= 0 || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0) return '0 Bytes';
    if (i >= sizes.length) return '> 1 TB';
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// --- 3. Route Definition ---
const route = app.get('/', (c) => {
    try {
        // Mock Data Source (Simulating DB)
        const rawData = [
            {
                id: 'XYZ',
                timestamp: '2024/12/25 14:30',
                clientName: '株式会社サンプル商事',
                sourceSoftware: '弥生会計',
                targetSoftware: 'Freee',
                fileName: 'サンプル商事_弥生_変換後Freee_20241225.csv',
                size: 1572864, // 1.5MB
                downloadUrl: '#',
                isDownloaded: false
            }
        ]

        // Validate & Transform (BFF Pattern)
        const safeData = z.array(ConversionLogSchema).parse(rawData)

        // Map to UI-ready structure (The heavy lifting)
        const uiData = safeData.map(item => ({
            id: item.id,
            timestamp: item.timestamp,
            clientName: item.clientName,
            sourceSoftwareLabel: item.sourceSoftware, // Simple mapping here
            targetSoftwareLabel: item.targetSoftware,
            fileName: item.fileName,
            fileSize: formatFileSize(item.size), // Calculated on Server
            downloadUrl: item.downloadUrl,
            isDownloaded: item.isDownloaded,
            isDownloadable: Boolean(item.downloadUrl && item.downloadUrl !== '#'),
            rowStyle: item.isDownloaded ? 'bg-gray-50 opacity-70' : 'bg-white', // UI Style logic on Server (BFF)

            // Actions (BFF Standard)
            actions: [
                { type: 'download', label: 'ダウンロード', isEnabled: true },
                { type: 'delete', label: '削除', isEnabled: true }
            ]
        }))

        return c.json(uiData)
    } catch (e: any) {
        console.error('[API Error] conversion get:', e);
        return c.json({ error: e.message }, 500);
    }
})
    .delete('/:id', async (c) => {
        const id = c.req.param('id');
        console.log(`[BFF] Deleting conversion log ${id}`);
        // Mock deletion success
        return c.json({ success: true, message: `Log ${id} deleted` });
    })
    .post('/', async (c) => {
        try {
            const body = await c.req.parseBody();
            const file = body['file'];

            if (!file || typeof file === 'string') {
                return c.json({ success: false, message: 'No file uploaded' }, 400);
            }

            // Real Storage Integration
            const { StorageService } = await import('../lib/storage');
            const buffer = await (file as Blob).arrayBuffer();
            const nodeBuffer = Buffer.from(buffer);

            // Generate path: conversions/<timestamp>_<filename>
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const path = `conversions/${timestamp}_${(file as File).name}`;

            const gsUrl = await StorageService.uploadImage(nodeBuffer, path, (file as File).type);
            console.log('[BFF] File uploaded to GCS:', gsUrl);

            // Mock Conversion returning the GCS Link
            return c.json({
                success: true,
                fileName: (file as File).name,
                gsUrl: gsUrl, // The Chain: This URI should be passed to AI
                message: 'File uploaded to GCS. Conversion Service (Screen G) pending.'
            });
        } catch (e: any) {
            console.error('[BFF] Upload Error:', e);
            return c.json({ success: false, message: e.message }, 500);
        }
    })

export default route

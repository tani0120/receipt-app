import type { ConversionLogUi, ConversionLogId } from '@/types/ScreenG_ui.type';

/**
 * [IRONCLAD CONTRACT]
 * API/Internal Data -> UI Data Transformation
 *
 * - Never throws
 * - Never returns null/undefined for UI fields
 * - Handles all edge cases (missing data, wrong types)
 */

export function mapConversionLogApiToUi(raw: unknown): ConversionLogUi {
    const r = raw as any; // Safe strict casting inside boundary
    // 1. Safe ID
    const id = (typeof r?.id === 'string' ? r.id : 'unknown') as ConversionLogId;

    // 2. Safe Timestamp
    const timestamp = typeof r?.timestamp === 'string' ? r.timestamp : 'Invalid Date';

    // 3. Safe Client Name
    const clientName = typeof r?.clientName === 'string' && r.clientName.trim() !== ''
        ? r.clientName
        : '（名称未設定）';

    // 4. Safe Software Labels
    const sourceSoftwareLabel = typeof r?.sourceSoftware === 'string' ? r.sourceSoftware : '不明';
    const targetSoftwareLabel = typeof r?.targetSoftware === 'string' ? r.targetSoftware : '不明';

    // 5. Safe File Info
    const fileName = typeof r?.fileName === 'string' ? r.fileName : 'unknown.csv';
    const sizeBytes = typeof r?.size === 'number' ? r.size : 0;
    const fileSize = formatFileSize(sizeBytes);

    // 6. Safe Status Flags
    const isDownloaded = Boolean(r?.isDownloaded);
    const downloadUrl = typeof r?.downloadUrl === 'string' ? r.downloadUrl : '#';

    // Logic: Is Downloadable?
    const isDownloadable = Boolean(downloadUrl && downloadUrl !== '#');

    // Logic: Row Style
    const rowStyle = isDownloaded ? 'bg-gray-50 opacity-70' : 'bg-white';

    return {
        id,
        timestamp,
        clientName,
        sourceSoftwareLabel,
        targetSoftwareLabel,
        fileName,
        fileSize,
        downloadUrl,
        isDownloaded,
        isDownloadable,
        rowStyle
    };
}

// Helper (Pure)
// Helper (Pure)
function formatFileSize(bytes: number): string {
    if (bytes <= 0 || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    // Prevent out of bounds
    if (i < 0) return '0 Bytes';
    if (i >= sizes.length) return '> 1 TB';

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

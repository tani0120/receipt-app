/**
 * CSV変換APIルート（Hono）
 *
 * レイヤー: ★route★ → conversionStore（JSON永続化）
 * 責務: CSVファイル受信 → MF形式変換 → 保存 → ダウンロード提供
 *
 * エンドポイント:
 *   GET    /                — 変換ログ一覧（ソート・集計済み）
 *   POST   /convert         — CSV変換実行（FormData: file + clientName + targetSoftware）
 *   PUT    /:id/downloaded  — ダウンロード済みマーク
 *   GET    /:id/download    — 変換後CSVダウンロード
 *   DELETE /:id             — ログ+CSVファイル削除
 */

import { Hono } from 'hono';
import { apiError, apiCatchError } from '../helpers/apiError';
import { 必須, 未検出 } from '../helpers/apiMessages';
import * as conversionStore from '../services/conversionStore';
import { readFileSync } from 'fs';

const app = new Hono();

// ============================================================
// ヘルパー
// ============================================================

function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return '0 Bytes';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** 変換ログ → UI用レスポンス形式 */
function toUiLog(log: conversionStore.ConversionLog) {
  return {
    id: log.id,
    timestamp: log.timestamp,
    clientName: log.clientName,
    sourceSoftwareLabel: log.sourceSoftware,
    targetSoftwareLabel: log.targetSoftware,
    fileName: log.fileName,
    fileSize: formatFileSize(log.size),
    downloadUrl: `/api/conversion/${log.id}/download`,
    isDownloaded: log.isDownloaded,
    isDownloadable: true,
    rowStyle: log.isDownloaded ? 'bg-gray-50 opacity-70' : 'bg-white',
  };
}

// ============================================================
// GET / — 変換ログ一覧（ソート・集計済み）
// ============================================================

app.get('/', (c) => {
  try {
    const all = conversionStore.getAllLogs();
    const uiData = all.map(toUiLog);

    // ソート: 未DLが先、同グループ内は日付新しい順
    uiData.sort((a, b) => {
      if (a.isDownloaded !== b.isDownloaded) {
        return a.isDownloaded ? 1 : -1;
      }
      return b.timestamp.localeCompare(a.timestamp);
    });

    const pendingDownloadCount = uiData.filter(item => !item.isDownloaded).length;

    return c.json({
      logs: uiData,
      pendingDownloadCount,
      totalCount: uiData.length,
    });
  } catch (e: unknown) {
    console.error('[API Error] conversion get:', e);
    return apiCatchError(c, e);
  }
});

// ============================================================
// POST /convert — CSV変換実行
// ============================================================

app.post('/convert', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const clientName = formData.get('clientName') as string | null;
    const sourceSoftware = formData.get('sourceSoftware') as string | null;
    const targetSoftware = formData.get('targetSoftware') as string | null;

    if (!file || typeof file === 'string') {
      return apiError(c, 400, 必須('file'));
    }
    if (!clientName) {
      return apiError(c, 400, 必須('clientName'));
    }

    // CSVファイル読み込み
    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const csvText = buffer.toString('utf-8');

    // BOM除去
    const cleanCsv = csvText.replace(/^\uFEFF/, '');

    // MF明細CSV形式に変換
    // 入力: 各行が銀行/カード明細
    // 出力: MFインポート用明細CSV
    const lines = cleanCsv.split('\n').filter(l => l.trim());
    const outputLines: string[] = [];
    // MF明細CSVヘッダー
    outputLines.push('取引日,内容,金額（税込）,勘定科目,税区分,備考');

    // 1行目がヘッダーかどうか判定（数字で始まるか日付パターン）
    const datePattern = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/;
    const startIdx = (lines[0] && !datePattern.test(lines[0])) ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i]!.split(',');
      // 最低限: 日付, 摘要/内容, 金額 を抽出
      const date = cols[0]?.trim() ?? '';
      const description = cols[1]?.trim() ?? '';
      // 金額: 3番目以降で数値っぽいものを探す
      let amount = '';
      for (let j = 2; j < cols.length; j++) {
        const val = cols[j]?.trim().replace(/[",¥\\]/g, '') ?? '';
        if (/^-?\d+\.?\d*$/.test(val) && val !== '0') {
          amount = val;
          break;
        }
      }
      if (date && (description || amount)) {
        outputLines.push(`${date},${description},${amount},,,`);
      }
    }

    const outputCsv = outputLines.join('\n');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const outputFileName = `${clientName}_${sourceSoftware ?? 'CSV明細'}_変換後${targetSoftware ?? 'MF'}_${today}.csv`;

    // ストアに保存
    const log = conversionStore.addLog(
      clientName,
      sourceSoftware ?? 'CSV明細',
      targetSoftware ?? 'MF',
      outputCsv,
      outputFileName,
    );

    console.log(`[conversion] 変換完了: ${outputFileName} (${outputLines.length - 1}行, ${log.size}bytes)`);

    return c.json({
      success: true,
      log: toUiLog(log),
    });
  } catch (e: unknown) {
    console.error('[API Error] conversion convert:', e);
    return apiCatchError(c, e);
  }
});

// ============================================================
// PUT /:id/downloaded — ダウンロード済みマーク
// ============================================================

app.put('/:id/downloaded', (c) => {
  const id = c.req.param('id');
  const ok = conversionStore.markAsDownloaded(id);
  if (!ok) return apiError(c, 404, 未検出('変換ログ'));
  return c.json({ success: true });
});

// ============================================================
// GET /:id/download — 変換後CSVダウンロード
// ============================================================

app.get('/:id/download', (c) => {
  const id = c.req.param('id');
  const filePath = conversionStore.getCsvFilePath(id);
  if (!filePath) return apiError(c, 404, 未検出('変換ファイル'));

  const buffer = readFileSync(filePath);
  // ダウンロード済みマーク
  conversionStore.markAsDownloaded(id);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filePath.split(/[\\/]/).pop() ?? 'download.csv')}"`,
    },
  });
});

// ============================================================
// DELETE /:id — ログ+CSVファイル削除
// ============================================================

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  const ok = conversionStore.deleteLog(id);
  if (!ok) return apiError(c, 404, 未検出('変換ログ'));
  console.log(`[conversion] ログ削除: ${id}`);
  return c.json({ success: true });
});

export default app;

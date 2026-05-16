/**
 * useCsv.ts — CSV / Excel インポート / エクスポート 共通ユーティリティ
 *
 * 全マスタ管理ページ（顧問先・見込先・スタッフ）で共通利用する。
 * エクスポート: BOM付きUTF-8でExcel互換CSV。
 * インポート: CSV（UTF-8/Shift-JIS自動判定）および Excel（.xlsx/.xls）対応。
 *             空白セルは許容。ヘッダー行を元にフィールドマッピング。
 */
import * as XLSX from 'xlsx';

/** CSV列定義 */
export interface CsvColumnDef {
  /** データキー */
  key: string;
  /** CSVヘッダーラベル */
  label: string;
  /** フィールドの型（インポート時の自動変換に使用。省略時は'string'） */
  type?: 'string' | 'number' | 'boolean';
  /** エクスポート時の値フォーマッタ（省略時はそのまま文字列化） */
  format?: (value: unknown, row: Record<string, unknown>) => string;
  /** インポート時の逆変換（ラベル→内部値。format関数の逆。省略時はそのまま） */
  parse?: (value: string) => string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// エクスポート
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** CSVセル値をエスケープ（ダブルクォート囲み） */
function escapeCsvCell(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // カンマ・改行・ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * テーブルデータをCSVファイルとしてダウンロード
 *
 * @param filename - ダウンロードファイル名（拡張子込み）
 * @param columns - CSV列定義配列
 * @param rows    - データ行配列
 */
export function exportCsv(
  filename: string,
  columns: CsvColumnDef[],
  rows: Record<string, unknown>[],
): void {
  // ヘッダー行
  const headerLine = columns.map(c => escapeCsvCell(c.label)).join(',');

  // データ行
  const dataLines = rows.map(row =>
    columns.map(col => {
      const raw = row[col.key];
      const formatted = col.format ? col.format(raw, row) : raw;
      return escapeCsvCell(formatted);
    }).join(',')
  );

  const csvContent = [headerLine, ...dataLines].join('\r\n');

  // BOM付きUTF-8（Excel互換）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * テーブルデータをExcelファイル（.xlsx）としてダウンロード
 *
 * @param filename - ダウンロードファイル名（拡張子込み）
 * @param columns - 列定義配列
 * @param rows    - データ行配列
 */
export function exportExcel(
  filename: string,
  columns: CsvColumnDef[],
  rows: Record<string, unknown>[],
): void {
  // ヘッダー + データ行の2次元配列を作成
  const header = columns.map(c => c.label);
  const data = rows.map(row =>
    columns.map(col => {
      const raw = row[col.key];
      return col.format ? col.format(raw, row) : (raw ?? '');
    })
  );
  const sheetData = [header, ...data];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'データ');
  XLSX.writeFile(wb, filename);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// インポート
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** CSVテキストを行×列に分割（ダブルクォート対応） */
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuote = false;
  let cells: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++; // エスケープされたダブルクォート
        } else {
          inQuote = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        cells.push(current);
        current = '';
      } else if (ch === '\n') {
        cells.push(current);
        current = '';
        if (cells.length > 0) rows.push(cells);
        cells = [];
      } else if (ch === '\r') {
        // \r\n の \r は無視
      } else {
        current += ch;
      }
    }
  }
  // 最終行
  cells.push(current);
  if (cells.some(c => c.length > 0)) rows.push(cells);

  return rows;
}

/**
 * CSVインポート結果
 */
export interface CsvImportResult<T = Record<string, unknown>> {
  /** パース成功行 */
  rows: T[];
  /** ヘッダーにマッチしなかった列名 */
  unmatchedHeaders: string[];
  /** 総行数（ヘッダー除く） */
  totalRows: number;
}

/**
 * Excelファイル（.xlsx/.xls）をstring[][]にパース
 * xlsxライブラリを使用。最初のシートを対象とする。
 */
function parseExcelBuffer(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  // header: 1 → 配列の配列として返却（ヘッダーなしモード）
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return raw.map(row => row.map(cell => String(cell ?? '')));
}

/**
 * ファイル選択ダイアログを開き、CSV/Excelファイルを読み込んでパースする
 *
 * 対応形式:
 * - CSV: UTF-8（BOM有無問わず）/ Shift-JIS 自動判定
 * - Excel: .xlsx / .xls
 *
 * @param columns    - 許容するCSV列定義（ヘッダーラベルでマッチング）
 * @returns パース結果（キャンセル時はnull）
 */
export function importCsv(
  columns: CsvColumnDef[],
): Promise<CsvImportResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
    input.style.display = 'none';

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        let parsed: string[][];
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

        if (ext === 'xlsx' || ext === 'xls') {
          // Excel形式: xlsxライブラリでパース
          const buffer = await file.arrayBuffer();
          parsed = parseExcelBuffer(buffer);
        } else {
          // CSV形式: Shift-JIS自動判定付き
          const buffer = await file.arrayBuffer();
          let text: string;

          // まずUTF-8として読んでみて、文字化け判定
          const utf8Text = new TextDecoder('utf-8').decode(buffer);
          // 置換文字(U+FFFD)が多い場合はShift-JISとして再読み込み
          const replacementCount = (utf8Text.match(/\uFFFD/g) || []).length;
          if (replacementCount > 0) {
            text = new TextDecoder('shift-jis').decode(buffer);
          } else {
            // BOM除去
            text = utf8Text.replace(/^\uFEFF/, '');
          }

          parsed = parseCsvText(text);
        }

        if (parsed.length < 1) {
          resolve({ rows: [], unmatchedHeaders: [], totalRows: 0 });
          return;
        }

        // ヘッダー行からラベル→キーのマッピングを構築
        const firstRow = parsed[0];
        if (!firstRow) {
          resolve({ rows: [], unmatchedHeaders: [], totalRows: 0 });
          return;
        }
        const headerRow = firstRow.map(h => h.trim());
        const labelToKey = new Map<string, string>();
        for (const col of columns) {
          labelToKey.set(col.label, col.key);
        }

        const columnMapping: (string | null)[] = [];
        const unmatchedHeaders: string[] = [];
        for (const header of headerRow) {
          const key = labelToKey.get(header);
          if (key) {
            columnMapping.push(key);
          } else {
            columnMapping.push(null);
            if (header.length > 0) unmatchedHeaders.push(header);
          }
        }

        // 列キー→列定義のマップ（型変換・parse用）
        const colDefMap = new Map<string, CsvColumnDef>();
        for (const col of columns) {
          colDefMap.set(col.key, col);
        }

        // データ行をパース（空白セル許容 + 型変換）
        const dataRows: Record<string, unknown>[] = [];
        for (let i = 1; i < parsed.length; i++) {
          const cells = parsed[i];
          const row: Record<string, unknown> = {};
          let hasValue = false;
          for (let j = 0; j < columnMapping.length; j++) {
            const key = columnMapping[j];
            if (key) {
              let val: string = (cells?.[j] ?? '').trim();
              if (val.length > 0) hasValue = true;
              const def = colDefMap.get(key);
              // parse関数があればラベル→内部値に逆変換
              if (def?.parse && val.length > 0) {
                val = def.parse(val);
              }
              // type指定に従い型変換
              if (def?.type === 'number' && val.length > 0) {
                row[key] = Number(val);
              } else if (def?.type === 'boolean') {
                row[key] = val === 'true' || val === 'はい' || val === 'あり' || val === '1';
              } else {
                row[key] = val;
              }
            }
          }
          // 完全空行はスキップ
          if (hasValue) dataRows.push(row);
        }

        resolve({
          rows: dataRows,
          unmatchedHeaders,
          totalRows: parsed.length - 1,
        });
      } catch (err) {
        console.error('[インポート] ファイル読み込みエラー:', err);
        resolve(null);
      }
    });

    input.addEventListener('cancel', () => resolve(null));

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

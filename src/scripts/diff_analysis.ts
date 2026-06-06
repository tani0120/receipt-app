/**
 * 8枚×4モデルの全出力を項目ごとに差分比較
 * task-1009.logのJSON出力を解析
 */
import { readFileSync } from 'fs';

const logPath = process.env['DIFF_LOG_PATH'] ?? '';
const log = readFileSync(logPath, 'utf-8');

// previewExtract完了行からJSONを抽出
const jsonPattern = /previewExtract完了: ({.+})/g;
const entries: { model: string; file: string; data: Record<string, unknown> }[] = [];

// モデル順序を追跡
const MODELS = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
const currentModelIdx = 0;
const fileCount = 0;

let match;
while ((match = jsonPattern.exec(log)) !== null) {
  const json = JSON.parse(match[1]);
  const file = json.input?.filename ?? 'unknown';
  
  // 8枚ごとにモデルが変わる
  const modelIdx = Math.floor(entries.length / 8);
  const model = MODELS[modelIdx] ?? 'unknown';
  
  entries.push({ model, file, data: json });
}

// ファイル名リスト（順序保持）
const files = [...new Set(entries.map(e => e.file))];

console.log(`解析: ${entries.length}件 (${MODELS.length}モデル × ${files.length}ファイル)\n`);

// 項目ごとの差分比較
for (const file of files) {
  const fileEntries = entries.filter(e => e.file === file);
  
  // 全項目を抽出
  const compare: Record<string, Record<string, string>> = {};
  
  for (const entry of fileEntries) {
    const raw = entry.data.ai_raw as Record<string, unknown>;
    if (!raw) continue;
    
    const m = entry.model;
    const items: Record<string, string> = {
      'source_type': String(raw.source_type ?? '-'),
      'source_type_confidence': String(raw.source_type_confidence ?? '-'),
      'direction': String(raw.direction ?? '-'),
      'direction_confidence': String(raw.direction_confidence ?? '-'),
      'date': String(raw.date ?? 'null'),
      'total_amount': String(raw.total_amount ?? 'null'),
      'issuer_name': String(raw.issuer_name ?? 'null'),
      'description': String(raw.description ?? 'null'),
      'document_count': String(raw.document_count ?? '-'),
      'line_items_count': String((raw.line_items as unknown[])?.length ?? 0),
    };
    
    // line_items詳細
    const lineItems = (raw.line_items as Record<string, unknown>[]) ?? [];
    for (let i = 0; i < lineItems.length; i++) {
      const li = lineItems[i];
      items[`line[${i}].description`] = String(li.description ?? '-');
      items[`line[${i}].amount`] = String(li.amount ?? '-');
      items[`line[${i}].direction`] = String(li.direction ?? '-');
      items[`line[${i}].balance`] = String(li.balance ?? 'null');
      items[`line[${i}].date`] = String(li.date ?? 'null');
    }
    
    // duration
    items['duration_ms'] = String(entry.data.duration_ms ?? '-');
    
    for (const [k, v] of Object.entries(items)) {
      if (!compare[k]) compare[k] = {};
      compare[k][m] = v;
    }
  }
  
  // 差分判定
  const allKeys = Object.keys(compare);
  const diffKeys = allKeys.filter(k => {
    const vals = Object.values(compare[k]);
    return new Set(vals).size > 1;
  });
  const sameKeys = allKeys.filter(k => {
    const vals = Object.values(compare[k]);
    return new Set(vals).size === 1;
  });
  
  console.log(`${'━'.repeat(100)}`);
  console.log(`📄 ${file}`);
  console.log(`${'━'.repeat(100)}`);
  
  // 一致項目
  if (sameKeys.length > 0) {
    console.log(`\n  ✅ 全モデル一致（${sameKeys.length}項目）:`);
    for (const k of sameKeys) {
      const val = Object.values(compare[k])[0];
      if (k === 'duration_ms') continue; // 時間は除外
      console.log(`     ${k.padEnd(30)} = ${val}`);
    }
  }
  
  // 差分項目
  if (diffKeys.length > 0) {
    console.log(`\n  ⚠️ 差分あり（${diffKeys.length}項目）:`);
    for (const k of diffKeys) {
      if (k === 'duration_ms') continue;
      console.log(`     ${k}:`);
      for (const model of MODELS) {
        const val = compare[k][model] ?? '(なし)';
        console.log(`       ${model.padEnd(25)} → ${val}`);
      }
    }
  }
  
  console.log('');
}

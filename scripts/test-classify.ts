/**
 * classify APIテストスクリプト
 * Usage: npx tsx scripts/test-classify.ts <画像ファイルパス>
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const API_URL = 'http://localhost:8080/api/pipeline/classify';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('使い方: npx tsx scripts/test-classify.ts <画像ファイルパス>');
    process.exit(1);
  }

  const absPath = resolve(filePath);
  console.log(`📎 ファイル: ${absPath}`);

  const buffer = readFileSync(absPath);
  const base64 = buffer.toString('base64');
  const ext = absPath.split('.').pop()?.toLowerCase();
  const mimeType = ext === 'png' ? 'image/png'
    : ext === 'pdf' ? 'application/pdf'
    : 'image/jpeg';

  console.log(`📐 サイズ: ${(buffer.length / 1024).toFixed(0)}KB (${mimeType})`);
  console.log(`🚀 POST ${API_URL} ...`);

  const start = Date.now();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      mimeType,
      clientId: 'LDI-00008',
      filename: absPath.split(/[\\/]/).pop(),
    }),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`\n✅ 完了 (${elapsed}秒)\n`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);

/**
 * migrate-client-ids.cjs — 既存clientIdをランダムIDに変換
 *
 * 対象: data/ 配下の全JSONファイル内の旧clientId（ABC-00001等）を
 * c_XXXXXXXX形式のランダムIDに一括置換する。
 *
 * 使い方: node scripts/migrate-client-ids.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ランダムID生成
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(8);
  let id = 'c_';
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

// 1. clients.jsonから旧IDを読み取り、マッピングテーブルを作成
const clientsPath = path.join(DATA_DIR, 'clients.json');
const clients = JSON.parse(fs.readFileSync(clientsPath, 'utf-8'));

const idMap = {}; // 旧ID → 新ID
const usedIds = new Set();

for (const client of clients) {
  let newId;
  do {
    newId = generateId();
  } while (usedIds.has(newId));
  usedIds.add(newId);
  idMap[client.clientId] = newId;
}

console.log('=== clientID変換マッピング ===');
for (const [oldId, newId] of Object.entries(idMap)) {
  console.log(`  ${oldId} → ${newId}`);
}

// 2. 全JSONファイルを一括置換
const jsonFiles = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json'));

let totalReplacements = 0;

for (const file of jsonFiles) {
  const filePath = path.join(DATA_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileReplacements = 0;

  for (const [oldId, newId] of Object.entries(idMap)) {
    const regex = new RegExp(oldId.replace(/[-]/g, '\\-'), 'g');
    const matches = content.match(regex);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(regex, newId);
    }
  }

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ${file}: ${fileReplacements}件置換`);
    totalReplacements += fileReplacements;
  }
}

// 3. ファイル名にclientIdが含まれるもの（journals-LDI-00008.json等）をリネーム
for (const file of jsonFiles) {
  for (const [oldId, newId] of Object.entries(idMap)) {
    if (file.includes(oldId)) {
      const newFile = file.replace(oldId, newId);
      const oldPath = path.join(DATA_DIR, file);
      const newPath = path.join(DATA_DIR, newFile);
      // ファイル内容は既に置換済みなので、新しいパスにあるファイルをリネーム
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`  ファイル名変更: ${file} → ${newFile}`);
      }
    }
  }
}

console.log(`\n完了: 合計${totalReplacements}件置換、${Object.keys(idMap).length}件のclientIdを変換`);

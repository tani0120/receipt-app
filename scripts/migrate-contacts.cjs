/**
 * migrate-contacts.cjs — 顧問先の旧連絡先フィールドをcontactsに移行
 *
 * 実行: node scripts/migrate-contacts.cjs
 *
 * 対象: data/clients.json, data/leads.json
 * 処理:
 *   1. phoneNumber/email/chatRoomUrl の値を contacts[0~2] に移行
 *   2. 既にcontactsが3行以上あるデータはスキップ
 *   3. 旧フィールドは残す（後方互換）
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const FILES = ['clients.json', 'leads.json'];

/** 連絡先マッピング */
const CONTACT_MAP = [
  { method: '電話', field: 'phoneNumber' },
  { method: 'メール', field: 'email' },
  { method: 'チャット', field: 'chatRoomUrl' },
];

for (const file of FILES) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`[スキップ] ${file} が見つかりません`);
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const records = JSON.parse(raw);
  let migratedCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    // 既にcontactsが3行以上あればスキップ
    if (record.contacts && record.contacts.length >= 3) {
      skippedCount++;
      continue;
    }

    // デフォルト3行を生成
    const defaultContacts = CONTACT_MAP.map(({ method, field }) => ({
      name: '',
      method,
      value: record[field] || '',
      usage: '',
      memo: '',
    }));

    // 既存contactsがあればマージ
    if (record.contacts && record.contacts.length > 0) {
      for (let i = 0; i < record.contacts.length && i < 3; i++) {
        defaultContacts[i] = { ...defaultContacts[i], ...record.contacts[i] };
      }
    }

    record.contacts = defaultContacts;
    migratedCount++;
  }

  // バックアップ
  const backupPath = filePath + '.bak.' + Date.now();
  fs.writeFileSync(backupPath, raw, 'utf-8');
  console.log(`[バックアップ] ${backupPath}`);

  // 書き戻し
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  console.log(`[${file}] 移行: ${migratedCount}件, スキップ: ${skippedCount}件`);
}

console.log('\n移行完了。サーバーを再起動してください。');

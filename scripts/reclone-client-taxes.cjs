/**
 * 全顧問先の税区分データをMCP生データ基準で再作成するスクリプト
 *
 * ■ 根拠: MCP実機の生データ（data/mf-raw/taxes-*.json）のavailableフラグのみ
 * ■ 免税: 2件表示（不明・対象外）= 業務判断
 * ■ それ以外: MCP実機のavailableが正
 *
 * ■ MCP実機の期待値:
 *   免税: 表示2件（不明・対象外のみ。MCP実機は全151件available=false）
 *   原則個別: 表示74件（available=true: 74件）
 *   原則一括: 表示43件（available=true: 43件）
 *   簡易: 表示78件（available=true: 78件）
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')
const master = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tax-category-master.json'), 'utf8'))
const clients = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'clients.json'), 'utf8'))

// MCP生データから各方式のavailableマップを構築
const masterByName = {}
master.forEach(m => { masterByName[m.name] = m })

const modes = ['exempt', 'individual', 'proportional', 'simplified']
const rawAvailByMode = {}

for (const mode of modes) {
  const rawFile = path.join(DATA_DIR, 'mf-raw', `taxes-${mode}.json`)
  const raw = JSON.parse(fs.readFileSync(rawFile, 'utf8'))
  const availMap = {}
  raw.items.forEach(t => {
    const m = masterByName[t.name]
    if (m) availMap[m.id] = t.available
  })
  rawAvailByMode[mode] = availMap
}

// 免税で表示する2件（業務判断）
const EXEMPT_VISIBLE_IDS = new Set(['COMMON_UNKNOWN', 'COMMON_EXEMPT'])

// 全顧問先（MF連携先含む）を処理
const targetClients = clients.filter(c => {
  // MF連携先の判定はOAuth認証状態だが、ここではデータ修正なので全顧問先を対象にする
  return c.consumptionTaxMode && modes.includes(c.consumptionTaxMode)
})

console.log('=== MCP生データ基準で全顧問先の税区分を再作成 ===\n')

for (const client of targetClients) {
  const mode = client.consumptionTaxMode
  const isExempt = mode === 'exempt'
  const availMap = rawAvailByMode[mode] || {}

  const cloned = master.map((m, idx) => {
    let deprecated
    if (isExempt) {
      // 免税: 不明・対象外のみ表示、それ以外は非表示
      deprecated = !EXEMPT_VISIBLE_IDS.has(m.id)
    } else {
      // 免税以外: MCP生データのavailableの逆
      deprecated = !(availMap[m.id] === true)
    }
    return { ...m, deprecated, displayOrder: idx + 1, source: m.source || 'default' }
  })

  const filePath = path.join(DATA_DIR, `tax-categories-${client.clientId}.json`)

  // 既存ファイルのsource保持
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (existing.length > 0 && existing[0].source) {
      const existingSource = existing[0].source
      cloned.forEach(c => { c.source = existingSource })
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(cloned, null, 2), 'utf8')

  const depCount = cloned.filter(t => t.deprecated).length
  const visCount = cloned.filter(t => !t.deprecated).length
  console.log(`${client.companyName}（${mode}）: 全${cloned.length}件 | 非表示=${depCount}件 | 表示=${visCount}件`)
}

// 検証: MCP生データとの突合
console.log('\n=== MCP生データとの突合検証 ===')
const expected = {
  exempt: { visible: 2, source: '業務判断' },
  individual: { visible: 74, source: 'MCP生データ' },
  proportional: { visible: 43, source: 'MCP生データ' },
  simplified: { visible: 78, source: 'MCP生データ' },
}

for (const mode of modes) {
  const modeClients = targetClients.filter(c => c.consumptionTaxMode === mode)
  for (const client of modeClients) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `tax-categories-${client.clientId}.json`), 'utf8'))
    const visCount = data.filter(t => !t.deprecated).length
    const match = visCount === expected[mode].visible ? '✅' : '❌'
    console.log(`${match} ${client.companyName}（${mode}）: 表示=${visCount}件 期待=${expected[mode].visible}件 根拠=${expected[mode].source}`)
  }
}

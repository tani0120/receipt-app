/**
 * 追加検証スクリプト
 * 
 * 検証1: 税区分省略時のデフォルト値（MF#54,#55の仕訳を取得して確認）
 * 検証3: 補助科目（sub_accounts）が事業者固有か（TSK/TST比較）
 * 検証4: 部門（departments）が事業者固有か（TSK/TST比較）
 */
import 'dotenv/config'
import { callMcpTool } from '../src/api/services/mfMcpClient.js'

const TSK_TOKEN = 'c_wTdnMKDO'
const TST_TOKEN = 'c_rODnkCDN'

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log('========================================')
  console.log('検証1: 税区分省略時のデフォルト値')
  console.log('========================================')
  
  // MF#54,#55は税区分省略/空文字で送信した仕訳
  // getJournalsで取得してtax_nameを確認する
  try {
    const journals = await callMcpTool<any>('mfc_ca_getJournals', {
      query: {
        date_from: '2026-06-01',
        date_to: '2026-06-01',
      }
    }, TSK_TOKEN)
    
    const entries = Array.isArray(journals) ? journals : (journals?.journals || [journals])
    console.log(`取得件数: ${entries.length}件`)
    
    for (const j of entries) {
      const num = j.number || j.id || '?'
      const memo = j.memo || ''
      if (!memo.includes('sugusru-49test') && !memo.includes('sugusru-test')) continue
      
      console.log(`\n--- MF#${num} memo=${memo} ---`)
      const branches = j.branches || []
      for (const b of branches) {
        if (b.debitor) {
          console.log(`  借方: account=${b.debitor.account_name || b.debitor.account_id}, tax=${b.debitor.tax_name || b.debitor.tax_id || '(なし)'}`)
        }
        if (b.creditor) {
          console.log(`  貸方: account=${b.creditor.account_name || b.creditor.account_id}, tax=${b.creditor.tax_name || b.creditor.tax_id || '(なし)'}`)
        }
      }
    }
  } catch (e: any) {
    console.log('仕訳取得エラー:', e.message?.substring(0, 300))
  }

  await delay(3000)

  console.log('\n========================================')
  console.log('検証3: 補助科目（sub_accounts）の事業者固有性')
  console.log('========================================')

  try {
    const tskSubs = await callMcpTool<any>('mfc_ca_getSubAccounts', {}, TSK_TOKEN)
    await delay(2000)
    const tstSubs = await callMcpTool<any>('mfc_ca_getSubAccounts', {}, TST_TOKEN)

    const tskList = Array.isArray(tskSubs) ? tskSubs : (tskSubs?.sub_accounts || [])
    const tstList = Array.isArray(tstSubs) ? tstSubs : (tstSubs?.sub_accounts || [])

    console.log(`TSK補助科目: ${tskList.length}件`)
    console.log(`TST補助科目: ${tstList.length}件`)

    if (tskList.length > 0) {
      console.log('TSK先頭5件:')
      for (const s of tskList.slice(0, 5)) {
        console.log(`  id=${s.id}, name=${s.name}, account_name=${s.account_name || '?'}`)
      }
    }
    if (tstList.length > 0) {
      console.log('TST先頭5件:')
      for (const s of tstList.slice(0, 5)) {
        console.log(`  id=${s.id}, name=${s.name}, account_name=${s.account_name || '?'}`)
      }
    }

    // 同名比較
    const tskMap = new Map(tskList.map((s: any) => [s.name, s.id]))
    const tstMap = new Map(tstList.map((s: any) => [s.name, s.id]))
    const common = [...tskMap.keys()].filter(k => tstMap.has(k))
    let match = 0, mismatch = 0
    for (const name of common) {
      if (tskMap.get(name) === tstMap.get(name)) match++
      else mismatch++
    }
    console.log(`同名補助科目: ${common.length}件, 一致=${match}, 不一致=${mismatch}`)
  } catch (e: any) {
    console.log('補助科目取得エラー:', e.message?.substring(0, 300))
  }

  await delay(3000)

  console.log('\n========================================')
  console.log('検証4: 部門（departments）の事業者固有性')
  console.log('========================================')

  try {
    const tskDepts = await callMcpTool<any>('mfc_ca_getDepartments', {}, TSK_TOKEN)
    await delay(2000)
    const tstDepts = await callMcpTool<any>('mfc_ca_getDepartments', {}, TST_TOKEN)

    const tskList = Array.isArray(tskDepts) ? tskDepts : (tskDepts?.departments || [])
    const tstList = Array.isArray(tstDepts) ? tstDepts : (tstDepts?.departments || [])

    console.log(`TSK部門: ${tskList.length}件`)
    console.log(`TST部門: ${tstList.length}件`)

    if (tskList.length > 0) {
      console.log('TSK全件:')
      for (const d of tskList) {
        console.log(`  id=${d.id}, name=${d.name}`)
      }
    }
    if (tstList.length > 0) {
      console.log('TST全件:')
      for (const d of tstList) {
        console.log(`  id=${d.id}, name=${d.name}`)
      }
    }

    // 同名比較
    const tskMap = new Map(tskList.map((d: any) => [d.name, d.id]))
    const tstMap = new Map(tstList.map((d: any) => [d.name, d.id]))
    const common = [...tskMap.keys()].filter(k => tstMap.has(k))
    let match = 0, mismatch = 0
    for (const name of common) {
      if (tskMap.get(name) === tstMap.get(name)) match++
      else mismatch++
    }
    console.log(`同名部門: ${common.length}件, 一致=${match}, 不一致=${mismatch}`)
  } catch (e: any) {
    console.log('部門取得エラー:', e.message?.substring(0, 300))
  }
}

main().catch(e => { console.error('致命的エラー:', e); process.exit(1) })

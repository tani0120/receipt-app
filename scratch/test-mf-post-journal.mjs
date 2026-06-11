/**
 * MF クラウド会計 API テスト — postJournals で仕訳を直接登録
 *
 * レシートOCR結果:
 *   店名: 鳥貴族 谷町四丁目店
 *   日付: 2025-08-21 → テスト用に 2026-06-01 に変更
 *   金額: ¥7,410 → テスト用に ¥1 に変更
 *
 * 仕訳:
 *   借方: 接待交際費 1円
 *   貸方: 現金 1円
 *   摘要: 【テスト】鳥貴族 谷町四丁目店
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'

// .env.local 読み込み
config({ path: resolve(process.cwd(), '.env.local') })

const MF_TOKEN_URL = 'https://api.biz.moneyforward.com/token'
const MF_API_BASE = 'https://api.biz.moneyforward.com'
const TOKEN_FILE = resolve(process.cwd(), 'data', 'mf-tokens.json')

// ── Step 1: トークン取得 ──

function loadTokens() {
  if (!existsSync(TOKEN_FILE)) throw new Error('mf-tokens.json が存在しません')
  return JSON.parse(readFileSync(TOKEN_FILE, 'utf8'))
}

async function refreshToken(key) {
  const tokens = loadTokens()
  const current = tokens[key]
  if (!current?.refreshToken) throw new Error(`リフレッシュトークンなし (key=${key})`)

  const clientId = process.env.MF_CLIENT_ID
  const clientSecret = process.env.MF_CLIENT_SECRET
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  console.log(`[Step1] トークンリフレッシュ中... (key=${key})`)
  const res = await fetch(MF_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
    }).toString(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`トークンリフレッシュ失敗 (${res.status}): ${body}`)
  }

  const data = await res.json()
  const updated = {
    ...current,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  tokens[key] = updated
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8')
  console.log(`[Step1] トークン更新完了`)
  return updated.accessToken
}

// ── Step 2: 勘定科目ID取得 ──

async function getAccounts(accessToken) {
  console.log(`[Step2] 勘定科目一覧取得中...`)
  const res = await fetch(`${MF_API_BASE}/api/v3/accounts?available=true`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`勘定科目取得失敗 (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.accounts
}

// ── Step 3: 仕訳登録 ──

async function postJournal(accessToken, debitAccountId, creditAccountId) {
  const journal = {
    journal: {
      transaction_date: '2026-06-01',
      journal_type: 'journal_entry',
      branches: [
        {
          debitor: {
            account_id: debitAccountId,
            value: 1,
          },
          creditor: {
            account_id: creditAccountId,
            value: 1,
          },
          remark: '【テスト】鳥貴族 谷町四丁目店',
        },
      ],
    },
  }

  console.log(`[Step3] 仕訳登録中...`)
  console.log(`  借方: ${debitAccountId} (接待交際費) ¥1`)
  console.log(`  貸方: ${creditAccountId} (現金) ¥1`)
  console.log(`  日付: 2026-06-01`)
  console.log(`  摘要: 【テスト】鳥貴族 谷町四丁目店`)

  const res = await fetch(`${MF_API_BASE}/api/v3/journals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(journal),
  })

  const body = await res.text()
  console.log(`[Step3] レスポンス (${res.status}):`)
  try {
    console.log(JSON.stringify(JSON.parse(body), null, 2))
  } catch {
    console.log(body)
  }
  return { status: res.status, body }
}

// ── メイン ──

async function main() {
  const tokenKey = process.env.MF_TEST_TOKEN_KEY || 'default'
  console.log(`=== MF仕訳登録テスト ===`)
  console.log(`トークンキー: ${tokenKey}`)

  // Step 1: トークン取得
  const accessToken = await refreshToken(tokenKey)

  // Step 2: 勘定科目ID取得
  const accounts = await getAccounts(accessToken)
  const entertainmentAccount = accounts.find(a => a.name === '接待交際費')
  const cashAccount = accounts.find(a => a.name === '現金')

  if (!entertainmentAccount) throw new Error('「接待交際費」が見つかりません')
  if (!cashAccount) throw new Error('「現金」が見つかりません')

  console.log(`[Step2] 接待交際費 ID: ${entertainmentAccount.id}`)
  console.log(`[Step2] 現金 ID: ${cashAccount.id}`)

  // Step 3: 仕訳登録
  await postJournal(accessToken, entertainmentAccount.id, cashAccount.id)

  console.log(`\n=== 完了 ===`)
}

main().catch(e => {
  console.error('エラー:', e.message)
  process.exit(1)
})

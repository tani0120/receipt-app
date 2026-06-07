/**
 * generateMasterId 実機テスト
 *
 * 実行: npx tsx src/scripts/test-generateMasterId.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { generateMasterId } from '../api/services/generateMasterId'

const TEST_CASES = [
  { name: '旅費交通費', suffix: 'CORP' },
  { name: '売掛金', suffix: 'CORP' },
  { name: '福利厚生費', suffix: 'CORP' },
  { name: '減価償却費', suffix: 'IND' },
  { name: '租税公課', suffix: 'CORP' },
]

async function main() {
  console.log('=== generateMasterId 実機テスト ===\n')

  const existingIds = new Set<string>()

  for (const tc of TEST_CASES) {
    try {
      const id = await generateMasterId(tc.name, tc.suffix, existingIds)
      existingIds.add(id)
      console.log(`✅ ${tc.name} → ${id}`)
    } catch (err) {
      console.error(`❌ ${tc.name} → エラー: ${err}`)
    }
  }

  // 重複テスト: 同じ科目名で再度生成（連番サフィックスが付くはず）
  console.log('\n=== 重複テスト ===')
  try {
    const dupId = await generateMasterId('旅費交通費', 'CORP', existingIds)
    console.log(`✅ 旅費交通費（2回目） → ${dupId}（_2が付くはず）`)
  } catch (err) {
    console.error(`❌ 旅費交通費（2回目） → エラー: ${err}`)
  }

  console.log('\n=== テスト完了 ===')
}

main().catch(console.error)

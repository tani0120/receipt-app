import fs from 'fs'

const src = 'C:/Users/kazen/.gemini/antigravity-ide/brain/b0446e31-a415-4921-97ce-62c199da0ef1/master_factsheet.md'
let content = fs.readFileSync(src, 'utf-8')

// 1. 日付を復元
content = content.replace(
  '最終更新: 2026-06-01 23:55 — MF ID実機検証結果反映',
  '最終更新: 2026-05-30 23:42 — factベース全項目突合完了'
)

// 2. §4-1のCAUTION注記を削除
content = content.replace(
  `| 照合方式 | **名前ベース**（マスタ名前↔MF名前） |

> [!CAUTION]
> **2026-06-01 MCP実機検証で確定: \`mfId\`は事業者（テナント）ごとに異なる。**
> 全社マスタの\`mfId\`は特定の1事業者からインポートしたIDであり、他の事業者では使えない。
> 全社マスタに\`mfId\`を保持する意味は一切ない。
> 詳細: \`docs/genzai/45_mf_id_comparison.md\`
| 中間対応表/UUID | **存在しない** |`,
  `| 照合方式 | **名前ベース**（マスタ名前↔MF名前） |
| 中間対応表/UUID | **存在しない** |`
)

// 3. §4-5のIMPORTANT訂正を復元
content = content.replace(
  `> [!IMPORTANT]
> **2026-06-01実機検証確定: 税区分も勘定科目も、MF IDは事業者固有。事業者間のID照合は不可能。**
> 税区分で名前ベースが成立するのは「名前重複0件 + MF側で名前変更がほぼ起きない」条件があるから。
> 勘定科目はその条件を**満たさない**（14件重複 + MF上で変更可能）。
> MCP仕訳送信の49パターンテスト結果: \`docs/genzai/46_mf_journal_send_49patterns.md\``,
  `> [!IMPORTANT]
> 税区分で名前ベースが成立するのは「名前重複0件 + MF側で名前変更がほぼ起きない」条件があるから。
> 勘定科目はその条件を**満たさない**。`
)

// 4. §13-4の49パターン参照を削除
content = content.replace(
  `MCP \`mfc_ca_postJournals\`は\`account_id\`（MF内部ID）必須。存在しないIDはエラー。
**49パターン実機テスト（\`docs/genzai/46_mf_journal_send_49patterns.md\`）で確認済み。**
名前での送信、他社IDの流用、いずれも不可。`,
  `MCP \`mfc_ca_postJournals\`は\`account_id\`（MF内部ID）必須。存在しないIDはエラー。`
)

fs.writeFileSync(src, content, 'utf-8')
console.log('復元完了:', content.length, '文字')
console.log('日付チェック:', content.includes('2026-05-30 23:42') ? '✅ 復元済み' : '❌ 失敗')
console.log('CAUTION削除:', content.includes('MCP実機検証で確定') ? '❌ 残存' : '✅ 削除済み')
console.log('IMPORTANT復元:', content.includes('勘定科目はその条件を**満たさない**。') ? '✅ 復元済み' : '❌ 失敗')
console.log('49パターン削除:', content.includes('49パターン実機テスト') ? '❌ 残存' : '✅ 削除済み')

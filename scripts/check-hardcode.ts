/**
 * check-hardcode.ts — ハードコード検知スクリプト
 *
 * 科目ID・日付・事業者種別等のハードコードが
 * 許可されたファイル外に混入していないかチェックする。
 *
 * 使い方:
 *   npx tsx scripts/check-hardcode.ts
 *
 * CI/CDに組み込む場合:
 *   package.json の scripts に "lint:hardcode": "npx tsx scripts/check-hardcode.ts" を追加
 *
 * 終了コード:
 *   0 = 問題なし
 *   1 = ハードコード検出（詳細を標準出力に表示）
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, extname } from 'path'

// ============================================================
// 設定
// ============================================================

const SRC_DIR = join(process.cwd(), 'src')

/** 検査対象の拡張子 */
const TARGET_EXTENSIONS = new Set(['.ts', '.vue'])

/** 検査対象外のディレクトリ（相対パス前方一致） */
const IGNORE_DIRS = [
  'node_modules',
  'scripts',          // 実験用・seedスクリプト
  'dist',
]

// ────────────────────────────────────────────
// ルール定義
// ────────────────────────────────────────────

interface HardcodeRule {
  /** ルールID */
  id: string
  /** 説明 */
  description: string
  /** 検索パターン（正規表現） */
  pattern: RegExp
  /** この正規表現にマッチする行はスキップ（コメント・import等） */
  skipLinePatterns?: RegExp[]
  /** このファイル（相対パス部分一致）では許可 */
  allowedFiles: string[]
  /** 重要度: error = CI失敗、warn = 警告のみ */
  severity: 'error' | 'warn'
}

const RULES: HardcodeRule[] = [
  // ── 科目IDハードコード ──
  {
    id: 'ACCOUNT_ID',
    description: '科目IDが定数/型定義ファイル外にハードコードされている',
    pattern: /['"](?:ORDINARY_DEPOSIT|CHECKING_DEPOSIT|TIME_DEPOSIT|OTHER_DEPOSIT|CASH|ACCRUED_EXPENSES|ACCOUNTS_RECEIVABLE|ACCOUNTS_PAYABLE|NOTES_RECEIVABLE|TEMPORARY_PAYMENTS|ADVANCE_PAID|ACCRUED_REVENUE|DEPOSITS_RECEIVED|SALARIES|OFFICER_COMPENSATION|BONUSES|COST_OF_GOODS_SOLD)['"]/,
    skipLinePatterns: [
      /^\s*\/\//,         // 行コメント
      /^\s*\*/,           // ブロックコメント
      /^\s*\* /,          // JSDocコメント
      /description:/,     // コメント的説明文
      /例[:：]/,           // 日本語例示
    ],
    allowedFiles: [
      'voucherTypeRules.ts',          // P1: 許容科目定義（Supabase移行時にDB化）
      'lineItemToJournalMock.ts',     // P2: 相手勘定マップ（Supabase移行時にDB化）
      'domain-journal.ts',            // 型定義（enum const）
      'account-master.ts',            // マスタ定義
      'mfApiConstants.ts',            // 定数定義
      'journalHintService.ts',        // A3: defaultDebitId/defaultCreditId参照
      'preview_extract_schema.ts',    // P12: 実験用スキーマ
      'test_mf_send.ts',             // テスト用
      '.type.ts',                     // 型定義ファイル全般
    ],
    severity: 'error',
  },

  // ── effectiveFrom日付ハードコード ──
  {
    id: 'EFFECTIVE_DATE',
    description: 'effectiveFrom日付がDEFAULT_EFFECTIVE_FROM定数を使わずにハードコードされている',
    pattern: /effectiveFrom:\s*['"]2019-10-01['"]/,
    skipLinePatterns: [
      /^\s*\/\//,
      /^\s*\*/,
    ],
    allowedFiles: [
      'mfApiConstants.ts',  // 定数定義元
    ],
    severity: 'error',
  },

  // ── 事業者種別の直接比較（isIndividualType未使用） ──
  {
    id: 'BUSINESS_TYPE_DIRECT',
    description: "事業者種別の直接比較。isIndividualType()ヘルパーを使うこと",
    // businessType や type が 'individual' / 'sole_proprietor' と直接比較
    pattern: /(?:businessType|clientType|type)\s*===?\s*['"](?:individual|sole_proprietor)['"]/,
    skipLinePatterns: [
      /^\s*\/\//,
      /^\s*\*/,
      /isIndividualType/,  // ヘルパー定義内
      /return type ===/,   // ヘルパー関数内の実装
    ],
    allowedFiles: [
      'clientOptions.ts',      // ヘルパー定義元
      'clientFieldDefs.ts',    // フィールド定義（visibleWhen）
      'leadFieldDefs.ts',      // フィールド定義
      '.type.ts',              // 型定義
    ],
    severity: 'warn',
  },

  // ── インボイス経過措置日付ハードコード ──
  {
    id: 'INVOICE_TRANSITION_DATE',
    description: 'インボイス経過措置日付が定数を使わずにハードコードされている',
    pattern: /['"](?:2026-10-01|2029-10-01)['"]/,
    skipLinePatterns: [
      /^\s*\/\//,
      /^\s*\*/,
    ],
    allowedFiles: [
      'mfApiConstants.ts',  // 定数定義元
    ],
    severity: 'error',
  },

  // ── 決算月マジックナンバー ──
  {
    id: 'FISCAL_MONTH_MAGIC',
    description: '個人事業主の決算月(12)がヘルパーを使わずにハードコードされている',
    pattern: /fiscalMonth\s*(?:===?|!==?)\s*12|=\s*12\s*(?:\/\/.*決算|\/\*.*決算)/,
    skipLinePatterns: [
      /^\s*\/\//,
      /^\s*\*/,
      /getFiscalYearEndMonth/,
    ],
    allowedFiles: [
      'clientOptions.ts',  // ヘルパー定義元
    ],
    severity: 'warn',
  },

  // ── 消費税申告猶予月マジックナンバー ──
  {
    id: 'TAX_GRACE_MAGIC',
    description: '消費税申告猶予月数(2/3)がヘルパーを使わずにハードコードされている',
    pattern: /(?:gracePeriod|grace|猶予)\w*\s*(?:===?|=)\s*[23]\b/,
    skipLinePatterns: [
      /^\s*\/\//,
      /^\s*\*/,
      /getTaxFilingGraceMonths/,
    ],
    allowedFiles: [
      'clientOptions.ts',  // ヘルパー定義元
    ],
    severity: 'warn',
  },
]

// ============================================================
// ファイル走査
// ============================================================

function collectFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const relPath = relative(process.cwd(), fullPath).replace(/\\/g, '/')

    // 除外ディレクトリ
    if (IGNORE_DIRS.some(d => relPath.includes(`/${d}/`) || relPath.startsWith(`${d}/`) || entry === d)) {
      continue
    }

    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...collectFiles(fullPath))
    } else if (TARGET_EXTENSIONS.has(extname(entry))) {
      results.push(fullPath)
    }
  }
  return results
}

// ============================================================
// 検査実行
// ============================================================

interface Violation {
  rule: HardcodeRule
  file: string
  line: number
  content: string
}

function checkFile(filePath: string): Violation[] {
  const relPath = relative(process.cwd(), filePath).replace(/\\/g, '/')
  const violations: Violation[] = []

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  for (const rule of RULES) {
    // 許可ファイルチェック
    if (rule.allowedFiles.some(allowed => relPath.includes(allowed))) {
      continue
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // パターンマッチ
      if (!rule.pattern.test(line)) continue

      // スキップパターンチェック
      if (rule.skipLinePatterns?.some(skip => skip.test(line))) continue

      violations.push({
        rule,
        file: relPath,
        line: i + 1,
        content: line.trim(),
      })
    }
  }

  return violations
}

// ============================================================
// メイン
// ============================================================

console.log('🔍 ハードコード検知スクリプト実行中...\n')

const files = collectFiles(SRC_DIR)
console.log(`  対象ファイル数: ${files.length}`)

const allViolations: Violation[] = []
for (const file of files) {
  allViolations.push(...checkFile(file))
}

// 結果出力
const errors = allViolations.filter(v => v.rule.severity === 'error')
const warnings = allViolations.filter(v => v.rule.severity === 'warn')

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ ハードコード検出なし。問題ありません。\n')
  process.exit(0)
}

if (warnings.length > 0) {
  console.log(`\n⚠️  警告: ${warnings.length}件\n`)
  for (const v of warnings) {
    console.log(`  ${v.file}:${v.line}`)
    console.log(`    [${v.rule.id}] ${v.rule.description}`)
    console.log(`    > ${v.content.substring(0, 120)}`)
    console.log()
  }
}

if (errors.length > 0) {
  console.log(`\n❌ エラー: ${errors.length}件\n`)
  for (const v of errors) {
    console.log(`  ${v.file}:${v.line}`)
    console.log(`    [${v.rule.id}] ${v.rule.description}`)
    console.log(`    > ${v.content.substring(0, 120)}`)
    console.log()
  }
  console.log('ハードコードを定数ファイルまたはヘルパー関数に移動してください。')
  console.log('許可ファイルに追加する場合は scripts/check-hardcode.ts の allowedFiles を更新してください。\n')
  process.exit(1)
}

// 警告のみの場合は成功
console.log('\n✅ エラーなし（警告のみ）。\n')
process.exit(0)

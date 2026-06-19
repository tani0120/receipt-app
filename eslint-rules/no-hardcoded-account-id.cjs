/**
 * no-hardcoded-account-id.cjs — ESLintカスタムルール
 *
 * 科目ID・経過措置日付・事業者種別の直接比較を検知し、
 * IDEの「問題」パネルにリアルタイムでエラー表示する。
 *
 * ファイル保存時に自動実行される（ESLintのIDE統合）。
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: '科目ID・日付・事業者種別のハードコードを禁止する',
    },
    messages: {
      accountId: '科目ID "{{id}}" が許可ファイル外にハードコードされています。定数ファイルまたはVOUCHER_TYPE_RULESを使用してください。',
      effectiveDate: 'effectiveFrom日付がハードコードされています。DEFAULT_EFFECTIVE_FROMを使用してください。',
      transitionDate: 'インボイス経過措置日付がハードコードされています。INVOICE_TRANSITION_*_DATE定数を使用してください。',
      businessType: '事業者種別の直接比較です。isIndividualType()ヘルパーを使用してください。',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename()
    const normalized = filename.replace(/\\/g, '/')

    // 許可ファイル（これらのファイルではチェックしない）
    const allowedForAccountId = [
      'voucherTypeRules.ts',
      'lineItemToJournalMock.ts',
      'domain-journal.ts',
      'account-master.ts',
      'mfApiConstants.ts',
      'journalHintService.ts',
      'preview_extract_schema.ts',
      'test_mf_send.ts',
      'check-hardcode.ts',
      'MasterFieldFlowPage.vue', // 科目フィールド解説UI（表示用データのみ）
      '.type.ts',
      'scripts/seed/',
      'scripts/',
    ]

    const allowedForDate = [
      'mfApiConstants.ts',
      'check-hardcode.ts',
    ]

    const allowedForBusinessType = [
      'clientOptions.ts',
      'clientFieldDefs.ts',
      'leadFieldDefs.ts',
      '.type.ts',
      'check-hardcode.ts',
    ]

    function isAllowed(allowList) {
      return allowList.some(a => normalized.includes(a))
    }

    // 科目IDパターン
    const ACCOUNT_IDS = [
      'ORDINARY_DEPOSIT', 'CHECKING_DEPOSIT', 'TIME_DEPOSIT', 'OTHER_DEPOSIT',
      'CASH', 'ACCRUED_EXPENSES', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE',
      'NOTES_RECEIVABLE', 'TEMPORARY_PAYMENTS', 'ADVANCE_PAID', 'ACCRUED_REVENUE',
      'DEPOSITS_RECEIVED', 'SALARIES', 'OFFICER_COMPENSATION', 'BONUSES',
      'COST_OF_GOODS_SOLD',
    ]
    const accountIdPattern = new RegExp(`['"](?:${ACCOUNT_IDS.join('|')})['"]`)

    // コメント行判定
    function isCommentLine(line) {
      const trimmed = line.trim()
      return trimmed.startsWith('//') ||
             trimmed.startsWith('*') ||
             trimmed.startsWith('/*') ||
             trimmed.includes('例:') ||
             trimmed.includes('例：') ||
             trimmed.includes('description:')
    }

    return {
      // 全行を検査（Literal + TemplateLiteralだと漏れるのでProgram単位で行走査）
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode()
        const lines = sourceCode.getText().split('\n')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (isCommentLine(line)) continue

          // ── 科目ID検査 ──
          if (!isAllowed(allowedForAccountId)) {
            const match = line.match(accountIdPattern)
            if (match) {
              context.report({
                loc: { line: i + 1, column: line.indexOf(match[0]) },
                messageId: 'accountId',
                data: { id: match[0].replace(/['"]/g, '') },
              })
            }
          }

          // ── effectiveFrom日付検査 ──
          if (!isAllowed(allowedForDate)) {
            if (/effectiveFrom:\s*['"]2019-10-01['"]/.test(line)) {
              context.report({
                loc: { line: i + 1, column: line.indexOf('2019-10-01') },
                messageId: 'effectiveDate',
              })
            }
          }

          // ── 経過措置日付検査 ──
          if (!isAllowed(allowedForDate)) {
            if (/['"](?:2026-10-01|2029-10-01)['"]/.test(line)) {
              context.report({
                loc: { line: i + 1, column: 0 },
                messageId: 'transitionDate',
              })
            }
          }

          // ── 事業者種別直接比較検査 ──
          if (!isAllowed(allowedForBusinessType)) {
            if (/(?:businessType|clientType|type)\s*===?\s*['"](?:individual|sole_proprietor)['"]/.test(line)) {
              if (!line.includes('isIndividualType')) {
                context.report({
                  loc: { line: i + 1, column: 0 },
                  messageId: 'businessType',
                })
              }
            }
          }
        }
      },
    }
  },
}

import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
// @ts-expect-error CJSカスタムルール（型宣言不要）
import noHardcodedAccountId from './eslint-rules/no-hardcoded-account-id.cjs'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    // Tier 0: lint ノイズ除去（2026-03-30）
    '.history/**',
    '**/*.cjs',
    '**/*.js',
    'docs/_archive_legacy/**',
    'docs/genzai/07_test_plan/**',
    'freeze/**',
    'test_*.ts',
    'verify_factory.ts',
    'test_api.ts',
    'test_env.ts',
  ]),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  // Global Rules
  {
    name: 'app/global-rules',
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },

  // Ironclad Rules (Strict) - src/aaa only
  {
    name: 'app/ironclad-rules',
    files: ['src/aaa/**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Additional strict rules can be added here
    },
  },

  // Sandbox & Debug Rules (Relaxed)
  {
    name: 'app/sandbox-rules',
    files: [
      'src/views/debug/**/*',
      'src/Mirror_sandbox/**/*',
      'src/three_sandbox/**/*',
      'src/utils/seed*',
      'src/mocks/**/*',
      'scripts/**/*',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // ────────────────────────────────────────────
  // API層 @/ エイリアス禁止ルール
  //
  // tsx（サーバー側ランタイム）は tsconfig.app.json の paths を
  // 解決できないため、src/api/ 配下では @/ エイリアスを禁止し
  // 相対パスを強制する。
  //
  // ブラウザ専用ファイル（ocr_service_browser.ts, ocr/ocr_service.ts,
  // receiptService.ts）は Vite が @/ を解決するため除外。
  // ────────────────────────────────────────────
  {
    name: 'app/api-no-alias',
    files: ['src/api/**/*.ts'],
    ignores: [
      'src/api/ai/gemini/ocr_service_browser.ts',
      'src/api/ai/ocr/ocr_service.ts',
      'src/api/services/receiptService.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/*'],
          message: 'API層（tsx実行）では @/ エイリアス禁止。相対パスを使用してください。',
        }],
      }],
    },
  },

  // ────────────────────────────────────────────
  // ハードコード検知ルール（カスタム）
  //
  // ファイル保存時にIDEが自動実行。科目ID・日付・事業者種別の
  // ハードコードを検知し、赤波線+問題パネルに表示する。
  // ────────────────────────────────────────────
  {
    name: 'app/no-hardcode',
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/scripts/**'],
    plugins: {
      'custom': {
        rules: {
          'no-hardcoded-account-id': noHardcodedAccountId,
        },
      },
    },
    rules: {
      'custom/no-hardcoded-account-id': 'error',
    },
  },
)

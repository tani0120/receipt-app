import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

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
)

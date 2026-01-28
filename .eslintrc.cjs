module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es2022: true
    },
    extends: [
        'plugin:vue/vue3-essential',
        'eslint:recommended',
        '@vue/typescript/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2022
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    },
    overrides: [
        {
            // 新コード（features/）の制約
            files: ['src/features/**/*'],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: ['@/legacy/*', '@/composables/*', '@/components/*', '@/views/*', '@/api/*'],
                                message: '❌ Features cannot import legacy code. Use @/features/* or @/types/* instead.'
                            },
                            {
                                group: ['../legacy/*', '../../legacy/*', '../../../legacy/*'],
                                message: '❌ Features cannot import legacy code (relative path).'
                            },
                            {
                                group: ['../composables/*', '../../composables/*', '../../../composables/*'],
                                message: '❌ Features cannot import legacy composables (relative path).'
                            }
                        ]
                    }
                ]
            }
        },
        {
            // 既存コード（legacy等）の制約
            files: [
                'src/legacy/**/*',
                'src/composables/**/*',
                'src/components/**/*',
                'src/views/**/*',
                'src/api/**/*'
            ],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: [
                            {
                                group: ['@/features/*'],
                                message: '❌ Legacy code cannot import features. This prevents type-safety contamination.'
                            },
                            {
                                group: ['../features/*', '../../features/*', '../../../features/*'],
                                message: '❌ Legacy code cannot import features (relative path).'
                            }
                        ]
                    }
                ]
            }
        }
    ]
};

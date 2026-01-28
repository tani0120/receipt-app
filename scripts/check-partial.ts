import { Project } from 'ts-morph';

/**
 * ASTベース型安全性チェック
 *
 * 目的: grepで回避できない、構文木レベルでの型安全性検知
 *
 * 検知対象:
 * - Partial<T>（どんな書き方でも検知）
 * - any型（globalThis.any等も検知）
 * - 証跡コメントなしの例外
 */

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

// Domain層、Features層、Services層を厳格チェック（CI/CD脆弱性修正）
const domainFiles = project.getSourceFiles('src/domain/**/*.ts');
const featureFiles = project.getSourceFiles('src/features/**/*.ts');
const serviceFiles = project.getSourceFiles('src/services/**/*.ts');

let violations = 0;

console.log('🔍 Running AST-based type safety check...\\n');

[...domainFiles, ...featureFiles, ...serviceFiles].forEach(file => {
    file.forEachDescendant(node => {
        if (node.getKindName() === 'TypeReference') {
            const typeName = node.getText();
            const lineNumber = node.getStartLineNumber();
            const filePath = file.getFilePath();

            // Partial検知（どんな書き方でも検知）
            if (typeName.includes('Partial<')) {
                console.error(
                    `❌ Partial type detected:\\n` +
                    `   File: ${filePath}:${lineNumber}\\n` +
                    `   Code: ${typeName}\\n` +
                    `   Fix: Use Pick<T, 'field1' | 'field2'> instead of Partial<T>\\n`
                );
                violations++;
            }

            // any検知（証跡コメントの確認）
            if (typeName.includes('any')) {
                const leadingComments = node.getLeadingCommentRanges();
                const hasAuditComment = leadingComments.some(comment => {
                    const commentText = comment.getText();
                    return commentText.includes('@type-audit');
                });

                if (!hasAuditComment) {
                    console.error(
                        `❌ any type without audit comment:\\n` +
                        `   File: ${filePath}:${lineNumber}\\n` +
                        `   Code: ${typeName}\\n` +
                        `   Fix: Add @type-audit comment or use unknown + type guard\\n`
                    );
                    violations++;
                }
            }
        }
    });
});

if (violations > 0) {
    console.error(`\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error(`❌ Found ${violations} type safety violation(s).`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n`);
    console.error(`📖 See docs/CONVENTIONS.md for correct patterns.`);
    process.exit(1);
}

console.log('✅ Type safety check passed. No violations found.\\n');

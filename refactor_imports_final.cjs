const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('src/sandbox_mirror');

function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
            updateFileContent(fullPath);
        }
    }
}

function updateFileContent(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Strategy:
    // 1. Identify all imports that point to files inside sandbox_mirror (relative paths).
    // 2. Extract the filename from the path.
    // 3. If the filename doesn't start with 'Mirror_', prepend it.
    // 4. Also handle directory names in the path (Mirror_components, etc.) - assumed done by v2 script but good to re-check.

    // Regex to match imports: import ... from '...' or import('...')
    // We strictly look for relative paths starting with . or @/sandbox_mirror

    content = content.replace(/(from\s+['"]|import\(['"])([\.\/@].*?)(['"])/g, (match, prefix, importPath, suffix) => {
        // Only process paths that look like they are internal to sandbox_mirror
        if (!importPath.includes('sandbox_mirror') && !importPath.startsWith('.')) {
            return match; // External lib or absolute path elsewhere
        }

        let parts = importPath.split('/');
        let filename = parts.pop();

        // Skip default imports if no filename (e.g. import '...') unlikely
        if (!filename) return match;

        // If it's a file import (has extension or is a known file type context)
        // We blindly prepend Mirror_ to the last segment if it lacks it.
        // Exception: 'vue', 'pinia', etc are handled by first check.

        if (!filename.startsWith('Mirror_')) {
            filename = 'Mirror_' + filename;
        }

        // Reassemble
        let newPath = [...parts, filename].join('/');

        return `${prefix}${newPath}${suffix}`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed Imports in: ${filePath}`);
    }
}

console.log('Starting Final Import Refactor...');
processDirectory(targetDir);
console.log('Final Import Refactor complete.');

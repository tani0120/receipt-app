
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, 'src');
const indexHtml = path.resolve(__dirname, 'index.html');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    // Process files first, then directories to avoid path issues

    // First pass: rename files in this dir
    const filesToRename = files.filter(f => f.startsWith('aaa_'));
    for (const file of filesToRename) {
        const oldPath = path.join(dir, file);
        const newName = file.replace('aaa_', '');
        const newPath = path.join(dir, newName);
        console.log(`Renaming File: ${oldPath} -> ${newPath}`);
        try {
            fs.renameSync(oldPath, newPath);
        } catch (e) {
            console.error(`Failed to rename ${file}:`, e.message);
        }
    }

    // Refresh file list after renames
    const newFiles = fs.readdirSync(dir);

    for (const file of newFiles) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file.startsWith('aaa_') || file === 'aaa') {
                const newName = file === 'aaa' ? 'temp_aaa' : file.replace('aaa_', '');
                const newPath = path.join(dir, newName);
                console.log(`Renaming Dir: ${filePath} -> ${newPath}`);
                try {
                    fs.renameSync(filePath, newPath);
                    walk(newPath, callback); // Recurse into new path
                } catch (e) {
                    console.error(`Failed to rename dir ${file}:`, e.message);
                    walk(filePath, callback); // Recurse into old path if fail
                }
            } else {
                walk(filePath, callback);
            }
        } else {
            callback(filePath);
        }
    }
}

function processFile(filePath) {
    const ext = path.extname(filePath);
    if (!['.ts', '.js', '.vue', '.json', '.html', '.md'].includes(ext)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Replace import paths
        content = content.replace(/@\/aaa\/aaa_/g, '@/');
        content = content.replace(/@\/aaa\//g, '@/');

        // Replace relative imports simple cases
        content = content.replace(/\/aaa_/g, '/');

        // Code identifiers (Start with basics)
        content = content.replace(/aaa_Screen/g, 'Screen');
        content = content.replace(/aaa_components/g, 'components');
        content = content.replace(/aaa_composables/g, 'composables');
        content = content.replace(/aaa_types/g, 'types');
        content = content.replace(/aaa_services/g, 'services');
        content = content.replace(/aaa_utils/g, 'utils');
        content = content.replace(/aaa_views/g, 'views');
        content = content.replace(/aaa_router/g, 'router');
        content = content.replace(/aaa_assets/g, 'assets');
        content = content.replace(/aaa_\//g, '/'); // cleanup weird paths

        if (content !== originalContent) {
            console.log(`Updating content: ${filePath}`);
            fs.writeFileSync(filePath, content, 'utf8');
        }
    } catch (e) {
        console.error(`Error processing content of ${filePath}:`, e.message);
    }
}

console.log('Starting refactor...');
walk(rootDir, processFile);

// Index HTML
if (fs.existsSync(indexHtml)) {
    let content = fs.readFileSync(indexHtml, 'utf8');
    if (content.includes('/src/aaa/aaa_main.ts')) {
        content = content.replace('/src/aaa/aaa_main.ts', '/src/main.ts');
        fs.writeFileSync(indexHtml, content, 'utf8');
        console.log('Updated index.html');
    }
}
console.log('Done.');

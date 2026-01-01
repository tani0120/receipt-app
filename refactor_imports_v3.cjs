const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('src/sandbox_mirror');

// V3 Replacements: Handling the subdirectories specifically
const replacements = [
    // Subdirectories
    // icons -> Mirror_icons
    { from: '/components/icons/', to: '/Mirror_components/Mirror_icons/' },
    { from: '/components/Mirror_icons/', to: '/Mirror_components/Mirror_icons/' }, // If parent already renamed in string
    { from: '/Mirror_components/icons/', to: '/Mirror_components/Mirror_icons/' },

    // debug -> Mirror_debug
    { from: '/views/debug/', to: '/Mirror_views/Mirror_debug/' },
    { from: '/views/Mirror_debug/', to: '/Mirror_views/Mirror_debug/' },
    { from: '/Mirror_views/debug/', to: '/Mirror_views/Mirror_debug/' },

    // Ensure parents are correct (in case v2 missed some or order mattered)
    { from: '/components/', to: '/Mirror_components/' },
    { from: '/views/', to: '/Mirror_views/' },

    // Fix any potential double Mirroring or missed Mirroring for specific common files if needed
    // But relying mainly on directory structure fix.
];

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

    replacements.forEach(rep => {
        const regex = new RegExp(escapeRegExp(rep.from), 'g');
        content = content.replace(regex, rep.to);
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated V3: ${filePath}`);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('Starting V3 refactor...');
processDirectory(targetDir);
console.log('V3 Refactor complete.');

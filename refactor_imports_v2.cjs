const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('src/sandbox_mirror');

// Dictionary of simple replacement strings for directories and root files
// This will replace strings in import paths.
const replacements = [
    { from: '/components/', to: '/Mirror_components/' },
    { from: '../components/', to: '../Mirror_components/' },
    { from: '@/sandbox_mirror/components/', to: '@/sandbox_mirror/Mirror_components/' },

    { from: '/views/', to: '/Mirror_views/' },
    { from: '../views/', to: '../Mirror_views/' },
    { from: '@/sandbox_mirror/views/', to: '@/sandbox_mirror/Mirror_views/' },

    { from: '/composables/', to: '/Mirror_composables/' },
    { from: '../composables/', to: '../Mirror_composables/' },
    { from: '@/sandbox_mirror/composables/', to: '@/sandbox_mirror/Mirror_composables/' },

    { from: '/router/', to: '/Mirror_router/' },
    { from: '../router/', to: '../Mirror_router/' },
    { from: '@/sandbox_mirror/router/', to: '@/sandbox_mirror/Mirror_router/' },

    { from: '/services/', to: '/Mirror_services/' },
    { from: '../services/', to: '../Mirror_services/' },
    { from: '@/sandbox_mirror/services/', to: '@/sandbox_mirror/Mirror_services/' },

    { from: '/utils/', to: '/Mirror_utils/' },
    { from: '../utils/', to: '../Mirror_utils/' },
    { from: '@/sandbox_mirror/utils/', to: '@/sandbox_mirror/Mirror_utils/' },

    { from: '/types/', to: '/Mirror_types/' },
    { from: '../types/', to: '../Mirror_types/' },
    { from: '@/sandbox_mirror/types/', to: '@/sandbox_mirror/Mirror_types/' },

    { from: '/stores/', to: '/Mirror_stores/' },
    { from: '../stores/', to: '../Mirror_stores/' },
    { from: '@/sandbox_mirror/stores/', to: '@/sandbox_mirror/Mirror_stores/' },

    { from: '/mocks/', to: '/Mirror_mocks/' },
    { from: '../mocks/', to: '../Mirror_mocks/' },
    { from: '@/sandbox_mirror/mocks/', to: '@/sandbox_mirror/Mirror_mocks/' },

    { from: 'App.vue', to: 'Mirror_App.vue' }, // Be careful with 'App.vue' string
    { from: './router', to: './Mirror_router' },

    // Explicit full path fixes if needed
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
    let originalContent = content; // Keep original to check for changes

    replacements.forEach(rep => {
        // Simple global replacement.
        // Note: replacing 'App.vue' with 'Mirror_App.vue' might cause 'Mirror_Mirror_App.vue' if run twice or if 'Mirror_App.vue' already exists.
        // But here we assume we are running once on a state where imports are mostly "old style" regarding directories.

        // Using split/join is safer than regex for literal strings with special chars like / or .
        // But we must be careful not to double-replace.
        // A better regex approach: replace occurrence if NOT preceded by Mirror_ (for file/dir names that match).
        // But for paths like '../components/', simple replacement is usually safe IF we assume source code was clean.

        // For directory parts:
        const regex = new RegExp(escapeRegExp(rep.from), 'g');
        content = content.replace(regex, rep.to);
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

console.log('Starting V2 refactor...');
processDirectory(targetDir);
console.log('V2 Refactor complete.');

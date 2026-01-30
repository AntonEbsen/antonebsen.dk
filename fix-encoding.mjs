
import fs from 'fs/promises';
import path from 'path';

const replacements = {
    'Ã¦': 'æ',
    'Ã¸': 'ø',
    'Ã¥': 'å',
    'Ã†': 'Æ',
    'Ã˜': 'Ø',
    'Ã…': 'Å',
    'Ã©': 'é',
    'â€“': '–',
    'â€™': '’',
    'â€œ': '“',
    'â€': '”',
    // Add common emojis or other symbols if seen, but start with the basics
};

async function walk(dir) {
    let files = await fs.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                await walk(filePath);
            }
        } else {
            if (file.endsWith('.astro') || file.endsWith('.json') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.md')) {
                await processFile(filePath);
            }
        }
    }
}

async function processFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        let newContent = content;
        let modified = false;

        // Naive replacement but effectively handles the specific Mojibake we see
        for (const [bad, good] of Object.entries(replacements)) {
            if (newContent.includes(bad)) {
                // Global replace
                newContent = newContent.split(bad).join(good);
                modified = true;
            }
        }

        if (modified) {
            console.log(`Fixing encoding in: ${filePath}`);
            await fs.writeFile(filePath, newContent, 'utf8');
        }
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
    }
}

// Target specific directories to avoid accidents
await walk('./src/pages');
await walk('./src/components/templates');
await walk('./src/content');

console.log('Encoding fix complete.');

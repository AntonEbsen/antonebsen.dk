import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/Anton/antonebsen.dk/src/pages/[lang]';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.astro') && f !== 'index.astro'); // index.astro already done

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('export const prerender = true')) {
        console.log(`Skipping ${file} (already prerendered)`);
        return;
    }

    // Insert after the first ---
    if (content.startsWith('---')) {
        const lines = content.split('\n');
        // Find line index of first ---
        // verify strictly
        if (lines[0].trim() === '---') {
            lines.splice(1, 0, 'export const prerender = true;');
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log(`Updated ${file}`);
        } else {
            console.log(`Skipping ${file} - bad format`);
        }
    } else {
        console.log(`Skipping ${file} - no frontmatter`);
    }
});

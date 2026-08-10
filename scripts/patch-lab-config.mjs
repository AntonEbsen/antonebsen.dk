import fs from 'fs';
import path from 'path';

const researchDir = path.join(process.cwd(), 'public', 'research');
const mainConfigPath = path.join(researchDir, 'jupyter-lite.json');
const labConfigPath = path.join(researchDir, 'lab', 'jupyter-lite.json');

console.log("Patching JupyterLite configuration...");

// Patch Main Config
if (fs.existsSync(mainConfigPath)) {
    const mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf8'));
    mainConfig['jupyter-config-data'].baseUrl = '/research/';
    mainConfig['jupyter-config-data'].fullStaticUrl = '/research/build';
    fs.writeFileSync(mainConfigPath, JSON.stringify(mainConfig, null, 2));
    console.log(`Updated baseUrl and fullStaticUrl in ${mainConfigPath}`);
} else {
    console.error(`Error: ${mainConfigPath} not found.`);
    process.exit(1);
}

// Patch Lab Config
if (fs.existsSync(labConfigPath)) {
    const labConfig = JSON.parse(fs.readFileSync(labConfigPath, 'utf8'));
    // Settled empirically, because this JupyterLite version resolves these against a
    // base that matches none of the obvious guesses:
    //   '/research/build/…'  -> /research/research/build/… (concatenated onto baseUrl)
    //   './build/…'          -> 314 console errors, the notebook never opens
    //   '../build/…'         -> the app loads and the notebook opens
    // With '../' one stylesheet still 404s: the dark theme resolves to /build/themes
    // instead of /research/build/themes, so JupyterLite falls back to its light theme.
    // Everything else works. Worth another look if the lab is themed properly later.
    labConfig['jupyter-config-data'].themesUrl = '../build/themes';
    labConfig['jupyter-config-data'].settingsUrl = '../build/schemas';
    labConfig['jupyter-config-data'].appUrl = '/research/lab';
    fs.writeFileSync(labConfigPath, JSON.stringify(labConfig, null, 2));
    console.log(`Updated all URLs to absolute paths in ${labConfigPath}`);
} else {
    console.error(`Error: ${labConfigPath} not found.`);
    process.exit(1);
}

console.log("JupyterLite configuration patched successfully.");

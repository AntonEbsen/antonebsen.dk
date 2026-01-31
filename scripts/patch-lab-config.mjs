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
    fs.writeFileSync(mainConfigPath, JSON.stringify(mainConfig, null, 2));
    console.log(`Updated baseUrl in ${mainConfigPath}`);
} else {
    console.error(`Error: ${mainConfigPath} not found.`);
    process.exit(1);
}

// Patch Lab Config
if (fs.existsSync(labConfigPath)) {
    const labConfig = JSON.parse(fs.readFileSync(labConfigPath, 'utf8'));
    labConfig['jupyter-config-data'].themesUrl = '../build/themes';
    labConfig['jupyter-config-data'].appUrl = '/research/lab';
    fs.writeFileSync(labConfigPath, JSON.stringify(labConfig, null, 2));
    console.log(`Updated themesUrl and appUrl in ${labConfigPath}`);
} else {
    console.error(`Error: ${labConfigPath} not found.`);
    process.exit(1);
}

console.log("JupyterLite configuration patched successfully.");

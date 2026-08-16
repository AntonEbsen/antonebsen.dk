import fs from 'node:fs';
import path from 'node:path';

/**
 * The build scripts run under plain node and cannot import a TypeScript module, so the
 * model id is read out of src/lib/ai/model.ts rather than duplicated here. Copies are
 * how the repo ended up with four different model ids, one of them retired.
 */
function read(name) {
    const file = path.resolve('src/lib/ai/model.ts');
    const src = fs.readFileSync(file, 'utf8');
    const match = src.match(new RegExp(`export const ${name}\\s*=\\s*['"]([^'"]+)['"]`));
    if (!match) {
        throw new Error(`Could not read ${name} from ${file}`);
    }
    return match[1];
}

export function readChatModel() {
    return read('CHAT_MODEL');
}

/** The human-readable name, for anything a visitor reads. */
export function readModelLabel() {
    return read('MODEL_LABEL');
}

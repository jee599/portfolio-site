import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = '.vercel/output/functions';
const TARGET_RUNTIME = 'nodejs20.x';

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (entry === '.vc-config.json') {
      files.push(full);
    }
  }
  return files;
}

try {
  const configs = walk(OUTPUT_DIR);
  for (const file of configs) {
    const data = JSON.parse(readFileSync(file, 'utf-8'));
    if (data.runtime && data.runtime !== TARGET_RUNTIME) {
      console.log(`Patching ${file}: ${data.runtime} → ${TARGET_RUNTIME}`);
      data.runtime = TARGET_RUNTIME;
      writeFileSync(file, JSON.stringify(data, null, 2));
    }
  }
  console.log(`Done. Patched ${configs.length} config(s).`);
} catch (e) {
  console.log('No functions directory found, skipping runtime patch.');
}

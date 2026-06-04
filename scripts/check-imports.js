#!/usr/bin/env node
// scripts/check-imports.js
// Verifica imports faltantes y problemas de sintaxis antes del build

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC = './src';
let errors = 0;
let checked = 0;

function walkFiles(dir) {
  const items = readdirSync(dir);
  const files = [];
  for (const item of items) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) files.push(...walkFiles(full));
    else if (['.jsx', '.js'].includes(extname(item))) files.push(full);
  }
  return files;
}

// Helpers exported from Helpers.jsx
const HELPERS = ['TxRow', 'SectionHeader', 'EmptyState', 'Pill', 'StatCard', 'MF'];

for (const file of walkFiles(SRC)) {
  const content = readFileSync(file, 'utf8');
  checked++;

  // 1. Check for backticks in JSX
  const btCount = (content.match(/`/g) || []).length;
  if (btCount > 0) {
    console.error(`❌ ${file}: ${btCount} backtick(s) — causa bugs en esbuild produccion`);
    errors++;
  }

  // 2. Check balanced braces
  const opens  = (content.match(/\{/g) || []).length;
  const closes = (content.match(/\}/g) || []).length;
  if (opens !== closes) {
    console.error(`❌ ${file}: llaves desequilibradas {=${opens} }=${closes}`);
    errors++;
  }

  // 3. Check helper components used but not imported (finanz/ files)
  if (file.includes('/finanz/') && !file.includes('Helpers.jsx')) {
    const importedHelpers = new Set(
      HELPERS.filter(h => content.includes(`import`) && content.includes(h) &&
        content.split('\n').some(l => l.includes('Helpers.jsx') && l.includes(h)))
    );
    const usedHelpers = HELPERS.filter(h => new RegExp(`<${h}[\\s/>]`).test(content));
    const missing = usedHelpers.filter(h => !importedHelpers.has(h));
    if (missing.length > 0) {
      console.error(`❌ ${file}: usa ${missing.join(', ')} sin importar de Helpers.jsx`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log(`✅ check-imports: ${checked} archivos OK`);
  process.exit(0);
} else {
  console.error(`\n❌ ${errors} error(es) encontrados — build cancelado`);
  process.exit(1);
}

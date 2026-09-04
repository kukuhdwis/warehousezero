import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Lucide from 'lucide-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const srcDir = path.resolve(__dirname, '../src');
const files = getFiles(srcDir);
const hooks = ['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext'];
let errorCount = 0;

// 1. Verify React Hooks
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  hooks.forEach(h => {
    const callRegex = new RegExp('(?<!React\\.)\\b' + h + '\\s*\\(', 'g');
    if (callRegex.test(content)) {
      const importRegex = new RegExp('import\\s+[^;]*\\b' + h + '\\b[^;]*from\\s+[\'"]react[\'"]');
      if (!importRegex.test(content)) {
        console.error(`❌ [MISSING HOOK IMPORT] '${h}' is used but not imported in ${path.relative(srcDir, f)}`);
        errorCount++;
      }
    }
  });
});

// 2. Verify Lucide Icons
const allLucideIcons = new Set(Object.keys(Lucide));

files.forEach(f => {
  if (!f.endsWith('.jsx')) return;
  const content = fs.readFileSync(f, 'utf8');
  const jsxTagRegex = /<([A-Z][A-Za-z0-9]+)\b/g;
  let match;
  const usedComponents = new Set();
  while ((match = jsxTagRegex.exec(content)) !== null) {
    usedComponents.add(match[1]);
  }

  const importedNames = new Set();
  const importLines = content.match(/import\s+[^;]+from\s+['"][^'"]+['"]/g) || [];
  importLines.forEach(line => {
    const names = line.replace(/import\s+/, '').replace(/\s+from\s+.*$/, '');
    names.replace(/[\{\}]/g, '').split(',').forEach(n => {
      const parts = n.trim().split(/\s+as\s+/);
      const imported = parts[parts.length - 1].trim();
      if (imported) importedNames.add(imported);
    });
  });

  const declaredRegex = /(?:function|class|const|let|var)\s+([A-Z][A-Za-z0-9]+)\b/g;
  while ((match = declaredRegex.exec(content)) !== null) {
    importedNames.add(match[1]);
  }

  usedComponents.forEach(comp => {
    if (allLucideIcons.has(comp) && !importedNames.has(comp)) {
      console.error(`❌ [MISSING LUCIDE ICON] <${comp}> is rendered in JSX but not imported in ${path.relative(srcDir, f)}`);
      errorCount++;
    }
  });
});

if (errorCount > 0) {
  console.error(`\n🚨 Verification failed with ${errorCount} missing import error(s). Build aborted.`);
  process.exit(1);
} else {
  console.log(`✅ Import verification passed: All React hooks and Lucide icons (${allLucideIcons.size} available) are verified in all ${files.length} source files.`);
}

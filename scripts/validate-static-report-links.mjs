import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !fs.existsSync(root)) {
  throw new Error('Usage: node scripts/validate-static-report-links.mjs <report-directory>');
}

const htmlFiles = [];
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(target);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(target);
  }
};
visit(root);

const missing = [];
let checkedLinks = 0;
for (const htmlFile of htmlFiles) {
  const source = fs.readFileSync(htmlFile, 'utf8');
  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
    const raw = match[1];
    if (/^(?:https?:|data:|mailto:|javascript:|#)/i.test(raw)) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/, 1)[0]);
    if (!clean) continue;
    checkedLinks += 1;
    const target = path.resolve(path.dirname(htmlFile), clean);
    if (!target.startsWith(root) || !fs.existsSync(target)) {
      missing.push({html: path.relative(root, htmlFile), target: raw});
    }
  }
}

const result = {root, htmlFiles: htmlFiles.length, checkedLinks, missingLinks: missing.length, missing};
console.log(JSON.stringify(result, null, 2));
if (missing.length) process.exitCode = 1;

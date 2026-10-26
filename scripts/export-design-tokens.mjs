import fs from 'node:fs';

// The CSS remains the source of truth. Preserve conditions and CSS expressions;
// values such as color-mix/clamp cannot truthfully be exported as static colors.
const source = 'src/design-system/styles/tokens.css';
const target = 'docs/design-system/tokens.json';
const text = fs.readFileSync(source, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const scopes = new Map();
function blocks(css, parents = []) {
  let cursor = 0;
  for (;;) {
    const start = css.indexOf('{', cursor);
    if (start < 0) break;
    const condition = css.slice(cursor, start).trim();
    let end = start + 1;
    let depth = 1;
    while (depth && end < css.length) {
      if (css[end] === '{') depth++;
      if (css[end] === '}') depth--;
      end++;
    }
    const body = css.slice(start + 1, end - 1);
    const conditions = [...parents, condition];
    if (body.includes('{')) blocks(body, conditions);
    else {
      const values = Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
      if (Object.keys(values).length) {
        const key = JSON.stringify(conditions);
        scopes.set(key, { conditions, values: { ...scopes.get(key)?.values, ...values } });
      }
    }
    cursor = end;
  }
}
blocks(text);
const output =
  JSON.stringify({ source, format: 'CSS custom properties with ordered conditions', scopes: [...scopes.values()] }, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    console.error(`Token catalog is stale. Run node scripts/export-design-tokens.mjs`);
    process.exit(1);
  }
} else {
  fs.mkdirSync('docs/design-system', { recursive: true });
  fs.writeFileSync(target, output);
}

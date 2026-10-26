// Read-only acceptance check. Never commit the input workbook or its personal data.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { importTemplate } from '../src/products/writer/services/templateService.js';
import { matchProduct } from '../src/shared/services/productMatching.js';
const [path, today, catalogPath] = process.argv.slice(2);
if (!path || !today) throw new Error('Usage: node scripts/verify-weekly-integration.mjs workbook.xlsx YYYY-MM-DD [public-products.json]');
globalThis.DOMParser = new JSDOM('').window.DOMParser;
const bytes = await fs.readFile(path);
const template = await importTemplate({ name: 'expected.xlsx', size: bytes.length, arrayBuffer: async () => bytes }, today);
const catalog = catalogPath
  ? JSON.parse(await fs.readFile(catalogPath, 'utf8'))
  : JSON.parse(await fs.readFile(new URL('../tests/fixtures/week44-products.json', import.meta.url), 'utf8')).insights;
const results = catalog.map((product) => ({ product, match: matchProduct(product, template.products) }));
const internal = results.filter((row) => /^YPR-/i.test(row.product.product_code || ''));
assert.ok(
  internal.some((row) => row.match.candidates.length),
  'Internal catalog IDs must not block all valid names.'
);
assert.ok(template.products.every((product) => !product.name || typeof product.name === 'string'));
process.stdout.write(
  JSON.stringify(
    {
      period: template.period.start + ' / ' + template.period.end,
      workbookProducts: template.products.length,
      validPrices: template.products.filter((p) => Number.isFinite(p.price) && p.price > 0).length,
      catalogProducts: catalog.length,
      matched: results.filter((row) => row.match.candidates.length).length,
      unmatched: results.filter((row) => !row.match.candidates.length).map((row) => row.product.name)
    },
    null,
    2
  ) + '\n'
);

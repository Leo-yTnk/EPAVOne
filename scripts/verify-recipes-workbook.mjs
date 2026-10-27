import fs from 'node:fs';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readCatalogFile } from '../src/products/insights/creation/admin/workbookService.js';
import { parseCatalogWorkbook } from '../src/products/insights/creation/admin/importParser.js';
const file = process.argv[2];
assert(file, 'Pass the exported .xlsx path');
globalThis.DOMParser = new JSDOM().window.DOMParser;
const bytes = fs.readFileSync(file);
const workbook = await readCatalogFile({ name: 'import.xlsx', size: bytes.length, arrayBuffer: async () => bytes });
const source = JSON.parse(fs.readFileSync('docs/catalog-expansion-2026-10-27/source.json', 'utf8'));
const parsed = parseCatalogWorkbook(workbook, { products: source.existing, recipes: source.existingRecipes });
assert.deepEqual(parsed.errors, []);
assert.equal(parsed.recipes.length, 42);
assert.equal(parsed.products.length, 805);
assert.equal(workbook.Sheets['Produtos ausentes'].length, 805);
assert.equal(parsed.recipeSections.length, 84);
assert.equal(parsed.productSections.length, 805);
assert(parsed.recipes.every((r) => r.ingredients.length >= 2 && r.instructions.length >= 4));
process.stdout.write(
  JSON.stringify({
    recipes: parsed.recipes.length,
    products: parsed.products.length,
    errors: parsed.errors,
    recipeLinks: parsed.recipeSections.length,
    productLinks: parsed.productSections.length,
    bytes: bytes.length
  }) + '\n'
);

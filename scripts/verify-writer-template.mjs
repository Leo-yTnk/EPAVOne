// Local acceptance check; never copy real customer workbooks into the repository.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { importTemplate } from '../src/products/writer/services/templateService.js';
import { exportOrder } from '../src/products/writer/services/exportService.js';
import { validateOrder, orderCpf, exportCpf } from '../src/products/writer/models/order.js';
import { cpfValidationFormula, parseXml, sheetCells } from '../src/products/writer/services/xmlWorkbook.js';

globalThis.DOMParser = new JSDOM('').window.DOMParser;
const [path, today = '2026-09-30'] = process.argv.slice(2);
if (!path) throw new Error('Usage: node scripts/verify-writer-template.mjs /path/to/form.xlsx YYYY-MM-DD');
const bytes = await fs.readFile(path);
const file = { name: 'form.xlsx', size: bytes.length, arrayBuffer: async () => bytes };
const template = await importTemplate(file, today);
await assert.rejects(() => importTemplate(file, '2099-01-01'), /venceu/);
const products = template.products.filter((product) => product.price > 0).slice(0, 25);
assert.equal(products.length, 25);
const store = template.stores.find(
  (item) => item.name !== template.market && item.street && item.number && item.neighborhood && /^\d{8}$/.test(item.zip.replace(/\D/g, ''))
);
let order;
for (const client of template.clients) {
  const student = template.students.find((item) => item.room === client.room);
  if (!student) continue;
  const candidate = {
    room: client.room,
    student: student.name,
    client: client.name,
    phone: '11999999999',
    method: template.methods.find((method) => method.toLowerCase().includes('outras lojas')),
    store: store.name,
    date: today,
    payment: template.payments[0],
    lines: products.map((product, index) => ({ name: product.name, quantity: index + 1, kit: false }))
  };
  if (!validateOrder(template, candidate, today).length) {
    order = candidate;
    break;
  }
}
assert.ok(order, 'At least one complete customer record is required for the acceptance check.');
const original = await JSZip.loadAsync(bytes);
for (const [count, correction] of [
  [1, undefined],
  [12, undefined],
  [13, undefined],
  [25, undefined],
  [1, '01234567890'],
  [13, '01234567890']
]) {
  const currentOrder = { ...order, cpfOverride: correction, lines: order.lines.slice(0, count) };
  const cpf = orderCpf(template, currentOrder);
  const replacesCpf = cpf.startsWith('0') || correction !== undefined;
  const output = await exportOrder(template, currentOrder, today);
  assert.equal(output.count, Math.ceil(count / 12));
  const archive = await JSZip.loadAsync(output.bytes);
  const books =
    output.count === 1
      ? [archive]
      : await Promise.all(
          Object.values(archive.files)
            .filter((entry) => !entry.dir)
            .map(async (entry) => JSZip.loadAsync(await entry.async('uint8array')))
        );
  const exportedNames = [];
  for (const book of books) {
    assert.deepEqual(Object.keys(book.files).sort(), Object.keys(original.files).sort());
    for (const name of Object.keys(original.files)) {
      if (original.files[name].dir || [template.model.path, 'xl/workbook.xml'].includes(name)) continue;
      assert.deepEqual(
        await book.file(name).async('uint8array'),
        await original.file(name).async('uint8array'),
        `Unchanged package part: ${name}`
      );
    }
    const modelXml = await book.file(template.model.path).async('string');
    const cells = sheetCells(parseXml(modelXml), []);
    for (const [address, cell] of template.model.cells) {
      if (cell.hasFormula && !(address === 'E9' && replacesCpf))
        assert.equal(
          cells.get(address).formula,
          address === 'J9' && cpf.startsWith('0') ? cpfValidationFormula(template.model.cells) : cell.formula,
          `Formula ${address}`
        );
      assert.equal(cells.get(address).node.getAttribute('s'), cell.node.getAttribute('s'), `Style ${address}`);
    }
    if (replacesCpf) {
      assert.equal(cells.get('E9').value, exportCpf(cpf));
      assert.equal(cells.get('E9').node.getAttribute('t'), 'inlineStr');
    }
    for (let row = 27; row <= 38; row++) if (cells.get(`C${row}`).value) exportedNames.push(cells.get(`C${row}`).value);
    assert.equal(
      (modelXml.match(/<mergeCells[\s\S]*?<\/mergeCells>/) ?? [])[0],
      (template.model.xml.match(/<mergeCells[\s\S]*?<\/mergeCells>/) ?? [])[0]
    );
    assert.equal((modelXml.match(/<extLst[\s\S]*?<\/extLst>/) ?? [])[0], (template.model.xml.match(/<extLst[\s\S]*?<\/extLst>/) ?? [])[0]);
  }
  assert.deepEqual(
    exportedNames,
    currentOrder.lines.map((line) => line.name)
  );
}
process.stdout.write(
  `PASS: ${template.products.length} dropdown products; weekly validity; 1/12/13/25 lines; corrected leading-zero CPF across split files; all other formulas, styles, merged cells, validations and ZIP parts preserved. Native Excel recalculation still requires Excel verification.\n`
);

import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { writerTemplate } from './helpers/writerTemplate.js';
import { importTemplate } from '../src/products/writer/services/templateService.js';
import { exportOrder } from '../src/products/writer/services/exportService.js';
import { parseXml, sheetCells } from '../src/products/writer/services/xmlWorkbook.js';
describe('weekly workbook import and export', () => {
  it('reads the actual dropdown and Excel prices', async () => {
    const template = await importTemplate(await writerTemplate(), '2026-09-30');
    expect(template.products).toHaveLength(25);
    expect(template.products[0].price).toBe(11);
    expect(template.clients[0].room).toBe('8ºD');
  });
  it('blocks missing formulas, future and expired internal dates regardless of filename', async () => {
    await expect(importTemplate(await writerTemplate({ missingFormula: true }), '2026-09-30')).rejects.toThrow('G38');
    await expect(importTemplate(await writerTemplate(), '2026-10-04')).rejects.toThrow('venceu');
    await expect(importTemplate(await writerTemplate(), '2026-09-27')).rejects.toThrow('ainda');
  });
  it('exports 25 lines to three complete workbooks preserving untouched package parts', async () => {
    const file = await writerTemplate();
    const template = await importTemplate(file, '2026-09-30');
    const order = {
      room: '8ºD',
      student: 'Aluno',
      client: 'Cliente',
      phone: '11999999999',
      method: 'Retira - Outras Lojas',
      store: 'Loja',
      date: '2026-10-02',
      payment: 'Pix',
      lines: template.products.map((product, index) => ({ name: product.name, quantity: index + 1 }))
    };
    const output = await exportOrder(template, order, '2026-09-30');
    expect(output.count).toBe(3);
    const original = await JSZip.loadAsync(await file.arrayBuffer());
    const archive = await JSZip.loadAsync(output.bytes);
    const entries = Object.values(archive.files).filter((item) => !item.dir);
    expect(entries).toHaveLength(3);
    const names = [];
    for (const entry of entries) {
      const book = await JSZip.loadAsync(await entry.async('uint8array'));
      const cells = sheetCells(parseXml(await book.file(template.model.path).async('string')), []);
      for (let row = 27; row <= 38; row++) if (cells.get(`C${row}`).value) names.push(cells.get(`C${row}`).value);
      for (const [address, cell] of template.model.cells) if (cell.hasFormula) expect(cells.get(address).formula).toBe(cell.formula);
      for (const path of Object.keys(original.files)) {
        if (original.files[path].dir || [template.model.path, 'xl/workbook.xml'].includes(path)) continue;
        expect(await book.file(path).async('string')).toBe(await original.file(path).async('string'));
      }
    }
    expect(names).toEqual(order.lines.map((line) => line.name));
    await expect(exportOrder(template, order, '2026-10-04')).rejects.toThrow('venceu');
  });
});

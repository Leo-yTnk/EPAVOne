import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { writerTemplate } from './helpers/writerTemplate.js';
import { importTemplate } from '../src/products/writer/services/templateService.js';
import { exportOrder } from '../src/products/writer/services/exportService.js';
import { cpfValidationFormula, parseXml, patchInputCells, sheetCells } from '../src/products/writer/services/xmlWorkbook.js';
import { exportCpf, validateCustomer, validCpf } from '../src/products/writer/models/order.js';
const order = {
  room: '8ºD',
  student: 'Aluno',
  client: 'Cliente',
  phone: '11999999999',
  method: 'Retira - Outras Lojas',
  store: 'Loja',
  date: '2026-10-02',
  payment: 'Pix',
  lines: [{ name: 'Produto 1', quantity: 1 }]
};
const today = '2026-09-30';
async function exportedCells(template, current) {
  const output = await exportOrder(template, current, today);
  const zip = await JSZip.loadAsync(output.bytes);
  return sheetCells(parseXml(await zip.file(template.model.path).async('string')), []);
}
describe('CPF correction and leading zero', () => {
  it('repeats the corrected CPF and compatible validator in every part of a split order', async () => {
    const template = await importTemplate(await writerTemplate(), today);
    const current = {
      ...order,
      cpfOverride: '01234567890',
      lines: template.products.slice(0, 13).map((product) => ({ name: product.name, quantity: 1 }))
    };
    const output = await exportOrder(template, current, today);
    const archive = await JSZip.loadAsync(output.bytes);
    expect(output.count).toBe(2);
    for (const part of Object.values(archive.files).filter((entry) => !entry.dir)) {
      const book = await JSZip.loadAsync(await part.async('uint8array'));
      const cells = sheetCells(parseXml(await book.file(template.model.path).async('string')), []);
      expect(cells.get('E9').value).toBe('*01234567890');
      expect(cells.get('J9').formula).toBe(cpfValidationFormula(template.model.cells));
    }
  });
  it('validates digits before adding the required asterisk', () => {
    expect(validCpf('01234567890')).toBe(true);
    expect(exportCpf('012.345.678-90')).toBe('*01234567890');
    expect(exportCpf('52998224725')).toBe('52998224725');
    expect(() => exportCpf('00000000000')).toThrow();
  });
  it('preserves the CPF formula when the original CPF is valid and unchanged', async () => {
    const template = await importTemplate(await writerTemplate(), today);
    const cells = await exportedCells(template, order);
    expect(cells.get('E9').formula).toBe(template.model.cells.get('E9').formula);
    expect(cells.get('J9').formula).toBe(template.model.cells.get('J9').formula);
  });
  it.each([undefined, '01234567890'])('writes leading-zero CPF as text and adapts only its validator, override=%s', async (cpfOverride) => {
    const template = await importTemplate(await writerTemplate({ cpf: cpfOverride === undefined ? '01234567890' : '52998224725' }), today);
    const cells = await exportedCells(template, { ...order, cpfOverride });
    expect(cells.get('E9').value).toBe('*01234567890');
    expect(cells.get('E9').hasFormula).toBe(false);
    expect(cells.get('E9').node.getAttribute('t')).toBe('inlineStr');
    expect(cells.get('J9').formula).toBe(cpfValidationFormula(template.model.cells));
    for (const [address, cell] of template.model.cells)
      if (cell.hasFormula && !['E9', 'J9'].includes(address)) expect(cells.get(address).formula).toBe(cell.formula);
  });
  it('allows a corrected CPF to replace a missing base value, but rejects invalid and cleared corrections', async () => {
    const template = await importTemplate(await writerTemplate({ cpf: '' }), today);
    expect(validateCustomer(template, { ...order, cpfOverride: '52998224725' }, today)).toEqual([]);
    const cells = await exportedCells(template, { ...order, cpfOverride: '52998224725' });
    expect(cells.get('E9').value).toBe('52998224725');
    await expect(exportOrder(template, { ...order, cpfOverride: '' }, today)).rejects.toThrow('CPF');
    await expect(exportOrder(template, { ...order, cpfOverride: '01234567800' }, today)).rejects.toThrow('CPF');
    expect(() => patchInputCells(template.model.xml, { H27: 1 }, template.model.cells, { replaceCpf: true })).toThrow('bloqueada');
  });
});

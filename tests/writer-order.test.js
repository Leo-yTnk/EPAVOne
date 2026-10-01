import { describe, expect, it } from 'vitest';
import {
  addDays,
  checkPeriod,
  parseBrazilDate,
  saoPauloDay,
  splitLines,
  validCpf,
  validPhone,
  validateOrder
} from '../src/products/writer/models/order.js';
import {
  parseXml,
  patchInputCells,
  readValidation,
  requestRecalculation,
  sheetCells
} from '../src/products/writer/services/xmlWorkbook.js';

describe('weekly order validity', () => {
  const period = { start: '2026-09-28', end: '2026-10-03' };
  it('uses São Paulo day at the UTC boundary', () => {
    expect(saoPauloDay(new Date('2026-10-04T01:30:00Z'))).toBe('2026-10-03');
    expect(saoPauloDay(new Date('2026-10-04T03:30:00Z'))).toBe('2026-10-04');
  });
  it('rejects expired and future periods, accepts both inclusive bounds', () => {
    expect(() => checkPeriod(period, '2026-09-27')).toThrow('ainda');
    expect(() => checkPeriod(period, '2026-10-04')).toThrow('venceu');
    expect(() => checkPeriod(period, period.start)).not.toThrow();
    expect(() => checkPeriod(period, period.end)).not.toThrow();
  });
  it('rejects impossible dates and preserves calendar dates', () => {
    expect(() => parseBrazilDate('31/02/2026')).toThrow();
    expect(parseBrazilDate('30/09/2026')).toBe('2026-09-30');
    expect(addDays('2026-09-30', 4)).toBe('2026-10-04');
  });
  it.each([
    [12, [12]],
    [13, [12, 1]],
    [24, [12, 12]],
    [25, [12, 12, 1]]
  ])('splits %i product lines without loss or duplication', (count, sizes) => {
    const lines = Array.from({ length: count }, (_, index) => ({ name: `Product ${index}`, quantity: index + 1 }));
    const parts = splitLines(lines);
    expect(parts.map((part) => part.length)).toEqual(sizes);
    expect(parts.flat()).toEqual(lines);
  });
  it('rejects repeated CPF digits and incorrect check digits', () => {
    expect(validCpf('52998224725')).toBe(true);
    expect(validCpf('52998224726')).toBe(false);
    expect(validCpf('11111111111')).toBe(false);
  });
  it('rejects nonexistent DDDs and accepts formatted phone numbers', () => {
    expect(validPhone('(11) 99999-9999')).toBe(true);
    expect(validPhone('20999999999')).toBe(false);
  });
});

describe('template-preserving XML edits', () => {
  const xml =
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="27"><c r="C27" s="8"/><c r="F27" s="9"/><c r="H27" s="10"><f>F27*2</f><v>0</v></c></row></sheetData><mergeCells><mergeCell ref="I27:J27"/></mergeCells><extLst><dataValidations xmlns="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><dataValidation type="list"><formula1><f xmlns="http://schemas.microsoft.com/office/excel/2006/main">BASES!$J$3:$J$1728</f></formula1><sqref xmlns="http://schemas.microsoft.com/office/excel/2006/main">C27:C38</sqref></dataValidation></dataValidations></extLst></worksheet>';
  it('finds extension-based dropdowns, including the last line', () => {
    expect(readValidation(parseXml(xml), 'C38').source).toBe('BASES!$J$3:$J$1728');
  });
  it('writes only input values, escaping product names, preserving the formula and merges byte for byte', () => {
    const output = patchInputCells(xml, { C27: 'A & B <C>', F27: 3 }, sheetCells(parseXml(xml), []));
    expect(output).toContain('<f>F27*2</f><v>0</v>');
    expect(output).toContain('<mergeCell ref="I27:J27"/>');
    expect(output).toContain('s="8"');
    expect(sheetCells(parseXml(output), []).get('C27').value).toBe('A & B <C>');
    expect(sheetCells(parseXml(output), []).get('F27').value).toBe(3);
  });
  it('refuses to replace calculated or missing cells', () => {
    const cells = sheetCells(parseXml(xml), []);
    expect(() => patchInputCells(xml, { H27: 99 }, cells)).toThrow('bloqueada');
    expect(() => patchInputCells(xml, { A1: 99 }, cells)).toThrow('bloqueada');
  });
  it('requests full Excel recalculation without changing the calculation version', () => {
    const output = requestRecalculation('<workbook><calcPr calcId="191028" calcMode="manual"/></workbook>');
    expect(output).toContain('calcId="191028"');
    expect(output).toContain('calcMode="auto"');
    expect(output).toContain('fullCalcOnLoad="1"');
    expect(output).not.toContain('manual');
  });
});

describe('complete order checks', () => {
  const template = {
    period: { start: '2026-09-28', end: '2026-10-03' },
    rooms: ['8ºD'],
    students: [{ name: 'Aluno', room: '8ºD', email: 'aluno@example.com' }],
    clients: [{ name: 'Cliente', room: '8ºD', email: 'cliente@example.com', cpf: '52998224725', birth: 30000 }],
    methods: ['Retira - Outras Lojas'],
    stores: [{ name: 'Loja', street: 'Rua', number: '1', neighborhood: 'Centro', zip: '01001000' }],
    market: 'Mercado',
    payments: ['Pix'],
    deliveryDays: { home: 4, pickup: 15 },
    products: [{ name: 'Produto', price: 10 }],
    kitOptions: ['sim']
  };
  const order = {
    room: '8ºD',
    student: 'Aluno',
    client: 'Cliente',
    phone: '11999999999',
    method: 'Retira - Outras Lojas',
    store: 'Loja',
    date: '2026-10-02',
    payment: 'Pix',
    lines: [{ name: 'Produto', quantity: 2 }]
  };
  it('accepts a complete order and blocks missing required information', () => {
    expect(validateOrder(template, order, '2026-09-30')).toEqual([]);
    expect(validateOrder(template, { ...order, payment: '', phone: '' }, '2026-09-30')).toHaveLength(2);
  });
  it('rejects invalid quantity, non-menu products, and expiration at download time', () => {
    expect(validateOrder(template, { ...order, lines: [{ name: 'Produto', quantity: 0 }] }, '2026-09-30').join(' ')).toContain(
      'Quantidade'
    );
    expect(validateOrder(template, { ...order, lines: [{ name: 'Outro', quantity: 1 }] }, '2026-09-30').join(' ')).toContain(
      'Produto sem preço'
    );
    expect(validateOrder(template, order, '2026-10-04').join(' ')).toContain('venceu');
  });
});

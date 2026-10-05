import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { parseCatalogWorkbook } from '../src/products/insights/creation/admin/importParser.js';
import { templateSheets } from '../src/products/insights/creation/admin/importTemplate.js';
import { readCatalogFile } from '../src/products/insights/creation/admin/workbookService.js';
const workbook = (Sheets = templateSheets) => ({ SheetNames: Object.keys(Sheets), Sheets });
describe('Yourcipe import compatibility', () => {
  it('accepts the original six-sheet example and translates relationship keys once', () => {
    const result = parseCatalogWorkbook(workbook());
    expect(result.errors).toEqual([]);
    expect(result.recipeSections[0]).toMatchObject({ page: 'home', recipe: 'Picanha na Brasa' });
    expect(result.productSections[0]).toMatchObject({ page: 'products', product: 'Picanha' });
    expect(result.recipes[0].ingredients[0]).toMatchObject({ product: 'Picanha', quantity: 1.5 });
  });
  it('reports missing sheets and rejects legacy positioning and invalid dependencies', () => {
    const Sheets = structuredClone(templateSheets);
    delete Sheets['Seções'];
    Sheets.Categorias.push({ tipo: 'secao_home', nome: 'Legado' });
    Sheets.Receitas[0].tags = 'destaque';
    Sheets.Receitas[0].ingredientes = 'Produto inexistente:0';
    const result = parseCatalogWorkbook(workbook(Sheets));
    expect(result.errors.some((x) => x.includes('Abas obrigatórias'))).toBe(true);
    expect(result.errors.some((x) => x.includes('formato legado'))).toBe(true);
    expect(result.errors.some((x) => x.includes('tags'))).toBe(true);
    expect(result.errors.some((x) => x.includes('produto inexistente'))).toBe(true);
    expect(result.errors.some((x) => x.includes('quantidade inválida'))).toBe(true);
  });
  it('rejects page-incompatible section links and duplicate links', () => {
    const Sheets = structuredClone(templateSheets);
    Sheets['Receitas por Seção'].push({ ...Sheets['Receitas por Seção'][0] });
    Sheets['Produtos por Seção'][0].pagina = 'home';
    const result = parseCatalogWorkbook(workbook(Sheets));
    expect(result.errors.some((x) => x.includes('vínculo duplicado'))).toBe(true);
    expect(result.errors.some((x) => x.includes('produtos não podem'))).toBe(true);
  });
  it('reads inline XLSX cells but rejects formulas rather than stale cached values', async () => {
    const zip = new JSZip();
    zip.file('xl/workbook.xml', '<workbook xmlns:r="x"><sheets><sheet name="Categorias" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>');
    const sheet = (formula) =>
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>tipo</t></is></c></row><row r="2"><c r="A2" t="inlineStr">${formula ? '<f>1+1</f>' : ''}<is><t>receita</t></is></c></row></sheetData></worksheet>`;
    zip.file('xl/worksheets/sheet1.xml', sheet(false));
    const file = async () => ({ name: 'catalog.xlsx', size: 1000, arrayBuffer: async () => zip.generateAsync({ type: 'arraybuffer' }) });
    expect((await readCatalogFile(await file())).Sheets.Categorias).toEqual([{ tipo: 'receita' }]);
    zip.file('xl/worksheets/sheet1.xml', sheet(true));
    await expect(readCatalogFile(await file())).rejects.toThrow('Remova fórmulas');
  });
});

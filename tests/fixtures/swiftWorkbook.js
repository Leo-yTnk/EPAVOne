// Synthetic workbook built exclusively from the existing public Swift bundle.
// Never publish the user's uploaded workbook as a CI fixture.
import JSZip from 'jszip';
import { swiftOfficialProducts } from '../../src/products/insights/creation/admin/swiftOfficialProducts.js';
import { templateSheets } from '../../src/products/insights/creation/admin/importTemplate.js';
export async function createSwiftWorkbookFixture() {
  const sheets = {
    Produtos: swiftOfficialProducts,
    Categorias: [...new Set(swiftOfficialProducts.map((row) => row.categoria))].map((nome) => ({ tipo: 'proteina', nome })),
    Receitas: [],
    Seções: [],
    'Receitas por Seção': [],
    'Produtos por Seção': []
  };
  const entries = Object.entries(sheets);
  const zip = new JSZip();
  const esc = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  zip.file(
    'xl/workbook.xml',
    `<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${entries.map(([name], i) => `<sheet name="${esc(name)}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<Relationships>${entries.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`
  );
  entries.forEach(([name, records], i) => {
    const headers = Object.keys(templateSheets[name][0]);
    const rows = [headers, ...records.map((row) => headers.map((key) => row[key]))];
    zip.file(
      `xl/worksheets/sheet${i + 1}.xml`,
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => `<c r="${String.fromCharCode(65 + c)}${r + 1}" t="inlineStr"><is><t>${esc(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`
    );
  });
  return zip.generateAsync({ type: 'uint8array' });
}

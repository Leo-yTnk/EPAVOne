import JSZip from 'jszip';
import { first, localNodes, parseXml, sheetCells } from '../../../../shared/services/spreadsheetXml.js';
import { templateSheets } from './importTemplate.js';
const normalizePath = (path) => {
  const parts = [];
  for (const part of path.split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/');
};
export async function readCatalogFile(file) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Use uma planilha com até 10 MB.');
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Escolha um arquivo .xlsx.');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  let expanded = 0;
  async function xml(path) {
    const entry = zip.file(path);
    if (!entry) throw new Error(`Parte obrigatória ausente: ${path}.`);
    const text = await entry.async('string');
    expanded += text.length;
    if (expanded > 30 * 1024 * 1024) throw new Error('Planilha excede o limite de leitura.');
    return parseXml(text);
  }
  const workbook = await xml('xl/workbook.xml');
  const relationships = localNodes(await xml('xl/_rels/workbook.xml.rels'), 'Relationship');
  const strings = zip.file('xl/sharedStrings.xml')
    ? localNodes(await xml('xl/sharedStrings.xml'), 'si').map((node) =>
        localNodes(node, 't')
          .map((x) => x.textContent)
          .join('')
      )
    : [];
  const Sheets = {};
  for (const sheet of localNodes(workbook, 'sheet')) {
    const relation = relationships.find((x) => x.getAttribute('Id') === sheet.getAttribute('r:id'));
    if (!relation || relation.getAttribute('TargetMode') === 'External') throw new Error('Referência de aba inválida.');
    const target = relation.getAttribute('Target');
    const path = normalizePath(target.startsWith('/') ? target : `xl/${target}`);
    const doc = await xml(path);
    const cells = sheetCells(doc, strings);
    const rows = [];
    let headers = [];
    for (const row of localNodes(doc, 'row')) {
      const values = {};
      for (const cell of localNodes(row, 'c')) {
        if (first(cell, 'f')) throw new Error('Remova fórmulas da planilha antes de importar.');
        const address = cell.getAttribute('r');
        const col = address?.match(/^[A-Z]+/)?.[0];
        if (col) values[col] = cells.get(address)?.value ?? '';
      }
      if (!headers.length) {
        headers = Object.entries(values).filter(([, value]) => String(value).trim());
        continue;
      }
      const record = Object.fromEntries(headers.map(([col, key]) => [String(key), values[col] ?? '']));
      if (Object.values(record).some((value) => value !== '')) rows.push(record);
      if (rows.length > 5000) throw new Error('A planilha excede 5.000 linhas por aba.');
    }
    Sheets[sheet.getAttribute('name')] = rows;
  }
  return { SheetNames: Object.keys(Sheets), Sheets };
}
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const column = (index) => {
  let result = '';
  for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  return result;
};
export async function downloadImportTemplate() {
  const zip = new JSZip();
  const entries = Object.entries(templateSheets);
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  zip.file(
    '[Content_Types].xml',
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${entries.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`
  );
  zip.file(
    '_rels/.rels',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
  );
  zip.file(
    'xl/workbook.xml',
    `<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${entries.map(([name], i) => `<sheet name="${escape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`
  );
  entries.forEach(([, records], i) => {
    const headers = Object.keys(records[0]);
    const rows = [headers, ...records.map((row) => headers.map((key) => row[key]))];
    zip.file(
      `xl/worksheets/sheet${i + 1}.xml`,
      `<worksheet xmlns="${ns}"><sheetData>${rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => `<c r="${column(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`
    );
  });
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-yourcipe.xlsx';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

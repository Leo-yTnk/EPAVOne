const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
export function localNodes(node, name) {
  const doc = node.ownerDocument ?? node;
  const walker = doc.createTreeWalker(node, 1);
  const result = [];
  for (let current = walker.nextNode(); current; current = walker.nextNode()) if (current.localName === name) result.push(current);
  return result;
}
export function first(node, name) {
  const walker = (node.ownerDocument ?? node).createTreeWalker(node, 1);
  for (let current = walker.nextNode(); current; current = walker.nextNode()) if (current.localName === name) return current;
  return undefined;
}

export function parseXml(text) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('XML com declaração externa não é permitido.');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (localNodes(doc, 'parsererror').length) throw new Error('O formulário contém XML inválido.');
  return doc;
}

export function sheetCells(doc, strings) {
  return new Map(
    localNodes(doc, 'c')
      .filter((cell) => cell.namespaceURI === NS)
      .map((cell) => {
        const raw = first(cell, 'v')?.textContent ?? '';
        const type = cell.getAttribute('t');
        const value =
          type === 's'
            ? strings[Number(raw)]
            : type === 'inlineStr'
              ? localNodes(cell, 't')
                  .map((item) => item.textContent)
                  .join('')
              : type === 'str'
                ? raw
                : raw === ''
                  ? ''
                  : Number(raw);
        return [
          cell.getAttribute('r'),
          { value, formula: first(cell, 'f')?.textContent, hasFormula: Boolean(first(cell, 'f')), node: cell }
        ];
      })
  );
}

export function readValidation(doc, address) {
  for (const node of localNodes(doc, 'dataValidation')) {
    const ranges = node.getAttribute('sqref') ?? first(node, 'sqref')?.textContent ?? '';
    if (ranges.split(/\s+/).some((range) => contains(range, address))) {
      return { type: node.getAttribute('type'), source: first(node, 'formula1')?.textContent, upper: first(node, 'formula2')?.textContent };
    }
  }
  throw new Error(`Menu ou validação obrigatório ausente: ${address}.`);
}

function coordinate(address) {
  const match = /^([A-Z]+)(\d+)$/.exec(address.replaceAll('$', ''));
  if (!match) throw new Error('Referência de célula não suportada.');
  return { column: [...match[1]].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0), row: Number(match[2]) };
}

function contains(range, address) {
  const [a, b = a] = range.split(':').map(coordinate);
  const cell = coordinate(address);
  return cell.column >= a.column && cell.column <= b.column && cell.row >= a.row && cell.row <= b.row;
}

export function listValues(source, sheets, names) {
  let reference = source?.replace(/^=/, '');
  if (names.has(reference)) reference = names.get(reference);
  if (/^".*"$/.test(reference ?? '')) return reference.slice(1, -1).split(',');
  const match = /^(?:'([^']+)'|([^!]+))!\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(reference ?? '');
  if (!match || match[3] !== match[5]) throw new Error('Fonte do menu suspenso não suportada.');
  const sheet = sheets.get(match[1] ?? match[2]);
  if (!sheet || Number(match[6]) - Number(match[4]) > 10000) throw new Error('Fonte do menu suspenso inválida.');
  const values = [];
  for (let row = Number(match[4]); row <= Number(match[6]); row++) {
    const value = sheet.cells.get(`${match[3]}${row}`)?.value;
    if (value !== '' && value !== undefined) values.push(String(value));
  }
  return [...new Set(values)];
}

export function patchInputCells(xml, updates, originalCells) {
  const escape = (value) =>
    String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  for (const [address, value] of Object.entries(updates)) {
    const original = originalCells.get(address);
    if (!original || original.hasFormula) throw new Error(`Gravação bloqueada em célula ausente ou calculada: ${address}.`);
    const pattern = new RegExp(`<c\\b(?=[^>]*\\br="${address}")([^>]*?)(?:\\s*/>|>([\\s\\S]*?)</c>)`);
    const match = xml.match(pattern);
    if (!match) throw new Error(`Formato de célula não suportado: ${address}.`);
    const attributes = match[1].replace(/\s+t="[^"]*"/g, '');
    const content =
      value === '' ? '' : typeof value === 'number' ? `<v>${value}</v>` : `<is><t xml:space="preserve">${escape(value)}</t></is>`;
    const cell = `<c${attributes}${typeof value === 'string' && value !== '' ? ' t="inlineStr"' : ''}>${content}</c>`;
    xml = xml.replace(pattern, cell);
  }
  return xml;
}

export function requestRecalculation(xml) {
  const attributes = ' calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1" calcOnSave="1"';
  if (/<calcPr\b/.test(xml))
    return xml.replace(
      /<calcPr\b([^>]*?)\s*\/>/,
      (_match, old) => `<calcPr${old.replace(/\s+(?:calcMode|fullCalcOnLoad|forceFullCalc|calcOnSave)="[^"]*"/g, '')}${attributes}/>`
    );
  return xml.replace('</workbook>', `<calcPr${attributes}/></workbook>`);
}

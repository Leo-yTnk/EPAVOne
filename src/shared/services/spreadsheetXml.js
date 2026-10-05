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

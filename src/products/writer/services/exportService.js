import JSZip from 'jszip';
import { splitLines, validateOrder, orderCpf, exportCpf } from '../models/order.js';
import { patchInputCells, requestRecalculation, parseXml, sheetCells, patchCpfValidation, cpfValidationFormula } from './xmlWorkbook.js';

export async function exportOrder(template, order, today) {
  const errors = validateOrder(template, order, today);
  if (errors.length) throw new Error(errors.join('\n'));
  const parts = splitLines(order.lines, template.capacity);
  const cpf = orderCpf(template, order);
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  const replaceCpf = cpf.startsWith('0') || (order.cpfOverride !== undefined && cpf !== String(client.cpf).replace(/\D/g, ''));
  const outputs = [];
  for (const [index, lines] of parts.entries()) {
    const updates = {
      E4: order.room,
      E5: order.student,
      E7: order.client,
      E11: order.method,
      E13: order.method === 'Entrega em casa' ? '' : order.store,
      E21: (Date.parse(`${order.date}T00:00:00Z`) - Date.UTC(1899, 11, 30)) / 86400000,
      E23: order.phone.replace(/\D/g, ''),
      E24: order.payment
    };
    if (replaceCpf) updates.E9 = exportCpf(cpf);
    for (let slot = 0; slot < template.capacity; slot++) {
      const row = slot + 27;
      updates[`C${row}`] = lines[slot]?.name ?? '';
      updates[`D${row}`] = lines[slot]?.kit ? 'sim' : '';
      updates[`F${row}`] = lines[slot]?.quantity ?? '';
    }
    let patched = patchInputCells(template.model.xml, updates, template.model.cells, { replaceCpf });
    if (cpf.startsWith('0')) patched = patchCpfValidation(patched, template.model.cells);
    const cells = sheetCells(parseXml(patched), []);
    for (const [address, cell] of template.model.cells) {
      const current = cells.get(address);
      const expectedFormula = address === 'J9' && cpf.startsWith('0') ? cpfValidationFormula(template.model.cells) : cell.formula;
      if (cell.hasFormula && !(replaceCpf && address === 'E9') && (!current?.hasFormula || current.formula !== expectedFormula))
        throw new Error(`A fórmula ${address} não foi preservada.`);
      if (current?.node.getAttribute('s') !== cell.node.getAttribute('s')) throw new Error(`A formatação ${address} não foi preservada.`);
    }
    const zip = await JSZip.loadAsync(template.bytes);
    zip.file(template.model.path, patched, { createFolders: false });
    zip.file('xl/workbook.xml', requestRecalculation(template.workbookXml), { createFolders: false });
    const safeClient = order.client
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/gi, '_')
      .slice(0, 60);
    outputs.push({
      filename: `EPAV_${template.period.start}_${safeClient}_${index + 1}-de-${parts.length}.xlsx`,
      bytes: await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    });
  }
  if (outputs.length === 1) return { filename: outputs[0].filename, bytes: outputs[0].bytes, count: 1 };
  const archive = new JSZip();
  for (const output of outputs) archive.file(output.filename, output.bytes);
  return {
    filename: `EPAV_${template.period.start}_${outputs.length}_pedidos.zip`,
    bytes: await archive.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }),
    count: outputs.length
  };
}

export function downloadExport(output) {
  const blob = new Blob([output.bytes], {
    type: output.count > 1 ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = output.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

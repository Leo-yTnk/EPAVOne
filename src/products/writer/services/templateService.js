import JSZip from 'jszip';
import { checkPeriod, parseBrazilDate } from '../models/order.js';
import { listValues, localNodes, parseXml, readValidation, sheetCells } from './xmlWorkbook.js';

const REQUIRED_SHEETS = ['MODELO', 'BASES', 'Base Cadastros', 'Base Produtos', 'BASE PREÇOS', 'BASE LOJAS', 'Base_Clientes', 'Envio'];
const value = (sheet, address) => sheet.cells.get(address)?.value ?? '';
const text = (sheet, address) => String(value(sheet, address));
const lastRow = (sheet) => Math.max(1, ...Array.from(sheet.cells.keys()).map((address) => Number(address.match(/\d+$/)[0])));

export async function importTemplate(file, today) {
  if (!/\.xlsx$/i.test(file.name) || file.size > 15 * 1024 * 1024) throw new Error('Carregue um arquivo .xlsx de até 15 MB.');
  const bytes = await file.arrayBuffer();
  let zip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new Error('O arquivo não é um Excel .xlsx válido ou está criptografado.');
  }
  if (Object.keys(zip.files).length > 5000 || zip.file('xl/vbaProject.bin')) throw new Error('Formato de arquivo não permitido.');
  let totalSize = 0;
  async function xml(path) {
    const entry = zip.file(path);
    if (!entry) throw new Error(`Parte obrigatória ausente no formulário: ${path}.`);
    const content = await entry.async('string');
    totalSize += content.length;
    if (content.length > 12 * 1024 * 1024 || totalSize > 64 * 1024 * 1024)
      throw new Error('O conteúdo do formulário excede o limite permitido.');
    return content;
  }
  const workbookXml = await xml('xl/workbook.xml');
  const workbook = parseXml(workbookXml);
  const relationships = parseXml(await xml('xl/_rels/workbook.xml.rels'));
  const targets = new Map(localNodes(relationships, 'Relationship').map((node) => [node.getAttribute('Id'), node.getAttribute('Target')]));
  const strings = zip.file('xl/sharedStrings.xml')
    ? localNodes(parseXml(await xml('xl/sharedStrings.xml')), 'si').map((node) =>
        localNodes(node, 't')
          .map((part) => part.textContent)
          .join('')
      )
    : [];
  const sheets = new Map();
  for (const node of localNodes(workbook, 'sheet')) {
    const name = node.getAttribute('name');
    if (!REQUIRED_SHEETS.includes(name)) continue;
    const target = targets.get(node.getAttribute('r:id'));
    if (!target || target.includes('..')) throw new Error('Caminho de aba inválido.');
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    const content = await xml(path);
    const doc = parseXml(content);
    sheets.set(name, { path, xml: content, doc, cells: sheetCells(doc, strings) });
  }
  if (REQUIRED_SHEETS.some((name) => !sheets.has(name))) throw new Error('Este arquivo não corresponde ao formulário EPAV suportado.');
  const model = sheets.get('MODELO');
  if (!text(model, 'C2').includes('FORMULÁRIO PADRÃO DE VENDA EPAV')) throw new Error('Cabeçalho de formulário EPAV ausente.');
  const dates = text(model, 'C3').match(/\d{2}\/\d{2}\/\d{4}/g);
  if (dates?.length !== 2) throw new Error('Não foi possível verificar o período dentro do formulário.');
  const period = { start: parseBrazilDate(dates[0]), end: parseBrazilDate(dates[1]), label: text(model, 'C3') };
  if (period.end < period.start || Date.parse(period.end) - Date.parse(period.start) > 7 * 86400000)
    throw new Error('Período semanal inválido.');
  checkPeriod(period, today);
  const names = new Map(localNodes(workbook, 'definedName').map((node) => [node.getAttribute('name'), node.textContent]));
  const menu = (address) => {
    const rule = readValidation(model.doc, address);
    if (rule.type !== 'list') throw new Error(`Menu suspenso ausente: ${address}.`);
    return listValues(rule.source, sheets, names);
  };
  const productNames = menu('C27');
  if (!productNames.length) throw new Error('O menu de produtos está vazio.');
  for (let row = 27; row <= 38; row++) {
    if (readValidation(model.doc, `C${row}`).source !== readValidation(model.doc, 'C27').source)
      throw new Error('Os menus de produtos não são consistentes.');
    for (const column of ['G', 'H', 'I'])
      if (!model.cells.get(`${column}${row}`)?.hasFormula) throw new Error(`Fórmula obrigatória ausente: ${column}${row}.`);
    for (const column of ['C', 'D', 'F'])
      if (!model.cells.has(`${column}${row}`) || model.cells.get(`${column}${row}`).hasFormula)
        throw new Error('As células de entrada foram alteradas.');
    const expectedWeight = `IFERROR(IF(VLOOKUP(C${row},Produtos[[#All],[NomeProduto]:[range max_2]],4,FALSE)="","Fixo",VLOOKUP(C${row},Produtos[[#All],[NomeProduto]:[range max_2]],4,FALSE)),"")`;
    const expectedPrice = `IFERROR(IF(G${row}="Fixo",VLOOKUP(C${row},BASES!J:L,3,FALSE),VLOOKUP(C${row},BASES!J:L,3,FALSE)*G${row}),0)`;
    if (model.cells.get(`G${row}`).formula !== expectedWeight || model.cells.get(`H${row}`).formula !== expectedPrice)
      throw new Error('As fórmulas de peso ou preço deste modelo não são suportadas.');
  }
  for (const address of ['E6', 'E8', 'E9', 'E10', 'E14', 'E16', 'E18', 'E19', 'E20', 'E22', 'J14', 'J15', 'J18', 'J19', 'I40', 'I3'])
    if (!model.cells.get(address)?.hasFormula) throw new Error(`Fórmula automática obrigatória ausente: ${address}.`);
  const bases = sheets.get('BASES');
  const upper = bases.cells.get('G11')?.formula ?? '';
  const match = /^IF\(MODELO!E11="Entrega em Casa",TODAY\(\)\+(\d+),TODAY\(\)\+(\d+)\)$/i.exec(upper);
  const dateRule = readValidation(model.doc, 'E21');
  if (!match || bases.cells.get('H11')?.formula !== 'TODAY()' || dateRule.source !== 'BASES!H11' || dateRule.upper !== 'BASES!G11')
    throw new Error('As regras de data deste modelo ainda não são suportadas.');
  // The client menu is dynamic; do not reuse its cached spill from another room.
  if (
    readValidation(model.doc, 'E7').source !== 'BASES!$X$3:$X$2000' ||
    !bases.cells.get('X4')?.formula?.includes('Resp_B_Cad[Turma:]=MODELO!E4')
  )
    throw new Error('O menu dinâmico de clientes não é compatível.');
  const prices = sheets.get('BASE PREÇOS');
  const priceByCode = new Map();
  for (let row = 2, end = lastRow(prices); row <= end; row++) {
    const code = text(prices, `A${row}`);
    if (code && !priceByCode.has(code)) priceByCode.set(code, value(prices, `B${row}`));
  }
  const source = sheets.get('Base Produtos');
  const productByName = new Map();
  for (let row = 2, end = lastRow(source); row <= end; row++) {
    const name = text(source, `C${row}`);
    if (!name || productByName.has(name)) continue;
    const code = text(source, `B${row}`);
    const weight = value(source, `F${row}`);
    productByName.set(name, { name, code, weight, unit: text(source, `D${row}`) });
  }
  // VLOOKUP on BASES!J:L takes the first exact name, which can have duplicate rows.
  const basePriceByName = new Map();
  for (let row = 3; row <= 1728; row++) {
    const name = text(bases, `J${row}`);
    if (name && !basePriceByName.has(name)) basePriceByName.set(name, priceByCode.get(text(bases, `K${row}`)));
  }
  const products = productNames.map((name) => {
    const product = productByName.get(name);
    const basePrice = basePriceByName.get(name);
    const weight = product?.weight;
    const price =
      typeof basePrice === 'number' && Number.isFinite(basePrice) && (weight === '' || (typeof weight === 'number' && weight > 0))
        ? basePrice * (weight === '' ? 1 : weight)
        : null;
    return { ...product, name, price, image: null };
  });
  const students = [];
  for (let row = 4; row <= 120; row++)
    if (text(bases, `B${row}`))
      students.push({ name: text(bases, `B${row}`), email: text(bases, `C${row}`), room: text(bases, `D${row}`) });
  const registered = sheets.get('Base Cadastros');
  const details = sheets.get('Base_Clientes');
  const firstDetails = new Map();
  for (let row = 2, end = lastRow(details); row <= end; row++) {
    const name = text(details, `E${row}`);
    if (name && !firstDetails.has(name))
      firstDetails.set(name, {
        cpf: text(details, `R${row}`).padStart(11, '0'),
        address: text(details, `S${row}`),
        phone: text(details, `T${row}`)
      });
  }
  const clients = [];
  const firstRegistered = new Map();
  for (let row = 2, end = lastRow(registered); row <= end; row++) {
    const name = text(registered, `C${row}`);
    if (!name) continue;
    if (!firstRegistered.has(name)) firstRegistered.set(name, { email: text(registered, `D${row}`), birth: value(registered, `E${row}`) });
    const room = text(registered, `A${row}`);
    if (!clients.some((item) => item.name === name && item.room === room))
      clients.push({ name, room, ...firstRegistered.get(name), ...firstDetails.get(name) });
  }
  const storeSource = sheets.get('BASE LOJAS');
  const stores = [];
  for (let row = 2; row <= 350; row++)
    if (text(storeSource, `A${row}`))
      stores.push({
        name: text(storeSource, `A${row}`),
        street: text(storeSource, `B${row}`),
        number: text(storeSource, `C${row}`),
        neighborhood: text(storeSource, `D${row}`),
        zip: text(storeSource, `E${row}`)
      });
  const warnings = [];
  if (Array.from(model.cells.values()).some((cell) => cell.formula?.includes('#REF!')))
    warnings.push(
      'O modelo original contém referência quebrada na validação do e-mail. O Writer confere o e-mail independentemente e preserva essa fórmula.'
    );
  if (Number(match[1]) === 4)
    warnings.push(
      'Na entrega em casa, o Excel limita a data até hoje + 4 dias, mas a mensagem orienta um prazo diferente. O Writer respeita os limites efetivos do arquivo.'
    );
  const template = {
    bytes,
    filename: file.name,
    workbookXml,
    model,
    sheets,
    period,
    products,
    students,
    clients,
    stores,
    market: listValues(names.get('Mercado'), sheets, names)[0],
    rooms: menu('E4'),
    methods: menu('E11'),
    payments: menu('E24'),
    kitOptions: menu('D27'),
    capacity: 12,
    deliveryDays: { home: Number(match[1]), pickup: Number(match[2]) },
    warnings
  };
  if (!template.market || !template.methods.length || !template.payments.length) throw new Error('Opções obrigatórias ausentes.');
  return template;
}

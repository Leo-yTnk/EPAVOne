import JSZip from 'jszip';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const cell = (address, value = '', formula) =>
  `<c r="${address}" s="0"${typeof value === 'string' && value && !formula ? ' t="inlineStr"' : ''}>${formula ? `<f>${escape(formula)}</f>` : ''}${typeof value === 'number' ? `<v>${value}</v>` : value && !formula ? `<is><t>${escape(value)}</t></is>` : ''}</c>`;
const sheet = (cells, validations = '') =>
  `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${cells}</row></sheetData>${validations}</worksheet>`;

export async function writerTemplate({ period = '28/09/2026 à 03/10/2026', missingFormula = false, cpf = '52998224725' } = {}) {
  const zip = new JSZip();
  const names = ['MODELO', 'BASES', 'Base Cadastros', 'Base Produtos', 'BASE PREÇOS', 'BASE LOJAS', 'Base_Clientes', 'Envio'];
  zip.file(
    'xl/workbook.xml',
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, index) => `<sheet name="${name}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets><definedNames><definedName name="Mercado">BASES!$O$3:$O$4</definedName></definedNames><calcPr calcId="1"/></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, index) => `<Relationship Id="rId${index + 1}" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}</Relationships>`
  );
  const inputs = ['E4', 'E5', 'E7', 'E11', 'E13', 'E21', 'E23', 'E24'].map((address) => cell(address)).join('');
  const automatic = ['E6', 'E8', 'E9', 'E10', 'E14', 'E16', 'E18', 'E19', 'E20', 'E22', 'J14', 'J15', 'J18', 'J19', 'I40', 'I3']
    .map((address) => cell(address, '', '1+1'))
    .join('');
  let lines = cell('J9', '', 'IF(E9="","Vazio",IF(LEN(E9)=11,"VÁLIDO","INVÁLIDO"))');
  for (let row = 27; row <= 38; row++) {
    lines += ['C', 'D', 'F'].map((column) => cell(`${column}${row}`)).join('');
    if (!missingFormula || row !== 38)
      lines += cell(
        `G${row}`,
        '',
        `IFERROR(IF(VLOOKUP(C${row},Produtos[[#All],[NomeProduto]:[range max_2]],4,FALSE)="","Fixo",VLOOKUP(C${row},Produtos[[#All],[NomeProduto]:[range max_2]],4,FALSE)),"")`
      );
    lines += cell(
      `H${row}`,
      '',
      `IFERROR(IF(G${row}="Fixo",VLOOKUP(C${row},BASES!J:L,3,FALSE),VLOOKUP(C${row},BASES!J:L,3,FALSE)*G${row}),0)`
    );
    lines += cell(`I${row}`, '', `F${row}*H${row}`);
  }
  const rules = [
    ['C27:C38', 'BASES!$J$3:$J$1728'],
    ['E4', 'BASES!$AB$2:$AB$7'],
    ['E7', 'BASES!$X$3:$X$2000'],
    ['E11', 'BASES!$N$21:$N$24'],
    ['E24', 'BASES!$N$3:$N$6'],
    ['D27:D38', 'BASES!$Z$2:$Z$3']
  ];
  const validations = `<dataValidations>${rules.map(([range, source]) => `<dataValidation type="list" sqref="${range}"><formula1>${source}</formula1></dataValidation>`).join('')}<dataValidation type="date" sqref="E21"><formula1>BASES!H11</formula1><formula2>BASES!G11</formula2></dataValidation></dataValidations>`;
  zip.file(
    'xl/worksheets/sheet1.xml',
    sheet(cell('C2', 'FORMULÁRIO PADRÃO DE VENDA EPAV') + cell('C3', period) + inputs + automatic + lines, validations)
  );
  let bases =
    cell('AB2', '8ºD') +
    cell('B4', 'Aluno') +
    cell('C4', 'aluno@example.com') +
    cell('D4', '8ºD') +
    cell('N3', 'Pix') +
    cell('N22', 'Retira - Outras Lojas') +
    cell('N23', 'Entrega em casa') +
    cell('O4', 'Mercado') +
    cell('Z2', 'sim') +
    cell('G11', '', 'IF(MODELO!E11="Entrega em Casa",TODAY()+4,TODAY()+15)') +
    cell('H11', '', 'TODAY()') +
    cell('X4', '', '_xlfn._xlws.FILTER(Resp_B_Cad[Digite o nome completo do cliente:],(Resp_B_Cad[Turma:]=MODELO!E4),"Não encontrado")');
  let products = '',
    prices = '';
  for (let index = 1; index <= 25; index++) {
    bases += cell(`J${index + 3}`, `Produto ${index}`) + cell(`K${index + 3}`, String(index));
    products +=
      cell(`B${index + 1}`, String(index)) +
      cell(`C${index + 1}`, `Produto ${index}`) +
      cell(`D${index + 1}`, 'PC') +
      cell(`F${index + 1}`);
    prices += cell(`A${index + 1}`, String(index)) + cell(`B${index + 1}`, 10 + index);
  }
  zip.file('xl/worksheets/sheet2.xml', sheet(bases));
  zip.file(
    'xl/worksheets/sheet3.xml',
    sheet(cell('A2', '8ºD') + cell('C2', 'Cliente') + cell('D2', 'cliente@example.com') + cell('E2', 30000))
  );
  zip.file('xl/worksheets/sheet4.xml', sheet(products));
  zip.file('xl/worksheets/sheet5.xml', sheet(prices));
  zip.file(
    'xl/worksheets/sheet6.xml',
    sheet(cell('A2', 'Loja') + cell('B2', 'Rua') + cell('C2', '1') + cell('D2', 'Centro') + cell('E2', '01001000'))
  );
  zip.file(
    'xl/worksheets/sheet7.xml',
    sheet(cell('E2', 'Cliente') + cell('R2', cpf) + cell('S2', 'Rua, 1, , Centro, 01001000') + cell('T2', '11999999999'))
  );
  zip.file('xl/worksheets/sheet8.xml', sheet(cell('A1', 'Envio preservado')));
  const bytes = await zip.generateAsync({ type: 'uint8array' });
  return { name: 'pedido.xlsx', size: bytes.length, arrayBuffer: async () => bytes };
}

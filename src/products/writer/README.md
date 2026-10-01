# EPAVWriter

O Writer exige o upload do formulário da semana em cada sessão. Nenhum formulário, cadastro de cliente ou carrinho é persistido no navegador ou enviado ao servidor. Apenas o código do produto é usado para consultar imagens públicas da Swift.

## Organização

- `models/order.js`: período em America/Sao_Paulo, dados obrigatórios, CPF, telefone, entrega e divisão em lotes de 12 linhas.
- `services/templateService.js`: leitura de OOXML, validações padrão e x14, período interno, menus e bases do formulário.
- `services/xmlWorkbook.js`: referências dos menus e alterações somente nas células de entrada.
- `services/exportService.js`: cópia integral do arquivo, preenchimento autorizado e ZIP quando necessário.
- `services/swiftImagesService.js`: imagens oficiais identificadas pelo código de referência exato. Sem imagem quando não houver resultado, quando o acesso de rede falhar ou quando a Swift bloquear CORS.
- `components/`: upload, catálogo, produto, dados e carrinho, usando os componentes do design system.

## Contrato do formulário

O modelo inicialmente suportado é o formulário padrão EPAV da semana 40 de 2026: aba `MODELO`, 12 linhas de produto em C27:C38, quantidade em F27:F38 e peso/preço/total calculados em G:I. As abas de bases precisam existir. O período é lido de C3. Datas vencidas e futuras bloqueiam o uso, inclusive no momento da exportação e após troca de dia.

O catálogo usa a fonte efetiva da validação de C27:C38. Os preços seguem os primeiros resultados das buscas do Excel, incluindo produtos por peso. Os clientes são filtrados pela sala, sem depender do cache de uma lista dinâmica calculada anteriormente para outra turma. Cadastros incompletos bloqueiam a exportação, sem substituir fórmulas por valores manuais.

Se o layout, as fórmulas de preço/peso ou a regra de datas mudarem, o importador bloqueia o arquivo com uma mensagem. Atualize o adaptador e os testes antes de aceitar um novo contrato. A validação estrutural não comprova autenticidade do remetente.

## Exportação

A única aba que recebe valores de entrada é `MODELO`: E4, E5, E7, E11, E13, E21, E23, E24 e C/D/F27:38. As fórmulas são preservadas integralmente. Preço, peso, total, e-mail, CPF, nascimento, endereço e frete não são substituídos. Quantidade é uma entrada do formulário original e precisa ser transferida do carrinho.

A parte `xl/workbook.xml` recebe somente as flags de recálculo completo ao abrir. As outras partes do ZIP permanecem idênticas em conteúdo. O aplicativo não executa o motor do Excel: os caches antigos são preservados, e o arquivo precisa ser aberto no Excel para recalcular. A conferência em Excel nativo permanece necessária antes do envio.

Acima de 12 produtos, o download é um ZIP com formulários completos separados. O número de pedido continua sendo gerado pela fórmula original e pode se repetir entre partes do mesmo cliente/data. Os nomes dos arquivos identificam a sequência; não altere a fórmula para inventar números novos.

O formulário fornecido tem uma referência `#REF!` na validação do e-mail e divergência entre a mensagem e a fórmula de prazo da entrega em casa. O Writer sinaliza essas condições, valida e-mail de forma independente e respeita os limites efetivos da data no Excel. A faixa de CEP de São Paulo e os DDDs seguem a validação desse modelo.

## Verificação

```sh
npm ci
npm run verify
node scripts/verify-writer-template.mjs /caminho/para/Pedido_EPAV_Pad_2026_sem40.xlsx 2026-09-30
```

O teste com um arquivo real é local e não salva nem publica seus dados. Os testes automáticos do repositório usam somente um formulário sintético com cadastros fictícios. Eles cobrem período, menus, busca, campos obrigatórios, integridade das fórmulas e exportação dividida. O script de aceitação cobre 1, 12, 13 e 25 produtos e compara todas as partes não alteradas do ZIP.

Referências técnicas: [Microsoft OOXML CalculationProperties](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.calculationproperties) e [JSZip](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html).

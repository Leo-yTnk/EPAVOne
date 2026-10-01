# EPAVWriter

O Writer exige o upload do formulário da semana em cada sessão. Nenhum formulário, cadastro de cliente ou carrinho é persistido no navegador ou enviado ao servidor. A seleção de produtos funciona localmente, sem consultas de imagens.

Após validar o arquivo, o atendimento segue quatro etapas: Cliente, Produtos, Entrega e pagamento, Conferência. Cada avanço exige os dados da etapa atual; voltar mantém os dados e o carrinho. A busca pelo nome fica dentro do seletor Cliente. A lista corresponde aos cadastros da turma escolhida no formulário semanal. O controle de arquivo usa um botão de escolha, exibe o nome aceito e permite selecionar novamente o mesmo arquivo.

Na etapa Produtos, a lista é montada somente ao abrir o popup “Adicionar produto”. Os nomes aparecem por extenso, com quebra de linha, sem reticências. A busca por nome sem acentos ou código preserva o texto ao reabrir o popup. A paginação substitui os resultados e mantém no máximo 24 linhas no DOM; uma nova busca volta à primeira página. Os nomes são normalizados uma única vez por catálogo, e quantidades e preços são consultados por mapas. A seleção e o carrinho não solicitam imagens da Swift. O carrinho usa linhas com quantidade, kit e remoção; selecionar novamente o mesmo produto aumenta sua quantidade. O resumo fica ao lado em telas largas e abaixo no celular.

## Organização

- `models/order.js`: período em America/Sao_Paulo, dados obrigatórios, CPF, telefone, entrega e divisão em lotes de 12 linhas.
- `services/templateService.js`: leitura de OOXML, validações padrão e x14, período interno, menus e bases do formulário.
- `services/xmlWorkbook.js`: referências dos menus e alterações somente nas células de entrada.
- `services/exportService.js`: cópia integral do arquivo, preenchimento autorizado e ZIP quando necessário.
- `services/swiftImagesService.js`: adaptador de imagens reservado para uso futuro, sem chamadas pela interface de pedidos.
- `components/`: upload, catálogo, produto, dados e carrinho, usando os componentes do design system.

## Contrato do formulário

O modelo inicialmente suportado é o formulário padrão EPAV da semana 40 de 2026: aba `MODELO`, 12 linhas de produto em C27:C38, quantidade em F27:F38 e peso/preço/total calculados em G:I. As abas de bases precisam existir. O período é lido de C3. Datas vencidas e futuras bloqueiam o uso, inclusive no momento da exportação e após troca de dia.

O catálogo usa a fonte efetiva da validação de C27:C38. Os preços seguem os primeiros resultados das buscas do Excel, incluindo produtos por peso. Os clientes são filtrados pela sala, sem depender do cache de uma lista dinâmica calculada anteriormente para outra turma. Cadastros incompletos bloqueiam a exportação. O CPF é a exceção autorizada: pode ser corrigido na primeira etapa, sem modificar a base original.

Se o layout, as fórmulas de preço/peso ou a regra de datas mudarem, o importador bloqueia o arquivo com uma mensagem. Atualize o adaptador e os testes antes de aceitar um novo contrato. A validação estrutural não comprova autenticidade do remetente.

## Exportação

A única aba que recebe valores de entrada é `MODELO`: E4, E5, E7, E11, E13, E21, E23, E24 e C/D/F27:38. Preço, peso, total, e-mail, nascimento, endereço e frete mantêm suas fórmulas. Quantidade é uma entrada do formulário original e precisa ser transferida do carrinho.

O CPF em E9 mantém sua fórmula quando o cadastro é válido, não foi corrigido e não começa com zero. Quando houver uma correção diferente do cadastro ou um zero inicial, E9 recebe texto com os 11 dígitos validados. CPFs começando com zero recebem `*` no início, conforme solicitado (exemplo fictício: `*01234567890`). Nesses casos, a fórmula de validação em J9 passa a remover o asterisco antes de executar sua lógica original; essa é a única adaptação em uma fórmula auxiliar. O código de exportação limita expressamente a exceção de substituição a E9 e verifica a fórmula esperada de J9. As demais células calculadas permanecem protegidas contra substituição.

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

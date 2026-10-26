# Pedidos e vendas do Planner

## Ativação

Aplicar somente `supabase/046_epavone_sale_details.sql`, depois da migration 041 já usada pelo Planner. Não reaplicar as migrations históricas. A implementação foi validada em PostgreSQL local com PGlite; a migration não foi executada no projeto de produção por esta sessão.

A tabela `sales` existente continua como fonte de valor, data e IPC. Um registro JSON limitado a 64 KB na tabela `epav_sale_details` guarda as informações do pedido. Não armazenamos Excel, imagens, XML ou binários. O índice por proprietário/data atende às consultas por período; as leituras são paginadas em lotes de 200.

RLS e permissões permitem ler somente os próprios registros. As RPCs `save_epav_sale` e `delete_epav_sale` autenticam o usuário, verificam propriedade e revisão e atualizam/removem a venda e seus detalhes na mesma transação. UUID estável, trava por venda e idempotência evitam duplicar um pedido ao repetir uma solicitação cuja resposta se perdeu. Edições concorrentes conflitantes são rejeitadas. Nenhum valor ou identidade de cliente fornecido pelo frontend substitui a verificação de propriedade do banco.

## Uso

1. No Writer, Kit só fica disponível com 2 ou mais unidades. Reduzir a quantidade a 1 desmarca o Kit. A validação de exportação também aplica a regra.
2. Depois de escolher o aluno, o diálogo permite salvar nome e sala como padrão neste navegador. O padrão só é restaurado quando o aluno e a sala ainda existem no Excel. Há uma opção para limpar o padrão.
3. Baixar o Excel não registra venda. Depois do download, a opção **Registrar como venda no Planner** prepara uma conferência explícita na aba **Pedidos**.
4. A conferência mantém cliente, aluno/sala, contato, cadastro, entrega/retirada, loja, pagamento, produtos/códigos, unidade/peso, quantidades, Kit, preços e referência do arquivo. A data da venda é independente da data de entrega. O frete começa em zero para ser informado; não inferimos o valor a partir da fórmula do Excel.
5. **Confirmar e salvar venda** grava na conta. O mesmo pedido mantém seu UUID em downloads repetidos e abre a edição quando já está cadastrado. **Novo pedido** inicia outra identidade e limpa o cliente/carrinho, mantendo o aluno e a sala.
6. **Cadastrar venda** permite entrada manual sem Excel. Cliente, data de venda, nome de cada produto, quantidade e preço unitário são obrigatórios. Produtos repetidos devem ser reunidos em uma linha. Pagamento, referência/CPF, frete, entrega e observações podem ser informados.
7. Editar permite alterar a data e os dados do registro; excluir exige confirmação e recalcula os indicadores. Excluir o registro não cancela um pedido que já foi enviado ao suporte.

Os detalhes pessoais permanecem em dados privados por conta, não em URLs ou no repositório. Os testes usam exclusivamente dados fictícios. As compras novas iniciadas no atendimento são encaminhadas para a conferência de produtos na aba Pedidos, evitando uma venda resumida adicional pelo fluxo antigo.

## Indicadores no período selecionado

| Indicador         | Cálculo                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| Vendas            | Número de registros de venda                                                          |
| Faturamento bruto | Soma dos totais das vendas, incluindo frete informado                                 |
| TM                | Faturamento bruto ÷ número de vendas                                                  |
| IPC               | Média de produtos distintos por venda detalhada; quantidade de unidades é outro campo |
| Positivação       | Quantidade de clientes diferentes identificados, sem percentual                       |

A identificação do cliente usa CPF normalizado quando tem 11 dígitos, referência informada ou, na ausência, nome completo normalizado. Um nome sem referência é associado a uma referência conhecida somente quando o nome completo normalizado aponta para uma única identidade no período. Se houver homônimos com referências diferentes, as vendas sem referência são indicadas para conferência e não inventam um comprador adicional. É necessário usar uma referência consistente para o mesmo cliente; homônimos devem receber referências diferentes. Vendas antigas sem cliente ou produtos identificados entram no faturamento e TM, mas não têm seus clientes ou IPC inventados. O painel informa quantos desses registros existem. É possível completar um registro antigo pela edição.

Os gráficos apresentam faturamento e quantidade de vendas por mês dentro do filtro de datas. Não há dados demonstrativos misturados às vendas da conta. Sem autenticação, o usuário é orientado a entrar, e nenhuma venda é gravada.

## Correção da costura e validação

O resumo da etapa de conferência e a versão móvel voltam a usar `position: relative`, mantendo a costura absoluta referenciada ao próprio Card. O layout permanece baseado nos componentes e tokens existentes.

Os testes cobrem Kit, preferências confirmadas/canceladas, snapshot completo após exportação, identidade estável, cadastro/edição/exclusão, datas, contas diferentes, repetição de solicitação, concorrência, totais e definições de TM/IPC/positivação. A revisão visual em navegador e uma sessão autenticada real continuam não validadas neste ambiente. O recálculo nativo e o envio do pedido permanecem no processo habitual do Excel e suporte.

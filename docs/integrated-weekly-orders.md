# Pedido semanal integrado

## Fluxo

1. No Writer, carregar o formulário Excel original vigente. Ele continua sendo a fonte de clientes, apresentações e preços permitidos no pedido.
2. No Planner, preparar o atendimento respeitando preferências e restrições. As sugestões mostram quantas opções com preço válido foram encontradas no Excel carregado; esta busca é uma sugestão comercial, não uma garantia de estoque ou de adequação alimentar.
3. Consultar os produtos e receitas no Insights. Nos detalhes de um produto (inclusive acessados por uma receita), usar **Conferir no Writer**.
4. Confirmar a apresentação e o preço do Excel antes de adicionar uma unidade ao carrinho. Quantidades e demais produtos existentes são preservados.
5. Associar explicitamente o cliente do Planner ao cadastro do Excel, conferindo a sala. Nomes iguais, após normalizar acentos e espaços, são sugeridos; nomes parciais nunca são confirmados automaticamente. Homônimos em salas diferentes permanecem como cadastros distintos.
6. Conferir cliente, entrega e produtos, validar e baixar o Excel. Abrir no Excel para recalcular as fórmulas e enviar ao suporte pelo processo habitual.
7. Voltar ao atendimento do Planner. **Usar valores do pedido conferido** preenche valor e unidades; a compra só é registrada ao confirmar o resultado. O valor é o subtotal de produtos, sem frete, conforme o resumo do Writer.

## Correspondências e atualizações

- Produto: prioriza o código Swift, normalizando zeros à esquerda. Sem correspondência por código, usa nome completo normalizado apenas quando não houver conflito de códigos explícitos.
- Mesmo código com várias apresentações exige seleção. Peso, quantidade de pacotes, cortes ou características explicitamente conflitantes bloqueiam a correspondência, inclusive com código igual. Preço ausente/inválido e formulário fora da validade bloqueiam a adição.
- Sem identificação exata, o produto pode aparecer como sugestão após normalização de ordem das palavras, pontuação, abreviações limitadas (cong./temp./pct), marca Swift e unidades equivalentes (kg/g, L/ml). Sugestões exigem seleção explícita, mesmo com um único resultado. Pesos ausentes geram opções para conferência; códigos explícitos diferentes não são ignorados.
- Clientes também recebem sugestões por partículas de sobrenome, iniciais intermediárias e até uma pequena variação de escrita em palavra de pelo menos cinco letras. A ordem dos nomes é preservada, e cada palavra do cadastro só pode corresponder uma vez. Nomes insuficientes ou incompatíveis não são sugeridos. Nenhuma sugestão aproximada é pré-selecionada; os resultados priorizam menor variação e continuam mostrando a sala.
- Esses critérios identificam candidatos, não comprovam identidade, estoque ou composição alimentar. A interface informa o motivo da correspondência.
- Trocar o Excel reinicia o pedido, como informado no seletor existente; cancelar ou falhar a importação preserva o arquivo anterior. A sugestão do Insights pode ser conferida no novo arquivo.
- Alterar qualquer campo ou quantidade após exportar invalida o resumo exportado. Gerar novamente para disponibilizar valores atualizados no Planner.
- Trocar o cliente ou a semana cria outro vínculo. Voltar ao Insights para o mesmo atendimento preserva o vínculo.

## Limites e dados

Os contratos em `src/shared/services` são de sessão e não fazem importações entre apps. O compartilhamento do Excel começa após abrir/restaurar o Writer nesta sessão. Outros apps recebem somente nome do arquivo, período e catálogo de produtos; CPF, endereço, planilhas internas e bytes continuam no Writer. Sugestões e vínculos não são gravados em URLs nem persistidos como novos clientes.

Não há envio automático ao suporte, confirmação automática de venda nem nova migration. As compras confirmadas continuam pelo serviço e sincronização Supabase já existentes no Planner (migration 041). Exportação e atendimento são etapas distintas para não duplicar vendas ou considerar download como envio.

## Validação

`npm run verify`: lint, arquitetura, tokens, testes e build. Os testes adicionais cobrem códigos conflitantes, múltiplas apresentações, homônimos, espaços/acentos, formulário vencido, confirmação antes da inclusão, subtotal do Excel, invalidação após edição e preenchimento dos valores no Planner sem registrar venda automaticamente.

## Exemplos simulados, verificados por testes

| Origem                             | Cadastro / Excel                    | Resultado                                                 |
| ---------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| Código 00123                       | Código 123                          | Mesmo código, desde que não haja conflito de apresentação |
| Filé de peito de frango Swift 1 kg | Frango — filé de peito 1000 g       | Sugestão; selecionar e confirmar                          |
| Filé de frango cong. 1,5 kg        | Filé de frango congelado 1500g      | Sugestão; selecionar e confirmar                          |
| Sobrecoxa desossada 1 kg           | Sobrecoxa sem osso 1000g            | Sugestão; selecionar e confirmar                          |
| Filé de frango 1kg                 | Filé de frango 2kg ou 2x500g        | Bloqueado, inclusive com código igual                     |
| João P. Silva                      | João Pedro Silva / João Paulo Silva | Ambas as opções; confirmar identidade e sala              |
| Leonadro Tanaka                    | Leonardo Tanaka                     | Sugestão por transposição; confirmar                      |
| João Silva                         | José Silva                          | Não sugerido                                              |

Os exemplos não foram extraídos de um formulário real do usuário. São casos de teste reproduzíveis em `tests/order-matching.test.js` e `tests/order-integration.test.jsx`.

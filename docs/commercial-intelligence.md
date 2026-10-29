# Inteligência comercial V1

Camada determinística, local e explicável. Sem LLM, embeddings, serviços pagos, credencial nova ou migration. Não registra venda, altera fila, adiciona produto ou exporta pedido automaticamente.

## Auditoria e lacunas

Base examinada: main `7e48824d2066bb576ebc3ae5e75dc0b340ae7830`, AGENTS, arquitetura, DS, catálogo de componentes, README, documentação/implementação de Planner, Insights e Writer, PRs recentes #83–#85 e integração comercial existente.

| Fonte real | Persistência / acesso | Utilização e limite |
| --- | --- | --- |
| Carteira, preferências, restrições, intenção, frequência desejada, interações, combinados, semanas | Workspace autenticado Supabase, via serviço/repository existente; visitante usa demonstração explicitamente rotulada | Prioridade e ações; notas livres não viram preferência/restrição automaticamente |
| Catálogo, categorias e receitas publicadas | Leitura anônima pública e paginada, cache compartilhado do Insights | Produtos e receitas reais; não é inventário de estoque |
| Ingredientes das receitas publicadas | Consulta pública em lotes, com join limitado a receitas `scope=site/status=published` | Uma leitura paginada para todos os vínculos, sem consulta por cliente ou receita |
| Produtos do Excel vigente | Projeção em memória no contrato `weeklyOrder`; arquivo original permanece no fluxo atual do Writer | Nome/apresentação e código exatos, preço válido e período vigente são evidência de presença no formulário; estoque continua a confirmar |
| Pedido exportado associado ao atendimento | `commercialContext.summary.saleDraft`, contrato efêmero existente | Revisão no Writer e complementos por receita; rascunho ainda não exportado não é examinado |
| Vendas confirmadas e detalhes | `sales` + `epav_sale_details`, autenticação/RLS e serviço existente de Pedidos | Reutiliza `salesMetrics` para TM, IPC distinto, faturamento e positivação; não associa vendas à carteira por semelhança de nome |
| Meta semanal de contatos | Campo `week.goal` existente | Compara contatos distintos e pendências da fila; valor inicial herdado do Planner não é apresentado como nova meta de vendas |

Já existiam: prioridade por soma fixa, referências genéricas de busca, preferências/restrições, contagem de contatos, fila manual, retornos e contratos entre apps. A prioridade anterior dava pontos por ausência de histórico e ignorava combinados na nota; dependia de referências genéricas para aderência. Foi substituída por uma política única reutilizável, com adapter de compatibilidade para `priority` e ordenação em lote. A fila manual é preservada.

Não existem fontes confiáveis para margem, estoque regional, descontos personalizados, interesse em SKU específico ou metas configuráveis de TM/IPC/vendas/faturamento/positivação. Nenhuma dessas informações foi inventada. O histórico agregado carregado pelo workspace não identifica comprador: não é usado para deduzir frequência de compras individuais. Compras antigas em interações são evidência de relacionamento, não substituem o livro de vendas.

## Arquitetura

- `shared/intelligence/priority.js`: validação de datas, índice de relacionamento, pontuação, ordenação e próxima ação por cliente. Funções puras com data e semana explícitas.
- `shared/intelligence/catalog.js`: taxonomia comercial conservadora, índice de catálogo/receitas, correspondências por perfil e complementos por receita real. DTOs de sugestão públicos são calculados uma vez, compartilhados entre perfis e não copiados por cliente.
- `shared/intelligence/goals.js`: interpreta meta real de contatos e métricas de vendas calculadas pelo serviço existente.
- `shared/repositories/catalogRepository.js` e `shared/services/commercialCatalog.js`: promovem o repository público existente para uma fronteira comum. Imports antigos permanecem como reexports. Insights e Planner compartilham a mesma identidade de loader e cache.
- `planner/hooks/useIntelligence.js`: orquestra dados autorizados e cache de domínio, sem acesso direto à rede na UI. Recalcula apenas em mudança de dados, contexto ou dia. Matching em fatias de aproximadamente 6 ms devolve controle ao navegador; análises substituídas são canceladas e não publicam resultados tardios.
- Componentes do Planner consomem contexto de feature. `CatalogSuggestions` ocupa a área de oportunidades existente. O Insights recebe uma rota para abrir o diálogo de receita já existente.

Não há cache global de clientes, notas, vendas ou recomendações pessoais. O cache público existente mantém TTL de 60 s, compartilha chamadas simultâneas e respeita sua invalidação após edição/sync. O hook revalida em primeiro plano a cada minuto ou ao retornar à janela e oferece retry em falha. Até uma revalidação, vale a última leitura pública conhecida; não é garantia de atualização instantânea. Falha de atualização retira correspondências de catálogo da pontuação e das sugestões; contatos continuam disponíveis. O estado de matching identifica exatamente o par carteira/índice e não expõe resultados de uma análise anterior enquanto uma nova está pendente.

O Planner remonta o workspace por ID de conta, elimina imediatamente a carteira anterior e ignora respostas tardias. O repository existente verifica identidade e propriedade; não houve relaxamento de RLS. Conteúdo pessoal do Insights não é consultado pelo motor público. Não há logs de dados pessoais ou envio a terceiros. Quantidade de usuários não multiplica processamento no servidor: o motor roda no navegador de cada usuário e usa as leituras públicas/privadas já autorizadas.

## Política de pontuação

Pontuação é uma ordem comercial sugerida, não probabilidade de compra ou confiança. Aparece apenas com ao menos um contato efetivo datado válido até hoje, um retorno vencido ou intenção explicitamente cadastrada. Perfil novo com preferências pode receber ideias, mas permanece **sem pontuação**.

| Fator | Pontos | Normalização / fonte |
| --- | ---: | --- |
| Retorno combinado até hoje | 30 | Um ou mais; não cresce pela quantidade de pendências |
| Recência / frequência desejada | 0–25 | `round(25 × min(1, dias desde contato / frequência desejada))`; sem contato/frequência válida = zero |
| Intenção declarada | 20 | Booleano explícito do perfil |
| Incluído na semana selecionada | 10 | Entrada ainda sem resultado; não muda a ordem da fila |
| Compra em atendimento | 5 | Uma ou muitas recebem o mesmo peso; valor gasto não interfere |
| Produto real compatível | 10 | Preferência reconhecida e nenhuma restrição comercial conflitante |
| Recusa há menos de 7 dias | −30 | Respeita espaço; não propõe novo contato proativo, salvo retorno explicitamente combinado |
| Atendimento concluído na semana selecionada | −40 | Evita repetir atendimento já registrado |

Soma limitada a 0–100. Empates: nome em colação pt-BR, depois ID; datas/IDs resolvem empates de histórico. Notas nulas ficam depois das notas válidas. Dados futuros/inválidos, tentativas indisponíveis e referências órfãs não geram sinais. Frequência **desejada** é um critério de acompanhamento, não estimativa de recorrência real.

Combinado até hoje abre Combinados; cliente da fila abre Preparar; candidato fora da semana abre perfil para inclusão explícita; recusa recente ou pedido para falar depois com retorno futuro orienta respeitar o prazo. Semana selecionada afeta planejamento; a data comercial usa America/Sao_Paulo. Selecionar outra semana não muda a data de hoje.

Ajustar pesos em `PRIORITY_WEIGHTS`, mantendo total positivo de 100, e atualizar tabela, texto de ajuda e testes. A escala de recência fica limitada ao peso; penalidades são política explícita. Não trocar critérios por otimizações de UI: todos os modos de desempenho executam as mesmas regras.

## Produtos, receitas e complementos

Aliases de categorias ficam em `commercialCategory`. Aceita somente nomes explícitos conhecidos (aves/frango, bovinos/carne bovina, suínos/carne suína, pescados/peixes, padaria/pães, sobremesas/doces, complementos/acompanhamentos/vegetais e feijão). Categoria desconhecida não é adivinhada pelo nome do produto ou observações do cliente. Para ampliar cobertura, incluir aliases reais e testes de colisão.

Produto requer preferência cadastrada e categoria reconhecida não restrita. Produtos conhecidos como inativos, pessoais ou indisponíveis são excluídos. DTO público atual não fornece estoque regional: a interface diz **disponibilidade desconhecida**, ou **consta no Excel vigente com preço válido; estoque a confirmar**. Não mostra preço ou promoção nas recomendações, evitando reutilizar preço desatualizado.

Receita requer ao menos um ingrediente alinhado à preferência, todos os produtos vinculados presentes/ativos e com categorias reconhecidas, e nenhuma categoria restrita. Com restrições, receitas com extras externos não classificados são omitidas. Ingredientes ausentes/inclassificáveis bloqueiam a receita inteira. Isso avalia categorias comerciais; não valida alergias, contaminação cruzada ou composição alimentar. Restrições não estruturadas nas observações não são interpretadas.

Complemento só aparece quando uma receita elegível contém um produto identificado no pedido exportado deste cliente/semana e outro ingrediente ainda ausente. Correspondência conservadora por nome exato normalizado e código consistente; produtos ambíguos não são adicionados. A ação abre consulta, preservando a confirmação no Writer. Não otimiza quantidade de itens artificialmente. Carrinho não exportado e compras sem vínculo estável permanecem fora desta análise V1.

## UX e estados

Início: próximo passo existente ganha precedência para retorno vencido; recomendações discretas explicam até três prioridades. Semana: mesmas prioridades sem mover titulares/reservas; seletor de clientes usa a mesma ordenação. Clientes: nota expansível e motivo; perfil mantém fatores junto ao próximo passo e produtos/receitas na área Oportunidades. Resultados: explica a lacuna da meta de contatos; Pedidos interpreta métricas reais e aponta detalhes/identidades ausentes.

Sem histórico: conhecer perfil, sem nota. Sem preferências: nenhuma sugestão de produto. Catálogo incompleto: omite só o que não consegue verificar. Catálogo indisponível: contatos e combinados continuam; retry. Sem autenticação: demonstração explicitamente rotulada, sem venda real. Falha de histórico remoto mantém os avisos existentes de sincronização parcial. Sem vendas: TM/IPC sem medição. Conversão usa somente compradores/contatados distintos nos atendimentos da mesma semana; não divide vendas independentes por contatos incompatíveis. Metas de TM/IPC não existem, portanto não se inventam desvios, projeções ou causalidade.

## Validação e reprodução

`npm run verify` verifica lint, arquitetura, tokens, testes e build. `tests/commercial-intelligence*` cobre determinismo, pesos, recência, empate, incompletude, datas, restrições, ingredientes/indisponibilidade, cancelamento, perfis compartilhados, contexto, troca de conta, falhas de catálogo, exportação associada e rotas de receita. Testes existentes continuam cobrindo Supabase/RLS, registro de venda e exportação de Excel.

- `node scripts/benchmark-commercial-intelligence.mjs`: benchmark sintético Node.
- `REVIEW_BROWSER=/caminho/chromium node scripts/benchmark-commercial-browser.mjs`: 200 perfis distintos, 1.002 produtos, 100 receitas, 4.000 interações, CPU 6× e teto V8 de 512 MB; arquivo bruto no diretório de revisão.
- `REVIEW_BROWSER=/caminho/chromium node scripts/review-commercial-intelligence.mjs`: revisão Chromium, fixtures sintéticos, só leituras interceptadas; desktop/mobile/tablet, claro/escuro, três modos, movimento reduzido, teclado/links, abertura e fechamento do diálogo real, overflow e screenshots.

CPU 6× e teto V8 não reproduzem CPU, GPU, memória do Android ou RAM física do Galaxy Tab A7 Lite. Não houve teste físico no dispositivo, sessão autenticada real ou chamada de estoque Swift nesta implementação.

## Extensões possíveis

Vínculo estável entre venda e cliente da carteira; perfil de interesses por produto com consentimento; metas comerciais explícitas por período; estoque com fonte regional verificável; classificação editorial dos ingredientes externos; execução em Worker se o volume real justificar. Nenhuma dessas extensões é requisito de implantação desta V1.

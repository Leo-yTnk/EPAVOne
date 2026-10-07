# EPAVPlanner — primeira versão

## Propósito e limites

Centro de planejamento comercial: decidir quem atender e como abordar, consultar ideias no Insights e preparar o pedido no Writer. A v1 fecha o ciclo **Clientes → Semana → Preparar → Atender → Insights/Writer → Resultado**. Não contém previsão estatística nem IA generativa.

Modo demonstração é explícito em todas as páginas. Os 12 perfis, histórico e referências comerciais são exemplos, não uma importação da carteira pessoal. Alterações ficam no navegador, separadas da conta e do banco remoto. Não há escrita em produção.

## Áreas e rotas

| Área | Rota | Decisões e ações |
|---|---|---|
| Visão geral | `#/planner` | Meta, próximos clientes, contatos atrasados, oportunidades fora da fila, iniciar atendimento |
| Semana | `#/planner/semana` | Meta 1–100, titulares/reservas, subir/descer com teclado, retirar não atendidos, cobertura planejada |
| Clientes | `#/planner/clientes` | Busca por nome/posição/tag, segmento, intenção/sem contato/preparação, paginação, cadastrar |
| Perfil 360º | `#/planner/clientes/:id` | Contexto, restrições, preferências, posição, tags, métricas, preparar abordagem, editar, timeline e combinados |
| Oportunidades | `#/planner/oportunidades` | Campanha ou ausência de contato ≥21 dias, explicação, sugestões compatíveis, adicionar à semana |
| Desempenho | `#/planner/desempenho` | Contatos, compradores, positivação, TM, IPC, vendas informadas, cobertura, planejado × realizado, evolução tabular e aprendizados |
| Atendimento | `#/planner/atendimento/:id` | Posição, contexto, combinados, abordagem, ideias, Writer, resultado e avanço |

A seleção de semana, os filtros da carteira e a campanha/página de oportunidades permanecem na sessão da aba, inclusive ao voltar de um perfil ou de outro app. Semanas começam na segunda-feira; o calendário comercial usa America/Sao_Paulo. Semana atual e próxima estão disponíveis, além das semanas armazenadas. Registrar atendimento exige a semana atual. Reservas aparecem depois dos titulares no fluxo automático, respeitando a ordem relativa de cada grupo. A ordem mostrada na página Semana é a ordem manual, com o papel de cada entrada explícito.

## Preparação e oportunidades

Preferências e restrições usam categorias comerciais explícitas. Uma categoria não pode ser preferência e restrição ao mesmo tempo. Cada sugestão possui categorias; **qualquer interseção com restrições exclui a sugestão inteira**. Uma preferência compatível é necessária para sugerir. Perfil incompleto produz orientação para conhecer melhor o cliente, sem inventar preferências.

Referências de busca (frango, patinho, linguiça, tilápia, pão de queijo, sobremesa e acompanhamento) demonstram a abordagem; não representam produtos em estoque ou campanhas oficiais. Não existem preços ou cópias do catálogo no Planner. Insights mostra o catálogo real; Writer/Excel define o que está disponível na semana. Observações livres não são interpretadas automaticamente como restrições: cadastre a restrição na lista do perfil. Esta v1 não faz validação alimentar/alergênica.

## Priority Score explicável

As contribuições são somadas e limitadas a 0–100. Cada perfil/lista permite expandir a lista completa, inclusive fatores com contribuição zero. É uma ordem comercial sugerida, não uma probabilidade de compra. Data de referência: hoje, considerando atendimento concluído na semana atual, mesmo quando a semana selecionada é outra.

| Fator | Contribuição |
|---|---|
| Intenção declarada | +25 |
| Frequência desejada vencida ou nenhum contato | +10 |
| Sem contato / ≥21 dias / ≥7 dias / contato recente | +20 / +15 / +8 / 0 |
| Compra anterior registrada | +10 |
| Ao menos uma sugestão compatível | +15 |
| Sem contato no mês atual | +10 |
| Abordagem preenchida / pendente | +10 / −5 |
| Recusa no contato mais recente há menos de 7 dias | −30 |
| Resultado registrado na fila da semana atual | −40 |

Indisponibilidade é uma tentativa, não atualiza o último contato efetivo. A intenção é mantida após “interessado” e removida nos demais resultados. Falar depois cria compromisso com data não anterior a hoje. Promessas antigas são editáveis; a v1 não tenta deduzir intenção de texto livre.

## Resultados e métricas

- Comprou: exige valor positivo em centavos e unidades inteiras positivas; registro manual, sem envio de pedido implícito.
- Interessado: registra contato e intenção.
- Falar depois: exige data de retorno e gera combinado.
- Não interessado: registra a recusa, reduz prioridade recente.
- Indisponível: registra tentativa e avança, sem aumentar contatos/positivação.

Uma entrada da fila aceita um resultado; tentativas duplicadas são rejeitadas pelo serviço. Entradas concluídas não podem ser removidas ou trocar papel, preservando o histórico. Correção/estorno de resultado é extensão futura.

Atendimentos e compradores contam clientes distintos na semana; positivação = compradores / clientes contatados. Ticket = valor / compras com valor e unidades; IPC = unidades / mesmas compras. Compras sem medição são indicadas, excluídas de valor/TM/IPC. Cobertura = clientes contatados / carteira. Planejado × realizado compara titulares com resultados, distinguindo contatos de tentativas indisponíveis. Divisão por zero retorna zero ou “—”, conforme a métrica.

## Integrações e continuidade

`shared/services/commercialContext` é contrato de sessão: `id`, `customerId`, `customerName`, `weekId`, `returnTo`, busca opcional e estado do formulário. URLs levam apenas busca comercial, nunca identidade do cliente. O shell oferece retorno ao contexto original; dados salvos do Planner permanecem após navegação e recarregamento. Salve a abordagem antes de sair: rascunhos locais de formulários não têm autosave.

Insights recebe `#/insights/produtos/busca/:query`, filtra o catálogo e permite abrir os detalhes existentes. Writer exige Excel válido e associação explícita ao cadastro da planilha. Confirmar troca cliente/sala/telefone, limpa CPF sobrescrito e aluno quando a sala muda; itens e demais dados permanecem para conferência. Cancelar conserva o pedido. Alterar cliente/sala ou substituir/remover Excel desfaz o vínculo.

Exportação comunica `orderStatus=exported` apenas ao contexto associado. Não registra compra, envio, pagamento ou entrega. Retorno persistente por `orderId`, conciliação e deduplicação dependerão de backend.

## Estados e arquitetura

Loading usa Skeleton; leitura inválida mostra ErrorState/retry sem apagar dados. Vazio permite cadastrar/escolher clientes. Falha de ação preserva dados; ação concorrente é bloqueada. Storage negado mantém memória de sessão com aviso. Busca, texto longo e grandes carteiras usam quebra responsiva/paginação.

Código específico está em `src/products/planner`, organizado em componentes, hook de feature, domínio, serviço e repository. Páginas não acessam rede/storage diretamente, exceto seleção de semana como preferência de interface. O repository local pode ser substituído por adapter remoto preservando `load`/`save`; a implementação remota deverá usar comandos transacionais, propriedade/RLS e controle de versões, sem gravar snapshots indiscriminadamente. Produtos não importam internals entre si. Integrações passam pelo contrato compartilhado.

As APIs visuais existentes compõem todas as superfícies/controles. Motion reutiliza tokens e deslocamento curto; reduced-motion e a preferência do aplicativo removem a entrada do painel.

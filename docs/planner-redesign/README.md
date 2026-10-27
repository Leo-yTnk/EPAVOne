# EPAVPlanner — redesenho do espaço de trabalho

## Base e referências

Implementação em `feat/planner-workspace-redesign`, partindo de `main` no commit `fa112338f5de6bc3c5bf8807bed59fd3b8eb3b74` (PR #75). O repositório Yourcipe-EPAV é o legado; as referências corretas estão em **Leo-yTnk/EPAVOne**.

Foram consultados os PRs [#70](https://github.com/Leo-yTnk/EPAVOne/pull/70), [#61](https://github.com/Leo-yTnk/EPAVOne/pull/61), [#68](https://github.com/Leo-yTnk/EPAVOne/pull/68) e [#71](https://github.com/Leo-yTnk/EPAVOne/pull/71), além de AGENTS.md, DESIGN-SYSTEM-V1.md, COMPONENT-CATALOG.md, ARCHITECTURE.md, docs/design-system/README.md, tokens.css, rotas e implementação atual. As melhorias posteriores, incluindo o registro detalhado de vendas do PR #75, foram preservadas.

## Diagnóstico e decisões

| Antes | Depois | Motivo |
| --- | --- | --- |
| Guia permanente de quatro cards antes da ação inicial | Próxima ação calculada a partir da carteira e da semana | Novos usuários recebem uma orientação por vez; usuários ativos chegam à tarefa |
| Clientes e Oportunidades como páginas paralelas | Carteira única com as visualizações Todos e Oportunidades | Busca, segmentação e oportunidades compartilham os mesmos perfis |
| Cards de cliente com pontuação e múltiplas ações | Lista compacta; ação de adicionar à semana e menu de contexto explícito | Menos escolhas simultâneas; fatores de prioridade continuam acessíveis no perfil |
| Perfil com preparação, combinados, ofertas e histórico empilhados | Identificação e próximo passo, seguidos de abas por tarefa | Preserva todos os campos e revela detalhes quando fazem falta |
| Fila com um card grande e vários controles por cliente | Lista única, menu de organização e preparação contextual | Reordena, alterna titular/reserva e prepara sem sair da semana |
| Atendimento em uma página independente | Momento Atender dentro de Semana | Mantém os retornos de Insights e Writer associados ao cliente |
| Desempenho mistura indicadores financeiros e de relacionamento | Resultados prioriza contatos, conversão, cobertura, meta e evolução | Evita dois lugares com totais financeiros potencialmente divergentes |

A composição usa a fundação do PR #70: tokens existentes, paleta roxa, Warm Paper, quadriculado conforme preferências, fontes oficiais, Card costurado, raios, controles e motion compartilhados. **Não há uma identidade visual local nova.** A única variante nova do DS é `Tabs size="compact"`, documentada no catálogo: padding horizontal por tokens e alvo mínimo de 44 px, sem mudar consumidores sem a prop.

## Navegação e funcionamento

Pedidos continua na posição existente. As quatro áreas de trabalho são **Início → Clientes → Semana → Resultados**.

- **Início:** saudação discreta, próxima ação relevante, meta/resumo compacto, próximas conversas, combinados por vencimento e contatos a retomar conforme a frequência desejada.
- **Clientes:** busca sem distinção de acento, filtros progressivos, paginação, oportunidades por campanha e clientes sem contato, ofertas compatíveis expandidas sob demanda, perfil dividido em Preparar, Combinados, Histórico e Oportunidades. Pontuação detalhada, observações e exclusão confirmada ficam em informações complementares.
- **Semana:** Planejar → Atender → Concluir. Seleção inline de clientes, meta ajustável sob demanda, ordem, titulares/reservas, preparação no mesmo espaço, resultado com avanço para o próximo cliente e fechamento com próximos passos. No mobile, abrir uma preparação traz esse contexto antes da fila. O formulário de meta não ocupa o momento de atendimento.
- **Resultados:** contatados, conversão de atendimento, cobertura, progresso da meta, gráfico de evolução, tabela de comparação e histórico com aprendizados. Conversão sem contatos aparece como “—”. Os indicadores financeiros ficam em Pedidos; valores históricos individuais continuam consultáveis no perfil.

### Compatibilidade de URLs

| Link anterior | Destino canônico |
| --- | --- |
| `#/planner/oportunidades` | `#/planner/clientes/oportunidades` |
| `#/planner/desempenho` | `#/planner/resultados` |
| `#/planner/atendimento/:id` | `#/planner/semana/atender/:id` |

O router substitui o endereço com `replaceState`, preservando favoritos e evitando adicionar uma etapa artificial ao botão Voltar. URLs de clientes e Pedidos continuam válidas.

## Integridade preservada

Sem migrations e sem alterações em produção. Permanecem os repositories, serviços, esquema de persistência, validação e sincronização do Planner, proteção contra respostas de outra conta, revisão otimista e tratamento de falhas. A UI não chama Supabase nem fetch diretamente.

Preservados: cadastro/edição/exclusão confirmada, preferências/restrições/tags/observações, histórico imutável, combinados e datas, metas, filas, titulares/reservas, bloqueio de resultado fora da semana atual, estados de atendimento, mensagens de carregamento/sincronização/erro e dados antigos. Falhas de gravação mantêm a edição. O diálogo de cadastro passa a mostrar erro apenas quando o salvamento falha, sem interpretar uma mensagem anterior de sucesso como erro.

Pedidos, dashboard, indicadores, cadastro, edição, exclusão, serviços de vendas e integração de registro do Writer não foram alterados. Download no Writer continua sem confirmar venda; compras seguem para a conferência em Pedidos, sem um novo registro paralelo no redesenho.

## Validação executada

- `npm run verify`: **93 arquivos e 450 testes aprovados**; lint sem erros, arquitetura, catálogo de tokens e build aprovados. Permanece um aviso preexistente de `console` em scripts/review-migration.mjs.
- Testes novos exercitam rotas antigas, substituição do endereço, próximos passos, composição de filtros e restrições, carteira com 200 clientes, adição/remoção/preparação na Semana, reordenação, resultado com próximo cliente, contexto de retorno ao Writer e separação dos indicadores financeiros.
- Chromium headless: **110 inspeções**. Matriz de 320, 390, 768, 1024 e 1440 px em claro/escuro; texto ampliado, densidade compacta, navegação vertical e movimento reduzido. Estados vazios, dados inválidos e 200 clientes com nomes extensos. Sem overflow da página, clipping nos elementos verificados, costuras ausentes ou exceções JavaScript.
- Fluxos reais no navegador: cadastro, edição, recarga/persistência, combinado/conclusão, exclusão com cancelar/confirmar, foco dentro do diálogo e devolvido ao gatilho, busca/limpeza, oportunidades, planejamento inline, meta, reserva, ordem, preparação, remoção, resultado persistido uma vez, próximo cliente, compatibilidade de rotas e restrição de semana. O retorno do Insights à carteira e do Writer ao atendimento também foi exercitado no navegador.
- [Comparação de Pedidos](pedidos-comparison.json): imagens 1440 × 1519. O conteúdo abaixo de 100 px é idêntico pixel a pixel; diferenças somente na navegação superior. Esta comparação usa o estado sem sessão. A suíte existente de vendas/Writer também passou.

[Resultados de navegador](review.json) · [Matriz de geometria](matrix.json) · [Comparação de bundle](bundle.json) · [Medições de desempenho](performance.json)

### Desempenho

Sem novas dependências de execução. JS/CSS total: +837 bytes gzip (**+0,33%**), comparado com builds limpos da base.

Benchmark reproduzível com 200 clientes locais, mobile 390 px, 20 buscas por execução, três execuções por condição e limitação de CPU normal/4×. Mediana de tempo ocupado pela thread principal: 412 → 367 ms na CPU normal e 2024 → 1833 ms com limitação, por lote de 20 buscas. O cenário 4× teve dispersão: o maior P95 de espera por dois quadros subiu de 135 para 170 ms. Não demonstra aceleração garantida ou consumo total de CPU, GPU ou bateria; não houve aumento sistemático do tempo mediano neste ensaio. Builds de desenvolvimento, amostra curta e ambiente headless limitam a conclusão. Não se atribui uma nota artificial de CPU.

Motion permanece curto, por composição, sem animação permanente por cliente. Mudança de filtro/fila usa o comportamento compartilhado, com cancelamento e movimento reduzido; expansão usa tokens, transform e opacidade. Não há blur, backdrop-filter, transition: all ou nova dependência visual.

## Screenshots reais

Registros demonstrativos identificados como exemplos, sem informações de contas reais. Desktop: 1440 px. Mobile: 390 px. Capturas completas nos dois temas.

| Página | Desktop claro | Desktop escuro | Mobile claro | Mobile escuro |
| --- | --- | --- | --- | --- |
| Início | [Abrir](inicio-desktop-light.png) | [Abrir](inicio-desktop-dark.png) | [Abrir](inicio-mobile-light.png) | [Abrir](inicio-mobile-dark.png) |
| Clientes | [Abrir](clientes-desktop-light.png) | [Abrir](clientes-desktop-dark.png) | [Abrir](clientes-mobile-light.png) | [Abrir](clientes-mobile-dark.png) |
| Semana | [Abrir](semana-desktop-light.png) | [Abrir](semana-desktop-dark.png) | [Abrir](semana-mobile-light.png) | [Abrir](semana-mobile-dark.png) |
| Resultados | [Abrir](resultados-desktop-light.png) | [Abrir](resultados-desktop-dark.png) | [Abrir](resultados-mobile-light.png) | [Abrir](resultados-mobile-dark.png) |

### Antes e depois

| Área | Antes | Depois |
| --- | --- | --- |
| Início | [Visão geral](before-inicio.png) | [Centro de ação](inicio-desktop-light.png) |
| Clientes | [Grade de perfis](before-clientes.png) | [Carteira unificada](clientes-desktop-light.png) |
| Semana | [Fila com ações simultâneas](before-semana.png) | [Planejamento contextual](semana-desktop-light.png) |
| Resultados | [Desempenho](before-desempenho.png) | [Atendimento e relacionamento](resultados-desktop-light.png) |

Há capturas adicionais do perfil, oportunidades, atendimento, fechamento, estados vazio/erro e Pedidos nesta pasta.

## Reprodução e limites

```sh
npm ci
npm run verify
REVIEW_BROWSER=/caminho/chromium REVIEW_PLAYWRIGHT=/caminho/playwright node scripts/review-planner-redesign.mjs
REVIEW_BASELINE=/checkout-da-base REVIEW_BROWSER=/caminho/chromium REVIEW_PLAYWRIGHT=/caminho/playwright node scripts/benchmark-planner-redesign.mjs
```

O checkout da base usado no benchmark também precisa das dependências de desenvolvimento instaladas. `REVIEW_SKIP_MATRIX=1` permite repetir somente os fluxos, reutilizando o matrix.json já gerado. A revisão intercepta a API e bloqueia gravações remotas. Os dados reais não foram modificados.

Ainda requer homologação com contas e rede reais, Safari/iPhone físico, leitores de tela e estudantes em uso cotidiano. A geometria é verificada em Chromium e não equivale a uma auditoria completa de acessibilidade. Erros de rede, troca de conta, conflitos e integridade SQL são cobertos pela suíte automatizada; não houve teste autenticado em produção. O percurso completo de download de um Excel real não foi repetido nesta sessão; seus testes de integração existentes passaram. As observações acima delimitam o que foi de fato executado.

**Conclusão:** a mudança reúne as tarefas em uma carteira e em uma semana contínua, preservando as regras e o módulo de Pedidos. Está preparada para revisão via PR; sem merge ou deploy automático.

# EPAVPlanner — revisão adicional do PR #76

A revisão adicional encontrou e corrigiu cinco problemas:

1. A preparação podia permanecer com o valor antigo após editar o cliente no diálogo do perfil. Campos limpos agora acompanham o valor salvo; rascunhos locais são mantidos, com opção de recuperar a versão salva quando houver atualização concorrente.
2. A meta semanal podia ficar desatualizada após atualizar os dados. A mesma regra de sincronização preserva a meta em edição e atualiza campos limpos.
3. Um link de preparação para cliente fora da fila selecionava silenciosamente outro cliente. Agora apresenta “Cliente fora desta semana”, com retorno à fila e sem formulário de outra pessoa.
4. Filtros ativos continuavam visíveis enquanto o botão anunciava que estavam recolhidos. O botão agora abre e recolhe os campos, mantendo a filtragem aplicada.
5. A semana vazia renderizava um Card de fila sem conteúdo. A superfície só aparece quando há clientes planejados.

## Testes executados

- `npm run verify`: **94 arquivos, 457 testes aprovados**, incluindo **7 testes de regressão novos**. Arquitetura, catálogo de tokens e build aprovados. Apenas o aviso preexistente de console em scripts/review-migration.mjs.
- **111 inspeções no Chromium**, em 320, 390, 768, 1024 e 1440 px, com temas claro/escuro e preferências de texto ampliado, densidade compacta, navegação vertical e movimento reduzido.
- Fluxos de cadastro, edição, persistência, preparação atualizada após editar o perfil, combinados, exclusão confirmada/cancelada, foco do diálogo, busca, oportunidades, planejamento inline, ordem, reserva, meta, preparação, remoção, atendimento e avanço na fila.
- Retorno do Insights à carteira e do Writer ao mesmo atendimento; compatibilidade de rotas, limite de semana, carteira com 200 registros, textos longos, estados vazio/erro e cliente fora da fila.
- Sem exceções JavaScript, overflow da página, clipping nos elementos verificados ou costuras ausentes. [Dados da revisão](review.json) e [matriz de geometria](matrix.json).

Nenhuma mudança em Pedidos, schema, persistência, serviços de vendas ou dependências de execução. Sem merge, deploy ou escrita em produção. O bundle atualizado está registrado em [bundle.json](bundle.json).

## Screenshots novos

Capturas reais em 1440 px (desktop) e 390 px (mobile), com registros demonstrativos identificados como exemplos.

| Tela | Desktop claro | Desktop escuro | Mobile claro | Mobile escuro |
| --- | --- | --- | --- | --- |
| Início | [Abrir](inicio-desktop-light.png) | [Abrir](inicio-desktop-dark.png) | [Abrir](inicio-mobile-light.png) | [Abrir](inicio-mobile-dark.png) |
| Clientes | [Abrir](clientes-desktop-light.png) | [Abrir](clientes-desktop-dark.png) | [Abrir](clientes-mobile-light.png) | [Abrir](clientes-mobile-dark.png) |
| Semana | [Abrir](semana-desktop-light.png) | [Abrir](semana-desktop-dark.png) | [Abrir](semana-mobile-light.png) | [Abrir](semana-mobile-dark.png) |
| Resultados | [Abrir](resultados-desktop-light.png) | [Abrir](resultados-desktop-dark.png) | [Abrir](resultados-mobile-light.png) | [Abrir](resultados-mobile-dark.png) |

Também há capturas de perfil, oportunidades, atendimento, fechamento, estado vazio, erro de leitura e cliente fora da fila nesta pasta.

## Limites

A revisão usa dados demonstrativos e intercepta a API. Não altera contas ou banco reais. Os testes automatizados cobrem sincronização e falhas de persistência; não houve homologação autenticada em produção. Safari/iPhone físico e avaliação com estudantes permanecem pendentes. O percurso completo de download de um Excel real não foi repetido nesta revisão.

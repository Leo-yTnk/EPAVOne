# Revisão da implementação — EPAVPlanner v1

Base: `main` em `98f90a5` (PR #47), branch `feat/planner-v1`. Nenhum PR aberto nem deploy realizado. Fontes de verdade lidas antes das alterações: AGENTS, ARCHITECTURE, DESIGN-SYSTEM-V1, COMPONENT-CATALOG, README e documentação de navegação, migração e sessão do Writer.

## Implementado

- Cinco áreas, perfil 360º e Modo Atendimento; busca/filtros/paginação, cadastro/edição, posição, segmentos, tags, preferências/restrições, contexto/observações, preparo, timeline e compromissos.
- Semana atual, próxima e histórico: meta, titulares/reservas, reordenação com controles acessíveis, retirada e cobertura.
- Prioridade determinística com fatores positivos, negativos e nulos explicados; restrição tem precedência sobre preferência.
- Resultados comprou/interessado/falar depois/não interessado/indisponível; validação, prevenção de duplicidade, retorno combinado e próximo cliente.
- Desempenho semanal com definições e denominadores explícitos; não transforma tentativa ou exportação em venda. Comparação semanal em tabela e orientações condicionadas aos resultados.
- Persistência local atrás de serviço/repository, detecção de dados inválidos e fallback de sessão com aviso. Dados inválidos não são apagados. Se gravação falhar mas leitura continuar funcionando, a versão mais recente em memória prevalece durante a sessão.
- Contexto compartilhado para consultar produto no Insights, retornar ao Planner e associar explicitamente cliente ao cadastro do Excel no Writer; associação desfeita ao trocar cliente/sala ou anexo. Filtros/campanhas permanecem ao retornar.

## Decisões relevantes

Preservados Preact, hash router, arquitetura, componentes e tokens. Planner lazy-loaded em chunk próprio. Nenhum import de internals entre produtos; nenhum acesso direto a API na UI. Catálogo/Excel continuam como fontes de preço e disponibilidade. A v1 usa categorias explícitas, sem interpretar texto livre nem inventar preferências.

Composição usa roxo semântico, Warm Paper/grid existentes, DM Serif Display nos destaques, Inter Tight/Inter, Cards stitched e espaço entre unidades de conteúdo. Mobile empilha as sugestões para preservar largura de leitura. A revisão manual de nomes/posições/tags longas revelou corte dentro do card, apesar de a página não ter overflow: corrigidos min-width dos filhos e quebra das tags/overline, com verificação adicional do conteúdo interno. Motion é deslocamento curto com tokens; preferências e reduced-motion são respeitados. A revisão corrigiu a variante do display e tornou a região rolável de DataTable acessível ao teclado, em seu componente compartilhado.

## Validações

- `npm run verify`: lint, checker de arquitetura, Vitest e produção. **41 arquivos / 185 testes**; suite inclui domínio, serviço, repository, UI e associação ao Writer. Uma execução simultânea ao Chromium excedeu o timeout de 5 s de um teste existente do Writer; a verificação final foi executada isoladamente, sem alterar o teste ou ampliar seu timeout.
- Chromium: **62 verificações**, cobrindo as sete composições principais em 320, 390, 768 e 1440 px, claro/escuro, mais vazio, poucos clientes, 200 clientes/textos longos, perfil longo, fila grande e erro. Capturas em `docs/planner-review/`; relatório estruturado em `results.json`.
- Axe WCAG 2 A/AA e 2.1 AA nas capturas principais e estados extremos: nenhuma violação detectada. A matriz não detectou overflow horizontal, Cards sem costura nem erros de execução.
- Focus trap, Tab, Escape e retorno de foco ao botão de edição; persistência da preparação após reload; busca `frango` no Insights, retorno ao mesmo perfil; gravação de resultado, próximo cliente e persistência após reload; reduced-motion sem animação do painel.
- Testes automatizados cobrem restrições, explicabilidade, recusa/conclusão, contato indisponível, métricas sem dupla contagem, resultados, limites, compromissos, semanas, mutações imutáveis, erro/loading/vazio, cadastro, busca e preservação de filtros, armazenamento bloqueado/corrompido, associação explícita ao Excel e eventos de exportação.
- Inspeção humana das capturas de visão geral, perfil e atendimento em desktop e mobile, nos dois temas. Fontes oficiais locais utilizadas. Fixtures de catálogo apenas para verificar a integração visual; nenhum login/escrita no banco real.

Para reproduzir a revisão: `node scripts/review-planner.mjs` com Playwright/Chromium e axe disponíveis. `REVIEW_PLAYWRIGHT`, `REVIEW_AXE` e `REVIEW_BROWSER` apontam para dependências/browser externos quando necessário. O script inicia Vite localmente; `REVIEW_URL` permite servidor existente. `REVIEW_SKIP_MATRIX=1` reutiliza a matriz já registrada e repete interações/estados. O calendário da fixture é 7/10/2026.

## Limitações e próximos passos

1. Adapter demonstrativo local: sem sincronização, isolamento por conta, resolução de concorrência entre abas ou importação da carteira. Antes de uso real, definir proprietário, esquema/RLS e integração com `sales` existente.
2. Referências comerciais são exemplos de busca, não campanhas oficiais ou disponibilidade confirmada. Conectar referências reais por gateway compartilhado e reavaliar categorias/restrições quando o catálogo mudar.
3. Compras são registros manuais; exportação do Writer comunica apenas formulário gerado em memória. Próxima etapa: vínculo persistente por pedido/cliente, eventos idempotentes e conciliação. Nome do cadastro nunca é tratado como identidade única.
4. Não há autosave de formulários abertos, estorno/edição de resultados concluídos, previsão estatística ou IA. Salvar preparo antes de sair. Cliente/sala substituídos no Writer mantêm produtos/delivery para conferência explícita.
5. Verificações automatizadas de contraste/teclado complementam a inspeção; não certificam experiência com leitores de tela ou todos os dispositivos físicos. Backend de produção e contas reais não foram testados nesta entrega.

## Ajuste da navegação — 7/10/2026

A navegação de áreas do Planner passou para a mesma segunda faixa do header usada pelo Insights. Os dois produtos compartilham a composição do AppShell, NavItem, SelectionIndicator e CSS de navegação, preservando a cor de cada app e os modos horizontal/vertical. Removida a barra de Tabs duplicada dentro do Planner; o seletor de semana ficou nas ações do PageHeader. Perfis mantêm Clientes selecionado e Atendimento mantém Semana selecionada.

Validação do ajuste: `npm run verify`, 41 arquivos / 186 testes; teste de navegação compartilhada e seleção nas rotas profundas. Inspeção em 320, 390, 768 e 1440 px, claro/escuro, comparando altura e composição com o Insights. Evidências em `docs/planner-navigation-review/`. Nenhum push ou PR nesta etapa.

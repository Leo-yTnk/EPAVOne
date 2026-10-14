# Revisão do EPAVOne — 14/10/2026

## Resultado e escopo

Revisão baseada no main `c9c9d173` (PR #52). Yourcipe-EPAV foi consultado: continua com a aplicação antiga e workflow de deploy. Alterações foram preparadas no EPAVOne, sem alterar services, repositories, permissões, validações, gravações, importação, exclusão ou lógica de criação/administração.

- Criação: navegação horizontal em Card canônico, com quebra em duas colunas no celular; bibliotecas usam toda a largura disponível, imagens maiores e ações agrupadas. Mantidos busca, filtros, 24/48/96 itens e menus existentes.
- Administração: atalhos e seletor/contexto lado a lado no desktop, empilhados em telas menores. Conteúdo da área selecionada ocupa a largura inteira. Importação, prévia, duplicatas, solicitações, preços e confirmação de exclusão conservam os fluxos existentes.
- Tipografia/espaçamento: DM Serif nos destaques, Inter Tight nos títulos de controle e Inter em labels/dados. Textos auxiliares aumentados, margens e paddings por tokens. Corrigida referência CSS a token inexistente (`--control-height-sm` → `--control-sm`).
- Feedback compartilhado: Alert aceita conteúdo e ações sem envolver elementos de bloco em `<p>`. Preservados roles status/alert; título, descrição, ícone e ação têm espaçamento previsível. Ajustados textos de Toast e Empty/ErrorState. Loading, progresso real, falha parcial e pausa continuam com a lógica original.
- Preços: configuração operacional para 7h, 9h e 14h de Brasília, diariamente; reaproveita um job Swift existente ou cria um único job autenticado se ausente. Recusa múltiplos jobs e timezone incompatível. Não aplica migrations nem inicia consulta ao configurar. Procedimento em [daily-price-schedule.md](daily-price-schedule.md).
- Revisão visual: corrigida a espera da inicialização do Vite no CI (era baseada na palavra “Local:” nos logs; agora consulta HTTP com prazo). Fixture passa a usar as margens do shell real.

## Evidências atuais de implantação

O último deploy de backend **já foi concluído**, em 13/10/2026, no commit `c9c9d173`. Job deploy e verificações OPTIONS/anônimo concluídos; não houve skipped. Portanto, a pendência descrita em price-sync-progress.md não representa mais o estado atual do deploy.

- Backend: https://github.com/Leo-yTnk/EPAVOne/actions/runs/38445341404
- Pages: https://github.com/Leo-yTnk/EPAVOne/actions/runs/38445032417
- Verificação do main: https://github.com/Leo-yTnk/EPAVOne/actions/runs/38445032406
- Falha visual anterior: https://github.com/Leo-yTnk/EPAVOne/actions/runs/38444952492 — timeout antes de abrir a interface, corrigido no script desta revisão.

Deploy bem-sucedido certifica publicação e checks descritos no job. Não certifica preços consultados, migrations hospedadas, credenciais regionais ou horários efetivos do Cron.

## O que ainda falta

| Prioridade | Parte | Situação constatada | Próxima entrega / critério de conclusão |
|---|---|---|---|
| Alta | Horários automáticos | Nenhum cron 7/9/14 está versionado no main; job hospedado não pôde ser consultado. | Aplicar a configuração operacional no Supabase, conferir um único scheduler e observar runs nos três horários. Não basta mergar frontend. |
| Alta | Sincronização real de preços | Backend atual implantado; não foi possível reproduzir a falha relatada em produção com admin nesta sessão. | Conferir histórico/leases, uma atualização autenticada e preços/promos/CEP reais. Confirmar 044/045 por diagnóstico; o proprietário informou aplicação das pendentes. |
| Alta | Aceitação com contas A/B/admin | Os testes usam fixtures; não há evidência atual de aceite completo hospedado. | Validar isolamento das bibliotecas/Planner, publicação, solicitações, compartilhar/resgatar/revogar e cadastro com Turnstile no hostname publicado. |
| Alta | Planner hospedado | Código já tem adapter remoto e migration 041; o relatório inicial de Planner era anterior a essa integração. Não classificá-lo como somente local. | Certificar 041/RLS no banco e registro idempotente de compra em sales. Exportar no Writer deve continuar sem registrar compra. |
| Média | Cobertura do catálogo Swift | O lote integrado é curado, com 11 produtos. Presença no código não prova importação no banco. Atualização depende de fonte oficial cadastrada. | Importar/revisar o catálogo necessário, preencher fontes ausentes e conferir imagens, unidades e disponibilidade regional. “Todos os produtos Swift” não está garantido. |
| Média | Execução automática de catálogos grandes | Cron ainda usa o lote da função existente. A fila manual por produto não altera esse contrato. | Medir duração/falhas com catálogo real. Se exceder limites, planejar fila backend em lotes persistentes; não foi alterada nesta revisão. |
| Média | Continuidade da fila manual | Progresso/fila ficam em memória; fechar/recarregar interrompe o acompanhamento local. | Caso seja requisito, implementar persistência/retomada backend em trabalho separado. Navegação dentro da sessão já preserva a fila. |
| Média | Conciliação pedido → venda | Writer gera Excel; Planner registra compras manualmente. Não há confirmação automática de suporte/entrega. | Definir vínculo persistente por pedido/cliente e conciliação, se necessário ao escopo. Exportação não deve contar como venda automaticamente. |
| Média | Preferências/restrições comerciais | Sugestões usam categorias e restrições cadastradas; não certificam estoque ou campanha oficial. | Validar perfis/categorias reais e processo de atualização das ofertas com o Excel semanal. |
| Média | Aceite visual em produção | Fixtures não certificam catálogo real, leitores de tela ou dispositivos físicos. | Conferir páginas publicadas, claro/escuro, teclado e mobile com dados reais; concluir piloto do Design System RC antes de chamá-lo 1.0. |
| Após aceite | Encerrar Yourcipe | Repo antigo ainda mantém app e workflow; não foi desativado/arquivado aqui. | Confirmar titularidade exclusiva do deploy e checklist A/B/admin; concluir redirecionamento e aposentadoria conforme migration-closeout.md. |

## Limites preservados

O arquivo Excel anexado no Writer já usa IndexedDB + identificador de sessão da aba (`sessionTemplate.js`) para restauração após reload; não é pendência implementar essa persistência. Outros dados do pedido mantêm seu contrato atual. Os textos antigos que descrevem apenas memória para todo o arquivo precisam ser lidos à luz desse código.

Não foi feita nenhuma importação, exclusão, mudança de preço, login privado, aplicação de SQL ou configuração de secrets no ambiente hospedado. Não foram criadas imagens. Fotos são as referências oficiais já cadastradas, com fallback quando indisponíveis.

## Validação desta revisão

Testes SQL executam PostgreSQL embarcado com stubs de Cron/Vault/pg_net: verificam reaproveitamento, repetição sem duplicar job, autenticação por referência, recusa de jobs múltiplos/secret ausente/timezone errado e ausência de HTTP durante configuração. Não atestam extensões hospedadas.

- ESLint sem erros (um aviso preexistente em review-migration.mjs), checker de arquitetura aprovado e build de produção aprovado.
- 59 arquivos / 266 casos verificados. Execuções completas no host tiveram timeouts de inicialização PGlite e dois casos de catálogo durante Chromium em paralelo. Os casos afetados foram repetidos isoladamente e passaram; não se afirma que a primeira execução literal de `npm run verify` passou. A suite com hookTimeout 60 s passou 264 casos, e os dois timeouts do catálogo passaram na reexecução, junto dos cinco testes SQL atualizados. Os serviços e lógica da aplicação não foram alterados para contornar testes.
- Matriz final Chromium: **72 verificações em 1440/390/320 px × claro/escuro**, todas sem overflow horizontal e sem pageerror. A matriz valida também costura dentro do Card e navegação acima do conteúdo, evitando sobreposição. Dados/admin são fixtures; não há gravações hospedadas.
- Fotografias externas indisponíveis no ambiente: a execução local usa `REVIEW_OFFLINE=1`, mostrando o fallback existente. A matriz não certifica download/qualidade de fotos reais. `REVIEW_IMAGE_DIR` continua permitindo imagens oficiais previamente disponíveis, sem trocar URLs da aplicação.
- O Pages hospedado retornou ERR_EMPTY_RESPONSE no navegador desta revisão; aceite publicado permanece pendente.

Evidências representativas em [review-2026-10-14](review-2026-10-14/): administração desktop/claro, biblioteca desktop/claro, administração 320 px/escuro e editor 390 px/escuro. Resultado integral: [results.json](review-2026-10-14/results.json).

Reprodução: `node scripts/review-creation-import.mjs` com Playwright e Chromium. O CI mantém os URLs originais. A opção `REVIEW_OFFLINE=1` bloqueia solicitações externas somente na ferramenta de inspeção; não afeta a aplicação.

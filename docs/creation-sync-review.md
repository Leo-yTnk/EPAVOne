# Criação e ciclo de vida da sincronização

PR #50 confirmado como merged em main, com 042/043 presentes no repositório. O proprietário informou sua aplicação e a execução do workflow; não houve acesso ao banco hospedado para certificar definições ou logs. O workflow Deploy EPAVOne Swift price sync implanta a função; ele não executa uma consulta de preços do catálogo.

## Falha reproduzida

Em 029, `begin_swift_price_sync` verificava a identidade da solicitação antes da expiração da lease. Uma repetição com a mesma chave retornava `duplicate_active` mesmo com prazo expirado. O frontend reutiliza essa chave ao repetir uma chamada cujo resultado se perdeu na rede. A função retornava 409 também para uma execução concluída, descartando a possibilidade de recuperar seu resultado. Isto reproduz o defeito no código; não identifica sozinho por que uma chamada específica foi interrompida em produção.

044 reconcilia a lease expirada também para a mesma chave, preservando o registro como abandoned. A mesma identidade nunca repete gravações. Uma nova ação explícita pode iniciar outra execução e recuperar a lease expirada do lote anterior. O lock global e a autorização service_role continuam existentes.

A Edge Function agora oferece consulta administrativa `statusOnly`, sem iniciar execução. Uma execução ativa retorna 202/pending; uma concluída recupera métricas/falhas persistidas; uma expirada ou fracassada informa o problema. O frontend conserva a identidade pendente e consulta o andamento após perda de resposta ou conflito. Uma execução concorrente de outro produto/lote é acompanhada sem atribuir seu resultado à solicitação original; depois de terminar, o usuário pode iniciar sua própria atualização. A tela não apresenta andamento como sucesso nem como falha genérica.

## Composição

- Receitas e produtos pessoais/públicos: imagens já cadastradas, grade de unidades independentes, ações dentro de cada Card; categorias mantêm símbolo sem inventar imagens.
- Compartilhadas: área de resgate contextualizada e receitas com imagens.
- Solicitações: contexto de revisão/publicação e status por significado, sem fotos inventadas para solicitações.
- Administração: acesso rápido e área selecionada agrupados; seções usam Card canônico.
- Importação: imagens na prévia de produtos e receitas; mantém validação e confirmação explícita, com escolhas por duplicata.
- Revisão Swift: imagem observada junto à proposta, sem aceitar alterações automaticamente.
- Editor: prévia aberta, ao lado dos campos no desktop e abaixo no celular; proteção de alterações, salvar e unidades preservados.
- Preços e manutenção: consultas, revisão editorial e exclusões organizadas em unidades separadas; feedback de manutenção aparece junto à ação.

Warm Paper, DM Serif Display/Inter, laranja, costuras, Portals e reduced-motion preservados. Nenhuma imagem foi gerada.

## Validação e evidências

`npm run verify`: ESLint, arquitetura, 55 arquivos / 252 testes, build. Testes novos reproduzem a chave expirada no PostgreSQL embarcado (PGlite), isolamento de privilégios, idempotência, conflitos ativos, consulta sem gravação, recuperação de resultado e andamento na interface. Este PostgreSQL usa uma tabela de runs de teste; não certifica o ambiente Supabase hospedado.

`scripts/review-creation-import.mjs`: 72 verificações em 1440/390/320 px × claro/escuro. Abrange upload/validação/confirmacão, editor/proteção de alterações, revisão seletiva Swift, seis áreas do workspace sync pendente, verificação de duplicatas e substituição escolhida. Sem transbordamento horizontal ou pageerror. Serviços e contas são fixtures, sem gravações hospedadas. As fotos oficiais foram baixadas dos mesmos URLs já presentes no lote público e servidas localmente durante esta inspeção, sem trocar os URLs da aplicação. Exemplos de receitas/dados pessoais são sintéticos. O Pages publicado não pôde ser aberto neste navegador (ERR_EMPTY_RESPONSE); não constitui aceite em produção.

Resultados: `docs/creation-import-review/results.json`. As 72 capturas foram verificadas localmente e não integram este PR: a revisão automática bloqueou sua publicação externa. A captura local agora foi possível com Chromium disponível; substitui a limitação descrita na revisão anterior do PR #50. O CI mantém o mesmo script e usa os URLs originais das imagens.

## Refinamento da composição

Busca, quantidade e filtros compartilham um Card de controle. Os cards do catálogo têm imagem maior, nome em DM Serif Display e ações próximas aos dados, sem a faixa vazia anterior. Categorias continuam compactas. A biblioteca compartilhada usa o mesmo rodapé de ações.

Administração separa atalhos de tarefas da navegação e explica a área selecionada. A manutenção permanente mantém confirmação, senha e aceite; o botão final usa o tratamento de perigo do Design System. Desktop mantém duas colunas; celular empilha controles e posiciona ações abaixo do conteúdo. A matriz visual foi repetida após esse refinamento, inclusive com as imagens oficiais servidas localmente.

## Implantação

1. Revisar/aprovar o PR. Executar `supabase/diagnostic_swift_sync_runs.sql` e o diagnóstico geral antes de qualquer migration. Conferir runs, leases e definição da função.
2. Aplicar **044_swift_sync_expired_requests.sql** e depois **045_reviewed_catalog_duplicates.sql**, após revisar suas definições. Não repetir 042/043 ou o histórico. 044 substitui apenas a função begin; 045 adiciona a RPC de escolhas revisadas. Nenhuma faz backfill, limpa dados ou preços.
3. Mergar o PR para publicar o frontend pelo workflow existente de Pages.
4. Executar **Deploy EPAVOne Swift price sync** no main atualizado. Conferir se o job deploy terminou com sucesso, sem skipped por EPAVONE_BACKEND_DEPLOY_ENABLED. Sem novas secrets, cron ou scheduler.
5. Abrir Preços e manutenção com admin. Se existir run expirado, a nova ação recupera o lock. Se houver processamento ativo, usar Verificar andamento; a consulta não começa outro lote. Conferir resultado e preços/CEP antes de usar no atendimento.

044, 045 e deployment não foram executados no projeto hospedado. Não há liberação manual de execução ativa. Para rollback, redeploy da função anterior e reaplicar somente a definição begin de 029, preservando o histórico e ciente de que a falha original retorna.


## Verificação e revisão de duplicatas (045)

Administração oferece Verificar duplicatas para produtos, receitas, categorias e seções. As correspondências de nome, URL Swift e SKU são agrupadas sem repetir grupos conectados. A inspeção não elimina ou funde registros. Correspondências ambíguas do catálogo e repetições dentro do próprio arquivo continuam bloqueadas para revisão.

O Excel e o lote oficial preparado na tela oferecem por registro Manter original (padrão) ou Usar conteúdo importado. A comparação inclui imagens e dados; receitas consultam os ingredientes originais ao expandir. Qualquer escolha nova zera o aceite. O resumo conta novos, originais mantidos e substituições; o resultado informa as substituições efetivamente gravadas.

Uma nova RPC administrativa combina as inclusões de 042 e as substituições escolhidas na mesma transação. Revalida ID, identidade única e versão/timestamp sob locks de tabelas. O serviço usa a versão vista na prévia, sem trocá-la pela versão obtida numa reconsulta. Toda falha reverte inclusões e substituições. Não existe replace_all nesta entrada; 042 permanece inalterada como padrão para importar sem substituições.

Produtos recebem nome, imagem, categoria e unidade; preservam preços Swift, SKU, URL fonte e estado ativo. Receitas recebem detalhes e ingredientes, conservando ID, estado de publicação e demais vínculos. Categorias preservam estado ativo; seções recebem nome, ordem e ativa, com proteção por updated_at. Vínculos existentes por seção permanecem aditivos.

Testes cobrem manter original, substituir produto/receita/categoria/seção, versão e identidade alteradas, privilégio comum/anônimo, preservação de preço/ID/status, atualização de ingredientes e rollback do lote inteiro. Não houve substituição real no catálogo hospedado.

# Operação da criação EPAVInsights

O projeto Supabase EPAV é `ytvztfvypiwgnslisxep`, mantido pelo EPAVOne. Auth, RLS, biblioteca, solicitações e compartilhamento usam os contratos originais; não copiamos registros.

Antes de qualquer SQL, executar `supabase/diagnostic.sql` e conferir estado real. 038 e 039 fornecem escritores transacionais e organização administrativa. 040 foi aplicada anteriormente conforme informado pelo proprietário: verificar privilégios/view e não reaplicar por precaução. Para o Planner, 041 é aditiva e deve ser aplicada somente se ausente. Não usar db push automático para o histórico consolidado.

Conta permite cadastro YCP com CAPTCHA e perfil criado pelo trigger; login usa a mesma conta existente. Cloudflare autoriza o hostname do Pages e Supabase mantém a secret Turnstile. Somente URL/chave pública/site key podem entrar em VITE. Ações privadas estão em [migration-closeout.md](migration-closeout.md).

Criação oferece biblioteca pessoal, categorias, produtos, receitas, exclusão com resolução de referências, códigos/cópias/revogação e solicitações. Admin oferece publicação, revisão, páginas/seções, importação normalizada em seis abas e sincronização Swift. RLS e RPCs autorizam tudo no servidor.

O fluxo Excel usa `admin_add_public_catalog` (042) para adicionar novos e manter originais por padrão, sem modo de escrita no payload. Substituições individuais exigem escolha e confirmação na interface e a RPC `admin_import_reviewed_catalog` (045), com proteção por versão e rollback integral. As RPCs históricas mantêm seus contratos administrativos legados, mas não são chamadas por esta tela; fórmulas são rejeitadas. O antigo botão “Preparar produtos oficiais Swift” foi removido: apenas carregava um lote fixo de 11 produtos de outubro, sem consultar disponibilidade atual. O mesmo conteúdo pode ser importado por Excel; não há coleta automática escondida nessa ação.

Função Edge e workflow estão neste repositório; o workflow é manual, inicialmente bloqueado e não roda migrations. Desativar o workflow antigo antes de habilitar o novo. Não criar função/scheduler duplicado.

Testes locais de SQL usam PGlite e fixtures de RLS. Não atestam esquema hospedado. Aceitação A/B/admin continua necessária. Diagnósticos não consultam senhas ou conteúdo pessoal.

Evolução atual, implantação 042/043 e limites regionais: [revisão de criação/importação](creation-import-review/README.md). Implantar 043 antes da nova versão da função Edge.

Correção de solicitação Swift expirada, migrations 044/045, revisão de duplicatas e consulta de andamento: [creation-sync-review.md](creation-sync-review.md). Não repetir 042/043; executar o diagnóstico e seguir a ordem de implantação desse documento.

## Importação, timeout e backup (047/048)

Após diagnosticar o estado hospedado, aplicar em ordem `047_catalog_import_performance.sql` e `048_catalog_backup.sql` antes de usar o novo backup. Não reaplicar o histórico inteiro. A 047 mantém as assinaturas/validações das RPCs 042/045, cria chaves normalizadas mantidas por trigger e índices para nome, URL e SKU. `unaccent` continua STABLE; nenhum índice depende de uma falsa promessa de imutabilidade. O preenchimento inicial das chaves do catálogo público passa pelos triggers existentes, podendo atualizar auditoria/versões; editores e prévias abertos devem ser recarregados. Não aumenta o timeout global nem divide a gravação em commits parciais.

A barra apresenta progresso por etapas: leitura das abas, validação, revisão e gravação. Durante a RPC, o estado é “Aguardando confirmação do banco”, sem simular porcentagem de linhas gravadas. Só chega a 100% quando o banco confirma. SQLSTATE 57014 é explicado como limite de tempo com rollback; perda de conexão tem resultado incerto e pede conferir o catálogo antes de repetir. Se persistir após 047, verificar `pg_stat_activity`/`pg_blocking_pids`, limites do projeto e duração do lote: os testes locais não demonstram a latência do banco hospedado.

Administração → **Backup e restauração** → **Baixar backup JSON**. A RPC `admin_export_catalog_backup` retorna uma única fotografia consistente, sem paginação/truncamento de linhas: categorias, produtos e receitas públicos (inclusive inativos/rascunhos), ingredientes, classificações legadas, páginas, seções e vínculos. Preserva IDs, campos editoriais, publicação, preços/observações presentes no produto e URLs de imagens. Não inclui bibliotecas pessoais, usuários/senhas, Planner, histórico operacional de preços, solicitações, compartilhamentos ou bytes das imagens externas. Para recuperação de infraestrutura/usuários/arquivos, manter também backup próprio do Supabase e do Storage.

Para restaurar, selecionar o JSON nessa mesma área, revisar as contagens e confirmar explicitamente. `admin_restore_catalog_backup` valida formato v1, até 50 MB/100.000 registros, autorização admin, escopo, colisões de IDs pessoais e referências antes da alteração; erros posteriores também revertem a transação completa. Atualiza registros dos mesmos IDs e recompõe seus vínculos. **Mantém itens criados depois do backup**: é recuperação do conteúdo guardado, não rollback destrutivo de todo o banco. IDs são preservados; códigos de registros recuperados após exclusão e auditoria/versões seguem os triggers normais. Não reaplica credenciais nem permissões. Preserve uma cópia anterior à restauração. Não substituir esse JSON pelo modelo Excel (que tem regras de adição/preço diferentes).

Aceitação hospedada: com admin, exportar antes; importar Excel e conferir barra/quantidades; em homologação, alterar uma receita e sua associação, restaurar o arquivo e comparar conteúdo/ordem; repetir a restauração sem duplicar; conta comum não deve acessar as duas RPCs. Nenhum teste automatizado grava em produção.

Verificação desta entrega: `npm run verify` (lint, arquitetura, tokens, testes e build), testes SQL de lote/repetição/rollback e backup, e interação da barra/consentimento. A revisão Playwright local não pôde iniciar por falta do Chromium; o download do navegador retornou um arquivo inválido. O workflow de revisão visual usa o arquivo Excel sintético no lugar do botão removido e deve ser conferido no PR.

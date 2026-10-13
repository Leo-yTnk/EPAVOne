# Operação da criação EPAVInsights

O projeto Supabase EPAV é `ytvztfvypiwgnslisxep`, mantido pelo EPAVOne. Auth, RLS, biblioteca, solicitações e compartilhamento usam os contratos originais; não copiamos registros.

Antes de qualquer SQL, executar `supabase/diagnostic.sql` e conferir estado real. 038 e 039 fornecem escritores transacionais e organização administrativa. 040 foi aplicada anteriormente conforme informado pelo proprietário: verificar privilégios/view e não reaplicar por precaução. Para o Planner, 041 é aditiva e deve ser aplicada somente se ausente. Não usar db push automático para o histórico consolidado.

Conta permite cadastro YCP com CAPTCHA e perfil criado pelo trigger; login usa a mesma conta existente. Cloudflare autoriza o hostname do Pages e Supabase mantém a secret Turnstile. Somente URL/chave pública/site key podem entrar em VITE. Ações privadas estão em [migration-closeout.md](migration-closeout.md).

Criação oferece biblioteca pessoal, categorias, produtos, receitas, exclusão com resolução de referências, códigos/cópias/revogação e solicitações. Admin oferece publicação, revisão, páginas/seções, importação normalizada em seis abas e sincronização Swift. RLS e RPCs autorizam tudo no servidor.

O fluxo Excel usa `admin_add_public_catalog` (042) para adicionar novos e manter originais por padrão, sem modo de escrita no payload. Substituições individuais exigem escolha e confirmação na interface e a RPC `admin_import_reviewed_catalog` (045), com proteção por versão e rollback integral. As RPCs históricas mantêm seus contratos administrativos legados, mas não são chamadas por esta tela; fórmulas são rejeitadas. O lote integrado Preparar produtos oficiais Swift inclui 11 produtos com imagens vinculadas pelas páginas oficiais; inclui itens existentes por nome/URL, inclusive inativos, na revisão; manter original é o padrão, com escolha explícita de substituição quando houver correspondência única. Não atribui SKU ou preço regional por inferência. Revise a prévia antes de confirmar; depois sincronize preços com o CEP EPAV. O lote não é importado pelo build ou por migrations.

Função Edge e workflow estão neste repositório; o workflow é manual, inicialmente bloqueado e não roda migrations. Desativar o workflow antigo antes de habilitar o novo. Não criar função/scheduler duplicado.

Testes locais de SQL usam PGlite e fixtures de RLS. Não atestam esquema hospedado. Aceitação A/B/admin continua necessária. Diagnósticos não consultam senhas ou conteúdo pessoal.

Evolução atual, implantação 042/043 e limites regionais: [revisão de criação/importação](creation-import-review/README.md). Implantar 043 antes da nova versão da função Edge.

Correção de solicitação Swift expirada, migrations 044/045, revisão de duplicatas e consulta de andamento: [creation-sync-review.md](creation-sync-review.md). Não repetir 042/043; executar o diagnóstico e seguir a ordem de implantação desse documento.

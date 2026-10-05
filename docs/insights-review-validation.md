# Revisão final do EPAVInsights — 5 de outubro de 2026

## Resultado do código

`npm run verify` passou: lint, arquitetura, 127 testes em 34 arquivos e build.

Foram corrigidos a leitura paginada de páginas, seções e vínculos, o retorno de erro em vez de uma estrutura parcial, o desempate por IDs, a exibição compacta das ações com nome acessível completo, a disposição dos controles de ordenação e o Escape de seletores dentro de diálogos.

Os testes novos simulam 1.201 vínculos com limite de resposta de 200 linhas, falha numa página posterior, preservação de filtros públicos, bloqueio de TRUNCATE, preservação de CRUD/service_role, privilégios padrão e aplicação de RLS pela view de preços. A camada de diálogo também é testada com seletor em portal.

## Inspeção visual local

Chromium/Playwright, nas larguras 1440, 768, 390 e 320 px. A reinspeção capturou 51 estados, sem rolagem horizontal de página ou erros JavaScript. Foram inspecionados Home, receitas, produtos, detalhes de receita, entrada, biblioteca pessoal, editores de receitas/produtos, menu de categorias, administração, páginas/seções, editor de seção, importação, manutenção e acesso administrativo negado a uma conta comum.

As telas públicas usaram uma amostra obtida por leitura anônima do catálogo existente: 186 produtos e 82 receitas, além de páginas, seções e vínculos. A biblioteca pessoal e a administração usaram sessões e respostas locais simuladas. Nenhuma gravação foi feita no Supabase. A reinspeção final bloqueou todas as requisições externas e utilizou o catálogo já obtido, fontes locais Inter/Inter Tight/DM Serif Display e os estados de imagem indisponível. Uma inspeção anterior carregou parte das imagens externas; a disponibilidade de todos esses servidores não é certificada por esta revisão.

O CAPTCHA não foi validado no domínio de produção: no ambiente local sua verificação ficou indisponível. Login, gravação, compartilhamento, revisão administrativa, importação e sincronização com contas reais não foram certificados pela inspeção local.

## Banco de produção

O CSV entregue após 038 e 039 mostra todas as tabelas/funções esperadas e as assinaturas/permissões das quatro funções novas compatíveis com o código. As tabelas verificadas têm RLS ativo. O CSV contém metadados, não os corpos das funções, nem comprova o resultado dos fluxos autenticados.

A migração `040_epavone_table_privileges.sql` ainda deve ser aplicada manualmente. Ela revoga TRUNCATE, REFERENCES e TRIGGER dos papéis do frontend e PUBLIC no schema público, mantém CRUD e garante `security_invoker=true` na view de preços. O diagnóstico foi ampliado para conferir essa opção. Não reaplique seeds ou as migrações antigas do Yourcipe.

## Integração

1. Aplique 040 e execute novamente o diagnóstico. Confira a ausência dos três privilégios e `view_options.security_invoker=true`.
2. Integre #34, #35, #36 e #37 nessa ordem, usando **Create a merge commit** para preservar a ancestralidade das branches encadeadas.
3. Após cada merge, troque a base do PR seguinte para `main`, aguarde o workflow Verify e não exclua branches enquanto forem base de outro PR aberto.
4. Cada merge em `main` inicia Deploy GitHub Pages. Aguarde a conclusão do deploy final.
5. No site, valide duas contas comuns e uma administradora: login/CAPTCHA, criação/edição/recarregamento, isolamento, conflito de versão, compartilhamento/resgate/revogação, solicitações/revisão, importação em ambiente de teste e sincronização de preços. Não use exclusões permanentes para validar em produção.

A revisão do código e dos layouts foi concluída; a execução de 040 e os testes com contas reais permanecem responsabilidade da validação no projeto Supabase existente.

# Encerramento operacional — ações privadas e aceitação

## Status

Código consolidado e preparado para revisão. **Yourcipe-EPAV ainda não pode ser arquivado com segurança.** Faltam implantação de 041 e frontend, transferência exclusiva do deploy de preços, importação autenticada do lote e aceitação em produção com contas reais. A página antiga deve permanecer operacional até essas verificações. Não arquivar automaticamente.

## Ações do proprietário

| Serviço / tela exata                                                                   | Nome / valor                                                                                                                   | Armazenamento / natureza                                                                  | Motivo e verificação                                                                                                                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase → projeto EPAV → SQL Editor                                                   | Executar `supabase/diagnostic.sql`; conferir 040: grants sem TRUNCATE/REFERENCES/TRIGGER e view com security_invoker=true.     | Resultado de metadados; não secreto.                                                      | Certifica estado real. Não reaplicar 040 nem histórico.                                                                                                             |
| Supabase → SQL Editor                                                                  | Conferir ausência de `epav_planner_workspaces` e RPC; aplicar somente `041_epavone_planner_workspace.sql` após revisar/backup. | SQL versionado; não secreto.                                                              | Planner remoto; contas A/B isoladas, compra cria uma venda, repetição não duplica. Se objeto já existir, comparar definição em vez de executar novamente.           |
| GitHub → Yourcipe-EPAV → Actions → Deploy Swift price sync → menu … → Disable workflow | Desativar workflow antigo; aguardar deploys em andamento terminarem.                                                           | Configuração privada da conta; sem segredo.                                               | Evitar dois proprietários atualizando a mesma função. O scheduler existente continua sendo o único.                                                                 |
| Supabase → Account Settings → Access Tokens → Generate new token                       | `SUPABASE_ACCESS_TOKEN`: token pessoal com escopo no projeto EPAV e Edge Functions read-write (preferir escopo limitado).      | GitHub EPAVOne → Settings → Environments → production → Environment secrets. **Secreto**. | Deploy CLI. Nunca usar chave publishable/service_role. Verificar workflow concluído.                                                                                |
| GitHub EPAVOne → Settings → Secrets and variables → Actions → Variables                | `EPAVONE_BACKEND_DEPLOY_ENABLED=true`, somente após desativar o workflow antigo.                                               | Repository variable; pública/configuração.                                                | Libera deploy manual exclusivo.                                                                                                                                     |
| GitHub EPAVOne → Actions → Deploy EPAVOne Swift price sync → Run workflow              | Executar workflow, confirmar OPTIONS 200 e POST anônimo 401.                                                                   | Sem novo segredo.                                                                         | Atualiza a função existente; não aplica SQL. Se falhar, reverter titularidade conscientemente, nunca manter dois workflows ativos.                                  |
| Supabase → Edge Functions → Secrets                                                    | Conferir `SWIFT_REFERENCE_ZIP_CODE` (CEP EPAV com 8 dígitos), `SWIFT_REFERENCE_REGION`, `SWIFT_PRICE_CRON_SECRET` existente.   | Secrets do projeto; cron secret é **secreto**; CEP/região são configurações.              | Não regenerar cron secret nem criar scheduler durante a migração. Confirmar sync admin, lease e histórico. Segredos padrão Supabase são fornecidos pela plataforma. |
| Cloudflare → Turnstile → widget existente → Settings → Hostnames                       | Autorizar `leo-ytnk.github.io`; mesma site key pública existente.                                                              | Widget; hostname/site key públicos.                                                       | CAPTCHA do cadastro funciona no Pages.                                                                                                                              |
| Supabase → Authentication → Settings / Bot and Abuse Protection → CAPTCHA              | Turnstile e Secret Key correspondente ao widget existente.                                                                     | Somente Supabase; **secreto**.                                                            | Cadastro/login aceitam verificação. Não enviar ao chat nem colocar em VITE.                                                                                         |
| Supabase → Authentication → Sign In / Providers → Email                                | Conferir política de confirmação compatível com emails técnicos YCP, conforme configuração anterior.                           | Configuração Auth, não segredo.                                                           | Cadastro deve devolver sessão utilizável; identificadores técnicos não recebem email. Não alterar política sem avaliar usuários existentes.                         |
| EPAVOne publicado → Conta / Criação → Administração → Importação                       | Preparar produtos oficiais Swift, revisar e confirmar em modo Adicionar novos.                                                 | Sessão admin no navegador; não compartilhar senha.                                        | Até 11 novos itens; existentes ignorados; URLs e imagens oficiais. Depois executar sincronização com CEP.                                                           |
| EPAVOne → Configurações → Dados anteriores preservados                                 | Baixar/revisar snapshot local, se houver.                                                                                      | Arquivo privado do usuário; pode conter dados pessoais.                                   | Identificar rascunhos/vendas locais ausentes do banco, antes da aposentadoria.                                                                                      |

Não é necessária senha do banco, JWT secret, service_role, JWTs pessoais ou outro token no GitHub para este workflow. Não enviar segredos ao assistente. Não há `supabase db push` automático.

## Matriz obrigatória de produção

- Visitante: catálogo, produtos, receitas, busca, seções e links profundos; erro/vazio.
- Conta A: cadastro, guardar credencial, login/senha inválida, recarregar sessão, perfil, criar/editar/excluir conteúdo de teste, biblioteca.
- Conta B: conteúdo de A e workspace A inacessíveis; administrador não deve acessar biblioteca pessoal alheia.
- Compartilhamento: criar código, resgatar com B, copiar, revogar; evitar dados reais destrutivos.
- Solicitações: enviar, acompanhar, cancelar/reenviar, revisar como admin.
- Administração: publicar conteúdo de teste, seções, lote Swift, sincronização controlada e permissões.
- Planner: criar cliente, montar fila, registrar conversa e confirmar compra; conferir `sales` uma vez. Exportar no Writer deve deixar `sales` inalterada.
- Segurança: anônimo sem escrita/RPC privada; usuário comum sem admin; 040/grants/security_invoker auditados.
- Desktop/mobile e claro/escuro: console/network, responsividade, CAPTCHA e Pages publicado.

Registrar somente resultados e IDs de conteúdo de teste; nunca senhas/tokens. Remover conteúdo de teste conforme autorizado e sem tocar dados existentes. Aceitação ainda não realizada com contas reais nesta sessão.

## Aposentadoria

O draft no repositório antigo substitui o Pages por uma única ação para `https://leo-ytnk.github.io/EPAVOne/#/insights` e remove seu workflow de backend. Integrar somente após o checklist acima. Depois verificar Pages antigo, confirmar ausência de pipeline obrigatório e pedir autorização final para Archived. Reverter o draft restaura frontend antigo; os dados continuam no mesmo banco.

## Referências oficiais de configuração

- https://supabase.com/docs/guides/platform/personal-access-tokens
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/functions/deploy

# Yourcipe → EPAVOne: mesmo projeto Supabase

## Base verificada

Inventário do Yourcipe no commit `43fdc43d5a266b9a3c7ac0414ef63bbc7ce2ad12`.
O projeto continua sendo `ytvztfvypiwgnslisxep`. Este PR não executa SQL,
não transfere registros e não modifica usuários, políticas ou funções hospedadas.
Arquivos SQL no repositório indicam o contrato esperado; não comprovam quais
migrações foram aplicadas no projeto hospedado.

## Camada compartilhada

`src/shared/config/supabase.js` concentra URL e chave pública.
`src/shared/services/supabaseClient.js` concentra leituras PostgREST, timeout de
15 segundos, cancelamento e erros com código/status. Repositórios de produto
continuam responsáveis por filtros, relações e paginação. UI usa serviços.
As leituras públicas não enviam Authorization nem dependem de sessão.
Auth e operações de escrita serão implementadas na próxima etapa; este cliente
é um transporte REST e não uma implementação do Supabase Auth SDK.

Configuração no build (opcional, padrão: projeto atual):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: somente chave pública para navegador.

`VITE_CATALOG_URL` e `VITE_CATALOG_PUBLISHABLE_KEY` continuam aceitas.
Cada variável nova tem precedência sobre sua equivalente antiga. Não misture
URL de um projeto com chave de outro. Nunca colocar service_role, senha do
banco ou token de deploy em variáveis VITE.

## Inventário e sequência dos próximos PRs

| Etapa               | Contratos existentes no Yourcipe                                                                                                                | Destino e aceitação                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Conta               | `auth.js`, `credential.js`, `profiles`, Supabase Auth; migrations 002/003/021                                                                   | Conta compartilhada no shell; mesma credencial/senha, nome e papel. Sessão, cadastro, CAPTCHA, logout e preferência `catalog_card_layout`. |
| Organização pública | `catalog_pages`, `catalog_sections`, `catalog_section_recipes`, `catalog_section_products`; migration 031                                       | Insights respeita seções e ordem existentes; preserva catálogo público e filtros.                                                          |
| Biblioteca pessoal  | `categories`, `products`, `recipes`, `recipe_ingredients`, `recipe_categories`, `product_categories`; migrations 004 e seguintes                | Insights permite leitura/criação/edição com `scope=personal` e proprietário original. Testar isolamento entre usuários.                    |
| Compartilhamento    | `recipe_shares`, `recipe_access_grants`; RPCs `activate_recipe_sharing`, `redeem_recipe_share`, `create_recipe_copy`, `revoke_recipe_access`    | Códigos antigos, cópias e revogações funcionam sem recriar registros.                                                                      |
| Solicitações        | migration 007; funções de submissão, revisão, retorno e cancelamento em `catalog.js`                                                            | Histórico e estados preservados; usuário solicita e admin decide pelo servidor.                                                            |
| Administração       | `catalog.js`; publicação, importação, referências/exclusões; migrations 006–012, 025–026, 030–037                                               | Catálogo público, importação e seções editáveis; preservar RPCs e transações. Verificar payloads contra o contrato mais recente.           |
| Preços              | `products_with_price_freshness`, `product_price_history`, `swift_price_sync_runs`, Edge Function `swift-price-sync`; migrations 024/027/028/029 | Reusar função, histórico e agendamento; confirmar estado de produção. Não criar outro scheduler.                                           |
| Vendas              | `sales`; migration 013; `fetchMySales/createSale/updateSale/deleteSale`                                                                         | Planner usa registros existentes. Validar TM, IPC e total com dados reais; não inventar campos ausentes.                                   |
| Transição           | URL e recursos locais do site antigo                                                                                                            | Rotas/linkagem, importação explícita de dados locais se necessária, conferência e retorno à versão anterior.                               |

## Compatibilidade e verificações antes de escritas

1. Conferir esquema, políticas RLS, RPCs e migrações efetivamente aplicados.
   Preparar backup recuperável antes de mudanças no banco.
2. Preservar UUIDs, `owner_id`, códigos e relações. Não reexecutar seeds/imports
   para conectar uma nova interface. Mudanças de esquema devem ser aditivas e
   compatíveis com os dois sites durante a transição.
3. Preservar a conversão `YCP-XXXX-XXXX` → endereço interno
   `@credential.yourcipe.local`. Não alterar confirmação de e-mail durante esta
   etapa: contas usam endereços técnicos não contactáveis. Cadastro precisa do
   fluxo de CAPTCHA existente e das configurações de domínio correspondentes.
4. Auditar sessão: os sites atuais ficam sob a mesma origem GitHub Pages,
   mas o reconhecimento depende de storageKey, SDK e opções compatíveis.
   Testar sessão/logout nos dois sites; não prometer transferência automática.
   Em outra origem, prever novo login. Não transportar tokens em URLs.
5. Inventariar localStorage em `app.js`, `data.js` e `welcome.js` antes de
   migrar preferências/rascunhos. Distinguir dados locais de registros do banco;
   não sobrescrever a biblioteca remota com conteúdo local sem resolução.
6. Usar visitante, usuário A, usuário B e administrador para verificar leitura
   pública, isolamento pessoal, compartilhamento e proibição de escrita pública.
   Esconder ações no frontend não substitui RLS/validações das RPCs.
7. Consolidar a manutenção das migrations/Edge Functions em um único repositório
   quando a administração migrar. Transferir a responsabilidade de deploy de
   forma explícita; não manter pipelines concorrentes para a mesma função.

## Validação e rollback desta etapa

`npm run verify` cobre lint, arquitetura, testes e build. Testes do catálogo
continuam verificando filtros públicos, FK hints, paginação limitada pelo servidor,
timeout e cancelamento. Testes compartilhados verificam configuração antiga/nova,
cancelamento prévio, respostas inválidas e erros HTTP/rede.
Não há validação de login nem escrita no banco nesta etapa. Reverter este PR
restaura o transporte anterior sem rollback de dados. Etapas seguintes precisam
de testes de integração com o esquema real antes de liberar operações de escrita.

## Etapa 2: login existente

O menu Conta abre login por credencial/senha, restaura a sessão do SDK, consulta
`profiles` e permite sair. O cliente Auth usa o storageKey padrão do mesmo projeto
que o Yourcipe e renova tokens. Leituras públicas permanecem anônimas. Logout usa
scope local (sessão atual); na mesma origem/storageKey isso também afeta o Yourcipe.
O callback Auth apenas atualiza estado; consultas de perfil acontecem fora dele.
Admin é lido de profiles; não concede autorização sem políticas do servidor.

O Turnstile reutiliza a site key pública existente e pode ser configurado com
`VITE_TURNSTILE_SITE_KEY`. Após cada tentativa, é necessário um novo token.
Confirme no Cloudflare que `leo-ytnk.github.io` está autorizado no widget e que
sua secret key correspondente permanece configurada no Supabase. Como os dois
sites compartilham hostname, a configuração existente pode ser suficiente.
Para preview em outro hostname, autorize esse hostname no widget. Nunca coloque
secret key do CAPTCHA no frontend. Login por senha não usa URL de callback.

Cadastro continua no Yourcipe nesta etapa. Não há recuperação de senha por
email: os identificadores existentes são técnicos e não recebem mensagens.
Não são necessárias senha do banco, service_role nem senha pessoal para construir
ou publicar o login. Para aceitação real, o proprietário deve entrar com sua conta
no site publicado e conferir nome, sessão após recarregar, erro com senha incorreta,
logout e login de administrador. Essa validação não foi executada com conta real.

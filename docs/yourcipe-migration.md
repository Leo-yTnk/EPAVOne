# Consolidação Yourcipe → EPAVOne

EPAVOne mantém o backend EPAV `ytvztfvypiwgnslisxep`. É a fonte de código operacional para frontend, migrations e `swift-price-sync`. O banco, UUIDs, usuários e contratos permanecem existentes. O encerramento operacional depende do checklist em [migration-closeout.md](migration-closeout.md); código disponível não comprova deploy ou aceitação em produção.

## Inventário comparado

Antigo: `43fdc43d5a266b9a3c7ac0414ef63bbc7ce2ad12`. Base EPAVOne: `288f5798e4656c961e9565b3dd09188a6e58a6ed`.

- Auth: `auth.js`, `credential.js`, `display-name.js`, `signup-retry.js`, widget Turnstile e triggers 002/003. Cadastro passa para Conta; uma tentativa por token, nova verificação em colisão, credencial gerada com Web Crypto e nome normalizado. Perfil é criado pelo trigger existente, sem aceitar papel administrativo no payload.
- Catálogo/criação/admin: contratos de `catalog.js` comparados com `creationRepository`, importação normalizada 031–033 e escritores 038–039. RLS/RPCs continuam autorizando no servidor.
- Backend: função, compartilhado, config, smoke, testes SQL e histórico 002–037 + schema copiados sem alterações. Histórico 038–040 preservado. Não houve execução remota de SQL.
- Preços: mesmo nome de função, CORS, sessão de admin, cron secret, leases e histórico. Não se cria scheduler. Workflow novo é manual e começa bloqueado por variável de titularidade; não executa `db push`.
- Vendas: 013 contém apenas proprietário, data, valor e IPC. Não há cliente histórico. Planner lê todas as páginas com filtro do proprietário. 041 acrescenta workspace por conta, controle de versão e RPC que registra compra confirmada e estado na mesma transação. UUID da interação é o ID da venda; repetição não duplica. Exportação do Writer não chama essa RPC.
- URLs: `YOURCIPE_URL` removida; Conta, Configurações e fallback do Insights levam ao EPAVOne.
- Preferências locais: migração única na mesma origem preserva snapshot para revisão, importa tema somente sem preferência EPAVOne existente e nunca apaga chaves antigas.

## Compatibilidade intencional

`@credential.yourcipe.local`, credenciais `YCP-XXXX-XXXX`, storageKey padrão do SDK Supabase, UUIDs, nomes de FK/RPC, variáveis `VITE_CATALOG_*` e SQL histórico. Auth tokens nunca são copiados pelo migrador de dados locais, incluídos em URLs ou em arquivos de exportação.

## Dados locais

| Chave                          | Destino / classificação                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `yourcipe_products_v1`         | Snapshot de revisão; dados locais podem usar IDs p1 etc., sem correspondência automática com UUID remoto.                 |
| `yourcipe_recipes_v2`          | Snapshot de revisão; não sobrescreve biblioteca remota.                                                                   |
| `yourcipe_favorites_v1`        | Snapshot de revisão; IDs locais não são convertidos por nome.                                                             |
| `yourcipe_profile_v1`          | Snapshot de revisão; perfil autenticado permanece em `profiles`.                                                          |
| `yourcipe_dark_v1`             | Tema importado uma vez somente quando `epavone-theme` não existe.                                                         |
| `yourcipe_week_start_v1`       | Snapshot histórico; Planner usa semana de segunda a domingo.                                                              |
| `yourcipe_vendas_v1`           | Snapshot para conciliação; vendas autenticadas já estão em `sales`; não importa automaticamente por risco de duplicidade. |
| `yourcipe_hidden_v1`           | Snapshot histórico; visibilidade pública vem do banco.                                                                    |
| `yourcipe_sections_v1`         | Snapshot histórico; estrutura vigente vem de `catalog_pages/catalog_sections`.                                            |
| `yourcipe_product_sections_v1` | Snapshot histórico; vínculos vigentes vêm do banco.                                                                       |
| `yourcipe_proteins_v1`         | Snapshot histórico; categorias vigentes vêm do banco.                                                                     |
| `yourcipe_nav_rail_side_v1`    | Snapshot obsoleto; navegação EPAVOne é configurada por seu próprio contrato.                                              |
| `yourcipe_font_size_v1`        | Snapshot obsoleto; não altera tokens do Design System.                                                                    |
| `yourcipe_product_layout_v1`   | Snapshot histórico; perfil e apresentação vigente não são sobrescritos.                                                   |
| `yourcipe_welcome_seen_v1`     | Snapshot obsoleto; onboarding antigo não é executado.                                                                     |

Snapshot em `epavone-legacy-review-v1`, exportável em Configurações. Não é uma importação de biblioteca nem de vendas no banco. Revisar eventuais rascunhos locais antes de aposentar o antigo; em outra origem o storage não é acessível.

## Aceitação

`npm run verify` + evidências de navegador + contas reais A/B/admin. Fixtures não provam a RLS hospedada. Nenhuma migration antiga é reaplicada. Primeiro conferir `diagnostic.sql` e histórico remoto; aplicar somente 041 se ausente, nunca `db push` indiscriminado. 040 foi informada como aplicada anteriormente; confirmar grants e view no diagnóstico, sem reaplicar para garantir.

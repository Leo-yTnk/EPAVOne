# Evidências da consolidação

## Migrado

Cadastro YCP completo no EPAVOne, sem links ao frontend antigo; frontend de conta/biblioteca/criação/admin e integração Writer preservados. Backend `swift-price-sync`, config, smoke, testes SQL e migrations 002–037 + schema transferidos. 038–040 existentes preservadas. Planner autenticado usa workspace próprio, histórico paginado de `sales` e confirmação transacional/idempotente de compra (041).

## Mantido por compatibilidade

Credencial `YCP-XXXX-XXXX`, domínio `@credential.yourcipe.local`, storageKey SDK, UUIDs e contratos Supabase. Todos os 39 arquivos de SQL histórico/função/config compartilhados comparados por SHA-256 estão iguais: [inventário](../backend-migration-inventory.json).

## Removido

`YOURCIPE_URL`, cadastro externo, botão de recursos antigos e fallback para o site antigo. Busca final em `src` encontra apenas domínio técnico, migrador de storage, comentário histórico e documentação. Não existe import/asset runtime do repositório antigo.

## Backend

Código operacional no EPAVOne. Workflow manual exige titularidade exclusiva e PAT; não executa SQL, db push ou scheduler. Deploy atual ainda não foi transferido: o operador precisa desativar o workflow antigo antes de habilitar o novo. Estado do banco não foi alterado nesta sessão.

## Dados locais

Tema importado somente sem preferência nova. Snapshot único de dados locais exportável em Configurações, sem tokens e sem sobrescrever estado novo. Tabela completa de cada chave e destino em [yourcipe-migration.md](../yourcipe-migration.md). Snapshot é para revisão, não representa importação na biblioteca/vendas remotas. Rascunhos e vendas locais encontrados pelo usuário precisam de conciliação antes do encerramento.

## Produtos Swift

Consulta anônima pública retornou 186 produtos ativos. Seleção final: 11 produtos ausentes nessa resposta, com páginas oficiais e imagens vinculadas pelo próprio site Swift. Imagem do espetinho suíno teve timeout no navegador de pesquisa, mas foi confirmada como JPEG 1000×1000 pela leitura HTTP. Lote pronto em Criação → Administração → Importação → Preparar produtos oficiais Swift; modos bloqueados em add, prévia com nomes/páginas/imagens, confirmação explícita e duplicidade conferida de novo contra o contexto administrativo. Nenhum SKU/preço regional inferido. **Importação no banco ainda não executada; exige sessão admin.**

## Testes e evidências

`npm run verify`: lint, checker de arquitetura, **225 testes em 48 arquivos** e build passaram. Testes específicos: CAPTCHA de uso único, colisão de credencial, nome e senhas, credencial após mudança da sessão Auth; SQL transacional com RLS de duas contas, repetição, conflito, rollback, escrita direta/anônima proibida; preservação de storage; contrato Swift e lote sem duplicidade/preços inventados; confirmação administrativa antes de importar.

Screenshots locais em 1440 claro / 390 escuro para cadastro, desempenho remoto simulado e prévia administrativa. Todos sem overflow horizontal ou erros JS. CAPTCHA, contas/administrador e vendas nos screenshots são fixtures: não provam Auth ou RLS hospedadas. Screenshots não são evidências de deploy.

- [Cadastro desktop](signup-1440-light.png), [cadastro mobile](signup-390-dark.png).
- [Planner desktop](planner-fixture-1440-light.png), [Planner mobile](planner-fixture-390-dark.png).
- [Importação desktop](swift-import-fixture-1440-light.png), [importação mobile](swift-import-fixture-390-dark.png).
- [Resultados do navegador](results.json).

HTTP OPTIONS da função publicada retornou 200/ok. O teste de navegador do Pages publicado foi bloqueado por `ERR_EMPTY_RESPONSE` neste ambiente. Não foi certificada a execução publicada das novas mudanças, nem houve login com contas reais. O catálogo público foi consultado por HTTP e não recebeu escritas.

## Ações do proprietário

Lista de serviços, telas, nomes, valores/configurações, armazenamento, natureza pública/secreta e verificações em [migration-closeout.md](../migration-closeout.md). Nenhum segredo deve ser enviado ao chat. Aplicar somente 041 após diagnóstico e conferir 040 sem reaplicar; transferir deploy; publicar frontend; validar A/B/admin; importar lote; revisar dados locais; integrar depois o draft da página de transição.

## Pendências e encerramento

Faltam implantação SQL/frontend, titularidade real do deploy, importação autenticada, conciliação de eventuais rascunhos/vendas locais e matriz de contas em produção. **Yourcipe-EPAV ainda não pode ser arquivado com segurança.** Draft antigo não foi integrado; nenhum arquivamento/exclusão automática realizado.

A revisão automática rejeitou o probe de tabelas privadas e POST da função sem sessão autorizada, por risco de consulta privada/efeitos remotos. Não houve nova tentativa por outro caminho; testes foram mantidos em fixtures locais. Testes privados de produção ficam com o operador autenticado.

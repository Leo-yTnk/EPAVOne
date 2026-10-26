# Planner: conta, fluxo e exclusão de clientes

O Planner autenticado usa o mesmo projeto Supabase e a mesma credencial do EPAVOne. O modo demonstração permanece separado, no navegador; exemplos não são importados automaticamente para a conta.

## Ativação

A integração usa `supabase/041_epavone_planner_workspace.sql`, já existente. Se ainda não foi aplicada, execute **somente essa migration** no SQL Editor do projeto Supabase usado pelo EPAVOne. Não repita migrations históricas. Esta alteração não exige nova migration, segredo nem Edge Function. Não foi possível verificar ou modificar o banco de produção nesta sessão.

Entre na conta pelo botão “Entrar para sincronizar”. Cadastre um cliente, atualize os dados e confirme a persistência em outro dispositivo com a mesma conta. Cada usuário acessa apenas seu workspace, protegido por RLS; gravações passam pela RPC autenticada e usam revisão para impedir sobrescrita concorrente.

## Fluxo

1. Cadastre clientes, preferências e restrições.
2. Adicione clientes à semana e organize titulares e reservas.
3. Prepare a abordagem e registre a conversa.
4. Prepare/confira o Excel no Writer e, após a confirmação da compra, registre o resultado no atendimento. Exportar um pedido não confirma a venda. O resultado confirmado e a venda são salvos na mesma transação.

A tela distingue carregamento, salvamento e indisponibilidade de sincronização. “Atualizar dados” recarrega o workspace e as vendas. Depois de um conflito entre sessões, atualize antes de refazer a alteração. Se a gravação confirmar e apenas a leitura das vendas falhar, o Planner informa que salvou e oferece atualizar o resumo; não repete a operação.

## Exclusão

No perfil, “Excluir cliente” abre a confirmação com o nome e os efeitos da ação. Cancelar não altera dados. Durante a gravação, os controles impedem reenvio e fechamento. Uma falha mantém o cliente e o diálogo, permitindo tentar novamente.

A exclusão remove o perfil, combinados e filas de todas as semanas; limpa também o contexto local de passagem para outros apps quando ele se refere ao cliente. Atendimentos imutáveis e vendas confirmadas permanecem no histórico, incluindo suas observações anteriores. `removedCustomerIds` mantém apenas os identificadores necessários para validar essas referências. A cobertura usa somente clientes atuais; valores e resultados históricos continuam disponíveis. Não há restauração automática do perfil excluído.

## Validação

Testes de interação cobrem confirmação, cancelamento, falha e nova tentativa. Testes de domínio verificam remoção de referências ativas, preservação de resultados e validade do snapshot. Testes do repositório cobrem revisão, troca de conta, conflito e falha na leitura após commit. Os testes SQL executam a migration 041 em PostgreSQL embarcado (PGlite), incluindo isolamento por conta e preservação das vendas durante exclusão. Nenhum dado real de cliente foi usado nos testes.

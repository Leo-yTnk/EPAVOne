# Preços automáticos às 7h, 9h e 14h

Horário de Brasília (America/Sao_Paulo, UTC−3): `0 10,12,17 * * *` no Cron UTC/GMT. Todos os dias, inclusive finais de semana. O processamento começa nesses horários; o término depende do catálogo e da Swift. Não depende de uma aba do site aberta.

## Aplicação no Supabase

1. Conferir o deploy atual de `swift-price-sync`, as migrations 044/045 e CEP/região. Esta configuração não implanta função nem aplica migrations.
2. Em Integrations → Cron, verificar se há outro scheduler externo (fora de pg_cron) para a mesma função e desativá-lo ou transferir sua execução antes de aplicar. Não é possível descobri-lo por SQL.
3. Habilitar Cron se ausente e executar `supabase/diagnostic_swift_price_schedule.sql`. Não compartilhar comandos/headers de jobs, pois podem conter segredos.
4. Executar `supabase/configure_swift_price_schedule.sql`. Se existir exatamente um job Swift, mantém seu comando/autenticação e ajusta o horário, ativando-o. Se já estiver correto, o resultado é o mesmo. Se houver vários, aborta sem alterar nenhum: revisar os jobs e manter somente o responsável por preços.
5. Se não houver job: habilitar pg_net e Vault e cadastrar no Vault `SWIFT_PRICE_CRON_SECRET`, com o **mesmo valor já configurado** nas secrets da Edge Function. Não enviar ao chat nem ao GitHub. Reexecutar a configuração. O job usa a função existente e não uma segunda função.
6. Conferir diagnóstico após a aplicação e após cada horário. Cron com sucesso significa que a chamada foi enfileirada; conferir também `swift_price_sync_runs`, erros da Edge Function e preços de produtos de teste. Se o job antigo era inativo, confirmar que sua pausa operacional terminou antes de aplicar.

Não houve inspeção/aplicação no Supabase hospedado nesta revisão. O script é uma configuração operacional separada, sem número de migration, para não ativar jobs durante testes ou deploy automático. Nenhuma secret é versionada.

A autenticação, lease global, intervalo mínimo, CEP, política de preços e execução em lote da Edge Function permanecem iguais. Um processamento concorrente ou recente pode impedir/pular esta execução; consultar histórico. Lotes grandes ainda devem ser acompanhados para verificar os limites de duração da função. A fila manual por produto do frontend não substitui esse lote automático.

O pg_net armazena temporariamente headers na fila: Vault protege a secret em repouso, mas não elimina a exposição a papéis com acesso à fila. A configuração reaproveita o contrato de cron já usado pela função, sem usar service_role. Verificar acesso de banco conforme a documentação do Supabase.

## Reversão

Para um job existente, restaurar horário/estado anotados antes da aplicação com Cron → Edit. Para um job criado aqui, desativar `epavone-swift-prices-daily`. Não limpar preços ou runs.

## Referências oficiais

- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/cron/quickstart
- https://supabase.com/docs/guides/database/vault
- https://supabase.com/docs/guides/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net-ad6357

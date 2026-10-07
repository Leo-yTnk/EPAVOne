# Planner — modelo de dados e evolução

## Entidades da v1

| Entidade | Campos e regras |
|---|---|
| Cliente | UUID local ou ID demonstrativo; nome, segmento, posição, tags, contexto, observações, preferências/restrições categóricas, intenção, frequência em dias, abordagem |
| Interação | ID, cliente, semana, data local ISO, resultado, observação; valor em centavos/unidades somente em compra medida |
| Combinado | ID, cliente, texto, prazo ISO, concluído |
| Semana | ID = segunda-feira ISO, meta inteira 1–100 |
| Planejamento | Relação semana–cliente única; papel titular/reserva, ordem no array, resultado opcional |
| Referência comercial | ID, título de abordagem, consulta de catálogo, categorias para compatibilidade, principal/complemento; fixture substituível por referências reais |
| Contexto de integração | ID efêmero, cliente/semana, rota de retorno, busca opcional, estado de exportação; memória compartilhada da sessão |

Preferências/tags estão em arrays do cliente no adapter local. Um backend relacional pode normalizá-las em relações, sem exigir essa representação da UI. Snapshot local versionado em `epavone-planner-demo-v1`, com validação antes de ler/gravar; seleção de semana em sessionStorage. A v1 não sincroniza abas concorrentes nem dispositivos. Quando storage falha, memória vale somente enquanto a aplicação está aberta. Não há isolamento por conta no modo demonstração; não importar dados sensíveis como se este adapter fosse armazenamento autenticado.

## Decisões para o backend

1. Clientes, interações, semanas, fila e combinados deverão ter `owner_id`, versões/timestamps de servidor, FK e RLS por proprietário. Definir se carteiras são pessoais ou compartilhadas antes de migrations.
2. Unique `(owner_id, week_start, customer_id)` na fila; posições reordenadas por RPC transacional. Resultado com idempotency key e audit trail; correções geram eventos compensatórios.
3. Datas comerciais usam America/Sao_Paulo; timestamps de auditoria usam UTC. A interface recebe os mesmos DTOs do serviço atual.
4. Reusar `sales` existente após validar o esquema efetivamente instalado e sua semântica. Não criar outra fonte de vendas em paralelo. Interações e venda/pedido são entidades distintas, ligadas por referência externa quando houver confirmação.
5. Produto/campanha deve armazenar referências ao catálogo, não cópias de preço, estoque, imagens ou receitas. Resolver identidade, categorias e disponibilidade em gateway compartilhado; desativação ou mudança de categoria exige reavaliar compatibilidade.
6. Pedido pertence ao Writer. Vínculo futuro: `customerId`, `weekId`, `interactionId`, `writerOrderId` e estado/versionamento. Eventos gerado/enviado/confirmado/cancelado precisam de deduplicação; “gerado” nunca equivale a “comprou”.
7. Cadastro do Excel exige identidade confiável. Nome não é chave única: a v1 exige escolha manual com sala. Evolução: referência estável da carteira e confirmação de divergências, sem transportar CPF/telefone em URL.
8. Não executar SQL/seeds sobre a carteira real até definir migração aditiva, backup, compatibilidade com Yourcipe e testes de RLS. Esta entrega não modifica o Supabase.

A migração Yourcipe está descrita em `docs/yourcipe-migration.md`; este documento adiciona apenas as decisões específicas do Planner.

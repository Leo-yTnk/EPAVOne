# Atualização de preços com progresso

A ação Preços e manutenção consulta até **6 produtos ativos por chamada** à Edge Function existente. Os lotes são enviados em sequência sob a mesma trava global; dentro de cada lote, o servidor usa `SWIFT_PRICE_SYNC_CONCURRENCY` (3 por padrão, limite existente de 10). Para 1.002 produtos com URL, isso reduz as chamadas de atualização de 1.002 para 167, sem contar consultas de status. O ganho de tempo real depende da Swift, do banco e de tentativas adicionais; não foi medido em produção.

A barra mede resultados confirmados sobre o total da fila, incluindo falhas, e apresenta contagens de atualizados, mantidos e falhos. O progresso avança a cada lote confirmado. Produtos sem página Swift são registrados localmente como falhas e não entram na amostra de velocidade. O tempo restante aparece após o primeiro lote remoto confirmado: média móvel do tempo por produto (50% da amostra nova e 50% da anterior) multiplicada pelos produtos restantes com URL. A estimativa é atualizada a cada confirmação, inclui a espera de rede daquele lote e não inclui períodos em que a fila ficou pausada. Enquanto uma execução está pendente, mostra “aguardando confirmação” em vez de uma previsão desatualizada.

A fila fica em memória durante a sessão, inclusive ao navegar por outras páginas; recarregar/fechar o site perde essa fila. Não há novo agendamento nem mudança no cron. Respostas pendentes e perdas de rede consultam a identidade do mesmo lote pelo repository existente. Resultados de outra execução não contam para o lote solicitado. Erros de configuração, sessão, lease ou métricas incompletas pausam a fila. Retomar começa no lote pendente; lotes já confirmados não são repetidos. Falhas por produto com métricas confirmadas permitem consultar os demais.

### Implantação desta melhoria

Não há migration nova. Após o merge, executar **Deploy EPAVOne Swift price sync** no `main` atualizado para publicar o suporte a `productIds`. A seleção aceita de 1 a 6 UUIDs distintos, mantém os filtros de produtos públicos/ativos, autenticação, autorização administrativa, histórico e leases existentes. A API antiga de produto único e a chamada do cron continuam disponíveis. Todos os workers terminam antes de finalizar/liberar a execução, inclusive quando um deles perde o lease.

O frontend envia também `productId` com o primeiro item como proteção se encontrar uma função antiga: ela consulta somente esse produto, nunca o catálogo inteiro. O frontend rejeita as métricas incompletas e orienta publicar a função atual antes de retomar. O último preço válido continua preservado em falhas.

### Verificação dos lotes e da estimativa

Testes simulam 1.002 produtos em 167 chamadas, sem duplicações nem chamadas simultâneas de lotes; previsão por ritmo observado; pausa e retomada; consulta de status da mesma identidade; falhas parciais; páginas ausentes; função antiga; e apresentação da estimativa na interface. O handler real, transpilado com dependências externas simuladas, é exercitado para validar seleção, paralelismo padrão de 3, rejeição antes de adquirir o lease e espera de todos os workers antes da finalização. Esses testes não certificam preços nem desempenho da Swift em produção.

## Dependência da implantação existente

Atualização de 14/10: o deploy no main `c9c9d173` concluiu em 13/10 (run 38445341404). A inspeção histórica abaixo foi anterior a esse deploy. Ver [revisão atual](EPAVONE_REVIEW_2026-10-14.md) e [horários diários](daily-price-schedule.md).

Inspeção dos runs em 13/10/2026: Pages publicou `f30762a` (PR #51), mas o último Deploy EPAVOne Swift price sync foi em 09/10, em `34ce937` (PR #50). A correção de status/replay de #51 ainda precisa ser implantada. O status do workflow não certifica a definição do banco hospedado.

Não há nova migration neste PR. O proprietário confirmou em 13/10/2026 a aplicação das duas migrations pendentes (044/045); não houve inspeção direta do banco hospedado. Para validar em produção, executar **Deploy EPAVOne Swift price sync** no main atual, conforme `docs/creation-sync-review.md`. Depois de publicar este frontend, abrir Preços e manutenção com admin e verificar contagens, falhas e preços. Sem acesso ao banco/conta de produção, não foi feita sincronização real nem certificada disponibilidade da Swift.

## Layout

Bibliotecas pessoais/públicas e compartilhadas usam grade adaptativa com miniatura, dados e ações na mesma unidade. Bibliotecas pessoais/públicas mostram 48 itens por padrão e permitem 24/48/96. Compartilhadas têm busca; solicitações combinam busca e status e usam duas colunas quando cabe. Navegação, títulos, cards de operação e administração usam espaços menores, preservando o DS, a costura e os temas existentes.

## Verificação

Testes cobrem fila sequencial, progresso real, consulta pendente automática, duplicação de cliques, conflito com outra execução, falhas parciais, pausa/retomada, quantidade por página e filtros. A fixture do workflow visual acompanha o novo serviço sem chamar a função hospedada. A verificação visual local não foi executada: o ambiente não disponibiliza o controle de navegador previsto para QA. Portanto, responsividade e aparência precisam de revisão visual no workflow/preview; os testes DOM não substituem essa revisão.

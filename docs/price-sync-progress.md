# Atualização de preços com progresso

A ação Preços e manutenção agora consulta um produto ativo por chamada à Edge Function. O catálogo não fica inteiro dentro do limite de duração de uma chamada HTTP. A fila fica em memória durante a sessão, inclusive ao navegar por outras páginas; recarregar/fechar o site perde essa fila. Não há agendamento novo ou mudança na execução via cron.

A barra mede resultados confirmados sobre o total da fila, incluindo falhas, e apresenta contagens de atualizados, mantidos e falhos. Produtos sem página Swift aparecem na lista de falhas e não recebem preços inventados. Respostas pendentes e perdas de rede acionam consultas automáticas da mesma identidade pelo repository existente. Execuções concorrentes não são contabilizadas como resultados do produto solicitado. Erros de configuração, sessão, lease ou resposta inválida pausam a fila. Retomar começa pelo item pendente; itens já concluídos não são repetidos. Falhas por produto com métricas confirmadas permitem consultar os demais.

## Dependência da implantação existente

Atualização de 14/10: o deploy no main `c9c9d173` concluiu em 13/10 (run 38445341404). A inspeção histórica abaixo foi anterior a esse deploy. Ver [revisão atual](EPAVONE_REVIEW_2026-10-14.md) e [horários diários](daily-price-schedule.md).

Inspeção dos runs em 13/10/2026: Pages publicou `f30762a` (PR #51), mas o último Deploy EPAVOne Swift price sync foi em 09/10, em `34ce937` (PR #50). A correção de status/replay de #51 ainda precisa ser implantada. O status do workflow não certifica a definição do banco hospedado.

Não há nova migration neste PR. O proprietário confirmou em 13/10/2026 a aplicação das duas migrations pendentes (044/045); não houve inspeção direta do banco hospedado. Para validar em produção, executar **Deploy EPAVOne Swift price sync** no main atual, conforme `docs/creation-sync-review.md`. Depois de publicar este frontend, abrir Preços e manutenção com admin e verificar contagens, falhas e preços. Sem acesso ao banco/conta de produção, não foi feita sincronização real nem certificada disponibilidade da Swift.

## Layout

Bibliotecas pessoais/públicas e compartilhadas usam grade adaptativa com miniatura, dados e ações na mesma unidade. Bibliotecas pessoais/públicas mostram 48 itens por padrão e permitem 24/48/96. Compartilhadas têm busca; solicitações combinam busca e status e usam duas colunas quando cabe. Navegação, títulos, cards de operação e administração usam espaços menores, preservando o DS, a costura e os temas existentes.

## Verificação

Testes cobrem fila sequencial, progresso real, consulta pendente automática, duplicação de cliques, conflito com outra execução, falhas parciais, pausa/retomada, quantidade por página e filtros. A fixture do workflow visual acompanha o novo serviço sem chamar a função hospedada. A verificação visual local não foi executada: o ambiente não disponibiliza o controle de navegador previsto para QA. Portanto, responsividade e aparência precisam de revisão visual no workflow/preview; os testes DOM não substituem essa revisão.

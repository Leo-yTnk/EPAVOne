# Auditoria das transições de estado

Revisão de 25/10/2026, baseada no EPAVOne atual. O repositório Yourcipe foi consultado para confirmar a migração; nenhuma alteração foi aplicada nele.

A [segunda revisão de fluidez e desempenho](motion-performance-review.md) registra a comparação entre builds, as notas de custo adicional e a correção da validação indevida ao alternar a conta.

## Lacunas corrigidas

| Ponto observado | Antes | Agora |
| --- | --- | --- |
| Busca, filtros e paginação de produtos | Só a primeira montagem da coleção tinha entrada CSS | A nova coleção entra em 220 ms; consultas com os mesmos IDs e ordem não repetem a animação |
| Busca e filtros das receitas | A grade era substituída imediatamente | Entrada de 4 px e opacidade 0,85 → 1 no contêiner de resultados |
| Busca na Home do Insights | Conteúdo e estado vazio mudavam abruptamente | A transição acompanha mudanças reais nas seções e nos itens |
| Carrossel → grade e recolhimento | Mudança imediata de apresentação | Entrada vertical curta na trilha; mantém os mesmos cards, ações e foco |
| Conta: entrar, cadastrar, sessão e credencial | Troca direta de formulário | Movimento horizontal de 6 px; voltar ao login inverte a direção |
| Áreas administrativas | O seletor trocava o conteúdo diretamente | Chegada vertical do painel, com a navegação estável |
| Comparação de duplicatas | A comparação surgia sem transição | Entrada na abertura e na chegada dos ingredientes originais |
| Biblioteca de criação | Busca, filtros, paginação e carregamento trocavam o bloco diretamente | Entrada única do bloco de resultados, sem animações por card |
| Carteira do Planner | Busca e paginação trocavam os clientes diretamente | Entrada do bloco da carteira ao mudar os IDs ou sua ordem |
| Barras de progresso | A largura saltava a cada atualização | O preenchimento interpola com `scaleX` em 220 ms; texto e atributos acessíveis mudam imediatamente |

As transições horizontais existentes dos detalhes foram preservadas. Rotas, indicadores, menus, seletores, feedback de pressão, filtros mobile, abertura de diálogos e gavetas e etapas do Writer já tinham movimento. Não foram adicionadas animações por digitação dos campos, por card ou em valores numéricos de negócio.

## Limites e comportamento

- A ação acontece imediatamente. Não há espera pela animação para exibir ou usar os novos controles.
- As coleções usam uma única animação, independentemente da quantidade de cards. A geometria real da grade/carrossel é aplicada imediatamente; não há interpolação da altura nem simulação de movimento de cada card entre posições.
- As animações de conteúdo anteriores são canceladas ao trocar rapidamente, redimensionar, desmontar ou mudar a preferência de movimento. Sem Web Animations API, os controles continuam disponíveis normalmente.
- Movimento reduzido do sistema e das Configurações desativa os novos movimentos. As barras também respeitam ambas as preferências.
- Nenhuma dependência de produção foi adicionada. Sem blur, `transition: all`, clones ou `will-change` permanente.
- Registro desta etapa: o fechamento ainda era imediato. A [revisão posterior de diálogos](insights-dialogs-and-performance.md) adiciona uma saída visual de 150 ms, com interação e foco liberados imediatamente. Menus e disclosures continuam com fechamento imediato.
- As novas chegadas usam os tokens de duração e easing do Design System. A primeira apresentação do progresso usa `@starting-style` onde disponível; a atualização entre valores funciona sem essa melhoria.

## Validação reproduzível

Resultado desta revisão: 344 testes em 75 arquivos, lint sem erros, arquitetura e build aprovados. O aviso de console já existente em `scripts/review-migration.mjs` permanece. Os oito cenários Chromium passaram sem exceções de JavaScript ou overflow horizontal; capturas de 390 px/claro e 1440 px/escuro foram inspecionadas visualmente.

`npm run verify` executa lint, arquitetura, testes e build. Os testes de interação verificam o foco ao expandir, consultas equivalentes, estados vazios, direção da conta, cancelamento e preferências de movimento.

`REVIEW_BROWSER=/caminho/do/chromium node scripts/review-state-motion.mjs` verifica o navegador em 320, 390, 768 e 1440 px nos temas claro e escuro. Exercita busca, estado vazio, limpeza, expansão/recolhimento, preferências local/sistema, conta, foco e overflow. Também mede o preenchimento intermediário da barra e verifica a atualização imediata do valor acessível. Usa catálogo simulado e não envia escritas remotas.

Não certifica serviços autenticados, preços atuais, FPS em aparelho físico ou Safari/iOS.

# Diálogos, contêineres e microtravamentos — 25/10/2026

O [refino posterior dos cards](insights-card-refinement.md) ajusta padding, botões, fotografia de produto e proporção da abertura da receita. As medições abaixo registram a etapa de desempenho anterior a esse refino visual.

## Resultado funcional

Correções sobre a versão já publicada pelo PR #68 (`16460d12de5081746ceeb0489436281ab5fac4cb`). Nenhum processo de negócio, preço, importação ou banco de dados foi alterado.

### Diálogos e gavetas

- A chegada dos diálogos agora funciona também sem origem de toque/foco válida: 220 ms, opacidade 0,6 → 1 e deslocamento vertical de 16 px, sem escala ou deformação. Em folhas que ocupam a largura inteira, o deslocamento horizontal é zero.
- Saída visual de 150 ms para diálogos e gavetas. `ModalPresence` preserva o último subtree durante a saída, sem clonar DOM. O callback de fechar, a liberação da rolagem e o retorno do foco continuam imediatos.
- Durante a saída, a superfície é `inert`, `aria-hidden` e não recebe eventos. Select, Menu e Tooltip portaled dentro do modal desaparecem imediatamente; não ficam controles soltos no body.
- Reabrir durante a saída cria uma instância limpa, sem reutilizar valores antigos do formulário. Timers e listeners são removidos ao concluir, reabrir ou desmontar. Sem Web Animations API ou com movimento reduzido, a saída é imediata.
- Corrigido um problema de foco: `useModalLayer` refazia o ciclo de foco/scroll lock quando o pai fornecia um novo callback `onClose`. Agora o listener usa a versão atual do callback sem desmontar o gerenciamento do modal a cada renderização.

### Padding e caixas

- Superfícies públicas do Insights usam padding de 24 px no desktop e 16 px no mobile. A geometria dos cards compactos de receita continua própria, com seus recuos menores.
- O modo compacto ajusta o padding padrão do Card em vez de sobrescrever `--container-padding` de componentes que já definem seu recuo. Isso elimina o aumento indevido de padding em cards mobile.
- Removida uma regra responsiva concorrente dos diálogos. Header e conteúdo do detalhe compartilham a mesma variável de recuo: 24 px no desktop e 16 px no mobile.
- Raios das imagens de abertura são derivados do raio externo e do recuo. O espaço inferior mobile soma o recuo e a safe area; as ações não ficam sobre o indicador do sistema.
- A reserva da barra de rolagem evita que abrir/fechar um modal redimensione os cards ao fundo. O overlay cobre `100vw`, incluindo a faixa reservada, e a folha mobile cobre a largura inteira do viewport.

### Fontes de microtravamentos tratadas

- Costuras SVG: leituras de estilo são agrupadas antes das escritas de uma mesma notificação de ResizeObserver. A mesma dimensão não repete leituras nem escritas.
- Contornos: trigonometria unitária pré-calculada e cache limitado a 256 geometrias compartilhadas. As coordenadas e o limite geométrico do contorno permanecem iguais.
- Costuras distantes da tela têm apenas o contorno CSS de fallback. Um único IntersectionObserver inicia a geometria SVG a 600 px do viewport e suspende observações de tamanho ao afastar o card. Conteúdo, ações e todos os resultados continuam presentes; não há paginação ou alteração da altura dos cards.
- Blocos de resultados maiores que duas telas atualizam diretamente, evitando promover um catálogo inteiro para uma superfície animada de opacity/transform. Coleções menores mantêm a chegada.
- Cards de receita e produto usam memoização: abrir detalhes não exige renderizar novamente todos os cards cujas props não mudaram.
- Busca rápida: a chegada vertical em andamento continua até a posição final, sem voltar para 4 px e opacidade 0,85 a cada tecla. Os resultados continuam sendo atualizados imediatamente.

## Verificações

- `npm run verify`: 353 testes em 77 arquivos, arquitetura e build aprovados. Permanece o aviso preexistente de console no script de migração.
- Oito cenários públicos de estados: 320/390/768/1440 px, claro/escuro; sem exceções JavaScript.
- Mais oito cenários de detalhes e caixas, com imagens controladas, nomes longos, densidade confortável/compacta, texto ampliado, histórico receita/produto, entrada e saída, retorno de foco e movimento reduzido. Verificam simetria dos recuos, alinhamento do header, ausência de overflow largura estável do catálogo ao abrir e preparação das costuras ao rolar até o último card.
- Capturas mobile e desktop inspecionadas. Fixtures isoladas, sem escrita remota. Não substitui Safari/iPhone físico ou o catálogo autenticado real.

## Comparação de desempenho

Build de produção anterior ao reparo versus build corrigido. A mesma instrumentação e fixtures em ambos: 120 receitas, 48 produtos, duas larguras (390/1440 px), CPU normal ou 4× limitada, três pares por cenário, ordem alternada. Cada execução mantém o roteiro anterior de busca, carrossel e conta e acrescenta quatro aberturas/fechamentos de receita.

Métrica: `TaskDuration` da thread principal pelo DevTools. O tempo da fase de detalhes inclui as quatro aberturas e fechamentos. Isso mede tarefas de execução/estilo/layout no ambiente headless, não CPU total do aparelho, GPU ou bateria. Long tasks são tarefas acima de 50 ms; os intervalos de rAF têm instrumentação igual nas duas versões.

Foram concluídas 24 execuções finais sem exceções JavaScript e com zero animações ativas ao final da acomodação. Os números abaixo usam as medianas das três execuções por versão; a redução percentual é a mediana dos pares.

| Cenário | Tarefas no roteiro: anterior → corrigido | Redução pareada | Quatro aberturas/fechamentos: anterior → corrigido | Redução pareada dos detalhes |
| --- | --- | --- | --- | --- |
| 390 px · CPU normal | 1569 → 1035 ms | 32,4% | 620 → 384 ms | 36,6% |
| 390 px · CPU 4× limitada | 6923 → 5114 ms | 27,2% | 2569 → 1743 ms | 27,7% |
| 1440 px · CPU normal | 1619 → 1217 ms | 25,1% | 681 → 464 ms | 31,9% |
| 1440 px · CPU 4× limitada | 7761 → 5750 ms | 25,9% | 3068 → 2062 ms | 32,8% |

| Cenário | Intervalo de quadros P95: anterior → corrigido | Mediana da maior tarefa isolada: anterior → corrigido | Bloqueio acima de 50 ms no roteiro: anterior → corrigido |
| --- | --- | --- | --- |
| 390 px · normal | 16,8 → 16,7 ms | 66 → 66 ms | 43 → 16 ms |
| 390 px · 4× | 116,6 → 66,6 ms | 398 → 318 ms | 2504 → 941 ms |
| 1440 px · normal | 33,3 → 33,3 ms | 74 → 58 ms | 47 → 8 ms |
| 1440 px · 4× | 116,6 → 66,6 ms | 361 → 353 ms | 2801 → 1429 ms |

O roteiro desta revisão inclui quatro diálogos de receita e é diferente do usado na primeira nota de CPU. Os tempos absolutos não devem ser comparados diretamente com o relatório anterior. O stress continua apresentando tarefas longas; não se trata de 60 FPS constantes em toda a simulação.

Na investigação intermediária, a maior pausa de desktop estava na limpeza da busca que remontava 120 receitas. Isso motivou a preparação de costuras por proximidade e o limite para animar um bloco inteiro maior que duas telas. Os resultados desta tabela foram medidos **depois** dessas duas alterações. O diagnóstico separa essa pausa de busca da fase de abrir/fechar diálogos.

Dados brutos, reduções pareadas e dispersão em `performance/insights-dialogs-2026-10-25.json`. As métricas de tarefas em repouso também estão no arquivo; zero animações ativas não significa CPU total zero.

A CPU limitada é uma simulação e tem mais dispersão entre execuções. Não se conclui que todos os microtravamentos em todo aparelho desapareceram. As medições e as limitações devem ser lidas junto com os dados brutos.

Reprodução: `BASELINE_DIST=/caminho/build-anterior/dist BENCH_DETAILS_ROUNDS=4 REVIEW_BROWSER=/caminho/chromium node scripts/benchmark-state-motion.mjs`. Para as caixas: `REVIEW_BROWSER=/caminho/chromium node scripts/review-insights-containers.mjs`.

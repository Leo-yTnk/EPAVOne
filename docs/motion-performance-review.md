# Revisão de fluidez e custo das animações — 25/10/2026

## Resultado

Revisão da implementação local `768369a`, comparada ao commit anterior `4e54e4500861cb3611918a5928e221ef739916d6`. A versão final inclui também a correção do tipo do botão de alternar conta descrita abaixo. As animações foram mantidas; não houve otimização especulativa ou nova dependência de produção.

## Revisão visual

- Verificados busca e estado vazio, consultas equivalentes, expansão/recolhimento, entrar/cadastrar, fechamento e retorno de foco, preferências local e do sistema, overflow e interrupções rápidas.
- Buscas rápidas mantêm no máximo uma animação ativa no contêiner. A matriz de transformação mantém escala 1 em ambos os eixos: os textos não esticam.
- Não foi identificada sobreposição persistente ou rebote indevido nos cenários examinados. Depois da acomodação, as animações são liberadas.
- Foi encontrado um problema real de fluidez: o botão de alternar login/cadastro, dentro do formulário, usava o tipo padrão de envio. Isso disparava a validação nativa e abria um aviso sobre o formulário durante a troca. O botão agora é explicitamente `type="button"`. O navegador confirma zero eventos `invalid` ao alternar os modos.
- A geometria da grade/carrossel continua sendo aplicada imediatamente. A animação suaviza a chegada do conteúdo; não interpola altura nem transporta cada card entre posições.

## Como o desempenho foi medido

- Builds de produção, servidos localmente, com a mesma versão de Chromium headless e a mesma carga nas duas versões; sem Vite dev/HMR durante a coleta.
- Catálogo controlado: 120 receitas e 48 produtos. Imagens ausentes, mas cards, texto e costuras reais. Não há rede de produção, autenticação real ou escrita remota.
- Duas larguras: 390 e 1440 px, altura 900 px. CPU sem limitação e simulação de CPU 4× mais lenta pelo DevTools.
- Três pares por cenário; a ordem anterior/atual alterna nas repetições. Total de 24 execuções no build final. As rotas e a conta são aquecidas antes da medição.
- Cada execução faz dez mudanças de busca a cada 160 ms, oito expansões/recolhimentos a cada 180 ms e seis alternâncias de conta a cada 150 ms. As ações incluem interrupções antes dos 220 ms de duração das novas animações. Há 450 ms para acomodação e mais 1,5 s de repouso.
- O transporte de dados é simulado identicamente. A instrumentação de `requestAnimationFrame` e tarefas longas também é a mesma nas duas versões.
- O contador agregado de CPU dos processos do Chromium foi descartado porque não fornece dados confiáveis neste ambiente. A métrica usada é `Performance.getMetrics → TaskDuration`: tempo ocupado por tarefas na thread principal, incluindo execução, estilo e layout. **Não é a CPU total do navegador ou do aparelho.**
- Ocupação = `100 × TaskDuration / tempo decorrido`. O acréscimo é calculado por par e resumido pela mediana; não se subtraem medianas de amostras distintas para construir esse valor.

## Escala de 1 a 100

É um índice operacional desta revisão, não um benchmark padronizado: `nota = limitar entre 1 e 100 (arredondar o acréscimo mediano de ocupação em pontos percentuais))`. Um valor próximo de 1 indica pouco acréscimo; 100 representa uma thread principal adicional inteiramente ocupada. Não significa “a CPU do aparelho aumentou X%”. O limite inferior 1 também cobre diferenças negativas ou indistinguíveis de ruído.

A nota geral usa a maior nota entre as medianas dos dois cenários sem limitação de CPU, adotando o resultado mais conservador. Os cenários com limitação são reportados separadamente, pois o throttling simula lentidão de agendamento e não mede um processador físico.

Critério operacional de custo excessivo: acréscimo mediano de pelo menos 15 pontos de ocupação, ou aumento de pelo menos 50% do tempo de tarefas acompanhado de piora consistente de fluidez. Esses limites são critérios de engenharia para esta decisão, não normas universais.

**Nota final: 3/100 (baixo) na CPU normal; até 5/100 nos cenários com limitação.** O custo não atingiu o critério operacional de excesso. As animações foram mantidas. A única alteração de produção desta revisão foi corrigir o tipo do botão de alternar a conta.

| Cenário | Tarefas: anterior → final (medianas) | Acréscimo de ocupação (pares) | Acréscimo relativo de tempo (pares) | Nota |
| --- | --- | --- | --- | --- |
| Mobile 390 px · normal | 809 → 944 ms | +2,77 p.p. | +14,0% | 3/100 |
| Mobile 390 px · CPU 4× mais lenta | 4057 → 4426 ms | +4,76 p.p. | +13,7% | 5/100 |
| Desktop 1440 px · normal | 845 → 942 ms | +2,28 p.p. | +12,5% | 2/100 |
| Desktop 1440 px · CPU 4× mais lenta | 4241 → 4458 ms | +3,20 p.p. | +5,1% | 3/100 |

A diferença mediana entre pares não equivale necessariamente à diferença entre as medianas das colunas. No roteiro de aproximadamente 4,6 s sem limitação, o acréscimo mediano de tempo de tarefas foi de 116 ms e 106 ms. O aumento relativo de tempo de tarefa não deve ser confundido com pontos percentuais de ocupação.

| Cenário | Intervalo de quadros P95: anterior → final | Quadros acima de 34 ms: anterior → final | Faixa do acréscimo entre os três pares |
| --- | --- | --- | --- |
| 390 px · normal | 16,8 → 16,8 ms | 2 → 2 | 2,29 a 2,87 p.p. |
| 390 px · 4× | 133,3 → 133,4 ms | 19 → 19 | -0,00 a 6,75 p.p. |
| 1440 px · normal | 16,8 → 16,8 ms | 3 → 4 | 0,62 a 2,68 p.p. |
| 1440 px · 4× | 116,7 → 100,0 ms | 21 → 20 | -0,87 a 6,39 p.p. |

O P95 normal permaneceu em 16,8 ms, mas houve alguns quadros lentos nas duas versões. No stress com CPU limitada, já havia pausas longas na versão anterior: não é uma experiência de 60 FPS constante nesse cenário. A dispersão maior no stress impede concluir uma melhoria no desktop a partir dos valores isolados.

Todas as execuções finais terminaram com zero animações ativas após a acomodação, sem exceções JavaScript. Cada execução da versão final acionou 25 chegadas novas de conteúdo, contra zero nessa categoria na versão anterior. Isso confirma que o teste exerceu as alterações, em vez de medir apenas repouso. A coleta em repouso ficou registrada nos dados brutos e não sustenta uma afirmação de CPU total zero.

## Limites da conclusão

As três repetições permitem uma comparação prática e mostram a dispersão, mas não estabelecem uma significância estatística ou um intervalo de confiança. O teste headless usa renderização do ambiente de execução e não valida GPU, temperatura, bateria, Safari/iPhone físico, imagens grandes ou extensões instaladas no aparelho do usuário. P95 de intervalos de rAF não é garantia de FPS constante; quadros mais lentos fora do percentil continuam registrados nos dados brutos.

## Verificação e reprodução

- `npm run verify`: 344 testes em 75 arquivos; lint sem erros, arquitetura e build aprovados. Permanece o aviso anterior em `scripts/review-migration.mjs`.
- `scripts/review-state-motion.mjs`: oito combinações de 320/390/768/1440 px com claro/escuro, sem exceções JavaScript ou overflow; verificações de foco, escala, cancelamento, liberação das animações e validação de formulário. Capturas intermediárias de busca, grade e conta foram inspecionadas.
- Execute o benchmark a partir da raiz do repositório, com `dist` da versão atual e o build anterior separado: `BASELINE_DIST=/caminho/anterior/dist REVIEW_BROWSER=/caminho/chromium node scripts/benchmark-state-motion.mjs`. Requer Playwright disponível no ambiente de desenvolvimento; não foi adicionado como dependência de produção.
- As medições finais e o resumo estão em `performance/motion-2026-10-25.json`.

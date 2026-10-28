# Modos de desempenho — 28/10/2026

Configurações → Desempenho e movimento permite escolher Alto desempenho, Equilibrado (padrão) e Fabuloso. A escolha é aplicada imediatamente e salva neste navegador. As restrições de acessibilidade prevalecem; Alto desempenho não altera o valor salvo de Reduzir animações.

- **Alto desempenho:** sem animações ou rolagem suave; carrosséis com janela pequena, grades com cards montados perto da tela (120px de margem), imagens sob demanda.
- **Equilibrado:** navegação/controles/camadas leves, sem entradas de resultados, shimmer, crescimento de gráficos, expansão de diálogos ou coreografia de largura; janela horizontal com mais reserva, grades com margem de 600px.
- **Fabuloso:** todos os efeitos disponíveis, com as proteções anteriores para superfícies grandes; todos os cards e imagens da página atual carregados. Continua sendo o modo mais pesado.

Produtos e receitas continuam em uma página. A busca de produtos inclui todos os registros, usa índice normalizado reutilizável e aguarda 150ms nos modos otimizados. Limpar é imediato. O cache público em memória compartilha leituras entre Home/Produtos/Receitas e estrutura, revalida após 60s e é invalidado após gravações e atualização de preços. Conteúdos pessoais continuam fora desse cache.

## Comparação medida

Medianas de três execuções por condição. Base `909d5a1`, builds de produção, Chromium 153 headless, CPU 6×, viewport de 601×1007 CSS px, DPR 1,33, heap JavaScript limitado a 512MB, 1.002 produtos sintéticos em oito categorias e sem fotos. Servidor local e respostas REST controladas; sem latência de internet. Cada execução começa com um contexto novo. O tempo de busca inclui automação, debounce, atualização da contagem e dois quadros; não é INP de usuários reais.

| Condição | Catálogo pronto | Busca típica¹ | Pior busca observada | Elementos na página |
| --- | ---: | ---: | ---: | ---: |
| Base anterior | 7,34s | 0,97s | 7,20s | 17.284 |
| Alto desempenho | 1,41s | 0,51s | 1,04s | 834 |
| Equilibrado | 1,50s | 0,48s | 1,37s | 1.122 |
| Fabuloso | 6,80s | 0,98s | 7,57s | 17.284 |

¹ Mediana das medianas das nove buscas de cada execução. O roteiro foi repetido no build final dos modos otimizados. Os resultados brutos estão em `results.json`. A dispersão de três amostras não permite afirmar que Equilibrado pesquisa mais rápido que Alto desempenho.

O modo Alto desempenho reduziu os elementos em aproximadamente 95% e o tempo até o catálogo ficar pronto em aproximadamente 81% neste cenário. A meta de menos de 2s foi atingida localmente; a meta de buscas abaixo de 200ms ainda não foi atingida sob CPU 6×. Persistem tarefas de centenas de milissegundos durante substituições grandes. O Fabuloso conserva o custo de montar o catálogo completo.

**Limites:** CPU 6× não foi calibrada ao Helio P22T. O limite de heap não reproduz os 3GB físicos nem o consumo do Android, GPU, navegador, imagens ou outros apps. Não houve medição do tablet real, temperatura, bateria ou importação de Excel. Heap usado sem coleta de lixo padronizada não representa consumo total de RAM; não usamos esse valor para aprovar o A7 Lite.

## Verificação

- `npm run verify`: 518 testes em 101 arquivos; lint sem erros (um aviso de console já existente), arquitetura, tokens e build aprovados.
- Testes novos: persistência/validação dos modos, prioridade de acessibilidade, montagem/desmontagem por visibilidade, preservação e transferência de foco, chegada a itens distantes por teclado/rolagem, imagens lazy/eager, debounce, cache público, revalidação e invalidação.
- Revisão no Chromium: carrossel até o último produto com End/Home, expansão da seção, rolagem até o último card e abertura/fechamento de detalhes; troca dos três modos pela interface, persistência após reload, zero animações em execução em Alto desempenho e prioridade de Reduzir animações sobre Fabuloso. Inspeção visual em viewport de tablet.

Para reproduzir, execute `npm run build` e, com Playwright e Chromium disponíveis:

```sh
BENCH_MODE=performance REVIEW_BROWSER=/caminho/chromium node scripts/benchmark-performance-modes.mjs
BENCH_MODE=balanced REVIEW_BROWSER=/caminho/chromium node scripts/benchmark-performance-modes.mjs
BENCH_MODE=fabulous REVIEW_BROWSER=/caminho/chromium node scripts/benchmark-performance-modes.mjs
```

`BENCH_DIST` permite indicar um build anterior; `BENCH_OUTPUT` escolhe a pasta para JSON/PNGs e `REVIEW_PLAYWRIGHT` pode indicar o módulo do ambiente. O padrão de saída é `/tmp/epav-performance-modes`. Execute um benchmark de cada vez, sem testes concorrentes. O script permite somente GET nas rotas do catálogo e usa dados sintéticos, sem gravar no Supabase.

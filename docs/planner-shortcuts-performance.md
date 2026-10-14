# Planner, atalhos e carregamento

## Experiência

A visão geral do Planner apresenta três etapas com contagens reais: conhecer os clientes, organizar a semana e preparar/conversar. A ação sugerida muda conforme a carteira e a fila. Semanas diferentes da atual oferecem revisão, sem convidar a registrar um atendimento fora da semana permitida. Os botões de titular/reserva indicam o papel de destino.

Todos os apps, incluindo Home e Configurações, têm um botão **Atalhos**. Clique direito ou toque prolongado de 550 ms em uma área livre abre o mesmo menu junto ao ponto de interação. Nos cards de clientes e nas entradas da fila, o menu oferece ações daquele cliente: perfil, inclusão na semana, atendimento, posição e papel, respeitando os bloqueios existentes. As ações originais continuam disponíveis.

Links, imagens, campos, controles, conteúdo editável e texto selecionado mantêm as ações nativas do navegador. Movimento acima de 10 px, rolagem, cancelamento ou soltura antecipada cancelam o toque prolongado. Menus usam Portal e o posicionamento compartilhado, com setas/Home/End, Escape e retorno de foco ao botão. Navegação e clique fora fecham o menu.

## Desempenho

Insights, Writer, Configurações e o diálogo de Conta passam a usar carregamento por demanda. O Writer só monta no primeiro acesso, conservando a mesma instância quando o usuário troca de app. A restauração do Excel ocorre nesse primeiro acesso; arquivo, pedido e etapas continuam usando os serviços existentes. Nenhuma fórmula, regra de importação/exportação ou processo do Supabase foi alterado.

Os escores da carteira são calculados uma vez por cliente antes da ordenação. Na visão geral, candidatos já planejados são excluídos antes do cálculo. Isso mantém a ordenação comercial, evitando recalcular escores em cada comparação.

Medição com `npm run build`, sobre a base `3d920ad` e esta alteração, mesma instalação de dependências:

| Recurso inicial           |     Antes |    Depois |
| ------------------------- | --------: | --------: |
| JavaScript principal      | 472,87 kB | 289,87 kB |
| JavaScript principal gzip | 141,56 kB |  84,30 kB |
| CSS principal             |  87,09 kB |  53,18 kB |

Redução aproximada de 39% no JS inicial e 40% no JS inicial comprimido. Os módulos continuam sendo baixados ao abrir cada app: estes números medem o pacote inicial, não uma redução equivalente no tempo total de todos os fluxos. Não constituem medição de Lighthouse ou de rede real.

## Dispositivos com menos recursos

- Todos os cards compartilham um único `ResizeObserver` para manter suas costuras nas dimensões corretas. Cada dimensão só gera escrita de estilo quando muda; ao desmontar um card, sua referência é removida, e o último card libera o observador.
- Os relógios visuais da Home e do Writer suspendem seus timers com a aba oculta. O relógio do Writer também para ao trocar de app, sem desmontar o pedido, e atualiza a data imediatamente ao voltar. Essa pausa não se aplica a Auth, sincronização, salvamentos ou exportações.
- Validações do Writer reutilizam o resultado enquanto formulário, pedido e data forem os mesmos. A verificação de expiração ao navegar continua consultando a data atual.
- Não há redução automática de imagens, fontes, costuras ou animações por estimativa de capacidade do dispositivo. Os ganhos vêm de menos carregamento e processamento repetido.

## Validação

`npm run verify` reúne lint, arquitetura, testes e build. Os testes novos cobrem gestos, cancelamento por rolagem/movimento, menu aninhado, preservação do menu nativo, posicionamento, teclado/foco, orientação do Planner e o ciclo Home → Writer → Insights → Writer sem remontar ou perder o estado do pedido.

Resultado final: lint sem erros (um aviso já existente em script), arquitetura aprovada, **65 arquivos / 289 testes aprovados** e build concluído. A execução limitou o Vitest a dois workers (`VITEST_MAX_THREADS=2 VITEST_MIN_THREADS=1 VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1 npm run verify`) para evitar os timeouts encontrados com a concorrência padrão deste ambiente. Não houve alteração nos limites de testes do projeto.

Não foi feito benchmark em aparelho físico de entrada.

A inspeção visual em navegador ficou pendente: o navegador remoto não alcançou o servidor local, e não havia Chromium utilizável no executor. A validação automatizada não substitui essa inspeção.

Sem migrations, secrets ou configuração adicional no Supabase.

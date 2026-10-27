# Linguagem visual compartilhada do EPAVOne

A base visual de One, Insights, Planner e Writer é a mesma. A paleta do produto muda; tipografia, superfícies, controles, espaçamento, foco, feedback e movimento seguem contratos compartilhados. O layout acompanha a tarefa: explorar uma receita, preparar uma conversa e conferir um pedido exigem composições diferentes.

## Análise e decisões aplicadas

| Área         | Problema encontrado                                                                                       | Aplicação                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cabeçalhos   | Insights, Planner e Writer tinham implementações e fontes distintas; ajustes locais competiam com padding | Um `PageHeader`, com identidade, título, contexto, ações e conteúdo opcional                                        |
| Seções       | Títulos e descrições repetidos em criação, administração, Planner e Writer                                | `SectionHeader`, com hierarquia semântica e variante compacta para subseções                                        |
| Superfícies  | Vários paddings locais ignoravam a densidade escolhida                                                    | Tokens de superfície e variantes de `Card`; raio interno continua derivado do raio externo menos padding e borda    |
| Formulários  | Grades e resumos duplicados; ajuda visual sem descrição acessível explícita                               | `FieldGrid`, `SummaryList`, IDs únicos e `aria-describedby`; erro usa `aria-invalid`                                |
| Catálogo     | Botões tinham sua própria aparência e geometria dentro do Insights                                        | Variantes públicas de `Button`, incluindo largura total, raio interno e tamanho compacto                            |
| Legibilidade | Textos auxiliares de 10–11 px e placeholders pouco claros no tema escuro                                  | Escala tipográfica compartilhada, textos pequenos de 12 px e placeholder semântico                                  |
| Estados      | Foco azul fixo; alguns badges de estado herdavam o fundo do app                                           | Foco acompanha o produto; sucesso, informação, aviso e erro têm superfícies semânticas iguais entre apps            |
| Campos       | Borda de baixa diferenciação sobre papel                                                                  | Token específico para contorno dos campos; cerca de 3,31:1 no claro e 3,11:1 no escuro sobre a superfície principal |
| Toque        | Ações compactas precisavam manter área confortável                                                        | Alvo mínimo de 44 px para botões, ícones e opções em ponteiros de toque                                             |
| Manutenção   | Correções sucessivas acumulavam implementações de títulos e ações                                         | Remoção do cabeçalho específico do Insights e de regras substituídas; catálogo de tokens gerado do CSS              |

Preservados: papel quente, quadriculado opcional, costuras, cantos contínuos, ilhas de navegação, cores dos apps, carrosséis e grade de receitas, gestos existentes e etapas do Writer. Os diálogos de leitura do Insights continuam com uma única superfície sem costura, conforme a exceção funcional já existente.

## Fundação

A fonte de verdade é [`tokens.css`](../../src/design-system/styles/tokens.css). O [catálogo JSON](tokens.json) preserva valores, aliases, condições de tema, produto, densidade e movimento reduzido. Há 174 nomes de tokens, incluindo 35 novos nesta revisão. O JSON não é uma segunda configuração editável.

| Papel             | Tokens / valores principais                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Marca             | `--brand-100/300/500/700/900`; One azul, Insights laranja, Planner roxo, Writer turquesa           |
| Superfícies       | canvas, primary, secondary, selected, hover, info, success, warning, danger, overlay               |
| Texto             | `--text-xs` 12 px; `--text-caption` 13 px; `--text-sm` 14 px; `--text-md` 16 px; `--text-lg` 18 px |
| Título de página  | `--page-title-size`, DM Serif Display, 30–40 px; mesmo contrato em todos os apps                   |
| Títulos de seção  | `--section-title-size`, Inter Tight; variante pequena para subseções                               |
| Corpo e controles | Inter; line heights compactas já adotadas pelo projeto                                             |
| Espaçamento       | escala existente `--space-1…8`; aliases para página, seção, campos e cards                         |
| Padding           | `--panel-padding` 32 px; compact 24 px; dense 16 px; reduzidos por viewport/densidade              |
| Geometria         | action, field, card, dialog, popover; cápsulas da navegação preservadas                            |
| Foco              | `--border-focus` e `--focus-ring`, resolvidos em cada fronteira de produto                         |
| Contorno de campo | `--border-control` e `--border-control-hover`                                                      |
| Interação         | alturas de controle, alvo de toque, opacidade desabilitada, durações e curvas existentes           |

Os valores em px acima correspondem à raiz padrão de 16 px. A preferência de texto ampliado aumenta a escala; não se deve compensá-la reduzindo fontes em CSS local.

```sh
npm run tokens:export
npm run check:tokens
```

`npm run verify` inclui a checagem de sincronização do catálogo.

## Componentes e adoção

| Componente                      | Contrato                                                                                   | Onde foi aplicado                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `PageHeader`                    | `product`, `eyebrow`, `title`, `description`, `actions`, conteúdo opcional                 | Insights, Planner, Writer, criação, configurações                                    |
| `SectionHeader`                 | título semântico (`as`), descrição, eyebrow, ações; `size="sm"` para subseções             | Home, descoberta/carrosséis, Planner, Writer, configurações, criação e administração |
| `FieldGrid`                     | duas colunas por padrão, três opcionais; uma em telas estreitas                            | Cadastro de cliente, identificação e entrega do Writer, editor de conteúdo           |
| `ActionGroup`                   | ações com alinhamento e quebra de linha consistentes                                       | Cadastro de cliente, revisão do Writer, laboratório                                  |
| `SummaryList`                   | pares `label/value`; grade, linhas ou ênfase de indicadores                                | Perfil e desempenho do Planner; identificação e conferência do Writer                |
| `Card`                          | costurado por padrão; `padding="compact"` ou `"dense"` quando necessário                   | Base de superfícies em todos os apps                                                 |
| `Button`                        | variantes existentes + `size="compact"`, `fullWidth`, `radius="nested"`, `align="between"` | Ações do catálogo sem recriação visual por produto                                   |
| `Input` / `Textarea` / `Select` | rótulo, ajuda, erro, foco e referências acessíveis compartilhadas                          | Todos os formulários que usam esses componentes                                      |

Exemplo de composição:

```jsx
<Card>
  <SectionHeader title="Para quem é o pedido?" description="Confira os dados antes de continuar." />
  <FieldGrid>
    <Input label="Nome" helper="Use o nome completo." />
    <Input label="Telefone" type="tel" />
  </FieldGrid>
  <ActionGroup>
    <Button variant="secondary" onClick={voltar}>
      Voltar
    </Button>
    <Button onClick={continuar}>Continuar</Button>
  </ActionGroup>
</Card>
```

A composição deve definir seu layout e callbacks. O Card não inventa espaçamento entre filhos nem comportamento de negócio.

## Regras para continuar a padronização

1. Importe componentes pelo índice público do design system.
2. Use o token pelo papel, sem copiar valores de outro app. Produto escolhe a paleta com `data-product`.
3. CSS de produto organiza conteúdo; não redefine fonte do `PageHeader`, altura de `Button`, contorno de `Input` ou cor de foco.
4. Use variantes explícitas quando o mesmo padrão precisar ser compacto. Densidade nunca reduz o alvo de toque.
5. Derive raios internos das superfícies próximas às bordas. Imagens, controles e cards independentes têm papéis diferentes.
6. Mantenha ações com feedback e estados vazios úteis. Rótulo, ajuda e erro precisam continuar associados ao campo.
7. Preserve Portal, contenção e retorno de foco, Escape, rolagem e movimento reduzido.
8. Valide nomes longos, texto ampliado, modo compacto, temas e telas de 320 px antes de acrescentar uma exceção.

O [Component Lab](../../src/dev/component-lab/ComponentLab.jsx) ganhou uma comparação dos quatro produtos com os mesmos componentes reais. Ele continua restrito ao desenvolvimento, sem rota pública no aplicativo.

## Revisão e evidências

Os resultados e prints ficam nesta pasta em `review/`. As duas revisões de navegador usam dados demonstrativos e bloqueiam operações reais de backend:

```sh
# Requer Playwright instalado no ambiente e um Chromium disponível.
REVIEW_BROWSER=/caminho/chromium node scripts/review-unified-design.mjs
REVIEW_BROWSER=/caminho/chromium node scripts/review-design-workspaces.mjs
```

`REVIEW_PLAYWRIGHT` pode apontar para o pacote do ambiente. `REVIEW_CATALOG_FIXTURE` permite usar fotografias e registros locais de catálogo em vez dos exemplos textuais. `REVIEW_OUTPUT` define a pasta de resultados. Nenhum desses dados de teste integra o catálogo público.

A revisão cobre geometria e execução nas rotas, preferências, fluxos de catálogo, diálogos, cadastro, etapas do pedido e áreas administrativas. Não equivale à homologação de uma conta real, de dados reais de produção ou de todos os leitores de tela e navegadores. O merge e a publicação permanecem uma etapa separada da implementação revisada.

## Composição do Planner

O redesenho do Planner reutiliza esta fundação. `Tabs size="compact"` é a única variante nova: reduz apenas o padding horizontal pelos tokens existentes e mantém o alvo de toque. Não muda as abas sem a prop. A fila, os perfis e os filtros são composição de produto; não há outra escala, paleta ou primitiva local. [Diagnóstico, evidências e limites](../planner-redesign/README.md).

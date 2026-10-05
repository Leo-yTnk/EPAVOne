# Inspeção visual e responsividade do EPAVInsights

Revisão de 5 de outubro de 2026, baseada na versão `f705d502503c0bffb284747bfedc81ccebf080f0` do EPAVOne.

## Correções

- Abas do header: fonte explícita de 0,8125 rem (13 px na configuração padrão), altura mínima de 2,25 rem e padding reduzido. Em dispositivos de toque, a área interativa continua com pelo menos 2,75 rem (44 px).
- Catálogos: uma única regra de grid, baseada na largura do conteúdo, substitui os breakpoints conflitantes. Cards com largura mínima de 12 rem; a sidebar reduz naturalmente a quantidade de colunas. Abaixo de 38 rem de conteúdo, imagem e informações aparecem lado a lado em uma lista compacta.
- Hierarquia da página: menos espaço entre título, descrição e filtros. Nomes completos continuam visíveis e podem quebrar linha.
- Produto: imagem proporcional, preço em destaque, categoria/código e consulta à Swift reunidos; receitas relacionadas em uma seção própria.
- Receita: imagem horizontal, preparo/rendimento/dificuldade identificados, ingredientes e modo de preparo em colunas independentes; empilhamento nas telas pequenas. As imagens dos ingredientes e a navegação entre produto e receita permanecem no mesmo diálogo.
- Costura: preservada no diálogo e nas imagens, com raio adequado ao tamanho da imagem.
- Cores: laranja escurecido no token Insights 700 para tornar textos pequenos, etiquetas e abas selecionadas legíveis no tema claro. O laranja claro do tema escuro permanece adequado às superfícies escuras.

## Contraste calculado

Razões calculadas pela luminância relativa sRGB, usando os tokens finais, sem transparência no texto.

| Uso                             | Texto     | Fundo     | Contraste |
| ------------------------------- | --------- | --------- | --------- |
| Texto de destaque no tema claro | `#ad4b20` | `#f7f2ec` | 4,96:1    |
| Etiqueta de categoria clara     | `#ad4b20` | `#fce5d9` | 4,56:1    |
| Texto de aba selecionada        | `#ffffff` | `#ad4b20` | 5,52:1    |
| Texto secundário no tema claro  | `#756861` | `#f7f2ec` | 4,83:1    |
| Destaque no diálogo escuro      | `#f4b58d` | `#211d1b` | 9,43:1    |

## Verificação em navegador

Inspeção em Chromium headless, com fontes Inter, Inter Tight e DM Serif Display e imagens públicas reais. Respostas públicas do Supabase foram consultadas somente para leitura e reutilizadas localmente: amostra de 100 produtos, 82 receitas, categorias, seções e 166 relações de ingredientes. Os filtros de relacionamento foram preservados na reprodução. O catálogo de produção continua carregando todas as páginas normalmente; a amostra não altera a aplicação.

Foram examinados catálogo de produtos, catálogo de receitas, detalhe de produto, detalhe de receita e home em cada cenário:

| Largura                | Layout principal                  | Colunas do catálogo no padrão horizontal |
| ---------------------- | --------------------------------- | ---------------------------------------- |
| 320, 375, 390 e 600 px | Lista com miniatura e informação  | 1                                        |
| 768 px                 | Grid                              | 3                                        |
| 1024 px                | Grid                              | 4                                        |
| 1280 e 1440 px         | Grid                              | 6                                        |
| 1920 px                | Grid com largura máxima da página | 7                                        |

Também verificados: tema escuro em 390, 768 e 1440 px; sidebar e densidade compacta em 1024 e 1440 px; fallback horizontal da sidebar em 720 px; toque em 390 × 844 e paisagem em 844 × 390; texto ampliado para 20 px em 375 px e 32 px em 1440 px.

As verificações mediram a largura do documento e do conteúdo do diálogo para detectar overflow horizontal, acompanharam erros JavaScript e confirmaram o fechamento com Escape. A navegação receita → produto → receita, o retorno e a restauração do foco também são cobertos pelos testes existentes.

A validação visual é por viewports emulados em Chromium; não substitui execução em hardware físico ou em outros motores de navegador.

## Evidências

- [Catálogo no desktop](visual-review/catalog-desktop.png)
- [Detalhes da receita no desktop](visual-review/recipe-desktop.png)
- [Detalhes da receita no celular](visual-review/recipe-mobile.png)
- [Detalhes no tema escuro em tablet](visual-review/recipe-dark-tablet.png)

## Quality gate

`npm run verify`: lint, arquitetura, 136 testes em 36 arquivos e build de produção aprovados.

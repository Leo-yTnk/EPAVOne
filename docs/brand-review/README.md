# Família de marcas e revisão visual

Base: `8436bbc` do EPAVOne. O Yourcipe-EPAV foi consultado e permanece como aplicação anterior; esta implementação pertence ao EPAVOne.

## Identidade

Quatro marcas vetoriais originais, com grade 64 × 64, cantos de 16 e traço de 3 unidades. One usa um monograma E com ponto; Insights, uma ideia/lâmpada; Planner, calendário com confirmação; Writer, folha com lápis. Os símbolos mantêm a mesma caixa e peso visual. SVGs em `public/brand` são usados pelo componente público `AppLogo`, sem imagens rasterizadas ou dependência de fonte para o símbolo.

As cores de referência do produto continuam no Design System. Os fundos das marcas usam as variantes 700 para garantir contraste com o símbolo claro (5,43:1 a 6,98:1). Os nomes usam os tokens semânticos de cada tema. A marca One no shell mantém sua identidade azul ao navegar entre produtos. One também foi aplicado ao favicon.

Aplicações: marca principal, abas em navegação horizontal/lateral, atalhos da Home e cabeçalhos de Insights, Planner, Writer e Criação.

## Ajustes

- Conteúdo e cabeçalho compartilham largura máxima de 80rem, mantendo o header horizontal de ponta a ponta.
- Área principal com respiro de 32px no desktop e 16px no celular.
- Removido padding duplicado entre PageHeader e conteúdo; relação entre marca, título e descrição usa espaçamento de tokens.
- Abas e conta com área mínima de 44px; no celular, símbolo acima do nome libera largura e mantém identificação textual. A barra conserva rolagem interna em telas muito estreitas.
- Superfícies do header usam tokens, em lugar de cinzas fixos independentes do tema.
- Texto terciário no modo claro ganhou contraste; foco de teclado no escuro ganhou cor e anel próprios.
- Mantidos Warm Paper, fontes locais, quadriculado, costuras, fluxos e lógica comercial.

## Referências

Human Interface Guidelines da Apple consultadas em 21/10/2026:

- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout): hierarquia, agrupamento, alinhamento e adaptação.
- [Color](https://developer.apple.com/design/human-interface-guidelines/color): significado consistente e variantes por aparência.
- [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode): contraste e legibilidade em ambas as aparências.
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility): nomes, foco, ampliação, contraste e movimento reduzido.

Princípios adaptados à aplicação web e às regras do repositório. Não representa certificação Apple nem adoção de componentes nativos/Liquid Glass.

## Evidências e limites

`results.json` registra a matriz Chromium: 12 rotas × 4 larguras (320, 390, 768 e 1440) × 2 temas = 96 verificações, além de navegação lateral e movimento reduzido. Verifica overflow da página, carregamento das marcas e ausência de exceções JavaScript. As screenshots mostram os quatro apps em 390/1440, claro/escuro.

Insights usa catálogo de teste explícito e os fallbacks reais para fotos ausentes; Planner usa a demonstração existente; Writer é capturado antes de carregar Excel. As capturas são da versão local, sem login nem gravação hospedada. Não atestam banco, imagens reais, sincronização de preços ou todas as etapas autenticadas.

Reprodução: instalar Playwright no ambiente de auditoria e executar `REVIEW_BROWSER=/caminho/chromium node scripts/review-brand.mjs`. A ferramenta inicia e encerra o Vite local e intercepta apenas as leituras do catálogo. Os SVGs públicos também são incluídos no build de produção.

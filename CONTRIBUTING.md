# Desenvolvimento do EPAVOne

## Norte inegociável

> **“Design is not just what it looks like and feels like. Design is how it works.”**

Essa frase guia arquitetura, conteúdo, interação e revisão. Uma tela bonita que não comunica estado, consequência ou próximo passo ainda não está pronta.

## Critérios de aceite para toda entrega

1. **Feedback claro, entendível, constante e completo.** Toda ação precisa comunicar que foi recebida, se está em andamento, se terminou e como corrigir um erro. Mensagens devem dizer o que aconteceu e indicar o próximo passo, sem depender apenas de cor.
2. **Animações com propósito.** Movimento explica hierarquia, origem e mudança de estado. Use os tokens de duração e easing; preserve contexto; evite animações gratuitas; e sempre respeite `prefers-reduced-motion`.
3. **Responsividade impecável.** Desenvolva do mobile ao desktop, sem conteúdo cortado ou controles inalcançáveis. Valide teclado, toque, zoom, textos longos e larguras de 320, 768, 1024 e 1440 pixels.
4. **Acessibilidade desde o componente.** Use HTML semântico, nomes acessíveis, foco visível e contraste adequado. Feedback assíncrono deve usar regiões vivas apropriadas.
5. **Consistência pelo sistema.** Reutilize os componentes em `src/components/ui.jsx` e os tokens em `src/styles.css`. Se um padrão não existe, crie uma API reutilizável antes de estilizar a tela isoladamente.

## Organização e expansão

- `components/`: blocos reutilizáveis, pequenos e sem regra de negócio específica.
- `data/`: textos e configurações que podem futuramente vir de uma API.
- Novos domínios devem nascer em `features/<nome>/`, agrupando componentes, hooks, serviços e testes próprios.
- O único arquivo global de CSS é `src/styles.css`: tokens, fundamentos, componentes, composição e media queries ficam em camadas explícitas.
- Estado local pertence ao componente; estado compartilhado deve ser elevado para o menor ancestral comum. Integrações externas devem ficar em serviços, nunca dentro de componentes visuais.

## Checklist antes de abrir uma mudança

- Rode `npm run build`.
- Teste navegação somente por teclado e foco visível.
- Verifique temas claro e escuro e a preferência de movimento reduzido.
- Confirme feedback de sucesso, carregamento, vazio, erro e indisponibilidade quando aplicáveis.
- Revise os quatro viewports de referência e garanta alvos de toque confortáveis.

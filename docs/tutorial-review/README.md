# Tutorial de primeiro acesso e menu Criar

O guia em dez etapas cobre navegação e conta, carteira, planejamento semanal, catálogo, biblioteca pessoal, Excel semanal, carrinho, conferência, envio e resultados. Usa o Dialog, Progress, Button e Card do design system; seu rodapé permanece visível enquanto as instruções rolam.

O primeiro acesso, inclusive por link direto, abre o tutorial antes de montar a página de destino. Concluir, pular, fechar ou pressionar Escape grava `epavone-tutorial-v1=done` neste navegador. A chave é independente da antiga apresentação e das preferências. Sem armazenamento, a dispensa vale durante a sessão. Configurações → Rever tutorial abre `#/welcome` por solicitação explícita. Rever o guia preserva o Writer já montado.

Criar substitui a conta na barra superior e está disponível também no modo de painel lateral. Os seis atalhos levam ao Writer, ao cadastro de cliente, ao registro manual de venda e aos editores pessoais de receita, produto e categoria. Os caminhos `/novo` são consumidos no fechamento/salvamento. Venda e biblioteca mantêm os bloqueios de autenticação. A conta permanece nas Configurações e no painel de navegação móvel.

## Validação

- `npm run verify`: ESLint, arquitetura, tokens, Vitest e build.
- Novos testes: etapas, avanço/retorno, conclusão/dispensa, primeiro acesso por link direto, persistência, repetição manual sem perder o Writer, menu em portal/teclado, abertura e fechamento dos formulários e bloqueio da venda sem login.
- Chromium: 1440 px claro, 390 px escuro e 320 px claro, com movimento reduzido. Todos os dez passos, dispensa/reload, foco no cadastro aberto após o guia, menu Criar e bloqueio de venda para visitante. Sem erros JavaScript nem overflow horizontal nessas três configurações.
- Evidências em `results.json` e PNGs adjacentes. A inspeção utiliza a demonstração do Planner; não grava dados de contas reais.

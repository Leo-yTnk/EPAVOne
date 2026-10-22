# Header suspenso e seleções costuradas

O shell agora agrupa identidade, navegação e conta em três ilhas suspensas, com superfícies opacas e sombra discreta. Inspiração: [Apple HIG — Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), com agrupamento funcional e geometria concêntrica, preservando a identidade Warm Paper e a restrição do projeto a filtros/backdrop.

Insights e Planner mantêm apps em ícones e páginas ao lado, após um separador. As duas seleções são Cards canônicos costurados, com altura visual de 40px, alvo de interação de 44px e transição de posição/largura. Os ícones possuem largura mínima de 56px e as seções ganharam padding lateral de 16px. Os indicadores permanecem montados ao alternar páginas. Os nomes dos apps continuam acessíveis; a navegação mantém teclado, foco e rotas profundas. Na lateral, os ícones formam uma fileira acima das páginas. No celular, a navegação inteira pode rolar horizontalmente dentro da ilha, sem criar uma segunda barra ou alargar a página.

A matriz em `results.json` verifica 96 combinações de rota, tema e largura: página sem overflow, apps e páginas na mesma linha, costuras/indicadores dentro da ilha e logos carregadas. Inclui verificação adicional da lateral e de movimento reduzido. As capturas locais usam fixtures de catálogo, demonstração do Planner e Writer sem Excel; não atestam gravações hospedadas. Screenshots são entregues separadamente e não fazem parte da publicação no GitHub.

Reprodução: `REVIEW_BROWSER=/caminho/chromium node scripts/review-header.mjs`, com Playwright instalado no ambiente de auditoria.

Configurações fica na ilha de utilidades, imediatamente ao lado da conta, fora das abas de produto. Na rota de configurações, nenhuma aba de app é marcada como ativa e a primeira continua acessível pelo teclado.

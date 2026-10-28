# Personalização de Configurações — 28/10/2026

A tela mantém as preferências existentes e ganha um índice de seções. Em telas amplas, o índice acompanha a leitura na lateral; em celular/tablet, vira navegação horizontal. Os atalhos preservam a rota `#/settings` e transferem o foco para a seção escolhida.

## Novas escolhas

| Preferência | Opções | Aplicação |
| --- | --- | --- |
| Ao abrir o EPAVOne | Home, Planner, Insights ou Writer | Só a URL sem fragmento usa a escolha; Home explícita e links específicos prevalecem |
| Fundo da Home | Adaptativo, neutro, amanhecer, manhã, tarde, entardecer ou noite | O cenário fixo altera a cor; a saudação continua seguindo o horário real |
| Largura do conteúdo | Focada (66rem), padrão (80rem) ou ampla (100rem) | Limite do shell, respeitando a largura do dispositivo e os limites próprios de cada conteúdo |
| Costuras | Padrão, discretas ou sem costuras | Decoração dos cards; estrutura e controles continuam disponíveis |
| Contraste de leitura | Padrão ou reforçado | Tokens de textos secundários e contornos para claro/escuro; cores dos apps preservadas |
| Caminho de navegação | Mostrar ou ocultar | Breadcrumbs; navegação principal e menu continuam disponíveis |

Os modos Alto desempenho, Equilibrado e Fabuloso seguem na mesma tela. Todas as escolhas são locais a este navegador, validadas na leitura e restauradas pelo botão existente. Valores antigos são migrados com os novos padrões; links compartilhados não são redirecionados pelo app de abertura.

Os estilos globais de preferências agora são importados pelo shell. Tamanho de leitura e quadriculado também passam a valer no primeiro acesso a qualquer rota, sem depender do carregamento da página de Configurações.

A implementação foi dividida em componentes de rotina, aparência, experiência, conta e índice, mantendo os controles do design system. `Button align="start"` permite alinhar ações de navegação sem CSS local sobre a geometria do controle. Botões com renderização em âncora não recebem sublinhado de link.

## Validação

Testes de migração/validação, persistência, controles, preservação de links e navegação interna por foco. Revisão no Chromium de abertura inicial do Writer, Home explícita, cenário fixo após navegação direta, largura ampla, costuras desativadas, contraste claro/escuro, restauração e ausência de overflow em 1440, 601 e 390px. Capturas feitas no build de produção, sem dados privados.

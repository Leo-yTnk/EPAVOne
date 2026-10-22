# Costura sobreposta e navegação lateral responsiva

A ilha de navegação separa trilho visual e área rolável. O trilho mede 32px de altura, enquanto os destaques canônicos costurados medem 40px, avançando 4px acima e abaixo. Os alvos continuam com 44px, e o espaço interno do contêiner rolável preserva a costura e a sombra sem clipping. O movimento continua no indicador único de cada grupo.

A preferência `mobileNavigation` é independente de `navigation`, tem padrão horizontal e é persistida junto das demais escolhas. Abaixo de 1200px, a opção vertical substitui o header por um botão que abre Drawer à esquerda. Apps, páginas, Configurações e conta ficam disponíveis com nomes completos. Rotas profundas e histórico por app são preservados. Em telas maiores, continua valendo a preferência de computador.

`review-mobile-navigation.mjs` verifica os dois temas em 320, 390, 768, 1024, 1180 e 1440px: painel dentro da viewport, abertura à esquerda, foco, Escape, retorno ao trigger, fechamento após escolha de página, ausência de overflow e de exceções JavaScript. No desktop, mede o avanço do destaque sobre o trilho pintado. Não usa conta autenticada nem faz gravações hospedadas. Capturas são da demonstração local do Planner.

`review-header.mjs` também foi executado nas 96 combinações anteriores de rota, largura e tema para o modo padrão. A revisão não certifica uso em dispositivos físicos ou serviços hospedados.

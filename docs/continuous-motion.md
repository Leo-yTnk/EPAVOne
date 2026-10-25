# Continuidade de movimento

A revisão atual de [diálogos, contêineres e microtravamentos](insights-dialogs-and-performance.md) acrescenta presença de saída, recuos consistentes e otimizações de costuras e atualizações dos cards.

A revisão mais recente está na [auditoria de transições de estado](state-motion-audit.md), com as lacunas corrigidas no catálogo, na conta, no Planner, na administração e no progresso.

Atualização: a revisão de [catálogo mobile e detalhes](mobile-catalog-review.md) substitui a expansão geométrica descrita abaixo por entrada sem escala e aprimora a chegada de apps carregados sob demanda. Os demais registros documentam a evolução anterior.

A interface mantém o shell e os indicadores montados. Os destaques deslizam até a seleção; páginas entram na direção da posição dos apps, com 18px de deslocamento e acomodação de 1,5px, sem dissolver ou capturar o documento. Esta é uma ampliação deliberada do limite anterior de 6px, solicitada para tornar a continuidade perceptível. A rota e os controles ficam disponíveis imediatamente. O Writer mantém sua instância e o formulário ao alternar apps.

O comportamento compartilhado de pressão cobre botões, links, abas e origens de detalhes, incluindo portais: escala 0,97 ao pressionar, retorno até 1,018 e acomodação em 1. O scale individual preserva transforms existentes. Arrastar mais de 10px, pointercancel, perda de foco do controle ou da janela, ocultação da aba e desmontagem cancelam o feedback. Nenhum evento nativo é bloqueado, nem há promessa de vibração física.

Menus nascem do ponto de ancoragem com escala 0,975; diálogos usam 0,98. A ultrapassagem é pequena (1,008), evita distorção prolongada e termina na geometria real. Detalhes mantêm a expansão a partir do card, incluindo toques em navegadores que não focam botões: a geometria é capturada antes da compressão e consumida pela abertura em até um segundo.

Movimento reduzido, tanto do sistema quanto das Configurações, remove a coreografia e cancela animações JS em andamento. Sem Web Animations API, a navegação continua com o fallback CSS. Não há dependência nova, blur, captura de tela, transição global ou atraso em ações. Redimensionar cancela a animação da rota.

Validação automatizada: `npm run verify`, incluindo pressão, cancelamento ao rolar, digitação em campos, direção da rota e expansão por toque sem foco. A segunda revisão também foi executada em Chromium real, com viewports 1440×1000 e 390×844, nos temas claro e escuro. Não substitui uma validação em iPhone/Safari físico.


## Segunda revisão crítica

- Pressão prolongada de 150ms reproduziu um indicador até 2,55px menor que seu alvo. `SelectionIndicator` agora mede a caixa de layout, independente da escala temporária do toque.
- Insights e Planner compartilham a mesma navegação; ambas as seções iniciais têm valor vazio. O valor do indicador inclui agora o app, para que a troca refaça a medição dos links e não retenha um link removido.
- O seletor CSS da preferência local tinha especificidade menor que a animação do menu. Uma regra explícita agora desliga a animação da camada ancorada. Conferido tanto com preferência local quanto com a preferência do sistema.
- Perda de foco do controle e ocultação da aba cancelam a pressão. Campos editáveis, inclusive `contenteditable="plaintext-only"`, não disparam pressão no card ao redor.

`tests/press-feedback.test.jsx`, `tests/selection-indicator.test.jsx` e `tests/workspace-tabs.test.jsx` cobrem as regressões. `scripts/review-continuous-motion.mjs` usa Playwright e um Chromium indicado por `REVIEW_BROWSER`; grava evidências temporárias em `REVIEW_OUTPUT` ou `/tmp/epav-continuous-motion`.

O teste de navegador passa por pressão prolongada nos quatro apps, alinhamento final dos indicadores de app e seção, sequência rápida de trocas, menus com movimento reduzido e retorno de foco, painel mobile com Escape e troca de destino, ausência de overflow horizontal e de exceções JavaScript. As chamadas de catálogo são simuladas com resposta vazia; dados autenticados e integrações remotas não foram alterados nem validados por essa revisão visual.

## Refinamento de fluidez

Os detalhes de Insights agora acompanham a direção do histórico: 6px para entrar no produto e direção inversa ao voltar à receita, com opacidade de 0,6 a 1 em 220ms. A primeira abertura mantém apenas a expansão do diálogo, sem sobrepor duas animações. O conteúdo e o foco são atualizados imediatamente. Trocas rápidas, desmontagem, redimensionamento e alterações da preferência de movimento cancelam a animação anterior. Sem Web Animations API, a troca continua imediata.

A gaveta de apps anima três grupos de conteúdo por 320ms, sem atraso por item. Os filtros mobile entram em 220ms e fecham imediatamente. Diálogos e gavetas acomodam diretamente na posição final, sem ultrapassagem de escala. Todos os novos movimentos usam apenas opacidade e transformações; não há dependência adicional, medição por frame, animação de altura ou `will-change` permanente. As preferências do sistema e das Configurações desativam os novos movimentos.

Validação: `tests/content-motion.test.jsx` cobre direção, cancelamento, preferências e fallback. `scripts/review-insights-details.mjs` verifica as animações reais, direção do histórico, limites de duração, filtros mobile, gaveta, preferências local e do sistema, foco e navegação em oito combinações de tamanho/tema. Usa catálogo simulado, sem escrita remota. A verificação não substitui medição de desempenho em aparelho físico.

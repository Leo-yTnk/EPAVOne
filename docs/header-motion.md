# Movimento do header

A troca de app interpola a largura real da ilha de navegação durante `--duration-slow` (320ms), com `--ease-emphasized`. Os rótulos e símbolos acompanham suas posições anteriores por translação, sem escalar tipografia, ícones ou bordas. Os alvos de clique já correspondem à nova rota, sem bloquear interação. As seções entram com opacidade e deslocamento de `--motion-distance-md`; nomes dos apps reaparecem suavemente ao voltar à navegação sem seções.

O destaque costurado usa a mesma duração, com curva de mola apenas na posição; largura e recuos permanecem em desaceleração para evitar deformar a ilha. A ilha mantém os raios de cápsula e a sobreposição lateral dos destaques ativos. A largura é medida no layout final e animada apenas na ilha; nenhum conteúdo de página é capturado ou duplicado.

Durante a animação, uma amostra por frame guarda a largura e as posições visíveis. Trocas rápidas retomam desse estado e cancelam as animações anteriores. Redimensionar, trocar para navegação lateral, desmontar o header ou ativar movimento reduzido cancela o movimento. Tanto a preferência do sistema quanto `data-reduced-motion` são respeitadas. Sem Web Animations API, a navegação funciona sem essa coreografia.

Validação: `tests/header-motion.test.jsx` cobre largura, substituição/cancelamento, limpeza, resize e movimento reduzido. `scripts/review-header-motion.mjs` mede frames reais no Chromium, transições entre os quatro apps nos dois temas, ausência de overshoot/overflow, alinhamento final do destaque, sequência rápida de trocas, preferência de movimento reduzido e viewport de celular. Os dados e capturas locais vão para `/tmp/epav-header-motion` por padrão, sem contas autenticadas ou gravações hospedadas.

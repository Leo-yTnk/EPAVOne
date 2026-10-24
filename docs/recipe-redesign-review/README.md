# Receita contínua e gaveta de aplicativos

A página de detalhes de receita foi reconstruída com um único plano de leitura: título, foto, informações, ingredientes, preparo e dicas. As seções e linhas de ingredientes são elementos semânticos sem fundos ou costuras próprios. O diálogo mantém a costura externa. A consulta do produto e a volta à receita usam o mesmo histórico, foco e Portal existentes.

O CSS antigo da receita foi removido. O botão de fechar permanece numa linha própria, fora da rolagem, sem sobrepor o título. Falhas de imagem usam um espaço compacto em vez de uma grande área vazia.

No mobile, o raio base dos cards fica em 24px; os tokens maiores também são reduzidos. A navbar mantém cápsulas. A gaveta usa grade 2 × 2 com ícones e nomes; páginas do app e utilidades ficam em grupos próximos, sem margem automática empurrando a conta até o fundo. O painel respeita viewport dinâmica e safe areas, mantém rolagem, Escape, foco contido e retorno ao botão que abriu.

Verificação: 327 testes, arquitetura e build; oito cenários de receita/produto em 320/390/768/1440px e claro/escuro, histórico de volta e movimento reduzido; gaveta 2 × 2 em claro/escuro. O fallback arredondado é simulado com CSS em Chromium, validando raio mobile de até 28px. Não certifica Safari físico. As capturas usam catálogo controlado, sem fotos externas nem gravações no Supabase.

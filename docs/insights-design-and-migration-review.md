# EPAVInsights — organização visual e revisão da migração

## Alterações

- Home com resumo real do catálogo, três sugestões por seção configurada, acesso ao catálogo completo daquela seção, mais sugestões compactas e atalhos para categorias/criação.
- Receitas e produtos agrupados nas seções públicas do Yourcipe, respeitando ordem das seções e dos vínculos. Busca, categoria, seção, tempo/preço por quantidade e paginação funcionam em conjunto.
- Registros não associados a uma seção continuam acessíveis. Vínculos para registros fora do catálogo público não são renderizados. Múltiplas associações são preservadas.
- Catálogos com três colunas no desktop, duas em telas intermediárias e lista compacta no celular. Costura permanece nas imagens, sem padding adicional.
- Detalhes de receitas com etapas e separadores mais claros. Biblioteca/criação com navegação contextual, título da área e listas com melhor separação, incluindo as telas administrativas que reutilizam essas listas.
- Falha na consulta de seções apresenta aviso e tentativa novamente, preservando o catálogo disponível. Não há alterações de banco ou reimportação de registros.

## Fonte e conferência

Repositórios comparados: EPAVOne em `6700e62678628173b8a8b0450297b379cdb90350` e Yourcipe em `43fdc43d5a266b9a3c7ac0414ef63bbc7ce2ad12`.

Ambos utilizam o projeto Supabase `ytvztfvypiwgnslisxep`. A leitura anônima atual encontrou:

| Recurso                                | Registros |
| -------------------------------------- | --------: |
| Produtos públicos ativos               |       186 |
| Receitas públicas publicadas           |        82 |
| Categorias públicas de produtos ativas |        11 |
| Páginas públicas ativas                |         3 |
| Seções públicas ativas                 |        20 |
| Vínculos de receitas com seções        |       144 |
| Vínculos de produtos com seções        |       186 |

Todos os vínculos retornados apontam para IDs presentes nos respectivos catálogos públicos. Todos os 186 produtos e as 82 receitas têm URL de imagem cadastrada; isso não comprova disponibilidade dos servidores de imagens.

A lacuna encontrada era funcional: a administração do Insights já lia/gerenciava as seções, mas Home, receitas e produtos não as consumiam. Este PR conecta a estrutura às páginas públicas, usando transporte anônimo e paginação, incluindo respostas limitadas pelo servidor.

## Limites da migração

A reutilização do catálogo e seus vínculos foi verificada. Ela não comprova migração integral de toda a experiência Yourcipe:

- Login, biblioteca pessoal, compartilhamento, solicitações e administração estão implementados, mas precisam de aceitação com contas reais e verificação de isolamento no servidor.
- Favoritos, receitas ocultas e personalizações locais do Yourcipe ainda não possuem transferência explícita para o Insights. `catalog_card_layout` é lido no perfil, mas ainda não controla o layout público.
- Cadastro/recuperação e recursos legados continuam exigindo revisão própria. A nova organização visual não modifica esses fluxos.
- Esta revisão não executou SQL, imports, sincronização de preços, exclusões ou gravações de conteúdo em produção.

## Validação

`npm run verify`: lint, arquitetura, 132 testes em 35 arquivos e build passaram.

Os testes adicionais cobrem leitura anônima/paginada da estrutura, recusa de estrutura parcial, ordem, múltiplas associações, registros não associados, vínculos invisíveis, filtro de seção combinado com busca e navegação por âncora sem substituir o hash do aplicativo.

A inspeção visual local usa uma captura anônima do catálogo de produção em respostas de teste. As capturas das páginas públicas e da entrada de criação cobrem 1440, 768, 390 e 320 px; detalhes e modo escuro são inspecionados também. Os fluxos autenticados continuam cobertos pelos testes existentes, sem certificação visual com contas reais. Imagens externas apresentaram fallback no ambiente local; sua disponibilidade de produção não foi certificada.

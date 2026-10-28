# EPAVInsights — catálogo e inspiração para atendimento

As páginas do Insights têm funções diferentes:

- `#/insights` (ou `#/insights/home`): Home com receita em destaque, ideias para
  o atendimento, atalhos por categoria e oportunidades por quantidade.
- `#/insights/receitas`: catálogo de receitas publicadas com busca, filtro por
  categoria, receitas de até 30 minutos e detalhes completos.
- `#/insights/produtos`: catálogo de produtos com preços e receitas relacionadas.
- `#/insights/produtos/categoria/<id>`: catálogo com a categoria da Home selecionada.

Usuários e dados continuam no projeto Supabase EPAV existente; o código operacional pertence ao EPAVOne.

## Recursos

- Produtos ativos do catálogo público, com categorias reais.
- Busca por nome, código e categoria, ignorando acentos.
- Filtro por categoria e por preço condicionado à quantidade.
- Catálogo completo em uma única página, nomes completos e carregamento conforme o modo de desempenho.
- Detalhes em Dialog do design system, com receitas publicadas relacionadas.
- Ingredientes, complementos, preparo e dicas das receitas.
- **Criados por mim** na Home e em Receitas: receitas pessoais da conta atual em carrossel, com busca e filtros. Visitantes não veem a seção. Ela é independente de falhas do catálogo público e não publica o conteúdo.
- Preço regular separado do preço promocional e sua quantidade mínima.
- Indicação de referência quando a última confirmação tem mais de 24 horas
  ou o preço não está confirmado; peças com peso variável têm aviso próprio.
- Loading, catálogo vazio, busca sem resultados, timeout e tentativa novamente.

## Integração

`components → catalogService → catalogRepository → REST público do Supabase`.
As relações usam os mesmos nomes de FK do Yourcipe. As leituras de produtos
restringem `scope=site` e `active=true`; as de receitas restringem
`scope=site` e `status=published`. As políticas RLS existentes continuam
sendo a autoridade. Conta e criação usam a sessão autenticada, repositórios e escritores transacionais próprios.

`PersonalRecipesSection → personalRecipesService → personalRecipesRepository → SDK autenticado`.
O repositório pessoal exige `scope=personal` e `owner_id` da conta atual, mantendo RLS. Os ingredientes usam join da receita e os mesmos filtros. A seção e seus detalhes são remontados por ID da conta, cancelando consultas e descartando respostas antigas ao sair ou trocar de usuário. O catálogo público continua anônimo. A seção pessoal não altera compartilhamentos explicitamente existentes nem publica receitas.

O repositório lê todas as páginas, avançando pelo número efetivamente retornado
pelo servidor para evitar truncamento. O transporte limita cada requisição a
15 segundos. Consultas pessoais são canceladas ao desmontar; consultas públicas compartilhadas
continuam até a conclusão ou timeout, sem atualizar componentes desmontados. O catálogo de receitas é carregado na Home e na página Receitas; os ingredientes são carregados ao abrir detalhes.

Configuração opcional no build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (somente chave pública para navegador)
- `VITE_CATALOG_URL`
- `VITE_CATALOG_PUBLISHABLE_KEY` (somente chave pública para navegador)

As variáveis `VITE_CATALOG_*` continuam como alternativas compatíveis; as
equivalentes `VITE_SUPABASE_*` têm precedência. O transporte PostgREST e a
configuração ficam em `src/shared`, mantendo filtros e paginação no repositório.
Veja o [plano e inventário da migração](../../../docs/yourcipe-migration.md).

Os valores padrão apontam para o projeto já usado pelo Yourcipe. Não forneça
chaves administrativas ou service_role ao frontend.

## Navegação e transição

As ilhas do header ficam agrupadas à esquerda. Somente no Insights aparece
uma ilha adicional com Home, Receitas e Produtos, com indicador da página atual.
A barra principal usa quatro colunas nas telas menores, mantendo Início,
Insights, Planner e Writer acessíveis. Conta, biblioteca, criação e administração estão no EPAVOne; não há links de runtime para o antigo.

## Verificação

`npm run verify` executa lint, verificação de arquitetura, testes e build.
Os testes desta etapa cobrem listagens completas, pesquisa, filtros, preços condicionais,
receitas, recuperação de erros, cancelamento e respostas atrasadas.

A Home usa contagens e sugestões derivadas do catálogo real. Receitas em destaque
são priorizadas, seguidas pelas de menor tempo conhecido. Produtos com preço por
quantidade só aparecem quando essa condição existe no catálogo; não são criadas
promoções nem indicadores de vendas fictícios.

Todas as listagens do Insights usam uma única página: produtos, receitas, biblioteca, catálogo administrativo e solicitações. Busca, filtros e organização por seções continuam disponíveis. As consultas em lotes do repositório são mantidas para carregar todos os registros, sem truncamento pelo limite do servidor.

## Modos de desempenho

Configurações → Desempenho e movimento oferece três escolhas salvas apenas no navegador:

| Modo | Movimento | Catálogo e imagens |
| --- | --- | --- |
| Alto desempenho | Sem animações CSS/WAAPI ou rolagem suave | Janela horizontal pequena; na grade expandida, cards próximos da tela, com margem de 120 px; imagens sob demanda |
| Equilibrado (padrão) | Navegação, controles e camadas leves; sem coreografia de largura, expansão do diálogo, entradas de resultados, shimmer ou crescimento dos gráficos | Janela horizontal com mais itens de reserva; grade expandida com margem de 600 px; imagens sob demanda |
| Fabuloso | Todos os efeitos disponíveis, mantendo as proteções existentes para superfícies grandes | Todos os cards e imagens da página atual são montados/carregados |

A preferência de movimento reduzido do sistema e o controle de acessibilidade prevalecem sobre qualquer modo. Alto desempenho não sobrescreve a escolha independente de acessibilidade: sair desse modo restaura o movimento permitido pela preferência anterior. Os modos não importam nem montam os apps que ainda não foram abertos.

O catálogo continua completo e sem paginação. Carrosséis grandes usam uma janela de cards com espaçadores; o botão Ver todos abre a grade na mesma página. Na grade, um único IntersectionObserver por política controla os slots; os cards distantes são desmontados, preservando a altura medida e o foco atual. Tab nos espaçadores permite alcançar itens ainda não montados; busca e filtros sempre incluem os 1.002 registros, mesmo os fora da tela. A busca nativa do navegador alcança somente os textos montados; para buscar o catálogo inteiro, use Buscar produto.

A busca de produtos prepara uma vez o índice normalizado de nome, código e categoria. Alto desempenho e Equilibrado aguardam 150 ms após a última entrada; limpar o campo é imediato. Fabuloso mantém a busca imediata. Formatação monetária reutiliza o mesmo Intl.NumberFormat.

Somente os quatro recursos públicos anônimos (catálogo, Home, receitas e estrutura) entram no cache em memória de até 60 segundos. Consultas simultâneas do mesmo recurso são compartilhadas; ao retornar depois do prazo, o último resultado aparece enquanto é revalidado. Uma falha de atualização de preços é sinalizada no catálogo. Edições, importação, restauração, exclusão e sincronização invalidam o cache público. Dados pessoais continuam fora desse cache e mantêm o cancelamento ao desmontar. Fechar ou atualizar a página descarta esse cache.

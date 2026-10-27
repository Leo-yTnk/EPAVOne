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
- Paginação visual de 24 produtos, nomes completos e imagens sob demanda.
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
15 segundos. Componentes cancelam solicitações ao desmontar e ignoram
respostas antigas. O catálogo de receitas é carregado na Home e na página Receitas; os ingredientes são carregados ao abrir detalhes.

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
Os testes desta etapa cobrem paginação, pesquisa, filtros, preços condicionais,
receitas, recuperação de erros, cancelamento e respostas atrasadas.

A Home usa contagens e sugestões derivadas do catálogo real. Receitas em destaque
são priorizadas, seguidas pelas de menor tempo conhecido. Produtos com preço por
quantidade só aparecem quando essa condição existe no catálogo; não são criadas
promoções nem indicadores de vendas fictícios.

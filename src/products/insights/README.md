# EPAVInsights — primeira etapa da migração

O catálogo público do Yourcipe está disponível em `#/insights` e
`#/insights/produtos`. Usuários e dados continuam no mesmo projeto Supabase;
esta etapa não altera tabelas, políticas, usuários nem funções de preço.

## Recursos

- Produtos ativos do catálogo público, com categorias reais.
- Busca por nome, código e categoria, ignorando acentos.
- Filtro por categoria e por preço condicionado à quantidade.
- Paginação visual de 24 produtos, nomes completos e imagens sob demanda.
- Detalhes em Dialog do design system, com receitas publicadas relacionadas.
- Ingredientes, complementos, preparo e dicas das receitas.
- Preço regular separado do preço promocional e sua quantidade mínima.
- Indicação de referência quando a última confirmação tem mais de 24 horas
  ou o preço não está confirmado; peças com peso variável têm aviso próprio.
- Loading, catálogo vazio, busca sem resultados, timeout e tentativa novamente.

## Integração

`components → catalogService → catalogRepository → REST público do Supabase`.
As relações usam os mesmos nomes de FK do Yourcipe. As leituras de produtos
restringem `scope=site` e `active=true`; as de receitas restringem
`scope=site` e `status=published`. As políticas RLS existentes continuam
sendo a autoridade. Não há operações de escrita ou sessão autenticada.

O repositório lê todas as páginas, avançando pelo número efetivamente retornado
pelo servidor para evitar truncamento. O transporte limita cada requisição a
15 segundos. Componentes cancelam solicitações ao desmontar e ignoram
respostas antigas. Receitas e ingredientes são carregados ao abrir detalhes.

Configuração opcional no build:

- `VITE_CATALOG_URL`
- `VITE_CATALOG_PUBLISHABLE_KEY` (somente chave pública para navegador)

Os valores padrão apontam para o projeto já usado pelo Yourcipe. Não forneça
chaves administrativas ou service_role ao frontend.

## Navegação e transição

A barra principal usa quatro colunas nas telas menores, mantendo Início,
Insights, Planner e Writer acessíveis. Conta e recursos ainda não migrados
continuam disponíveis pelo link para o Yourcipe. Login, personalização,
administração e a página independente de receitas ficam para etapas seguintes.

## Verificação

`npm run verify` executa lint, verificação de arquitetura, testes e build.
Os testes desta etapa cobrem paginação, pesquisa, filtros, preços condicionais,
receitas, recuperação de erros, cancelamento e respostas atrasadas.

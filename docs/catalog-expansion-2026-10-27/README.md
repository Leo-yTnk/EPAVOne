# Receitas pessoais e ampliação do catálogo — 27/10/2026

## Criados por mim

Home do Insights e Receitas exibem um carrossel independente **Criados por mim** apenas para contas autenticadas. A consulta usa o SDK autenticado com `scope=personal` e `owner_id` da sessão. Detalhes e ingredientes também usam a sessão, com join da receita filtrado por proprietário. RLS continua sendo a autoridade no banco. Não há nova migration ou mudança de permissões.

A seção aplica a busca da página e, em Receitas, os filtros de categoria e até 30 minutos. O filtro de seção pública não restringe criações pessoais. Contagens do catálogo são identificadas como públicas para contas conectadas. Loading, vazio e falha com tentativa novamente são independentes do catálogo público.

Sair ou trocar de conta desmonta imediatamente a seção e qualquer diálogo pessoal. Consultas são canceladas e respostas antigas ignoradas. Receitas privadas não entram em `loadHome`, na consulta pública ou nas seções administrativas. Compartilhamentos concedidos anteriormente continuam sujeitos às regras existentes, sem colocar receitas de terceiros em Criados por mim.

## Excel de importação

O arquivo segue os nomes e cabeçalhos de `creation/admin/importTemplate.js`. Contém as seis abas obrigatórias e duas abas informativas, **Produtos ausentes** e **Como importar**, ignoradas pelo parser. Contagens e critérios estão em [summary.json](summary.json).

| Conteúdo                                       | Quantidade |
| ---------------------------------------------- | ---------: |
| Receitas autorais novas                        |         42 |
| Produtos públicos enumerados na Swift          |        996 |
| Identidades encontradas no EPAVOne por URL/SKU |        191 |
| Produtos ausentes incluídos                    |        805 |
| Variantes com nome já cadastrado               |          5 |

O EPAVOne retornou 197 produtos e 82 receitas públicas na consulta. As receitas novas não repetem os nomes das 82 existentes. As 42 composições incluem aves, bovinos, suínos, pescados, vegetarianas, lanches e sobremesas. Cada uma usa pelo menos dois produtos vendidos na Swift, quantidades explícitas e quatro etapas. Os extras concentram temperos e complementos, sem deslocar a base da receita para compras externas. São propostas autorais sem teste culinário presencial.

Ingredientes respeitam a unidade cadastrada: por exemplo, 0,5 pacote de tilápia 800 g equivale a 400 g. A quantidade de ovos é fração da embalagem de dez. Há indicação desses critérios no Excel e nas dicas. Fotos oficiais são usadas nos produtos. Receitas ficam sem URL de imagem, usando o fallback do site, para não apresentar uma foto de ingrediente como prato final.

Os 805 registros incluem produtos de outras marcas vendidos pela Swift. Não foram inventados preços, fotos, SKUs ou fontes. São ausentes por identidade (SKU/URL), e não simplesmente por grafia: cinco nomes já existentes com outra identidade recebem sufixo de SKU para permitir revisão sem fusão silenciosa. A ausência de oferta pública não elimina o produto do inventário. A disponibilidade registrada é a da consulta sem CEP, sem garantia de estoque regional.

## Fontes e limites da consulta

- Catálogo oficial: `https://swiftbr.vtexcommercestable.com.br/api/catalog_system/pub/products/search`, páginas de 50 registros. URLs e imagens individuais estão no Excel e no [snapshot público](source.json).
- Duas varreduras completas retornaram o mesmo conjunto de 996 IDs. As páginas preenchidas indicaram total 996. Páginas vazias após o fim indicaram 997, mas não retornaram o item adicional. A cobertura corresponde aos 996 registros efetivamente enumerados. Não afirma abranger produtos ocultos, não publicados ou exclusivos de outra região.
- Comparação: leitura anônima do catálogo EPAVOne existente em 27/10/2026. O snapshot não contém perfis, credenciais ou receitas pessoais.
- Cocção: [USDA/FSIS](https://ask.fsis.usda.gov/article/What-is-a-safe-internal-temperature-for-cooking-meat-and-poultry) e [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures). Tempos são estimados, sem descongelamento. Rótulos e temperatura interna prevalecem sobre o tempo aproximado.

## Importar e publicar

1. Administração → Importação → selecionar o Excel → **Adicionar novos**.
2. Conferir categorias, seções, prévia e variantes. Se o catálogo mudou depois de 27/10, manter os originais e resolver as duplicatas na prévia.
3. Confirmar somente após conferir o resumo. O Excel alimenta o catálogo público administrativo, separadamente das receitas pessoais.
4. Conferir as 42 receitas na Home e em Receitas, ingredientes e produtos. Preços dependem da sincronização habitual e disponibilidade regional.

Não houve importação ou publicação deste lote no banco hospedado nesta sessão.

## Reprodução e validação

- `node scripts/prepare-recipes-import.mjs` reproduz as abas a partir do snapshot e de `scripts/recipes-42-data.mjs`, verifica nomes novos, quantidades, referências, pelo menos dois produtos por receita e valida o parser real.
- `tests/personal-recipes.test.jsx` cobre Home/Receitas, ingredientes privados, visitante, busca, erros independentes, retry, troca de conta, saída e resposta tardia.
- `tests/personal-recipes-repository.test.js` verifica os filtros explícitos de proprietário/escopo e a paginação.
- `npm run verify`: 97 arquivos, 476 testes, lint, arquitetura, tokens e build aprovados na verificação final.
- `node scripts/verify-recipes-workbook.mjs <arquivo.xlsx>` leu o Excel exportado pelo importador real: 42 receitas, 805 produtos, 84 vínculos de receitas e 805 vínculos de produtos, sem erros.
- Revisão visual no navegador não concluída: Chromium indisponível e download retornou arquivo inválido. Os testes de interface usam jsdom, sem autenticação hospedada. O Excel foi renderizado e validado com o parser do aplicativo.

## Encerramento do Yourcipe

O proprietário confirmou Yourcipe-EPAV encerrado e arquivado, migrations aplicadas, preços atualizando e publicação funcionando. O [encerramento operacional](../migration-closeout.md) foi atualizado e seu checklist anterior preservado como histórico. Permanecem a homologação com contas reais A/B/admin, backup/restauração e piloto com outro aluno.

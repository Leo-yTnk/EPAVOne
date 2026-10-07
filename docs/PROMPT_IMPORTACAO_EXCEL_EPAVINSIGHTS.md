# Prompt — gerar um Excel de catálogo para o EPAVInsights

Use este documento como instrução para preparar uma planilha `.xlsx` importável. Ele descreve o contrato implementado em `importTemplate.js`, `workbookService.js`, `importParser.js` e na RPC aditiva da migration 042. Não é o formulário semanal de pedidos do EPAVWriter.

## Instrução principal

Você deve converter os dados fornecidos em um arquivo `.xlsx` compatível com o importador do catálogo EPAVInsights, preservando exatamente os nomes das seis abas e os cabeçalhos abaixo. O objetivo é **Adicionar novos**, sem substituir, excluir, reativar ou alterar registros existentes.

Antes de gerar o arquivo:

1. Leia `AGENTS.md`, `ARCHITECTURE.md` e a documentação atual de criação/importação. Confira o contrato real dos arquivos citados acima; não altere o parser para acomodar uma planilha fora do padrão.
2. Consulte o catálogo público atual por meio autorizado, incluindo itens inativos e categorias existentes. Se não tiver acesso ao catálogo administrativo completo, declare essa limitação; não diga que verificou duplicatas inativas.
3. Confirme produtos nas páginas oficiais Swift, nomes/apresentação, URL específica e imagem oficial vinculada ao produto. Não deduza SKU a partir do nome de imagem, slug ou código aparente. Não invente preços, URLs, imagens ou receitas.
4. Compare nomes sem diferenças de acentuação/caixa e espaços nas pontas, identidade da URL Swift e SKU já verificado. Uma única URL/SKU estável pode corresponder a um nome editorial diferente; reutilize a identidade existente. Se nome e URL/SKU apontarem a registros diferentes, interrompa a preparação desse registro e relate o conflito.
5. Reutilize categorias existentes, inclusive inativas, sem reativá-las. Declare somente as categorias necessárias que ainda não existem, com o tipo correto. Categorias de produto e de receita são entidades distintas, mesmo quando têm o mesmo nome.
6. Gere somente registros com dados suficientes. Liste separadamente pendências e conflitos; não insira observações, placeholders ou linhas de exemplo no arquivo destinado à importação.
7. Valide as seis abas, os campos e todas as referências. Apresente resumo de novos, ignorados e conflitos, fontes consultadas e limitações. Entregue o `.xlsx` para revisão; gerar o arquivo não autoriza gravar no catálogo.

## Estrutura obrigatória

O arquivo deve conter todas estas abas, mesmo quando só produtos forem adicionados. A primeira linha de cada aba contém os cabeçalhos; os dados começam na linha 2. Nas abas sem registros, deixe **somente os cabeçalhos**, sem linhas de exemplo ou mensagens como “sem dados”.

| Aba                | Cabeçalhos exatos, na ordem recomendada                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Produtos           | `nome`, `categoria`, `unidade`, `imagem`, `swift_url`, `swift_sku`                                                             |
| Receitas           | `nome`, `categoria`, `tempo`, `porcoes`, `dificuldade`, `imagem`, `destaque`, `ingredientes`, `extras`, `modoPreparo`, `dicas` |
| Categorias         | `tipo`, `nome`                                                                                                                 |
| Seções             | `pagina`, `secao`, `ordem`, `ativa`                                                                                            |
| Receitas por Seção | `pagina`, `secao`, `receita`, `ordem`                                                                                          |
| Produtos por Seção | `pagina`, `secao`, `produto`, `ordem`                                                                                          |

Não renomeie para “Products”, “Modo de preparo”, “Receitas por Categoria” etc. Embora o parser aceite algumas normalizações, use sempre o padrão acima para evitar depender de aliases.

Regras gerais:

- Arquivo `.xlsx`, até **10 MB** e **5.000 registros somados nas seis abas**, desconsiderando os cabeçalhos.
- Não use fórmulas, macros, células mescladas, títulos acima do cabeçalho ou cabeçalhos duplicados.
- Guarde nomes, URLs e SKUs como texto. Um SKU numérico com zeros à esquerda deve continuar texto.
- Use valores, não fórmulas com resultado em cache. Fórmulas em qualquer aba são rejeitadas.
- O arquivo inteiro sem registros é inválido. Abas individuais vazias são válidas.
- Não crie colunas de controle como `modo`, `replace_all`, `scope`, `owner_id`, `status`, `active` ou IDs internos. Elas não comandam a escrita. O servidor define o fluxo aditivo.
- Não inclua `preco`/`preço`: este contrato deixa preços pendentes de consulta Swift. Nunca coloque um preço fictício ou zero para representar preço confirmado.

## Produtos

| Campo       | Regra                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nome`      | Nome não vazio, específico para a apresentação; preserve peso/volume quando consta na fonte. Não agrupe apresentações diferentes sob o mesmo nome.                                                              |
| `categoria` | Nome de uma categoria `proteina`, existente no catálogo ou declarada em Categorias.                                                                                                                             |
| `unidade`   | Exatamente `kg`, `un`, `pacote`, `caixa` ou `pote`. Use a unidade pertinente ao cadastro; não invente `g`, `ml`, `embalagem` ou `unidade`.                                                                      |
| `imagem`    | URL HTTP/HTTPS não vazia. Para produtos Swift, use imagem oficial verificada na página do produto, preferencialmente HTTPS. Não use Google Images, bancos de imagem ou foto de outro SKU.                       |
| `swift_url` | URL HTTPS da página específica do produto no domínio Swift. Obrigatória para produto novo. Preferir `https://www.swift.com.br/...`, sem query de rastreamento ou fragmento. Não usar página de busca/categoria. |
| `swift_sku` | Opcional: deixar vazio quando não verificado. Não preencher “desconhecido”, `0` ou um identificador inferido. Mesmo informado, um SKU novo só será persistido após verificação oficial pelo sincronizador.      |

Preencha todos os campos obrigatórios também em linhas que possam ser ignoradas. Não dependa do preenchimento automático a partir de registros existentes.

**Exemplo com fonte pública oficial** — revalidar antes de gerar/importar; não indica preço ou disponibilidade regional atual:

| nome                                 | categoria  | unidade | imagem                                                                                      | swift_url                                                            | swift_sku |
| ------------------------------------ | ---------- | ------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------- |
| Petit Gateau de Chocolate Swift 240g | Sobremesas | pacote  | https://swiftbr.vteximg.com.br/arquivos/ids/213919/616281-petit-gateau-de-chocolate_rec.jpg | https://www.swift.com.br/detail/petit-gateau-de-chocolate-swift-240g |           |

A célula `swift_sku` do exemplo está realmente vazia. A URL `/detail/` é uma página oficial válida; a identidade de duplicação também considera variantes legadas `/p`, mas preserve a URL oficial consultada.

## Categorias

| Campo  | Regra                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tipo` | Exatamente `proteina` para produtos ou `receita` para receitas. Não usar `secao`, `secao_home`, `secao_receita` ou `secao_produto`. |
| `nome` | Nome não vazio. Referências das demais abas devem usar esse nome. Não declarar a mesma combinação tipo/nome duas vezes.             |

Exemplo, **somente se Sobremesas ainda não existir como categoria de produto**:

| tipo     | nome       |
| -------- | ---------- |
| proteina | Sobremesas |

Se a categoria existir, mantenha a aba Categorias apenas com cabeçalhos quando não houver outras categorias a criar. Se declarar uma categoria existente, o fluxo aditivo a ignora; não muda o nome nem a situação ativa.

## Receitas

| Campo          | Regra                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nome`         | Nome não vazio e único no arquivo.                                                                                                                                                   |
| `categoria`    | Categoria do tipo `receita`, existente ou declarada. Para receita nova, a categoria precisa estar ativa no contrato de gravação vigente. Não reative uma categoria só para importar. |
| `tempo`        | Número inteiro de minutos, maior ou igual a zero. Preencher explicitamente, mesmo quando zero.                                                                                       |
| `porcoes`      | Número inteiro maior ou igual a 1.                                                                                                                                                   |
| `dificuldade`  | Exatamente `Fácil`, `Médio` ou `Difícil`; preencher explicitamente.                                                                                                                  |
| `imagem`       | Opcional; se informada, URL HTTP/HTTPS válida de imagem que possa ser usada. Não atribuir imagem de produto a uma receita como se fosse foto de preparo.                             |
| `destaque`     | Recomenda-se `sim` ou `não`. Verdadeiro também aceita `true` e `1`; falso pode usar `false` e `0`. Destaque não substitui os vínculos por seção.                                     |
| `ingredientes` | Uma ou mais referências no formato `Nome exato do produto:quantidade`, separadas por `;`. Quantidade numérica positiva, medida na unidade do produto cadastrado.                     |
| `extras`       | Opcional, itens livres separados por `;`. Não criam produtos nem ingredientes vinculados.                                                                                            |
| `modoPreparo`  | Uma ou mais etapas, separadas por `;`, na ordem de execução.                                                                                                                         |
| `dicas`        | Opcional, textos separados por `;`.                                                                                                                                                  |

Exemplo de sintaxe de ingredientes: `Produto A:1.5; Produto B:2`. Se Produto A está cadastrado em `kg`, `1.5` significa 1,5 kg. Se está cadastrado em `pacote`, significa 1,5 pacote, não 1,5 g. Não acrescente a unidade à quantidade (`1.5 kg` é inválido). O parser aceita vírgula decimal, mas prefira ponto para portabilidade. Reúna um produto repetido em uma única entrada e some sua quantidade.

Use `;` exclusivamente como separador de listas e etapas; não insira esse caractere dentro do nome do produto ou do texto de uma etapa. Prefira nomes de produtos sem `:` para tornar o vínculo legível.

**Exemplo estrutural fictício, somente para entender o contrato** — não é conteúdo Swift, não deve ser incluído automaticamente em arquivo de produção. Requer categoria `receita` “Exemplos” e produto ativo “Produto A”, já existentes ou criados no mesmo lote:

| nome               | categoria | tempo | porcoes | dificuldade | imagem | destaque | ingredientes | extras                  | modoPreparo                                                                      | dicas                 |
| ------------------ | --------- | ----- | ------- | ----------- | ------ | -------- | ------------ | ----------------------- | -------------------------------------------------------------------------------- | --------------------- |
| Receita de exemplo | Exemplos  | 20    | 2       | Fácil       |        | não      | Produto A:1  | Acompanhamento opcional | Separe os ingredientes.; Execute o preparo autorizado para esse produto.; Sirva. | Confira o rendimento. |

Não copie receitas de terceiros sem fonte e autorização adequadas. Não invente tempos/instruções para preencher lacunas. Entregue pendências em relatório separado.

**Publicação:** neste contrato, receitas novas importadas são inseridas como publicadas. Não existe uma coluna `status` para importar rascunhos. Para trabalhar em rascunho, use o editor administrativo e suas permissões de publicação; não confirme a importação de conteúdo ainda não revisado.

## Seções e vínculos

Seções organizam as páginas e são diferentes de categorias. A identidade de uma seção é composta por página + nome/slug. Uma seção de mesmo nome em `home` e `recipes` representa duas seções distintas.

| Campo     | Regra                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pagina`  | Exatamente `home`, `recipes` ou `products`.                                                                                                               |
| `secao`   | Nome não vazio. Para um vínculo, deve existir nessa página no catálogo ou ser declarado na aba Seções do mesmo arquivo.                                   |
| `ordem`   | Inteiro maior ou igual a zero; preencher explicitamente. É a ordem da seção na aba Seções ou do item dentro da seção nas abas de vínculos.                |
| `ativa`   | Obrigatório em Seções. Recomenda-se `sim`/`não`; também aceita `true`/`false` ou `1`/`0`. Não altera a situação de seção existente em importação aditiva. |
| `receita` | Nome de receita existente ou declarada em Receitas. Permitido somente em `home` e `recipes`.                                                              |
| `produto` | Nome de produto existente ou declarado em Produtos. Permitido somente em `products`.                                                                      |

Exemplo de **Seções**, se estas ainda não existirem:

| pagina   | secao                        | ordem | ativa |
| -------- | ---------------------------- | ----- | ----- |
| products | Sobremesas para compartilhar | 0     | sim   |
| recipes  | Ideias de preparo            | 0     | sim   |

Exemplo de **Produtos por Seção**, usando o produto oficial do exemplo:

| pagina   | secao                        | produto                              | ordem |
| -------- | ---------------------------- | ------------------------------------ | ----- |
| products | Sobremesas para compartilhar | Petit Gateau de Chocolate Swift 240g | 0     |

Exemplo estrutural de **Receitas por Seção**, condicionado à receita fictícia anterior existir:

| pagina  | secao             | receita            | ordem |
| ------- | ----------------- | ------------------ | ----- |
| recipes | Ideias de preparo | Receita de exemplo | 0     |

Em Adicionar novos, seção ou vínculo existentes são ignorados. Um `ordem` diferente no arquivo **não reorganiza** um vínculo já existente. Reorganize pelo gerenciamento de seções, após revisão, quando esse for o objetivo.

## Caso mínimo: importar somente produtos

Para adicionar o Petit Gateau do exemplo sem criar receitas nem seções:

- Produtos: uma linha completa com o produto oficial.
- Categorias: uma linha `proteina / Sobremesas` somente se necessária; caso contrário, cabeçalhos apenas.
- Receitas, Seções, Receitas por Seção e Produtos por Seção: cabeçalhos apenas.

O lote de aceitação `Produtos_Swift_Adicionar_Yourcipe.xlsx` foi validado localmente com 11 produtos, quatro categorias declaradas e nenhuma receita, seção ou vínculo novo. O arquivo particular do usuário não integra este repositório público; o CI gera sua própria planilha sintética a partir do lote oficial público do código.

## Falhas que impedem a confirmação

| Exemplo incorreto                                        | Correção                                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Falta a aba Receitas porque o arquivo contém só produtos | Criar Receitas com seus 11 cabeçalhos e nenhuma linha de dados.                               |
| `tipo=produto`                                           | Usar `proteina`.                                                                              |
| `unidade=embalagem`                                      | Identificar a unidade correta e usar um dos cinco valores permitidos, por exemplo `pacote`.   |
| `ingredientes=Produto A:500g`                            | Converter para a unidade real do cadastro; se `kg`, usar `Produto A:0.5`.                     |
| `ingredientes=Produto inexistente:1`                     | Vincular produto ativo existente ou declarar um novo produto completo e verificável.          |
| `pagina=products` em Receitas por Seção                  | Usar `home` ou `recipes` e uma seção dessa página.                                            |
| Mesmo nome com URL de outro produto                      | Parar e conferir a identidade; não renomear nem forçar a importação para escapar do conflito. |
| SKU deduzido do nome do arquivo da imagem                | Deixar vazio até verificação oficial.                                                         |
| Nova ordem para seção já existente                       | O importador ignora a alteração; usar o gerenciamento de seções.                              |
| Fórmula `=1+1` em qualquer célula                        | Substituir por valor antes de gerar o arquivo.                                                |

A geração deve terminar com um resumo por entidade: quantidade de linhas, novos, ignorados, conflitos e pendências. Não confundir linhas declaradas com quantidade efetivamente adicionada: categorias e produtos existentes podem ser ignorados.

## Validação e uso no site

1. Baixe o modelo pela área de Criação → Administração → **Importar Excel do catálogo** e compare os cabeçalhos.
2. Prepare o arquivo e confira as fontes, imagens, unidades e referências. Não misture o formulário semanal do Writer.
3. Envie o `.xlsx`, confira as seis prévias e corrija cada erro de aba/linha/coluna. Identidades conflitantes não podem ser confirmadas.
4. A confirmação deve ocorrer somente após revisão consciente. O serviço reconsulta o catálogo e o backend revalida dentro de uma transação. Uma falha desfaz o lote inteiro; repetir um lote concluído não deve duplicar os registros existentes.
5. Confira o resumo retornado pelo servidor e consulte o catálogo. Em seguida, use a sincronização Swift com o CEP de referência para obter preços verificáveis, preservando o último valor válido em falhas.
6. Disponibilidade/preço do site Swift e disponibilidade do formulário semanal EPAV são informações distintas. Enviar um CEP não comprova que a resposta respeitou aquela região; confira a indicação de confirmação regional e não prometa valores regionais sem evidência.

A gravação exige conta administradora e a migration 042. Observações/revisão Swift exigem 043 antes do deploy da nova função Edge. O usuário executa as migrations após diagnóstico; este prompt não autoriza executar histórico SQL, criar scheduler duplicado ou arquivar o Yourcipe.

# Criação, importação aditiva e observações Swift

## Inventário do main

Receitas/produtos/categorias já tinham criação, edição, filtros, biblioteca pessoal, solicitações, publicação administrativa, proteção de alterações não salvas e escritores transacionais com versão. Páginas/seções e importação normalizada em seis abas já existiam. O Writer possui outro importador, independente. Estes fluxos foram preservados.

Lacunas corrigidas: modos destrutivos visíveis no importador; restauração de vocabulário inativo pelo helper legado; falta de resumo e prévia para todas as entidades; números de linha após linhas vazias; ausência de prévia de conteúdo no editor; metadados oficiais e disponibilidade não observados separadamente do conteúdo editorial; resumo de sincronização ocultando falhas parciais.

## Entrega

- Atalho administrativo para importar Excel, seis abas, novos/ignorados/conflitos e confirmação explícita.
- `admin_add_public_catalog` aceita somente seis arrays, sem argumento de modo. Seu core privado é inacessível diretamente ao usuário. Não chama restauração de categorias legadas. Usa locks transacionais para revalidar identidades inclusive contra escritores concorrentes.
- A mesma identidade por nome normalizado/URL/SKU pode ser ignorada; identidades divididas ou contraditórias interrompem o lote. URLs legadas `/detail/` e `/p` são comparadas por identidade. Aliases únicos são resolvidos também nos ingredientes e vínculos. Categorias inativas são reutilizadas sem reativação. Receitas novas ainda exigem os vínculos ativos do contrato legado; uma falha retorna rollback integral.
- O preço numérico legado obrigatório recebe apenas o sentinel `0` em produto novo, com `STALE` e sem confirmação/preço em centavos. Não representa preço Swift verificado. Preços da planilha não são importados. SKUs novos só são persistidos após observação oficial.
- Observações Swift têm RLS administrativa; mostram nome, imagem oficial quando presente, apresentação extraída do nome e disponibilidade explícita da oferta (`unknown` quando ausente). Revisão seletiva de nome/imagem confere versão e instante da observação. Não altera categorias, estado ativo ou receitas.
- Atualização de preço/histórico e observação ocorrem na mesma transação pelo wrapper da RPC existente. Uma falha não apaga o último preço nem os metadados anteriores. Continua um único scheduler e uma única função Edge.
- Editor permite prévia de conteúdo/imagem, erro de carregamento de imagem e quantidades com unidade explícita. Preserva DM Serif Display, Inter, Warm Paper e laranja; mantém Cards do DS e reduced-motion.

## Aceitação

O arquivo real `Produtos_Swift_Adicionar_Yourcipe.xlsx` foi localizado e validado localmente: **11 produtos**, **4 categorias**, imagens no host oficial e quatro abas sem dados. Parser e prévia passaram; itens inativos na fixture são ignorados. O Excel do usuário não integra o repositório público. A suíte e o CI constroem uma planilha sintética a partir exclusivamente dos produtos oficiais já públicos no código. Testes PostgreSQL embarcado cobrem repetição, preservação de linhas, rollback depois de tentativa de inserir produto, conflito de identidade, referências inválidas, ordem de vínculos e acesso anônimo/comum/admin. A persistência de preço usada no teste específico de 043 é uma fixture; não certifica a função de preço hospedada.

A captura local foi bloqueada: binário Chromium truncado (ELF incompleto, SIGSEGV) e download de Playwright inválido. O script `scripts/review-creation-import.mjs` e o workflow **Creation import visual review** executam a matriz 1440/390/320 px × claro/escuro, upload do XLSX sintético de fonte pública, confirmação, prévia/editor/proteção de alterações e revisão seletiva Swift. Capturas e resultados são anexados como `creation-import-screenshots`. Resultados do CI devem ser conferidos antes de considerar a inspeção visual concluída. Sessões e serviços são fixtures; não há escrita no banco hospedado.

## Implantação e limites

1. Executar diagnóstico; conferir definições atuais. Aplicar somente **042** e **043** se ausentes, após revisão/backup. Nunca executar novamente o histórico ou db push consolidado.
2. Implantar a função Edge atualizada **depois de 043**, pelo único workflow EPAVOne existente. Não criar cron, scheduler ou função duplicada. Configuração privada continua em `docs/migration-closeout.md`; nenhuma nova secret é necessária.
3. Publicar o frontend, conferir RPCs/RLS com contas reais, importar o Excel com admin e sincronizar controladamente.

Não houve migration, importação, publicação ou login real em produção. O repositório antigo foi conferido por `git ls-remote`, sem arquivamento. A leitura pública do Pages pelo buscador estava indisponível. A página oficial de Petit Gateau foi recuperada e inclui imagem oficial; isso não certifica todos os preços regionais.

**Região:** cookies e header solicitam o CEP configurado. A página não fornece evidência suficiente de que respeitou essa região; `region_confirmed=false` é intencional. A tela explica esta limitação e exige conferência. Disponibilidade do site não é disponibilidade da planilha EPAV. Não há descoberta irrestrita de novos produtos: a importação continua revisada, com lote conhecido e URLs oficiais; não copiamos receitas. Fontes sem imagem/metadados estruturados não recebem informações inferidas. O parser conservador pode rejeitar páginas legítimas; não contorna bloqueios.

`npm run verify`: 51 arquivos / 237 testes e build aprovados. A advertência de lint em review-migration.mjs já existia no main.

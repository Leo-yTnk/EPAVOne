# Hierarquia da ficha de receita

Título display maior; títulos de seção em Inter Tight bold com ícones discretos; nomes e quantidades mais fortes que ações/metadados. Dicas e outros ingredientes têm um nível tipográfico menor. Intervalos entre seções superam os intervalos dentro dos grupos, sem novas superfícies de fundo.

Corrige duas declarações inválidas `var (` nos shorthands de fonte, substituindo-as por propriedades explícitas. A revisão de navegador compara os tamanhos computados: título > seção > dicas.

Validação: 327 testes, arquitetura e build; oito cenários visuais em claro/escuro e 320/390/768/1440px, histórico de detalhes, movimento reduzido, gaveta e fallback arredondado. Capturas com catálogo controlado sem fotos externas; não valida Safari físico.

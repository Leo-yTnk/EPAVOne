# Revisão da padronização

Implementação baseada em `75e7828` (main após o PR #69). As capturas mostram componentes reais com dados de demonstração, não uma conta de produção.

| Verificação             | Resultado                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`        | 79 arquivos e 358 testes aprovados; arquitetura, catálogo de tokens e build aprovados                                                                |
| Rotas e preferências    | 148 verificações, incluindo 320, 390, 768, 1024 e 1440 px, claro/escuro, texto ampliado, densidade compacta, movimento reduzido e navegação vertical |
| Interações              | 16 fluxos aprovados: detalhes de receita/produto com retorno de foco, cadastro com Select em portal e Writer do upload ao download                   |
| Workspaces              | 96 verificações: bibliotecas, administração, importação, seções, duplicatas, manutenção, editores e laboratório                                      |
| Contrato entre produtos | Mesmos raios, padding, fontes e alturas nos quatro exemplos; quatro cores principais distintas                                                       |
| Writer compacto         | Testes específicos da troca do arquivo, preservação após erro e fluxo completo de pedido aprovados                                                   |
| Console de execução     | Sem `pageerror` nos cenários verificados                                                                                                             |
| Lint                    | Sem erros; permanece um aviso anterior em `scripts/review-migration.mjs` sobre uso de console                                                        |

A revisão visual dos prints conferiu hierarquia, costuras, espaços internos, formulários, imagens, ações e leitura nos temas. Foram corrigidos conflitos residuais de padding do cabeçalho do Insights e tipografia do Writer durante essa revisão. O bloco de Excel validado também foi compactado para priorizar a etapa atual.

## Prints

- [Mesmos componentes nas quatro cores](shared-components-desktop.png)
- [Componentes no celular e tema escuro](shared-components-mobile-dark.png)
- [Insights desktop](insights-desktop.png) · [celular escuro](insights-mobile-dark.png)
- [Planner desktop](planner-desktop.png)
- [Writer desktop](writer-desktop.png) · [celular escuro](writer-mobile-dark.png)
- [Administração desktop](admin-desktop.png)
- [Editor de receita no celular](recipe-editor-mobile-dark.png)
- [Diálogo de receita no celular](recipe-dialog-mobile-dark.png)

## Peso do build

Comparação de builds limpos, somando todos os arquivos JS/CSS, sem sourcemaps, com gzip calculado da mesma forma nos dois builds:

| Recurso               |         Antes |        Depois |              Variação |
| --------------------- | ------------: | ------------: | --------------------: |
| JavaScript minificado | 679.232 bytes | 678.033 bytes |          −1.199 bytes |
| CSS minificado        | 142.678 bytes | 142.112 bytes |            −566 bytes |
| JavaScript + CSS gzip | 233.672 bytes | 234.954 bytes | +1.282 bytes (+0,55%) |

Não foram adicionadas dependências de execução, efeitos de blur nem novos loops de animação. Esses números medem transferência dos bundles completos; não são uma medição de CPU ou memória em um aparelho físico.

Resultados reproduzíveis: [páginas e fluxos](pages-and-flows.json), [workspaces](workspaces.json) e [bundles](bundle.json). Os scripts estão descritos no [contrato do design system](../README.md).

A homologação com contas e dados reais e a verificação em Safari/iPhone físicos continuam fora desta validação local. Não há migrations nem alterações em regras de negócio ou gravações no backend nesta entrega.

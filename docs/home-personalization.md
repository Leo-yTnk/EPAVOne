# Home e preferências pessoais

A home recebe preferências do shell, sem importar estado interno de outros apps. Os atalhos usam as rotas existentes de Insights, Planner e Writer. A apresentação antiga de Planner “em desenvolvimento” foi removida.

## Experiência por horário

Usa o relógio e o fuso local do dispositivo:

| Horário | Cenário |
| --- | --- |
| 00h–04h59 | Madrugada, tom azul suave |
| 05h–07h59 | Amanhecer, tom quente |
| 08h–11h59 | Manhã, tom dourado |
| 12h–17h59 | Tarde, tom azul claro |
| 18h–23h59 | Noite, tom lilás |

Saudação, mensagem e cenário são reavaliados a cada 30 segundos e ao retornar à janela. O intervalo e os listeners são removidos ao sair da home. O cenário não troca o tema claro/escuro escolhido. Os fundos são gradientes CSS, sem imagens externas, blur ou elementos com posicionamento absoluto. Os Cards da home mantêm a costura canônica em uma célula de Grid compartilhada com seu conteúdo, sem `position: absolute`.

## Configurações

- Nome ou apelido opcional na saudação (até 40 caracteres, independente do nome da conta).
- Atalho principal: Planner, Insights ou Writer.
- Fundo da home: adaptativo ou papel neutro.
- Mensagem de inspiração e lembrete semanal, ambos opcionais.
- Tema claro/escuro, densidade confortável/compacta e quadriculado opcional.
- Leitura padrão/ampliada (112,5%) e redução de animações.
- Navegação horizontal/vertical, preservando a adaptação para celular.
- Conta, biblioteca e revisão de dados antigos preservadas.

Preferências ficam em `epavone-preferences` no navegador. A leitura valida os valores, preserva escolhas antigas e completa os novos campos com os padrões. Restauração repõe todas as preferências e o tema claro. Falha de armazenamento mantém as escolhas na sessão e exibe o feedback já existente. Não há mudança de banco nem migration.

## Verificação

Os testes cobrem limites dos horários locais, troca automática com a página aberta, limpeza do intervalo, conteúdo opcional, destino do atalho, controles, persistência, compatibilidade com preferências antigas, valores inválidos e restauração. O quality gate é `npm run verify`.

A inspeção visual em navegador não ficou disponível neste ambiente. Responsividade, contraste final e costura em Grid devem ser conferidos no preview/CI antes do merge; testes de DOM não certificam layout renderizado.

Resultado local: ESLint sem erros (um aviso preexistente em `review-migration.mjs`), architecture checker aprovado e build aprovado. Na repetição com `VITEST_MAX_FORKS=2 VITEST_MIN_FORKS=1 npm run verify`, 59 arquivos e 277 testes passaram; a suíte SQL `swift-sync-lifecycle` excedeu o limite de inicialização de 10 s. Seus três casos passaram isoladamente com `npm test -- tests/swift-sync-lifecycle.test.js --maxWorkers=1 --hookTimeout=60000`. Portanto, os 280 casos passaram em execuções complementares; a execução literal completa de `verify` não terminou com sucesso. Os 14 testes novos de personalização passaram.

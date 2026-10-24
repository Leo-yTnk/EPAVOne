# Segunda composição dos detalhes de receita

Nova abertura com foto e título lado a lado no desktop e foto acima do título no mobile. A descrição existente é exibida quando disponível. Ingredientes usam linhas compactas de foto/nome/quantidade e ação de consulta discreta. Preparo usa passos numerados com coluna própria, e dicas ficam com acento lateral, sem caixa adicional. Títulos de seção usam a fonte display; o diálogo conserva fechamento e leitura em regiões separadas.

Raio mobile aumentado de 24 para 28px; tokens associados sobem discretamente, preservando as cápsulas da navbar e o espaçamento da gaveta.

Verificação: 327 testes, lint, arquitetura e build aprovados. Oito cenários em Chromium (320/390/768/1440px, claro/escuro) com navegação receita/produto/volta e movimento reduzido; gaveta e fallback arredondado também conferidos. O catálogo das capturas é controlado e não carrega fotos externas. Safari físico não foi certificado.

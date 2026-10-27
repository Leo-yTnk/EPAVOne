export const tutorialSteps = [
  {
    app: 'one',
    topic: 'Boas-vindas',
    title: 'Sua rotina, do primeiro contato ao pedido.',
    copy: 'O EPAVOne reúne três apps que trabalham juntos. Use este guia no seu ritmo e volte a qualquer etapa.',
    items: [
      ['Planner', 'Organize clientes, planeje atendimentos e acompanhe seus resultados.'],
      ['Insights', 'Consulte produtos e receitas para preparar ofertas que façam sentido.'],
      ['Writer', 'Preencha o formulário semanal, confira e baixe o pedido para enviar ao suporte.']
    ],
    tip: 'Você pode pular o guia e reabri-lo nas Configurações. Ele só abre automaticamente no primeiro acesso deste navegador.'
  },
  {
    app: 'one',
    topic: 'Navegação e conta',
    title: 'Encontre cada coisa no seu lugar.',
    copy: 'A barra superior mantém seus apps e as principais ações sempre por perto.',
    items: [
      ['Troque de app', 'Escolha One, Insights, Planner ou Writer. No celular, toque no nome do app ou em Navegação para abrir o painel.'],
      ['Use o botão Novo', 'Prepare um pedido, cadastre um cliente, registre uma venda ou crie receitas, produtos e categorias.'],
      [
        'Entre nas Configurações',
        'O ícone de engrenagem reúne sua conta, tema, navegação e acessibilidade. Entre na conta para usar sua carteira real e sua biblioteca.'
      ]
    ],
    tip: 'Sem conta, o Planner apresenta dados de demonstração. Conferir a sincronização antes de sair ajuda a garantir que seu trabalho foi salvo.'
  },
  {
    app: 'planner',
    topic: 'Clientes',
    title: 'Comece conhecendo quem você atende.',
    copy: 'No Planner, a página Clientes reúne sua carteira e o contexto de cada conversa.',
    items: [
      ['Cadastre', 'Use Novo → Cadastrar cliente. Informe o nome e complete segmento, posição física e frequência de contato.'],
      ['Prepare', 'Registre preferências, restrições, intenção de compra e observações. Use o perfil para preparar a abordagem.'],
      ['Mantenha atualizado', 'Abra o perfil para editar os dados. A exclusão pede confirmação; confira o cliente antes de confirmar.']
    ],
    tip: 'Preferências e restrições ajudam nas sugestões: não marque a mesma categoria nos dois campos.'
  },
  {
    app: 'planner',
    topic: 'Semana',
    title: 'Planeje, atenda e conclua.',
    copy: 'Selecione a semana de planejamento no Planner e organize os contatos em Semana.',
    items: [
      ['Planejar', 'Escolha os clientes da semana e prepare ofertas e combinados para cada um.'],
      ['Atender', 'Abra o atendimento do cliente, consulte a preparação e registre o que aconteceu na conversa.'],
      ['Concluir', 'Revise os atendimentos e os próximos passos. O Início mostra o que precisa da sua atenção.']
    ],
    tip: 'Confira a semana selecionada antes de registrar um atendimento. Você pode consultar outras semanas pelo seletor.'
  },
  {
    app: 'insights',
    topic: 'Produtos e receitas',
    title: 'Transforme informação em uma boa sugestão.',
    copy: 'Use as páginas Produtos e Receitas do Insights durante a preparação ou a conversa com o cliente.',
    items: [
      ['Explore', 'Navegue pelas coleções, busque e use os filtros disponíveis para encontrar uma opção.'],
      ['Veja os detalhes', 'Abra o produto ou a receita. Consulte informações, ingredientes, preparo e receitas relacionadas.'],
      [
        'Leve ao pedido',
        'Use a ação de adicionar ao pedido quando disponível. Confira no Writer a correspondência com o formulário da semana.'
      ]
    ],
    tip: 'O formulário semanal define os itens disponíveis para o pedido. Confirme a disponibilidade e os valores nele antes de finalizar.'
  },
  {
    app: 'insights',
    topic: 'Sua biblioteca',
    title: 'Guarde e compartilhe suas próprias ideias.',
    copy: 'Entre na conta para usar Criação, sua biblioteca pessoal dentro do Insights.',
    items: [
      ['Crie', 'Use Novo → Criar receita, produto ou categoria. Preencha os campos do editor e salve.'],
      ['Organize', 'Encontre o conteúdo nas abas Minhas receitas, Meus produtos e Minhas categorias para revisar e editar.'],
      [
        'Compartilhe',
        'Use as opções de compartilhamento de receitas ou solicite a avaliação para publicação. Acompanhe o retorno em Minhas solicitações.'
      ]
    ],
    tip: 'Salvar na biblioteca pessoal não publica automaticamente no catálogo público. A publicação passa por avaliação.'
  },
  {
    app: 'writer',
    topic: 'Formulário semanal',
    title: 'Anexe o Excel certo para começar.',
    copy: 'Abra o Writer por Novo → Preparar pedido. O formulário enviado pelo EPAV é a base do preenchimento.',
    items: [
      ['Anexe', 'Selecione o Excel da semana e aguarde a leitura. Se houver erro, leia o aviso e confira o arquivo.'],
      [
        'Identifique',
        'Preencha os dados do aluno e do cliente. Ao escolher o aluno, você pode guardar nome e sala como padrão neste navegador.'
      ],
      ['Defina a entrega', 'Complete as informações de entrega ou retirada e os demais campos solicitados.']
    ],
    tip: 'Se já houver um pedido em andamento, revise o conteúdo antes de alterar o formulário. Trocar de app preserva o trabalho durante a sessão.'
  },
  {
    app: 'writer',
    topic: 'Montagem do pedido',
    title: 'Escolha os itens e confira as quantidades.',
    copy: 'No Writer, avance pelas etapas e use o carrinho para acompanhar o que será pedido.',
    items: [
      ['Selecione os produtos', 'Busque os itens disponíveis no formulário e informe as quantidades.'],
      ['Revise o carrinho', 'Confira produtos, valores e quantidades. A opção Kit fica disponível a partir de duas unidades.'],
      ['Confira tudo', 'Na conferência, revise aluno, cliente, entrega ou retirada e itens. Corrija os avisos antes de baixar.']
    ],
    tip: 'Uma receita pode usar vários ingredientes. Confira quais produtos entraram no pedido e quais ainda precisam ser escolhidos.'
  },
  {
    app: 'writer',
    topic: 'Download e envio',
    title: 'Baixe, envie e registre a venda.',
    copy: 'O pedido só segue para o suporte depois de você enviar o arquivo final.',
    items: [
      ['Baixe o pedido', 'Após a conferência, use o download do formulário preenchido.'],
      ['Envie ao suporte', 'Encaminhe o arquivo pelo canal definido pelo EPAV. Baixar o pedido não faz o envio automaticamente.'],
      [
        'Registre a venda',
        'Depois do download, use a opção de registrar como venda. Confira os dados e salve no Planner, em Resultados → Pedidos.'
      ]
    ],
    tip: 'Também é possível usar Novo → Registrar venda para informar produtos e valores manualmente, sem depender de um Excel.'
  },
  {
    app: 'planner',
    topic: 'Resultados e próximos passos',
    title: 'Aprenda com cada atendimento.',
    copy: 'No Planner, abra Resultados para acompanhar atendimentos e consulte Pedidos para as vendas registradas.',
    items: [
      [
        'Escolha o período',
        'Ajuste as datas para consultar vendas, faturamento, ticket médio (valor médio por venda), IPC (produtos distintos por venda) e positivação (clientes diferentes).'
      ],
      [
        'Corrija os registros',
        'Edite vendas para ajustar os dados. Excluir um registro atualiza seus indicadores, mas não cancela um pedido enviado ao suporte.'
      ],
      ['Continue do seu jeito', 'Personalize o tema e a navegação nas Configurações. Use Rever tutorial sempre que precisar de ajuda.']
    ],
    tip: 'Rotina sugerida: conhecer o cliente → planejar a conversa → consultar ideias → preparar e enviar o pedido → registrar e avaliar.'
  }
];

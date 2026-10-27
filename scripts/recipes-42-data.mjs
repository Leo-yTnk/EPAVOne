// Original editorial recipes. Ingredient amounts are in grams, unless the
// declared pack size uses millilitres or units. Never substitute product photos
// for photos of the finished dish: recipe images intentionally use the fallback.
export const packs = {
  frango: ['Filé de Peito de Frango Swift 1kg', 1000],
  cubosFrango: ['Cubos de Filé de Peito de Frango Swift 1kg', 1000],
  sassami: ['Filezinho Sassami Swift 1kg', 1000],
  sobrecoxa: ['Filé de Coxa e Sobrecoxa sem Pele Swift 1kg', 1000],
  karaague: ['Frango Karaague Empanado Swift 700g', 700],
  desfiado: ['Peito de Frango Temperado Desfiado Swift 400g', 400],
  patinho: ['Carne Moída de Patinho Swift 500g', 500],
  tiras: ['Tiras de Patinho Swift 500g', 500],
  acem: ['Cubos de Acém Swift 500g', 500],
  costela: ['Cubos de Costela Swift 500g', 500],
  mignon: ['Bife de Filé Mignon Swift 1kg', 1000],
  alcatra: ['Bife de Alcatra Swift 1kg', 1000],
  burger: ['Hambúrguer de Costela Swift Legado 1855 180g', 180],
  suino: ['Cubos de Filé Mignon Suíno Swift 500g', 500],
  lombo: ['Bife de Lombo Suíno Linha Mais 1kg', 1000],
  moidaSuina: ['Carne Moída Suína Swift 500g', 500],
  linguica: ['Linguiça de Pernil Swift 700g', 700],
  panceta: ['Espetinho de Panceta Temperada Swift 500g', 500],
  barbecueLombo: ['Lombo Suíno Fatiado com Barbecue Swift 1kg', 1000],
  seca: ['Carne Seca Suína Desfiada Swift 200g', 200],
  salmao: ['Pedaços de Filé de Salmão Swift 500g', 500],
  tilapia: ['Filé de Tilápia Swift 800g', 800],
  abadejo: ['Filé de Abadejo sem Pele Swift 500g', 500],
  isca: ['Isca de Tilápia Temperada Empanada Swift 700g', 700],
  bacalhau: ['Bacalhau Desfiado Dessalgado Swift 500g', 500],
  camarao: ['Camarão Pré-cozido Descascado sem Cabeça 60/80 (71/90) Swift 400g', 400],
  sardinha: ['Sardinha Espalmada Swift 500g', 500],
  kani: ['Kani Kama Swift 250g', 250],
  arroz: ['Arroz Branco Swift 1kg', 1000],
  grao: ['Grão-de-Bico Swift 300g', 300],
  brocolis: ['Brócolis Swift 1,02kg', 1020],
  couveflor: ['Couve-Flor Swift 1,02kg', 1020],
  espinafre: ['Espinafre em Folhas Swift 300g', 300],
  abobora: ['Abóbora em Cubos Swift 300g', 300],
  cenoura: ['Cenoura Baby Swift 300g', 300],
  ervilha: ['Ervilha Swift 300g', 300],
  vagem: ['Vagem Swift 300g', 300],
  legumes: ['Mix Tradicional de Legumes Swift 1,02kg', 1020],
  champignon: ['Champignon Fatiado Swift 300g', 300],
  mandioquinha: ['Mandioquinha em Cubos Swift 300g', 300],
  mandioca: ['Mandioca Tolete Swift 1,02kg', 1020],
  batata: ['Batata Bolinha Swift 1,02kg', 1020],
  polenta: ['Polenta Palito Swift 600g', 600],
  cebola: ['Cebola Picada Swift 300g', 300],
  alho: ['Alho Picado Swift 200g', 200],
  manteiga: ['Manteiga Premium com Sal Swift 200g', 200],
  queijo: ['Queijo Mussarela Fatiado Swift 300g', 300],
  provoleta: ['Provoleta Swift 250g', 250],
  tomate: ['Molho de Tomate Tradicional Salsaretti 300g', 300],
  coco: ['Leite de Coco Da Terrinha 200ml', 200],
  barbecue: ['Molho Barbecue Rústico Swift 340g', 340],
  farofa: ['Farofa Tradicional Swift 400g', 400],
  australiano: ['Pão Australiano Swift 180g', 180],
  pao: ['Pão Francês Swift 480g', 480],
  paoqueijo: ['Pão de Queijo Gourmet Swift 400g', 400],
  croissant: ['Mini Croissant Swift 300g', 300],
  ovos: ['Ovo Branco Jumbo Mantiqueira 10 Und', 10],
  gateau: ['Petit Gateau de Chocolate Swift 240g', 240],
  frutas: ['Mix de Frutas Vermelhas Swift 300g', 300],
  morango: ['Morango Congelado Swift 1,02kg', 1020],
  doce: ['Doce de Leite tipo Argentino Swift 400g', 400],
  banana: ['Banana Empanada Pré-Frita Swift 300g', 300]
};

// [name, category, active + cooking minutes, servings, ingredients, extras,
// preparation steps, specific tip]. Semicolons are reserved for list delimiters.
export const recipes = [
  [
    'Bowl de frango com grão-de-bico e couve-flor dourada',
    'Aves',
    40,
    4,
    { frango: 600, grao: 300, couveflor: 500, alho: 10 },
    ['20 ml de azeite', '1 colher (chá) de cominho', 'Sal e pimenta a gosto'],
    [
      'Descongele o frango na geladeira e corte em tiras de 2 cm. Aqueça o forno a 220 °C',
      'Misture a couve-flor e o grão-de-bico preparado conforme a embalagem com metade do azeite e do cominho. Asse por 25 minutos, virando na metade',
      'Tempere 600 g de frango com o restante do cominho, sal e pimenta. Doure no azeite restante por 10 a 12 minutos, mexendo até cozinhar por dentro',
      'Junte o alho no último minuto. Divida o frango, o grão-de-bico e a couve-flor entre quatro tigelas'
    ],
    'Espalhe os vegetais em uma camada para dourarem sem acumular água.'
  ],
  [
    'Curry suave de frango com abóbora e espinafre',
    'Aves',
    35,
    4,
    { cubosFrango: 600, abobora: 300, espinafre: 150, coco: 200, cebola: 100, alho: 10 },
    ['1 colher (sopa) de óleo', '2 colheres (chá) de curry', 'Sal a gosto'],
    [
      'Refogue a cebola no óleo por 3 minutos. Junte o alho e o curry e mexa por 30 segundos',
      'Adicione o frango descongelado e doure por 5 minutos',
      'Junte a abóbora, o leite de coco e 150 ml de água. Tampe parcialmente e cozinhe por 15 a 20 minutos, até o frango estar cozido e a abóbora macia',
      'Acrescente o espinafre, cozinhe por mais 3 minutos e ajuste o sal'
    ],
    'Amasse alguns cubos de abóbora no molho para engrossar sem creme de leite.'
  ],
  [
    'Frango gratinado com espinafre e mussarela',
    'Aves',
    35,
    4,
    { frango: 600, espinafre: 300, queijo: 120, tomate: 300, alho: 10 },
    ['1 colher (sopa) de azeite', 'Sal e pimenta a gosto', 'Folhas de manjericão a gosto'],
    [
      'Aqueça o forno a 200 °C. Corte os filés descongelados em quatro porções de espessura uniforme e tempere',
      'Sele os dois lados no azeite por 3 minutos cada. Transfira para um refratário',
      'Na mesma frigideira, aqueça o alho e o espinafre até evaporar a água. Espalhe o molho de tomate e o espinafre sobre o frango',
      'Cubra com a mussarela e asse por 15 a 20 minutos, até o frango cozinhar completamente. Finalize com manjericão'
    ],
    'Escorra o espinafre antes de montar para manter o gratinado firme.'
  ],
  [
    'Arroz de uma panela com frango, ervilha e limão',
    'Aves',
    40,
    4,
    { cubosFrango: 500, arroz: 300, ervilha: 150, cebola: 100, alho: 10 },
    ['1 colher (sopa) de óleo', 'Raspas de 1 limão', 'Sal e pimenta a gosto'],
    [
      'Doure os cubos de frango descongelados no óleo por 6 minutos. Junte a cebola e o alho e refogue por 3 minutos',
      'Acrescente o arroz cru e mexa. Adicione 650 ml de água quente e sal',
      'Tampe e cozinhe em fogo baixo por cerca de 18 minutos. Se necessário, adicione água aos poucos até o arroz ficar macio',
      'Junte a ervilha nos últimos 5 minutos. Confirme o cozimento do frango e finalize com raspas de limão'
    ],
    'Deixe descansar tampado por 5 minutos antes de soltar o arroz com garfo.'
  ],
  [
    'Sanduíche australiano de frango barbecue e cebola',
    'Lanches',
    30,
    2,
    { frango: 300, australiano: 180, barbecue: 50, cebola: 100, queijo: 60 },
    ['1 colher (sopa) de óleo', 'Sal e pimenta a gosto'],
    [
      'Asse o pão conforme a embalagem e abra em duas porções de sanduíche',
      'Corte o frango descongelado em tiras finas e tempere. Doure no óleo por 8 a 10 minutos, até cozinhar por dentro',
      'Junte a cebola e refogue por mais 4 minutos. Adicione o barbecue e 30 ml de água, mexendo por 2 minutos',
      'Recheie o pão, cubra com a mussarela e leve ao forno a 200 °C por 3 minutos para derreter'
    ],
    'Use o molho apenas no final para evitar que o açúcar queime.'
  ],
  [
    'Sassami ao coco com vagem e amendoim',
    'Aves',
    30,
    4,
    { sassami: 600, vagem: 300, coco: 200, alho: 10 },
    ['30 g de amendoim torrado sem casca', '1 colher (sopa) de óleo', '1 colher (chá) de curry', 'Sal a gosto'],
    [
      'Corte os sassamis descongelados ao meio e tempere com sal e curry',
      'Doure no óleo por 6 minutos, virando para selar os dois lados. Junte o alho e mexa por 30 segundos',
      'Acrescente a vagem, o leite de coco e 100 ml de água. Cozinhe parcialmente tampado por 10 a 12 minutos, até o frango estar cozido',
      'Divida em quatro pratos e finalize com o amendoim picado'
    ],
    'Adicione o amendoim ao servir para conservar a crocância.'
  ],
  [
    'Sobrecoxa com cenoura baby e glacê de mel',
    'Aves',
    50,
    4,
    { sobrecoxa: 700, cenoura: 300, cebola: 100, alho: 10 },
    ['1 colher (sopa) de mel', '1 colher (sopa) de mostarda', '1 colher (sopa) de azeite', 'Sal e pimenta a gosto'],
    [
      'Aqueça o forno a 210 °C. Seque os filés de sobrecoxa descongelados e tempere com sal, pimenta e alho',
      'Disponha o frango, a cenoura e a cebola na assadeira e regue com azeite. Asse por 30 minutos',
      'Misture o mel com a mostarda e pincele sobre o frango',
      'Asse por mais 10 a 15 minutos, até o centro do frango estar completamente cozido e a cenoura macia'
    ],
    'Pincele o mel somente na etapa final para dourar sem carbonizar.'
  ],
  [
    'Bowl crocante de karaague com arroz e vagem',
    'Aves',
    35,
    4,
    { karaague: 700, arroz: 250, vagem: 300, alho: 10 },
    ['1 colher (sopa) de óleo', '2 colheres (sopa) de shoyu', '1 colher (chá) de gergelim'],
    [
      'Cozinhe o arroz com 550 ml de água e uma pitada de sal, ajustando a água até os grãos ficarem macios',
      'Prepare o karaague no forno ou na air fryer conforme tempo, temperatura e condição de congelamento da embalagem',
      'Salteie a vagem no óleo por 5 a 7 minutos. Junte o alho e depois o shoyu, mexendo por mais 1 minuto',
      'Distribua arroz, vagem e karaague em tigelas e salpique gergelim'
    ],
    'Mantenha o frango separado do molho para preservar a casquinha.'
  ],
  [
    'Costela desfiada com mandioquinha rústica',
    'Bovinos',
    90,
    4,
    { costela: 1000, mandioquinha: 600, cebola: 150, alho: 15, manteiga: 30 },
    ['1 colher (sopa) de óleo', 'Sal e pimenta a gosto'],
    [
      'Doure os cubos de costela descongelados no óleo em duas levas. Refogue a cebola e o alho na mesma panela',
      'Volte a carne e cubra com água quente. Na panela de pressão, respeite o limite de enchimento e cozinhe por 40 minutos após pegar pressão',
      'Desligue, espere a pressão sair completamente antes de abrir e verifique a maciez. Retire ossos e cartilagens, desfie e reduza o caldo sem tampa',
      'Cozinhe a mandioquinha em água por 15 minutos ou até amaciar. Escorra, amasse com manteiga e sal e sirva com a carne'
    ],
    'Se a carne ainda estiver firme, complete o líquido e cozinhe por mais 10 minutos sob pressão.'
  ],
  [
    'Mignon com champignon e creme de couve-flor',
    'Bovinos',
    40,
    4,
    { mignon: 600, champignon: 300, couveflor: 600, manteiga: 40, alho: 10 },
    ['Sal e pimenta a gosto'],
    [
      'Cozinhe a couve-flor em água por 12 a 15 minutos, até ficar bem macia. Escorra e bata com 20 g de manteiga e 80 ml da água do cozimento',
      'Tempere os bifes descongelados e seque a superfície. Grelhe em frigideira quente com 10 g de manteiga por cerca de 3 a 5 minutos de cada lado, conforme a espessura',
      'Retire os bifes e deixe descansar. Salteie o champignon na frigideira até secar a água, junte o alho e os 10 g restantes de manteiga',
      'Solte o fundo com 60 ml de água quente e sirva o molho sobre o mignon e o creme de couve-flor'
    ],
    'Para cortes bovinos inteiros, confira 63 °C no centro e deixe descansar por 3 minutos.'
  ],
  [
    'Almôndegas assadas com espinafre e arroz dourado',
    'Bovinos',
    45,
    4,
    { patinho: 500, espinafre: 150, arroz: 250, cebola: 100, alho: 10, ovos: 1 },
    ['2 colheres (sopa) de farinha de rosca', '1 colher (sopa) de óleo', 'Sal e pimenta a gosto'],
    [
      'Aqueça o forno a 210 °C. Prepare o espinafre conforme a embalagem, esprema bem e pique',
      'Misture a carne descongelada, o espinafre, metade da cebola, o ovo, a farinha e sal. Modele 16 almôndegas',
      'Disponha em assadeira untada e asse por 20 a 25 minutos, virando na metade, até atingir 71 °C no centro',
      'Refogue a cebola restante e o alho no óleo, junte o arroz e 550 ml de água. Cozinhe até ficar macio e sirva com as almôndegas'
    ],
    'Aperte o espinafre em peneira para a mistura não ficar úmida demais.'
  ],
  [
    'Tiras de patinho com brócolis e cenoura ao shoyu',
    'Bovinos',
    30,
    4,
    { tiras: 500, brocolis: 300, cenoura: 300, alho: 10 },
    ['2 colheres (sopa) de shoyu', '1 colher (chá) de gengibre ralado', '1 colher (sopa) de óleo'],
    [
      'Cozinhe o brócolis e a cenoura em água fervente por 3 minutos e escorra muito bem',
      'Seque a carne descongelada e doure em frigideira muito quente com óleo, em duas levas',
      'Volte toda a carne à panela, adicione alho e gengibre e mexa por 30 segundos',
      'Junte os vegetais, o shoyu e 50 ml de água. Salteie por 3 a 5 minutos, até a carne estar cozida e os vegetais macios'
    ],
    'As duas levas evitam que a carne solte água e cozinhe sem dourar.'
  ],
  [
    'Ragu de acém com polenta crocante',
    'Bovinos',
    80,
    4,
    { acem: 700, polenta: 600, tomate: 300, cebola: 150, alho: 15 },
    ['1 colher (sopa) de óleo', 'Sal e pimenta a gosto', '1 folha de louro'],
    [
      'Doure o acém descongelado no óleo em duas levas. Refogue a cebola e o alho',
      'Junte carne, molho de tomate, louro e 400 ml de água na panela de pressão, respeitando o limite de enchimento. Cozinhe por 35 minutos após pegar pressão',
      'Espere a pressão sair completamente antes de abrir. Desfie a carne e reduza o molho sem tampa por 10 minutos, ajustando sal e pimenta',
      'Asse a polenta palito conforme a embalagem e sirva o ragu ao lado, preservando parte da crocância'
    ],
    'Se o acém não desfiar facilmente, cozinhe mais 10 minutos sob pressão com líquido suficiente.'
  ],
  [
    'Hambúrguer aberto com provoleta e cebola tostada',
    'Lanches',
    30,
    2,
    { burger: 360, provoleta: 125, pao: 160, cebola: 100, manteiga: 15 },
    ['Pimenta-do-reino a gosto'],
    [
      'Asse o pão conforme a embalagem, corte ao meio e toste a parte interna com a manteiga',
      'Grelhe os hambúrgueres conforme a embalagem até atingir 71 °C no centro. Retire e mantenha aquecidos',
      'Doure a cebola na mesma frigideira por 5 minutos. Grelhe a provoleta em frigideira antiaderente quente até amolecer e formar crosta',
      'Monte duas bases abertas de pão com hambúrguer, cebola e provoleta. Finalize com pimenta'
    ],
    'Sirva em prato com talheres, pois o queijo fica macio e escorre.'
  ],
  [
    'Alcatra com crosta de farofa e legumes de forno',
    'Bovinos',
    40,
    4,
    { alcatra: 600, farofa: 60, legumes: 600, manteiga: 25 },
    ['1 colher (sopa) de mostarda', '1 colher (sopa) de azeite', 'Sal e pimenta a gosto'],
    [
      'Aqueça o forno a 210 °C. Distribua os legumes na assadeira com azeite e sal e asse por 25 minutos',
      'Tempere e sele os bifes descongelados em frigideira quente por 2 minutos de cada lado',
      'Misture a farofa com a manteiga amolecida. Pincele a mostarda sobre os bifes e pressione a farofa por cima',
      'Coloque os bifes sobre os legumes e asse por 5 a 10 minutos, até alcançar 63 °C no centro. Deixe a carne descansar por 3 minutos antes de servir'
    ],
    'Mantenha a crosta na face superior e evite virar os bifes depois de cobrir.'
  ],
  [
    'Mignon suíno cítrico com arroz de ervilha',
    'Suínos',
    40,
    4,
    { suino: 500, arroz: 250, ervilha: 150, cebola: 100, alho: 10 },
    ['Suco de 2 laranjas (150 ml)', '1 colher (sopa) de óleo', 'Sal e pimenta a gosto'],
    [
      'Refogue metade da cebola e do alho, junte o arroz e 550 ml de água e cozinhe até ficar macio. Adicione a ervilha nos últimos 5 minutos',
      'Tempere os cubos suínos descongelados. Doure no óleo por 6 a 8 minutos',
      'Junte a cebola e o alho restantes, refogue por 2 minutos e acrescente o suco de laranja',
      'Cozinhe por mais 8 a 10 minutos, até reduzir o molho e a carne atingir 63 °C. Descanse por 3 minutos e sirva com o arroz'
    ],
    'Se o molho reduzir antes de a carne cozinhar, acrescente água em pequenas quantidades.'
  ],
  [
    'Assadeira de linguiça com abóbora e cebola',
    'Suínos',
    45,
    4,
    { linguica: 700, abobora: 600, cebola: 150, alho: 10 },
    ['1 colher (sopa) de azeite', '1 colher (chá) de páprica', 'Sal a gosto'],
    [
      'Aqueça o forno a 210 °C e descongele a linguiça conforme a embalagem',
      'Misture a abóbora com a cebola, alho, azeite, páprica e uma pitada de sal',
      'Distribua os vegetais e a linguiça inteira em uma assadeira sem sobrepor',
      'Asse por 35 a 40 minutos, virando na metade, até a abóbora ficar macia e a linguiça atingir 71 °C no centro'
    ],
    'Não fure a linguiça durante o preparo para conservar seus sucos.'
  ],
  [
    'Lombo dourado com couve-flor ao lemon pepper',
    'Suínos',
    30,
    4,
    { lombo: 600, couveflor: 600, manteiga: 25, alho: 10 },
    ['1 colher (chá) de lemon pepper', 'Sal a gosto'],
    [
      'Tempere os bifes descongelados com metade do lemon pepper e sal, considerando se o tempero já contém sal',
      'Cozinhe a couve-flor em água por 5 minutos e escorra. Doure com metade da manteiga e o alho por mais 5 minutos',
      'Em outra frigideira, doure o lombo na manteiga restante por cerca de 4 a 6 minutos de cada lado, conforme a espessura',
      'Confirme 63 °C no centro do lombo, deixe descansar por 3 minutos e sirva com a couve-flor e o restante do lemon pepper'
    ],
    'Retire a carne da frigideira durante o descanso para não ressecar no calor residual.'
  ],
  [
    'Panceta no espeto com mandioca amassada ao alho',
    'Suínos',
    55,
    4,
    { panceta: 500, mandioca: 600, manteiga: 30, alho: 15 },
    ['Sal a gosto', 'Salsinha picada a gosto'],
    [
      'Cozinhe a mandioca em água conforme a embalagem até ficar bem macia, cerca de 25 a 35 minutos. Retire o fio central e escorra',
      'Amasse grosseiramente com a manteiga, o alho previamente dourado e sal',
      'Prepare os espetinhos de panceta no forno ou churrasqueira conforme a embalagem, virando para dourar todos os lados e cozinhar o centro',
      'Divida a mandioca em quatro pratos, acrescente a panceta e finalize com salsinha'
    ],
    'Se a mandioca ficar seca, incorpore algumas colheres de água quente.'
  ],
  [
    'Bolinhos suínos de forno com espinafre e queijo',
    'Suínos',
    40,
    4,
    { moidaSuina: 500, espinafre: 150, queijo: 100, ovos: 1, cebola: 80 },
    ['3 colheres (sopa) de farinha de rosca', '1 colher (chá) de páprica', 'Sal a gosto'],
    [
      'Aqueça o forno a 210 °C. Prepare o espinafre conforme a embalagem, esprema e pique',
      'Misture a carne descongelada com espinafre, cebola, ovo, farinha, páprica e sal',
      'Divida em 12 partes. Recheie cada uma com um pedaço de mussarela e feche bem',
      'Asse em forma antiaderente por 25 a 30 minutos, até os bolinhos atingirem 71 °C no centro'
    ],
    'Deixe o queijo totalmente envolvido pela carne para reduzir vazamentos.'
  ],
  [
    'Mini croissants salgados de lombo barbecue',
    'Lanches',
    35,
    4,
    { croissant: 300, barbecueLombo: 400, queijo: 100, cebola: 80 },
    ['1 colher (chá) de óleo'],
    [
      'Asse os mini croissants conforme as instruções da embalagem',
      'Prepare o lombo barbecue conforme a embalagem, garantindo o cozimento completo. Corte as fatias em tiras pequenas',
      'Refogue a cebola no óleo por 4 minutos e misture ao lombo com 30 ml de água',
      'Abra os croissants, recheie com lombo e mussarela e aqueça a 180 °C por 3 a 5 minutos'
    ],
    'Monte pouco antes de servir para a massa não absorver o molho.'
  ],
  [
    'Salmão com glacê de mostarda e brócolis tostado',
    'Pescados',
    35,
    4,
    { salmao: 500, brocolis: 600, alho: 10 },
    ['1 colher (sopa) de mostarda', '1 colher (sopa) de mel', '1 colher (sopa) de azeite', 'Sal e pimenta a gosto'],
    [
      'Aqueça o forno a 210 °C. Misture o brócolis com azeite, alho e sal e asse por 15 minutos',
      'Seque o salmão descongelado e tempere. Misture mel e mostarda e pincele nos pedaços',
      'Abra espaço na assadeira, coloque o salmão e asse por mais 12 a 18 minutos, conforme a espessura',
      'Retire quando o peixe atingir 63 °C no centro e se separar em lascas. Sirva com o brócolis'
    ],
    'Use uma assadeira ampla para os vegetais tostarem sem cobrir o peixe.'
  ],
  [
    'Papillote de tilápia com vagem e cenoura baby',
    'Pescados',
    35,
    4,
    { tilapia: 600, vagem: 300, cenoura: 300, manteiga: 25 },
    ['Suco de 1 limão', 'Sal e pimenta a gosto'],
    [
      'Aqueça o forno a 200 °C. Cozinhe vagem e cenoura em água por 3 minutos e escorra',
      'Corte quatro folhas grandes de papel-manteiga próprio para forno. Distribua os vegetais e os filés descongelados',
      'Tempere com limão, sal e pimenta e divida a manteiga. Feche os pacotes dobrando bem as bordas',
      'Asse por 20 a 25 minutos, até o peixe atingir 63 °C no centro. Abra com cuidado por causa do vapor'
    ],
    'Coloque os pacotes sobre assadeira e respeite a temperatura máxima do papel.'
  ],
  [
    'Caldo de abadejo com mandioca e leite de coco',
    'Pescados',
    50,
    4,
    { abadejo: 500, mandioca: 500, coco: 200, cebola: 100, alho: 10, tomate: 150 },
    ['1 colher (sopa) de óleo', 'Sal e coentro a gosto'],
    [
      'Cozinhe a mandioca em água até amaciar, retire o fio central e bata com 400 ml da água de cozimento',
      'Refogue cebola e alho no óleo. Junte o molho de tomate e cozinhe por 3 minutos',
      'Acrescente o creme de mandioca e o leite de coco e deixe ferver suavemente',
      'Adicione o abadejo descongelado em cubos e cozinhe por 8 a 12 minutos, até atingir 63 °C. Ajuste o sal e finalize com coentro'
    ],
    'Mexa delicadamente depois de adicionar o peixe para manter alguns pedaços inteiros.'
  ],
  [
    'Pão crocante de tilápia com ervilha amassada',
    'Lanches',
    30,
    4,
    { isca: 700, pao: 320, ervilha: 300, manteiga: 20 },
    ['Suco de meio limão', 'Sal e pimenta a gosto'],
    [
      'Prepare as iscas na air fryer ou forno conforme a embalagem, garantindo o cozimento completo do peixe',
      'Cozinhe a ervilha em água por 4 a 5 minutos, escorra e amasse com manteiga, limão, sal e pimenta',
      'Asse o pão conforme a embalagem e abra quatro porções',
      'Espalhe a ervilha amassada e distribua as iscas crocantes. Sirva imediatamente'
    ],
    'Deixe as iscas descansarem em grade por 1 minuto antes de montar.'
  ],
  [
    'Frigideira de bacalhau com grão-de-bico e espinafre',
    'Pescados',
    30,
    4,
    { bacalhau: 500, grao: 300, espinafre: 300, cebola: 150, alho: 15 },
    ['2 colheres (sopa) de azeite', 'Pimenta e sal a gosto'],
    [
      'Prepare o grão-de-bico conforme a embalagem. Descongele e escorra o bacalhau dessalgado',
      'Refogue cebola e alho no azeite por 4 minutos. Acrescente o bacalhau e cozinhe por 5 minutos',
      'Junte o grão-de-bico, o espinafre e 80 ml de água. Tampe e cozinhe por 6 a 8 minutos, até o bacalhau atingir 63 °C',
      'Retire a tampa, deixe evaporar o excesso de líquido e ajuste sal e pimenta depois de provar'
    ],
    'O bacalhau já é dessalgado, portanto ajuste o sal somente no final.'
  ],
  [
    'Arroz cremoso de camarão com abóbora',
    'Pescados',
    40,
    4,
    { camarao: 400, abobora: 300, arroz: 250, cebola: 100, alho: 10, manteiga: 25 },
    ['Sal e pimenta a gosto', 'Salsinha picada a gosto'],
    [
      'Cozinhe a abóbora com 500 ml de água até ficar macia e amasse no próprio caldo',
      'Refogue cebola e alho em metade da manteiga. Junte o arroz e o caldo com a abóbora',
      'Cozinhe em fogo baixo, adicionando água quente aos poucos até o arroz ficar macio e úmido, cerca de 20 minutos',
      'Acrescente o camarão descongelado e escorrido e cozinhe pelo tempo indicado na embalagem. Finalize com o restante da manteiga e salsinha'
    ],
    'O camarão é pré-cozido e entra no final para não ficar borrachudo.'
  ],
  [
    'Wok de camarão com champignon e vagem',
    'Pescados',
    25,
    4,
    { camarao: 400, champignon: 300, vagem: 300, alho: 10 },
    ['1 colher (sopa) de óleo', '2 colheres (sopa) de shoyu', '1 colher (chá) de gengibre ralado'],
    [
      'Cozinhe a vagem em água por 3 minutos e escorra. Descongele e seque o camarão',
      'Salteie o champignon em frigideira ampla com óleo até a água evaporar',
      'Junte vagem, alho e gengibre e mexa por 2 minutos',
      'Acrescente o camarão e o shoyu. Salteie pelo tempo indicado na embalagem do camarão e sirva assim que estiver bem aquecido'
    ],
    'Não cozinhe o camarão junto com os cogumelos desde o início.'
  ],
  [
    'Sardinha de forno com batata e tomate',
    'Pescados',
    45,
    4,
    { sardinha: 500, batata: 500, tomate: 300, cebola: 150, alho: 10 },
    ['1 colher (sopa) de azeite', 'Sal e orégano a gosto'],
    [
      'Aqueça o forno a 210 °C. Cozinhe as batatas em água por 10 minutos e corte ao meio',
      'Espalhe molho de tomate, cebola e alho no refratário. Coloque as batatas e regue com metade do azeite',
      'Asse por 15 minutos. Acrescente as sardinhas descongeladas e limpas, tempere e regue com o azeite restante',
      'Asse por mais 15 a 20 minutos, até o peixe atingir 63 °C e as batatas ficarem macias'
    ],
    'Confira a presença de espinhas antes de servir, especialmente para crianças.'
  ],
  [
    'Arroz de camarão e kani com ervilha',
    'Pescados',
    35,
    4,
    { camarao: 400, kani: 250, arroz: 250, ervilha: 150, cebola: 100, alho: 10 },
    ['1 colher (sopa) de óleo', 'Sal e cebolinha a gosto'],
    [
      'Refogue cebola e alho no óleo. Acrescente o arroz e 550 ml de água quente',
      'Cozinhe em fogo baixo por cerca de 18 minutos, ajustando a água se necessário. Adicione a ervilha nos últimos 5 minutos',
      'Prepare o camarão descongelado conforme a embalagem e desfie o kani descongelado conforme as orientações do fabricante',
      'Misture camarão e kani ao arroz já cozido e aqueça por 2 minutos. Ajuste sal e finalize com cebolinha'
    ],
    'O kani já tem sal e sabor marcantes, então prove antes de corrigir o tempero.'
  ],
  [
    'Gratinado de couve-flor, espinafre e grão-de-bico',
    'Vegetarianas',
    40,
    4,
    { couveflor: 600, espinafre: 300, grao: 300, queijo: 150, manteiga: 20 },
    ['Sal, pimenta e noz-moscada a gosto'],
    [
      'Aqueça o forno a 210 °C. Cozinhe a couve-flor em água por 8 minutos e escorra',
      'Prepare o espinafre e o grão-de-bico conforme as embalagens e escorra bem',
      'Amasse metade da couve-flor com manteiga e 80 ml de água quente. Tempere com sal, pimenta e noz-moscada',
      'Misture o creme, os vegetais e o grão-de-bico em refratário. Cubra com mussarela e asse por 15 a 20 minutos'
    ],
    'O creme de couve-flor substitui um molho branco e dispensa farinha ou creme de leite.'
  ],
  [
    'Creme de abóbora com grão-de-bico crocante',
    'Vegetarianas',
    40,
    4,
    { abobora: 600, grao: 300, cebola: 100, alho: 10, coco: 200 },
    ['1 colher (sopa) de azeite', '1 colher (chá) de gengibre ralado', 'Sal e páprica a gosto'],
    [
      'Aqueça o forno a 210 °C. Prepare o grão-de-bico conforme a embalagem, seque e misture com metade do azeite, páprica e sal',
      'Asse o grão-de-bico por 25 a 30 minutos, mexendo na metade',
      'Refogue cebola, alho e gengibre no azeite restante. Junte abóbora e 500 ml de água e cozinhe por 15 minutos ou até amaciar',
      'Bata a sopa, acrescente leite de coco e aqueça por 3 minutos. Sirva com o grão-de-bico por cima'
    ],
    'Seque muito bem os grãos para deixá-los crocantes.'
  ],
  [
    'Frigideira de grão-de-bico com champignon e espinafre',
    'Vegetarianas',
    25,
    4,
    { grao: 600, champignon: 300, espinafre: 300, cebola: 100, alho: 10 },
    ['1 colher (sopa) de azeite', 'Suco de meio limão', 'Sal e pimenta a gosto'],
    [
      'Prepare o grão-de-bico conforme a embalagem e escorra',
      'Doure o champignon no azeite em frigideira ampla, deixando a água evaporar',
      'Junte cebola e alho e refogue por 3 minutos. Acrescente grão-de-bico e espinafre',
      'Cozinhe por 5 a 7 minutos, até aquecer e secar o excesso de líquido. Tempere com limão, sal e pimenta'
    ],
    'Para uma versão sem ingredientes animais, confirme os rótulos e use azeite no preparo.'
  ],
  [
    'Arroz de forno verde com brócolis e ervilha',
    'Vegetarianas',
    45,
    4,
    { arroz: 300, brocolis: 400, ervilha: 150, queijo: 150, cebola: 100, manteiga: 20 },
    ['Sal e pimenta a gosto'],
    [
      'Refogue cebola na manteiga. Junte arroz e 650 ml de água e cozinhe até os grãos ficarem macios',
      'Cozinhe o brócolis em água por 3 minutos e pique. Prepare a ervilha conforme a embalagem',
      'Misture arroz, brócolis, ervilha e metade da mussarela em refratário. Acrescente 80 ml de água para manter úmido',
      'Cubra com a mussarela restante e asse a 210 °C por 15 minutos, até derreter e dourar levemente'
    ],
    'Pique parte do brócolis bem miúdo para espalhar a cor por todo o arroz.'
  ],
  [
    'Bolinhos de mandioca com coração de mussarela',
    'Vegetarianas',
    60,
    4,
    { mandioca: 600, queijo: 150, manteiga: 20 },
    ['2 colheres (sopa) de amido de milho', '1 colher (sopa) de azeite', 'Sal a gosto'],
    [
      'Cozinhe a mandioca em água até ficar macia, cerca de 25 a 35 minutos. Escorra bem, retire o fio central e amasse ainda quente',
      'Misture manteiga, sal e amido. Deixe amornar e divida em 12 porções',
      'Recheie cada porção com mussarela e feche bem. Pincele com azeite',
      'Asse na air fryer preaquecida a 200 °C por 15 a 20 minutos, virando com cuidado na metade, até dourar'
    ],
    'Se a massa estiver muito úmida, seque-a em panela baixa antes de modelar.'
  ],
  [
    'Ovos no molho de tomate com espinafre',
    'Vegetarianas',
    25,
    4,
    { ovos: 4, tomate: 600, espinafre: 300, cebola: 100, alho: 10, pao: 160 },
    ['1 colher (sopa) de azeite', '1 colher (chá) de páprica', 'Sal a gosto'],
    [
      'Asse o pão conforme a embalagem. Refogue cebola e alho no azeite em frigideira com tampa',
      'Junte páprica, molho de tomate e espinafre e cozinhe por 5 a 7 minutos',
      'Abra quatro cavidades, quebre um ovo em cada uma e tampe',
      'Cozinhe em fogo baixo por 8 a 12 minutos, até claras e gemas estarem firmes. Sirva com o pão'
    ],
    'Abra cada ovo primeiro em um recipiente separado antes de transferir para o molho.'
  ],
  [
    'Bruschettas de provoleta com brócolis e alho',
    'Lanches',
    25,
    4,
    { pao: 320, provoleta: 250, brocolis: 300, alho: 10, tomate: 100 },
    ['1 colher (sopa) de azeite', 'Pimenta a gosto'],
    [
      'Asse o pão conforme a embalagem e corte em oito fatias grossas',
      'Cozinhe o brócolis em água por 3 minutos, escorra e pique. Salteie com azeite e alho por 2 minutos',
      'Espalhe um pouco de molho em cada fatia e cubra com o brócolis e a provoleta em pedaços',
      'Leve ao forno a 210 °C por 8 a 10 minutos, até o queijo derreter. Finalize com pimenta'
    ],
    'Toste o pão antes de cobrir se preferir uma base mais firme.'
  ],
  [
    'Pão de queijo recheado com carne seca suína',
    'Lanches',
    35,
    4,
    { paoqueijo: 400, seca: 200, queijo: 80, cebola: 80 },
    ['1 colher (chá) de óleo', 'Cebolinha picada a gosto'],
    [
      'Asse o pão de queijo conforme tempo e temperatura da embalagem',
      'Refogue a cebola no óleo. Junte a carne seca suína e prepare pelo tempo indicado na embalagem, acrescentando 40 ml de água se necessário',
      'Finalize o recheio com cebolinha. Abra os pães de queijo ainda mornos sem separar totalmente as metades',
      'Distribua o recheio e a mussarela e aqueça no forno a 180 °C por 3 minutos'
    ],
    'Prove a carne seca antes de acrescentar sal, pois ela já é temperada.'
  ],
  [
    'Petit gateau com calda quente de frutas vermelhas',
    'Sobremesas',
    20,
    2,
    { gateau: 240, frutas: 150 },
    ['1 colher (sopa) de açúcar (opcional)'],
    [
      'Leve as frutas congeladas com 30 ml de água a uma panela pequena',
      'Cozinhe por 6 a 8 minutos, até levantar fervura e formar calda. Amasse apenas parte das frutas e adoce se desejar',
      'Prepare os petit gateaux conforme a embalagem, respeitando o equipamento e a potência indicados',
      'Desenforme quando orientado e sirva imediatamente com a calda ao redor'
    ],
    'A calda pode ficar pronta antes, deixando o bolinho para o momento de servir.'
  ],
  [
    'Mini croissants com doce de leite e morango quente',
    'Sobremesas',
    30,
    4,
    { croissant: 300, doce: 120, morango: 250 },
    ['1 colher (chá) de suco de limão'],
    [
      'Asse os mini croissants conforme a embalagem e deixe amornar',
      'Cozinhe os morangos congelados com 30 ml de água por 8 a 10 minutos, até ferver e reduzir. Acrescente o limão',
      'Abra os croissants e espalhe o doce de leite',
      'Distribua os morangos ainda mornos e sirva logo, mantendo parte da calda à parte'
    ],
    'Reduza bem a calda para que o recheio não encharque a massa.'
  ],
  [
    'Banana crocante com doce de leite e frutas vermelhas',
    'Sobremesas',
    25,
    4,
    { banana: 300, doce: 100, frutas: 150 },
    ['Canela em pó a gosto'],
    [
      'Prepare a banana empanada no forno ou na air fryer conforme a embalagem',
      'Cozinhe as frutas congeladas com 30 ml de água por 6 a 8 minutos, até ferver e formar uma calda rústica',
      'Misture o doce de leite com 15 a 30 ml de água quente para ficar mais fluido',
      'Distribua a banana em quatro pratos, regue com o doce de leite e sirva a calda de frutas ao lado. Finalize com canela'
    ],
    'Adicione as caldas apenas ao servir para preservar a cobertura crocante.'
  ],
  [
    'Taças de morango com farofa doce de pão',
    'Sobremesas',
    30,
    4,
    { morango: 400, pao: 120, manteiga: 25, doce: 120 },
    ['1 colher (sopa) de açúcar', 'Canela em pó a gosto'],
    [
      'Asse o pão conforme a embalagem e deixe esfriar. Triture grosseiramente para formar migalhas',
      'Doure as migalhas na manteiga em fogo médio por 5 a 7 minutos. Junte açúcar e canela e deixe esfriar espalhado em um prato',
      'Cozinhe os morangos congelados com 40 ml de água por 8 a 10 minutos, até ferver. Deixe amornar',
      'Divida o doce de leite em quatro taças, acrescente o morango e finalize com a farofa somente ao servir'
    ],
    'Mantenha a farofa em recipiente seco e separado até a montagem.'
  ]
];

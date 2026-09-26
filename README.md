# EPAVOne

Portal inicial para EPAVInsights, EPAVPlanner e EPAVWriter.

## Executar

Abra `index.html` em um navegador ou sirva a pasta com um servidor estático.
As rotas são links por fragmento (`#/insights`, `#/planner`, `#/writer`), portanto funcionam também em hospedagem estática sem configuração de reescrita.

## Design system

`ds-enforce.css` é uma cópia do arquivo de mesmo nome em
[Yourcipe-EPAV](https://github.com/Leo-yTnk/Yourcipe-EPAV/blob/main/ds-enforce.css).
`styles.css` contém apenas a composição da home e das páginas de entrada,
usando as cores semânticas, tipografia, espaçamentos, raios, sombras, movimento
e classes de componentes já definidos no design system. Quando o original
mudar, atualize a cópia e confira as páginas nos modos claro e escuro.

As páginas das três ferramentas descrevem o papel de cada uma e indicam
honestamente que suas funcionalidades ainda estão em desenvolvimento.

### O Poder das Animações

Evite mudanças bruscas na interface. Combine movimento, fade-in, fade-out e
blur para criar transições fluidas e naturais, sempre com moderação. As
animações devem orientar a atenção e dar continuidade à experiência sem
exageros ou impacto significativo no desempenho. Respeite também a preferência
do usuário por movimento reduzido (`prefers-reduced-motion`).

import './home.css';
import { Badge, Button, Card, Heading, PageHeader, Text } from '../../design-system/components/index.js';

const products=[
  {href:'#/insights',number:'01',glyph:'↗',name:'EPAVInsights',summary:'Entenda resultados e encontre oportunidades para as próximas vendas.'},
  {href:'#/planner',number:'02',glyph:'▦',name:'EPAVPlanner',summary:'Organize a semana, priorize clientes e planeje sua abordagem.'},
  {href:'#/writer',number:'03',glyph:'✎',name:'EPAVWriter',summary:'Prepare pedidos e confira informações antes do envio.'}
];

export function HomePage() {
  return <>
    <section className="hero">
      <div className="hero-copy">
        <span className="ds-overline eyebrow">Seu espaço de trabalho no EPAV</span>
        <Heading as="h1" display="medium">Tudo se conecta. <em>Sua próxima venda também.</em></Heading>
        <Text size="lg">Planeje a semana, entenda seus resultados e prepare os pedidos em um só lugar.</Text>
        <div className="hero-actions"><Button as="a" href="#ferramentas">Explorar ferramentas</Button><Button as="a" variant="secondary" href="#/dev/components">Ver Component Lab</Button></div>
      </div>
      <Card as="aside" className="hero-panel" aria-label="Etapas de trabalho"><Badge>Um fluxo mais simples</Badge><Heading as="h2" level={4}>Da ideia ao pedido, passo a passo.</Heading><div className="mini-flow"><span><b>1</b> Planeje com o Planner</span><span><b>2</b> Entenda com o Insights</span><span><b>3</b> Prepare com o Writer</span></div></Card>
    </section>
    <section id="ferramentas" className="home-tools">
      <PageHeader eyebrow="Ferramentas" title="Escolha por onde começar" description="Cada produto tem uma responsabilidade clara e compartilha a mesma fundação de interface."/>
      <div className="product-grid">{products.map(product=><Card key={product.href} as="a" href={product.href} className="product-card"><div className="product-card-top"><span className="product-glyph">{product.glyph}</span><span className="ds-overline">{product.number}</span></div><Heading as="h3" level={4}>{product.name}</Heading><Text size="sm">{product.summary}</Text><strong>Conhecer ferramenta →</strong></Card>)}</div>
    </section>
  </>;
}

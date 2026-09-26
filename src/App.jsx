import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Badge, Button, Card, Icon, Progress, Select, Slider } from './components/ui';
import { products } from './data/products';

function ProductCard({ product }) {
  return <Card interactive className="product-card">
    <div className="product-head"><span className="product-icon"><Icon name={product.icon} size={24} /></span><span className="product-index">{product.index}</span></div>
    <div><span className="eyebrow">{product.kicker}</span><h3>{product.name}</h3><p>{product.description}</p></div>
    <div className="product-foot"><span>{product.meta}</span><button aria-label={`Abrir ${product.name}`}><Icon name="arrow" /></button></div>
  </Card>;
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('epav-theme') === 'dark');
  const [focus, setFocus] = useState(68);
  const [notice, setNotice] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('epav-theme', dark ? 'dark' : 'light'); }, [dark]);
  const confirm = () => { setNotice(true); window.setTimeout(() => setNotice(false), 3200); };

  return <><a className="skip-link" href="#main">Ir para o conteúdo</a><div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <div className="app-shell" id="top"><Header dark={dark} onTheme={() => setDark(value => !value)} />
      <main id="main">
        <section className="hero">
          <div className="hero-copy"><Badge>Ecossistema EPAV</Badge><h1>Seu trabalho.<br/><em>Em um só lugar.</em></h1><p>Planeje com intenção, entenda os resultados e prepare cada pedido com clareza. Um espaço conectado para você avançar.</p><div className="actions"><Button icon="arrow" onClick={() => document.querySelector('#ferramentas').scrollIntoView()}>Explorar ferramentas</Button><Button variant="ghost" onClick={() => document.querySelector('#fluxo').scrollIntoView()}>Ver como funciona</Button></div><div className="trust"><span className="avatars"><i>EP</i><i>+3</i></span><span><b>Três ferramentas.</b><br/>Uma experiência contínua.</span></div></div>
          <Card className="dashboard glass-strong"><div className="dashboard-top"><span><small>VISÃO DA SEMANA</small><strong>Olá, vamos avançar?</strong></span><Badge tone="success">Tudo certo</Badge></div><div className="metric"><span>Progresso geral</span><strong>68<small>%</small></strong><Progress label="Jornada concluída" value={focus}/></div><div className="dashboard-grid"><div><span className="mini-icon"><Icon name="calendar"/></span><small>PRÓXIMA ETAPA</small><b>Planejar semana</b><span>Hoje · 10 min</span></div><div><span className="mini-icon pale"><Icon name="chart"/></span><small>ÚLTIMO RESULTADO</small><b>+12% evolução</b><span>vs. semana anterior</span></div></div><div className="status-line"><span><Icon name="check" size={16}/> Dados sincronizados agora</span><span>EPAVOne</span></div></Card>
        </section>

        <section id="ferramentas" className="section"><div className="section-heading"><div><span className="eyebrow">Ferramentas conectadas</span><h2>Tudo o que você precisa<br/>para seguir em frente.</h2></div><p>Cada ferramenta resolve uma etapa. Juntas, elas criam um fluxo de trabalho mais simples, seguro e inteligente.</p></div><div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div></section>

        <section id="fluxo" className="section workflow"><div><span className="eyebrow">Experiência consistente</span><h2>Componentes que<br/>funcionam de verdade.</h2><p>O sistema responde a cada escolha com estados claros, movimento intencional e feedback imediato.</p><ul><li><Icon name="check"/> Hierarquia acessível e previsível</li><li><Icon name="check"/> Responsivo em qualquer tela</li><li><Icon name="check"/> Interações com propósito</li></ul></div><Card className="control-demo glass-strong"><div className="demo-head"><span><small>PLANEJAMENTO RÁPIDO</small><b>Ajuste sua prioridade</b></span><Badge>Interativo</Badge></div><Select label="Objetivo da semana" options={['Aumentar conversões', 'Reativar clientes', 'Apresentar produtos']}/><Slider label="Nível de foco" value={focus} onChange={event => setFocus(event.target.value)}/><Button icon="arrow" className="wide" onClick={confirm}>Salvar planejamento</Button><p className={`feedback ${notice ? 'visible' : ''}`} role="status"><Icon name="check"/> Planejamento salvo com sucesso.</p></Card></section>
      </main>
      <footer><a className="brand compact" href="#top"><span className="brand-mark">e.</span><span>EPAV<b>One</b></span></a><p>Planeje. Entenda. Prepare.</p><span>Experiências Práticas em Atividades de Varejo</span></footer>
    </div></>;
}

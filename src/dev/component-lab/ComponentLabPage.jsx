import { useState } from 'preact/hooks';
import {
  Alert,Badge,Breadcrumb,Button,Card,ChartContainer,Checkbox,DataTable,DateRange,Dialog,Drawer,EmptyState,ErrorState,
  FilterBar,FilterControl,IconButton,Inline,Input,MetricCard,NativeSelect,PageHeader,Radio,Select,Sidebar,Skeleton,Slider,
  Spinner,Stack,Switch,Tabs,Tag,Toast,ToastRegion,Toolbar,Tooltip
} from '../../design-system/components/index.js';

const selectOptions=[
  {value:'suinos',label:'Suínos'},
  {value:'aves',label:'Aves'},
  {value:'bovinos',label:'Bovinos'},
  {value:'pescados',label:'Pescados'},
  {value:'indisponivel',label:'Indisponível',disabled:true}
];

const tableColumns=[
  {key:'produto',label:'Produto'},
  {key:'categoria',label:'Categoria'},
  {key:'qtd',label:'Qtd.',numeric:true},
  {key:'receita',label:'Receita',numeric:true},
  {key:'status',label:'Status',render:row=><Badge tone={row.tone}>{row.status}</Badge>}
];
const tableRows=[
  {id:1,produto:'Linguiça Toscana',categoria:'Suínos',qtd:14,receita:'R$ 418',status:'Alta',tone:'success'},
  {id:2,produto:'Filé de Peito',categoria:'Aves',qtd:9,receita:'R$ 287',status:'Média',tone:'info'},
  {id:3,produto:'Salmão',categoria:'Pescados',qtd:4,receita:'R$ 236',status:'Regular',tone:'default'}
];

export function ComponentLabPage(){
  const [slider,setSlider]=useState(68);
  const [select,setSelect]=useState('suinos');
  const [tab,setTab]=useState('resumo');
  const [dialog,setDialog]=useState(false);
  const [drawer,setDrawer]=useState(false);
  const [toast,setToast]=useState(false);
  const [start,setStart]=useState('2026-09-21');
  const [end,setEnd]=useState('2026-09-26');

  return <section className="component-lab-page">
    <Breadcrumb items={[{label:'EPAVOne',href:'#/'},{label:'Dev'},{label:'Componentes'}]}/>
    <PageHeader eyebrow="Development only" title="Component Lab" description="Os exemplos abaixo usam os componentes reais do design system com valores fictícios. Nenhum card desta página define stitched manualmente." actions={<Badge tone="success">32 componentes separados</Badge>}/>

    <LabSection title="Ações e formulários">
      <Card className="lab-card"><h3 className="ds-heading-h5">Button + IconButton</h3><Inline><Button>Primário</Button><Button variant="secondary">Secundário</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Excluir</Button><Button loading>Salvando</Button><Button disabled>Disabled</Button></Inline><Inline><IconButton size="sm" label="Anterior">←</IconButton><IconButton label="Favoritar">♡</IconButton><IconButton size="lg" label="Adicionar">＋</IconButton></Inline></Card>
      <Card className="lab-card"><h3 className="ds-heading-h5">Input + Select</h3><Stack><Input id="lab-client" label="Cliente" value="Marina Oliveira" readOnly helper="Campo fictício"/><Input id="lab-code" label="Código" value="EPAV-000" readOnly error="Código fictício inválido"/><NativeSelect id="lab-native" label="Select nativo"><option>Suínos</option><option>Aves</option></NativeSelect><Select label="Select padronizado" options={selectOptions} value={select} onChange={setSelect} helper="Selected, disabled e teclado"/></Stack></Card>
      <Card className="lab-card"><h3 className="ds-heading-h5">Checkbox + Radio + Switch</h3><Stack><Checkbox defaultChecked>Somente produtos em promoção</Checkbox><Checkbox>Mostrar indisponíveis</Checkbox><Checkbox disabled>Opção indisponível</Checkbox><Radio name="period" defaultChecked>Semana atual</Radio><Radio name="period">Mês</Radio><Switch defaultChecked>Atualização automática</Switch></Stack></Card>
      <Card className="lab-card"><h3 className="ds-heading-h5">Slider</h3><Slider label="Meta semanal" value={slider} onInput={setSlider}/><Slider label="Desabilitado" value={40} disabled/></Card>
    </LabSection>

    <LabSection title="Navegação e estrutura">
      <Card className="lab-card"><h3 className="ds-heading-h5">Tabs + Breadcrumb</h3><Tabs items={[{value:'resumo',label:'Resumo'},{value:'pedidos',label:'Pedidos'},{value:'historico',label:'Histórico'},{value:'bloqueado',label:'Bloqueado',disabled:true}]} value={tab} onChange={setTab}/><div className="lab-panel">Painel ativo: <strong>{tab}</strong></div></Card>
      <Card className="lab-card"><h3 className="ds-heading-h5">Sidebar</h3><Sidebar items={[{href:'#/dev/components',label:'Dashboard',active:true},{href:'#/dev/components',label:'Produtos'},{href:'#/dev/components',label:'Receitas'},{href:'#/dev/components',label:'Perfil'}]}/></Card>
      <Card className="lab-card lab-span-2"><h3 className="ds-heading-h5">Toolbar + FilterBar + DateRange</h3><Toolbar start={<><strong>Visão geral</strong><Badge>Semana 39</Badge></>} end={<><Button size="sm" variant="secondary">Exportar</Button><Button size="sm">Novo relatório</Button></>}/><FilterBar><FilterControl><NativeSelect label="Vendedor"><option>Todos</option><option>Leonardo</option></NativeSelect></FilterControl><FilterControl><NativeSelect label="Categoria"><option>Todas</option><option>Suínos</option></NativeSelect></FilterControl><FilterControl className="lab-date"><span className="ds-input-label">Período</span><DateRange start={start} end={end} onStartChange={setStart} onEndChange={setEnd}/></FilterControl></FilterBar></Card>
    </LabSection>

    <LabSection title="Insights e dados">
      <div className="lab-metrics lab-span-2"><MetricCard label="Vendas" value="R$ 3.420" trend="↑ 14,2%" tone="positive"/><MetricCard label="Pedidos" value="18" trend="↑ 3" tone="positive"/><MetricCard label="Ticket médio" value="R$ 190" trend="→ estável"/><MetricCard label="Conversão" value="42%" trend="↓ 2,1 p.p." tone="negative"/></div>
      <ChartContainer title="Vendas por dia" subtitle="Valores fictícios em R$" data={[{label:'Seg',height:45,value:'R$ 410'},{label:'Ter',height:62,value:'R$ 560'},{label:'Qua',height:51,value:'R$ 480'},{label:'Qui',height:78,value:'R$ 720'},{label:'Sex',height:68,value:'R$ 630'},{label:'Sáb',height:83,value:'R$ 620'}]}/>
      <DataTable columns={tableColumns} rows={tableRows} caption="Tabela fictícia de produtos"/>
    </LabSection>

    <LabSection title="Feedback e estados">
      <Card className="lab-card"><h3 className="ds-heading-h5">Loading</h3><Inline><Spinner size="lg"/><span>Carregando indicadores…</span></Inline><Stack><Skeleton variant="title"/><Skeleton/><Skeleton/><Skeleton/></Stack></Card>
      <Card className="lab-card"><h3 className="ds-heading-h5">Alertas</h3><Stack><Alert title="Informação">Dados fictícios para validação.</Alert><Alert tone="success" title="Concluído">18 pedidos foram carregados.</Alert><Alert tone="warning" title="Atenção">Dois registros precisam de revisão.</Alert><Alert tone="danger" title="Falha">Não foi possível sincronizar.</Alert></Stack></Card>
      <EmptyState title="Nenhum pedido" description="Nenhum pedido encontrado para os filtros selecionados." actionLabel="Criar pedido"/>
      <ErrorState title="Erro ao carregar" description="Não foi possível carregar os indicadores fictícios."/>
      <Card className="lab-card"><h3 className="ds-heading-h5">Overlays + Tooltip</h3><Inline><Button onClick={()=>setDialog(true)}>Dialog</Button><Button variant="secondary" onClick={()=>setDrawer(true)}>Drawer</Button><Button variant="ghost" onClick={()=>{setToast(true);setTimeout(()=>setToast(false),2500)}}>Toast</Button><Tooltip label="Tooltip por hover ou foco"><IconButton label="Ajuda">?</IconButton></Tooltip></Inline></Card>
      <Card className="lab-card"><h3 className="ds-heading-h5">Badge + Tag</h3><Inline><Badge>Default</Badge><Badge tone="info">Info</Badge><Badge tone="success">Sucesso</Badge><Badge tone="danger">Erro</Badge></Inline><Inline><Tag>Suínos</Tag><Tag>Semana 39</Tag><Tag removable>Promoção ×</Tag></Inline></Card>
    </LabSection>

    <Dialog open={dialog} title="Confirmar ação" onClose={()=>setDialog(false)} actions={<><Button variant="secondary" onClick={()=>setDialog(false)}>Cancelar</Button><Button onClick={()=>setDialog(false)}>Confirmar</Button></>}>Este dialog vem de <code>design-system/components/Dialog.jsx</code>.</Dialog>
    <Drawer open={drawer} title="Filtros avançados" onClose={()=>setDrawer(false)}><Stack><Input id="drawer-client" label="Cliente" value="Marina Oliveira" readOnly/><Switch defaultChecked>Somente oportunidades</Switch><Button onClick={()=>setDrawer(false)}>Aplicar filtros</Button></Stack></Drawer>
    <ToastRegion>{toast && <Toast tone="success">Toast fictício exibido com sucesso.</Toast>}</ToastRegion>
  </section>;
}

function LabSection({title,children}) { return <section className="lab-section"><div className="lab-section-head"><span className="ds-overline">{title}</span></div><div className="lab-grid">{children}</div></section>; }

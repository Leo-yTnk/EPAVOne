import { useState } from 'preact/hooks';
import { Badge, Button, Card, FieldGrid, Input, SectionHeader, SummaryList, ActionGroup } from '../../design-system/components/index.js';

const products = [
  ['one', 'EPAVOne'],
  ['insights', 'EPAVInsights'],
  ['planner', 'EPAVPlanner'],
  ['writer', 'EPAVWriter']
];
// Development-only comparison: identical composition and states, four product accents.
export function FoundationPreview() {
  const [selected, setSelected] = useState('');
  return (
    <section className="lab-foundations" aria-label="Linguagem compartilhada entre apps">
      <SectionHeader title="Uma linguagem, quatro cores" description="Os mesmos componentes, espaçamentos e estados em cada produto." />
      <div className="lab-foundations-grid">
        {products.map(([product, name]) => (
          <Card key={product} data-product={product} className="lab-card" padding="compact">
            <SectionHeader title={name} description="Uma tarefa clara, com o próximo passo à mão." />
            <div className="lab-color-swatch" aria-label={`Cor principal do ${name}`} />
            <Badge>Selecionado</Badge>
            <FieldGrid>
              <Input label={`Nome · ${name}`} placeholder="Como podemos chamar você?" helper="Uma orientação breve e útil." />
              <Input label={`Código · ${name}`} value="" readOnly error="Confira este campo." />
            </FieldGrid>
            <SummaryList
              items={[
                { label: 'Clientes', value: '8' },
                { label: 'Atendimentos', value: '6' }
              ]}
            />
            <ActionGroup align="start">
              <Button variant="secondary" onClick={() => setSelected(`Voltando em ${name}.`)}>
                Voltar
              </Button>
              <Button onClick={() => setSelected(`Próxima etapa em ${name}.`)}>Continuar</Button>
            </ActionGroup>
          </Card>
        ))}
      </div>
      <p role="status">{selected || 'Demonstração de componentes; nenhum dado é enviado.'}</p>
    </section>
  );
}

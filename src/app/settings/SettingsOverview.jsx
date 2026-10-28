import { Badge, Button, Card, Icon, SectionHeader, Text } from '../../design-system/components/index.js';
import { reducedMotion } from '../../design-system/behaviors/motion.js';
export function SettingsOverview({ preferences }) {
  return (
    <Card as="aside" className="settings-overview" aria-label="Personalização">
      <span className="ds-overline">DO SEU JEITO</span>
      <SectionHeader title="Seu espaço, seu ritmo." description="Da primeira tela aos pequenos detalhes." />
      <div className="settings-overview-summary">
        <Badge>
          {preferences.performanceMode === 'performance'
            ? 'Alto desempenho'
            : preferences.performanceMode === 'fabulous'
              ? 'Fabuloso'
              : 'Equilibrado'}
        </Badge>
        <Text size="sm">As mudanças aparecem na hora e ficam salvas neste navegador.</Text>
      </div>
      <nav className="settings-index" aria-label="Seções das configurações">
        {[
          ['rotina', 'Sua rotina', 'user'],
          ['home', 'Sua Home', 'home'],
          ['aparencia', 'Aparência', 'sun'],
          ['navegacao', 'Navegação', 'menu'],
          ['desempenho', 'Desempenho', 'difficulty'],
          ['acessibilidade', 'Acessibilidade', 'reading'],
          ['conta', 'Conta e dados', 'save']
        ].map(([id, label, icon]) => (
          <Button
            as="a"
            key={id}
            variant="ghost"
            align="start"
            href={`#settings-${id}`}
            onClick={(event) => {
              event.preventDefault();
              const target = document.getElementById(`settings-${id}`);
              target?.focus({ preventScroll: true });
              target?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
            }}
          >
            <Icon name={icon === 'reading' ? 'difficulty' : icon} />
            {label}
          </Button>
        ))}
      </nav>
      <Button as="a" href="#/" variant="secondary">
        Ver minha Home <Icon name="next" />
      </Button>
    </Card>
  );
}

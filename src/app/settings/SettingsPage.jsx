import { Button, Card, Heading, PageHeader, Select, Switch, Text } from '../../design-system/components/index.js';
import { DEFAULT_PREFERENCES } from './preferences.js';
import { useState } from 'preact/hooks';
import { legacySummary, downloadLegacyReview } from '../../shared/services/legacyStorage.js';
import './settings.css';

export function SettingsPage({
  theme,
  onToggleTheme,
  preferences,
  onPreferencesChange,
  account,
  onOpenAccount,
  saveStatus = 'Salvo neste navegador'
}) {
  const [legacyError, setLegacyError] = useState('');
  const legacyKeys = legacySummary();
  const update = (patch) => onPreferencesChange({ ...preferences, ...patch });
  return (
    <section className="settings-page">
      <PageHeader
        eyebrow="EPAVOne"
        title="Configurações"
        description="Ajuste seu espaço de trabalho. As preferências são salvas neste navegador."
      />
      <p className="settings-save-status" role="status">
        {saveStatus}
      </p>
      <div className="settings-list">
        <Card as="section" className="settings-section">
          <Heading as="h2" level={4}>
            Aparência
          </Heading>
          <Text size="sm">Escolha o contraste e o espaço entre os elementos.</Text>
          <Select
            label="Tema"
            value={theme}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' }
            ]}
            onChange={(next) => next !== theme && onToggleTheme()}
          />
          <Select
            label="Densidade dos cards"
            value={preferences.density}
            options={[
              { value: 'comfortable', label: 'Confortável' },
              { value: 'compact', label: 'Compacta' }
            ]}
            onChange={(density) => update({ density })}
          />
        </Card>
        <Card as="section" className="settings-section">
          <Heading as="h2" level={4}>
            Navegação
          </Heading>
          <Text size="sm">Uma barra de tabs no topo ou uma biblioteca de apps na lateral. No celular, use a barra compacta no topo.</Text>
          <Select
            label="Posição da navegação"
            value={preferences.navigation}
            options={[
              { value: 'horizontal', label: 'Horizontal · tabs no topo' },
              { value: 'vertical', label: 'Vertical · painel lateral' }
            ]}
            onChange={(navigation) => update({ navigation })}
          />
        </Card>
        <Card as="section" className="settings-section">
          <Heading as="h2" level={4}>
            Acessibilidade
          </Heading>
          <Text size="sm">As preferências de movimento do sistema também são respeitadas.</Text>
          <Switch checked={preferences.reducedMotion} onChange={(event) => update({ reducedMotion: event.currentTarget.checked })}>
            Reduzir animações
          </Switch>
        </Card>
        <Card as="section" className="settings-section">
          <Heading as="h2" level={4}>
            Conta e biblioteca
          </Heading>
          <Text size="sm">
            {account?.session ? account.session.user.email : 'Entre para gerenciar sua biblioteca pessoal e os conteúdos compartilhados.'}
          </Text>
          <div className="settings-actions">
            <Button variant="secondary" onClick={onOpenAccount}>
              {account?.session ? 'Gerenciar minha conta' : 'Entrar na conta'}
            </Button>
            <Button as="a" href="#/insights/criacao" variant="ghost">
              Abrir minha biblioteca
            </Button>
          </div>
        </Card>
        {legacyKeys.length > 0 && (
          <Card as="section" className="settings-section">
            <Heading as="h2" level={4}>
              Dados anteriores preservados
            </Heading>
            <Text size="sm">
              Encontramos {legacyKeys.length} conjuntos de dados neste navegador. Receitas, favoritos e vendas locais precisam de revisão
              antes de serem associados à sua conta.
            </Text>
            <Button
              variant="secondary"
              onClick={() => {
                try {
                  downloadLegacyReview();
                } catch (error) {
                  setLegacyError(error.message);
                }
              }}
            >
              Baixar dados para revisão
            </Button>
            {legacyError && <p role="alert">{legacyError}</p>}
          </Card>
        )}
      </div>
      <div className="settings-reset">
        <Text size="sm">Restaure aparência, navegação e movimento sem alterar seus conteúdos.</Text>
        <Button
          variant="secondary"
          onClick={() => {
            onPreferencesChange({ ...DEFAULT_PREFERENCES });
            if (theme !== 'light') onToggleTheme();
          }}
        >
          Restaurar preferências
        </Button>
      </div>
    </section>
  );
}

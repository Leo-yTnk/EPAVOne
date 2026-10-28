import { Button, PageHeader, Text } from '../../design-system/components/index.js';
import { DEFAULT_PREFERENCES } from './preferences.js';
import { SettingsOverview } from './SettingsOverview.jsx';
import { RoutineSettings } from './RoutineSettings.jsx';
import { AppearanceSettings } from './AppearanceSettings.jsx';
import { ExperienceSettings } from './ExperienceSettings.jsx';
import { AccountSettings } from './AccountSettings.jsx';
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
  const update = (patch) => onPreferencesChange({ ...preferences, ...patch });
  return (
    <section className="settings-page">
      <PageHeader
        eyebrow="EPAVOne"
        title="Configurações"
        description="Seu espaço, seu ritmo. Ajuste a rotina, a aparência e a experiência de cada dia."
      />
      <p className="settings-save-status" role="status">
        {saveStatus}
      </p>
      <div className="settings-layout">
        <SettingsOverview preferences={preferences} />
        <div className="settings-list">
          <RoutineSettings preferences={preferences} update={update} />
          <AppearanceSettings preferences={preferences} update={update} theme={theme} onToggleTheme={onToggleTheme} />
          <ExperienceSettings preferences={preferences} update={update} />
          <AccountSettings account={account} onOpenAccount={onOpenAccount} />
        </div>
      </div>
      <div className="settings-reset">
        <Button as="a" href="#/welcome" variant="ghost">
          Rever tutorial
        </Button>
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

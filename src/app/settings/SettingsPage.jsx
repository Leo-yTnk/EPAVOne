import { SettingsSection } from './SettingsSection.jsx';
import { Button, Input, PageHeader, Select, Switch, Text } from '../../design-system/components/index.js';
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
        description="Um espaço com o seu jeito. Personalize sua rotina, a leitura e os pequenos detalhes."
      />
      <p className="settings-save-status" role="status">
        {saveStatus}
      </p>
      <div className="settings-list">
        <SettingsSection
          title="Seu jeito de começar"
          icon="user"
          description={<> Seu nome aparece na saudação da home. Estas escolhas ficam somente neste navegador. </>}
        >
          <Input
            label="Como podemos chamar você?"
            value={preferences.displayName}
            maxLength={40}
            placeholder="Seu nome ou apelido"
            helper="Até 40 caracteres. Não altera o nome da sua conta."
            onInput={(event) => update({ displayName: event.currentTarget.value })}
          />
          <Select
            label="Atalho principal da home"
            value={preferences.homeAction}
            options={[
              { value: 'planner', label: 'Planejar atendimentos' },
              { value: 'insights', label: 'Explorar ideias' },
              { value: 'writer', label: 'Preparar um pedido' }
            ]}
            onChange={(homeAction) => update({ homeAction })}
          />
        </SettingsSection>
        <SettingsSection
          title="Uma home que acolhe"
          icon="home"
          description={
            <>
              O cenário acompanha o horário deste dispositivo, inclusive se a página ficar aberta. O tema claro ou escuro continua sendo sua
              escolha.
            </>
          }
        >
          <Select
            label="Fundo da home"
            value={preferences.homeBackground}
            options={[
              { value: 'adaptive', label: 'Adaptar ao horário local' },
              { value: 'neutral', label: 'Papel neutro' }
            ]}
            onChange={(homeBackground) => update({ homeBackground })}
          />
          <Switch checked={preferences.showInspiration} onChange={(event) => update({ showInspiration: event.currentTarget.checked })}>
            Mostrar mensagem de inspiração
          </Switch>
          <Switch
            checked={preferences.showWeeklyReminder}
            onChange={(event) => update({ showWeeklyReminder: event.currentTarget.checked })}
          >
            Mostrar lembrete do formulário semanal
          </Switch>
        </SettingsSection>
        <SettingsSection
          title="Aparência"
          icon="sun"
          description={<> Escolha o tema, o espaço entre os elementos e a textura do fundo. </>}
        >
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
          <Switch checked={preferences.showGrid} onChange={(event) => update({ showGrid: event.currentTarget.checked })}>
            Fundo quadriculado
          </Switch>
        </SettingsSection>
        <SettingsSection
          title="Navegação"
          icon="menu"
          description={<> Escolha como navegar em cada tamanho de tela. O painel lateral no celular e tablet abre pela esquerda. </>}
        >
          <Select
            label="Posição da navegação"
            value={preferences.navigation}
            options={[
              { value: 'horizontal', label: 'Horizontal · tabs no topo' },
              { value: 'vertical', label: 'Vertical · painel lateral' }
            ]}
            onChange={(navigation) => update({ navigation })}
          />
          <Select
            label="Navegação no celular e tablet"
            value={preferences.mobileNavigation || 'horizontal'}
            options={[
              { value: 'horizontal', label: 'Barra no topo' },
              { value: 'vertical', label: 'Painel lateral' }
            ]}
            onChange={(mobileNavigation) => update({ mobileNavigation })}
          />
        </SettingsSection>
        <SettingsSection
          title="Acessibilidade"
          icon="difficulty"
          description={<> As preferências de movimento do sistema também são respeitadas. </>}
        >
          <Select
            label="Tamanho de leitura"
            value={preferences.textSize}
            options={[
              { value: 'standard', label: 'Padrão' },
              { value: 'large', label: 'Ampliado' }
            ]}
            onChange={(textSize) => update({ textSize })}
          />
          <Switch checked={preferences.reducedMotion} onChange={(event) => update({ reducedMotion: event.currentTarget.checked })}>
            Reduzir animações
          </Switch>
        </SettingsSection>
        <SettingsSection
          title="Conta e biblioteca"
          icon="user"
          description={
            <>
              {account?.session
                ? account.session.user.email
                : 'Entre para gerenciar sua biblioteca pessoal e os conteúdos compartilhados.'}{' '}
            </>
          }
        >
          <div className="settings-actions">
            <Button variant="secondary" onClick={onOpenAccount}>
              {account?.session ? 'Gerenciar minha conta' : 'Entrar na conta'}
            </Button>
            <Button as="a" href="#/insights/criacao" variant="ghost">
              Abrir minha biblioteca
            </Button>
          </div>
        </SettingsSection>
        {legacyKeys.length > 0 && (
          <SettingsSection
            title="Dados anteriores preservados"
            icon="save"
            description={
              <>
                Encontramos {legacyKeys.length} conjuntos de dados neste navegador. Receitas, favoritos e vendas locais precisam de revisão
                antes de serem associados à sua conta.
              </>
            }
          >
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
          </SettingsSection>
        )}
      </div>
      <div className="settings-reset">
        <Button as="a" href="#/welcome" variant="ghost">
          Rever a introdução
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

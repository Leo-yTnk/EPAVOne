import { SettingsSection } from './SettingsSection.jsx';
import { Input, Select, Switch } from '../../design-system/components/index.js';

export function RoutineSettings({ preferences, update }) {
  return (
    <>
      <SettingsSection
        id="settings-rotina"
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
          label="Ao abrir o EPAVOne"
          value={preferences.startPage || 'home'}
          options={[
            { value: 'home', label: 'Home do EPAVOne' },
            { value: 'planner', label: 'EPAVPlanner' },
            { value: 'insights', label: 'EPAVInsights' },
            { value: 'writer', label: 'EPAVWriter' }
          ]}
          helper="Vale ao abrir o endereço principal. Links para uma tela específica continuam abrindo essa tela."
          onChange={(startPage) => update({ startPage })}
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
        id="settings-home"
        title="Uma home que acolhe"
        icon="home"
        description={
          <>Deixe o cenário acompanhar o dia ou escolha uma atmosfera fixa. A saudação sempre acompanha o horário real do dispositivo.</>
        }
      >
        <Select
          label="Fundo da home"
          value={preferences.homeBackground}
          options={[
            { value: 'adaptive', label: 'Adaptar ao horário local' },
            { value: 'neutral', label: 'Papel neutro' },
            { value: 'dawn', label: 'Amanhecer · pêssego' },
            { value: 'morning', label: 'Manhã · dourado' },
            { value: 'afternoon', label: 'Tarde · azul' },
            { value: 'evening', label: 'Entardecer · lilás' },
            { value: 'night', label: 'Noite · índigo' }
          ]}
          onChange={(homeBackground) => update({ homeBackground })}
        />
        <Switch checked={preferences.showInspiration} onChange={(event) => update({ showInspiration: event.currentTarget.checked })}>
          Mostrar mensagem de inspiração
        </Switch>
        <Switch checked={preferences.showWeeklyReminder} onChange={(event) => update({ showWeeklyReminder: event.currentTarget.checked })}>
          Mostrar lembrete do formulário semanal
        </Switch>
      </SettingsSection>
    </>
  );
}

import { SettingsSection } from './SettingsSection.jsx';
import { Select, Switch, Text } from '../../design-system/components/index.js';

export function ExperienceSettings({ preferences, update }) {
  return (
    <>
      <SettingsSection
        id="settings-desempenho"
        title="Desempenho e movimento"
        icon="sun"
        description={<>Escolha o equilíbrio entre fluidez e efeitos visuais. A preferência fica salva neste navegador.</>}
      >
        <Select
          label="Modo de desempenho"
          value={preferences.performanceMode || 'balanced'}
          options={[
            { value: 'performance', label: 'Alto desempenho' },
            { value: 'balanced', label: 'Equilibrado' },
            { value: 'fabulous', label: 'Fabuloso' }
          ]}
          onChange={(performanceMode) => update({ performanceMode })}
        />
        <Text size="sm">
          {preferences.performanceMode === 'performance'
            ? 'Sem animações. Cards próximos da tela e imagens sob demanda para reduzir o trabalho e a memória.'
            : preferences.performanceMode === 'fabulous'
              ? 'Todas as animações disponíveis. Todos os cards e imagens da página são carregados; exige mais memória e internet.'
              : 'Animações leves de navegação e controles. Cards carregados perto da tela, com uma margem maior para rolar com conforto.'}
        </Text>
        {preferences.performanceMode === 'fabulous' && (
          <Text size="sm">A opção Reduzir animações e a preferência do sistema continuam valendo.</Text>
        )}
      </SettingsSection>
      <SettingsSection
        id="settings-acessibilidade"
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
        <Select
          label="Contraste de leitura"
          value={preferences.contrast || 'standard'}
          options={[
            { value: 'standard', label: 'Padrão' },
            { value: 'high', label: 'Reforçado · textos e contornos' }
          ]}
          onChange={(contrast) => update({ contrast })}
        />
        <Switch checked={preferences.reducedMotion} onChange={(event) => update({ reducedMotion: event.currentTarget.checked })}>
          Reduzir animações
        </Switch>
      </SettingsSection>
    </>
  );
}

import { SettingsSection } from './SettingsSection.jsx';
import { Select, Switch } from '../../design-system/components/index.js';

export function AppearanceSettings({ preferences, update, theme, onToggleTheme }) {
  return (
    <>
      <SettingsSection
        id="settings-aparencia"
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
        <Select
          label="Largura do conteúdo"
          value={preferences.contentWidth || 'standard'}
          options={[
            { value: 'focused', label: 'Focada · leitura mais próxima' },
            { value: 'standard', label: 'Padrão · espaço equilibrado' },
            { value: 'wide', label: 'Ampla · aproveitar a tela' }
          ]}
          helper="O conteúdo respeita o espaço disponível no celular e no tablet."
          onChange={(contentWidth) => update({ contentWidth })}
        />
        <Select
          label="Costuras dos cards"
          value={preferences.stitchStyle || 'default'}
          options={[
            { value: 'default', label: 'Padrão · identidade EPAVOne' },
            { value: 'subtle', label: 'Discretas' },
            { value: 'none', label: 'Sem costuras' }
          ]}
          onChange={(stitchStyle) => update({ stitchStyle })}
        />
        <Switch checked={preferences.showGrid} onChange={(event) => update({ showGrid: event.currentTarget.checked })}>
          Fundo quadriculado
        </Switch>
      </SettingsSection>
      <SettingsSection
        id="settings-navegacao"
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
        <Switch
          checked={preferences.showBreadcrumbs !== false}
          onChange={(event) => update({ showBreadcrumbs: event.currentTarget.checked })}
        >
          Mostrar caminho de navegação
        </Switch>
      </SettingsSection>
    </>
  );
}

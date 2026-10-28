import { useState } from 'preact/hooks';
import { Button } from '../../design-system/components/index.js';
import { SettingsSection } from './SettingsSection.jsx';
import { legacySummary, downloadLegacyReview } from '../../shared/services/legacyStorage.js';
export function AccountSettings({ account, onOpenAccount }) {
  const [legacyError, setLegacyError] = useState('');
  const legacyKeys = legacySummary();
  return (
    <>
      <SettingsSection
        id="settings-conta"
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
    </>
  );
}

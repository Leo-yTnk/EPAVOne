import { useRef, useState } from 'preact/hooks';
import { Alert, Button, Card, Checkbox, FileInput, SectionHeader } from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
import { readCatalogBackup, downloadCatalogBackup } from './catalogBackup.js';
export function BackupPanel() {
  const [backup, setBackup] = useState(null);
  const [filename, setFilename] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  async function act(operation) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await operation();
    } catch (failure) {
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="creation-fields" aria-label="Backup e restauração">
      <Card className="creation-fields creation-editor-section">
        <SectionHeader
          as="h3"
          size="sm"
          title="Backup do catálogo público"
          description="Guarde uma cópia para recuperar produtos, receitas e a organização da vitrine."
        />
        <p>
          Inclui conteúdo ativo e inativo, ingredientes, categorias, páginas, seções, vínculos, preços e URLs de imagens. Bibliotecas
          pessoais, contas, dados do Planner e arquivos de imagens não estão incluídos. Este arquivo não substitui um backup completo do
          banco de dados.
        </p>
        <Button
          disabled={busy}
          loading={busy}
          onClick={() =>
            act(async () => {
              downloadCatalogBackup(await adminService.exportBackup());
              setMessage('Backup gerado. Guarde o arquivo JSON baixado em um local seguro.');
            })
          }
        >
          Baixar backup JSON
        </Button>
      </Card>
      <Card className="creation-fields creation-editor-section">
        <SectionHeader
          as="h3"
          size="sm"
          title="Restaurar a partir de um backup"
          description="Selecione o JSON gerado nesta área. O Excel continua disponível para adicionar conteúdo novo."
        />
        <FileInput
          chooseLabel="Escolher backup JSON"
          label="Arquivo de backup"
          accept=".json"
          filename={filename}
          loading={busy}
          helper="Backup EPAVOne versão 1, até 50 MB."
          onFile={(file) =>
            act(async () => {
              setBackup(null);
              setConfirmed(false);
              setFilename(file.name);
              setBackup(await readCatalogBackup(file));
            })
          }
        />
        {backup && (
          <>
            <Alert tone="info" title="Confira o conteúdo antes de restaurar">
              {backup.data.recipes.length} receitas, {backup.data.products.length} produtos, {backup.data.categories.length} categorias e{' '}
              {backup.data.catalog_sections.length} seções. Os registros com os mesmos IDs serão substituídos e seus vínculos serão
              recompostos. Itens criados depois do backup serão mantidos. Códigos e datas de auditoria podem ser gerados novamente ao
              recuperar registros excluídos. URLs de imagens dependem de os arquivos originais continuarem disponíveis.
            </Alert>
            <Checkbox disabled={busy} checked={confirmed} onChange={(event) => setConfirmed(event.currentTarget.checked)}>
              Revisei o arquivo e autorizo restaurar o conteúdo público deste backup.
            </Checkbox>
            <Button
              disabled={busy || !confirmed}
              loading={busy}
              onClick={() =>
                act(async () => {
                  const result = await adminService.restoreBackup(backup);
                  setBackup(null);
                  setConfirmed(false);
                  setMessage(
                    `Restauração concluída: ${result.restored} registros processados. Atualize as outras telas para consultar o catálogo recuperado.`
                  );
                })
              }
            >
              Confirmar restauração
            </Button>
          </>
        )}
      </Card>
      {error && (
        <Alert tone="danger" title="Operação não concluída">
          {error} Se a conexão caiu durante a restauração, confira o catálogo antes de repetir.
        </Alert>
      )}
      {message && (
        <Alert tone="success" title="Backup e restauração">
          {message}
        </Alert>
      )}
    </section>
  );
}

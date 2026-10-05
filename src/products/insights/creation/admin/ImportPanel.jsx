import { useState } from 'preact/hooks';
import { Alert, Button, Checkbox, ErrorState, FileInput, Select, Spinner } from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { readCatalogFile, downloadImportTemplate } from './workbookService.js';
import { parseCatalogWorkbook } from './importParser.js';
const groups = [
  ['categories', 'Categorias'],
  ['products', 'Produtos'],
  ['recipes', 'Receitas'],
  ['sections', 'Seções'],
  ['recipeSections', 'Receitas por seção'],
  ['productSections', 'Produtos por seção']
];
const options = [
  { value: 'add', label: 'Adicionar novos' },
  { value: 'upsert', label: 'Adicionar e atualizar' },
  { value: 'replace_all', label: 'Substituir conjunto' }
];
export function ImportPanel() {
  const resource = useCreationResource(adminService.context, 'import');
  const [filename, setFilename] = useState('');
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [modes, setModes] = useState(Object.fromEntries(groups.map(([key]) => [key, 'add'])));
  async function parse(file) {
    if (busy) return;
    setBusy(true);
    setError('');
    setPayload(null);
    setConfirmed(false);
    setMessage('');
    setFilename(file.name);
    try {
      setPayload(parseCatalogWorkbook(await readCatalogFile(file), resource.data));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function run() {
    if (busy || !payload || payload.errors.length || !confirmed) return;
    setBusy(true);
    setError('');
    try {
      const data = await adminService.importCatalog(modes, payload);
      const total = Object.values(data)
        .filter((x) => x && typeof x === 'object')
        .reduce(
          (sum, row) => ({
            added: sum.added + (row.added || 0),
            removed: sum.removed + (row.removed || 0),
            replaced: sum.replaced + (row.replaced || 0)
          }),
          { added: 0, removed: 0, replaced: 0 }
        );
      setMessage(`Importação concluída: ${total.added} adicionado(s), ${total.replaced} atualizado(s), ${total.removed} removido(s).`);
      setPayload(null);
      resource.reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function template() {
    try {
      await downloadImportTemplate();
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <section className="creation-fields">
      <p>
        Importe o mesmo formato do Yourcipe: seis abas com categorias, produtos, receitas, seções e seus vínculos. Revise a prévia antes de
        confirmar.
      </p>
      <Button variant="secondary" onClick={template}>
        Baixar modelo Excel
      </Button>
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : (
        <FileInput
          label="Planilha do catálogo"
          accept=".xlsx"
          filename={filename}
          loading={busy}
          onFile={parse}
          helper="Até 10 MB e 5.000 linhas. Remova fórmulas antes de importar."
        />
      )}
      {payload && (
        <>
          <div className="creation-columns">
            {groups.map(([key, label]) => (
              <Select
                key={key}
                label={`${label}: ${payload[key].length} linha(s)`}
                value={modes[key]}
                options={options}
                disabled={busy}
                onChange={(value) => {
                  setConfirmed(false);
                  setModes((current) => ({ ...current, [key]: value }));
                }}
              />
            ))}
          </div>
          {payload.errors.length > 0 ? (
            <Alert tone="danger" title={`${payload.errors.length} erro(s) na planilha`}>
              <ul>
                {payload.errors.slice(0, 30).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
              {payload.errors.length > 30 && <p>Corrija estes erros para revisar as próximas linhas.</p>}
            </Alert>
          ) : (
            <>
              <Alert tone="warning" title="Revise o alcance da importação">
                Substituir conjunto pode desativar itens ou remover vínculos existentes na entidade e página correspondente. A operação é
                transacional; o servidor valida o arquivo completo.
              </Alert>
              <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} disabled={busy}>
                Revisei as quantidades e os modos de cada grupo.
              </Checkbox>
              <Button loading={busy} disabled={!confirmed} onClick={run}>
                Confirmar importação
              </Button>
            </>
          )}
        </>
      )}
      {error && (
        <Alert tone="danger" title="Importação não concluída">
          {error}
        </Alert>
      )}
      {message && (
        <Alert tone="success" title="Catálogo atualizado">
          {message}
        </Alert>
      )}
    </section>
  );
}

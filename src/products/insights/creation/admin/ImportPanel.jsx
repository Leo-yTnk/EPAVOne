import { useRef, useState } from 'preact/hooks';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  ErrorState,
  FileInput,
  Spinner,
  Progress,
  SectionHeader
} from '../../../../design-system/components/index.js';
import { importReplacementChoices } from './catalogDuplicates.js';
import { ImportReviewPreview } from './ImportReviewPreview.jsx';
import { adminService } from '../services/adminService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { readCatalogFile, downloadImportTemplate } from './workbookService.js';
import { parseCatalogWorkbook } from './importParser.js';
import { addModes, reviewCatalogImport } from './importReview.js';
export function ImportPanel() {
  const resource = useCreationResource(adminService.context, 'import');
  const [choices, setChoices] = useState({});
  const replacementCount = Object.values(choices).filter((value) => value === 'imported').length;
  const [filename, setFilename] = useState('');
  const [payload, setPayload] = useState(null);
  const [review, setReview] = useState(null);
  const [group, setGroup] = useState('products');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  async function prepare(file) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    setChoices({});
    setPayload(null);
    setReview(null);
    setConfirmed(false);
    setFilename(file.name);
    setProgress({ value: 0, label: 'Carregando catálogo para comparação' });
    try {
      const context = await adminService.context();
      const workbook = await readCatalogFile(file, ({ value, label }) => setProgress({ value, label }));
      setProgress({ value: 90, label: 'Validando registros e duplicatas' });
      await new Promise((resolve) => setTimeout(resolve, 0));
      const parsed = parseCatalogWorkbook(workbook, context);
      setPayload(parsed);
      setReview(reviewCatalogImport(parsed, context));
      setProgress({ value: 100, label: 'Leitura concluída. Revise a prévia antes de gravar.' });
    } catch (failure) {
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function run() {
    if (pending.current || !payload || review.errors.length || !confirmed) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    setProgress({ value: 0, label: 'Conferindo o catálogo atualizado' });
    try {
      const data = await adminService.importCatalog(addModes, payload, importReplacementChoices(review, choices), setProgress);
      setProgress({ value: 100, label: 'Importação concluída' });
      const total = Object.values(data)
        .filter((row) => row && typeof row === 'object')
        .reduce(
          (sum, row) => ({
            added: sum.added + (row.added || 0),
            ignored: sum.ignored + (row.ignored || 0),
            replaced: sum.replaced + (row.replaced || 0)
          }),
          {
            added: 0,
            ignored: 0,
            replaced: 0
          }
        );
      setMessage(
        total.replaced
          ? `Importação concluída: ${total.added} adicionado(s), ${total.replaced} substituído(s), ${total.ignored} mantido(s).`
          : `Importação concluída: ${total.added} adicionado(s), ${total.ignored} ignorado(s). Nenhum registro existente foi alterado.`
      );
      setPayload(null);
      setReview(null);
      setConfirmed(false);
      resource.reload();
    } catch (failure) {
      setError(failure.message);
      setConfirmed(false);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="creation-fields" aria-label="Importação do catálogo">
      <Card className="creation-fields creation-editor-section">
        <SectionHeader
          as="h3"
          size="sm"
          title={<>Adicionar a partir do Excel</>}
          description={<>Traga produtos, receitas, categorias e seções para o catálogo público.</>}
        />
        <p>
          Use as seis abas do modelo EPAVOne. Nas abas sem registros, mantenha somente os cabeçalhos. Este arquivo é o catálogo, separado do
          formulário de pedidos.
        </p>
        <div className="creation-toolbar">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              try {
                await downloadImportTemplate();
              } catch (failure) {
                setError(failure.message);
              }
            }}
          >
            Baixar modelo Excel
          </Button>
        </div>
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
            onFile={prepare}
            helper="Até 10 MB e 5.000 linhas. Remova fórmulas; preserve os cabeçalhos do modelo."
          />
        )}
        <Alert tone="info" title="Verificar duplicatas">
          Os registros existentes são mantidos por padrão. Para cada duplicata, você pode escolher o conteúdo importado. Categorias
          existentes serão reutilizadas. Identidades conflitantes impedem a importação.
        </Alert>
      </Card>
      {progress && !error && (
        <div aria-live="polite">
          <Progress
            label={progress.label}
            value={progress.value}
            formatValue={progress.waiting ? () => 'Aguardando confirmação do banco' : undefined}
          />
        </div>
      )}
      {payload && review && (
        <>
          <ImportReviewPreview
            payload={payload}
            review={review}
            group={group}
            setGroup={setGroup}
            choices={choices}
            busy={busy}
            onChoice={(key, value) => {
              setChoices((current) => ({ ...current, [key]: value }));
              setConfirmed(false);
            }}
          />
          {review.errors.length ? (
            <Alert tone="danger" title={`${review.errors.length} erro(s) na planilha`}>
              <ul>
                {review.errors.slice(0, 30).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </Alert>
          ) : (
            <>
              {payload.products.some((row) => row.swift_sku) && (
                <Alert title="Identificadores a verificar">
                  O SKU da planilha serve para conferir conflitos. Novos SKUs só serão gravados após verificação pela Swift.
                </Alert>
              )}
              <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} disabled={busy}>
                {replacementCount
                  ? `Revisei a comparação e autorizo ${replacementCount} substituição(ões), além dos novos registros.`
                  : 'Revisei a prévia e quero adicionar somente os novos registros.'}
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
          {error}{' '}
          {error.includes('tempo limite')
            ? 'Nenhuma alteração dessa transação foi salva. Tente novamente. Se persistir, peça ao administrador para verificar o tempo de processamento e os bloqueios do banco.'
            : 'Confira a mensagem antes de tentar novamente. Se a conexão caiu durante a gravação, atualize o catálogo e prepare outra prévia para verificar o resultado.'}
        </Alert>
      )}
      {message && (
        <Alert tone={payload ? 'info' : 'success'} title={payload ? 'Prévia pronta para revisão' : 'Catálogo atualizado'}>
          {message}
        </Alert>
      )}
    </section>
  );
}

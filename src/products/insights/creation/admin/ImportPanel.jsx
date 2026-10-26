import { useRef, useState } from 'preact/hooks';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  ErrorState,
  FileInput,
  Spinner,
  SectionHeader
} from '../../../../design-system/components/index.js';
import { importReplacementChoices } from './catalogDuplicates.js';
import { ImportReviewPreview } from './ImportReviewPreview.jsx';
import { adminService } from '../services/adminService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { readCatalogFile, downloadImportTemplate } from './workbookService.js';
import { prepareSwiftBundle } from './swiftBundleService.js';
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
    setFilename(file?.name || 'Produtos oficiais Swift · 07/10/2026');
    try {
      const context = await adminService.context();
      const parsed = file
        ? parseCatalogWorkbook(await readCatalogFile(file), context)
        : prepareSwiftBundle(context, { includeExisting: true });
      // An already imported official bundle is a successful no-op, not an empty-file error.
      if (!file && !parsed.products.length) {
        setMessage('Todos os produtos deste lote já existem no catálogo. Nenhum registro foi alterado.');
      } else {
        setPayload(parsed);
        setReview(reviewCatalogImport(parsed, context));
        if (!file)
          setMessage(
            `${parsed.products.length} produtos para revisar, incluindo possíveis duplicatas. Imagens oficiais, preços pendentes de sincronização.`
          );
      }
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
    try {
      const data = await adminService.importCatalog(addModes, payload, importReplacementChoices(review, choices));
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
          Use as seis abas do modelo Yourcipe. Nas abas sem registros, mantenha somente os cabeçalhos. Este arquivo é o catálogo, separado
          do formulário de pedidos.
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
          <Button variant="secondary" disabled={busy || resource.loading || Boolean(resource.error)} onClick={() => prepare()}>
            Preparar produtos oficiais Swift
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
          {error} Revise a planilha e tente novamente; a gravação é realizada por inteiro.
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

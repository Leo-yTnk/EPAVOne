import { useRef, useState } from 'preact/hooks';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ErrorState,
  FileInput,
  Link,
  Spinner,
  Tabs
} from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { readCatalogFile, downloadImportTemplate } from './workbookService.js';
import { prepareSwiftBundle } from './swiftBundleService.js';
import { parseCatalogWorkbook } from './importParser.js';
import { addModes, importGroups, reviewCatalogImport } from './importReview.js';
export function ImportPanel() {
  const resource = useCreationResource(adminService.context, 'import');
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
    setPayload(null);
    setReview(null);
    setConfirmed(false);
    setFilename(file?.name || 'Produtos oficiais Swift · 07/10/2026');
    try {
      const context = await adminService.context();
      const parsed = file ? parseCatalogWorkbook(await readCatalogFile(file), context) : prepareSwiftBundle(context);
      // An already imported official bundle is a successful no-op, not an empty-file error.
      if (!file && !parsed.products.length) {
        setMessage('Todos os produtos deste lote já existem no catálogo. Nenhum registro foi alterado.');
      } else {
        setPayload(parsed);
        setReview(reviewCatalogImport(parsed, context));
        if (!file)
          setMessage(
            `${parsed.products.length} produtos novos para revisar; ${parsed.skipped} já existentes ignorados. Imagens oficiais, preços pendentes de sincronização.`
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
      const data = await adminService.importCatalog(addModes, payload);
      const total = Object.values(data)
        .filter((row) => row && typeof row === 'object')
        .reduce((sum, row) => ({ added: sum.added + (row.added || 0), ignored: sum.ignored + (row.ignored || 0) }), {
          added: 0,
          ignored: 0
        });
      setMessage(
        `Importação concluída: ${total.added} adicionado(s), ${total.ignored} ignorado(s). Nenhum registro existente foi alterado.`
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
        <div className="creation-section-heading">
          <h3 className="creation-section-title">Adicionar a partir do Excel</h3>
          <p>Traga produtos, receitas, categorias e seções para o catálogo público.</p>
        </div>
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
        <Alert tone="info" title="Adicionar novos">
          Os registros existentes, inclusive inativos, serão preservados. Categorias existentes serão reutilizadas. Identidades conflitantes
          impedem a importação.
        </Alert>
      </Card>
      {payload && review && (
        <>
          <Card className="creation-fields creation-editor-section">
            <div className="creation-section-heading">
              <h3 className="creation-section-title">Prévia por entidade</h3>
              <p>Confira os dados e os vínculos antes de confirmar.</p>
            </div>
            <div className="creation-toolbar" role="status">
              <Badge>{review.totals.new} novos</Badge>
              <Badge>{review.totals.ignored + (payload.skipped || 0)} ignorados</Badge>
              <Badge>{review.totals.conflict} conflitos</Badge>
            </div>
            <Tabs
              label="Entidades da planilha"
              value={group}
              onChange={setGroup}
              items={importGroups.map(([value, label]) => ({ value, label: `${label} (${payload[value].length})` }))}
            />
            {review.groups[group].length ? (
              <ul className="creation-import-preview">
                {review.groups[group].map(({ row, status, differences, existing }, i) => (
                  <li key={i} className="creation-import-row">
                    <div>
                      <strong>{row.name || row.product || row.recipe}</strong>
                      <Badge>{status === 'new' ? 'Novo' : status === 'ignored' ? 'Ignorado' : 'Conflito'}</Badge>
                    </div>
                    <p>
                      {row.category || row.type || row.section || row.page}
                      {row.unit ? ` · ${row.unit}` : ''}
                      {row.sort_order !== undefined ? ` · ordem ${row.sort_order}` : ''} · linha {row.source_line || '?'}
                    </p>
                    {row.ingredients && <p>{row.ingredients.map((item) => `${item.product}: ${item.quantity}`).join('; ')}</p>}
                    {row.instructions && (
                      <ol>
                        {row.instructions.map((step, n) => (
                          <li key={n}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {/^https:\/\/(www\.)?swift\.com\.br\//i.test(row.swift_product_url || '') && (
                      <Link href={row.swift_product_url} target="_blank" rel="noopener noreferrer">
                        Página Swift
                      </Link>
                    )}
                    {/^https?:\/\//i.test(row.image_url || '') && (
                      <Link href={row.image_url} target="_blank" rel="noopener noreferrer">
                        Ver imagem
                      </Link>
                    )}
                    {existing?.active === false && <p>O registro existente está inativo e continuará assim.</p>}
                    {differences.length > 0 && (
                      <p>
                        Há diferenças em{' '}
                        {differences
                          .map(
                            (field) => ({ name: 'nome', image_url: 'imagem', unit: 'unidade', swift_product_url: 'página Swift' })[field]
                          )
                          .join(', ')}
                        . O conteúdo existente será mantido.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma linha nesta aba. Nenhum registro será removido.</p>
            )}
          </Card>
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
                Revisei a prévia e quero adicionar somente os novos registros.
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

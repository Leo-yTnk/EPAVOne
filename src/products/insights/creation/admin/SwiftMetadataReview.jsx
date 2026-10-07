import { useState } from 'preact/hooks';
import { Alert, Button, Card, Checkbox, ErrorState, Link, Spinner } from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function SwiftMetadataReview() {
  const resource = useCreationResource(adminService.observations, 'swift-observations');
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function accept(item) {
    if (busy) return;
    setBusy(item.product_id);
    setError('');
    setMessage('');
    try {
      await adminService.acceptMetadata(item, selected[item.product_id]);
      setSelected({});
      setMessage('Alterações revisadas e salvas.');
      resource.reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <Card className="creation-fields creation-editor-section">
      <div className="creation-section-heading">
        <h3 className="creation-section-title">Revisar dados da Swift</h3>
        <p>Nome e imagem só mudam depois da sua revisão. Categorias continuam sob sua edição.</p>
      </div>
      <p>
        A disponibilidade na Swift não confirma a oferta no formulário semanal do EPAV. O CEP solicitado pode não ser confirmado pela
        página; confira os preços antes do atendimento.
      </p>
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !resource.data?.length ? (
        <p>Sem consultas registradas. Atualize os preços para consultar as observações.</p>
      ) : (
        resource.data.map((item) => {
          const product = item.product;
          if (!product) return null;
          const options = selected[item.product_id] || {};
          const change = (patch) => setSelected((current) => ({ ...current, [item.product_id]: { ...options, ...patch } }));
          return (
            <section key={item.product_id} className="creation-fields creation-import-row">
              <strong>{product.name}</strong>
              <p>
                Consulta: {new Date(item.checked_at).toLocaleString('pt-BR')} · CEP {item.reference_zip_code} ·{' '}
                {item.presentation || 'Apresentação não informada'}
              </p>
              <p>
                Disponibilidade no site:{' '}
                {{ available: 'disponível', unavailable: 'indisponível', unknown: 'não informada' }[item.availability]}.{' '}
                {item.region_confirmed ? 'Região confirmada.' : 'Região não confirmada pela página.'}
              </p>
              <Link href={item.canonical_url} target="_blank" rel="noopener noreferrer">
                Conferir página Swift
              </Link>
              {item.observed_name !== product.name && (
                <Checkbox
                  disabled={Boolean(busy)}
                  checked={Boolean(options.name)}
                  onChange={(event) => change({ name: event.currentTarget.checked })}
                >
                  Alterar nome para: {item.observed_name}
                </Checkbox>
              )}
              {item.image_url && item.image_url !== product.image_url && (
                <>
                  <Link href={item.image_url} target="_blank" rel="noopener noreferrer">
                    Ver imagem oficial proposta
                  </Link>
                  <Checkbox
                    disabled={Boolean(busy)}
                    checked={Boolean(options.image)}
                    onChange={(event) => change({ image: event.currentTarget.checked })}
                  >
                    Usar a imagem oficial consultada
                  </Checkbox>
                </>
              )}
              {(options.name || options.image) && (
                <Button
                  loading={busy === item.product_id}
                  disabled={Boolean(busy) && busy !== item.product_id}
                  onClick={() => accept(item)}
                >
                  Salvar alterações selecionadas
                </Button>
              )}
            </section>
          );
        })
      )}
      {error && (
        <Alert tone="danger" title="Revisão não concluída">
          {error}
        </Alert>
      )}
      {message && (
        <Alert tone="success" title="Dados atualizados">
          {message}
        </Alert>
      )}
      <Button variant="ghost" disabled={Boolean(busy) || resource.loading} onClick={resource.reload}>
        Recarregar consultas Swift
      </Button>
    </Card>
  );
}

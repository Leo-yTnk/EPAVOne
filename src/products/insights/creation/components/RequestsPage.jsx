import { useMemo, useState } from 'preact/hooks';
import { Badge, Card, Button, EmptyState, ErrorState, Input, Pagination, Spinner } from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { statusLabels } from '../models/editor.js';
import { RequestDetails } from './RequestDetails.jsx';
export function RequestsPage({ admin = false }) {
  const resource = useCreationResource(() => collaborationService.requests(admin), String(admin));
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () =>
      (resource.data || []).filter((x) =>
        `${x.source_code} ${x.requester_display_name_snapshot} ${statusLabels[x.status]}`.toLowerCase().includes(query.toLowerCase())
      ),
    [resource.data, query]
  );
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / 20)));
  return (
    <section className="creation-fields">
      <Input
        label="Buscar solicitações"
        type="search"
        value={query}
        onInput={(e) => {
          setQuery(e.currentTarget.value);
          setPage(1);
        }}
      />
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !rows.length ? (
        <EmptyState title="Nenhuma solicitação encontrada" />
      ) : (
        <div className="creation-list">
          {rows.slice((current - 1) * 20, current * 20).map((request) => (
            <Card key={request.id} className="creation-row">
              <Badge>{statusLabels[request.status] || request.status}</Badge>
              <div>
                <h3>{request.source_code || request.request_code || 'Solicitação de publicação'}</h3>
                <p>{request.requester_display_name_snapshot}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelected(request)}>
                Ver solicitação
              </Button>
            </Card>
          ))}
        </div>
      )}
      {rows.length > 20 && <Pagination page={current} pageCount={Math.ceil(rows.length / 20)} onChange={setPage} />}
      {selected && (
        <RequestDetails
          request={selected}
          admin={admin}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            resource.reload();
          }}
        />
      )}
    </section>
  );
}

import { useMemo, useState } from 'preact/hooks';
import {
  ModalPresence,
  Badge,
  Card,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Spinner,
  SectionHeader
} from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { statusLabels } from '../models/editor.js';
import { RequestDetails } from './RequestDetails.jsx';
export function RequestsPage({ admin = false }) {
  const resource = useCreationResource(() => collaborationService.requests(admin), String(admin));
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const rows = useMemo(
    () =>
      (resource.data || []).filter(
        (x) =>
          (status === 'all' || x.status === status) &&
          `${x.source_code} ${x.requester_display_name_snapshot} ${statusLabels[x.status]}`.toLowerCase().includes(query.toLowerCase())
      ),
    [resource.data, query, status]
  );
  return (
    <section className="creation-fields">
      <Card className="creation-fields creation-operation">
        <SectionHeader
          as="h3"
          size="sm"
          title={admin ? 'Fila de revisão' : 'Acompanhe suas publicações'}
          description={
            admin
              ? 'Abra uma solicitação para avaliar o conteúdo e registrar sua decisão.'
              : 'Consulte o retorno da avaliação e os ajustes solicitados para cada conteúdo.'
          }
        />
        <div className="creation-toolbar">
          <Input
            label="Buscar solicitações"
            type="search"
            value={query}
            onInput={(e) => {
              setQuery(e.currentTarget.value);
            }}
          />
          <Select
            label="Status da solicitação"
            value={status}
            options={[
              { value: 'all', label: 'Todos' },
              ...[...new Set((resource.data || []).map((x) => x.status))].map((value) => ({ value, label: statusLabels[value] || value }))
            ]}
            onChange={(value) => {
              setStatus(value);
            }}
          />
        </div>
      </Card>
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !rows.length ? (
        <EmptyState title="Nenhuma solicitação encontrada" />
      ) : (
        <div className="creation-list creation-request-grid">
          {rows.map((request) => (
            <Card key={request.id} className="creation-row">
              <Badge tone={request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'neutral'}>
                {statusLabels[request.status] || request.status}
              </Badge>
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
      <ModalPresence>
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
      </ModalPresence>
    </section>
  );
}

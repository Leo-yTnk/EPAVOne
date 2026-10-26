import { useEffect, useState } from 'preact/hooks';
import {
  Alert,
  Button,
  Card,
  DataTable,
  Dialog,
  EmptyState,
  FieldGrid,
  Input,
  SectionHeader,
  Spinner
} from '../../../design-system/components/index.js';
import { newSale, saleDay, saleMoney, salesTransfer } from '../../../shared/services/sales.js';
import { salesRepository } from '../../../shared/services/salesRepository.js';
import { useSales } from './useSales.js';
import { SalesDashboard } from './SalesDashboard.jsx';
import { SaleEditor } from './SaleEditor.jsx';
export function SalesPage({ account, onOpenAccount, repository = salesRepository }) {
  const enabled = Boolean(account?.session);
  const [start, setStart] = useState(() => saleDay().slice(0, 7) + '-01'),
    [end, setEnd] = useState(saleDay);
  const [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [notice, setNotice] = useState('');
  const [pending, setPending] = useState(salesTransfer.get);
  const sales = useSales(enabled, start, end, repository);
  useEffect(() => salesTransfer.subscribe(setPending), []);
  useEffect(() => {
    if (!enabled || !pending) return;
    setNotice('');
    let active = true;
    repository
      .find(pending.id)
      .then((row) => {
        if (active) setEditing({ ...pending, revision: row?.details?.revision || 0 });
      })
      .catch((error) => {
        if (active) setNotice(error.message);
      });
    return () => {
      active = false;
    };
  }, [enabled, pending, repository]);
  async function save(order) {
    if (await sales.save(order)) {
      setEditing(null);
      salesTransfer.clear(order.id);
      setNotice('Venda salva na sua conta.');
    }
  }
  function edit(row) {
    setEditing(
      row.details
        ? { ...row.details.order_data, id: row.id, revision: row.details.revision }
        : {
            ...newSale(),
            id: row.id,
            saleDate: row.sale_date,
            lines: [{ name: '', quantity: 1, unitPrice: Number(row.value), kit: false }],
            revision: 0
          }
    );
  }
  return (
    <section className="planner-sales-page" aria-label="Pedidos e vendas">
      <SectionHeader
        title="Pedidos e vendas"
        description="Registre, confira e acompanhe suas vendas."
        actions={
          <div className="ds-inline">
            <Button disabled={!enabled || sales.busy} onClick={() => setEditing(newSale())}>
              Cadastrar venda
            </Button>
            <Button variant="secondary" disabled={!enabled || sales.busy || sales.loading} onClick={sales.reload}>
              Atualizar pedidos
            </Button>
          </div>
        }
      />
      {!enabled && (
        <Alert tone="info" title="Suas vendas ficam na sua conta">
          <p>Entre para registrar pedidos, editar vendas e consultar seus indicadores.</p>
          <Button onClick={onOpenAccount}>Entrar para registrar vendas</Button>
        </Alert>
      )}
      <Card padding="compact">
        <FieldGrid>
          <Input
            disabled={sales.busy}
            label="Data inicial"
            type="date"
            value={start}
            max={end}
            onInput={(event) => setStart(event.currentTarget.value)}
          />
          <Input
            disabled={sales.busy}
            label="Data final"
            type="date"
            value={end}
            min={start}
            max={saleDay()}
            onInput={(event) => setEnd(event.currentTarget.value)}
          />
        </FieldGrid>
      </Card>
      {sales.error && (
        <Alert tone="danger" title="Pedidos indisponíveis">
          {sales.error}
        </Alert>
      )}
      {notice && <p role="status">{notice}</p>}
      {sales.loading ? <Spinner label="Carregando pedidos" /> : <SalesDashboard rows={sales.rows} />}
      {!sales.loading && !sales.rows.length && (
        <EmptyState title="Nenhuma venda neste período" description="Cadastre uma venda ou ajuste as datas para consultar o histórico." />
      )}
      {sales.rows.length > 0 && (
        <DataTable
          caption="Vendas registradas no período"
          columns={[
            { key: 'sale_date', label: 'Data' },
            {
              key: 'customer',
              label: 'Cliente',
              render: (row) => row.details?.order_data?.customer?.name || 'Cadastro anterior sem cliente'
            },
            { key: 'value', label: 'Valor', numeric: true, render: (row) => saleMoney(Math.round(Number(row.value) * 100)) },
            { key: 'items', label: 'Produtos distintos', render: (row) => (row.details ? row.ipc : 'Não informado') },
            {
              key: 'actions',
              label: 'Ações',
              render: (row) => (
                <div className="ds-inline">
                  <Button size="sm" variant="secondary" disabled={sales.busy} onClick={() => edit(row)}>
                    Editar venda
                  </Button>
                  <Button size="sm" variant="ghost" disabled={sales.busy} onClick={() => setDeleting(row)}>
                    Excluir venda
                  </Button>
                </div>
              )
            }
          ]}
          rows={sales.rows}
        />
      )}
      {editing && (
        <SaleEditor
          key={editing.id}
          initial={editing}
          busy={sales.busy}
          error={sales.error}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Dialog
          open
          title="Excluir venda?"
          onClose={() => !sales.busy && setDeleting(null)}
          actions={
            <>
              <Button variant="ghost" disabled={sales.busy} onClick={() => setDeleting(null)}>
                Cancelar
              </Button>
              <Button
                loading={sales.busy}
                onClick={async () => {
                  if (await sales.remove(deleting)) {
                    setDeleting(null);
                    setNotice('Venda excluída. Indicadores atualizados.');
                  }
                }}
              >
                Confirmar exclusão da venda
              </Button>
            </>
          }
        >
          <p>
            {deleting.sale_date} · {deleting.details?.order_data?.customer?.name || 'Venda anterior'} ·{' '}
            {saleMoney(Math.round(Number(deleting.value) * 100))}
          </p>
          <p>O registro será removido da sua conta e dos indicadores. Essa ação não cancela o pedido enviado ao suporte.</p>
          {sales.error && <p role="alert">{sales.error}</p>}
        </Dialog>
      )}
    </section>
  );
}

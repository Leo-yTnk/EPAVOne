import { useEffect, useState } from 'preact/hooks';
import { Alert, PageHeader } from '../../design-system/components/index.js';
import { saoPauloDay, validateOrder } from './models/order.js';
import { importTemplate } from './services/templateService.js';
import { downloadExport, exportOrder } from './services/exportService.js';
import { WeeklyUpload } from './components/WeeklyUpload.jsx';
import { ProductCatalog } from './components/ProductCatalog.jsx';
import { OrderDetails } from './components/OrderDetails.jsx';
import { OrderCart } from './components/OrderCart.jsx';
import './writer.css';
const emptyOrder = () => ({ room: '', student: '', client: '', phone: '', method: '', store: '', date: '', payment: '', lines: [] });
export function WriterRoutes() {
  const [template, setTemplate] = useState(null);
  const [order, setOrder] = useState(emptyOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [today, setToday] = useState(saoPauloDay);
  useEffect(() => {
    const refresh = () => setToday(saoPauloDay());
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  async function upload(file) {
    setBusy(true);
    setError('');
    setSuccess('');
    setTemplate(null);
    setOrder(emptyOrder());
    try {
      setTemplate(await importTemplate(file));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function change(fields) {
    setSuccess('');
    setOrder((current) => ({ ...current, ...fields }));
  }
  function add(name) {
    setSuccess('');
    setOrder((current) => ({
      ...current,
      lines: current.lines.some((line) => line.name === name)
        ? current.lines.map((line) => (line.name === name ? { ...line, quantity: Math.min(9999, line.quantity + 1) } : line))
        : [...current.lines, { name, quantity: 1, kit: false }]
    }));
  }
  function updateLine(name, fields) {
    change({ lines: order.lines.map((line) => (line.name === name ? { ...line, ...fields } : line)) });
  }
  async function download() {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const output = await exportOrder(template, order);
      downloadExport(output);
      setSuccess(`${output.count} ${output.count === 1 ? 'formulário pronto' : 'formulários prontos'} para conferência no Excel.`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const errors = template ? validateOrder(template, order, today) : [];
  const expired = template && today > template.period.end;
  return (
    <section className="product-page writer-page">
      <PageHeader
        eyebrow="EPAVWriter"
        title="Seu atendimento vira um pedido completo."
        description="Escolha os produtos, confira os dados e gere o formulário da semana com as fórmulas preservadas."
      />
      <WeeklyUpload template={template} busy={busy} error={error} onUpload={upload} />
      {expired && (
        <Alert tone="danger" title="Formulário vencido">
          Carregue o pedido da semana atual para continuar. A exportação está bloqueada.
        </Alert>
      )}
      {template && !expired && (
        <>
          {template.warnings.map((warning) => (
            <Alert key={warning} tone="warning" title="Atenção ao modelo recebido">
              {warning}
            </Alert>
          ))}
          <div className="writer-workspace">
            <div className="writer-main">
              <ProductCatalog products={template.products} lines={order.lines} onAdd={add} />
              <OrderDetails template={template} order={order} onChange={change} />
            </div>
            <aside>
              <OrderCart
                template={template}
                lines={order.lines}
                onChange={updateLine}
                onRemove={(name) => change({ lines: order.lines.filter((line) => line.name !== name) })}
                errors={errors}
                busy={busy}
                onExport={download}
                success={success}
              />
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

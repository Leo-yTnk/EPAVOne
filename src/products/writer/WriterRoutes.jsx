import { useEffect, useState } from 'preact/hooks';
import { Alert, PageHeader } from '../../design-system/components/index.js';
import { saoPauloDay, validateOrder, validateCustomer, validateProducts, validateDelivery } from './models/order.js';
import { importTemplate } from './services/templateService.js';
import { downloadExport, exportOrder } from './services/exportService.js';
import { WeeklyUpload } from './components/WeeklyUpload.jsx';
import { CheckoutContent } from './components/CheckoutContent.jsx';
import { CheckoutProgress, CHECKOUT_STEPS } from './components/CheckoutProgress.jsx';
import { CheckoutActions } from './components/CheckoutActions.jsx';
import './writer.css';
const emptyOrder = () => ({ room: '', student: '', client: '', phone: '', method: '', store: '', date: '', payment: '', lines: [] });
export function WriterRoutes({ active = true }) {
  const [template, setTemplate] = useState(null);
  const [order, setOrder] = useState(emptyOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [today, setToday] = useState(saoPauloDay);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    if (active && template && !document.activeElement?.closest('[role="tablist"]')) {
      const current = document.getElementById('writer-current-step');
      current?.focus({ preventScroll: true });
      const rect = current?.getBoundingClientRect();
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
      if (rect && (rect.top < headerBottom || rect.top > window.innerHeight - 80)) {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        current.scrollIntoView?.({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      }
    }
  }, [active, step, template]);
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
    setStep(0);
    setExportError('');
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
    setExportError('');
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
    setExportError('');
    setSuccess('');
    try {
      const output = await exportOrder(template, order);
      downloadExport(output);
      setSuccess(`${output.count} ${output.count === 1 ? 'formulário pronto' : 'formulários prontos'} para conferência no Excel.`);
    } catch (failure) {
      setExportError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const errors = template ? validateOrder(template, order, today) : [];
  const expired = template && today > template.period.end;
  const stageErrors = template
    ? [validateCustomer(template, order, today), validateProducts(template, order), validateDelivery(template, order, today)]
    : [];
  const canVisit = (index) => index <= step || stageErrors.slice(0, index).every((issues) => issues.length === 0);
  function navigate(index) {
    if (busy || !canVisit(index)) return;
    if (saoPauloDay() > template.period.end) {
      setToday(saoPauloDay());
      return;
    }
    setDirection(index < step ? 'backward' : 'forward');
    setStep(index);
  }
  if (!active) return null;
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
          <CheckoutProgress step={step} canVisit={canVisit} busy={busy} onNavigate={navigate} />
          <div
            key={step}
            id="writer-current-step"
            tabIndex={-1}
            className="writer-stage"
            data-direction={direction}
            role="region"
            aria-label={`Etapa ${step + 1}: ${CHECKOUT_STEPS[step]}`}
          >
            <CheckoutContent
              step={step}
              template={template}
              order={order}
              today={today}
              change={change}
              add={add}
              updateLine={updateLine}
              errors={errors}
              busy={busy}
              download={download}
              success={success}
              navigate={navigate}
            />
          </div>
          {exportError && (
            <Alert tone="danger" title="Não foi possível gerar o pedido">
              {exportError}
            </Alert>
          )}
          <CheckoutActions step={step} errors={step < 3 ? stageErrors[step] : []} busy={busy} onNavigate={navigate} />
        </>
      )}
    </section>
  );
}

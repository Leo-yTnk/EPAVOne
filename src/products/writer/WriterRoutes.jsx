import { usePlannerHandoff } from './services/usePlannerHandoff.js';
import { TemplateFeedback } from './components/TemplateFeedback.jsx';
import { PlannerHandoff } from './components/PlannerHandoff.jsx';
import { useEffect, useState } from 'preact/hooks';
import { Alert, PageHeader, Spinner } from '../../design-system/components/index.js';
import { sessionTemplate, restoreTemplateFile } from './services/sessionTemplate.js';
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
  const handoff = usePlannerHandoff();
  const [template, setTemplate] = useState(null);
  const [order, setOrder] = useState(emptyOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [today, setToday] = useState(saoPauloDay);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [exportError, setExportError] = useState('');
  const [restoring, setRestoring] = useState(true);
  const [storageWarning, setStorageWarning] = useState('');
  useEffect(() => {
    let current = true;
    sessionTemplate
      .load()
      .then(async (attachment) => {
        if (!attachment) return;
        const restored = await importTemplate(restoreTemplateFile(attachment));
        if (current) setTemplate(restored);
      })
      .catch((failure) => {
        if (current)
          setStorageWarning(`Não foi possível restaurar o Excel desta sessão. ${failure.message || 'Carregue o arquivo novamente.'}`);
      })
      .finally(() => {
        if (current) setRestoring(false);
      });
    return () => {
      current = false;
    };
  }, []);
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
    setExportError('');
    try {
      const nextTemplate = await importTemplate(file);
      setTemplate(nextTemplate);
      setOrder(emptyOrder());
      handoff.reset();
      setStep(0);
      try {
        await sessionTemplate.save(file);
        setStorageWarning('');
      } catch {
        try {
          await sessionTemplate.remove();
        } catch {
          /* Keep current in-memory workbook available. */
        }
        setStorageWarning(
          'O Excel está disponível enquanto esta página estiver aberta. O navegador não permitiu preservá-lo ao recarregar.'
        );
      }
    } catch (failure) {
      setError(
        `${failure.message} ${template ? 'Seu formulário e pedido anteriores foram preservados.' : 'Escolha um arquivo .xlsx válido para tentar novamente.'}`
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeTemplate() {
    setBusy(true);
    setError('');
    try {
      await sessionTemplate.remove();
      setTemplate(null);
      setOrder(emptyOrder());
      handoff.reset();
      setStep(0);
      setSuccess('');
      setExportError('');
      setStorageWarning('');
    } catch {
      setError('Não foi possível remover o arquivo salvo. Tente novamente; seu pedido foi preservado.');
    } finally {
      setBusy(false);
    }
  }
  function change(fields) {
    if (
      (Object.hasOwn(fields, 'client') && fields.client !== order.client) ||
      (Object.hasOwn(fields, 'room') && fields.room !== order.room)
    )
      handoff.reset();
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
      handoff.exported();
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
        title="Do atendimento ao pedido."
        description="Cliente, produtos, entrega e conferência. Um passo de cada vez, com as fórmulas do Excel preservadas."
      />
      {restoring ? (
        <Spinner label="Restaurando Excel da sessão" />
      ) : (
        <WeeklyUpload template={template} busy={busy} error={error} onUpload={upload} onRemove={removeTemplate} />
      )}
      {handoff.context && (
        <PlannerHandoff
          context={handoff.context}
          template={template}
          busy={busy}
          onApply={(client) => handoff.apply(client, order, change, setStep)}
        />
      )}
      <TemplateFeedback template={restoring ? null : template} expired={expired} storageWarning={storageWarning} />
      {template && !expired && !restoring && (
        <>
          <CheckoutProgress step={step} canVisit={canVisit} busy={busy} onNavigate={navigate} />
          <div className="writer-order-context" aria-label="Resumo do pedido em andamento">
            <span>
              <strong>{order.client || 'Novo pedido'}</strong>
              {order.room ? ` · ${order.room}` : ' · Comece pelos dados do cliente'}
            </span>
            <span>
              {order.lines.length} {order.lines.length === 1 ? 'produto' : 'produtos'} ·{' '}
              {order.lines.reduce((total, line) => total + Number(line.quantity), 0)}{' '}
              {order.lines.reduce((total, line) => total + Number(line.quantity), 0) === 1 ? 'unidade' : 'unidades'}
            </span>
          </div>
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
              {exportError} Seu pedido continua nesta sessão. Tente baixar novamente.
            </Alert>
          )}
          <CheckoutActions step={step} errors={step < 3 ? stageErrors[step] : []} busy={busy} onNavigate={navigate} />
        </>
      )}
    </section>
  );
}

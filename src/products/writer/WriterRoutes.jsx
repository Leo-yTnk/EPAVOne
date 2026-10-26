import { useWeeklyTemplate } from './services/useWeeklyTemplate.js';
import { WriterConnections } from './components/WriterConnections.jsx';
import { mergeOrderLines } from '../../shared/services/recipeOrder.js';
import { usePlannerHandoff } from './services/usePlannerHandoff.js';
import { TemplateFeedback } from './components/TemplateFeedback.jsx';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useForegroundInterval } from '../../design-system/behaviors/useForegroundInterval.js';
import { Alert, PageHeader, Spinner } from '../../design-system/components/index.js';
import { sessionTemplate } from './services/sessionTemplate.js';
import { saoPauloDay, validateOrder, validateCustomer, validateProducts, validateDelivery } from './models/order.js';
import { importTemplate } from './services/templateService.js';
import { useWriterExport } from './services/useWriterExport.js';
import { SaleRegistrationAction } from './components/SaleRegistrationAction.jsx';
import { WeeklyUpload } from './components/WeeklyUpload.jsx';
import { CheckoutContent } from './components/CheckoutContent.jsx';
import { CheckoutProgress, CHECKOUT_STEPS } from './components/CheckoutProgress.jsx';
import { CheckoutActions } from './components/CheckoutActions.jsx';
import './writer.css';
import './writer-cart.css';
const emptyOrder = () => ({ room: '', student: '', client: '', phone: '', method: '', store: '', date: '', payment: '', lines: [] });
export function WriterRoutes({ active = true }) {
  const handoff = usePlannerHandoff();
  const { template, setTemplate, restoring, storageWarning, setStorageWarning } = useWeeklyTemplate();
  const [order, setOrder] = useState(emptyOrder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [today, setToday] = useState(saoPauloDay);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const exportFlow = useWriterExport({ template, order, handoff, setBusy, setSuccess });
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
  useForegroundInterval(() => setToday(saoPauloDay()), 30_000, active);
  async function upload(file) {
    setBusy(true);
    setError('');
    setSuccess('');
    exportFlow.clear();
    try {
      const nextTemplate = await importTemplate(file);
      setTemplate(nextTemplate);
      setOrder(emptyOrder());
      exportFlow.reset();
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
      exportFlow.reset();
      handoff.reset();
      setStep(0);
      setSuccess('');
      exportFlow.clear();
      setStorageWarning('');
    } catch {
      setError('Não foi possível remover o arquivo salvo. Tente novamente; seu pedido foi preservado.');
    } finally {
      setBusy(false);
    }
  }
  function change(fields) {
    handoff.changed();
    if (
      (Object.hasOwn(fields, 'client') && fields.client !== order.client) ||
      (Object.hasOwn(fields, 'room') && fields.room !== order.room)
    ) {
      handoff.reset();
      exportFlow.reset();
    }
    setSuccess('');
    exportFlow.clear();
    setOrder((current) => ({ ...current, ...fields }));
  }
  function add(name) {
    handoff.changed();
    exportFlow.clear();
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
  const errors = useMemo(() => (template ? validateOrder(template, order, today) : []), [template, order, today]);
  const expired = template && today > template.period.end;
  const stageErrors = useMemo(
    () =>
      template
        ? [validateCustomer(template, order, today), validateProducts(template, order), validateDelivery(template, order, today)]
        : [],
    [template, order, today]
  );
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
        product="writer"
        title="Do atendimento ao pedido."
        description="Cliente, produtos, entrega e conferência. Um passo de cada vez, com as fórmulas do Excel preservadas."
      />
      {restoring ? (
        <Spinner label="Restaurando Excel da sessão" />
      ) : (
        <WeeklyUpload template={template} busy={busy} error={error} onUpload={upload} onRemove={removeTemplate} />
      )}
      <WriterConnections
        handoff={handoff}
        template={template}
        busy={busy || restoring}
        expired={expired || (template && today < template.period.start)}
        onApply={(client) => handoff.apply(client, order, change, setStep)}
        onAdd={add}
        onAddRecipe={(lines) => change({ lines: mergeOrderLines(order.lines, lines) })}
      />
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
              download={exportFlow.download}
              success={success}
              navigate={navigate}
            />
          </div>
          {exportFlow.error && (
            <Alert tone="danger" title="Não foi possível gerar o pedido">
              {exportFlow.error} Seu pedido continua nesta sessão. Tente baixar novamente.
            </Alert>
          )}
          {step === 3 && (
            <SaleRegistrationAction
              draft={exportFlow.draft}
              onNew={() => {
                setOrder({ ...emptyOrder(), room: order.room, student: order.student });
                exportFlow.reset();
                handoff.reset();
                setSuccess('');
                setStep(0);
              }}
            />
          )}
          <CheckoutActions step={step} errors={step < 3 ? stageErrors[step] : []} busy={busy} onNavigate={navigate} />
        </>
      )}
    </section>
  );
}

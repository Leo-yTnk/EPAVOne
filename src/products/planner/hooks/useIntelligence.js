import { createContext } from 'preact';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { commercialCatalog } from '../../../shared/services/commercialCatalog.js';
import { catalogIndex, matchCustomersInChunks } from '../../../shared/intelligence/catalog.js';
import { rankCustomers } from '../../../shared/intelligence/priority.js';
import { useWeeklyOrder } from '../../../shared/services/useWeeklyOrder.js';
import { today } from '../models/planner.js';
import { useForegroundInterval } from '../../../design-system/behaviors/useForegroundInterval.js';
const EMPTY_MATCHES = new Map();
export const IntelligenceContext = createContext(null);
export const useIntelligence = () => useContext(IntelligenceContext);
export function useIntelligenceModel(state, week, loader = commercialCatalog.intelligence) {
  const { template } = useWeeklyOrder();
  const [now, setNow] = useState(today);
  const [catalog, setCatalog] = useState({ data: null, loading: true, error: '', stale: false });
  const [attempt, setAttempt] = useState(0);
  useForegroundInterval(() => {
    setNow(today());
    setAttempt((value) => value + 1);
  }, 60_000);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      Promise.resolve()
        .then(loader)
        .then(
          (data) => active && setCatalog({ data, loading: false, error: '', stale: false }),
          () =>
            active &&
            setCatalog((previous) => ({
              ...previous,
              loading: false,
              stale: Boolean(previous.data),
              error: 'Catálogo indisponível. As prioridades continuam usando seus contatos e combinados.'
            }))
        );
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [attempt, loader]);
  const index = useMemo(
    () => catalogIndex(catalog.stale ? {} : catalog.data || {}, template, now),
    [catalog.data, catalog.stale, template, now]
  );
  const [analysis, setAnalysis] = useState(null);
  const customers = state?.customers;
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      matchCustomersInChunks(customers || [], index, { cancelled: () => !active }).then((matches) => {
        if (active && matches) setAnalysis({ customers, index, matches });
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customers, index]);
  const analyzing = analysis?.customers !== customers || analysis?.index !== index;
  const matches = !analyzing ? analysis.matches : EMPTY_MATCHES;
  const ranked = useMemo(() => (state ? rankCustomers(state, week, now, matches) : []), [state, week, now, matches]);
  return useMemo(
    () => ({
      analyzing,
      ranked,
      byId: new Map(ranked.map((r) => [r.customerId, r])),
      matches,
      index,
      catalog,
      now,
      retry: () => setAttempt((value) => value + 1)
    }),
    [ranked, matches, index, catalog, now, analyzing]
  );
}

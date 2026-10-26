import { useEffect, useState } from 'preact/hooks';
import { weeklyOrder } from './weeklyOrder.js';
export function useWeeklyOrder() {
  const [value, setValue] = useState(weeklyOrder.get);
  useEffect(() => {
    setValue(weeklyOrder.get());
    return weeklyOrder.subscribe(setValue);
  }, []);
  return value;
}

import { useState } from 'preact/hooks';

let nextId = 0;
// This application renders in the browser. A module-wide sequence keeps label
// and portal IDs distinct even when keyed steps are replaced independently.
export function useControlId() {
  const [id] = useState(() => `epav-control-${++nextId}`);
  return id;
}

const memory = new Map();
export const viewRepository = {
  read(key, defaults) {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem('epavone-planner-view-' + key) || 'null');
    } catch {
      saved = memory.get(key);
    }
    return Object.fromEntries(
      Object.entries(defaults).map(([field, fallback]) => [
        field,
        typeof saved?.[field] === typeof fallback && (typeof fallback !== 'number' || (Number.isInteger(saved[field]) && saved[field] > 0))
          ? saved[field]
          : fallback
      ])
    );
  },
  save(key, value) {
    memory.set(key, value);
    try {
      sessionStorage.setItem('epavone-planner-view-' + key, JSON.stringify(value));
    } catch {
      /* Preserve view in memory during this session. */
    }
  }
};

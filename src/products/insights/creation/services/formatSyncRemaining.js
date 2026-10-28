export function formatSyncRemaining(remainingMs, waiting = false) {
  if (waiting) return 'Tempo restante: aguardando confirmação do serviço…';
  if (!Number.isFinite(remainingMs)) return 'Tempo restante: calculando após o primeiro lote…';
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
  if (seconds < 60) return `Tempo restante estimado: ${seconds} s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `Tempo restante estimado: ${minutes} min`;
  return `Tempo restante estimado: ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

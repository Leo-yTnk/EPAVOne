import { matchText, nearWord } from './matchText.js';
const words = (value) =>
  matchText(value)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !['de', 'da', 'do', 'das', 'dos', 'e'].includes(t));
export function matchClients(name, clients) {
  const normalized = matchText(name);
  const exact = normalized ? clients.filter((item) => matchText(item.name) === normalized) : [];
  if (exact.length)
    return { exact: true, candidates: exact, explanation: 'Mesmo nome completo. Confira a sala; homônimos continuam separados.' };
  const source = words(name);
  if (source.length < 2 || source[0].length < 2)
    return { exact: false, candidates: [], explanation: 'Informe nome e sobrenome para buscar sugestões.' };
  const candidates = clients
    .map((item) => {
      const target = words(item.name);
      if (!target.length || !nearWord(source[0], target[0])) return null;
      // Match in order, consuming each target word once. Initials only in middle names.
      let index = 0,
        edits = 0,
        full = 0;
      for (let i = 0; i < source.length; i++) {
        const token = source[i];
        const found = target.findIndex(
          (value, j) =>
            j >= index &&
            (token === value || (i > 0 && i < source.length - 1 && token.length === 1 && value.startsWith(token)) || nearWord(token, value))
        );
        if (found < 0) return null;
        if (token.length > 1) full++;
        if (token !== target[found] && token.length > 1) edits++;
        index = found + 1;
      }
      return full >= 2 && edits <= 1 ? { item, edits, extra: target.length - source.length } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.edits - b.edits || a.extra - b.extra);
  return {
    exact: false,
    candidates: candidates.map((row) => row.item),
    explanation: candidates.length
      ? 'Sugestões por sobrenomes, iniciais ou pequena variação de escrita. Confirme a identidade e a sala.'
      : 'Nenhum nome suficientemente próximo. Selecione manualmente o cadastro correto.'
  };
}

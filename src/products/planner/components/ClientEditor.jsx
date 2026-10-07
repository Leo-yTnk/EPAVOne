import { useState } from 'preact/hooks';
import { Alert, Button, Checkbox, Dialog, Input, Select, Textarea } from '../../../design-system/components/index.js';
import { INTERESTS, SEGMENTS } from '../models/planner.js';
export function ClientEditor({ customer, onClose, act, busy, notice }) {
  const [draft, setDraft] = useState(
    customer || {
      id: '',
      name: '',
      segment: 'Famílias',
      position: '',
      tags: [],
      preferences: [],
      restrictions: [],
      intent: false,
      frequencyDays: 14,
      context: '',
      notes: '',
      preparation: ''
    }
  );
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const change = (fields) => setDraft((current) => ({ ...current, ...fields }));
  function toggle(key, value) {
    change({ [key]: draft[key].includes(value) ? draft[key].filter((item) => item !== value) : [...draft[key], value] });
  }
  async function save(event) {
    event.preventDefault();
    setAttempted(true);
    if (draft.preferences.some((value) => draft.restrictions.includes(value))) {
      setError('Remova a categoria das preferências antes de marcá-la como restrição.');
      return;
    }
    if (await act({ type: 'customer', customer: draft }, 'Perfil salvo.')) onClose();
  }
  return (
    <Dialog open title={customer ? 'Editar perfil' : 'Novo cliente'} onClose={onClose} size="lg">
      <form className="planner-form" onSubmit={save}>
        {attempted && notice && (
          <Alert tone="danger" title="Não foi possível salvar">
            {notice}
          </Alert>
        )}
        {error && (
          <Alert tone="danger" title="Revise o perfil">
            {error}
          </Alert>
        )}
        <Input
          id="planner-name"
          label="Nome"
          value={draft.name}
          required
          maxLength={160}
          onInput={(event) => change({ name: event.currentTarget.value })}
        />
        <div className="planner-two-columns">
          <Select
            label="Segmento"
            value={draft.segment}
            options={SEGMENTS.map((value) => ({ value, label: value }))}
            onChange={(segment) => change({ segment })}
          />
          <Input
            id="planner-position"
            label="Posição física"
            value={draft.position}
            maxLength={160}
            placeholder="Mesa, cadeira ou referência"
            onInput={(event) => change({ position: event.currentTarget.value })}
          />
        </div>
        <div className="planner-two-columns">
          <Input
            id="planner-frequency"
            label="Frequência de contato (dias)"
            type="number"
            min="1"
            max="365"
            value={draft.frequencyDays}
            onInput={(event) => change({ frequencyDays: Number(event.currentTarget.value) })}
          />
          <Input
            id="planner-tags"
            label="Tags (separadas por vírgulas)"
            value={draft.tags.join(', ')}
            maxLength={300}
            onChange={(event) =>
              change({
                tags: event.currentTarget.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
              })
            }
          />
        </div>
        <Checkbox checked={draft.intent} onChange={(event) => change({ intent: event.currentTarget.checked })}>
          Registrou intenção de compra
        </Checkbox>
        <fieldset>
          <legend>Preferências comerciais</legend>
          <div className="planner-checks">
            {INTERESTS.map((value) => (
              <Checkbox key={value} checked={draft.preferences.includes(value)} onChange={() => toggle('preferences', value)}>
                {value}
              </Checkbox>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Restrições comerciais · excluir das sugestões</legend>
          <div className="planner-checks">
            {INTERESTS.map((value) => (
              <Checkbox key={value} checked={draft.restrictions.includes(value)} onChange={() => toggle('restrictions', value)}>
                {value}
              </Checkbox>
            ))}
          </div>
        </fieldset>
        <Textarea
          id="planner-context"
          label="Contexto do cliente"
          value={draft.context}
          maxLength={4000}
          onInput={(event) => change({ context: event.currentTarget.value })}
        />
        <Textarea
          id="planner-notes"
          label="Observações"
          value={draft.notes}
          maxLength={4000}
          onInput={(event) => change({ notes: event.currentTarget.value })}
        />
        <Textarea
          id="planner-preparation-edit"
          label="Abordagem preparada"
          value={draft.preparation}
          maxLength={4000}
          onInput={(event) => change({ preparation: event.currentTarget.value })}
        />
        <div className="ds-inline">
          <Button type="submit" loading={busy}>
            Salvar perfil
          </Button>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

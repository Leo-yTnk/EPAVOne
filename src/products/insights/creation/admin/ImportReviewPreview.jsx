import { Badge, Card, Link, Tabs, SectionHeader } from '../../../../design-system/components/index.js';
import { CreationThumbnail } from '../components/CreationThumbnail.jsx';
import { ImportDuplicateChoice } from './ImportDuplicateChoice.jsx';
import { importGroups } from './importReview.js';
export function ImportReviewPreview({ payload, review, group, setGroup, choices, onChoice, busy }) {
  const replacementCount = Object.values(choices).filter((value) => value === 'imported').length;
  return (
    <Card className="creation-fields creation-editor-section">
      <SectionHeader
        as="h3"
        size="sm"
        title={<>Prévia por entidade</>}
        description={<>Confira os dados e os vínculos antes de confirmar.</>}
      />
      <div className="creation-toolbar" role="status">
        <Badge>{review.totals.new} novos</Badge>
        <Badge>{review.totals.ignored + (payload.skipped || 0) - replacementCount} mantidos</Badge>
        <Badge>{replacementCount} substituições escolhidas</Badge>
        <Badge>{review.totals.conflict} conflitos</Badge>
      </div>
      <Tabs
        label="Entidades da planilha"
        value={group}
        onChange={setGroup}
        items={importGroups.map(([value, label]) => ({ value, label: `${label} (${payload[value].length})` }))}
      />
      {review.groups[group].length ? (
        <ul className="creation-import-preview">
          {review.groups[group].map(({ row, status, differences, existing }, i) => (
            <li key={i} className="creation-import-row">
              {['products', 'recipes'].includes(group) && <CreationThumbnail item={row} type={group} />}
              <div>
                <strong>{row.name || row.product || row.recipe}</strong>
                <Badge>{status === 'new' ? 'Novo' : status === 'ignored' ? 'Ignorado' : 'Conflito'}</Badge>
              </div>
              <p>
                {row.category || row.type || row.section || row.page}
                {row.unit ? ` · ${row.unit}` : ''}
                {row.sort_order !== undefined ? ` · ordem ${row.sort_order}` : ''} · linha {row.source_line || '?'}
              </p>
              {row.ingredients && <p>{row.ingredients.map((item) => `${item.product}: ${item.quantity}`).join('; ')}</p>}
              {row.instructions && (
                <ol>
                  {row.instructions.map((step, n) => (
                    <li key={n}>{step}</li>
                  ))}
                </ol>
              )}
              {/^https:\/\/(www\.)?swift\.com\.br\//i.test(row.swift_product_url || '') && (
                <Link href={row.swift_product_url} target="_blank" rel="noopener noreferrer">
                  Página Swift
                </Link>
              )}
              {/^https?:\/\//i.test(row.image_url || '') && (
                <Link href={row.image_url} target="_blank" rel="noopener noreferrer">
                  Ver imagem
                </Link>
              )}
              {existing?.active === false && group !== 'sections' && <p>O registro existente está inativo e continuará assim.</p>}
              {status === 'ignored' && existing?.id && ['products', 'recipes', 'categories', 'sections'].includes(group) && (
                <ImportDuplicateChoice
                  entity={group}
                  row={row}
                  existing={existing}
                  value={choices[`${group}:${i}`] || 'original'}
                  disabled={busy}
                  onChange={(value) => onChoice(`${group}:${i}`, value)}
                />
              )}
              {differences.length > 0 && (
                <p>
                  Há diferenças em{' '}
                  {differences
                    .map((field) => ({ name: 'nome', image_url: 'imagem', unit: 'unidade', swift_product_url: 'página Swift' })[field])
                    .join(', ')}
                  .{' '}
                  {choices[`${group}:${i}`] === 'imported'
                    ? 'Os campos de conteúdo serão atualizados conforme sua escolha.'
                    : 'O conteúdo existente será mantido.'}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma linha nesta aba. Nenhum registro será removido.</p>
      )}
    </Card>
  );
}

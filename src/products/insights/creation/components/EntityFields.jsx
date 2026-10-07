import { Card, Checkbox, Input, Select, Textarea } from '../../../../design-system/components/index.js';
import { categoryTypes } from '../models/editor.js';
import { IngredientsEditor } from './IngredientsEditor.jsx';
export function EntityFields({ type, scope, item, values, vocabulary, change, disabled }) {
  const input = (name) => (e) => change({ [name]: e.currentTarget.value });
  const categoryType = type === 'products' ? 'proteina' : 'receita';
  const categoryOptions = vocabulary.categories
    .filter((c) => c.type === categoryType && (c.active || c.id === values.categoryId))
    .map((c) => ({ value: c.id, label: c.name }));
  const sections =
    scope === 'site'
      ? (vocabulary.structure?.sections || [])
          .filter((section) => {
            const page = vocabulary.structure.pages.find((p) => p.id === section.page_id);
            return (
              (type === 'products' ? page?.key === 'products' : ['home', 'recipes'].includes(page?.key)) &&
              (section.active || values.sections.includes(section.id))
            );
          })
          .map((section) => ({
            ...section,
            name: `${vocabulary.structure.pages.find((p) => p.id === section.page_id)?.name} · ${section.name}`
          }))
      : vocabulary.categories.filter(
          (c) =>
            (type === 'products' ? c.type === 'secao_produto' : ['secao', 'secao_home', 'secao_receita'].includes(c.type)) &&
            (c.active || values.sections.includes(c.id))
        );
  return (
    <>
      <Card
        as="section"
        role="group"
        aria-label="Identificação"
        className="creation-fields creation-editor-section creation-identification"
      >
        <div className="creation-section-heading">
          <h3 className="creation-section-title">Identificação</h3>
          <p>Dê um nome ao conteúdo e organize sua apresentação na biblioteca.</p>
        </div>
        <Input label="Nome" maxLength={120} required value={values.name} onInput={input('name')} disabled={disabled} />
        {type === 'categories' ? (
          <Select
            label="Tipo de categoria"
            value={values.type}
            options={scope === 'site' ? categoryTypes.filter((x) => ['receita', 'proteina'].includes(x.value)) : categoryTypes}
            onChange={(type) => change({ type })}
            disabled={disabled || Boolean(item?.id)}
          />
        ) : (
          <>
            <Select
              label="Categoria"
              value={values.categoryId}
              options={[{ value: '', label: 'Escolha uma categoria' }, ...categoryOptions]}
              onChange={(categoryId) => change({ categoryId })}
              searchable
              disabled={disabled}
            />
            <Input
              label="URL da imagem"
              type="url"
              maxLength={2048}
              value={values.imageUrl}
              onInput={input('imageUrl')}
              disabled={disabled}
            />
          </>
        )}
      </Card>
      {type === 'products' && (
        <Card as="section" role="group" aria-label="Preço e unidade" className="creation-fields creation-editor-section">
          <div className="creation-section-heading">
            <h3 className="creation-section-title">Preço e unidade</h3>
            <p>Informe o valor e a unidade usados para apresentar o produto.</p>
          </div>
          <div className="creation-columns">
            <Input
              label="Preço (R$)"
              type="number"
              min="0"
              step="0.01"
              required
              value={values.price}
              onInput={input('price')}
              disabled={disabled || (scope === 'site' && item?.price_source === 'SWIFT')}
              helper={scope === 'site' && item?.price_source === 'SWIFT' ? 'Preço mantido pelo sincronizador Swift.' : undefined}
            />
            <Select
              label="Unidade"
              value={values.unit}
              options={['kg', 'un', 'pacote', 'caixa', 'pote'].map((value) => ({ value, label: value }))}
              onChange={(unit) => change({ unit })}
              disabled={disabled}
            />
            {scope === 'site' && (
              <Input
                label="Página do produto na Swift"
                type="url"
                value={values.swiftUrl}
                onInput={input('swiftUrl')}
                disabled={disabled}
              />
            )}
          </div>
        </Card>
      )}
      {type === 'recipes' && (
        <>
          <Card as="section" role="group" aria-label="Preparo e rendimento" className="creation-fields creation-editor-section">
            <div className="creation-section-heading">
              <h3 className="creation-section-title">Preparo e rendimento</h3>
              <p>Defina o tempo, as porções e a dificuldade da receita.</p>
            </div>
            <div className="creation-columns creation-recipe-facts">
              <Input
                label="Preparo (minutos)"
                type="number"
                min="0"
                required
                value={values.prepTime}
                onInput={input('prepTime')}
                disabled={disabled}
              />
              <Input
                label="Porções"
                type="number"
                min="1"
                required
                value={values.servings}
                onInput={input('servings')}
                disabled={disabled}
              />
              <Select
                label="Dificuldade"
                value={values.difficulty}
                options={['Fácil', 'Médio', 'Difícil'].map((value) => ({ value, label: value }))}
                onChange={(difficulty) => change({ difficulty })}
                disabled={disabled}
              />
            </div>
          </Card>
          <Card as="section" role="group" aria-label="Ingredientes" className="creation-fields creation-editor-section">
            <div className="creation-section-heading">
              <h3 className="creation-section-title">Ingredientes</h3>
              <p>Escolha os produtos e a quantidade necessária de cada um.</p>
            </div>
            <IngredientsEditor
              values={values.ingredients}
              products={vocabulary.products}
              onChange={(ingredients) => change({ ingredients })}
              disabled={disabled}
            />
          </Card>
          <Card as="section" role="group" aria-label="Etapas e dicas" className="creation-fields creation-editor-section">
            <div className="creation-section-heading">
              <h3 className="creation-section-title">Etapas e dicas</h3>
              <p>Descreva o preparo em ordem e acrescente orientações úteis.</p>
            </div>
            <Textarea
              label="Modo de preparo — uma etapa por linha"
              value={values.instructions}
              rows={5}
              onInput={input('instructions')}
              disabled={disabled}
            />
            <Textarea
              label="Ingredientes extras — um por linha"
              value={values.extras}
              rows={3}
              onInput={input('extras')}
              disabled={disabled}
            />
            <Textarea label="Dicas — uma por linha" value={values.tips} rows={3} onInput={input('tips')} disabled={disabled} />
          </Card>
          {scope === 'site' && (
            <Card as="section" role="group" aria-label="Publicação" className="creation-fields creation-editor-section">
              <div className="creation-section-heading">
                <h3 className="creation-section-title">Publicação</h3>
                <p>Escolha como a receita aparece no catálogo público.</p>
              </div>
              <Select
                label="Publicação"
                value={values.status}
                options={[
                  { value: 'draft', label: 'Rascunho' },
                  { value: 'published', label: 'Publicada' },
                  { value: 'archived', label: 'Arquivada' }
                ]}
                onChange={(status) => change({ status })}
                disabled={disabled}
              />
              <Checkbox checked={values.featured} onChange={(e) => change({ featured: e.currentTarget.checked })} disabled={disabled}>
                Destacar receita
              </Checkbox>
            </Card>
          )}
        </>
      )}
      {type !== 'categories' && sections.length > 0 && (
        <Card as="section" role="group" aria-label="Seções" className="creation-fields">
          <div className="creation-section-heading">
            <h3 className="creation-section-title">Seções</h3>
            <p>Escolha em quais seções este conteúdo deve aparecer.</p>
          </div>
          {sections.map((section) => (
            <Checkbox
              key={section.id}
              checked={values.sections.includes(section.id)}
              onChange={(e) =>
                change({
                  sections: e.currentTarget.checked ? [...values.sections, section.id] : values.sections.filter((id) => id !== section.id)
                })
              }
              disabled={disabled}
            >
              {section.name}
            </Checkbox>
          ))}
        </Card>
      )}
      {type !== 'recipes' && scope === 'site' && (
        <Checkbox checked={values.active} onChange={(e) => change({ active: e.currentTarget.checked })} disabled={disabled}>
          Ativo no catálogo
        </Checkbox>
      )}
    </>
  );
}

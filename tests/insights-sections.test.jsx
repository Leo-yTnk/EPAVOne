import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { catalogGroups, orderedCatalogItems } from '../src/products/insights/models/sections.js';
import { CatalogSections } from '../src/products/insights/components/CatalogSections.jsx';
const items = [
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' }
];
const structure = {
  pages: [{ id: 'p', key: 'recipes', active: true }],
  sections: [
    { id: 'late', page_id: 'p', name: 'Depois', sort_order: 2 },
    { id: 'first', page_id: 'p', name: 'Primeiro', sort_order: 1 },
    { id: 'hidden', page_id: 'p', name: 'Oculta', active: false }
  ],
  recipes: [
    { section_id: 'first', recipe_id: 'b', sort_order: 1 },
    { section_id: 'first', recipe_id: 'a', sort_order: 2 },
    { section_id: 'late', recipe_id: 'a', sort_order: 1 },
    { section_id: 'late', recipe_id: 'private', sort_order: 2 }
  ]
};
describe('Yourcipe public section organization', () => {
  it('preserves order and multiple memberships, excludes invisible records and keeps unassigned records', () => {
    const groups = catalogGroups(items, structure, 'recipes', 'recipes');
    expect(groups.map((group) => group.name)).toEqual(['Primeiro', 'Depois', 'Mais opções para explorar']);
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([['b', 'a'], ['a'], ['c']]);
    expect(orderedCatalogItems(items, structure, 'recipes', 'recipes').map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });
  it('retains the complete catalog without configured sections and after filtering', () => {
    expect(catalogGroups(items, null, 'recipes', 'recipes')[0].items).toEqual(items);
    expect(catalogGroups([items[2]], structure, 'recipes', 'recipes')[0].items).toEqual([items[2]]);
  });
  it('navigates to a section without replacing the application hash route', () => {
    const scroll = vi.fn();
    render(
      <CatalogSections
        groups={catalogGroups(items, structure, 'recipes', 'recipes')}
        renderItem={(item) => <p key={item.id}>{item.name}</p>}
      />
    );
    document.getElementById('section-first').scrollIntoView = scroll;
    const before = window.location.hash;
    fireEvent.click(screen.getByRole('link', { name: '01 Primeiro' }));
    expect(scroll).toHaveBeenCalled();
    expect(window.location.hash).toBe(before);
  });
});

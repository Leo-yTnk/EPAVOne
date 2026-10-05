// Preserve configured order and memberships; never hide unassigned public records.
export function catalogGroups(items, structure, pageKey, kind) {
  const page = structure?.pages?.find((item) => item.key === pageKey && item.active !== false);
  const sections = (structure?.sections || [])
    .filter((item) => item.page_id === page?.id && item.active !== false)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const byId = new Map(items.map((item) => [item.id, item]));
  const assigned = new Set();
  const groups = sections
    .map((section) => {
      const members = (structure[kind] || [])
        .filter((link) => link.section_id === section.id)
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            a[`${kind === 'recipes' ? 'recipe' : 'product'}_id`].localeCompare(b[`${kind === 'recipes' ? 'recipe' : 'product'}_id`])
        )
        .map((link) => byId.get(link[`${kind === 'recipes' ? 'recipe' : 'product'}_id`]))
        .filter(Boolean);
      members.forEach((item) => assigned.add(item.id));
      return { id: section.id, name: section.name, items: members };
    })
    .filter((group) => group.items.length);
  const remaining = items.filter((item) => !assigned.has(item.id));
  if (remaining.length)
    groups.push({
      id: 'other',
      name: groups.length ? 'Mais opções para explorar' : kind === 'recipes' ? 'Todas as receitas' : 'Todos os produtos',
      items: remaining
    });
  return groups;
}

export function orderedCatalogItems(items, structure, pageKey, kind) {
  return [
    ...new Map(
      catalogGroups(items, structure, pageKey, kind)
        .flatMap((group) => group.items)
        .map((item) => [item.id, item])
    ).values()
  ];
}

export const backupTables = [
  'categories',
  'products',
  'recipes',
  'recipe_ingredients',
  'recipe_categories',
  'product_categories',
  'catalog_pages',
  'catalog_sections',
  'catalog_section_recipes',
  'catalog_section_products'
];
export function validateCatalogBackup(backup) {
  if (
    backup?.format !== 'epavone-catalog' ||
    backup.version !== 1 ||
    !backup.data ||
    backupTables.some(
      (table) =>
        !Array.isArray(backup.data[table]) || backup.data[table].some((row) => !row || typeof row !== 'object' || Array.isArray(row))
    )
  ) {
    throw new Error('Arquivo incompatível. Selecione um backup JSON do catálogo EPAVOne, versão 1.');
  }
  const total = backupTables.reduce((sum, key) => sum + backup.data[key].length, 0);
  if (total > 100000) throw new Error('O backup excede 100.000 registros.');
  return backup;
}
export async function readCatalogBackup(file) {
  if (!/\.json$/i.test(file.name) || file.size > 50 * 1024 * 1024) throw new Error('Selecione um backup .json de até 50 MB.');
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    throw new Error('O arquivo não contém um JSON válido.');
  }
  return validateCatalogBackup(backup);
}
export function downloadCatalogBackup(backup) {
  validateCatalogBackup(backup);
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `epavone-catalogo-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

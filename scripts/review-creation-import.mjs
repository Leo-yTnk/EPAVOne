import fs from 'node:fs';
import { createSwiftWorkbookFixture } from '../tests/fixtures/swiftWorkbook.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(
  `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd() + '/node_modules'}/playwright/package.json`
);
const { chromium } = require('playwright');
const output = 'docs/creation-import-review';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5176'], {
  stdio: ['ignore', 'pipe', 'pipe']
});
let browser;
const results = [];
try {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve();
    });
    server.on('error', reject);
  });
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    headless: true,
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--disable-gpu', '--use-gl=disabled', '--disable-software-rasterizer']
  });
  for (const width of [1440, 390, 320])
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 950 }, colorScheme: theme });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/supabase.co/**', (route) => route.abort());
      await page.addInitScript((value) => localStorage.setItem('epavone-theme', value), theme);
      await page.goto('http://127.0.0.1:5176/EPAVOne/');
      await page.evaluate(async () => {
        const mainSource = await (await fetch('/EPAVOne/src/main.jsx')).text();
        const { render } = await import(mainSource.match(/from ["']([^"']*\/preact\.js[^"']*)/)[1]);
        const runtime = await import(mainSource.match(/from ["']([^"']*preact_jsx-dev-runtime.js[^"']*)/)[1]);
        window.reviewMount = async (name, props) => {
          const files = {
            CreationPage: 'CreationPage.jsx',
            EntityEditor: 'components/EntityEditor.jsx',
            SwiftMetadataReview: 'admin/SwiftMetadataReview.jsx'
          };
          const module = await import(`/EPAVOne/src/products/insights/creation/${files[name]}`);
          const h = (type, props, ...children) =>
            runtime.jsxDEV(
              type,
              { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
              undefined,
              children.length > 1,
              undefined,
              undefined
            );
          render(h('main', { className: 'product-page' }, h(module[name], props)), document.getElementById('app'));
        };
        const { adminService } = await import('/EPAVOne/src/products/insights/creation/services/adminService.js');
        const { creationService } = await import('/EPAVOne/src/products/insights/creation/services/creationService.js');
        adminService.context = async () => ({ categories: [], products: [], recipes: [], structure: { pages: [], sections: [] } });
        adminService.importCatalog = async (modes, payload) => {
          window.reviewImport = { modes, count: payload.products.length };
          return { products: { added: payload.products.length } };
        };
        creationService.load = async () => [];
        document.documentElement.dataset.product = 'insights';
        await window.reviewMount('CreationPage', {
          route: { segments: ['criacao', 'admin'] },
          account: { session: { user: { id: 'visual-fixture' } }, profile: { role: 'admin' } }
        });
      });
      await page.getByRole('button', { name: 'Importar Excel do catálogo' }).click();
      await page
        .locator('input[type=file]')
        .setInputFiles({
          name: 'Swift-public-fixture.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: Buffer.from(await createSwiftWorkbookFixture())
        });
      await page.getByRole('tab', { name: 'Produtos (11)' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Confirmar importação' }).isDisabled(), true);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${output}/import-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('tab', { name: 'Categorias (4)' }).click();
      await page.getByRole('tab', { name: 'Receitas (0)' }).click();
      await page.getByText('Nenhuma linha nesta aba. Nenhum registro será removido.').waitFor();
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: 'Confirmar importação' }).click();
      await page.getByText('Importação concluída: 11 adicionado(s), 0 ignorado(s). Nenhum registro existente foi alterado.').waitFor();
      assert.equal((await page.evaluate(() => window.reviewImport)).count, 11);
      results.push({
        view: 'six-sheet upload and confirmation fixture',
        width,
        theme,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        errors: [...errors]
      });
      await page.evaluate(async () => {
        const { creationService } = await import('/EPAVOne/src/products/insights/creation/services/creationService.js');
        creationService.vocabulary = async () => ({
          categories: [{ id: 'c', type: 'receita', name: 'Família', active: true }],
          products: [{ id: 'p', name: 'Filé de frango Swift', unit: 'pacote' }],
          structure: { pages: [], sections: [] }
        });
        await window.reviewMount('EntityEditor', { type: 'recipes', scope: 'personal', onClose: () => {}, onSaved: () => {} });
      });
      await page.getByLabel('Nome', { exact: true }).fill('Frango para um almoço em família');
      await page
        .getByLabel('Modo de preparo — uma etapa por linha')
        .fill('Separe os ingredientes.\nAsse até cozinhar.\nSirva com os acompanhamentos.');
      await page.getByRole('button', { name: 'Conferir prévia' }).click();
      await page.getByRole('region', { name: 'Prévia do conteúdo' }).waitFor();
      await page.getByRole('region', { name: 'Prévia do conteúdo' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/editor-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.getByText('As alterações deste formulário ainda não foram salvas.').waitFor();
      results.push({
        view: 'editor preview and unsaved guard fixture',
        width,
        theme,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        errors: [...errors]
      });
      await page.evaluate(async () => {
        const { adminService } = await import('/EPAVOne/src/products/insights/creation/services/adminService.js');
        adminService.observations = async () => [
          {
            product_id: 'p',
            product: { id: 'p', name: 'Filé de frango', image_url: 'https://example.com/editorial.jpg', version: 1 },
            observed_name: 'Filé de frango Swift 1kg',
            image_url: 'https://swiftbr.vteximg.com.br/arquivos/verified.jpg',
            canonical_url: 'https://www.swift.com.br/detail/file-de-frango',
            checked_at: '2026-10-07T12:00:00Z',
            reference_zip_code: '04534011',
            region_confirmed: false,
            presentation: '1kg',
            availability: 'available'
          }
        ];
        adminService.acceptMetadata = async (item, selected) => {
          window.reviewMetadata = selected;
        };
        await window.reviewMount('SwiftMetadataReview', {});
      });
      await page.getByText('Filé de frango', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Salvar alterações selecionadas' }).count(), 0);
      await page.screenshot({ path: `${output}/swift-review-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('checkbox', { name: 'Usar a imagem oficial consultada' }).check();
      await page.getByRole('button', { name: 'Salvar alterações selecionadas' }).click();
      await page.getByText('Alterações revisadas e salvas.').waitFor();
      assert.deepEqual(await page.evaluate(() => window.reviewMetadata), { image: true });
      results.push({
        view: 'Swift selective editorial review fixture',
        width,
        theme,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        errors: [...errors]
      });
      // Keep contexts alive until shutdown for single-process Chromium.
    }
  const live = await browser.newPage();
  try {
    await live.goto('https://leo-ytnk.github.io/EPAVOne/#/insights', { timeout: 20000 });
    await live.screenshot({ path: `${output}/published-before.png`, fullPage: true });
    results.push({ view: 'published before changes', title: await live.title() });
  } catch (error) {
    results.push({ view: 'published before changes', blocked: error.message.split('\n')[0] });
  }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  assert.ok(results.filter((row) => row.width).every((row) => !row.overflow && !row.errors.length));
  console.warn(JSON.stringify(results));
} finally {
  await browser?.close();
  server.kill();
}

import fs from 'node:fs';
import { swiftOfficialProducts } from '../src/products/insights/creation/admin/swiftOfficialProducts.js';
import { createSwiftWorkbookFixture } from '../tests/fixtures/swiftWorkbook.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(
  `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd() + '/node_modules'}/playwright/package.json`
);
const { chromium } = require('playwright');
const output = process.env.REVIEW_OUTPUT || 'docs/creation-import-review';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5176', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe']
});
let browser;
const results = [];
try {
  // CI can suppress Vite's startup banner. Check the server instead of log wording.
  let serverError;
  let serverOutput = '';
  server.on('error', (error) => {
    serverError = error;
  });
  server.on('exit', (code) => {
    serverError = new Error(`Vite exited: ${code}`);
  });
  server.stderr.on('data', (data) => {
    serverOutput += data.toString();
  });
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  const deadline = Date.now() + 30000;
  while (true) {
    if (serverError) throw serverError;
    try {
      const response = await fetch('http://127.0.0.1:5176/EPAVOne/', { signal: AbortSignal.timeout(1000) });
      if (response.ok) break;
    } catch {
      /* The server may still be starting. */
    }
    if (Date.now() >= deadline) throw new Error(`Vite startup timed out: ${serverOutput}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    headless: true,
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=disabled', '--disable-software-rasterizer']
  });
  const page = await browser.newPage();
  for (const width of [1440, 390, 320])
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 950 });
      await page.emulateMedia({ colorScheme: theme });
      await page.unrouteAll();
      page.removeAllListeners('pageerror');
      console.warn(`Inspecting ${width}px / ${theme}`);

      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**.supabase.co/**', (route) => route.abort());
      if (process.env.REVIEW_OFFLINE === '1') {
        await page.route('**/*', (route) => (new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()));
      }
      if (process.env.REVIEW_IMAGE_DIR) {
        for (const [index, product] of swiftOfficialProducts.entries()) {
          const path = `${process.env.REVIEW_IMAGE_DIR}/${index}.jpg`;
          if (fs.existsSync(path)) await page.route(product.imagem, (route) => route.fulfill({ path, contentType: 'image/jpeg' }));
        }
      }
      await page.addInitScript((value) => localStorage.setItem('epavone-theme', value), theme);
      await page.goto('http://127.0.0.1:5176/EPAVOne/', { waitUntil: 'domcontentloaded' });
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
          render(
            h(
              'div',
              { className: 'app-shell navigation-horizontal' },
              h('main', { className: 'app-main product-page' }, h(module[name], props))
            ),
            document.getElementById('app')
          );
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
      await page.locator('input[type=file]').setInputFiles({
        name: 'Swift-public-fixture.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from(await createSwiftWorkbookFixture())
      });
      await page.getByRole('tab', { name: 'Produtos (11)' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Confirmar importação' }).isDisabled(), true);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(width - 1, 1);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${output}/import-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('tab', { name: 'Categorias (4)' }).click();
      await page.getByRole('tab', { name: 'Receitas (0)' }).click();
      await page.getByText('Nenhuma linha nesta aba. Nenhum registro será removido.').waitFor();
      await page.getByRole('checkbox').check({ force: true });
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
      await page.getByRole('button', { name: 'Ocultar prévia' }).waitFor();
      await page.getByRole('region', { name: 'Prévia do conteúdo' }).waitFor();
      await page.getByRole('region', { name: 'Prévia do conteúdo' }).scrollIntoViewIfNeeded();
      await page.mouse.move(width - 1, 1);
      await page.waitForTimeout(250);
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
      await page.mouse.move(width - 1, 1);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${output}/swift-review-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('checkbox', { name: 'Usar a imagem oficial consultada' }).check({ force: true });
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
      await page.evaluate(async (official) => {
        const { creationService } = await import('/EPAVOne/src/products/insights/creation/services/creationService.js');
        const { collaborationService } = await import('/EPAVOne/src/products/insights/creation/services/collaborationService.js');
        const { adminService } = await import('/EPAVOne/src/products/insights/creation/services/adminService.js');
        const products = official.slice(0, 6).map((item, i) => ({
          id: `p${i}`,
          name: item.nome,
          image_url: item.imagem,
          active: true,
          product_code: `PRD${i}`,
          category: { name: item.categoria }
        }));
        const recipes = [
          {
            id: 'r1',
            name: 'Sobremesa para compartilhar — exemplo de revisão',
            image_url: official[0].imagem,
            status: 'draft',
            recipe_code: 'REC01',
            category: { name: 'Família' }
          }
        ];
        creationService.load = async (type) =>
          type === 'products'
            ? products
            : type === 'recipes'
              ? recipes
              : [{ id: 'c', name: 'Refeições em família', type: 'receita', active: true, category_code: 'CAT01' }];
        collaborationService.shared = async () => recipes.map((recipe) => ({ recipe }));
        collaborationService.requests = async () => [
          { id: 'req', source_code: 'REC01', status: 'changes_requested', requester_display_name_snapshot: 'Vendedor de exemplo' }
        ];
        adminService.structure = async () => ({
          pages: [{ id: 'home', key: 'home' }],
          sections: [{ id: 's', page_id: 'home', name: 'Ideias para a semana', active: true, sort_order: 0 }]
        });
        const { catalogPriceSync } = await import('/EPAVOne/src/products/insights/creation/services/adminService.js');
        let syncState = { phase: 'idle', processed: 0, total: 0, updated: 0, unchanged: 0, failed: 0, failures: [] };
        const listeners = new Set();
        catalogPriceSync.snapshot = () => syncState;
        catalogPriceSync.subscribe = (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        };
        catalogPriceSync.start = async () => {
          syncState = {
            ...syncState,
            phase: 'running',
            total: 32,
            processed: 8,
            updated: 3,
            unchanged: 5,
            currentName: 'Produto de exemplo',
            waiting: true
          };
          listeners.forEach((listener) => listener(syncState));
          return syncState;
        };
        adminService.observations = async () => [];
      }, swiftOfficialProducts);
      for (const section of ['receitas', 'produtos', 'categorias', 'compartilhadas', 'solicitacoes', 'admin']) {
        await page.evaluate(
          async (section) =>
            window.reviewMount('CreationPage', {
              route: { segments: ['criacao', section] },
              account: { session: { user: { id: 'visual-fixture' } }, profile: { role: 'admin' } }
            }),
          section
        );
        await page.locator('.ds-spinner').waitFor({ state: 'hidden' });
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(width - 1, 1);
        await page.waitForTimeout(250);
        const geometry = await page.evaluate(() => {
          const nav = document.querySelector('.creation-workspace-nav');
          const content = document.querySelector('.creation-workspace-content');
          const stitchesContained = [...document.querySelectorAll('.ds-card > .ds-stitch')].every((stitch) => {
            const card = stitch.parentElement.getBoundingClientRect();
            const bounds = stitch.getBoundingClientRect();
            return bounds.left >= card.left && bounds.right <= card.right + 1 && bounds.top >= card.top && bounds.bottom <= card.bottom + 1;
          });
          const a = nav.getBoundingClientRect();
          const b = content.getBoundingClientRect();
          return { stitchesContained, navigationSeparate: a.bottom <= b.top + 1 || a.right <= b.left + 1 };
        });
        assert.ok(
          geometry.stitchesContained,
          JSON.stringify({
            width,
            theme,
            section,
            bad: await page.evaluate(() =>
              [...document.querySelectorAll('.ds-card > .ds-stitch')]
                .map((stitch) => {
                  const c = stitch.parentElement.getBoundingClientRect();
                  const s = stitch.getBoundingClientRect();
                  return {
                    name: stitch.parentElement.className,
                    c: { x: c.x, y: c.y, w: c.width, h: c.height },
                    s: { x: s.x, y: s.y, w: s.width, h: s.height }
                  };
                })
                .filter(({ c, s }) => s.x < c.x || s.x + s.w > c.x + c.w + 1 || s.y < c.y || s.y + s.h > c.y + c.h + 1)
            )
          })
        );
        assert.ok(geometry.navigationSeparate, 'Workspace navigation must not overlap content');
        await page.screenshot({ path: `${output}/workspace-${section}-${width}-${theme}.png`, fullPage: true });
        results.push({
          view: `workspace ${section} fixture`,
          width,
          theme,
          overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          errors: [...errors]
        });
      }
      await page.getByRole('button', { name: 'Consultar preços Swift' }).click();
      await page.getByRole('button', { name: 'Atualizar preços públicos' }).click();
      await page.getByRole('progressbar', { name: 'Produtos conferidos' }).waitFor();
      await page.mouse.move(width - 1, 1);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${output}/sync-pending-${width}-${theme}.png`, fullPage: true });
      results.push({
        view: 'pending sync fixture',
        width,
        theme,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        errors: [...errors]
      });
      await page.evaluate(async (official) => {
        const { adminService } = await import('/EPAVOne/src/products/insights/creation/services/adminService.js');
        const existing = {
          id: 'original',
          version: 3,
          name: official[0].nome,
          unit: 'un',
          image_url: official[0].imagem,
          swift_product_url: official[0].swift_url,
          active: true,
          product_code: 'PRD01'
        };
        const context = {
          categories: [],
          products: [existing, { ...existing, id: 'duplicate', product_code: 'PRD02' }],
          recipes: [],
          structure: { pages: [], sections: [] }
        };
        adminService.context = async () => context;
        window.reviewDuplicateContext = context;
        adminService.importCatalog = async (modes, payload, choices) => {
          window.reviewDuplicateChoices = choices;
          return { products: { added: 10, replaced: choices.length } };
        };
      }, swiftOfficialProducts);
      await page.getByRole('button', { name: 'Verificar duplicatas', exact: true }).click();
      await page.getByRole('button', { name: 'Verificar catálogo' }).click();
      await page.getByText('1 grupo(s) de possíveis duplicatas.').waitFor();
      await page.mouse.move(width - 1, 1);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${output}/duplicates-${width}-${theme}.png`, fullPage: true });
      results.push({
        view: 'catalog duplicate check fixture',
        width,
        theme,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        errors: [...errors]
      });
      await page.evaluate(() => window.reviewDuplicateContext.products.pop());
      await page.getByRole('button', { name: 'Importar Excel do catálogo' }).click();
      await page.locator('input[type=file]').setInputFiles({
        name: 'catalogo.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from(await createSwiftWorkbookFixture())
      });
      await page.getByRole('button', { name: 'Comparar original e importado' }).click();
      await page.getByRole('checkbox').check({ force: true });
      const duplicateSelect = page.getByRole('button', { name: /Duplicata de Petit Gateau/ });
      await duplicateSelect.click();
      await page.getByRole('option', { name: 'Usar conteúdo importado' }).click();
      assert.equal(await page.getByRole('button', { name: 'Confirmar importação' }).isDisabled(), true);
      await page.mouse.move(width - 1, 1);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${output}/duplicate-choice-${width}-${theme}.png`, fullPage: true });
      await page.getByRole('checkbox').check({ force: true });
      await page.getByRole('button', { name: 'Confirmar importação' }).click();
      await page.getByText(/Importação concluída: 10 adicionado/).waitFor();
      assert.deepEqual(await page.evaluate(() => window.reviewDuplicateChoices), [
        { entity: 'products', index: 0, id: 'original', version: 3 }
      ]);
      results.push({
        view: 'reviewed duplicate replacement fixture',
        width,
        theme,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        errors: [...errors]
      });
    }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  assert.ok(results.filter((row) => row.width).every((row) => !row.overflow && !row.errors.length));
  console.warn(JSON.stringify(results));
} finally {
  await browser?.close();
  server.kill();
}

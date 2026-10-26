import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writerTemplate } from '../tests/helpers/writerTemplate.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-unified-design';
fs.mkdirSync(output, { recursive: true });
const fixturePath = process.env.REVIEW_CATALOG_FIXTURE;
const readFixture = (kind) =>
  fixturePath && fs.existsSync(`${fixturePath}/${kind}.json`)
    ? JSON.parse(fs.readFileSync(`${fixturePath}/${kind}.json`, 'utf8'))
        .slice(0, 6)
        .map((item) => ({ ...item, category_id: item.category?.id }))
    : Array.from({ length: 6 }, (_, i) => ({
        id: `${kind}-${i}`,
        name: `${kind === 'recipes' ? 'Receita' : 'Produto'} de demonstração ${i + 1}`,
        category_id: 'aves',
        category: { id: 'aves', name: 'Aves' },
        unit: 'pacote',
        price_cents: 2590,
        regular_price_cents: 2590,
        prep_time: 25 + i * 10,
        servings: 4,
        difficulty: 'Fácil',
        instructions: ['Separe os ingredientes.', 'Prepare e sirva.'],
        extras: ['Sal e azeite']
      }));
const recipes = readFixture('recipes');
const products = readFixture('products');
const categories = [...new Map([...recipes, ...products].map((item) => [item.category.id, item.category])).values()];
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5186', '--strictPort'], {
  stdio: 'ignore'
});
process.on('exit', () => server.kill());
const base = 'http://127.0.0.1:5186/EPAVOne/';
let browser;
const results = process.env.REVIEW_FLOWS ? JSON.parse(fs.readFileSync(`${output}/matrix.json`, 'utf8')) : [];
const flows = [];
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.REVIEW_BROWSER, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  async function newPage(width, theme, preferences = {}) {
    const page = await browser.newPage({ viewport: { width, height: 960 } });
    page.setDefaultTimeout(15000);
    page.reviewErrors = [];
    page.on('pageerror', (error) => page.reviewErrors.push(error.message));
    await page.addInitScript(
      ({ theme, preferences }) => {
        localStorage.setItem('epavone-introduction-v1', 'done');
        localStorage.setItem('epavone-theme', theme);
        localStorage.setItem('epavone-preferences', JSON.stringify(preferences));
        window.turnstile = { render: () => 'fixture', remove: () => {} };
      },
      { theme, preferences }
    );
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      if (fixturePath)
        for (const [kind, items] of [
          ['recipes', recipes],
          ['products', products]
        ]) {
          const index = items.findIndex((item) => item.image_url === url.href);
          if (index >= 0 && fs.existsSync(`${fixturePath}/${kind}-${index}.jpg`))
            return route.fulfill({ path: `${fixturePath}/${kind}-${index}.jpg`, contentType: 'image/jpeg' });
        }
      if (url.pathname.includes('/rest/v1/')) {
        assert(['GET', 'OPTIONS'].includes(route.request().method()), 'Visual review must never write to the backend');
        const table = url.pathname.split('/').at(-1);
        const rows =
          table === 'recipes'
            ? recipes
            : table === 'products'
              ? products
              : table === 'categories'
                ? categories
                : table === 'recipe_ingredients'
                  ? [{ id: 'ingredient', quantity: 1, product: products[0], recipe: recipes[0] }]
                  : [];
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(rows.slice(Number(url.searchParams.get('offset') || 0))),
          headers: {
            'content-range': `0-${rows.length - 1}/${rows.length}`,
            'access-control-allow-origin': '*',
            'access-control-expose-headers': 'content-range'
          }
        });
      }
      return route.abort();
    });
    return page;
  }
  async function go(page, route) {
    await page.goto(`${base}#/${route}`);
    await page.locator('h1').first().waitFor();
    if (route === 'insights' || route === 'insights/receitas' || route === 'insights/produtos')
      await page.locator('.insights-catalog-card').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(80);
  }
  async function capture(page, name, fullPage = true) {
    const modal = await page.getByRole('dialog').count();
    if (!modal) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(50);
    }
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: fullPage && !modal, animations: 'disabled' });
  }
  async function geometry(page, name) {
    const data = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      clippedHeaders: [...document.querySelectorAll('.ds-page-header')].filter((card) => {
        const content = card.querySelector('.ds-page-header-main');
        return (
          content &&
          content.getBoundingClientRect().bottom >
            card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom) + 1
        );
      }).length,
      title: (() => {
        const node = document.querySelector('.ds-page-title');
        if (!node) return null;
        const style = getComputedStyle(node);
        const surface = getComputedStyle(node.closest('.ds-page-header'));
        return {
          font: style.fontFamily,
          size: style.fontSize,
          leading: style.lineHeight,
          padding: surface.padding,
          radius: surface.borderRadius
        };
      })()
    }));
    assert(data.overflow <= 1, `${name}: horizontal overflow ${data.overflow}`);
    assert.equal(data.clippedHeaders, 0, `${name}: clipped page header`);
    assert.deepEqual(page.reviewErrors, [], `${name}: runtime errors`);
    return data;
  }
  const routes = [
    '',
    'welcome',
    'insights',
    'insights/receitas',
    'insights/produtos',
    'insights/criacao',
    'planner',
    'planner/semana',
    'planner/clientes',
    'planner/oportunidades',
    'planner/desempenho',
    'planner/atendimento',
    'writer',
    'settings'
  ];
  for (const width of process.env.REVIEW_FLOWS ? [] : [320, 390, 768, 1024, 1440])
    for (const theme of ['light', 'dark']) {
      const page = await newPage(width, theme);
      let headerContract;
      for (const route of routes) {
        await go(page, route);
        const name = `${route.replaceAll('/', '-') || 'home'}-${width}-${theme}`;
        const measured = await geometry(page, name);
        if (measured.title) {
          if (headerContract) assert.deepEqual(measured.title, headerContract, `${name}: header geometry differs across apps`);
          else headerContract = measured.title;
        }
        results.push({ route: route || 'home', width, theme, ...measured });
        if ((width === 1440 && theme === 'light') || (width === 390 && theme === 'dark')) await capture(page, name);
      }
      await page.close();
      console.warn(`Page matrix: ${width}px / ${theme} passed`);
    }
  // Compact/large text, alternate navigation and reduced motion are the same preferences in every app.
  for (const width of process.env.REVIEW_FLOWS ? [] : [320, 1440]) {
    const page = await newPage(width, 'dark', {
      density: 'compact',
      textSize: 'large',
      reducedMotion: true,
      navigation: 'vertical',
      mobileNavigation: 'vertical'
    });
    for (const route of ['insights/receitas', 'planner/clientes', 'writer', 'settings']) {
      await go(page, route);
      results.push({ route, width, theme: 'dark', preferences: 'compact-large-reduced-vertical', ...(await geometry(page, route)) });
    }
    await page.close();
  }
  fs.writeFileSync(`${output}/matrix.json`, JSON.stringify(results, null, 2));
  for (const width of [390, 1440])
    for (const theme of ['light', 'dark']) {
      const page = await newPage(width, theme);
      for (const [route, action] of [
        ['insights/receitas', 'Ver receita de'],
        ['insights/produtos', 'Ver detalhes de']
      ]) {
        await go(page, route);
        const trigger = page.getByRole('button', { name: new RegExp(action) }).first();
        await trigger.click();
        await page.getByRole('dialog').waitFor();
        await page.locator('.insights-detail-section, .recipe-detail-body').first().waitFor();
        const box = await page.getByRole('dialog').boundingBox();
        assert(box.x >= -1 && box.x + box.width <= width + 1, 'Detail dialog must stay in viewport');
        await capture(page, `${route.endsWith('receitas') ? 'recipe' : 'product'}-dialog-${width}-${theme}`);
        await page.keyboard.press('Escape');
        assert(await trigger.evaluate((node) => node === document.activeElement), 'Detail dialog must return focus');
        flows.push({ flow: route + '/detail-focus-return', width, theme });
      }
      await go(page, 'planner/clientes');
      await page.getByRole('button', { name: 'Novo cliente', exact: true }).click();
      await page.getByRole('dialog', { name: 'Novo cliente' }).waitFor();
      await capture(page, `client-editor-${width}-${theme}`);
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^Segmento/ })
        .click();
      const listbox = await page.getByRole('listbox').boundingBox();
      assert(listbox.x >= 0 && listbox.x + listbox.width <= width, 'Select must stay in viewport');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Fechar', exact: true }).click();
      flows.push({ flow: 'client-editor-select-portal', width, theme });
      // Exercise the real workbook importer and four real checkout stages with fictitious data.
      await go(page, 'writer');
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 86400000);
      const date = (value) => value.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const file = await writerTemplate({ period: `${date(now)} à ${date(end)}` });
      await page.locator('input[type=file]').setInputFiles({
        name: file.name,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from(await file.arrayBuffer())
      });
      await page.getByRole('region', { name: 'Etapa 1: Cliente' }).waitFor();
      for (const [label, value] of [
        [/^Sala ·/, '8ºD'],
        [/^Aluno ·/, 'Aluno'],
        [/^Cliente ·/, 'Cliente']
      ]) {
        await page.getByRole('button', { name: label }).click();
        await page.getByRole('option', { name: value, exact: true }).click();
      }
      await capture(page, `writer-client-${width}-${theme}`);
      await page.getByRole('button', { name: 'Continuar para produtos' }).click();
      await page.getByRole('button', { name: 'Adicionar produto', exact: true }).click();
      await page.getByLabel('Buscar produto', { exact: true }).fill('Produto 1');
      await page.getByRole('button', { name: 'Adicionar ao pedido', exact: true }).first().click();
      await capture(page, `writer-products-${width}-${theme}`);
      await page.getByRole('button', { name: 'Continuar para entrega' }).click();
      for (const [label, value] of [
        [/^Entrega ou retirada/, 'Retira - Outras Lojas'],
        [/^Loja para retirada/, 'Loja'],
        [/^Pagamento ·/, 'Pix']
      ]) {
        await page.getByRole('button', { name: label }).click();
        await page.getByRole('option', { name: value, exact: true }).click();
      }
      const dateField = page.getByLabel(/^Data de entrega/);
      await dateField.fill(await dateField.getAttribute('min'));
      await capture(page, `writer-delivery-${width}-${theme}`);
      await page.getByRole('button', { name: 'Continuar para conferência' }).click();
      await page.getByRole('heading', { name: 'Confira antes de gerar o Excel' }).waitFor();
      await geometry(page, 'writer-review');
      await capture(page, `writer-review-${width}-${theme}`);
      // Export validates the same workbook path; no order is sent to Swift or a live database.
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Validar e baixar pedido', exact: true }).click();
      await download;
      flows.push({ flow: 'writer-upload-client-products-delivery-review-download', width, theme });
      assert.deepEqual(page.reviewErrors, []);
      await page.close();
      console.warn(`Interaction review: ${width}px / ${theme} passed`);
    }
  fs.writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ fixtureCatalog: true, productionAcceptance: false, matrix: results, flows }, null, 2)
  );
  console.warn(`${results.length} page checks and ${flows.length} interaction flows passed.`);
} finally {
  await browser?.close();
  server.kill();
}

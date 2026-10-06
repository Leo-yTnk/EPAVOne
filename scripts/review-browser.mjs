import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Optional browser audit: install playwright and @axe-core/playwright, then set
// REVIEW_BROWSER to a Chromium executable and run node scripts/review-browser.mjs.
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function review() {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '5174'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve();
    });
    server.on('error', reject);
  });
  const browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    headless: true,
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=disabled', '--disable-software-rasterizer']
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const output = 'docs/quality-review';
  fs.mkdirSync(output, { recursive: true });
  const categories = [{ id: 'aves', name: 'Aves' }];
  const products = Array.from({ length: 25 }, (_, i) => ({
    id: `p${i}`,
    name: i ? `Produto de teste ${i}` : 'Filé de frango Swift 1 kg',
    product_code: `${1000 + i}`,
    category_id: 'aves',
    category: categories[0],
    unit: 'pacote',
    price_cents: 2590,
    regular_price_cents: 2590,
    promo_price_cents: 2290,
    promo_min_quantity: 2,
    price_status: 'ok'
  }));
  const recipes = Array.from({ length: 25 }, (_, i) => ({
    id: `r${i}`,
    name: i ? `Receita de teste ${i}` : 'Frango assado para o almoço em família',
    category_id: 'aves',
    category: categories[0],
    prep_time: 25,
    servings: 4,
    instructions: ['Separe os ingredientes.', 'Asse até cozinhar.'],
    featured: i === 0
  }));
  let fail = false;
  let delay = 0;
  await page.route('**/rest/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1);
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (fail) return route.fulfill({ status: 503, body: '{}' });
    const rows =
      table === 'products'
        ? products
        : table === 'recipes'
          ? recipes
          : table === 'categories'
            ? categories
            : table === 'recipe_ingredients'
              ? [{ id: 'i1', quantity: 1, product: products[0], recipe: recipes[0] }]
              : [];
    const offset = Number(url.searchParams.get('offset') || 0);
    const selected = rows.slice(offset, offset + Number(url.searchParams.get('limit') || 200));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `${offset}-${Math.max(offset, offset + selected.length - 1)}/${rows.length}` },
      body: JSON.stringify(selected)
    });
  });
  const go = async (hash) => {
    await page.goto(`http://127.0.0.1:5174/EPAVOne/${hash}`);
    await page.locator('h1').first().waitFor();
    await page.waitForTimeout(150);
    await page.evaluate(() => document.fonts.ready);
  };
  const capture = async (options) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(100);
    await page.screenshot(options);
  };
  const results = process.env.REVIEW_QUICK ? JSON.parse(fs.readFileSync(`${output}/matrix-results.json`, 'utf8')) : [];
  const routes = [
    '',
    '#/insights',
    '#/insights/receitas',
    '#/insights/produtos',
    '#/insights/criacao',
    '#/planner',
    '#/writer',
    '#/settings'
  ];
  try {
    for (const width of process.env.REVIEW_QUICK ? [] : [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['light', 'dark']) {
        await go('');
        await page.evaluate((value) => localStorage.setItem('epavone-theme', value), theme);
        for (const hash of routes) {
          await go(hash);
          if (hash === '#/insights') await page.getByRole('button', { name: 'Conhecer a receita' }).waitFor();
          if (hash === '#/insights/produtos') await page.getByLabel('Buscar produto', { exact: true }).waitFor();
          if (hash === '#/insights/receitas') await page.getByLabel('Buscar receita', { exact: true }).waitFor();
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert(overflow <= 1, `Horizontal overflow: ${width} ${theme} ${hash} ${overflow}`);
          const header = await page.locator('.site-header').boundingBox();
          assert(Math.abs(header.x) <= 1 && Math.abs(header.width - width) <= 1, `Header width: ${width} ${theme} ${hash}`);
          results.push({ width, theme, route: hash || '#/', overflow, headerWidth: header.width, headerX: header.x });
          if ((width === 1440 && theme === 'light') || (width === 390 && theme === 'dark')) {
            const name = hash.replace('#/', '').replaceAll('/', '-') || 'home';
            await capture({ path: `${output}/${name}-${width}-${theme}.png`, fullPage: true });
          }
        }
      }
    }
    fs.writeFileSync(`${output}/matrix-results.json`, JSON.stringify(results, null, 2));
    await page.setViewportSize({ width: 390, height: 844 });
    await go('#/insights/produtos');
    await page.getByLabel('Buscar produto', { exact: true }).fill('inexistente');
    await page.getByText('Nenhum produto encontrado').waitFor();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await page.getByRole('button', { name: 'Próxima página' }).click();
    assert.equal(await page.locator('.insights-product').count(), 1);
    await page.getByRole('button', { name: 'Página anterior' }).click();
    const trigger = page.getByRole('button', { name: 'Ver detalhes de Filé de frango Swift 1 kg' });
    await trigger.click();
    await page.getByRole('dialog').waitFor();
    await capture({ path: `${output}/product-detail-mobile.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
    await go('#/insights/receitas');
    await page.getByRole('button', { name: 'Ver receita de Frango assado para o almoço em família' }).click();
    await page.getByRole('dialog').waitFor();
    await capture({ path: `${output}/recipe-detail-mobile.png`, fullPage: true });
    await page.keyboard.press('Escape');
    fail = true;
    await go('#/insights/produtos');
    await page.getByRole('button', { name: 'Tentar novamente' }).first().waitFor();
    await capture({ path: `${output}/catalog-error-mobile.png`, fullPage: true });
    fail = false;
    await page.getByRole('button', { name: 'Tentar novamente' }).first().click();
    await page.getByLabel('Buscar produto', { exact: true }).waitFor();
    delay = 800;
    await go('#/insights');
    await capture({ path: `${output}/home-loading-mobile.png`, fullPage: true });
    delay = 0;
    await go('#/settings');
    const themeTrigger = page.getByRole('button', { name: /^Tema/ });
    await themeTrigger.click();
    const menu = page.getByRole('listbox');
    await menu.waitFor();
    assert(await menu.evaluate((element) => !element.closest('.settings-page')));
    const box = await menu.boundingBox();
    assert(box.x >= 0 && box.x + box.width <= 390);
    await page.keyboard.press('Escape');
    await page.locator('.ds-switch').click();
    await page.waitForFunction(() => document.documentElement.dataset.reducedMotion === 'true');
    await page.locator('.settings-page').getByRole('button', { name: 'Entrar na conta' }).click();
    await page.getByRole('dialog').waitFor();
    await capture({ path: `${output}/account-mobile.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go('#/settings');
    await page.getByRole('button', { name: /^Posição da navegação/ }).click();
    await page.getByRole('option', { name: 'Vertical · painel lateral' }).click();
    await page.waitForFunction(() => document.querySelector('[role=tablist]').getAttribute('aria-orientation') === 'vertical');
    await capture({ path: `${output}/settings-vertical-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[role=tablist]').getAttribute('aria-orientation') === 'horizontal');
    await go('#/writer');
    const { writerTemplate } = await import(pathToFileURL(path.resolve('tests/helpers/writerTemplate.js')));
    const template = await writerTemplate({ period: '05/10/2026 à 10/10/2026' });
    await page.locator('input[type="file"]').setInputFiles({
      name: 'pedido-teste.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await template.arrayBuffer())
    });
    await page.getByRole('region', { name: 'Etapa 1: Cliente' }).waitFor();
    const choose = async (label, value) => {
      await page.getByRole('button', { name: label }).click();
      await page.getByRole('option', { name: value, exact: true }).click();
    };
    await choose(/Sala · obrigatória/, '8ºD');
    await choose(/Aluno · obrigatório/, 'Aluno');
    await choose(/Cliente · obrigatório/, 'Cliente');
    await page.getByLabel(/CPF do cliente/).fill('01234567890');
    await page.getByRole('button', { name: 'Continuar para produtos' }).click();
    await page.getByRole('button', { name: 'Adicionar produto' }).click();
    await page.getByRole('button', { name: 'Adicionar ao pedido' }).first().click();
    const lineWidth = await page.locator('.writer-line').evaluate((element) => ({
      actual: element.getBoundingClientRect().width,
      available: element.parentElement.getBoundingClientRect().width
    }));
    assert(lineWidth.actual >= lineWidth.available - 1);
    await capture({ path: `${output}/writer-cart-mobile.png`, fullPage: true });
    await page.locator('input[type="file"]').setInputFiles({
      name: 'invalido.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('invalid')
    });
    await page.getByText(/Seu formulário e pedido anteriores foram preservados/).waitFor();
    assert.equal(await page.getByLabel(/^Quantidade de/).inputValue(), '1');
    await page.getByRole('button', { name: 'Continuar para entrega' }).click();
    await choose(/Entrega ou retirada/, 'Retira - Outras Lojas');
    await choose(/Loja para retirada/, 'Loja');
    await page.getByLabel(/Data de entrega ou retirada/).fill('2026-10-08');
    await choose(/Pagamento · obrigatório/, 'Pix');
    await page.getByRole('button', { name: 'Continuar para conferência' }).click();
    await capture({ path: `${output}/writer-review-mobile.png`, fullPage: true });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Validar e baixar pedido' }).click()
    ]);
    assert(download.suggestedFilename().endsWith('.xlsx'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await go('');
    assert.equal(
      await page
        .locator('.route-frame')
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
      'none'
    );
    const accessibility = [];
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await go('');
      await page.evaluate(() =>
        localStorage.setItem(
          'epavone-preferences',
          JSON.stringify({ navigation: 'horizontal', density: 'comfortable', reducedMotion: false })
        )
      );
      for (const theme of ['light', 'dark']) {
        await page.evaluate((value) => localStorage.setItem('epavone-theme', value), theme);
        for (const hash of routes) {
          await go(hash);
          await page.waitForTimeout(200);
          const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          accessibility.push({
            width,
            theme,
            route: hash || '#/',
            violations: audit.violations.map(({ id, impact, nodes }) => ({
              id,
              impact,
              elements: nodes.map(({ target, failureSummary }) => ({ target, failureSummary }))
            }))
          });
        }
      }
    }
    fs.writeFileSync(`${output}/accessibility-results.json`, JSON.stringify(accessibility, null, 2));
    assert(
      accessibility.every((item) => item.violations.length === 0),
      'Accessibility violations remain; see accessibility-results.json'
    );
    await go('#/insights');
    const motion = await page.evaluate(() => {
      const properties = (selector) => {
        const style = getComputedStyle(document.querySelector(selector));
        return { animation: style.animationName, duration: style.animationDuration, transition: style.transitionProperty,
          transitionDuration: style.transitionDuration, opacity: style.opacity, filter: style.filter, backdropFilter: style.backdropFilter };
      };
      return { route: properties('.route-frame'), button: properties('.ds-btn'), indicator: properties('.ds-selection-indicator') };
    });
    assert.equal(motion.route.duration, '0.22s');
    assert.equal(motion.route.opacity, '1');
    assert(motion.button.transition.includes('transform') && !motion.button.transition.split(', ').includes('all'));
    await go('#/settings');
    await page.getByRole('button', { name: /^Tema/ }).click();
    motion.layer = await page.getByRole('listbox').evaluate((element) => {
      const style = getComputedStyle(element.closest('.ds-layer-anchor'));
      return { animation: style.animationName, duration: style.animationDuration, origin: style.transformOrigin,
        filter: style.filter, backdropFilter: style.backdropFilter };
    });
    assert.equal(motion.layer.duration, '0.22s');
    for (const style of Object.values(motion)) {
      assert.equal(style.filter, 'none');
      assert.equal(style.backdropFilter, 'none');
    }
    await page.keyboard.press('Escape');
    fs.writeFileSync(`${output}/motion-results.json`, JSON.stringify(motion, null, 2));
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      `${output}/browser-results.json`,
      JSON.stringify(
        {
          fixtureCatalog: true,
          liveSupabaseValidated: false,
          matrix: results,
          checks: [
            'search-empty-reset',
            'pagination',
            'product-dialog-focus-return',
            'recipe-dialog',
            'error-retry',
            'skeleton-loading',
            'select-portal-viewport',
            'settings-reduced-motion',
            'account-dialog',
            'vertical-navigation-mobile-fallback',
            'writer-upload-customer-cart-delivery-export',
            'writer-preserved-after-invalid-replacement',
            'system-reduced-motion',
            'full-width-header',
            'short-motion-without-blur'
          ],
          pageErrors: errors
        },
        null,
        2
      )
    );
    console.warn(`${results.length} viewport/theme/route checks passed; interactions passed; no page errors.`);
  } finally {
    await browser.close();
    server.kill();
  }
}
review().catch((error) => {
  console.error(error);
  process.exit(1);
});

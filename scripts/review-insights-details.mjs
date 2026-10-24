import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const server = require('node:child_process').spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5174'],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] }
  );
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
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const product = {
    id: 'p1',
    name: 'Filé de frango Swift 1 kg',
    unit: 'pacote',
    regular_price_cents: 2590,
    price_cents: 2590,
    price_status: 'ok'
  };
  const recipe = {
    id: 'r1',
    name: 'Frango assado para o almoço em família',
    prep_time: 35,
    servings: 4,
    difficulty: 'Fácil',
    instructions: [
      'Tempere o frango com alho, limão e ervas.',
      'Distribua os ingredientes em uma assadeira.',
      'Asse até que o frango esteja completamente cozido e dourado.'
    ],
    extras: ['2 dentes de alho', 'Suco de 1 limão', 'Ervas a gosto'],
    tips: 'Deixe o frango descansar antes de servir para preservar a suculência.'
  };
  await page.route('**/rest/v1/**', async (route) => {
    const table = new URL(route.request().url()).pathname.split('/').at(-1);
    const rows =
      table === 'recipes'
        ? [recipe]
        : table === 'products'
          ? [product]
          : table === 'recipe_ingredients'
            ? [{ id: 'i1', quantity: 1, product, recipe }]
            : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` },
      body: JSON.stringify(rows.slice(Number(new URL(route.request().url()).searchParams.get('offset') || 0)))
    });
  });
  const output = process.env.REVIEW_OUTPUT || 'docs/recipe-redesign-review';
  fs.mkdirSync(output, { recursive: true });
  const results = [];
  for (const width of [320, 390, 768, 1440]) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width < 500 ? 900 : 1000 });
      await page.goto('http://127.0.0.1:5174/EPAVOne/#/insights/receitas');
      await page.evaluate((theme) => {
        localStorage.setItem('epavone-theme', theme);
        document.documentElement.dataset.theme = theme;
      }, theme);
      const trigger = page.getByRole('button', { name: `Ver receita de ${recipe.name}` });
      await trigger.click();
      await page.getByRole('heading', { name: 'Ingredientes', exact: true }).waitFor();
      await page.waitForTimeout(350);
      const geometry = await page.getByRole('dialog').evaluate((node) => ({
        hierarchy: (() => {
          const size = (selector) => parseFloat(getComputedStyle(node.querySelector(selector)).fontSize);
          return { title: size('.recipe-detail-title'), section: size('.recipe-detail-section > h3'), tip: size('.recipe-detail-tip h3') };
        })(),
        stitches: node.querySelectorAll('.ds-stitch').length,
        outerStitch: Boolean(node.querySelector(':scope > .ds-stitch')),
        productStitch: Boolean(node.querySelector('.insights-ingredient > .ds-stitch')),
        sectionStitches: node.querySelectorAll('.insights-recipe-panel > .ds-stitch, .recipe-detail-fact > .ds-stitch').length,
        layout: (() => {
          const image = node.querySelector('.recipe-detail-hero > .insights-image').getBoundingClientRect();
          const title = node.querySelector('.recipe-detail-title').getBoundingClientRect();
          const close = node.querySelector('.ds-dialog-head').getBoundingClientRect();
          if (title.top < close.bottom) throw new Error('Recipe title overlaps close control');
          return {
            image: { left: image.left, top: image.top, right: image.right },
            title: { left: title.left, top: title.top, bottom: title.bottom }
          };
        })(),
        overflow: node.scrollWidth > node.clientWidth,
        expansion: node.classList.contains('ds-dialog-expanding'),
        width: node.getBoundingClientRect().width,
        facts: [...node.querySelectorAll('.recipe-detail-fact')].map((n) => ({ width: n.clientWidth, scroll: n.scrollWidth })),
        lines: [...node.querySelectorAll('.recipe-detail-steps li,.recipe-detail-extras li')].some(
          (n) => parseFloat(getComputedStyle(n).borderBottomWidth) > 0
        )
      }));
      if (!(geometry.hierarchy.title > geometry.hierarchy.section && geometry.hierarchy.section > geometry.hierarchy.tip))
        throw new Error('Recipe typography hierarchy failed');
      if (
        geometry.outerStitch ||
        geometry.productStitch ||
        geometry.sectionStitches ||
        geometry.overflow ||
        !geometry.expansion ||
        geometry.lines ||
        geometry.facts.some((n) => n.scroll > n.width)
      )
        throw new Error(JSON.stringify({ width, theme, geometry }));
      if (width === 1440 || width === 390) await page.screenshot({ path: `${output}/recipe-${width}-${theme}.png` });
      await page.getByRole('button', { name: `Ver produto ${product.name}` }).click();
      await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
      const arrival = await page.locator('.insights-detail-content').evaluate((node) => {
        const animation = node.getAnimations()[0];
        return animation && { frames: animation.effect.getKeyframes(), duration: animation.effect.getTiming().duration };
      });
      if (!arrival || arrival.frames[0].transform !== 'translateX(6px)' || arrival.duration > 320)
        throw new Error('Detail arrival must be short and move forward');
      await page.getByRole('button', { name: '← Voltar à receita' }).click();
      await page.getByRole('heading', { name: 'Modo de preparo', exact: true }).waitFor();
      const returnMotion = await page
        .locator('.insights-detail-content')
        .evaluate((node) => node.getAnimations()[0]?.effect.getKeyframes()[0].transform);
      if (returnMotion !== 'translateX(-6px)') throw new Error('Detail return motion must reverse direction');
      await page.keyboard.press('Escape');
      if (await page.getByRole('dialog').count()) throw new Error('Dialog remains open');
      await page.goto('http://127.0.0.1:5174/EPAVOne/#/insights/produtos');
      await page.getByRole('button', { name: `Ver detalhes de ${product.name}` }).click();
      await page.waitForTimeout(300);
      const productGeometry = await page.getByRole('dialog').evaluate((node) => ({
        stitches: node.querySelectorAll('.ds-stitch').length,
        expansion: node.classList.contains('ds-dialog-expanding'),
        overflow: node.scrollWidth > node.clientWidth
      }));
      if (productGeometry.stitches !== 0 || !productGeometry.expansion || productGeometry.overflow)
        throw new Error('Product expansion failed');
      if (width === 390 || width === 1440) await page.screenshot({ path: `${output}/product-${width}-${theme}.png` });
      await page.keyboard.press('Escape');
      results.push({ width, theme, ...geometry, product: productGeometry });
    }
  }
  await page.goto('http://127.0.0.1:5174/EPAVOne/#/insights/receitas');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: `Ver receita de ${recipe.name}` }).click();
  const reduced = await page.getByRole('dialog').evaluate((n) => !n.classList.contains('ds-dialog-expanding'));
  if (!reduced) throw new Error('Reduced motion failed');
  await page.getByRole('button', { name: `Ver produto ${product.name}` }).click();
  if (await page.locator('.insights-detail-content').evaluate((node) => node.getAnimations().length))
    throw new Error('Reduced motion must skip detail arrivals');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark']) {
    await page.goto('http://127.0.0.1:5174/EPAVOne/#/settings');
    await page.evaluate((value) => {
      localStorage.setItem('epavone-theme', value);
      document.documentElement.dataset.theme = value;
    }, theme);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/settings-mobile-${theme}.png`, fullPage: true });
    await page.getByRole('button', { name: /^Navegação:/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Seus apps' });
    await drawer.waitFor();
    if (await drawer.locator('.mobile-sidebar-apps').evaluate((node) => node.getAnimations().length))
      throw new Error('Reduced motion must skip drawer group arrivals');
    const grid = await drawer.locator('.mobile-sidebar-apps .ds-nav-item').evaluateAll((nodes) =>
      nodes.map((node) => {
        const b = node.getBoundingClientRect();
        return { top: b.top, left: b.left };
      })
    );
    if (grid.length !== 4 || Math.abs(grid[0].top - grid[1].top) > 1 || grid[2].top <= grid[0].top)
      throw new Error('App drawer grid failed');
    await page.screenshot({ path: `${output}/app-drawer-mobile-${theme}.png` });
    await page.keyboard.press('Escape');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: /^Navegação:/ }).click();
  const groupMotion = await page.locator('.mobile-sidebar-apps').evaluate((node) => node.getAnimations()[0]?.effect.getTiming().duration);
  if (!groupMotion || groupMotion > 320) throw new Error('Drawer group arrival must be short');
  await page.evaluate(() => {
    document.documentElement.dataset.reducedMotion = 'true';
  });
  if (await page.locator('.mobile-sidebar-apps').evaluate((node) => node.getAnimations().length))
    throw new Error('Local preference must stop drawer group animation');
  await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:5174/EPAVOne/#/insights/receitas');
  await page.evaluate(() => {
    delete document.documentElement.dataset.reducedMotion;
  });
  await page.getByRole('button', { name: /^Filtros/ }).click();
  const filterDuration = await page.locator('.ds-filter-fields').evaluate((node) => node.getAnimations()[0]?.effect.getTiming().duration);
  if (!filterDuration || filterDuration > 220) throw new Error('Filter arrival must be short');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (await page.locator('.ds-filter-fields').evaluate((node) => node.getAnimations().length))
    throw new Error('System preference must cancel filter arrival');
  await page.getByRole('button', { name: /^Filtros/ }).click();
  if (await page.locator('.ds-filter-fields').isVisible()) throw new Error('Filters must close immediately');
  await page.goto('http://127.0.0.1:5174/EPAVOne/#/settings');
  await page.addStyleTag({ content: '* { corner-shape: round; } .ds-stitch path { display: none; } .ds-stitch rect { display: block; }' });
  const radius = await page
    .locator('.settings-section')
    .first()
    .evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius));
  if (radius > 28) throw new Error('Mobile fallback radius is too large');
  await page.screenshot({ path: `${output}/settings-mobile-fallback.png`, fullPage: true });
  fs.writeFileSync(
    `${output}/results.json`,
    JSON.stringify({ results, reducedMotion: reduced, errors, fixture: 'Controlled catalog data; no live database writes.' }, null, 2)
  );
  if (errors.length) throw new Error(errors.join('\n'));
  process.stdout.write(`${JSON.stringify({ scenarios: results.length, reducedMotion: reduced, errors })}\n`);
  await browser.close();
  server.kill();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

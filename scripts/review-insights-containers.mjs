import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-insights-containers';
fs.mkdirSync(output, { recursive: true });
const category = { id: 'c1', name: 'Pratos para compartilhar' };
const recipes = Array.from({ length: 12 }, (_, index) => ({
  id: `r${index}`,
  name: index ? `Receita ${index}` : 'Frango assado com legumes e especiarias para toda a família',
  category_id: 'c1',
  category,
  image_url: 'https://fixtures.invalid/photo.svg',
  prep_time: 40,
  servings: 4,
  difficulty: 'Fácil',
  instructions: ['Prepare os ingredientes com cuidado.', 'Asse até cozinhar e sirva com os acompanhamentos.'],
  extras: ['Sal e azeite'],
  tips: 'Confira o ponto de cozimento antes de servir.'
}));
const product = {
  id: 'p1',
  name: 'Frango Swift com embalagem econômica para compartilhar',
  category_id: 'c1',
  category,
  image_url: 'https://fixtures.invalid/photo.svg',
  regular_price_cents: 2590,
  unit: 'pacote'
};
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5184', '--strictPort'], {
  stdio: 'ignore'
});
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5184/EPAVOne/')).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=disabled', '--disable-software-rasterizer']
  });
  const results = [];
  for (const width of [320, 390, 768, 1440])
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript(
        ({ theme }) => {
          localStorage.setItem('epavone-introduction-v1', 'done');
          localStorage.setItem('epavone-theme', theme);
          window.turnstile = { render: () => 'fixture', remove: () => {} };
          window.__modalEntries = [];
          const original = Element.prototype.animate;
          Element.prototype.animate = function (frames, options) {
            if (this.classList.contains('ds-dialog')) window.__modalEntries.push({ frames, duration: options.duration });
            return original.call(this, frames, options);
          };
        },
        { theme }
      );
      await page.route('https://fixtures.invalid/**', (route) =>
        route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#dfc7a5"/></svg>'
        })
      );
      await page.route('**/rest/v1/**', (route) => {
        assert.equal(route.request().method(), 'GET');
        const url = new URL(route.request().url());
        const table = url.pathname.split('/').at(-1);
        const rows =
          table === 'recipes'
            ? recipes
            : table === 'products'
              ? [product]
              : table === 'categories'
                ? [category]
                : table === 'recipe_ingredients'
                  ? [{ id: 'ingredient', quantity: 1, product, recipe: recipes[0] }]
                  : [];
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(rows.slice(Number(url.searchParams.get('offset') || 0))),
          headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` }
        });
      });
      await page.goto('http://127.0.0.1:5184/EPAVOne/#/insights/receitas');
      await page.getByText('12 receitas encontradas', { exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const box = async () =>
        page
          .locator('.insights-recipes-collection > article')
          .first()
          .evaluate((card) => {
            const style = getComputedStyle(card);
            const rect = card.getBoundingClientRect();
            const image = card.querySelector('.insights-image').getBoundingClientRect();
            return {
              padding: parseFloat(style.paddingLeft),
              contentLeft: image.left - rect.left,
              rightSpace: rect.right - image.right,
              width: rect.width,
              overflow: card.scrollWidth > card.clientWidth
            };
          });
      const allCards = page.locator('.insights-recipes-collection > article');
      await allCards.last().scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll('.insights-recipes-collection > article')].at(-1)?.querySelector('.ds-stitch')?.dataset
            .stitchReady === 'true'
      );
      await allCards.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const comfortable = await box();
      assert(!comfortable.overflow);
      assert(Math.abs(comfortable.contentLeft - comfortable.rightSpace) <= 1, 'Photo gutters must be symmetric');
      await page.evaluate(() => {
        document.documentElement.dataset.density = 'compact';
      });
      const compact = await box();
      assert(compact.padding <= comfortable.padding, 'Compact density must never enlarge an explicit catalog padding');
      await page.evaluate(() => {
        document.documentElement.dataset.textSize = 'large';
      });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Large text must fit');
      await page.evaluate(() => {
        delete document.documentElement.dataset.textSize;
        delete document.documentElement.dataset.density;
      });
      const trigger = page.getByRole('button', { name: `Ver receita de ${recipes[0].name}`, exact: true });
      const contentBefore = await page.locator('.insights-catalog-tools').boundingBox();
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await dialog.getByRole('button', { name: `Ver produto ${product.name}`, exact: true }).waitFor();
      const entry = await page.evaluate(() => window.__modalEntries.at(-1));
      assert(entry && entry.duration >= 150 && entry.duration <= 320, 'Dialogs must animate without a pointer origin dependency');
      assert(!entry.frames.some((frame) => String(frame.transform).includes('scale')), 'Do not stretch detail content');
      await page.waitForTimeout(250);
      await dialog.evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished.catch(() => {}))));
      const geometry = await dialog.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const body = node.querySelector('.ds-dialog-content');
        const style = getComputedStyle(body);
        const head = getComputedStyle(node.querySelector('.ds-dialog-head'));
        return {
          width: rect.width,
          left: rect.left,
          right: rect.right,
          height: rect.height,
          scroll: body.scrollWidth,
          client: body.clientWidth,
          leftPadding: parseFloat(style.paddingLeft),
          rightPadding: parseFloat(style.paddingRight),
          headPadding: parseFloat(head.paddingLeft)
        };
      });
      assert(geometry.left >= -1 && geometry.right <= width + 1 && geometry.height <= 900, JSON.stringify(geometry));
      assert(geometry.scroll <= geometry.client, 'Dialog content must not overflow');
      if (width <= 768) {
        assert(Math.abs(geometry.left) <= 1);
        assert(Math.abs(geometry.right - width) <= 1, 'Mobile sheet must cover the entire viewport');
      }
      assert.equal(geometry.leftPadding, geometry.rightPadding, 'Detail gutters must match');
      assert.equal(geometry.headPadding, geometry.leftPadding, 'Toolbar and reading content must align');
      const contentOpen = await page.locator('.insights-catalog-tools').boundingBox();
      assert(Math.abs(contentBefore.width - contentOpen.width) <= 1, 'Opening a dialog must not resize every catalog card');
      await dialog.getByRole('button', { name: `Ver produto ${product.name}`, exact: true }).click();
      await dialog.getByRole('heading', { name: product.name, exact: true }).waitFor();
      await dialog.getByRole('button', { name: '← Voltar à receita', exact: true }).click();
      await dialog.getByRole('heading', { name: recipes[0].name, exact: true }).waitFor();
      if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/detail-${width}-${theme}.png` });
      // Observe the visual exit in the same frame as the close action.
      const exit = await page.evaluate(() => {
        document.querySelector('.ds-dialog-head button[aria-label="Fechar"]').click();
        return new Promise((resolve) =>
          requestAnimationFrame(() => {
            const node = document.querySelector('.ds-dialog-overlay[data-exiting="true"]');
            resolve(
              node && {
                inert: node.inert,
                hidden: node.getAttribute('aria-hidden'),
                animation: getComputedStyle(node).animationName,
                focused: document.activeElement?.getAttribute('aria-label')
              }
            );
          })
        );
      });
      assert(exit?.inert && exit.hidden === 'true' && exit.animation === 'ds-overlay-out', JSON.stringify(exit));
      await page.waitForTimeout(200);
      assert.equal(await page.locator('.ds-dialog-overlay').count(), 0);
      assert(await trigger.evaluate((node) => node === document.activeElement), 'Focus returns immediately');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const before = await page.evaluate(() => window.__modalEntries.length);
      await trigger.click();
      await page.getByRole('dialog').waitFor();
      assert.equal(await page.evaluate(() => window.__modalEntries.length), before);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.ds-dialog-overlay').count(), 0);
      assert.deepEqual(errors, []);
      results.push({ width, theme, comfortable, compact, geometry, exit });
      await page.close();
    }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  process.stdout.write(`${JSON.stringify({ scenarios: results.length, errors: 0 })}\n`);
} finally {
  await browser?.close();
  server.kill();
}

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const fixture = process.env.REVIEW_FIXTURE_DIR;
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-insights-discovery';
fs.mkdirSync(output, { recursive: true });
const source = (kind) =>
  fixture
    ? JSON.parse(fs.readFileSync(`${fixture}/${kind}.json`))
    : [
        kind === 'products'
          ? { name: 'Carne moída de patinho Swift 1 kg', regular_price_cents: 5390, unit: 'pacote' }
          : {
              name: 'Bife acebolado com arroz e fritas',
              prep_time: 35,
              servings: 4,
              difficulty: 'Fácil',
              instructions: ['Tempere a carne.', 'Doure em uma frigideira.', 'Sirva com arroz e fritas.'],
              extras: ['Sal', 'Azeite'],
              tips: 'Sirva logo após o preparo.'
            }
      ];
const prepare = (kind) =>
  source(kind)
    .slice(0, 6)
    .map((row, index) => ({
      ...row,
      id: `${kind}-${index}`,
      category_id: row.category?.id || 'c1',
      category: row.category || { id: 'c1', name: kind === 'products' ? 'Bovinos' : 'Receitas bovinas' },
      image_url: fixture && fs.existsSync(`${fixture}/${kind}-${index}.jpg`) ? `https://epav-review.invalid/${kind}-${index}.jpg` : null
    }));
const products = prepare('products');
const recipes = prepare('recipes');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5177'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5177/EPAVOne/')).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=disabled', '--disable-software-rasterizer']
  });
  const results = [];
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const theme = new URL(location.href).searchParams.get('reviewTheme') || 'light';
    localStorage.setItem('epavone-theme', theme);
    localStorage.setItem('epavone-introduction-v1', 'done');
    window.__motionReview = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      window.__motionReview.push({ target: this.className, frames, duration: options.duration });
      return original.call(this, frames, options);
    };
  });
  for (const width of [320, 390, 768, 1440])
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.unrouteAll();
      page.removeAllListeners('pageerror');
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('https://epav-review.invalid/**', (route) =>
        route.fulfill({
          contentType: 'image/jpeg',
          body: fs.readFileSync(`${fixture}/${new URL(route.request().url()).pathname.slice(1)}`)
        })
      );
      await page.route('**/rest/v1/**', (route) => {
        const table = new URL(route.request().url()).pathname.split('/').at(-1);
        const rows =
          table === 'products'
            ? products
            : table === 'recipes'
              ? recipes
              : table === 'categories'
                ? [...new Map(products.filter((item) => item.category?.id).map((item) => [item.category.id, item.category])).values()]
                : table === 'recipe_ingredients'
                  ? [{ id: 'i1', quantity: 1, product: products[0], recipe: recipes[0] }]
                  : [];
        return route.fulfill({
          contentType: 'application/json',
          headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` },
          body: JSON.stringify(rows.slice(Number(new URL(route.request().url()).searchParams.get('offset') || 0)))
        });
      });
      for (const [section, kind] of [
        ['receitas', 'recipes'],
        ['produtos', 'products']
      ]) {
        await page.goto(`http://127.0.0.1:5177/EPAVOne/?reviewTheme=${theme}#/insights/${section}`);
        const cards = page.locator('.ds-carousel-track > .insights-catalog-card');
        await cards
          .first()
          .waitFor()
          .catch(async (error) => {
            process.stderr.write(`${await page.locator('body').innerText()}\n${JSON.stringify(errors)}\n`);
            throw error;
          });
        await page.evaluate(() => document.fonts.ready);
        await page
          .locator('.insights-catalog-section')
          .first()
          .evaluate((node) => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await page.waitForTimeout(350);
        const layout = await cards.evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            const image = node.querySelector('.insights-image').getBoundingClientRect();
            const title = node.querySelector('h2').getBoundingClientRect();
            const photo = node.querySelector('img')?.getBoundingClientRect();
            const action = node.querySelector('button').getBoundingClientRect();
            return {
              width: box.width,
              imageWidth: image.width,
              photoFits: !photo || Math.abs(photo.height - image.height) < 2,
              titleTop: title.top,
              imageBottom: image.bottom,
              actionHeight: action.height,
              height: box.height,
              titleWeight: Number(getComputedStyle(node.querySelector('h2')).fontWeight),
              overflow: node.scrollWidth > node.clientWidth,
              stitches: node.querySelectorAll('.ds-stitch').length
            };
          })
        );
        assert(
          layout.every(
            (item) => !item.overflow && item.photoFits && item.titleWeight >= 600 && item.actionHeight >= 43 && item.stitches === 1
          ),
          JSON.stringify(layout)
        );
        if (width < 500 && kind === 'recipes')
          assert(
            layout.every((item) => item.width <= 250 && item.height <= 340),
            'Recipe shelves must stay compact'
          );
        if (width < 500 && kind === 'recipes')
          assert(layout[0].titleTop > layout[0].imageBottom, 'Mobile recipe photograph must lead the title');
        assert(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          JSON.stringify({
            width,
            theme,
            section,
            overflow: await page.evaluate(() => ({
              width: innerWidth,
              scroll: document.documentElement.scrollWidth,
              nodes: [...document.querySelectorAll('body *')]
                .map((node) => ({
                  name: node.className,
                  right: node.getBoundingClientRect().right,
                  width: node.getBoundingClientRect().width
                }))
                .filter((node) => node.right > innerWidth + 1 && !String(node.name).includes('stitch'))
                .slice(0, 12)
            }))
          })
        );
        if ([390, 1440].includes(width)) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
          await page.screenshot({ path: `${output}/${kind}-${width}-${theme}.png`, fullPage: true });
        }
        const sectionNode = page.locator('.insights-catalog-section').first();
        const toggle = sectionNode.getByRole('button', { name: /^Ver todos de/ });
        if (await toggle.count()) {
          await toggle.click();
          assert.equal(await sectionNode.locator('.ds-carousel').getAttribute('data-expanded'), 'true');
          assert(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            JSON.stringify({
              width,
              theme,
              section,
              overflow: await page.evaluate(() => ({
                width: innerWidth,
                scroll: document.documentElement.scrollWidth,
                nodes: [...document.querySelectorAll('body *')]
                  .map((node) => ({
                    name: node.className,
                    right: node.getBoundingClientRect().right,
                    width: node.getBoundingClientRect().width
                  }))
                  .filter((node) => node.right > innerWidth + 1 && !String(node.name).includes('stitch'))
                  .slice(0, 12)
              }))
            })
          );
          await sectionNode.getByRole('button', { name: /^Recolher/ }).click();
        }
        const trigger = cards.first().getByRole('button');
        await trigger.click();
        const dialog = page.getByRole('dialog');
        await dialog.waitFor();
        const motion = await page.evaluate(() => window.__motionReview.findLast((item) => item.target.includes('ds-dialog-expanding')));
        assert(
          motion && motion.frames.every((frame) => !frame.transform.includes('scale')) && motion.duration <= 220,
          'Dialog must never stretch or scale'
        );
        await page.waitForTimeout(250);
        if (kind === 'recipes' && fixture)
          assert.equal(await dialog.locator('.recipe-detail-hero img').evaluate((node) => getComputedStyle(node).objectFit), 'cover');
        const geometry = await dialog.evaluate((node) => ({
          width: node.clientWidth,
          scroll: node.scrollWidth,
          bottom: node.getBoundingClientRect().bottom,
          height: node.getBoundingClientRect().height,
          title: node.querySelector('h2').textContent,
          toolbarTop: node.querySelector('.ds-dialog-head').getBoundingClientRect().top
        }));
        assert(geometry.scroll <= geometry.width && geometry.height <= (width < 500 ? 844 : 1000));
        if (width < 500) assert(Math.abs(geometry.bottom - 844) <= 1, 'Mobile detail should sit at the bottom edge');
        if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/${kind}-detail-${width}-${theme}.png` });
        await dialog.locator('.ds-dialog-content').evaluate((node) => {
          node.scrollTop = node.scrollHeight;
        });
        assert(
          Math.abs((await dialog.locator('.ds-dialog-head').boundingBox()).y - geometry.toolbarTop) <= 1,
          'Toolbar must remain visible while reading'
        );
        if (width === 390 && kind === 'recipes') await page.screenshot({ path: `${output}/recipe-method-${theme}.png` });
        if (kind === 'recipes') {
          await dialog.getByRole('button', { name: `Ver produto ${products[0].name}` }).click();
          await dialog.getByRole('heading', { name: products[0].name, exact: true }).waitFor();
          await dialog.getByRole('button', { name: '← Voltar à receita' }).click();
          await dialog.getByRole('heading', { name: recipes[0].name, exact: true }).waitFor();
        }
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'detached' });
        assert(await trigger.evaluate((node) => node === document.activeElement));
        results.push({ width, theme, section, cards: layout.length, ...geometry });
      }
      await page.goto(`http://127.0.0.1:5177/EPAVOne/?reviewTheme=${theme}#/insights`);
      await page.getByRole('heading', { name: 'Ideias para hoje', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(350);
      assert((await page.locator('.insights-catalog-section').count()) >= 2, 'Home must provide real content sections');
      assert.equal(await page.locator('.insights-discovery-hero').count(), 0);
      assert.equal(await page.locator('.insights-discovery-controls > .ds-stitch').count(), 1);
      assert((await page.locator('.ds-carousel-heading > .ds-stitch').count()) >= 2);
      const track = page.locator('.ds-carousel-track').first();
      await track.focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);
      assert(await track.evaluate((node) => node.scrollLeft > 0), 'Carousel must respond to keyboard');
      await page.keyboard.press('Home');
      await page.waitForTimeout(300);
      if (width === 390 && theme === 'light') {
        const box = await track.boundingBox();
        const y = Math.max(90, box.y + Math.min(110, box.height / 2));
        const session = await page.context().newCDPSession(page);
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 280, y }] });
        for (let i = 1; i <= 6; i++) {
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 280 - i * 25, y }] });
          await page.waitForTimeout(20);
        }
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(300);
        assert(await track.evaluate((node) => node.scrollLeft > 0), 'Native touch swipe must move the carousel');
        await session.detach();
      }
      await track.evaluate((node) => node.scrollTo({ left: 0, behavior: 'instant' }));
      await page.evaluate(() => {
        document.activeElement?.blur();
        scrollTo({ top: 0, behavior: 'instant' });
      });
      if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/home-${width}-${theme}.png` });
      await page.getByLabel('Buscar no Insights').fill('inexistente-xyz');
      await page.getByText('Nenhum resultado encontrado', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Limpar busca' }).click();
      await page.getByRole('heading', { name: 'Ideias para hoje', exact: true }).waitFor();
      // Both cold (lazy) and warm app changes must animate real content; Writer state remains mounted.
      await page.evaluate(async () => {
        for (const app of ['planner', 'writer', 'insights']) {
          location.hash = `#/${app}`;
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      });
      const arrivals = await page.evaluate(() =>
        window.__motionReview.filter((item) => item.target.includes('route-frame') && item.frames[0].opacity === 0.72)
      );
      assert(arrivals.length >= 3, 'App changes must animate arriving content');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`http://127.0.0.1:5177/EPAVOne/?reviewTheme=${theme}#/insights/receitas`);
      await page
        .getByRole('button', { name: `Ver receita de ${recipes[0].name}`, exact: true })
        .first()
        .click();
      assert.equal(await page.getByRole('dialog').evaluate((node) => node.getAnimations().length), 0);
      assert.deepEqual(errors, []);
    }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  process.stdout.write(`${JSON.stringify({ scenarios: results.length, themes: 2, widths: 4, errors: 0 })}\n`);
} finally {
  await browser?.close();
  server.kill();
}

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-state-motion';
fs.mkdirSync(output, { recursive: true });
const products = Array.from({ length: 6 }, (_, index) => ({
  id: `product-${index}`,
  name: `Produto Swift ${index}`,
  category_id: 'c1',
  category: { id: 'c1', name: 'Bovinos' },
  regular_price_cents: 2500,
  unit: 'pacote'
}));
const recipes = products.map((product, index) => ({
  id: `recipe-${index}`,
  name: `Receita ${index}`,
  category_id: 'c1',
  category: product.category,
  prep_time: 20,
  servings: 4,
  difficulty: 'Fácil',
  instructions: ['Prepare e sirva.']
}));
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5181'], { stdio: 'ignore' });
const base = 'http://127.0.0.1:5181/EPAVOne/';
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--use-gl=disabled', '--disable-software-rasterizer']
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
          window.__stateMotion = [];
          window.__invalidFields = 0;
          document.addEventListener(
            'invalid',
            () => {
              window.__invalidFields += 1;
            },
            true
          );
          window.turnstile = { render: () => 'fixture', remove: () => {}, reset: () => {} };
          const original = Element.prototype.animate;
          Element.prototype.animate = function (frames, options) {
            window.__stateMotion.push({ target: this.className, frames, duration: options.duration });
            return original.call(this, frames, options);
          };
        },
        { theme }
      );
      await page.route('**/rest/v1/**', (route) => {
        assert.equal(route.request().method(), 'GET', 'Review must not write remote data');
        const table = new URL(route.request().url()).pathname.split('/').at(-1);
        const rows = table === 'recipes' ? recipes : table === 'products' ? products : table === 'categories' ? [products[0].category] : [];
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(rows.slice(Number(new URL(route.request().url()).searchParams.get('offset') || 0))),
          headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` }
        });
      });
      const clear = () =>
        page.evaluate(() => {
          window.__stateMotion = [];
        });
      const motions = (target) => page.evaluate((target) => window.__stateMotion.filter((item) => item.target === target), target);
      await page.goto(`${base}#/insights/receitas`);
      await page
        .getByText('6 receitas encontradas', { exact: true })
        .waitFor()
        .catch(async (error) => {
          process.stderr.write((await page.locator('body').innerText()) + '\n' + JSON.stringify(errors));
          throw error;
        });
      await clear();
      const search = page.getByLabel('Buscar receita', { exact: true });
      await search.fill('Receita 1');
      await page.getByText('1 receita encontrada', { exact: true }).waitFor();
      assert.equal((await motions('insights-results-content')).length, 1);
      assert(await search.evaluate((node) => node === document.activeElement));
      await search.fill('Receita 1 ');
      assert.equal((await motions('insights-results-content')).length, 1, 'Equivalent queries should not replay motion');
      await search.fill('Receita 2');
      await search.fill('Receita 3');
      const resultMotion = await page.locator('.insights-results-content').evaluate((node) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
        return {
          active: node.getAnimations().filter((animation) => animation.playState === 'running').length,
          scaleX: matrix.a,
          scaleY: matrix.d
        };
      });
      assert(resultMotion.active <= 1, 'Rapid searches must cancel the previous arrival');
      assert.equal(resultMotion.scaleX, 1, 'Result text must not stretch');
      assert.equal(resultMotion.scaleY, 1, 'Result text must not stretch');
      if (width === 390 && theme === 'light') await page.screenshot({ path: `${output}/search-mid-motion.png` });
      await search.fill('inexistente');
      await page.getByText('Nenhuma receita encontrada', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
      await page.getByText('6 receitas encontradas', { exact: true }).waitFor();
      await page.goto(`${base}#/insights/produtos`);
      await page.getByText('6 produtos encontrados', { exact: true }).waitFor();
      const section = page.locator('.insights-catalog-section').first();
      const toggle = section.getByRole('button', { name: /Ver todos de/ });
      await clear();
      await toggle.click();
      await section.getByRole('button', { name: /Recolher/ }).waitFor();
      assert.equal((await motions('ds-carousel-track')).length, 1);
      assert.equal(await section.locator('.insights-product-card').count(), 6);
      if (width === 390 && theme === 'light') await page.screenshot({ path: `${output}/carousel-mid-motion.png`, fullPage: true });
      await section.getByRole('button', { name: /Recolher/ }).click();
      assert.equal((await motions('ds-carousel-track')).length, 2);
      await page.evaluate(() => {
        document.documentElement.dataset.reducedMotion = 'true';
      });
      await clear();
      await toggle.click();
      assert.equal((await motions('ds-carousel-track')).length, 0);
      await page.evaluate(() => {
        delete document.documentElement.dataset.reducedMotion;
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await section.getByRole('button', { name: /Recolher/ }).click();
      assert.equal((await motions('ds-carousel-track')).length, 0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await clear();
      await page.getByRole('button', { name: 'Criar uma conta', exact: true }).click();
      await page.getByLabel('Confirmar senha', { exact: true }).waitFor();
      assert.equal((await motions('account-content')).at(-1).frames[0].transform, 'translateX(6px)');
      if (width === 390 && theme === 'light') await page.screenshot({ path: `${output}/account-mid-motion.png` });
      await page.getByRole('button', { name: 'Já tenho credencial', exact: true }).click();
      assert.equal((await motions('account-content')).at(-1).frames[0].transform, 'translateX(-6px)');
      assert.equal(
        await page.evaluate(() => window.__invalidFields),
        0,
        'Switching account mode must not submit or trigger validation popovers'
      );
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await page.waitForTimeout(350);
      assert.equal(
        await page.locator('.insights-results-content').evaluate((node) => node.getAnimations().length),
        0,
        'Arrivals must release their animation after settling'
      );
      assert(await page.getByRole('button', { name: 'Entrar na conta', exact: true }).evaluate((node) => node === document.activeElement));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      assert.deepEqual(errors, []);
      const durations = await page.evaluate(() => window.__stateMotion.map((item) => item.duration));
      assert(durations.every((duration) => duration <= 320));
      if (width === 390 && theme === 'light') {
        // Mount the actual DS component using the same Preact instance as Vite's app.
        await page.evaluate(async () => {
          const { h, render } = await import('/EPAVOne/node_modules/.vite/deps/preact.js');
          const { Progress } = await import('/EPAVOne/src/design-system/components/Progress.jsx');
          const root = document.createElement('div');
          root.id = 'progress-review';
          document.body.append(root);
          window.__setReviewProgress = (value) => render(h(Progress, { label: 'Teste de progresso', value }), root);
          window.__setReviewProgress(20);
        });
        await page.waitForTimeout(250);
        await page.evaluate(() => window.__setReviewProgress(80));
        await page.waitForTimeout(50);
        const fill = page.locator('#progress-review .ds-progress-fill');
        const scale = await fill.evaluate((node) => Number(getComputedStyle(node).transform.match(/matrix\(([^,]+)/)[1]));
        assert(scale > 0.2 && scale < 0.8, 'Progress should interpolate between actual values');
        assert.equal(await page.getByRole('progressbar', { name: 'Teste de progresso' }).getAttribute('aria-valuenow'), '80');
        await page.evaluate(() => {
          document.documentElement.dataset.reducedMotion = 'true';
          window.__setReviewProgress(40);
        });
        await page.waitForTimeout(30);
        assert.equal(await fill.evaluate((node) => getComputedStyle(node).transitionDuration), '0s');
        await page.evaluate(() => document.getElementById('progress-review').remove());
      }
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${output}/products-${width}-${theme}.png`, fullPage: true });
      results.push({ width, theme, errors: errors.length });
      await page.close();
    }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  process.stdout.write(`${JSON.stringify({ scenarios: results.length, errors: 0 })}\n`);
} finally {
  await browser?.close();
  server.kill();
}

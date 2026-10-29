import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { demoData } from '../src/products/planner/repositories/demoData.js';
const { chromium } = createRequire(import.meta.url)(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const output = 'docs/commercial-intelligence-review';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187']);
process.on('exit', () => server.kill());
await new Promise((r) =>
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) r();
  })
);
const browser = await chromium.launch({
  executablePath: process.env.REVIEW_BROWSER,
  headless: true,
  args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader']
});
const categories = [
  { id: 'aves', name: 'Aves' },
  { id: 'side', name: 'Vegetais' },
  { id: 'pescados', name: 'Pescados' }
];
const products = [
  { id: 'p1', product_code: '123', name: 'Filé de peito de frango 1kg', category_id: 'aves', category: categories[0] },
  { id: 'p2', product_code: '456', name: 'Batata rústica 500g', category_id: 'side', category: categories[1] },
  { id: 'p3', name: 'Tilápia 800g', category_id: 'pescados', category: categories[2] }
];
const recipes = [
  {
    id: 'r1',
    name: 'Frango dourado com batata rústica',
    extras: [],
    instructions: ['Doure o frango e asse as batatas. Sirva em seguida.'],
    prep_time: 30,
    servings: 4,
    difficulty: 'Fácil'
  }
];
const links = [
  { recipe_id: 'r1', product_id: 'p1' },
  { recipe_id: 'r1', product_id: 'p2' }
];
const results = [],
  errors = [],
  requests = [];
let inspectedPage;
try {
  for (const [width, theme, mode, reduced] of [
    [1440, 'light', 'balanced', false],
    [390, 'dark', 'balanced', false],
    [601, 'light', 'performance', true],
    [320, 'light', 'fabulous', false],
    [1440, 'dark', 'fabulous', true]
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 768 ? 900 : 1050 },
      reducedMotion: reduced ? 'reduce' : 'no-preference'
    });
    const page = await context.newPage();
    inspectedPage = page;
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/rest/v1/**', async (route) => {
      assert.equal(route.request().method(), 'GET');
      const url = new URL(route.request().url());
      requests.push(url.pathname);
      const table = url.pathname.split('/').at(-1);
      let rows = { products, categories, recipes, recipe_ingredients: links }[table] || [];
      if (table === 'recipe_ingredients' && url.searchParams.has('recipe_id'))
        rows = products.slice(0, 2).map((product, i) => ({ id: 'i' + i, quantity: 1, product }));
      const total = rows.length,
        offset = Number(url.searchParams.get('offset') || 0),
        limit = Number(url.searchParams.get('limit') || 200);
      rows = rows.slice(offset, offset + limit);
      await route.fulfill({ status: 200, json: rows, headers: { 'content-range': `${offset}-${offset + rows.length - 1}/${total}` } });
    });
    await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, json: { message: 'Offline visual fixture' } }));
    const seed = demoData('2026-10-28');
    seed.commitments[0].due = '2026-10-27';
    await page.addInitScript(
      ({ seed, theme, mode }) => {
        localStorage.setItem('epavone-introduction-v1', 'done');
        localStorage.setItem('epavone-tutorial-v1', 'done');
        localStorage.setItem('epavone-planner-demo-v1', JSON.stringify(seed));
        localStorage.setItem('epavone-theme', theme);
        localStorage.setItem('epavone-preferences', JSON.stringify({ performanceMode: mode }));
        sessionStorage.setItem('epavone-planner-week', '2026-10-26');
        const Original = Date;
        globalThis.Date = class extends Original {
          constructor(...args) {
            super(...(args.length ? args : ['2026-10-28T15:00:00Z']));
          }
          static now() {
            return new Original('2026-10-28T15:00:00Z').getTime();
          }
        };
      },
      { seed, theme, mode }
    );
    const base = 'http://127.0.0.1:5187/EPAVOne/';
    await page.goto(base + '#/planner');
    await page.getByLabel('Prioridades explicadas').waitFor();
    await page.waitForFunction(
      () => document.querySelector('[aria-label="Prioridades explicadas"]')?.getAttribute('aria-busy') === 'false'
    );
    await page.evaluate(() => document.fonts.ready);
    for (const route of ['', '/semana', '/clientes', '/clientes/demo-1/oportunidades', '/resultados']) {
      await page.goto(base + '#/planner' + route);
      await page.locator('.planner-panel').waitFor();
      await page.getByLabel('Carregando planejamento').waitFor({ state: 'hidden' });
      if (!route || route === '/semana')
        await page.waitForFunction(
          () => document.querySelector('[aria-label="Prioridades explicadas"]')?.getAttribute('aria-busy') === 'false'
        );
      if (route.endsWith('oportunidades')) await page.getByRole('link', { name: 'Consultar produto' }).first().waitFor();
      const info = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clipped: [...document.querySelectorAll('.planner-intelligence-row > div,.planner-offer > div')].filter(
          (n) => n.scrollWidth > n.clientWidth + 1
        ).length,
        modes: document.documentElement.dataset.performanceMode,
        priority: document.querySelector('[aria-label="Prioridades explicadas"]')?.textContent,
        animations: document.getAnimations().filter((a) => a.playState === 'running').length
      }));
      assert.ok(info.scrollWidth <= width, `Overflow ${width} ${route}`);
      assert.equal(info.clipped, 0);
      results.push({ width, theme, mode, reduced, route, ...info });
      const capture =
        (width === 1440 && theme === 'light' && ['', '/clientes/demo-1/oportunidades'].includes(route)) ||
        (width === 390 && ['', '/clientes/demo-1/oportunidades'].includes(route)) ||
        (width === 601 && route === '/semana');
      if (capture)
        await page.screenshot({
          path: `${output}/${route.includes('oportunidades') ? 'perfil' : route ? 'semana' : 'inicio'}-${width}-${theme}.png`,
          fullPage: true
        });
    }
    // Functional keyboard activation: native anchor Enter reaches the existing Insights dialog.
    await page.goto(base + '#/planner/clientes/demo-1/oportunidades');
    const recipe = page.getByRole('link', { name: 'Conferir receita' });
    await recipe.waitFor();
    await page.waitForTimeout(120);
    await recipe.press('Enter');
    await page.getByRole('dialog').waitFor();
    assert.match(await page.getByRole('dialog').innerText(), /Frango dourado/);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const publicRequests = requests.filter((p) => p.endsWith('/products')).length;
    assert.ok(publicRequests > 0);
    await context.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${output}/browser-results.json`,
    JSON.stringify({ browser: browser.version(), synthetic: true, results, errors, requests }, null, 2)
  );
  process.stdout.write(`Visual matrix passed: ${results.length} screens; no overflow or JS errors.\n`);
} catch (e) {
  if (inspectedPage && !inspectedPage.isClosed()) await inspectedPage.screenshot({ path: '/tmp/epav-review-failure.png', fullPage: true });
  throw e;
} finally {
  await browser.close();
  server.kill();
}

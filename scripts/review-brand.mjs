import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const output = 'docs/brand-review';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:5175/EPAVOne/')).ok) break; } catch { /* wait for Vite */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.REVIEW_BROWSER, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    const theme = new URLSearchParams(location.search).get('reviewTheme');
    if (theme) localStorage.setItem('epavone-theme', theme);
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const categories = [{ id: 'aves', name: 'Aves' }];
  const products = ['Filé de frango Swift 1 kg', 'Peito de frango em cubos 500 g', 'Tiras de frango Swift 400 g', 'Frango a passarinho 1 kg'].map((name, i) => ({ id: `p${i}`, name, product_code: `${1000+i}`, category_id: 'aves', category: categories[0], unit: 'pacote', price_cents: 2590, regular_price_cents: 2590, promo_price_cents: 2290, promo_min_quantity: 2, price_status: 'ok' }));
  const recipes = ['Frango assado para o almoço em família', 'Frango cremoso com legumes', 'Salada com tiras de frango', 'Frango ao molho de limão'].map((name, i) => ({ id: `r${i}`, name, category_id: 'aves', category: categories[0], prep_time: 25, servings: 4, instructions: ['Separe os ingredientes.', 'Cozinhe completamente.'], featured: i === 0 }));
  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url());
    const table = url.pathname.split('/').at(-1);
    const rows = ({ products, recipes, categories })[table] || [];
    const offset = Number(url.searchParams.get('offset') || 0);
    const selected = rows.slice(offset, offset + Number(url.searchParams.get('limit') || 200));
    await route.fulfill({ contentType: 'application/json', headers: { 'content-range': `${offset}-${offset+selected.length}/${rows.length}` }, body: JSON.stringify(selected) });
  });
  const routes = ['', 'insights', 'insights/receitas', 'insights/produtos', 'insights/criacao', 'planner', 'planner/semana', 'planner/clientes', 'planner/oportunidades', 'planner/desempenho', 'writer', 'settings'];
  const results = [];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await page.goto('http://127.0.0.1:5175/EPAVOne/');
      await page.evaluate(value => { window.name = `epav-review:${value}`; }, theme);
      for (const route of routes) {
        await page.goto(`http://127.0.0.1:5175/EPAVOne/?reviewTheme=${theme}#/${route}`);
        await page.locator('h1:visible').first().waitFor();
        await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
        await page.evaluate(() => document.fonts.ready);
        if (route.startsWith('insights') && !route.includes('criacao')) await page.waitForFunction(() => !document.querySelector('.insights-loading'));
        await page.waitForTimeout(150);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert(overflow <= 1, `${route} ${width} ${theme}: overflow ${overflow}`);
        const brokenLogos = await page.locator('.ds-app-logo img').evaluateAll(nodes => nodes.filter(node => !node.complete || !node.naturalWidth).length);
        assert.equal(brokenLogos, 0, 'Missing logo asset');
        results.push({ route: route || 'one', width, theme, overflow, brokenLogos });
        if (['', 'insights', 'planner', 'writer'].includes(route) && [390, 1440].includes(width)) {
          await page.screenshot({ path: `${output}/${route || 'one'}-${width}-${theme}.png`, fullPage: true });
        }
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => localStorage.setItem('epavone-preferences', JSON.stringify({ navigation: 'vertical' })));
  await page.reload();
  assert.equal(await page.getByRole('tablist').getAttribute('aria-orientation'), 'vertical');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${output}/sidebar-dark.png`, fullPage: true });
  await page.evaluate(() => localStorage.removeItem('epavone-preferences'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const duration = await page.locator('.route-frame:visible').first().evaluate(node => getComputedStyle(node).animationName);
  assert.equal(duration, 'none');
  assert.deepEqual(errors, []);
  fs.writeFileSync(`${output}/results.json`, JSON.stringify({ matrix: results, pageErrors: errors, sidebar: 'passed', reducedMotion: 'passed', catalog: 'fixture, no hosted writes' }, null, 2));
} finally {
  await browser?.close();
  server.kill();
}

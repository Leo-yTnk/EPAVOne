import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const output = process.env.BENCH_OUTPUT || '/tmp/epav-performance-modes';
fs.mkdirSync(output, { recursive: true });
const root = path.resolve(process.env.BENCH_DIST || 'dist');
const cats = Array.from({ length: 8 }, (_, i) => ({
  id: 'c' + i,
  name: ['Bovinos', 'Aves', 'Pescados', 'Suínos', 'Lanches', 'Doces', 'Vegetais', 'Outros'][i]
}));
const products = Array.from({ length: 1002 }, (_, i) => ({
  id: 'p' + i,
  name: 'Produto Swift ' + String(i).padStart(4, '0'),
  category_id: cats[i % 8].id,
  category: cats[i % 8],
  regular_price_cents: 2590,
  unit: 'pacote'
}));
const recipes = Array.from({ length: 42 }, (_, i) => ({
  id: 'r' + i,
  name: 'Receita ' + i,
  category_id: 'c0',
  category: cats[0],
  prep_time: 20,
  servings: 4,
  difficulty: 'Fácil',
  instructions: ['Prepare e sirva.']
}));
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/EPAVOne\/?/, ''));
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader(
    'Content-Type',
    file.endsWith('.js')
      ? 'application/javascript'
      : file.endsWith('.css')
        ? 'text/css'
        : file.endsWith('.svg')
          ? 'image/svg+xml'
          : 'text/html'
  );
  fs.createReadStream(file).pipe(res);
});
const median = (a) => [...a].sort((a, b) => a - b)[Math.floor(a.length / 2)];
(async () => {
  await new Promise((r) => server.listen(5199, '127.0.0.1', r));
  const b = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=512', '--use-gl=angle', '--use-angle=swiftshader'],
    env: process.env
  });
  let rows = [];
  for (let run = 0; run < 3; run++) {
    let ctx = await b.newContext({ viewport: { width: 601, height: 1007 }, deviceScaleFactor: 1.33, isMobile: true, hasTouch: true });
    let p = await ctx.newPage();
    let errors = [];
    p.on('pageerror', (e) => {
      errors.push(e.message);
      process.stderr.write(e.message + '\n');
    });
    p.on('console', (m) => {
      if (m.type() === 'error') process.stderr.write(m.text() + '\n');
    });
    await p.addInitScript((MODE) => {
      localStorage.setItem('epavone-tutorial-v1', 'done');
      localStorage.setItem('epavone-preferences', JSON.stringify({ performanceMode: MODE }));
      window.__gaps = [];
      window.__long = [];
      let last;
      requestAnimationFrame(function f(t) {
        if (last) window.__gaps.push(t - last);
        last = t;
        requestAnimationFrame(f);
      });
      new PerformanceObserver((l) => window.__long.push(...l.getEntries().map((x) => x.duration))).observe({ type: 'longtask' });
    }, process.env.BENCH_MODE || 'balanced');
    await p.route('**/rest/v1/**', (route) => {
      if (route.request().method() !== 'GET') throw new Error('Benchmark forbids remote writes.');
      let u = new URL(route.request().url()),
        table = u.pathname.split('/').pop(),
        data = table === 'products' ? products : table === 'recipes' ? recipes : table === 'categories' ? cats : [];
      let offset = Number(u.searchParams.get('offset') || 0),
        limit = Number(u.searchParams.get('limit') || 1000);
      return route.fulfill({
        json: data.slice(offset, offset + limit),
        headers: { 'content-range': `${offset}-${Math.min(data.length, offset + limit) - 1}/${data.length}` }
      });
    });
    let cdp = await ctx.newCDPSession(p);
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    for (const route of ['/insights/produtos']) {
      let start = Date.now();
      await p.goto('http://127.0.0.1:5199/EPAVOne/#' + route);
      await p.locator('main h1').first().waitFor({ timeout: 5000 });
      if (route.includes('produtos')) await p.getByText('1002 produtos encontrados', { exact: true }).waitFor();
      if (route.includes('receitas')) await p.getByText('42 receitas encontradas', { exact: true }).waitFor();
      let ready = Date.now() - start;
      await p.waitForTimeout(400);
      let queries = [];
      await p.evaluate(() => {
        window.__gaps = [];
        window.__long = [];
      });
      if (route.includes('produtos')) {
        for (let q of ['0', '00', '001', '00', '', '9', '99', '999', '']) {
          let t = Date.now();
          await p.locator('#insights-search').fill(q);
          const count = products.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())).length;
          await p.getByText(`${count} ${count === 1 ? 'produto encontrado' : 'produtos encontrados'}`, { exact: true }).waitFor();
          await p.waitForFunction(() => document.querySelector('.insights-results-content')?.getAttribute('aria-busy') !== 'true');
          await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          queries.push(Date.now() - t);
        }
      }
      await p.waitForTimeout(400);
      let m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
      let v = await p.evaluate(() => ({
        nodes: document.querySelectorAll('*').length,
        gaps: window.__gaps,
        long: window.__long,
        paint: performance.getEntriesByType('paint').map((x) => ({ name: x.name, start: x.startTime }))
      }));
      rows.push({
        mode: process.env.BENCH_MODE || 'balanced',
        run,
        route,
        ready,
        heapMB: m.JSHeapUsedSize / 1048576,
        nodes: v.nodes,
        searchMedian: queries.length ? median(queries) : null,
        searchMax: Math.max(0, ...queries),
        frameP95: v.gaps.sort((a, b) => a - b)[Math.floor(v.gaps.length * 0.95)],
        longTasks: v.long.length,
        maxTask: Math.max(0, ...v.long),
        errors,
        paint: v.paint
      });
      process.stdout.write(JSON.stringify(rows.at(-1)) + '\n');
    }
    if (run === 0) {
      await p.screenshot({ path: path.join(output, (process.env.BENCH_MODE || 'balanced') + '-catalog.png') });
      await p.getByRole('button', { name: 'Ver todos de Bovinos', exact: true }).click();
      await p.locator('#section-products-category-c0').scrollIntoViewIfNeeded();
      await p.waitForTimeout(250);
      await p.screenshot({ path: path.join(output, (process.env.BENCH_MODE || 'balanced') + '-expanded.png') });
      const slots = p.locator('#section-products-category-c0 .ds-deferred-item');
      if (await slots.count()) {
        await slots.last().scrollIntoViewIfNeeded();
        await p.getByRole('button', { name: 'Ver detalhes de Produto Swift 1000', exact: true }).waitFor();
      }
      await p.getByRole('button', { name: 'Ver detalhes de Produto Swift 1000', exact: true }).click();
      await p.getByRole('dialog').waitFor();
      await p.keyboard.press('Escape');
      await p.waitForTimeout(200);
      process.stdout.write('QA: expansion, end-of-section and details reached\n');
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(output, (process.env.BENCH_MODE || 'balanced') + '-results.json'), JSON.stringify(rows, null, 2));
  await b.close();
  server.close();
})().catch((e) => {
  process.stderr.write(String(e) + '\n');
  server.close();
  process.exit(1);
});

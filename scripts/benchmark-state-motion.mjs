import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-motion-benchmark';
const baseline = process.env.BASELINE_DIST;
if (!baseline) throw new Error('Set BASELINE_DIST to the production build before these changes.');
fs.mkdirSync(output, { recursive: true });
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};
async function serve(directory) {
  const root = path.resolve(directory);
  const server = createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/EPAVOne\/?/, '');
    let file = path.resolve(root, relative || 'index.html');
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/EPAVOne/` };
}
const recipes = Array.from({ length: 120 }, (_, index) => ({
  id: `recipe-${index}`,
  name: `Receita ${String(index).padStart(3, '0')}`,
  category_id: 'c1',
  category: { id: 'c1', name: 'Bovinos' },
  prep_time: 20,
  servings: 4,
  difficulty: 'Fácil',
  instructions: ['Prepare e sirva.']
}));
const products = Array.from({ length: 48 }, (_, index) => ({
  id: `product-${index}`,
  name: `Produto Swift ${String(index).padStart(3, '0')}`,
  category_id: 'c1',
  category: recipes[0].category,
  regular_price_cents: 2500,
  unit: 'pacote'
}));
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const quantile = (values, fraction) =>
  [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * fraction))] || 0;
const widths = (process.env.BENCH_WIDTHS || '390,1440').split(',').map(Number);
const throttles = (process.env.BENCH_THROTTLES || '1,4').split(',').map(Number);
const servers = { baseline: await serve(baseline), candidate: await serve('dist') };
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--use-gl=disabled', '--disable-software-rasterizer']
  });
  const raw = [];
  const attempts = Number(process.env.BENCH_REPEATS || 3);
  for (const width of widths)
    for (const throttle of throttles)
      for (let repeat = 0; repeat < attempts; repeat++) {
        // Alternate order to reduce systematic effects from warming and host drift.
        for (const variant of repeat % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.addInitScript(() => {
            localStorage.setItem('epavone-introduction-v1', 'done');
            window.turnstile = { render: () => 'fixture', remove: () => {}, reset: () => {} };
            window.__motionMetrics = { gaps: [], longTasks: [], animations: [], measuring: false, marks: [], tracedTasks: [] };
            const original = Element.prototype.animate;
            Element.prototype.animate = function (frames, options) {
              window.__motionMetrics.animations.push({ target: this.className, frames, duration: options.duration });
              return original.call(this, frames, options);
            };
            new PerformanceObserver((list) => {
              if (window.__motionMetrics.measuring) {
                window.__motionMetrics.longTasks.push(...list.getEntries().map((entry) => entry.duration));
                for (const entry of list.getEntries()) {
                  const mark = window.__motionMetrics.marks.findLast((mark) => mark.time <= entry.startTime);
                  window.__motionMetrics.tracedTasks.push({ duration: entry.duration, phase: mark?.phase || 'other' });
                }
              }
            }).observe({ type: 'longtask', buffered: false });
            let last;
            const frame = (now) => {
              if (window.__motionMetrics.measuring && last !== undefined) window.__motionMetrics.gaps.push(now - last);
              last = now;
              requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
          });
          await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
          await page.route('**/rest/v1/**', (route) => {
            assert.equal(route.request().method(), 'GET', 'No remote writes during benchmarking');
            const url = new URL(route.request().url());
            const table = url.pathname.split('/').at(-1);
            const rows =
              table === 'recipes' ? recipes : table === 'products' ? products : table === 'categories' ? [recipes[0].category] : [];
            const offset = Number(url.searchParams.get('offset') || 0);
            return route.fulfill({
              contentType: 'application/json',
              body: JSON.stringify(rows.slice(offset)),
              headers: { 'content-range': `0-${rows.length - 1}/${rows.length}`, 'access-control-expose-headers': 'content-range' }
            });
          });
          const session = await context.newCDPSession(page);
          await session.send('Performance.enable');
          await session.send('Emulation.setCPUThrottlingRate', { rate: throttle });
          const base = servers[variant].url;
          await page.goto(`${base}#/insights/receitas`);
          await page.getByText('120 receitas encontradas', { exact: true }).waitFor();
          // Preload both apps and account before measuring. No dev server/HMR overhead.
          await page.evaluate(() => {
            location.hash = '#/insights/produtos';
          });
          await page.getByText('48 produtos encontrados', { exact: true }).waitFor();
          await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
          await page.getByRole('dialog').waitFor();
          await page.keyboard.press('Escape');
          await page.evaluate(() => {
            location.hash = '#/insights/receitas';
          });
          await page.getByText('120 receitas encontradas', { exact: true }).waitFor();
          await page.waitForTimeout(500);
          const metrics = async () =>
            Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map((item) => [item.name, item.value]));
          const start = await metrics();
          await page.evaluate(() => {
            Object.assign(window.__motionMetrics, { gaps: [], longTasks: [], animations: [], measuring: true });
          });
          const wallStart = performance.now();
          // Fixed-paced input, not a throughput race that performs different work per version.
          await page.evaluate(async () => {
            const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            const input = document.querySelector('#insights-recipe-search');
            for (const query of ['0', '01', '010', '01', '0', '', '1', '11', 'inexistente', '']) {
              window.__motionMetrics.marks.push({ phase: 'search:' + query, time: performance.now() });
              input.value = query;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              await pause(160);
            }
          });
          assert.equal(await page.locator('.insights-recipes-collection > article').count(), 120);
          const detailStart = await metrics();
          const detailRounds = Number(process.env.BENCH_DETAILS_ROUNDS || 0);
          for (let round = 0; round < detailRounds; round++) {
            await page.evaluate(() => window.__motionMetrics.marks.push({ phase: 'detail-open', time: performance.now() }));
            await page.getByRole('button', { name: 'Ver receita de Receita 000', exact: true }).click();
            await page.getByRole('dialog').waitFor();
            await page.waitForTimeout(240);
            await page.evaluate(() => window.__motionMetrics.marks.push({ phase: 'detail-close', time: performance.now() }));
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
          }
          const detailEnd = await metrics();
          await page.evaluate(() => {
            location.hash = '#/insights/produtos';
          });
          await page.getByText('48 produtos encontrados', { exact: true }).waitFor();
          await page.evaluate(async () => {
            const section = document.querySelector('.insights-catalog-section');
            for (let index = 0; index < 8; index++) {
              window.__motionMetrics.marks.push({ phase: 'carousel:' + index, time: performance.now() });
              section.querySelector('button[aria-expanded]').click();
              await new Promise((resolve) => setTimeout(resolve, 180));
            }
          });
          await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
          await page.getByRole('dialog').waitFor();
          await page.evaluate(async () => {
            for (let index = 0; index < 6; index++) {
              window.__motionMetrics.marks.push({ phase: 'account:' + index, time: performance.now() });
              [...document.querySelectorAll('.account-content button')]
                .find((button) => /^(Criar uma conta|Já tenho credencial)$/.test(button.textContent))
                .click();
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(450);
          const wall = (performance.now() - wallStart) / 1000;
          const end = await metrics();
          const samples = await page.evaluate(() => {
            window.__motionMetrics.measuring = false;
            return window.__motionMetrics;
          });
          const idleStart = await metrics();
          await page.waitForTimeout(1500);
          const idleEnd = await metrics();
          const activeAnimations = await page.evaluate(
            () => document.getAnimations().filter((animation) => animation.playState === 'running').length
          );
          assert.equal(activeAnimations, 0, 'No continuing animation after settling');
          assert.deepEqual(errors, []);
          const row = {
            width,
            throttle,
            repeat,
            variant,
            wall,
            mainCorePercent: ((end.TaskDuration - start.TaskDuration) / wall) * 100,
            mainTaskMs: (end.TaskDuration - start.TaskDuration) * 1000,
            detailMainMs: detailRounds ? (detailEnd.TaskDuration - detailStart.TaskDuration) * 1000 : null,
            scriptMs: (end.ScriptDuration - start.ScriptDuration) * 1000,
            layoutMs: (end.LayoutDuration - start.LayoutDuration) * 1000,
            styleMs: (end.RecalcStyleDuration - start.RecalcStyleDuration) * 1000,
            frames: samples.gaps.length,
            frameP95: quantile(samples.gaps, 0.95),
            slowFrames: samples.gaps.filter((gap) => gap > 34).length,
            longTasks: samples.longTasks.length,
            maxLongTaskMs: Math.max(0, ...samples.longTasks),
            tracedTasks: samples.tracedTasks,
            blockingMs: samples.longTasks.reduce((sum, duration) => sum + duration - 50, 0),
            idleMainMs: (idleEnd.TaskDuration - idleStart.TaskDuration) * 1000,
            heapMiB: end.JSHeapUsedSize / 1024 ** 2,
            activeAnimations,
            contentArrivals: samples.animations.filter((item) =>
              ['insights-results-content', 'ds-carousel-track', 'account-content'].includes(item.target)
            ).length
          };
          raw.push(row);
          fs.writeFileSync(`${output}/raw.json`, JSON.stringify(raw, null, 2));
          process.stdout.write(`${JSON.stringify(row)}\n`);
          await context.close();
        }
      }
  const summary = [];
  for (const width of widths)
    for (const throttle of throttles) {
      const rows = raw.filter((row) => row.width === width && row.throttle === throttle);
      const delta = [];
      for (let repeat = 0; repeat < attempts; repeat++) {
        const a = rows.find((row) => row.variant === 'baseline' && row.repeat === repeat);
        const b = rows.find((row) => row.variant === 'candidate' && row.repeat === repeat);
        delta.push(b.mainCorePercent - a.mainCorePercent);
      }
      const values = Object.fromEntries(
        ['baseline', 'candidate'].map((variant) => {
          const trials = rows.filter((row) => row.variant === variant);
          return [
            variant,
            Object.fromEntries(
              [
                'mainCorePercent',
                'mainTaskMs',
                'detailMainMs',
                'scriptMs',
                'layoutMs',
                'styleMs',
                'frameP95',
                'slowFrames',
                'blockingMs',
                'idleMainMs',
                'heapMiB'
              ].map((key) => [key, median(trials.map((row) => row[key]))])
            )
          ];
        })
      );
      summary.push({
        width,
        throttle,
        ...values,
        additionalCorePoints: median(delta),
        deltaRange: [Math.min(...delta), Math.max(...delta)],
        // Main-thread core points: explicit study scale, not the device's OS CPU percentage.
        // CPU throttling is a scheduling simulation and does not measure a physical device.
        cpuScore: Math.min(100, Math.max(1, Math.round(Math.max(0, median(delta)))))
      });
    }
  fs.writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify({ summary })}\n`);
} finally {
  await browser?.close();
  for (const { server } of Object.values(servers)) server.close();
}

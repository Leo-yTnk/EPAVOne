import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const browser = await chromium.launch({
  executablePath: process.env.REVIEW_BROWSER,
  headless: true,
  args: ['--no-sandbox', '--no-zygote', '--single-process', '--disable-dev-shm-usage']
});
const servers = [];
process.on('exit', () => servers.forEach((s) => s.kill()));
const results = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.route('**/rest/v1/**', (r) => r.fulfill({ json: [] }));
for (const [version, cwd, port] of [
  ['before', process.env.REVIEW_BASELINE, 5181],
  ['after', process.cwd(), 5182]
]) {
  if (!cwd) throw new Error('Set REVIEW_BASELINE to a clean checkout of the base commit with node_modules available.');
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port)], { cwd });
  servers.push(server);
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => {
      if (d.toString().includes('Local:')) resolve();
    });
    server.on('error', reject);
  });

  await page.goto(`http://127.0.0.1:${port}/EPAVOne/#/planner/clientes`);
  await page.getByLabel('Buscar na carteira').waitFor();
  await page.evaluate(async () => {
    const { demoData } = await import('/EPAVOne/src/products/planner/repositories/demoData.js');
    const seed = demoData();
    seed.customers = Array.from({ length: 200 }, (_, i) => ({
      ...seed.customers[i % 12],
      id: 'bench-' + i,
      name: 'Cliente de benchmark ' + i
    }));
    seed.interactions = [];
    seed.commitments = [];
    seed.weeks.forEach((w) => {
      w.queue = [];
    });
    localStorage.setItem('epavone-planner-demo-v1', JSON.stringify(seed));
  });
  await page.reload();
  await page.getByLabel('Buscar na carteira').waitFor();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((i) => [i.name, i.value]));
  for (const rate of [1, 4])
    for (let run = 0; run < 3; run++) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const start = await metrics();
      const intervals = await page.evaluate(async () => {
        const input = document.querySelector('#planner-search'),
          intervals = [];
        for (let i = 0; i < 20; i++) {
          const start = performance.now();
          input.value = i % 2 ? 'Cliente' : 'benchmark 1';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          intervals.push(performance.now() - start);
        }
        return intervals;
      });
      const end = await metrics();
      intervals.sort((a, b) => a - b);
      assert.equal(await page.locator('.planner-client').count(), 8);
      results.push({
        version,
        rate,
        run,
        searches: 20,
        taskMs: Math.round((end.TaskDuration - start.TaskDuration) * 1000),
        scriptMs: Math.round((end.ScriptDuration - start.ScriptDuration) * 1000),
        layoutMs: Math.round((end.LayoutDuration - start.LayoutDuration) * 1000),
        medianTwoFramesMs: Math.round(intervals[10]),
        p95TwoFramesMs: Math.round(intervals[18])
      });
    }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp.detach();
  server.kill();
}
fs.writeFileSync(
  'docs/planner-redesign/performance.json',
  JSON.stringify(
    {
      environment:
        'Chromium headless, dev builds, mobile 390 px, 200 local demo customers, 20 searches per run, 3 runs per condition; timings include two requestAnimationFrames and do not measure total device CPU.',
      results
    },
    null,
    2
  )
);
process.stdout.write(JSON.stringify(results, null, 2) + '\n');
await browser.close();

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5188']);
process.on('exit', () => server.kill());
await new Promise((r) =>
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) r();
  })
);
const browser = await chromium.launch({
  executablePath: process.env.REVIEW_BROWSER,
  headless: true,
  args: [
    '--no-sandbox',
    '--no-zygote',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--js-flags=--max-old-space-size=512'
  ]
});
try {
  const page = await browser.newPage();
  await page.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, json: [], headers: { 'content-range': '*/0' } }));
  await page.goto('http://127.0.0.1:5188/EPAVOne/');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const result = await page.evaluate(async () => {
    const { catalogIndex, matchAllCustomers, matchCustomersInChunks } = await import('/EPAVOne/src/shared/intelligence/catalog.js');
    const { rankCustomers } = await import('/EPAVOne/src/shared/intelligence/priority.js');
    const categories = ['aves', 'bovinos', 'suínos', 'pescados', 'padaria', 'sobremesas', 'complementos', 'feijão'];
    const customers = Array.from({ length: 200 }, (_, i) => ({
      id: 'c' + i,
      name: 'Cliente ' + i,
      frequencyDays: 14,
      intent: false,
      preferences: categories.filter((_, j) => i & (1 << j)),
      restrictions: []
    }));
    const interactions = customers.flatMap((c) =>
      Array.from({ length: 20 }, (_, i) => ({ id: c.id + i, customerId: c.id, date: '2026-10-01', outcome: 'bought' }))
    );
    const state = { customers, interactions, commitments: [] },
      week = { id: '2026-10-26', queue: [] };
    const catalog = {
      products: Array.from({ length: 1002 }, (_, i) => ({ id: 'p' + i, name: 'Produto ' + i, category: { name: categories[i % 8] } })),
      recipes: [],
      links: []
    };
    for (let i = 0; i < 100; i++) {
      catalog.recipes.push({ id: 'r' + i, name: 'Receita ' + i, extras: [] });
      for (let j = 0; j < 3; j++) catalog.links.push({ recipe_id: 'r' + i, product_id: 'p' + (i * 3 + j) });
    }
    const rounds = [];
    for (let run = 0; run < 15; run++) {
      await new Promise((r) => setTimeout(r, 0));
      const start = performance.now();
      const index = catalogIndex(catalog, null, '2026-10-28');
      const indexed = performance.now();
      const matches = matchAllCustomers(customers, index);
      const matched = performance.now();
      rankCustomers(state, week, '2026-10-28', matches);
      rounds.push({
        indexMs: indexed - start,
        matchMs: matched - indexed,
        rankMs: performance.now() - matched,
        totalMs: performance.now() - start
      });
    }
    const chunked = [];
    for (let run = 0; run < 15; run++) {
      await new Promise((r) => setTimeout(r, 0));
      const slices = [],
        start = performance.now();
      let sliceStart = start;
      const index = catalogIndex(catalog, null, '2026-10-28');
      const matches = await matchCustomersInChunks(customers, index, {
        yieldTask: async () => {
          slices.push(performance.now() - sliceStart);
          await new Promise((r) => setTimeout(r, 0));
          sliceStart = performance.now();
        }
      });
      // Ranking happens on a separate UI commit, so measure it as a separate task.
      slices.push(performance.now() - sliceStart);
      await new Promise((r) => setTimeout(r, 0));
      sliceStart = performance.now();
      rankCustomers(state, week, '2026-10-28', matches);
      slices.push(performance.now() - sliceStart);
      chunked.push({
        wallMs: performance.now() - start,
        computeMs: slices.reduce((a, b) => a + b, 0),
        maxTaskMs: Math.max(...slices),
        slices
      });
    }
    const ordered = rounds.map((r) => r.totalMs).sort((a, b) => a - b);
    return {
      customers: 200,
      distinctProfiles: 200,
      products: 1002,
      recipes: 100,
      interactions: 4000,
      rounds,
      chunked,
      medianMs: ordered[7],
      p95Ms: ordered[14]
    };
  });
  result.environment = `Chromium ${browser.version()}, CPU 6x, V8 heap ceiling 512MB; simulated host, not Galaxy Tab A7 Lite or Android RAM`;
  fs.writeFileSync('docs/commercial-intelligence-review/browser-performance.json', JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify({ medianMs: result.medianMs, p95Ms: result.p95Ms }) + '\n');
} finally {
  await browser.close();
  server.kill();
}

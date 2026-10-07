import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175'], {
  stdio: ['ignore', 'pipe', 'pipe']
});
const output = 'docs/migration-review';
fs.mkdirSync(output, { recursive: true });
const results = [];
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve();
    });
    server.on('error', reject);
  });
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    headless: true,
    args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=disabled', '--disable-gpu', '--disable-software-rasterizer']
  });
  for (const [width, theme] of [
    [1440, 'light'],
    [390, 'dark']
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, colorScheme: theme });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((value) => localStorage.setItem('epavone-theme', value), theme);
    // Local CAPTCHA fixture for visual layout; never submit to hosted Auth.
    await page.route('https://challenges.cloudflare.com/**', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: "window.turnstile={render:(el)=>{el.textContent='Verificação de segurança · fixture visual';return 1},remove:()=>{}}"
      })
    );
    await page.goto('http://127.0.0.1:5175/EPAVOne/#/settings');
    await page.getByRole('button', { name: 'Entrar na conta', exact: true }).first().click();
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome', { exact: true }).fill('Conta de teste visual');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        document
          .getAnimations()
          .filter((item) => item.effect?.getTiming().iterations !== Infinity)
          .map((item) => item.finished.catch(() => {}))
      );
    });
    await page.screenshot({ path: `${output}/signup-${width}-${theme}.png`, fullPage: true });
    results.push({
      view: 'signup',
      width,
      theme,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      errors
    });
    await page.goto('http://127.0.0.1:5175/EPAVOne/#/planner');
    await page.getByText('Modo demonstração', { exact: true }).waitFor();
    await page.evaluate(async () => {
      const [{ render }, { PlannerRoutes }] = await Promise.all([
        import((await (await fetch('/EPAVOne/src/main.jsx')).text()).match(/from ["']([^"']*\/preact\.js[^"']*)/)[1]),
        import('/EPAVOne/src/products/planner/PlannerRoutes.jsx')
      ]);
      const runtime = await import(
        (await (await fetch('/EPAVOne/src/main.jsx')).text()).match(/from ["']([^"']*preact_jsx-dev-runtime.js[^"']*)/)[1]
      );
      const h = (type, props, ...children) =>
        runtime.jsxDEV(
          type,
          { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
          undefined,
          children.length > 1,
          undefined,
          undefined
        );
      const state = {
        version: 1,
        customers: [],
        interactions: [],
        commitments: [],
        offers: [],
        weeks: [],
        sales: [
          {
            id: 'fixture',
            sale_date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date()),
            value: '100.00',
            ipc: 4
          }
        ]
      };
      document.documentElement.dataset.product = 'planner';
      render(
        h(PlannerRoutes, {
          route: { segments: ['desempenho'] },
          account: { session: { user: { id: 'fixture' } } },
          service: { load: async () => ({ state }) }
        }),
        document.getElementById('app')
      );
    });
    await page.getByText('Vendas confirmadas no banco · semana selecionada').waitFor();
    await page.screenshot({ path: `${output}/planner-fixture-${width}-${theme}.png`, fullPage: true });
    results.push({
      view: 'planner SQL-contract fixture',
      width,
      theme,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      errors: [...errors]
    });
    await page.goto('http://127.0.0.1:5175/EPAVOne/');
    await page.evaluate(async () => {
      const [{ render }, { ImportPanel }, { adminService }] = await Promise.all([
        import((await (await fetch('/EPAVOne/src/main.jsx')).text()).match(/from ["']([^"']*\/preact\.js[^"']*)/)[1]),
        import('/EPAVOne/src/products/insights/creation/admin/ImportPanel.jsx'),
        import('/EPAVOne/src/products/insights/creation/services/adminService.js')
      ]);
      const runtime = await import(
        (await (await fetch('/EPAVOne/src/main.jsx')).text()).match(/from ["']([^"']*preact_jsx-dev-runtime.js[^"']*)/)[1]
      );
      const h = (type, props, ...children) =>
        runtime.jsxDEV(
          type,
          { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
          undefined,
          children.length > 1,
          undefined,
          undefined
        );
      adminService.context = async () => ({ categories: [], products: [], recipes: [], structure: { pages: [], sections: [] } });
      adminService.importCatalog = async () => {
        throw new Error('Visual fixture cannot write to production');
      };
      document.documentElement.dataset.product = 'insights';
      render(
        h('main', { className: 'product-page' }, h('h1', {}, 'Produtos oficiais Swift · prévia local'), h(ImportPanel)),
        document.getElementById('app')
      );
    });
    await page.getByRole('button', { name: 'Preparar produtos oficiais Swift' }).click();
    await page.getByText('11 produtos novos para revisar', { exact: false }).waitFor();
    await page.screenshot({ path: `${output}/swift-import-fixture-${width}-${theme}.png`, fullPage: true });
    results.push({
      view: 'admin additive import fixture',
      width,
      theme,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      errors: [...errors]
    });
    // Keep contexts alive until browser shutdown in single-process environments.
  }
  const publicContext = await browser.newContext();
  const page = await publicContext.newPage();
  const publicErrors = [];
  page.on('pageerror', (error) => publicErrors.push(error.message));
  try {
    await page.goto('https://leo-ytnk.github.io/EPAVOne/#/insights/produtos', { timeout: 30000 });
    await page.getByRole('heading', { name: 'Produtos para sua próxima venda' }).waitFor();
    results.push({ view: 'Published Pages (before proposed changes)', title: await page.title(), errors: publicErrors });
  } catch (error) {
    results.push({ view: 'Published Pages', blocked: error.message.split('\n')[0] });
  }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser?.close();
  server.kill();
}

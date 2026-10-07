import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const AxeBuilder = require(process.env.REVIEW_AXE || '@axe-core/playwright').default;
const base = process.env.REVIEW_URL || 'http://127.0.0.1:5175/EPAVOne/';
const server = process.env.REVIEW_URL
  ? null
  : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
if (server)
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve();
    });
    server.on('error', reject);
  });
process.on('exit', () => server?.kill());
const output = 'docs/planner-review';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.REVIEW_BROWSER,
  headless: true,
  args: ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=disabled']
});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
const results = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.addInitScript(() => {
  const Original = Date;
  globalThis.Date = class extends Original {
    constructor(...args) {
      super(...(args.length ? args : ['2026-10-07T15:00:00Z']));
    }
    static now() {
      return Original.now();
    }
  };
});
await page.route('**/rest/v1/**', async (route) => {
  const table = new URL(route.request().url()).pathname.split('/').at(-1);
  const rows =
    table === 'products'
      ? [
          {
            id: 'fixture-product',
            name: 'Filé de frango Swift',
            category_id: 'aves',
            unit: 'kg',
            price_cents: 2590,
            regular_price_cents: 2590,
            price_status: 'ok',
            category: { id: 'aves', name: 'Aves' }
          }
        ]
      : table === 'categories'
        ? [{ id: 'aves', name: 'Aves' }]
        : [];
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      'content-range': `0-${rows.length - 1}/${rows.length}`,
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'content-range'
    },
    body: JSON.stringify(rows.slice(Number(new URL(route.request().url()).searchParams.get('offset') || 0)))
  });
});
await page.goto(base);
const seed = await page.evaluate(async () => {
  const { demoData } = await import('/EPAVOne/src/products/planner/repositories/demoData.js');
  return demoData('2026-10-07');
});
async function setState(state) {
  await page.evaluate((value) => {
    localStorage.setItem('epavone-planner-demo-v1', JSON.stringify(value));
    sessionStorage.setItem('epavone-planner-week', '2026-10-05');
  }, state);
}
await setState(seed);
async function inspect(name, screenshot, axe = false) {
  await page.locator('.planner-panel').waitFor();
  await page.getByLabel('Carregando planejamento').waitFor({ state: 'hidden' });
  await page.evaluate(() => document.fonts.ready);
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    clippedContent: [
      ...document.querySelectorAll('.planner-profile > div, .planner-offer > div, .planner-client, .planner-page .ds-badge')
    ].filter((node) => node.scrollWidth > node.clientWidth + 1).length,
    width: document.documentElement.scrollWidth,
    cards: [...document.querySelectorAll('.planner-panel .ds-card')].length,
    unstiched: [...document.querySelectorAll('.planner-panel .ds-card')].filter((node) => !node.querySelector(':scope > .ds-stitch')).length
  }));
  const accessibility = axe
    ? (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map((node) => node.target)
      }))
    : undefined;
  if (screenshot) await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  results.push({ name, ...geometry, accessibility });
}
if (process.env.REVIEW_SKIP_MATRIX) results.push(...JSON.parse(fs.readFileSync(`${output}/results.json`, 'utf8')).results.slice(0, 56));
if (!process.env.REVIEW_SKIP_MATRIX)
  for (const width of [320, 390, 768, 1440]) {
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate((value) => localStorage.setItem('epavone-theme', value), theme);
      for (const route of ['', 'semana', 'clientes', 'clientes/demo-5', 'oportunidades', 'desempenho', 'atendimento/demo-1']) {
        await page.goto(base + '#/planner' + (route ? '/' + route : ''));
        await page.waitForTimeout(250);
        await page.evaluate((value) => {
          localStorage.setItem('epavone-theme', value);
          document.documentElement.dataset.theme = value;
        }, theme);
        await page.waitForTimeout(350);
        const mainCapture = (width === 1440 && theme === 'light') || (width === 390 && theme === 'dark');
        await inspect(`${route.replaceAll('/', '-') || 'overview'}-${width}-${theme}`, mainCapture, mainCapture);
      }
    }
  }
// Keyboard, focus return, profile preparation, persistence, and Insights roundtrip.
await page.goto(base + '#/planner/clientes/demo-5');
await page.getByText('Editar perfil', { exact: true }).click();
await page.getByRole('dialog').waitFor();
await page.keyboard.press('Tab');
const focusInside = await page.getByRole('dialog').evaluate((node) => node.contains(document.activeElement));
await page.keyboard.press('Escape');
const focusReturned = await page
  .getByText('Editar perfil', { exact: true })
  .evaluate((node) => node.closest('button') === document.activeElement);
await page.getByLabel('Sua abordagem').fill('Perguntar sobre o almoço em família e confirmar restrições.');
await page.getByText('Salvar preparação', { exact: true }).click();
await page.getByText('Abordagem salva.', { exact: true }).waitFor();
await page.reload();
await page.getByLabel('Sua abordagem').waitFor();
const persisted = await page.getByLabel('Sua abordagem').inputValue();
await page.getByText('Consultar no Insights', { exact: true }).first().click();
try {
  await page.getByLabel('Buscar produto', { exact: true }).waitFor();
} catch (error) {
  await page.screenshot({ path: `${output}/integration-error.png`, fullPage: true });
  process.stdout.write(JSON.stringify({ url: page.url(), errors, text: await page.locator('body').innerText() }));
  throw error;
}
const search = await page.getByLabel('Buscar produto', { exact: true }).inputValue();
await page.getByText('Voltar ao Planner', { exact: true }).click();
await page.getByLabel('Sua abordagem').waitFor();
const roundtrip = (await page.getByLabel('Sua abordagem').inputValue()) === persisted;
// Register a result and verify natural advancement plus reload persistence.
await page.goto(base + '#/planner/atendimento/demo-1');
await page.getByRole('button', { name: /Resultado do atendimento/ }).click();
await page.getByRole('option', { name: 'Interessado', exact: true }).click();
await page.getByLabel('O que aprender com a conversa?').fill('Confirmar escolha de produtos.');
await page.getByText('Salvar e próximo cliente', { exact: true }).click();
await page.waitForURL('**/#/planner/atendimento/demo-2');
await page.reload();
const recorded = await page.evaluate(
  () => JSON.parse(localStorage.getItem('epavone-planner-demo-v1')).weeks[0].queue[0].outcome === 'interested'
);
// States: empty, few, many + long texts, error, loading, reduced motion.
for (const scenario of ['empty', 'few', 'many-long']) {
  const value = structuredClone(seed);
  if (scenario === 'empty') {
    value.customers = [];
    value.interactions = [];
    value.commitments = [];
    value.weeks.forEach((week) => {
      week.queue = [];
    });
  }
  if (scenario === 'few') {
    value.customers = value.customers.slice(0, 2);
    value.interactions = value.interactions.filter((item) => value.customers.some((customer) => customer.id === item.customerId));
    value.weeks[0].queue = value.weeks[0].queue.slice(0, 2);
  }
  if (scenario === 'many-long') {
    value.customers = Array.from({ length: 200 }, (_, index) => ({
      ...seed.customers[index % seed.customers.length],
      id: `long-${index}`,
      name: 'Cliente com um nome muito longo para verificar a composição e a quebra de textos em dispositivos estreitos ' + index,
      position: 'Escritório principal · corredor lateral · mesa compartilhada · cadeira de referência',
      context: 'Uma descrição detalhada do contexto familiar e dos hábitos de consumo. '.repeat(12),
      tags: ['Relacionamento de longo prazo com acompanhamento comercial']
    }));
    value.interactions = [];
    value.commitments = [];
    value.weeks[0].queue = value.customers.slice(0, 20).map((item) => ({ customerId: item.id, role: 'primary', outcome: null }));
  }
  await setState(value);
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto(base + '#/planner/clientes');
  await page.reload();
  await page.locator('.planner-panel').waitFor();
  await page.getByLabel('Carregando planejamento').waitFor({ state: 'hidden' });
  const expectedCards = scenario === 'empty' ? 0 : scenario === 'few' ? 2 : 8;
  if ((await page.locator('.planner-client').count()) !== expectedCards) throw new Error(`Incorrect fixture rendering for ${scenario}`);
  await inspect(scenario + '-320', true, true);
  if (scenario === 'many-long') {
    await page.goto(base + '#/planner/clientes/long-0');
    await inspect('long-profile-320', true, true);
    await page.goto(base + '#/planner/semana');
    await inspect('many-queue-320', true, true);
  }
}
await page.evaluate(() => localStorage.setItem('epavone-planner-demo-v1', '{invalid'));
await page.goto(base + '#/planner');
await page.getByText('Planejamento indisponível', { exact: true }).waitFor();
await inspect('error-320', true, true);
await setState(seed);
await page.goto(base);
await page.evaluate(async () => {
  const { plannerService } = await import('/EPAVOne/src/products/planner/services/plannerService.js');
  const load = plannerService.load;
  plannerService.load = async (...args) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return load(...args);
  };
});
await page.getByRole('tab', { name: 'Planner', exact: true }).click();
await page.getByLabel('Carregando planejamento').waitFor();
await page.screenshot({ path: `${output}/loading-320.png`, fullPage: true });
await page.getByLabel('Carregando planejamento').waitFor({ state: 'hidden' });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(base + '#/planner/semana');
await page.getByText('Sua fila de atendimento', { exact: true }).waitFor();
const reducedMotion = await page.locator('.planner-panel').evaluate((node) => getComputedStyle(node).animationName);
const audit = { results, errors, interactions: { focusInside, focusReturned, persisted, search, roundtrip, recorded, reducedMotion } };
fs.writeFileSync(`${output}/results.json`, JSON.stringify(audit, null, 2));
await browser.close();
server?.kill();
const failures = results.filter(
  (result) => result.width > result.viewport || result.clippedContent || result.unstiched || result.accessibility?.length
);
process.stdout.write(JSON.stringify({ inspected: results.length, failures, errors, interactions: audit.interactions }, null, 2) + '\n');
if (failures.length || errors.length || !focusInside || !focusReturned || !roundtrip || !recorded || reducedMotion !== 'none')
  process.exitCode = 1;

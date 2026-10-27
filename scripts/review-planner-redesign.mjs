import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const output = process.env.REVIEW_OUTPUT || 'docs/planner-redesign';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5180']);
process.on('exit', () => server.kill());
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) resolve();
  });
  server.on('error', reject);
});
const browser = await chromium.launch({
  executablePath: process.env.REVIEW_BROWSER,
  headless: true,
  args: [
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ]
});
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [],
  results = [],
  flows = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.route('**/rest/v1/**', async (route) => {
  assert.equal(route.request().method(), 'GET', 'Review must never write to production');
  await route.fulfill({ status: 200, json: [], headers: { 'content-range': '*/0' } });
});
await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, json: { message: 'Review is offline' } }));
await page.addInitScript(() => {
  localStorage.setItem('epavone-introduction-v1', 'done');
  const Original = Date;
  globalThis.Date = class extends Original {
    constructor(...args) {
      super(...(args.length ? args : ['2026-10-26T15:00:00Z']));
    }
    static now() {
      return new Original('2026-10-26T15:00:00Z').getTime();
    }
  };
});
const base = 'http://127.0.0.1:5180/EPAVOne/';
async function open(route = '') {
  await page.goto(base + '#/planner' + (route ? '/' + route : ''));
  await page.locator('.planner-panel').waitFor();
  await page.getByLabel('Carregando planejamento').waitFor({ state: 'hidden' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);
}
await open();
const seed = await page.evaluate(async () => {
  const { demoData } = await import('/EPAVOne/src/products/planner/repositories/demoData.js');
  return demoData('2026-10-26');
});
async function fixture(value) {
  await page.evaluate((value) => {
    localStorage.setItem('epavone-planner-demo-v1', JSON.stringify(value));
    sessionStorage.setItem('epavone-planner-week', '2026-10-26');
  }, value);
  await page.reload();
  await page.locator('.planner-panel').waitFor();
  await page.getByLabel('Carregando planejamento').waitFor({ state: 'hidden' });
}
await fixture(seed);
async function inspect(name, capture = false) {
  const info = await page.evaluate(() => ({
    viewport: innerWidth,
    width: document.documentElement.scrollWidth,
    unstiched: [...document.querySelectorAll('.planner-panel .ds-card')].filter((n) => !n.querySelector(':scope > .ds-stitch')).length,
    clipped: [
      ...document.querySelectorAll('.planner-client-identity,.planner-profile > div,.planner-offer > div,.planner-queue-person')
    ].filter((n) => n.scrollWidth > n.clientWidth + 1).length
  }));
  results.push({ name, ...info });
  process.stdout.write(name + '\n');
  if (capture) await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  assert.ok(info.width <= info.viewport, `Overflow: ${name}`);
  assert.equal(info.clipped, 0, `Clipped: ${name}`);
  assert.equal(info.unstiched, 0, `Stitch missing: ${name}`);
}
if (!process.env.REVIEW_SKIP_MATRIX) {
  for (const width of [320, 390, 768, 1024, 1440])
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('epavone-theme', theme);
      }, theme);
      for (const route of [
        '',
        'clientes',
        'semana',
        'resultados',
        'clientes/oportunidades',
        'clientes/demo-5',
        'semana/atender/demo-1',
        'semana/concluir'
      ]) {
        await open(route);
        await page.evaluate((theme) => (document.documentElement.dataset.theme = theme), theme);
        const name =
          (route.replaceAll('/', '-') || 'inicio') + '-' + (width === 1440 ? 'desktop' : width === 390 ? 'mobile' : width) + '-' + theme;
        await inspect(name, width === 390 || width === 1440);
      }
    }
  // Preferences: enlarged text, compact density, vertical shell and reduced motion.
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => {
      localStorage.setItem(
        'epavone-preferences',
        JSON.stringify({ textSize: 'large', density: 'compact', navigation: 'vertical', mobileNavigation: 'vertical', reducedMotion: true })
      );
    });
    for (const route of ['', 'clientes', 'semana', 'resultados']) {
      await open(route);
      await inspect((route || 'inicio') + '-' + width + '-preferences');
    }
  }
  fs.writeFileSync(`${output}/matrix.json`, JSON.stringify(results, null, 2));
} else results.push(...JSON.parse(fs.readFileSync(`${output}/matrix.json`, 'utf8')));
await page.evaluate(() => localStorage.removeItem('epavone-preferences'));
await page.setViewportSize({ width: 390, height: 844 });
await open('clientes');
// CRUD: dialogs, focus, persistence, commitments and deletion.
await page.getByText('Novo cliente', { exact: true }).click();
await page.getByLabel('Nome', { exact: true }).fill('Cliente de revisão');
await page.getByText('Salvar perfil', { exact: true }).click();
await page.getByText('Perfil salvo.', { exact: true }).first().waitFor();
await page.getByLabel('Buscar na carteira').fill('Cliente de revisão');
await page.getByRole('link', { name: 'Cliente de revisão', exact: true }).click();
await page.getByText('Editar perfil', { exact: true }).click();
await page.getByLabel('Contexto do cliente').fill('Atendimento de teste sem gravação remota.');
await page.getByLabel('Abordagem preparada', { exact: true }).fill('Abordagem atualizada pelo perfil.');
await page.getByText('Salvar perfil', { exact: true }).click();
await page.getByText('Perfil salvo.', { exact: true }).first().waitFor();
assert.equal(await page.getByLabel('Sua abordagem', { exact: true }).inputValue(), 'Abordagem atualizada pelo perfil.');
await page.reload();
await page.getByText('Atendimento de teste sem gravação remota.', { exact: true }).first().waitFor();
await page.getByRole('tab', { name: 'Combinados', exact: true }).click();
await page.getByLabel('Novo combinado', { exact: true }).fill('Retomar amanhã');
await page.getByText('Registrar combinado', { exact: true }).click();
await page.getByText('Combinado registrado.', { exact: true }).waitFor();
await page.getByText(/Retomar amanhã ·/).click();
await page.getByText('Combinado atualizado.', { exact: true }).waitFor();
await page.getByText('Mais sobre este cliente', { exact: true }).click();
await page.getByText('Excluir cliente', { exact: true }).click();
await page.getByRole('dialog').waitFor();
await page.keyboard.press('Tab');
assert.ok(await page.getByRole('dialog').evaluate((n) => n.contains(document.activeElement)));
await page.getByText('Cancelar', { exact: true }).click();
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await page.waitForTimeout(200);
assert.ok(await page.getByRole('button', { name: 'Excluir cliente', exact: true }).evaluate((n) => n === document.activeElement));
await page.getByText('Excluir cliente', { exact: true }).click();
await page.getByText('Confirmar exclusão', { exact: true }).click();
await page.waitForURL('**/#/planner/clientes');
flows.push('create-edit-reload-commit-resolve-delete-cancel-focus-confirm');
// Search/filter/opportunities remain in the portfolio.
await page.getByLabel('Buscar na carteira').fill('Não existe');
await page.getByText('Nenhum cliente com esses filtros', { exact: true }).waitFor();
await page.getByText('Limpar filtros', { exact: true }).click();
await page.getByRole('tab', { name: 'Oportunidades', exact: true }).click();
await page.getByText('Ver sugestões compatíveis', { exact: true }).first().click();
await page.getByText('Consultar no Insights', { exact: true }).first().waitFor();
await page.getByText('Consultar no Insights', { exact: true }).first().click();
await page.getByLabel('Buscar produto', { exact: true }).waitFor();
await page.getByText('Voltar ao Planner', { exact: true }).click();
await page.waitForURL('**/#/planner/clientes/oportunidades');
flows.push('search-reset-compatible-opportunities-insights-roundtrip');
// Plan and prepare in-place.
await open('semana');
await page.getByText('Ajustar meta da semana', { exact: true }).click();
await page.getByLabel('Meta de atendimentos', { exact: true }).fill('9');
await page.getByText('Salvar meta', { exact: true }).click();
await page.getByText('Meta atualizada.', { exact: true }).waitFor();
await page.getByText('Escolher clientes', { exact: true }).click();
await page.getByText('Adicionar Pedro (exemplo)', { exact: true }).click();
await page.getByText('Cliente adicionado à semana.', { exact: true }).waitFor();
await page.getByRole('button', { name: 'Organizar Pedro (exemplo)', exact: true }).click();
await page.getByRole('menuitem', { name: 'Tornar reserva', exact: true }).click();
await page.getByText('Papel atualizado.', { exact: true }).waitFor();
await page.getByRole('button', { name: 'Organizar Pedro (exemplo)', exact: true }).click();
await page.getByRole('menuitem', { name: 'Subir na fila', exact: true }).click();
await page.getByText('Posição atualizada.', { exact: true }).waitFor();
await open('semana/preparar/demo-8');
await page.getByLabel('Sua abordagem').fill('Perguntar sobre o almoço.');
await page.getByText('Salvar preparação', { exact: true }).click();
await page.getByText('Abordagem salva.', { exact: true }).waitFor();
await page.getByRole('button', { name: 'Organizar Pedro (exemplo)', exact: true }).click();
await page.getByRole('menuitem', { name: 'Remover da semana', exact: true }).click();
await page.getByText('Cliente removido da fila.', { exact: true }).waitFor();
await page.getByText('Cliente fora desta semana', { exact: true }).waitFor();
await inspect('cliente-fora-da-fila-390', true);
flows.push('goal-inline-add-reserve-reorder-prepare-remove');
// Record without leaving Week, and verify exactly one persisted interaction.
await open('semana/atender/demo-1');
await page.getByRole('button', { name: /Resultado do atendimento/ }).click();
await page.getByRole('option', { name: 'Falar depois', exact: true }).click();
await page.getByLabel('O que aprender com a conversa?').fill('Retornar com alternativas.');
await page.getByText('Salvar e próximo cliente', { exact: true }).click();
await page.waitForURL('**/#/planner/semana/atender/demo-2');
await page.reload();
const recorded = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('epavone-planner-demo-v1')).interactions.filter((i) => i.weekId === '2026-10-26')
);
assert.equal(recorded.length, 1);
assert.equal(recorded[0].outcome, 'later');
await page.getByText('Criar pedido no Writer', { exact: true }).click();
await page.waitForURL('**/#/writer');
const handoff = await page.evaluate(async () => {
  const { commercialContext } = await import('/EPAVOne/src/shared/services/commercialContext.js');
  return commercialContext.get();
});
assert.equal(handoff.returnTo, '#/planner/semana/atender/demo-2');
assert.equal(handoff.orderStatus, 'pending');
await page.getByText('Voltar ao Planner', { exact: true }).click();
await page.waitForURL('**/#/planner/semana/atender/demo-2');
flows.push('attendance-persist-once-advance-writer-roundtrip');
// Historic routes and current-week restriction.
for (const [old, target] of [
  ['oportunidades', 'clientes/oportunidades'],
  ['desempenho', 'resultados'],
  ['atendimento/demo-2', 'semana/atender/demo-2']
]) {
  await open(old);
  assert.ok(page.url().endsWith('#/planner/' + target));
}
await page.getByRole('button', { name: /Semana de planejamento/ }).click();
await page.getByRole('option', { name: /02 de nov/ }).click();
await page.getByText('Atendimento disponível na semana atual', { exact: true }).waitFor();
flows.push('legacy-replacement-week-restriction');
// Empty/many/long/error: no writes outside the local demonstration.
await open('clientes');
for (const scenario of ['empty', 'many']) {
  const value = structuredClone(seed);
  value.customers =
    scenario === 'empty'
      ? []
      : Array.from({ length: 200 }, (_, i) => ({
          ...seed.customers[i % 12],
          id: 'long-' + i,
          name: 'Cliente com um nome extenso e posição compartilhada para revisão em tela estreita ' + i,
          position: 'Corredor principal · mesa de atendimento · posição de referência'
        }));
  value.interactions = [];
  value.commitments = [];
  value.weeks.forEach((w) => {
    w.queue = [];
  });
  if (scenario === 'many')
    value.weeks[0].queue = value.customers.slice(0, 20).map((c) => ({ customerId: c.id, role: 'primary', outcome: null }));
  await open('clientes');
  await fixture(value);
  await inspect(scenario + '-390', true);
  assert.equal(await page.locator('.planner-client').count(), scenario === 'empty' ? 0 : 8);
  for (const route of ['', 'semana', 'resultados']) {
    await open(route);
    await inspect(scenario + '-' + (route || 'inicio'));
    if (scenario === 'empty' && route === 'semana') assert.equal(await page.locator('.planner-queue').count(), 0);
  }
}
await page.evaluate(() => localStorage.setItem('epavone-planner-demo-v1', '{bad'));
await page.reload();
await page.getByText('Planejamento indisponível', { exact: true }).waitFor();
await inspect('error-390', true);
flows.push('empty-many-long-error-recovery');
await fixture(seed);
await open('pedidos');
await page
  .getByRole('region', { name: 'Pedidos e vendas' })
  .waitFor()
  .catch(() => {});
await inspect('pedidos-390', true);
assert.deepEqual(errors, []);
const report = { results, flows, errors, remoteWrites: 0 };
fs.writeFileSync(`${output}/review.json`, JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify({ inspected: results.length, flows, errors }, null, 2) + '\n');
await browser.close();
server.kill();

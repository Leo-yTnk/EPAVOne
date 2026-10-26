import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.REVIEW_PLAYWRIGHT || 'playwright');
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-design-workspaces';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187', '--strictPort'], {
  stdio: 'ignore'
});
process.on('exit', () => server.kill());
let browser;
const results = [];
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5187/EPAVOne/')).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.REVIEW_BROWSER, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const width of process.env.REVIEW_WIDTHS
    ? process.env.REVIEW_WIDTHS.split(',').map(Number)
    : process.env.REVIEW_QUICK
      ? [320]
      : [320, 390, 768, 1440])
    for (const theme of process.env.REVIEW_QUICK ? ['light'] : ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/*', (route) => (new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort()));
      await page.addInitScript((theme) => {
        localStorage.setItem('epavone-theme', theme);
        localStorage.setItem('epavone-introduction-v1', 'done');
      }, theme);
      await page.goto('http://127.0.0.1:5187/EPAVOne/');
      await page.locator('h1').waitFor();
      await page.evaluate(async () => {
        const main = await (await fetch('/EPAVOne/src/main.jsx')).text();
        const { render } = await import(main.match(/from ["']([^"']*\/preact\.js[^"']*)/)[1]);
        const runtime = await import(main.match(/from ["']([^"']*preact_jsx-dev-runtime.js[^"']*)/)[1]);
        const h = (type, props, ...children) =>
          runtime.jsxDEV(
            type,
            { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) },
            props?.key,
            children.length > 1,
            undefined,
            undefined
          );
        window.mountReview = async (name, props = {}) => {
          const paths = {
            CreationPage: 'products/insights/creation/CreationPage.jsx',
            EntityEditor: 'products/insights/creation/components/EntityEditor.jsx',
            ComponentLab: 'dev/component-lab/ComponentLab.jsx'
          };
          const module = await import(`/EPAVOne/src/${paths[name]}`);
          render(
            h(
              'div',
              { className: 'app-shell navigation-horizontal' },
              h(
                'main',
                { className: 'app-main product-page' },
                h(module[name], {
                  ...props,
                  key: (window.reviewMountKey = (window.reviewMountKey || 0) + 1),
                  onClose: () => {},
                  onSaved: () => {}
                })
              )
            ),
            document.getElementById('app')
          );
          document.documentElement.dataset.product = name === 'ComponentLab' ? 'one' : 'insights';
        };
        const { creationService } = await import('/EPAVOne/src/products/insights/creation/services/creationService.js');
        const { adminService } = await import('/EPAVOne/src/products/insights/creation/services/adminService.js');
        const { collaborationService } = await import('/EPAVOne/src/products/insights/creation/services/collaborationService.js');
        const categories = [{ id: 'c1', name: 'Família', type: 'receita', active: true }];
        const products = [{ id: 'p1', name: 'Frango Swift', unit: 'pacote', category_id: 'c1', price: 25.9, active: true }];
        const recipes = [
          {
            id: 'r1',
            name: 'Frango para compartilhar',
            category_id: 'c1',
            prep_time: 35,
            servings: 4,
            difficulty: 'Fácil',
            status: 'published',
            instructions: ['Prepare os ingredientes.', 'Asse até cozinhar.']
          }
        ];
        const structure = { pages: [{ id: 'home', key: 'home', name: 'Home', active: true }], sections: [] };
        creationService.load = async (type) => ({ recipes, products, categories })[type];
        creationService.vocabulary = async () => ({ categories, products, structure });
        creationService.detail = async () => ({});
        adminService.context = async () => ({ recipes, products, categories, structure });
        adminService.structure = async () => structure;
        adminService.observations = async () => [];
        // Service doubles provide visual states only. No writes or privileged authentication.
        collaborationService.shared = async () => [];
        collaborationService.requests = async () => [];
      });
      async function inspect(name) {
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(100);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert(overflow <= 1, `${name} / ${width}: horizontal overflow ${overflow}`);
        assert.deepEqual(errors, [], `${name}: runtime errors`);
        if ((width === 1440 && theme === 'light') || (width === 390 && theme === 'dark')) {
          await page.screenshot({
            path: `${output}/${name}-${width}-${theme}.png`,
            fullPage: !(await page.getByRole('dialog').count()),
            animations: 'disabled'
          });
          if (name === 'component-lab')
            await page
              .locator('.lab-foundations')
              .screenshot({ path: `${output}/foundations-${width}-${theme}.png`, animations: 'disabled' });
        }
        results.push({ name, width, theme, overflow, errors: [...errors] });
      }
      const account = { session: { user: { id: 'visual-fixture-only' } }, profile: { role: 'admin' } };
      for (const section of ['receitas', 'produtos', 'categorias', 'admin']) {
        await page.evaluate(
          ({ section, account }) => window.mountReview('CreationPage', { route: { segments: ['criacao', section] }, account }),
          { section, account }
        );
        await page.getByRole('button', { name: /^Criar / }).waitFor();
        await inspect(`creation-${section}`);
      }
      // All administrative areas share the real navigation and components.
      for (const [value, label] of [
        ['sections', 'Páginas e seções'],
        ['import', 'Importar catálogo'],
        ['duplicates', 'Verificar duplicatas'],
        ['maintenance', 'Preços e manutenção']
      ]) {
        await page.getByRole('button', { name: /^Área administrativa/ }).click();
        await page.getByRole('option', { name: label, exact: true }).click();
        await inspect(`admin-${value}`);
      }
      for (const type of ['recipes', 'products', 'categories']) {
        await page.evaluate((type) => window.mountReview('EntityEditor', { type, scope: 'personal' }), type);
        await page.getByLabel('Nome', { exact: true }).waitFor();
        await page.getByLabel('Nome', { exact: true }).fill('Conteúdo de demonstração com um nome completo e legível');
        await page.getByText('Alterações ainda não salvas', { exact: true }).waitFor();
        await inspect(`editor-${type}`);
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
        await page.waitForTimeout(100);
        await page.getByText('As alterações deste formulário ainda não foram salvas.').waitFor();
      }
      await page.evaluate(() => window.mountReview('ComponentLab'));
      await page.getByRole('heading', { name: 'Uma linguagem, quatro cores' }).waitFor();
      await inspect('component-lab');
      const contract = await page.locator('.lab-foundations-grid > article').evaluateAll((cards) =>
        cards.map((card) => {
          const b = getComputedStyle(card.querySelector('.ds-btn-primary'));
          const c = getComputedStyle(card);
          const f = getComputedStyle(card.querySelector('.ds-input'));
          return {
            product: card.dataset.product,
            accent: b.backgroundColor,
            geometry: {
              cardRadius: c.borderRadius,
              padding: c.padding,
              buttonRadius: b.borderRadius,
              buttonHeight: b.minHeight,
              font: b.font,
              fieldRadius: f.borderRadius,
              fieldHeight: f.minHeight
            }
          };
        })
      );
      for (const item of contract.slice(1))
        assert.deepEqual(item.geometry, contract[0].geometry, 'Product identity must only change color');
      assert.equal(new Set(contract.map((item) => item.accent)).size, 4, 'Each app must keep its own accent');
      fs.writeFileSync(`${output}/contract-${width}-${theme}.json`, JSON.stringify(contract, null, 2));
      await page.close();
      console.warn(`Workspaces: ${width}px / ${theme} passed`);
    }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify({ fixtureServices: true, liveWrites: false, matrix: results }, null, 2));
  console.warn(`${results.length} workspace checks passed.`);
} finally {
  await browser?.close();
  server.kill();
}

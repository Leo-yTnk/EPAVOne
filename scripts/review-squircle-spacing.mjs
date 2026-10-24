import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(
  `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd() + '/node_modules'}/playwright/package.json`
);
const { chromium } = require('playwright');
const output = process.env.REVIEW_OUTPUT || 'docs/squircle-review';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5183'], { stdio: 'ignore' });
let browser;
const results = process.env.REVIEW_INTERACTIONS_ONLY ? JSON.parse(fs.readFileSync(`${output}/matrix.json`, 'utf8')) : [];
try {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      if ((await fetch('http://127.0.0.1:5183/EPAVOne/')).ok) break;
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    executablePath: process.env.REVIEW_BROWSER,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const routes = [
    'welcome',
    'settings',
    '',
    'planner',
    'planner/semana',
    'planner/clientes',
    'planner/oportunidades',
    'planner/desempenho',
    'writer',
    'insights',
    'insights/produtos',
    'insights/receitas',
    'insights/criacao'
  ];
  for (const width of process.env.REVIEW_INTERACTIONS_ONLY ? [] : [320, 390, 768, 1440])
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript((theme) => {
        localStorage.setItem('epavone-theme', theme);
        localStorage.setItem('epavone-introduction-v1', 'done');
      }, theme);
      await page.route('**/rest/v1/**', (route) => {
        const table = new URL(route.request().url()).pathname.split('/').at(-1);
        const category = { id: 'aves', name: 'Aves' };
        const rows =
          table === 'categories'
            ? [category]
            : table === 'products'
              ? [
                  {
                    id: 'p1',
                    name: 'Filé de frango Swift 1 kg',
                    product_code: '1001',
                    category_id: 'aves',
                    category,
                    unit: 'pacote',
                    price_cents: 2590,
                    regular_price_cents: 2590,
                    price_status: 'ok'
                  }
                ]
              : table === 'recipes'
                ? [
                    {
                      id: 'r1',
                      name: 'Frango assado para compartilhar',
                      category_id: 'aves',
                      category,
                      prep_time: 25,
                      servings: 4,
                      featured: true,
                      instructions: ['Separe os ingredientes.', 'Asse até cozinhar.']
                    }
                  ]
                : [];
        return route.fulfill({
          contentType: 'application/json',
          headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` },
          body: JSON.stringify(rows)
        });
      });
      for (const route of routes) {
        await page.goto(`http://127.0.0.1:5183/EPAVOne/#/${route}`);
        await page.locator('h1').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(350);
        const geometry = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          navigationScrollbars: [
            ...document.querySelectorAll('.workspace-navigation-scroll, .site-header .ds-tabs, .navigation-vertical .site-header')
          ].map((node) => getComputedStyle(node).scrollbarWidth),
          cards: [...document.querySelectorAll('.ds-card')]
            .filter((node) => !node.closest('[hidden]'))
            .map((node) => {
              const style = getComputedStyle(node);
              return {
                class: node.className,
                radius: style.borderTopLeftRadius,
                padding: style.padding,
                shape: style.cornerTopLeftShape,
                stitch: !!node.querySelector('.ds-stitch path[d]')
              };
            })
        }));
        assert(
          geometry.navigationScrollbars.every((value) => value === 'none'),
          'Navigation must not show scrollbars'
        );
        assert(geometry.overflow <= 1, `Overflow ${width} ${theme} ${route}: ${geometry.overflow}`);
        assert(
          geometry.cards.every(
            (card) => card.class.includes('ds-selection-indicator') || card.shape === 'superellipse(2)' || card.shape === 'squircle'
          ),
          JSON.stringify(geometry.cards)
        );
        if (route === 'settings') {
          const layout = await page.locator('.settings-section').evaluateAll((cards) =>
            cards.map((card) => {
              const copy = card.querySelector('.settings-section-copy').getBoundingClientRect();
              const controls = card.querySelector('.settings-controls').getBoundingClientRect();
              const box = card.getBoundingClientRect();
              return {
                inset: controls.right <= box.right - 15,
                aligned: Math.abs(copy.top - controls.top) < 1,
                stacked: controls.top >= copy.bottom + 15
              };
            })
          );
          assert(
            layout.every((item) => item.inset && (width > 768 ? item.aligned : item.stacked)),
            JSON.stringify(layout)
          );
        }
        results.push({ width, theme, route, ...geometry });
        if ((width === 1440 && theme === 'light') || (width === 390 && theme === 'dark'))
          await page.screenshot({ path: `${output}/${route.replaceAll('/', '-') || 'home'}-${width}-${theme}.png`, fullPage: true });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  fs.writeFileSync(`${output}/matrix.json`, JSON.stringify(results, null, 2));
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:5183/EPAVOne/');
  await page.getByRole('button', { name: /Começar minha experiência/ }).click();
  await page.getByRole('heading', { name: 'Por onde vamos começar?' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Por onde vamos começar?' }).waitFor();
  await page.goto('http://127.0.0.1:5183/EPAVOne/#/settings');
  await page.getByRole('link', { name: 'Rever a introdução' }).click();
  await page.getByRole('heading', { name: /Três apps/ }).waitFor();
  await page.getByRole('button', { name: 'Já conheço o EPAVOne' }).click();
  await page.getByRole('heading', { name: 'Por onde vamos começar?' }).waitFor();
  await page.goto('http://127.0.0.1:5183/EPAVOne/#/settings');
  await page.getByRole('button', { name: /^Tema/ }).click();
  const listbox = page.getByRole('listbox');
  assert(await listbox.evaluate((node) => !node.closest('.settings-section')));
  const box = await listbox.boundingBox();
  assert(box.x >= 0 && box.x + box.width <= 391);
  await page.getByRole('option', { name: 'Escuro', exact: true }).click();
  await page.getByText('Reduzir animações', { exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.reducedMotion === 'true');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.reducedMotion), 'true');
  await page.getByRole('button', { name: 'Restaurar preferências' }).click();
  await page.locator('.settings-page').getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.settings-page').getByRole('button', { name: 'Entrar na conta', exact: true }).waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:5183/EPAVOne/#/welcome');
  assert.equal(
    await page
      .locator('.route-frame')
      .first()
      .evaluate((node) => getComputedStyle(node).animationName),
    'none'
  );
  fs.writeFileSync(
    `${output}/results.json`,
    JSON.stringify(
      {
        matrix: results.map(({ cards, ...row }) => ({ ...row, cards: cards.length })),
        checks: [
          'first-visit',
          'completion-reload',
          'reopen-introduction',
          'settings-alignment',
          'select-portal',
          'theme',
          'reduced-motion',
          'reset',
          'account-focus',
          'no-overflow'
        ],
        fixtureCatalog: true,
        physicalSafari: false
      },
      null,
      2
    )
  );
  console.warn(`${results.length} route/viewport/theme checks passed.`);
} finally {
  await browser?.close();
  server.kill();
}

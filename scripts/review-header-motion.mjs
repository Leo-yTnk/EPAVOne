import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5177'], { stdio: 'ignore' });
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-header-motion';
fs.mkdirSync(output, { recursive: true });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5177/EPAVOne/')).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.REVIEW_BROWSER, args: ['--no-sandbox', '--disable-gpu'] });
  const results = [];
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((theme) => localStorage.setItem('epavone-theme', theme), theme);
    await page.route('**/rest/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await page.goto('http://127.0.0.1:5177/EPAVOne/#/');
    await page.locator('h1').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const product of ['planner', 'writer', 'insights', 'planner', 'home']) {
      const frames = await page.evaluate(async (product) => {
        const node = document.querySelector('.workspace-navigation');
        const before = node.getBoundingClientRect().width;
        document.querySelector(`#app-tab-${product}`).click();
        const samples = [];
        const start = performance.now();
        while (performance.now() - start < 550) {
          await new Promise(requestAnimationFrame);
          samples.push({ t: performance.now() - start, width: node.getBoundingClientRect().width });
        }
        return { before, samples, overflow: document.documentElement.scrollWidth - innerWidth };
      }, product);
      const end = frames.samples.at(-1).width;
      if (Math.abs(end - frames.before) > 2) {
        assert(
          frames.samples.some(
            (sample) => sample.width > Math.min(end, frames.before) + 2 && sample.width < Math.max(end, frames.before) - 2
          ),
          `${product}: width must interpolate`
        );
        assert(
          frames.samples.every(
            (sample) => sample.width >= Math.min(end, frames.before) - 1 && sample.width <= Math.max(end, frames.before) + 1
          ),
          `${product}: no width overshoot`
        );
      }
      assert(frames.overflow <= 1);
      const aligned = await page.locator('.app-tabs').evaluate((tabs) => {
        const selected = tabs.querySelector('[aria-selected="true"]').getBoundingClientRect();
        const thumb = tabs.querySelector('.ds-selection-indicator').getBoundingClientRect();
        return Math.abs(selected.left - thumb.left) < 1 && Math.abs(selected.width - thumb.width) < 1;
      });
      assert(aligned, `${product}: selection settles exactly on the active button`);
      results.push({ theme, product, ...frames });
    }
    await page.evaluate(async () => {
      for (const app of ['planner', 'writer', 'insights', 'home', 'planner']) {
        document.querySelector(`#app-tab-${app}`).click();
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
    await page.waitForTimeout(450);
    assert.equal(await page.locator('#app-tab-planner').getAttribute('aria-selected'), 'true');
    assert.equal(
      await page
        .locator('.workspace-navigation')
        .evaluate((node) => node.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length),
      0
    );
    await page.screenshot({ path: `${output}/header-motion-${theme}.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#app-tab-writer').click();
    assert.equal(await page.locator('.workspace-navigation').evaluate((node) => node.getAnimations().length), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: /Navegação: Writer/ }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'EPAVPlanner Planner', exact: true }).click();
    await page.getByRole('button', { name: /Navegação: Planner/ }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    await page.close();
  }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  server.kill();
}

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178'], { stdio: 'ignore' });
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-continuous-motion';
fs.mkdirSync(output, { recursive: true });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5178/EPAVOne/')).ok) break;
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
    await page.goto('http://127.0.0.1:5178/EPAVOne/');
    await page.locator('#app-tab-planner').waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const app of ['planner', 'writer', 'home', 'insights', 'planner']) {
      const button = page.locator(`#app-tab-${app}`);
      const box = await button.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(150); // A real held press, not a synthetic click.
      await page.mouse.up();
      await page.waitForTimeout(500);
      const geometry = await page.locator('.app-tabs').evaluate((tabs) => {
        const selected = tabs.querySelector('[aria-selected="true"]').getBoundingClientRect();
        const thumb = tabs.querySelector('.ds-selection-indicator').getBoundingClientRect();
        return {
          left: selected.left - thumb.left,
          width: selected.width - thumb.width,
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });
      assert(Math.abs(geometry.left) < 1 && Math.abs(geometry.width) < 1, `${theme}/${app}: thumb must settle on the unscaled target`);
      assert(geometry.overflow <= 1);
      results.push({ theme, app, ...geometry });
    }
    // Verify the actual Select layer, including the in-app CSS preference.
    for (const preference of ['app', 'system']) {
      if (preference === 'app')
        await page.evaluate(() => {
          document.documentElement.dataset.reducedMotion = 'true';
        });
      else {
        await page.evaluate(() => {
          delete document.documentElement.dataset.reducedMotion;
        });
        await page.emulateMedia({ reducedMotion: 'reduce' });
      }
      const trigger = page.locator('.ds-select-trigger').first();
      await trigger.click();
      const menu = page.locator('.ds-select-menu');
      await menu.waitFor();
      assert.equal(await menu.evaluate((node) => node.getAnimations().length), 0, `${preference}: menu motion must be disabled`);
      await page.keyboard.press('Escape');
      await menu.waitFor({ state: 'detached' });
      assert(await trigger.evaluate((node) => node === document.activeElement));
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(async () => {
      for (const app of ['home', 'planner', 'writer', 'insights', 'planner']) {
        document.querySelector(`#app-tab-${app}`).click();
        await new Promise((resolve) => setTimeout(resolve, 45));
      }
    });
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#app-tab-planner').getAttribute('aria-selected'), 'true');
    const section = await page.locator('.product-section-nav').evaluate((nav) => {
      const selected = nav.querySelector('[aria-current]');
      const thumb = nav.querySelector('.ds-selection-indicator');
      const a = selected.getBoundingClientRect();
      const b = thumb.getBoundingClientRect();
      return { left: a.left - b.left, width: a.width - b.width, ready: thumb.dataset.ready, height: b.height };
    });
    results.push({ theme, section });
    assert(
      Math.abs(section.left) < 1 && Math.abs(section.width) < 1 && section.height > 0,
      `Section thumb must also settle after rapid changes: ${JSON.stringify(section)}`
    );
    await page.screenshot({ path: `${output}/desktop-${theme}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    const navigation = page.getByRole('button', { name: /Navegação: Planner/ });
    await navigation.click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert(await navigation.evaluate((node) => node === document.activeElement));
    await navigation.click();
    await page.getByRole('dialog').getByRole('link', { name: 'EPAVWriter Writer', exact: true }).click();
    await page.getByRole('button', { name: /Navegação: Writer/ }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/mobile-${theme}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await page.close();
  }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  server.kill();
}

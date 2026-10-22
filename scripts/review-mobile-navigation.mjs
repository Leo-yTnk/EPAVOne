import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = 'docs/mobile-navigation-review';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5176'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:5176/EPAVOne/')).ok) break; } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.REVIEW_BROWSER, args: ['--no-sandbox', '--disable-gpu'] });
  const results = [];
  for (const width of [320, 390, 768, 1024, 1180, 1440]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({ theme }) => {
        localStorage.setItem('epavone-theme', theme);
        localStorage.setItem('epavone-preferences', JSON.stringify({ mobileNavigation: 'vertical' }));
      }, { theme });
      await page.route('**/rest/v1/**', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
      await page.goto('http://127.0.0.1:5176/EPAVOne/#/planner');
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (width < 1200) {
        const trigger = page.getByRole('button', { name: 'Navegação', exact: true });
        await trigger.click();
        const drawer = page.getByRole('dialog', { name: 'Seus apps' });
        await drawer.waitFor();
        await page.waitForTimeout(250);
        const box = await drawer.boundingBox();
        assert(box.x >= 0 && box.x <= 1 && box.width < width);
        assert(await drawer.evaluate(node => node.contains(document.activeElement)));
        await page.keyboard.press('Tab');
        assert(await drawer.evaluate(node => node.contains(document.activeElement)));
        if ([390, 768].includes(width)) await page.screenshot({ path: `${output}/lateral-${width}-${theme}.png` });
        await page.keyboard.press('Escape');
        assert(await trigger.evaluate(node => node === document.activeElement));
        await trigger.click();
        await page.getByRole('navigation', { name: 'Páginas do Planner' }).getByRole('link', { name: 'Semana' }).click();
        await page.waitForFunction(() => location.hash.endsWith('/semana'));
        assert.equal(await page.getByRole('dialog').count(), 0);
      } else {
        await page.waitForTimeout(250);
        const geometry = await page.locator('.workspace-navigation').evaluate(track => {
          const rect = track.getBoundingClientRect();
          const painted = getComputedStyle(track, '::before');
          const thumb = track.querySelector('.ds-selection-indicator').getBoundingClientRect();
          const inset = parseFloat(painted.top);
          return { top: thumb.top - (rect.top + inset), bottom: thumb.bottom - (rect.bottom - parseFloat(painted.bottom)) };
        });
        assert(geometry.top < 0 && geometry.bottom > 0, 'Stitched thumb must overlap the painted navbar');
        await page.screenshot({ path: `${output}/header-${width}-${theme}.png` });
        results.push({ width, theme, overlap: geometry });
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({ width, theme, overflow: 0, errors });
      await page.close();
    }
  }
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  server.kill();
}

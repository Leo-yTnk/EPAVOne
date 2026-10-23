import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const output = process.env.REVIEW_OUTPUT || '/tmp/epav-selection-drag';
fs.mkdirSync(output, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5179/EPAVOne/')).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.REVIEW_BROWSER, args: ['--no-sandbox', '--disable-gpu'] });
  const results = [];
  const settle = (page) => page.waitForTimeout(600);
  const assertAligned = async (page, selector) => {
    const result = await page.locator(selector).evaluate((track) => {
      const thumb = track.querySelector('.ds-selection-indicator');
      const target = track.querySelector('[aria-selected="true"], [aria-current="page"]');
      const a = thumb.getBoundingClientRect(),
        b = target.getBoundingClientRect();
      return {
        x: a.left - b.left,
        centerY: a.top + a.height / 2 - b.top - b.height / 2,
        width: a.width - b.width,
        drag: thumb.style.getPropertyValue('--selection-drag-x'),
        overflow: document.documentElement.scrollWidth - innerWidth
      };
    });
    assert(
      Math.abs(result.x) < 1 && Math.abs(result.centerY) < 1 && Math.abs(result.width) < 1 && !result.drag && result.overflow <= 1,
      JSON.stringify(result)
    );
  };
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((theme) => localStorage.setItem('epavone-theme', theme), theme);
    await page.route('**/rest/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await page.goto('http://127.0.0.1:5179/EPAVOne/#/planner');
    await page.locator('#app-tab-planner').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    const drag = async (from, to, expectedHash, track) => {
      const origin = await from.boundingBox(),
        destination = await to.boundingBox();
      const initialHash = await page.evaluate(() => location.hash);
      await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2);
      await page.mouse.down();
      await page.mouse.move(destination.x + destination.width / 2, destination.y + destination.height / 2, { steps: 10 });
      assert.equal(await page.evaluate(() => location.hash), initialHash, 'Route must not change while dragging');
      assert.equal(await page.locator(`${track} .ds-selection-indicator`).getAttribute('data-dragging'), 'true');
      await page.mouse.up();
      await settle(page);
      assert.equal(await page.evaluate(() => location.hash), expectedHash);
      await assertAligned(page, track);
    };
    await drag(page.locator('#app-tab-planner'), page.locator('#app-tab-writer'), '#/writer', '.app-tabs');
    await drag(page.locator('#app-tab-writer'), page.locator('#app-tab-planner'), '#/planner', '.app-tabs');
    await drag(
      page.locator('.section-tab[aria-current]'),
      page.getByRole('link', { name: 'Oportunidades', exact: true }),
      '#/planner/oportunidades',
      '.product-section-nav'
    );
    // Escape restores the actual selection, without a stale preview or click.
    const active = await page.locator('#app-tab-planner').boundingBox();
    const other = await page.locator('#app-tab-insights').boundingBox();
    await page.mouse.move(active.x + active.width / 2, active.y + active.height / 2);
    await page.mouse.down();
    await page.mouse.move(other.x + other.width / 2, other.y + other.height / 2, { steps: 8 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await settle(page);
    assert.equal(await page.evaluate(() => location.hash), '#/planner/oportunidades');
    await assertAligned(page, '.app-tabs');
    // Hover tokens must resolve to a dark surface, rather than a paper tint.
    await page.locator('#app-tab-writer').hover();
    await settle(page);
    const hover = await page.locator('#app-tab-writer').evaluate((node) => {
      const style = getComputedStyle(node);
      const paint = document.createElement('canvas').getContext('2d');
      paint.fillStyle = style.backgroundColor;
      paint.fillRect(0, 0, 1, 1);
      const background = [...paint.getImageData(0, 0, 1, 1).data].slice(0, 3);
      paint.fillStyle = style.color;
      paint.fillRect(0, 0, 1, 1);
      const foreground = [...paint.getImageData(0, 0, 1, 1).data].slice(0, 3);
      const luminance = (rgb) =>
        rgb
          .map((value) => value / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
          .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const contrast =
        (Math.max(luminance(background), luminance(foreground)) + 0.05) / (Math.min(luminance(background), luminance(foreground)) + 0.05);
      return {
        background: style.backgroundColor,
        rgb: background,
        contrast,
        selected: getComputedStyle(document.querySelector('.app-tabs .ds-selection-indicator')).backgroundColor
      };
    });
    assert(hover.contrast >= 4.5, 'Hovered text must remain legible');
    if (theme === 'dark') assert(Math.max(...hover.rgb) < 80, 'Dark hover must remain dark');
    results.push({ theme, hover });
    await page.screenshot({ path: `${output}/hover-${theme}.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await drag(page.locator('#app-tab-planner'), page.locator('#app-tab-writer'), '#/writer', '.app-tabs');
    assert.deepEqual(errors, []);
    await page.close();
  }
  const sidebar = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await sidebar.addInitScript(() => localStorage.setItem('epavone-preferences', JSON.stringify({ navigation: 'vertical' })));
  await sidebar.route('**/rest/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await sidebar.goto('http://127.0.0.1:5179/EPAVOne/#/');
  await sidebar.locator('#app-tab-home').waitFor();
  await settle(sidebar);
  const first = await sidebar.locator('#app-tab-home').boundingBox(),
    last = await sidebar.locator('#app-tab-writer').boundingBox();
  assert(last.y > first.y + first.height);
  await sidebar.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await sidebar.mouse.down();
  await sidebar.mouse.move(last.x + last.width / 2, last.y + last.height / 2, { steps: 12 });
  await sidebar.mouse.up();
  await settle(sidebar);
  assert.equal(await sidebar.evaluate(() => location.hash), '#/writer');
  await assertAligned(sidebar, '.app-tabs');
  await sidebar.close();
  // Actual touch input: horizontal drag selects, vertical movement scrolls.
  const touch = await browser.newPage({ viewport: { width: 1024, height: 900 }, isMobile: true, hasTouch: true });
  const cdp = await touch.context().newCDPSession(touch);
  await touch.route('**/rest/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await touch.goto('http://127.0.0.1:5179/EPAVOne/#/planner');
  await touch.locator('#app-tab-planner').waitFor();
  await settle(touch);
  await touch.evaluate(() => scrollTo(0, 300));
  await settle(touch);
  const scrollBefore = await touch.evaluate(() => scrollY);
  const panBox = await touch.locator('#app-tab-planner').boundingBox();
  const panStart = { x: panBox.x + panBox.width / 2, y: panBox.y + panBox.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [panStart] });
  for (let i = 1; i <= 10; i++)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: panStart.x, y: panStart.y + i * 12 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(touch);
  assert.equal(await touch.evaluate(() => location.hash), '#/planner');
  assert((await touch.evaluate(() => scrollY)) < scrollBefore, 'Native vertical scrolling must remain available');
  await assertAligned(touch, '.app-tabs');
  await touch.evaluate(() => scrollTo(0, 0));
  await settle(touch);
  const from = await touch.locator('#app-tab-planner').boundingBox(),
    to = await touch.locator('#app-tab-writer').boundingBox();
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let i = 1; i <= 10; i++)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + ((to.x + to.width / 2 - start.x) * i) / 10, y: start.y }]
    });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(touch);
  assert.equal(await touch.evaluate(() => location.hash), '#/writer');
  await assertAligned(touch, '.app-tabs');
  await touch.close();
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally {
  await browser?.close();
  server.kill();
}

import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SITE_URL || 'http://127.0.0.1:3000';
const output = process.env.QA_OUTPUT || '/home/ubuntu/drevallon-delivery';
const shots = path.join(output, 'screenshots');
await fs.mkdir(shots, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const routes = ['/', '/collections', '/category/suits', '/category/blazers', '/category/jackets', '/category/shirts', '/category/trousers', '/category/ties', '/product/the-assembly-suit', '/product/the-passage-jacket', '/studio', '/custom-order', '/search?q=navy', '/about', '/contact', '/account', '/information', '/404'];
const sizes = [
  { name: 'small-phone', width: 320, height: 640 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
];
const capture = new Map([
  ['/', 'home'], ['/collections', 'collections'], ['/studio', 'design-studio'], ['/custom-order', 'custom-order'],
]);
const findings = [];
try {
  for (const size of sizes) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => findings.push({ viewport: size.name, route: page.url(), type: 'pageerror', detail: error.message }));
    for (const route of routes) {
      try {
        const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.locator('main').waitFor({ timeout: 8000 });
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => {
          const w = document.documentElement.clientWidth;
          return {
            overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - w,
            title: document.title,
            h1: document.querySelector('main h1')?.textContent?.trim(),
            missingAlt: [...document.querySelectorAll('main img')].filter(img => !img.hasAttribute('alt')).map(img => img.src),
            brandLogo: document.querySelector('.site-header .brand-logo img')?.getAttribute('src'),
            categoryLinks: [...document.querySelectorAll('.collection-tile')].map(el => el.getAttribute('href')),
          };
        });
        if (!response || response.status() >= 400) findings.push({ viewport: size.name, route, type: 'http', detail: response?.status() });
        if (metrics.overflow > 1) findings.push({ viewport: size.name, route, type: 'horizontal-overflow', detail: metrics.overflow });
        if (metrics.missingAlt.length) findings.push({ viewport: size.name, route, type: 'missing-alt', detail: metrics.missingAlt });
        if (!metrics.h1) findings.push({ viewport: size.name, route, type: 'no-h1', detail: metrics.title });
        if (!metrics.brandLogo?.includes('dervallon-horizontal-lockup')) findings.push({ viewport: size.name, route, type: 'brand-logo', detail: metrics.brandLogo });
        if (route === '/' && metrics.categoryLinks.length !== 6) findings.push({ viewport: size.name, route, type: 'category-links', detail: metrics.categoryLinks });
        if ((size.name === 'phone' || size.name === 'desktop') && capture.has(route)) {
          const broken = await page.evaluate(async () => {
            const images = [...document.querySelectorAll('img')];
            images.forEach(img => { img.loading = 'eager'; });
            await Promise.all(images.map(img => img.decode().catch(() => undefined)));
            return images.filter(img => img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src);
          });
          if (broken.length) findings.push({ viewport: size.name, route, type: 'broken-images', detail: broken });
          await page.screenshot({ path: path.join(shots, `${size.name}-${capture.get(route)}.png`), fullPage: true, animations: 'disabled' });
        }
      } catch (error) {
        findings.push({ viewport: size.name, route, type: 'navigation', detail: error.message });
      }
    }
    console.log(`Checked ${size.name} (${size.width}×${size.height}) across ${routes.length} routes`);
    await context.close();
  }
  for (const size of [sizes[1], sizes[4]]) {
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' });
    await context.addInitScript(() => { try { localStorage.setItem('drevallon-theme', 'dark'); } catch {} });
    const page = await context.newPage();
    for (const route of ['/', '/collections', '/category/ties', '/custom-order', '/about']) {
      try {
        await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.locator('main').waitFor({ timeout: 8000 });
        const m = await page.evaluate(() => ({ dark: document.body.classList.contains('dark-mode'), logo: document.querySelector('.site-header .brand-logo img')?.getAttribute('src'), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
        if (!m.dark || !m.logo?.includes('dark-vector') || m.overflow > 1) findings.push({ viewport: size.name, route, type: 'dark-mode', detail: m });
        if (route === '/' && size.name === 'desktop') await page.screenshot({ path: path.join(shots, 'desktop-home-dark.png'), animations: 'disabled' });
      } catch (error) { findings.push({ viewport: size.name, route, type: 'dark-navigation', detail: error.message }); }
    }
    console.log(`Checked ${size.name} dark mode across five routes`);
    await context.close();
  }
} finally { await browser.close(); }
const report = { date: new Date().toISOString(), base, routes: routes.length, sizes, screenshotFiles: (await fs.readdir(shots)).sort(), findings };
await fs.writeFile(path.join(output, 'visual-qa.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Recorded ${findings.length} findings; ${report.screenshotFiles.length} screenshots.`);
for (const finding of findings.slice(0, 30)) console.log(JSON.stringify(finding));
if (findings.length) process.exitCode = 1;

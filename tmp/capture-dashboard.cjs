const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3060/login', { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="voce@empresa.com"]', 'admin@pay.axionenterprise.cloud');
  await page.fill('input[placeholder="Digite sua senha"]', 'AxionPay$Admin2026!');
  await Promise.all([
    page.waitForURL('**/dashboard/**', { timeout: 15000 }).catch(() => {}),
    page.click('button.authBtn')
  ]);
  const routes = ['overview', 'analytics', 'payouts', 'integrations', 'checkout-pro'];
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:3060/dashboard/${route}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `d:/Projetos/SANDBOX/apps/axion-pay/tmp/screens/dashboard-${route}.png`, fullPage: true });
  }
  await browser.close();
})();

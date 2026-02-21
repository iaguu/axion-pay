const { test, expect } = require('@playwright/test');

test('capture dashboard routes', async ({ page }) => {
  await page.goto('http://127.0.0.1:4070/login');
  await page.fill('input[placeholder="voce@empresa.com"]', 'admin@pay.axionenterprise.cloud');
  await page.fill('input[placeholder="Digite sua senha"]', 'AxionPay$Admin2026!');
  await page.click('button.authBtn');
  await page.waitForTimeout(1200);

  const routes = ['overview', 'analytics', 'payouts', 'integrations', 'checkout-pro'];
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:4070/dashboard/${route}`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `tmp/screens/dashboard-${route}.png`, fullPage: true });
  }
  expect(true).toBeTruthy();
});

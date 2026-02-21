import { test, expect } from '@playwright/test'

test('dashboard visuals', async ({ page, context }) => {
  const cpf = '12345678909'
  const whatsapp = `55${Math.floor(100000000 + Math.random() * 899999999)}`
  const password = 'Axion12345!'

  await context.request.post('http://127.0.0.1:4070/signup', { data: { name: 'QA Dash', cpf, whatsapp, password } })
  await context.request.post('http://127.0.0.1:4070/auth/login', { data: { identifier: whatsapp, password } })

  await page.goto('http://127.0.0.1:4070/dashboard/overview', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'tmp/screens/dashboard-overview-v2.png', fullPage: true })

  await page.goto('http://127.0.0.1:4070/dashboard/actions', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'tmp/screens/dashboard-actions-v2.png', fullPage: true })

  expect(page.url()).toContain('/dashboard/actions')
})

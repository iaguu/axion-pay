import { test, expect } from '@playwright/test'

function computeCheckDigit(digits, weightStart) {
  let sum = 0
  for (let i = 0; i < digits.length; i += 1) sum += digits[i] * (weightStart - i)
  const remainder = (sum * 10) % 11
  return remainder === 10 ? 0 : remainder
}

function generateCpf() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  if (digits.every((digit) => digit === digits[0])) digits[0] = (digits[0] + 1) % 10
  const first = computeCheckDigit(digits, 10)
  const second = computeCheckDigit([...digits, first], 11)
  return digits.concat([first, second]).join('')
}

test('capture dashboard routes', async ({ page, context }) => {
  const cpf = generateCpf()
  const whatsapp = `55${Math.floor(100000000 + Math.random() * 900000000)}`
  const password = 'Axion12345!'

  const signup = await context.request.post('http://127.0.0.1:4070/signup', {
    data: { name: 'QA Dashboard', cpf, whatsapp, password },
  })
  expect(signup.status()).toBe(201)

  const login = await context.request.post('http://127.0.0.1:4070/auth/login', {
    data: { identifier: whatsapp, password },
  })
  expect(login.status()).toBe(200)

  const routes = ['overview', 'analytics', 'payouts', 'integrations', 'checkout-pro']
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:4070/dashboard/${route}`)
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `tmp/screens/dashboard-${route}.png`, fullPage: true })
  }

  expect(page.url()).toContain('/dashboard')
})

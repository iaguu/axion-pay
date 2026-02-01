# Gateway de Pagamentos - Documentacao e Portal

Este repositorio contem:

- Portal de documentacao em **React + Vite** (`web-docs/`)
- Documentos de apoio para **investidores**
- Manual de **integracao tecnica** (API e webhooks)
- Script `.bat` para facilitar o setup no Windows (instalar dependencias e abrir o VS Code)

Foco do gateway:

- **PIX** como metodo principal de pagamento e liquidacao
- **Cartao de credito** via provedores terceiros (Stripe, Pagar.me, Iugu, Stone, etc.)

## Estrutura

- `web-docs/` - SPA em React/Vite para documentacao
- `docs/` - Documentos em Markdown (Investidores, Roadmap, Integracao)
- `docs/openapi.yaml` - Contrato OpenAPI da API de pagamentos
- `scripts/setup-dev.bat` - Script para preparar ambiente local rapidamente

## Pre-requisitos

- Node.js LTS instalado
- Git (opcional, mas recomendado)
- Visual Studio Code instalado e disponivel no PATH (`code`)

## Como usar rapidamente

1. Rode o script de setup (Windows):
   ```bash
   scripts\setup-dev.bat
   ```

2. No terminal que abrir, inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse no navegador o endereco exibido (por padrao: `http://localhost:5173`).

## Build monolítico (frontend + backend)

1. Copie `payment/.env.example` para `payment/.env` e ajuste variáveis sensíveis (porta, SMTP, API key, credenciais).
2. `npm run build` na raiz — o script prepara os `.env`, compila o React/Tailwind (`web-docs`), copia o `dist` para `payment/public/app`, executa os smoke tests e empacota tudo dentro de `build/` com servidor + assets prontos para hospedar.
3. Na pasta `build/` há um `package.json` mínimo que arranca `payment/src/index.js`, permitindo `cd build && npm install --production && npm start` para subir o deploy final na porta `3060`.
4. A pasta `build/payment/public/app` contém um `.htaccess` que garante fallback de SPA. O backend também serve `/docs/`, `/admin`, `/dashboard` como antes, agora tudo dentro de `build/`.

Use `npm start` na raiz se quiser executar o pipeline completo (build + smoke-tests + instalador em `build/payment` e `npm start` ali). Para desenvolvimento paralelo com portas separadas continue usando `node agent/run.js`.

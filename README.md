# Gateway de Pagamentos – Documentação e Portal

Este repositório contém:

- Portal de documentação em **React + Vite** (web-docs/)
- Documentos de apoio para **investidores**
- Manual de **integração técnica** (API e webhooks)
- Script `.bat` para facilitar o setup em Windows (instalar dependências e abrir o VS Code)

Foco do gateway:

- **PIX** como método principal de pagamento e liquidação
- **Cartão de crédito** via provedores terceiros (Stripe, Pagar.me, Iugu, Stone, etc.)

## Estrutura

- `web-docs/` – SPA em React/Vite para documentação
- `docs/` – Documentos em Markdown (Investidores, Roadmap, Integração)
- `scripts/setup-dev.bat` – Script para preparar ambiente local rapidamente

## Pré-requisitos

- Node.js LTS instalado
- Git (opcional, mas recomendado)
- Visual Studio Code instalado e disponível no PATH (`code`)

## Como usar rapidamente

1. Rode o script de setup (Windows):
   ```bash
   scripts\setup-dev.bat
   ```

2. No terminal que abrir, inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse no navegador o endereço exibido (por padrão: `http://localhost:5173`).
# API de Pagamentos - Gateway (PIX + Cartão — Woovi) 🔧

Este repositório contém um protótipo de API de pagamentos em **Node.js + Express** que implementa:

- Criação de cobranças **PIX** (mock, pronto para plugar em PSP/banco);
- Criação de pagamentos com **Cartão** usando *provider* Woovi;
- Webhooks para atualização de status e eventos;
- Persistência local via SQLite (`data/payment.db` por padrão);
- Lista de PSPs e bancos sugeridos em `docs/PSP_LIST.md`.

> ⚠️ Atenção: este código é um **protótipo**. Não está pronto para produção — não substitui PCI-DSS, LGPD, ou homologação bancária.

---

## Estrutura 🔍

- `src/app.js` - configuração do Express, middlewares e rotas
- `src/server.js` - inicialização do servidor
- `src/config/env.js` - carregamento e defaults das variáveis de ambiente
- `src/utils/` - utilitários: logger, validações, segurança
- `src/models/` - acesso a banco e armazenamento de transações
- `src/services/` - orquestração e integração com providers (Woovi, mocks de PIX)
- `src/controllers/` - handlers HTTP
- `src/routes/` - definição das rotas da API
- `docs/openapi.yaml` - contrato OpenAPI (fonte única)

## Requisitos ✅

- Node.js >= 18
- npm ou yarn

## Como rodar (rápido) ▶️

1. Crie um `.env` a partir de `.env.example` e ajuste as variáveis (Windows: `copy .env.example .env`; mac/linux: `cp .env.example .env`).
2. Instale dependências:

   ```bash
   npm install
   ```

3. Inicie em modo desenvolvimento:

   ```bash
   npm run dev
   ```

4. A API inicia em `http://localhost:3060` por padrão (configuração `PORT`).

---

## Autenticação & Idempotência 🔐

- Autenticação: defina `API_KEY` ou `AUTH_REQUIRED=true` para exigir **`x-api-key`** ou **`Authorization: Bearer <token>`** nas rotas de pagamentos.
- Idempotency: envie header **`Idempotency-Key`** em requests de criação; quando uma requisição for rejeitada por replay, a API responde com `200` e cabeçalhos `Location` e `Idempotency-Status: replayed`; se criada, retorna `201` e `Idempotency-Status: created`.

Resposta de criação (exemplo):
- Status `201` com header `Location: /payments/:id` e body:
  ```json
  { "ok": true, "transaction": { /* ... */ }, "pix_payload": "..." }
  ```

---

## Endpoints principais 🛠️

- Criação
  - `POST /payments/pix` — criar cobrança PIX
  - `POST /payments/card` — criar pagamento com cartão (Woovi)
  - `POST /payments` — criar pagamento (use `method: "pix"|"card"`)

- Consulta / listagem
  - `GET /payments` — lista transações (query: `status`, `method`, `provider`, `customer_id`, `created_from`, `created_to`, `limit`, `offset`)
  - `GET /payments/stats` — resumo de volumes e status
  - `GET /payments/status/:status` — filtrar por status
  - `GET /payments/method/:method` — filtrar por método
  - `GET /payments/provider/:providerReference` — buscar por referência do provedor
  - `GET /payments/:id` — obter transação
  - `GET /payments/:id/events` — histórico de eventos

- Ações em transações
  - `POST /payments/:id/confirm` — confirmar PIX (manual / mock)
  - `POST /payments/:id/capture` — capturar cartão autorizado
  - `POST /payments/:id/cancel` — cancelar transação
  - `POST /payments/:id/refund` — reembolso (total ou parcial)
  - `PATCH /payments/:id/metadata` — atualizar/mesclar metadata

- Webhooks
  - `POST /webhooks/pix` — webhook PIX (schema validado)
  - `POST /webhooks/woovi` — webhook Woovi
  - `POST /webhooks/pagarme` — alias legado para o handler Woovi

- Health
  - `GET /health` — status da API

> Observação: a rota `/payments` é protegida por `requireApiKey` quando `AUTH_REQUIRED` ou `API_KEY` estão configurados.

---

## Testes 🧪

- Unit / integration (local):
  ```bash
  npm test
  ```
- Teste de integração com o Woovi real (opcional):
  ```bash
  npm run test:integration
  ```
  Requer `USE_REAL_WOOVI=true` e as variáveis `WOOVI_API_KEY`, `WOOVI_BASE_URL` e `WOOVI_PIX_PATH` configuradas.

---

## Variáveis de ambiente principais (resumo) ⚙️

- `PORT` (default 3060)
- `NODE_ENV`
- `API_KEY` / `AUTH_REQUIRED`
- `DB_PATH` (default: `data/payment.db`)
- `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`, `PIX_DESCRIPTION`, `PIX_TXID`
- `WOOVI_API_KEY`, `WOOVI_BASE_URL`, `WOOVI_AUTH_HEADER`, `WOOVI_PIX_PATH`, `WOOVI_CARD_PATH`, `WOOVI_PIX_CONFIRM_PATH`, `WOOVI_TIMEOUT_MS`
- `WOOVI_WEBHOOK_SECRET`, `PIX_WEBHOOK_SECRET`, `PAGARME_WEBHOOK_SECRET`
- `EMAIL_FROM`, `EMAIL_CONFIRM_BASE_URL`, `DOCS_URL`, `EMAIL_OUTBOX_PATH`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
- `LOG_LEVEL`, `LOG_PRETTY`, `WOOVI_LOG_PATH`, `JSON_BODY_LIMIT`

> Nota: as variáveis `PAGARME_*` existem por compatibilidade com código legado e não fazem parte do fluxo padrão usando Woovi.

Carregamento: `.env` é lido primeiro; se existir, `.env.<NODE_ENV>` sobrescreve valores.

---

## Usuários e Admin 🧾

- `POST /auth/signup` — cria usuário, gera chave API inicial e envia confirmação por e-mail
- `POST /auth/login` — cria sessão de usuário
- `GET /auth/confirm?token=...` — confirma e-mail
- `GET /account/me` — dados do usuário e chaves
- `POST /account/api-keys` — gera nova chave de API
- `DELETE /account/api-keys/:id` — revoga chave
- Admin: `POST /admin/login` (padrão `admin`/`123`), `GET /admin/users`, `PATCH /admin/users/:id/approve|reject`

---

## Status possíveis

`pending`, `authorized`, `paid`, `failed`, `canceled`, `refunded`, `expired`

---

## Segurança & boas práticas 🔐

- Configure `PIX_WEBHOOK_SECRET` e `WOOVI_WEBHOOK_SECRET` para validar assinaturas de webhooks.
- Para reduzir replays, habilite `WEBHOOK_REQUIRE_TIMESTAMP=true` e ajuste `WEBHOOK_TOLERANCE_SECONDS`.
- Use `Idempotency-Key` ao criar pagamentos para evitar duplicidade.
- Dados sensíveis (cartão/CPF) são mascarados antes de persistir em metadata.

---

## OpenAPI

O contrato completo e atualizado está em `docs/openapi.yaml`.

---

Se quiser, posso adicionar exemplos curl/requests para os endpoints de `POST /payments/pix` e `POST /payments/card` ou gerar snippets na documentação. ✅

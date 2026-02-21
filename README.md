# API de Pagamentos - Gateway (PIX + Cartão — Woovi) 🔧

Este repositório contém um protótipo de API de pagamentos em **Node.js + Express** que implementa:

- Criação de cobranças **PIX** (mock, pronto para plugar em PSP/banco);
- Criação de pagamentos com **Cartão** usando *provider* Woovi;
- Webhooks para atualização de status e eventos;
- Persistência local via JSON (`STORAGE_ROOT`/`STORAGE_FILE`, default AppData/Roaming/axion-pay/store.json);
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

3. Em desenvolvimento, rode `npm start` para subir frontend e backend em paralelo (o mesmo que `npm run dev`).

4. Para build + servidor em produção, use `npm run start:prod`.

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
  - `GET /health` — status da API (retorna `requestId`, `timestamp`, `uptime` e `env` e espelha o cabeçalho `X-Request-Id` presente em todas as respostas)

> Observação: a rota `/payments` é protegida por `requireApiKey` quando `AUTH_REQUIRED` ou `API_KEY` estão configurados.

---

## Roteamento de Provedores (Black/White + Pay-tags)

O provedor pode ser for??ado via `metadata.provider`. Caso n??o seja informado, a API roteia automaticamente:

- Opera????o **white** (padr??o): `PIX -> Banco Central (est??tico)`
- Opera????o **black** (expl??cito): `PIX + Cart??o -> MercadoPago`
- Pay-tags especiais:
  - `AXION-PDV`, `ANNETOM`, `ANNE-TOM`: `Cart??o -> InfinitePay`

Como indicar opera????o black:
- Envie o header `x-axion-mode: black` (ou `x-axion-operation: black`) ao criar pagamentos.

Se n??o enviar nada, a opera????o ?? tratada como **white**.


---

## Testes 🧪

- Unit / integration (local):
  ```bash
  npm test
  ```
- Testes focados em pagamentos (PIX/cartão/idempotência):
  ```bash
  npm run test:payments
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
- `DEFAULT_PIX_PROVIDER`, `DEFAULT_CARD_PROVIDER` (o padrão aponta para `mercadopago`; use `mock` apenas em testes isolados)
- `DB_PATH` (mantido para compatibilidade)
- `STORAGE_ROOT` / `STORAGE_FILE` (defina a pasta AppData/Roaming/axion-pay ou sua raiz personalizada; o JSON persistido acompanha todas as tabelas)
- `PIX_KEY`, `PIX_MERCHANT_NAME`, `PIX_MERCHANT_CITY`, `PIX_DESCRIPTION`, `PIX_TXID`
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_BASE_URL`
- `WOOVI_API_KEY`, `WOOVI_BASE_URL`, `WOOVI_AUTH_HEADER`, `WOOVI_PIX_PATH`, `WOOVI_CARD_PATH`, `WOOVI_PIX_CONFIRM_PATH`, `WOOVI_TIMEOUT_MS`
- `WOOVI_WEBHOOK_SECRET`, `PIX_WEBHOOK_SECRET`, `PAGARME_WEBHOOK_SECRET`
- `EMAIL_FROM`, `EMAIL_CONFIRM_BASE_URL`, `DOCS_URL`, `EMAIL_OUTBOX_PATH`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
- `LOG_LEVEL`, `LOG_PRETTY`, `WOOVI_LOG_PATH`, `JSON_BODY_LIMIT`
- `CSP_CONNECT_SRC` (opcional) — lista extra de origens para `connect-src` (ex: `https://pay.axionenterprise.cloud`)
- `ALLOW_ALL_CORS=true` — habilita `"*"` em `Access-Control-Allow-Origin`. Use apenas em ambientes controlados.

> Nota: as variáveis `PAGARME_*` existem por compatibilidade com código legado e não fazem parte do fluxo padrão usando Woovi.

### Provedores e pay-tags especiais

- O fluxo padrão direciona PIX e cartão para o MercadoPago via `DEFAULT_PIX_PROVIDER` e `DEFAULT_CARD_PROVIDER`; ajuste essas variáveis apenas em testes exploratórios (o ambiente de produção usa `mercadopago`).
- Para acionar a InfinitePay com a pay-tag `anne-tom`, inclua o header `pay-tag: anne-tom` ao criar um pagamento com cartão. A API ignora governos definidos no body e roteia automaticamente para a integração da InfinitePay.

### Gerenciamento de pay-tags

- `GET /api/dashboard/pay-tags` retorna o inventário do time, incluindo métricas resumidas.
- `POST /api/dashboard/pay-tags` cria uma nova tag e registra um canal dedicado.
- `DELETE /api/dashboard/pay-tags/:id` exclui a tag, remove os relatórios associados e deixa o volume já recebido intacto no histórico do DB (confirmamos essa operação no dashboard antes de deletar).

### Fluxo de saques e chave PIX

- `POST /account/payout-key` salva a chave PIX (CPF/CNPJ/email/phone) no campo `default_payout_destination` do usuário para uso nos repasses.
- `POST /api/dashboard/payouts` registra o pedido de saque na tabela `payoutRequests` do JSON store (status `pending`) e bloqueia o valor equivalente no dashboard até a liberação.
- O time administrativo visualiza e libera os repasses em `GET /admin/payouts` + `PATCH /admin/payouts/:id/release`, garantindo que cada pedido role para o histórico do DB com uma aprovaçao manual clara.
- Use as credenciais declaradas em `.env.example` para o MercadoPago (public key `APP_USR-4bf3f6f7-e47b-4687-bfcf-5132bf945b7a` e access token `APP_USR-884364791290258-010711-1ccfcaba90237a5b6258e9cf6300649f-2238520778`) ou substitua por suas próprias antes de subir o ambiente.

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
- Admin: `POST /admin/login` (credenciais definidas em `ADMIN_USERNAME`/`ADMIN_PASSWORD`), `GET /admin/users`, `PATCH /admin/users/:id/approve|reject`

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

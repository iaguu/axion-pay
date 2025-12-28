# API de Pagamentos - Gateway (PIX + Cartao, Woovi)

Este repositorio contem um prototipo de API de pagamentos em **Node.js + Express**, com:

- Criacao de cobrancas **PIX** (mock, pronto para plugar em PSP/banco);
- Criacao de pagamentos de **Cartao** usando Woovi;
- Webhooks para atualizacao de status;
- Persistencia local via SQLite (arquivo `data/payment.db`);
- Lista de PSPs e bancos sugeridos para producao.

> Atencao: este codigo e um **prototipo**. Nao esta pronto para producao e nao substitui PCI-DSS, LGPD ou homologacao bancaria.

## Estrutura

- `src/server.js` - bootstrap do Express
- `src/config/env.js` - variaveis de ambiente
- `src/utils/` - logger, validacoes e seguranca
- `src/models/db.js` - conexao SQLite
- `src/models/transactionStore.js` - persistencia de transacoes
- `src/services/` - orquestracao e providers (Pagar.me, PIX)
- `src/controllers/` - controllers HTTP
- `src/routes/` - rotas da API
- `docs/PSP_LIST.md` - lista de PSPs e bancos para PIX/cartao

## Requisitos

- Node.js >= 18
- npm ou yarn

## Como rodar

1. Copie o arquivo `.env.example` para `.env` e ajuste as variaveis:

   ```bash
   cp .env.example .env
   ```

2. Instale dependencias:

   ```bash
   npm install
   ```

3. Inicie o servidor:

   ```bash
   npm run dev
   ```

4. A API sobe em `http://localhost:3060`.

> Autenticacao: use `API_KEY` e `AUTH_REQUIRED=true` para exigir `x-api-key` ou `Authorization: Bearer` nas rotas `/payments`. O sistema tambem aceita chaves geradas por usuario (fluxo `/auth` + `/account`).

## Testes automatizados

```bash
npm test
```

Para teste de integracao com Woovi (opcional):

```bash
npm run test:integration
```

Requer `WOOVI_API_KEY`, `WOOVI_BASE_URL` e `WOOVI_PIX_PATH`. O teste de webhook
PIX so roda se `WOOVI_PIX_CONFIRM_PATH` estiver configurado.

## Variaveis de ambiente

- `PORT`
- `NODE_ENV`
- `TRUST_PROXY`
- `API_KEY`
- `AUTH_REQUIRED`
- `SESSION_TTL_DAYS`
- `ADMIN_SESSION_TTL_DAYS`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `CORS_CREDENTIALS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `LOG_LEVEL`
- `LOG_PRETTY`
- `WOOVI_LOG_PATH`
- `EMAIL_FROM`
- `EMAIL_CONFIRM_BASE_URL`
- `DOCS_URL`
- `EMAIL_OUTBOX_PATH`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `DB_PATH`
- `PIX_KEY`
- `PIX_MERCHANT_NAME`
- `PIX_MERCHANT_CITY`
- `PIX_DESCRIPTION`
- `PIX_TXID`
- `PAGARME_API_KEY`
- `PAGARME_BASE_URL`
- `WOOVI_API_KEY`
- `WOOVI_BASE_URL`
- `WOOVI_AUTH_HEADER`
- `WOOVI_PIX_PATH`
- `WOOVI_CARD_PATH`
- `WOOVI_PIX_CONFIRM_PATH`
- `WOOVI_TIMEOUT_MS`
- `PIX_WEBHOOK_SECRET`
- `PAGARME_WEBHOOK_SECRET`
- `WOOVI_WEBHOOK_SECRET`
- `WEBHOOK_REQUIRE_TIMESTAMP`
- `WEBHOOK_TOLERANCE_SECONDS`
- `JSON_BODY_LIMIT`

Observacao: variaveis `PAGARME_*` sao legadas e nao sao usadas pelo fluxo Woovi.

Se `WOOVI_AUTH_HEADER` nao for definido, o sistema usa `WOOVI_API_KEY` diretamente no header `Authorization`.

Carregamento de envs: `.env` sempre e lido e, se existir, `.env.<NODE_ENV>` sobrescreve os valores do `.env`.

## OpenAPI

O contrato completo esta em `docs/openapi.yaml`.

## Endpoints principais

### Criacao de pagamentos

- `POST /payments/pix` - cria cobranca PIX (mock)
- `POST /payments/card` - cria pagamento de cartao (Woovi)
- `POST /payments` - cria pagamento via campo `method` (legado)

### Consultas e listagens

- `GET /payments` - lista transacoes (filtros: `status`, `method`, `provider`, `customer_id`, `created_from`, `created_to`)
- `GET /payments/stats` - resumo de volume e status
- `GET /payments/status/:status` - lista por status
- `GET /payments/method/:method` - lista por metodo
- `GET /payments/:id` - consulta transacao por ID
- `GET /payments/:id/events` - historico de eventos
- `GET /payments/provider/:providerReference` - busca por referencia do provedor

### Acoes na transacao

- `POST /payments/:id/confirm` - confirma PIX (mock/manual)
- `POST /payments/:id/capture` - captura cartao autorizado
- `POST /payments/:id/cancel` - cancela transacao pendente/autorizada
- `POST /payments/:id/refund` - reembolso (total ou parcial)
- `PATCH /payments/:id/metadata` - mescla metadata

### Webhooks

- `POST /webhooks/pix` - webhook PIX (mock)
- `POST /webhooks/woovi` - webhook Woovi (modelo)
- `POST /webhooks/pagarme` - alias legado para webhook Woovi

### Health

- `GET /health` - status da API

## Usuarios e admin

- `POST /auth/signup` - cria usuario, gera API key inicial e envia confirmacao de email
- `POST /auth/login` - cria sessao do usuario
- `GET /auth/confirm?token=...` - confirma email
- `GET /account/me` - dados do usuario e chaves
- `POST /account/api-keys` - gera nova chave
- `DELETE /account/api-keys/:id` - revoga chave
- `POST /admin/login` - login admin (padrao admin/123)
- `GET /admin/users` - lista usuarios
- `PATCH /admin/users/:id/approve` - aprova conta
- `PATCH /admin/users/:id/reject` - rejeita conta
- `POST /admin/users/:id/send-docs` - envia documentacao por email

## Status possiveis

`pending`, `authorized`, `paid`, `failed`, `canceled`, `refunded`, `expired`

## Notas de seguranca

- Configure `PIX_WEBHOOK_SECRET` e `WOOVI_WEBHOOK_SECRET` para validar assinaturas de webhook.
- Para reduzir replay, habilite `WEBHOOK_REQUIRE_TIMESTAMP=true` e ajuste `WEBHOOK_TOLERANCE_SECONDS`.
- Use `Idempotency-Key` nos requests de criacao para evitar duplicidade.
- Dados sensiveis (cartao/CPF) sao mascarados antes de persistir em metadata.

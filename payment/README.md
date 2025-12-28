# API de Pagamentos - Gateway (PIX + Cartao, Woovi)

Este repositorio contem um prototipo de API de pagamentos em **Node.js + Express**, com:

- Criacao de cobrancas **PIX** (mock, pronto para plugar em PSP/banco);
- Criacao de pagamentos de **Cartao** usando Woovi;
- Webhooks para atualizacao de status;
- Store em memoria para testes rapidos;
- Lista de PSPs e bancos sugeridos para producao.

> Atencao: este codigo e um **prototipo**. Nao esta pronto para producao e nao substitui PCI-DSS, LGPD ou homologacao bancaria.

## Estrutura

- `src/server.js` - bootstrap do Express
- `src/config/env.js` - variaveis de ambiente
- `src/utils/` - logger, validacoes e seguranca
- `src/models/transactionStore.js` - armazenamento em memoria
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

4. A API sobe em `http://localhost:3000`.

## Testes automatizados

```bash
npm test
```

## Variaveis de ambiente

- `PORT`
- `NODE_ENV`
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
- `JSON_BODY_LIMIT`

Observacao: variaveis `PAGARME_*` sao legadas e nao sao usadas pelo fluxo Woovi.

Se `WOOVI_AUTH_HEADER` nao for definido, o sistema usa `WOOVI_API_KEY` diretamente no header `Authorization`.

Carregamento de envs: `.env` sempre e lido e, se existir, `.env.<NODE_ENV>` sobrescreve os valores do `.env`.

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

## Status possiveis

`pending`, `authorized`, `paid`, `failed`, `canceled`, `refunded`, `expired`

## Notas de seguranca

- Configure `PIX_WEBHOOK_SECRET` e `WOOVI_WEBHOOK_SECRET` para validar assinaturas de webhook.
- Use `Idempotency-Key` nos requests de criacao para evitar duplicidade.
- Dados sensiveis (cartao/CPF) sao mascarados antes de persistir em metadata.

# Manual de Integração Técnica

Este manual descreve como um desenvolvedor integra sua aplicação ao Gateway,
com foco em PIX e cartão via provedores terceiros.

## 1. Autenticação

Todas as requisições devem incluir o cabeçalho:

```http
x-api-key: SUA_CHAVE_DE_API
Accept: application/json
Content-Type: application/json
```

Ambientes:

- Sandbox: `https://sandbox.api.seugateway.com`
- Produção: `https://api.seugateway.com`

## 2. Criar cobrança PIX

### Endpoint

```http
POST /payments/pix
```

### Request JSON

```json
{
  "amount": 129.90,
  "currency": "BRL",
  "description": "Pedido #548",
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "metadata": {
    "orderId": "548",
    "source": "ecommerce"
  }
}
```

### Resposta esperada (sucesso)

```json
{
  "ok": true,
  "transactionId": "tx_94f065",
  "status": "pending",
  "pix": {
    "qrcode": "00020126360014BR.GOV.BCB.PIX...",
    "copia_colar": "000201010212...",
    "expiresAt": "2025-01-01T12:00:00-03:00"
  }
}
```

O `transactionId` deve ser armazenado em seu sistema para futuras consultas e conciliação.

## 3. Consultar pagamento

```http
GET /payments/{transactionId}
```

Resposta (exemplo pago):

```json
{
  "ok": true,
  "status": "paid",
  "method": "pix",
  "transactionId": "tx_94f065",
  "providerReference": "BKP-9981",
  "paidAt": "2025-01-02T09:41:03-03:00"
}
```

## 4. Webhooks

Configure um endpoint em sua aplicação, por exemplo:

```http
POST /webhooks/payment-status
```

O gateway enviará notificações assim que o pagamento for confirmado ou alterado.

Exemplo de payload (PIX confirmado):

```json
{
  "event": "PAYMENT_CONFIRMED",
  "method": "pix",
  "transactionId": "tx_94f065",
  "status": "paid",
  "amount": 129.90,
  "paidAt": "2025-01-02T09:41:03-03:00",
  "metadata": {
    "orderId": "548"
  }
}
```

O recomendável é que o seu sistema:

1. Valide o segredo/assinatura do webhook.
2. Atualize o status do pedido internamente.
3. Registre logs de auditoria da notificação.

## 5. Cartão via Provedor Terceiro

Para cartão, recomenda-se:

- Usar um provedor como Stripe, Pagar.me, Iugu ou similar.
- A sua aplicação pode chamar o gateway com um `paymentMethodToken` (token gerado pelo PSP).
- O gateway orquestra e registra a transação, sem manipular dados sensíveis do cartão.

Fluxo típico:

1. Cliente preenche cartão em componente seguro do PSP.
2. PSP retorna um token (ex.: `card_tok_abc123`).
3. Sua aplicação chama o endpoint do gateway:

```json
{
  "amount": 200.00,
  "currency": "BRL",
  "method": "card",
  "paymentMethodToken": "card_tok_abc123",
  "metadata": {
    "orderId": "999"
  }
}
```

4. O gateway aciona o PSP, registra a transação e retorna o status consolidado.

## 6. Boas práticas

- Sempre validar SSL/TLS.
- Utilizar timeouts e retentativas para consumo de API.
- Implementar logs estruturados (correlationId / transactionId).
- Configurar alertas para taxas anormais de falha.
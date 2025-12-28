### Pagamento com cartão (via PSP)

Fluxo recomendado:

1. Coletar dados do cartão em componente seguro do PSP (Stripe, Pagar.me, Iugu etc.).
2. Receber um token seguro (ex.: `card_tok_abc123`).
3. Enviar para o gateway:

POST /payments/card

{
  "amount": 200.00,
  "currency": "BRL",
  "paymentMethodToken": "card_tok_abc123",
  "metadata": { "orderId": "999" }
}

O gateway registra, orquestra e retorna o status consolidado.
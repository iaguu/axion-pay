### Pagamento com cartão (via PSP)

Fluxo recomendado:

1. Coletar dados do cartão em componente seguro do PSP (Stripe, Pagar.me, Iugu etc.).
2. Receber um token seguro (ex.: `card_tok_abc123`).
3. Enviar para o gateway:


POST /payments/card

{
  "amount": 200.00,
  "customer": {
    "name": "Abner Campos",
    "email": "abner@example.com",
    "phone_number": "+5511999990000"
  },
  "card": {
    "number": "4111111111111111",
    "holder_name": "ABNER CAMPOS",
    "exp_month": "12",
    "exp_year": "2028",
    "cvv": "123"
  },
  "metadata": {
    "orderId": "999",
    "address": {
      "cep": "02462030",
      "street": "Rua Caetano Gonçalves",
      "neighborhood": "Chora Menino",
      "number": "111",
      "complement": "Casa 2"
    },
    "webhook_url": "https://meusite.com/webhook",
    "redirect_url": "https://meusite.com/retorno"
  }
}

O gateway registra, orquestra e retorna o status consolidado.
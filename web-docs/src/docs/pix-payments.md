### Criar cobrança PIX

POST /payments/pix


Body:

{
  "amount": 10.5,
  "customer": {
    "name": "João da Silva",
    "email": "joao@email.com"
  },
  "metadata": {
    "orderId": "123"
  }
}

Resposta:

{
  "ok": true,
  "transaction": {
    "id": "4730ede5-c5ff-4121-8d68-8f008ddcd4f8",
    "amount": 10.5,
    "amountCents": 1050,
    "currency": "BRL",
    "method": "pix",
    "status": "pending",
    "capture": 1,
    "customer": {
      "name": "João da Silva"
    },
    "customerId": null,
    "provider": "pix-local",
    "providerReference": "pix-1767054297459",
    "methodDetails": null,
    "metadata": {
      "transactionId": "4730ede5-c5ff-4121-8d68-8f008ddcd4f8",
      "pix": {
        "qrcode": "000201...",
        "copia_colar": "000201..."
      }
    },
    "createdAt": "2025-12-30T00:24:57.455Z",
    "updatedAt": "2025-12-30T00:24:57.460Z"
  }
}
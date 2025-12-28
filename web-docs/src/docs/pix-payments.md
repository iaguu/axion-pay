### Criar cobrança PIX

POST /payments/pix

Body:

{
  "amount": 129.90,
  "currency": "BRL",
  "description": "Pedido #548",
  "customer": {
    "name": "João Silva"
  }
}

Resposta:

{
  "ok": true,
  "transactionId": "tx_94f065",
  "status": "pending",
  "pix": {
    "qrcode": "00020126360014BR.GOV.BCB.PIX...",
    "copia_colar": "000201010212..."
  }
}
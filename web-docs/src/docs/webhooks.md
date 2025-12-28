### Webhooks

Configure um endpoint para receber mudanças de status:

Exemplo de payload de confirmação de pagamento:

{
  "event": "PAYMENT_CONFIRMED",
  "transactionId": "tx_94f065",
  "status": "paid",
  "amount": 129.90,
  "method": "pix"
}

Recomendações:

- Validar assinatura/segredo.
- Atualizar pedido internamente.
- Retornar HTTP 200 somente após o processamento.
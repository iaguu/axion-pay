import { logger } from "../../utils/logger.js";

export async function createCardTransactionWithInfinite({
  amount_cents,
  customer,
  metadata
}) {
  const handle = "annetom";
  const transactionId = metadata.transactionId;

  // Payload configurado conforme documentacao da InfinitePay
  const payload = {
    handle,
    order_nsu: transactionId,
    redirect_url: metadata?.redirect_url || metadata?.return_url || "https://annetom.com/payconfirmed",
    webhook_url: metadata?.webhook_url || "https://api.annetom.com/webhook-infinitepay",
    items: [
      {
        quantity: 1,
        price: amount_cents,
        description: `Pedido ${transactionId}`
      }
    ],
    customer: {
      name: customer?.name || "Cliente",
      email: customer?.email || "email@teste.com",
      phone_number: customer?.phone_number || "",
      // document pode ser guardado internamente, mas não vai no payload público
    },
    address: {
      cep: metadata?.address?.cep || "",
      street: metadata?.address?.street || "",
      neighborhood: metadata?.address?.neighborhood || "",
      number: metadata?.address?.number || "",
      complement: metadata?.address?.complement || ""
    }
  };

  try {
    logger.info({ payload }, "Enviando requisicao para InfinitePay");

    const response = await fetch("https://api.infinitepay.io/invoices/public/checkout/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Log da resposta para visualizacao no console/arquivo
    logger.info({ data }, "Resposta da InfinitePay recebida");
    console.log("--- INFINITEPAY RESPONSE ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("----------------------------");

    if (!response.ok) {
      logger.error({ status: response.status, data }, "Erro na resposta da InfinitePay");
      return {
        success: false,
        error: JSON.stringify(data)
      };
    }

    return {
      success: true,
      status: "pending", // Link gerado, aguardando acao do usuario
      provider: "infinity",
      providerReference: data.id || transactionId,
      raw: data
    };
  } catch (error) {
    logger.error({ error }, "Excecao ao chamar InfinitePay");
    return {
      success: false,
      error: error.message
    };
  }
}
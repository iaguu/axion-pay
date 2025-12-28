import React from "react";
import { Link } from "react-router-dom";

const TRANSACTION_RESPONSE = `{
  "ok": true,
  "transaction": {
    "id": "8a1d2f54-5d30-4c64-9f7f-2cc3fda03f2c",
    "amount": 12.34,
    "amount_cents": 1234,
    "currency": "BRL",
    "method": "pix",
    "status": "pending",
    "capture": true,
    "customer": { "id": "cust_1", "name": "Cliente Teste" },
    "provider": "woovi-mock",
    "providerReference": "PIX-1700000000000",
    "metadata": { "transactionId": "8a1d2f54-5d30-4c64-9f7f-2cc3fda03f2c" },
    "createdAt": "2025-01-05T10:20:30Z",
    "updatedAt": "2025-01-05T10:20:30Z",
    "events": [{ "type": "created", "status": "pending", "at": "2025-01-05T10:20:30Z" }]
  }
}`;

const LIST_RESPONSE = `{
  "ok": true,
  "total": 2,
  "count": 2,
  "limit": 50,
  "offset": 0,
  "transactions": [{ "...": "..." }]
}`;

const STATS_RESPONSE = `{
  "ok": true,
  "stats": {
    "total": 2,
    "total_amount_cents": 10999,
    "total_paid_cents": 9999,
    "by_status": { "paid": 1, "pending": 1 },
    "by_method": { "pix": 1, "card": 1 }
  }
}`;

const EVENTS_RESPONSE = `{
  "ok": true,
  "events": [
    { "type": "created", "status": "pending", "at": "2025-01-05T10:20:30Z" },
    { "type": "status_changed", "from": "pending", "to": "paid", "at": "2025-01-05T10:35:10Z" }
  ]
}`;

const HEALTH_RESPONSE = `{
  "ok": true,
  "status": "UP",
  "env": "development",
  "uptime": 120.52
}`;

const WEBHOOK_PIX_RESPONSE = `{
  "ok": true,
  "transaction": { "...": "..." }
}`;

const ENDPOINT_SECTIONS = [
  {
    title: "Criação de pagamentos",
    description: "Crie PIX ou cartão e receba a transação completa (x-api-key obrigatório).",
    endpoints: [
      {
        method: "POST",
        path: "/payments",
        summary: "Cria pagamento via method (pix | card).",
        request: `{
  "method": "pix",
  "amount": 12.34,
  "currency": "BRL",
  "customer": { "id": "cust_1", "name": "Cliente Teste" },
  "metadata": { "order": "123" }
}`,
        response: TRANSACTION_RESPONSE,
        notes: [
          "Header Idempotency-Key é opcional e evita duplicidade.",
          "Retorna Location com /payments/:id."
        ]
      },
      {
        method: "POST",
        path: "/payments/pix",
        summary: "Cria cobrança PIX.",
        request: `{
  "amount": 12.34,
  "currency": "BRL",
  "customer": { "id": "cust_1", "name": "Cliente Teste" },
  "metadata": { "order": "123" }
}`,
        response: TRANSACTION_RESPONSE,
        notes: [
          "Status inicial: pending.",
          "providerReference vem do mock ou Woovi."
        ]
      },
      {
        method: "POST",
        path: "/payments/card",
        summary: "Cria pagamento com cartão.",
        request: `{
  "amount_cents": 9999,
  "currency": "BRL",
  "capture": false,
  "card": {
    "number": "4111111111111111",
    "holder_name": "Cliente 3",
    "exp_month": 1,
    "exp_year": 2031,
    "cvv": "123"
  }
}`,
        response: TRANSACTION_RESPONSE,
        notes: [
          "capture=false retorna status authorized.",
          "card_hash pode substituir card."
        ]
      }
    ]
  },
  {
    title: "Consulta e listagem",
    description: "Filtros, paginação e detalhes da transação.",
    endpoints: [
      {
        method: "GET",
        path: "/payments",
        summary: "Lista transações.",
        request: "GET /payments?status=paid&method=pix&limit=50&offset=0",
        response: LIST_RESPONSE,
        notes: [
          "Filtros: status, method, provider, customer_id, created_from, created_to."
        ]
      },
      {
        method: "GET",
        path: "/payments/:id",
        summary: "Consulta transação por ID.",
        request: "GET /payments/8a1d2f54-5d30-4c64-9f7f-2cc3fda03f2c",
        response: TRANSACTION_RESPONSE,
        notes: ["Retorna 404 se não existir."]
      },
      {
        method: "GET",
        path: "/payments/:id/events",
        summary: "Histórico de eventos da transação.",
        request: "GET /payments/8a1d2f54-5d30-4c64-9f7f-2cc3fda03f2c/events",
        response: EVENTS_RESPONSE,
        notes: ["Eventos incluem created, status_changed e metadata_updated."]
      },
      {
        method: "GET",
        path: "/payments/stats",
        summary: "Resumo por status e método.",
        request: "GET /payments/stats",
        response: STATS_RESPONSE,
        notes: ["Inclui total_paid_cents e distribuição por status."]
      }
    ]
  },
  {
    title: "Ações na transação",
    description: "Captura, cancelamento, reembolso e metadata.",
    endpoints: [
      {
        method: "POST",
        path: "/payments/:id/capture",
        summary: "Captura pagamento autorizado.",
        request: "POST /payments/:id/capture",
        response: TRANSACTION_RESPONSE,
        notes: ["Apenas status authorized (cartão)."]
      },
      {
        method: "POST",
        path: "/payments/:id/cancel",
        summary: "Cancela pendente ou autorizado.",
        request: "POST /payments/:id/cancel",
        response: TRANSACTION_RESPONSE,
        notes: ["Válido para pending e authorized."]
      },
      {
        method: "POST",
        path: "/payments/:id/refund",
        summary: "Reembolso total ou parcial.",
        request: `{
  "amount_cents": 500
}`,
        response: TRANSACTION_RESPONSE,
        notes: ["Apenas status paid. amount_cents opcional."]
      },
      {
        method: "PATCH",
        path: "/payments/:id/metadata",
        summary: "Mescla metadata na transação.",
        request: `{
  "metadata": {
    "order": "123",
    "source": "checkout"
  }
}`,
        response: TRANSACTION_RESPONSE,
        notes: ["Dados sensíveis são mascarados."]
      },
      {
        method: "POST",
        path: "/payments/:id/confirm",
        summary: "Confirma PIX manualmente (mock).",
        request: "POST /payments/:id/confirm",
        response: TRANSACTION_RESPONSE,
        notes: ["Exige providerReference e método pix."]
      }
    ]
  },
  {
    title: "Webhooks e health",
    description: "Entradas externas e monitoramento.",
    endpoints: [
      {
        method: "POST",
        path: "/webhooks/pix",
        summary: "Webhook PIX com validação HMAC.",
        request: `{
  "providerReference": "PIX-1700000000000",
  "event": "PIX_CONFIRMED"
}`,
        response: WEBHOOK_PIX_RESPONSE,
        notes: [
          "Headers: x-pix-signature ou x-webhook-signature.",
          "Timestamp opcional: x-webhook-timestamp para reduzir replay.",
          "Eventos: PIX_CONFIRMED, PIX_FAILED, PIX_EXPIRED."
        ]
      },
      {
        method: "POST",
        path: "/webhooks/pagarme",
        summary: "Webhook do provedor (payload bruto).",
        request: "{ ...payload do provedor... }",
        response: WEBHOOK_PIX_RESPONSE,
        notes: [
          "Headers: x-pagarme-signature, x-hub-signature ou x-webhook-signature.",
          "Considere mapear para Woovi/Pagar.me conforme provider."
        ]
      },
      {
        method: "GET",
        path: "/health",
        summary: "Status da API.",
        request: "GET /health",
        response: HEALTH_RESPONSE,
        notes: ["Retorna uptime e ambiente ativo."]
      }
    ]
  }
];

export function ApiDetailsPage() {
  return (
    <div className="api-page">
      <section className="section hero compact">
        <div className="hero-copy">
          <span className="eyebrow">API Reference</span>
          <h1>Detalhes completos dos endpoints.</h1>
          <p className="lead">
            Requests e responses reais da API de pagamentos com autenticacao por API key.
          </p>
          <div className="hero-actions">
            <Link className="button ghost" to="/api">
              Visão geral da API
            </Link>
            <Link className="button primary" to="/cadastro">
              Criar sandbox
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <div className="panel-title">Base URL</div>
            <p className="panel-text">
              Local: <strong>http://localhost:3000</strong>
            </p>
          </div>
          <div className="panel-card">
            <div className="panel-title">Cabeçalhos</div>
            <p className="panel-text">
              x-api-key e Authorization: Bearer sao obrigatorios em /payments.
              <br />
              Idempotency-Key e x-request-id estão disponíveis em todas as
              respostas.
            </p>
          </div>
        </div>
      </section>

      {ENDPOINT_SECTIONS.map((section) => (
        <section className="section" key={section.title}>
          <div className="section-header">
            <span className="eyebrow">{section.title}</span>
            <h2>{section.description}</h2>
          </div>
          <div className="detail-grid">
            {section.endpoints.map((endpoint) => (
              <article className="detail-card" key={`${endpoint.method}-${endpoint.path}`}>
                <div className="detail-header">
                  <span className={`method ${endpoint.method.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                  <code>{endpoint.path}</code>
                </div>
                <p className="detail-summary">{endpoint.summary}</p>
                <div className="detail-content">
                  <div className="detail-block">
                    <div className="detail-title">Request</div>
                    <pre className="detail-code">
                      <code>{endpoint.request || "Sem body"}</code>
                    </pre>
                  </div>
                  <div className="detail-block">
                    <div className="detail-title">Response</div>
                    <pre className="detail-code">
                      <code>{endpoint.response || "Sem response body"}</code>
                    </pre>
                  </div>
                </div>
                {endpoint.notes?.length ? (
                  <ul className="detail-notes">
                    {endpoint.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

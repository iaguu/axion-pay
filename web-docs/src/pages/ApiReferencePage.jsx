import React from "react";
import { Link } from "react-router-dom";

const QUICKSTART = [
  {
    title: "Configure o ambiente",
    description:
      "Copie o .env.example, defina PORT, API_KEY e segredos de webhook (PIX e Pagar.me/Woovi)."
  },
  {
    title: "Inicie a API",
    description: "Rode o servidor e use a base local: http://localhost:3060."
  },
  {
    title: "Crie um pagamento",
    description:
      "Use POST /payments/pix ou /payments/card com x-api-key (Idempotency-Key recomendado)."
  },
  {
    title: "Consuma webhooks",
    description:
      "Valide HMAC no /webhooks/pix e use timestamp opcional para evitar replay."
  }
];

const ENDPOINT_GROUPS = [
  {
    title: "Health",
    description: "Status da aplicação e tempo de atividade.",
    endpoints: [{ method: "GET", path: "/health", desc: "Status da API." }]
  },
  {
    title: "Pagamentos - criação",
    description: "Cria transações PIX ou cartão.",
    endpoints: [
      {
        method: "POST",
        path: "/payments",
        desc: "Cria pagamento via campo method (pix | card)."
      },
      {
        method: "POST",
        path: "/payments/pix",
        desc: "Cria cobrança PIX."
      },
      {
        method: "POST",
        path: "/payments/card",
        desc: "Cria pagamento com cartão."
      }
    ]
  },
  {
    title: "Pagamentos - consultas",
    description: "Listas e consultas de transações.",
    endpoints: [
      {
        method: "GET",
        path: "/payments",
        desc:
          "Lista transações (filtros: status, method, provider, customer_id, created_from, created_to)."
      },
      {
        method: "GET",
        path: "/payments/stats",
        desc: "Resumo por status, método e volume."
      },
      {
        method: "GET",
        path: "/payments/status/:status",
        desc: "Lista por status."
      },
      {
        method: "GET",
        path: "/payments/method/:method",
        desc: "Lista por método."
      },
      {
        method: "GET",
        path: "/payments/provider/:providerReference",
        desc: "Busca por referência do provedor."
      },
      {
        method: "GET",
        path: "/payments/:id",
        desc: "Consulta transação por ID."
      },
      {
        method: "GET",
        path: "/payments/:id/events",
        desc: "Histórico de eventos da transação."
      }
    ]
  },
  {
    title: "Pagamentos - ações",
    description: "Operações pós-criação.",
    endpoints: [
      {
        method: "POST",
        path: "/payments/:id/confirm",
        desc: "Confirma PIX manualmente (mock)."
      },
      {
        method: "POST",
        path: "/payments/:id/capture",
        desc: "Captura cartão autorizado."
      },
      {
        method: "POST",
        path: "/payments/:id/cancel",
        desc: "Cancela pendente ou autorizado."
      },
      {
        method: "POST",
        path: "/payments/:id/refund",
        desc: "Reembolso total ou parcial (amount_cents opcional)."
      },
      {
        method: "PATCH",
        path: "/payments/:id/metadata",
        desc: "Mescla metadata na transação."
      }
    ]
  },
  {
    title: "Webhooks",
    description: "Entradas de confirmação e status.",
    endpoints: [
      {
        method: "POST",
        path: "/webhooks/pix",
        desc: "Webhook PIX (assinatura HMAC)."
      },
      {
        method: "POST",
        path: "/webhooks/pagarme",
        desc: "Webhook do provedor (payload bruto)."
      }
    ]
  }
];

const WEBHOOK_EVENTS = ["PIX_CONFIRMED", "PIX_FAILED", "PIX_EXPIRED"];

const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "canceled",
  "refunded",
  "expired"
];

const ERROR_CODES = [
  {
    code: "invalid_request",
    description: "Parâmetros ausentes ou inválidos."
  },
  {
    code: "not_found",
    description: "Transação não encontrada."
  },
  {
    code: "invalid_method",
    description: "Método inválido para a ação solicitada."
  },
  {
    code: "invalid_status",
    description: "Status atual não permite a operação."
  },
  {
    code: "invalid_amount",
    description: "Valor inválido para reembolso."
  },
  {
    code: "invalid_signature",
    description: "Assinatura de webhook inválida."
  },
  {
    code: "unauthorized",
    description: "API key obrigatória."
  },
  {
    code: "forbidden",
    description: "API key inválida."
  },
  {
    code: "auth_misconfigured",
    description: "API key não configurada no servidor."
  },
  {
    code: "payload_too_large",
    description: "Payload acima do limite configurado."
  },
  {
    code: "internal_error",
    description: "Erro interno inesperado."
  }
];

const SUPPORT_TOOLS = [
  {
    title: "Idempotência",
    desc: "Use Idempotency-Key para evitar duplicidade em POSTs."
  },
  {
    title: "Autenticação",
    desc: "Use x-api-key ou Authorization: Bearer nas rotas /payments."
  },
  {
    title: "x-request-id",
    desc: "Cada resposta retorna um request-id para auditoria."
  },
  {
    title: "Providers",
    desc: "Woovi configurado ou fallback mock para PIX e cartão."
  }
];

const OPENAPI_SNIPPET = `openapi: 3.0.3
info:
  title: AxionPAY Payment API
  version: 0.2.0
servers:
  - url: http://localhost:3060
security:
  - ApiKeyAuth: []
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
paths:
  /payments/pix:
    post:
      summary: Cria cobrança PIX
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PixPaymentRequest"
      responses:
        "201":
          $ref: "#/components/responses/PaymentCreated"
  /payments/card:
    post:
      summary: Cria pagamento com cartão
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CardPaymentRequest"
components:
  responses:
    PaymentCreated:
      description: Pagamento criado
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/PaymentResponse"
  schemas:
    PaymentResponse:
      type: object
      properties:
        ok: { type: boolean }
        transaction: { $ref: "#/components/schemas/Transaction" }`;

const TRANSACTION_SCHEMA = `{
  "id": "uuid",
  "amount": 12.34,
  "amount_cents": 1234,
  "currency": "BRL",
  "method": "pix",
  "status": "pending",
  "capture": true,
  "customer": { "id": "cust_1", "name": "Cliente Teste" },
  "provider": "woovi-mock",
  "providerReference": "PIX-1700000000000",
  "methodDetails": null,
  "metadata": { "transactionId": "uuid" },
  "createdAt": "2025-01-05T10:20:30Z",
  "updatedAt": "2025-01-05T10:20:30Z",
  "events": [{ "type": "created", "status": "pending", "at": "2025-01-05T10:20:30Z" }]
}`;


const PIX_REQUEST = `{
  "amount": 10.5,
  "customer": {
    "name": "João da Silva",
    "email": "joao@email.com"
  },
  "metadata": {
    "orderId": "123"
  }
}`;

const CARD_REQUEST = `{
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
}`;

const REFUND_REQUEST = `{
  "amount_cents": 500
}`;

export function ApiReferencePage() {
  return (
    <div className="api-page">
      <section className="section hero compact">
        <div className="hero-copy">
          <span className="eyebrow">API e Integração</span>
          <h1>Documentação real do gateway de pagamentos.</h1>
          <p className="lead">
            Endpoints reais da API de pagamentos (Node + Express), com fluxo
            PIX, cartão e webhooks de confirmação.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/api/reference">
              Abrir API Reference
            </Link>
            <Link className="button ghost" to="/cadastro">
              Criar sandbox
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <div className="panel-title">Base URL local</div>
            <p className="panel-text">
              Desenvolvimento: <strong>http://localhost:3060</strong>
            </p>
            <div className="panel-status">
              <span className="status-dot ok" />
              <span className="panel-status-text">JSON body limit: 1mb</span>
            </div>
          </div>
          <div className="panel-card">
            <div className="panel-title">Headers úteis</div>
            <p className="panel-text">
              x-api-key: &lt;chave&gt;
              <br />
              Authorization: Bearer &lt;chave&gt;
              <br />
              Idempotency-Key: &lt;uuid&gt;
              <br />
              x-request-id: &lt;gerado pela API&gt;
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Manual rápido</span>
          <h2>Fluxo essencial para operar.</h2>
          <p>
            O protótipo não exige autenticação, mas suporta idempotência e
            validação de webhooks com HMAC.
          </p>
        </div>
        <div className="step-grid">
          {QUICKSTART.map((item, index) => (
            <article className="step-card" key={item.title}>
              <span className="step-index">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">OpenAPI / Swagger</span>
          <h2>Base inicial para documentação automatizada.</h2>
          <p>Arquivo completo em docs/openapi.yaml.</p>
        </div>
        <div className="code-grid">
          <div className="code-card">
            <div className="code-title">openapi.yaml (trecho)</div>
            <pre className="code-block">
              <code>{OPENAPI_SNIPPET}</code>
            </pre>
          </div>
          <div className="code-card">
            <div className="code-title">Transaction schema</div>
            <pre className="code-block">
              <code>{TRANSACTION_SCHEMA}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Payloads completos</span>
          <h2>Exemplos prontos para teste.</h2>
        </div>
        <div className="code-grid">
          <div className="code-card">
            <div className="code-title">POST /payments/pix</div>
            <pre className="code-block">
              <code>{PIX_REQUEST}</code>
            </pre>
          </div>
          <div className="code-card">
            <div className="code-title">POST /payments/card</div>
            <pre className="code-block">
              <code>{CARD_REQUEST}</code>
            </pre>
          </div>
          <div className="code-card">
            <div className="code-title">POST /payments/:id/refund</div>
            <pre className="code-block">
              <code>{REFUND_REQUEST}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="section accent-section">
        <div className="section-split">
          <div>
            <span className="eyebrow">Segurança e validação</span>
            <h2>Assinaturas e idempotência.</h2>
            <p>
              Webhooks usam HMAC (sha256/sha1) quando o segredo está configurado.
              Se o segredo estiver vazio, a verificação é ignorada com aviso.
            </p>
            <ul className="bullet-list">
              <li>PIX: header x-pix-signature ou x-webhook-signature.</li>
              <li>Provider: x-pagarme-signature ou x-hub-signature.</li>
              <li>Timestamp opcional: x-webhook-timestamp (anti-replay).</li>
              <li>Idempotency-Key retorna Idempotency-Status.</li>
            </ul>
          </div>
          <div className="card-stack">
            <div className="card">
              <h3>Dados sensíveis</h3>
              <p>
                Campos de cartão e documento são mascarados antes de persistir.
              </p>
            </div>
            <div className="card">
              <h3>Mapeamento de status</h3>
              <p>
                Status do provedor é normalizado para pending, paid,
                authorized, failed, refunded, canceled ou expired.
              </p>
            </div>
            <div className="card">
              <h3>Fallback mock</h3>
              <p>
                Sem credenciais Woovi, o sistema opera em modo mock para PIX e
                cartão.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Endpoints</span>
          <h2>Rotas reais da API.</h2>
          <p>
            Todas as rotas abaixo estão disponíveis no serviço em
            http://localhost:3060.
          </p>
        </div>
        <div className="endpoint-group">
          {ENDPOINT_GROUPS.map((group) => (
            <article className="endpoint-card" key={group.title}>
              <div className="endpoint-header">
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
              </div>
              <div className="endpoint-list">
                {group.endpoints.map((endpoint) => (
                  <div
                    className="endpoint-row"
                    key={`${endpoint.method}-${endpoint.path}`}
                  >
                    <span className={`method ${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    <code>{endpoint.path}</code>
                    <span className="endpoint-desc">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-split">
          <div>
            <span className="eyebrow">Eventos PIX</span>
            <h2>Webhooks suportados no mock.</h2>
            <p>Eventos abaixo são reconhecidos no endpoint /webhooks/pix.</p>
          </div>
          <div className="tag-grid">
            {WEBHOOK_EVENTS.map((event) => (
              <span className="tag" key={event}>
                {event}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-split">
          <div>
            <span className="eyebrow">Status de pagamento</span>
            <h2>Estados possíveis na API.</h2>
            <p>
              Use os estados abaixo para conciliação e acompanhamento do fluxo.
            </p>
          </div>
          <div className="tag-grid">
            {PAYMENT_STATUSES.map((status) => (
              <span className="tag" key={status}>
                {status}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Códigos de erro</span>
          <h2>Tratamento consistente nas respostas.</h2>
        </div>
        <div className="card-grid">
          {ERROR_CODES.map((error) => (
            <article className="card" key={error.code}>
              <h3>{error.code}</h3>
              <p>{error.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <span className="eyebrow">Boas práticas</span>
          <h2>Recomendações de operação.</h2>
        </div>
        <div className="card-grid">
          {SUPPORT_TOOLS.map((tool) => (
            <article className="card" key={tool.title}>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

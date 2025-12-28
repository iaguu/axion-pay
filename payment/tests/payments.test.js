import crypto from "crypto";
import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { logTestEvent, getTestLogPath } from "./testLogger.js";

let app;
let pixReference;
let pixTransactionId;
let runtimeConfig;
const useRealWoovi = process.env.USE_REAL_WOOVI === "true";
let shouldTestWebhook = true;

describe("Payment API", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.PIX_WEBHOOK_SECRET = "pix-secret-test";
    process.env.API_KEY = "test-api-key";
    process.env.AUTH_REQUIRED = "true";
    process.env.DB_PATH = ":memory:";
    process.env.WEBHOOK_REQUIRE_TIMESTAMP = "true";
    process.env.WEBHOOK_TOLERANCE_SECONDS = "300";
    process.env.PIX_KEY = "38209847805";
    process.env.PIX_MERCHANT_NAME = "LOJA AXION";
    process.env.PIX_MERCHANT_CITY = "SAO PAULO";
    if (!useRealWoovi) {
      process.env.WOOVI_API_KEY = "";
      process.env.WOOVI_BASE_URL = "";
      process.env.WOOVI_PIX_PATH = "";
      process.env.WOOVI_CARD_PATH = "";
      process.env.WOOVI_PIX_CONFIRM_PATH = "";
    }
    const mod = await import("../src/app.js");
    app = mod.app;
    const configMod = await import("../src/config/env.js");
    runtimeConfig = configMod.config;

    logTestEvent({
      type: "suite_start",
      message: "Starting Payment API tests",
      data: {
        useRealWoovi,
        shouldTestWebhook,
        logPath: getTestLogPath()
      }
    });
  });

  afterAll(() => {
    logTestEvent({
      type: "suite_end",
      message: "Finished Payment API tests"
    });
  });

  it("exposes health endpoint", async () => {
    const response = await request(app).get("/health");
    logTestEvent({
      type: "http_request",
      message: "GET /health",
      data: { status: response.status, ok: response.body?.ok }
    });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.status).toBe("UP");
  });

  it("rejects requests without API key", async () => {
    const response = await request(app).get("/payments");
    logTestEvent({
      type: "http_request",
      message: "GET /payments without API key",
      data: { status: response.status, code: response.body?.code }
    });
    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });

  it("creates a PIX payment", async () => {
    const response = await request(app)
      .post("/payments/pix")
      .set("x-api-key", process.env.API_KEY)
      .send({
        amount: 12.34,
        currency: "BRL",
        customer: {
          id: "cust_1",
          name: "Cliente Teste",
          email: "cliente.teste@example.com",
          phone: "+5511999999999",
          document: "12345678909"
        },
        metadata: { order: "123" }
      });

    const pixPayload =
      response.body?.pix_payload ||
      response.body?.transaction?.metadata?.pix?.qrcode ||
      response.body?.transaction?.metadata?.pix?.copia_colar ||
      "";
    logTestEvent({
      type: "pix_create",
      message: "Created PIX payment",
      data: {
        status: response.status,
        transactionId: response.body?.transaction?.id,
        provider: response.body?.transaction?.provider,
        providerReference: response.body?.transaction?.providerReference,
        amount_cents: response.body?.transaction?.amount_cents,
        pix_payload: pixPayload,
        pix_payload_length: pixPayload.length
      }
    });
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.transaction.method).toBe("pix");
    expect(response.body.transaction.status).toBe("pending");
    expect(response.body.transaction.provider).toBe("pix-local");
    expect(response.body.transaction.amount_cents).toBe(1234);
    expect(response.headers.location).toMatch(/\/payments\//);

    pixReference = response.body.transaction.providerReference;
    pixTransactionId = response.body.transaction.id;
  });

  it("respects idempotency key", async () => {
    const payload = {
      amount: 50,
      currency: "BRL",
      customer: {
        id: "cust_2",
        name: "Cliente 2",
        email: "cliente2@example.com",
        phone: "+5511988888888",
        document: "98765432100"
      },
      card: {
        number: "4111111111111111",
        holder_name: "Cliente 2",
        exp_month: 12,
        exp_year: 2030,
        cvv: "123"
      },
      capture: false
    };

    const first = await request(app)
      .post("/payments/card")
      .set("x-api-key", process.env.API_KEY)
      .set("Idempotency-Key", "idem-123")
      .send(payload);

    const second = await request(app)
      .post("/payments/card")
      .set("x-api-key", process.env.API_KEY)
      .set("Idempotency-Key", "idem-123")
      .send(payload);

    logTestEvent({
      type: "card_idempotency",
      message: "Card payment idempotency check",
      data: {
        firstStatus: first.status,
        secondStatus: second.status,
        idempotencyStatus: {
          first: first.headers["idempotency-status"],
          second: second.headers["idempotency-status"]
        },
        transactionId: first.body?.transaction?.id
      }
    });
    expect(first.status).toBe(201);
    expect(first.headers["idempotency-status"]).toBe("created");
    expect(second.status).toBe(200);
    expect(second.headers["idempotency-status"]).toBe("replayed");
    expect(first.body.transaction.id).toBe(second.body.transaction.id);
  });

  it("creates a card payment with capture=false as authorized", async () => {
    const response = await request(app)
      .post("/payments/card")
      .set("x-api-key", process.env.API_KEY)
      .send({
        amount_cents: 9999,
        currency: "BRL",
        customer: {
          id: "cust_3",
          name: "Cliente 3",
          email: "cliente3@example.com",
          phone: "+5511977777777",
          document: "12345678901"
        },
        card: {
          number: "4111111111111111",
          holder_name: "Cliente 3",
          exp_month: 1,
          exp_year: 2031,
          cvv: "123"
        },
        capture: false
      });

    logTestEvent({
      type: "card_create",
      message: "Created card payment",
      data: {
        status: response.status,
        transactionId: response.body?.transaction?.id,
        provider: response.body?.transaction?.provider,
        paymentStatus: response.body?.transaction?.status,
        amount_cents: response.body?.transaction?.amount_cents
      }
    });
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.transaction.method).toBe("card");
    expect(response.body.transaction.status).toBe("authorized");
  });

  it("processes PIX webhook with valid signature", async () => {
    if (!shouldTestWebhook) {
      logTestEvent({
        type: "pix_webhook_skip",
        message: "Skipping PIX webhook test",
        data: { reason: "shouldTestWebhook=false" }
      });
      return;
    }
    const payload = {
      providerReference: pixReference,
      event: "PIX_CONFIRMED"
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", process.env.PIX_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    const timestamp = Math.floor(Date.now() / 1000);

    const response = await request(app)
      .post("/webhooks/pix")
      .set("x-pix-signature", `sha256=${signature}`)
      .set("x-webhook-timestamp", String(timestamp))
      .set("Content-Type", "application/json")
      .send(rawBody);

    logTestEvent({
      type: "pix_webhook",
      message: "Processed PIX webhook",
      data: {
        status: response.status,
        transactionId: response.body?.transaction?.id,
        paymentStatus: response.body?.transaction?.status
      }
    });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.transaction.id).toBe(pixTransactionId);
    expect(response.body.transaction.status).toBe("paid");
  });

  it("returns stats", async () => {
    const response = await request(app)
      .get("/payments/stats")
      .set("x-api-key", process.env.API_KEY);
    logTestEvent({
      type: "stats",
      message: "Fetched payment stats",
      data: {
        status: response.status,
        total: response.body?.stats?.total,
        total_amount_cents: response.body?.stats?.total_amount_cents,
        total_paid_cents: response.body?.stats?.total_paid_cents
      }
    });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.stats.total).toBeGreaterThan(0);
  });
});

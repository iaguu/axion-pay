import crypto from "crypto";
import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";

let app;
let pixReference;
let pixTransactionId;

describe("Payment API", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.PIX_WEBHOOK_SECRET = "pix-secret-test";
    process.env.WOOVI_API_KEY = "";
    process.env.WOOVI_BASE_URL = "";
    process.env.WOOVI_PIX_PATH = "";
    process.env.WOOVI_CARD_PATH = "";
    const mod = await import("../src/app.js");
    app = mod.app;
  });

  it("exposes health endpoint", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.status).toBe("UP");
  });

  it("creates a PIX payment", async () => {
    const response = await request(app).post("/payments/pix").send({
      amount: 12.34,
      currency: "BRL",
      customer: { id: "cust_1", name: "Cliente Teste" },
      metadata: { order: "123" }
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.transaction.method).toBe("pix");
    expect(response.body.transaction.status).toBe("pending");
    expect(response.body.transaction.provider).toBe("woovi-mock");
    expect(response.body.transaction.amount_cents).toBe(1234);
    expect(response.headers.location).toMatch(/\/payments\//);

    pixReference = response.body.transaction.providerReference;
    pixTransactionId = response.body.transaction.id;
  });

  it("respects idempotency key", async () => {
    const payload = {
      amount: 50,
      currency: "BRL",
      customer: { id: "cust_2", name: "Cliente 2" },
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
      .set("Idempotency-Key", "idem-123")
      .send(payload);

    const second = await request(app)
      .post("/payments/card")
      .set("Idempotency-Key", "idem-123")
      .send(payload);

    expect(first.status).toBe(201);
    expect(first.headers["idempotency-status"]).toBe("created");
    expect(second.status).toBe(200);
    expect(second.headers["idempotency-status"]).toBe("replayed");
    expect(first.body.transaction.id).toBe(second.body.transaction.id);
  });

  it("creates a card payment with capture=false as authorized", async () => {
    const response = await request(app).post("/payments/card").send({
      amount_cents: 9999,
      currency: "BRL",
      card: {
        number: "4111111111111111",
        holder_name: "Cliente 3",
        exp_month: 1,
        exp_year: 2031,
        cvv: "123"
      },
      capture: false
    });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.transaction.method).toBe("card");
    expect(response.body.transaction.status).toBe("authorized");
  });

  it("processes PIX webhook with valid signature", async () => {
    const payload = {
      providerReference: pixReference,
      event: "PIX_CONFIRMED"
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", process.env.PIX_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    const response = await request(app)
      .post("/webhooks/pix")
      .set("x-pix-signature", `sha256=${signature}`)
      .set("Content-Type", "application/json")
      .send(rawBody);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.transaction.id).toBe(pixTransactionId);
    expect(response.body.transaction.status).toBe("paid");
  });

  it("returns stats", async () => {
    const response = await request(app).get("/payments/stats");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.stats.total).toBeGreaterThan(0);
  });
});

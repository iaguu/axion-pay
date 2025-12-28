import express from "express";
import morgan from "morgan";
import { v4 as uuid } from "uuid";
import { config } from "./config/env.js";
import paymentsRouter from "./routes/payments.js";
import webhooksRouter from "./routes/webhooks.js";

const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  const requestId = req.get("x-request-id") || uuid();
  req.requestId = requestId;
  res.set("x-request-id", requestId);
  next();
});

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

app.use(
  express.json({
    limit: config.limits.jsonBody,
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  })
);

morgan.token("request-id", (req) => req.requestId);
app.use(morgan(":method :url :status :response-time ms - :res[content-length] - reqId=:request-id"));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    status: "UP",
    env: config.env,
    uptime: process.uptime()
  });
});

app.use("/payments", paymentsRouter);
app.use("/webhooks", webhooksRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Not Found"
  });
});

export { app };

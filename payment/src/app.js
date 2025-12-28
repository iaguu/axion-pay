import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { v4 as uuid } from "uuid";
import { config } from "./config/env.js";
import paymentsRouter from "./routes/payments.js";
import webhooksRouter from "./routes/webhooks.js";
import { requireApiKey } from "./middlewares/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/errors.js";
import { logger } from "./utils/logger.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy);

app.use(
  cors({
    origin:
      config.cors.origins === "*"
        ? true
        : config.cors.origins.length
          ? config.cors.origins
          : false,
    credentials: config.cors.credentials
  })
);

app.use(helmet());

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.use((req, res, next) => {
  const requestId = req.get("x-request-id") || uuid();
  req.requestId = requestId;
  req.id = requestId;
  res.set("x-request-id", requestId);
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

app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({ requestId: req.requestId }),
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode} ${res.responseTime}ms`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} ${res.statusCode} ${res.responseTime}ms - ${
        err?.message || "error"
      }`
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    status: "UP",
    env: config.env,
    uptime: process.uptime()
  });
});

app.use("/payments", requireApiKey, paymentsRouter);
app.use("/webhooks", webhooksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

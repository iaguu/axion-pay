import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import paymentRoutes from "./routes/payments.js";
import webhookRoutes from "./routes/webhooks.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import { requireApiKey } from "./middlewares/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/errors.js";

export const app = express();

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins === "*" ? "*" : config.cors.origins,
    credentials: config.cors.credentials
  })
);
app.use(
  express.json({
    limit: config.jsonBodyLimit,
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  })
);

if (config.rateLimit?.max) {
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max
    })
  );
}

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'UP' });
});

app.use("/auth", authRoutes);
app.use("/account", accountRoutes);
app.use("/payments", requireApiKey, paymentRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

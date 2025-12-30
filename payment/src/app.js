import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import adminRoutes from './routes/admin.js';
import { logger } from './utils/logger.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'UP' });
});

app.use('/payments', paymentRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/admin', adminRoutes);

app.use((err, req, res, next) => {
  logger.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ ok: false, error: err.message });
});
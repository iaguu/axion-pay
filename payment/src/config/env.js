import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || 'payments.db',
  pixWebhookSecret: process.env.PIX_WEBHOOK_SECRET || 'secret'
};
import express from 'express';
import { createPayment, getPayment, getPaymentStats } from '../services/paymentService.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = express.Router();

router.post('/pix', requirePermission('pix:create'), async (req, res, next) => {
  try {
    const { amount, customer, metadata } = req.body;
    const result = await createPayment({
      method: 'pix',
      amount,
      amount_cents: Math.round(amount * 100),
      currency: 'BRL',
      customer,
      metadata
    });
    res.status(201).json({ ok: true, transaction: result });
  } catch (err) {
    next(err);
  }
});

router.post('/card', requirePermission('infinitepay:create'), async (req, res, next) => {
  try {
    const { amount, amount_cents, customer, card, capture, metadata } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];
    
    const result = await createPayment({
      method: 'card',
      amount,
      amount_cents: amount_cents || (amount ? Math.round(amount * 100) : 0),
      currency: 'BRL',
      customer,
      card,
      capture,
      metadata,
      idempotencyKey
    });
    
    if (result._replayed) {
      res.set('Idempotency-Status', 'replayed');
      return res.status(200).json({ ok: true, transaction: result });
    }
    
    if (idempotencyKey) {
      res.set('Idempotency-Status', 'created');
    }
    
    res.status(201).json({ ok: true, transaction: result });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', requirePermission('admin:view_transactions'), async (req, res) => {
  const stats = getPaymentStats();
  res.json({ ok: true, stats });
});

export default router;
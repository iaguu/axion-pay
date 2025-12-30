import express from "express";
import { logger } from "../utils/logger.js";
import { handlePixWebhook, handleWooviWebhook, handleInfinitePayWebhook } from "../services/paymentService.js";

const router = express.Router();

// Webhook para InfinitePay
router.post("/infinitepay", async (req, res) => {
  try {
    const result = await handleInfinitePayWebhook(req.body);
    if (result) {
      res.json({ ok: true, transaction: result });
    } else {
      res.status(404).json({ ok: false, message: "Transaction not found" });
    }
  } catch (error) {
    logger.error({ error }, "Erro no webhook InfinitePay");
    res.status(500).json({ ok: false });
  }
});

// Webhook para PIX (Exemplo existente)
router.post("/pix", async (req, res) => {
  try {
    const result = await handlePixWebhook(req.body);
    if (result) {
        res.json({ ok: true, transaction: result });
    } else {
        res.status(404).json({ ok: false });
    }
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

export default router;
import { Router } from "express";
import { pixWebhookHandler, pagarmeWebhookHandler, wooviWebhookHandler } from "../controllers/webhookController.js";

const router = Router();

router.post("/pix", pixWebhookHandler);
router.post("/pagarme", pagarmeWebhookHandler);
router.post("/woovi", wooviWebhookHandler);

export default router;

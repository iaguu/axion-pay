import { Router } from "express";
import { pixWebhookHandler, pagarmeWebhookHandler, wooviWebhookHandler } from "../controllers/webhookController.js";
import { validate } from "../middlewares/validate.js";
import { pixWebhookSchema } from "../schemas/paymentSchemas.js";

const router = Router();

router.post("/pix", validate(pixWebhookSchema), pixWebhookHandler);
router.post("/pagarme", pagarmeWebhookHandler);
router.post("/woovi", wooviWebhookHandler);

export default router;

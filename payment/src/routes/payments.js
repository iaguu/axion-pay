import { Router } from "express";
import {
  createPaymentHandler,
  createPixPaymentHandler,
  createCardPaymentHandler,
  getPaymentHandler,
  getPaymentEventsHandler,
  getPaymentByProviderReferenceHandler,
  listPaymentsHandler,
  listPaymentsByStatusHandler,
  listPaymentsByMethodHandler,
  getPaymentStatsHandler,
  confirmPixPaymentHandler,
  capturePaymentHandler,
  cancelPaymentHandler,
  refundPaymentHandler,
  updatePaymentMetadataHandler
} from "../controllers/paymentController.js";
import { validate } from "../middlewares/validate.js";
import {
  createPaymentSchema,
  idParamSchema,
  methodParamSchema,
  metadataSchema,
  paginationQuerySchema,
  providerReferenceParamSchema,
  refundSchema,
  statusParamSchema
} from "../schemas/paymentSchemas.js";

const router = Router();

router.post("/pix", validate(createPaymentSchema), createPixPaymentHandler);
router.post("/card", validate(createPaymentSchema), createCardPaymentHandler);
router.post("/", validate(createPaymentSchema), createPaymentHandler);
router.get("/", validate(paginationQuerySchema, "query"), listPaymentsHandler);
router.get("/stats", getPaymentStatsHandler);
router.get("/status/:status", validate(statusParamSchema, "params"), listPaymentsByStatusHandler);
router.get("/method/:method", validate(methodParamSchema, "params"), listPaymentsByMethodHandler);
router.get(
  "/provider/:providerReference",
  validate(providerReferenceParamSchema, "params"),
  getPaymentByProviderReferenceHandler
);
router.get("/:id/events", validate(idParamSchema, "params"), getPaymentEventsHandler);
router.get("/:id", validate(idParamSchema, "params"), getPaymentHandler);
router.post("/:id/confirm", validate(idParamSchema, "params"), confirmPixPaymentHandler);
router.post("/:id/capture", validate(idParamSchema, "params"), capturePaymentHandler);
router.post("/:id/cancel", validate(idParamSchema, "params"), cancelPaymentHandler);
router.post(
  "/:id/refund",
  validate(idParamSchema, "params"),
  validate(refundSchema),
  refundPaymentHandler
);
router.patch(
  "/:id/metadata",
  validate(idParamSchema, "params"),
  validate(metadataSchema),
  updatePaymentMetadataHandler
);

export default router;

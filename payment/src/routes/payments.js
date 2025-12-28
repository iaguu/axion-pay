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

const router = Router();

router.post("/pix", createPixPaymentHandler);
router.post("/card", createCardPaymentHandler);
router.post("/", createPaymentHandler);
router.get("/", listPaymentsHandler);
router.get("/stats", getPaymentStatsHandler);
router.get("/status/:status", listPaymentsByStatusHandler);
router.get("/method/:method", listPaymentsByMethodHandler);
router.get("/provider/:providerReference", getPaymentByProviderReferenceHandler);
router.get("/:id/events", getPaymentEventsHandler);
router.get("/:id", getPaymentHandler);
router.post("/:id/confirm", confirmPixPaymentHandler);
router.post("/:id/capture", capturePaymentHandler);
router.post("/:id/cancel", cancelPaymentHandler);
router.post("/:id/refund", refundPaymentHandler);
router.patch("/:id/metadata", updatePaymentMetadataHandler);

export default router;

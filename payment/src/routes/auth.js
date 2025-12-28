import { Router } from "express";
import {
  confirmEmailHandler,
  loginHandler,
  logoutHandler,
  resendConfirmationHandler,
  signupHandler
} from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { requireUserSession } from "../middlewares/session.js";
import {
  loginSchema,
  resendConfirmationSchema,
  signupSchema
} from "../schemas/authSchemas.js";

const router = Router();

router.post("/signup", validate(signupSchema), signupHandler);
router.post("/login", validate(loginSchema), loginHandler);
router.post("/logout", requireUserSession, logoutHandler);
router.post("/resend-confirmation", validate(resendConfirmationSchema), resendConfirmationHandler);
router.get("/confirm", confirmEmailHandler);
router.post("/confirm", confirmEmailHandler);

export default router;

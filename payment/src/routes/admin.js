import { Router } from "express";
import {
  adminLoginHandler,
  adminLogoutHandler,
  approveUserHandler,
  generateApiKeyHandler,
  listUserApiKeysHandler,
  listUsersHandler,
  rejectUserHandler,
  sendDocsToUserHandler
} from "../controllers/adminController.js";
import { requireAdminSession } from "../middlewares/session.js";
import { validate } from "../middlewares/validate.js";
import {
  adminLoginSchema,
  adminUserStatusSchema,
  adminUsersQuerySchema,
  apiKeyCreateSchema,
  emailDocsSchema
} from "../schemas/authSchemas.js";

const router = Router();

router.post("/login", validate(adminLoginSchema), adminLoginHandler);
router.post("/logout", requireAdminSession, adminLogoutHandler);

router.get("/users", requireAdminSession, validate(adminUsersQuerySchema, "query"), listUsersHandler);
router.patch(
  "/users/:id/approve",
  requireAdminSession,
  validate(adminUserStatusSchema),
  approveUserHandler
);
router.patch(
  "/users/:id/reject",
  requireAdminSession,
  validate(adminUserStatusSchema),
  rejectUserHandler
);
router.get("/users/:id/api-keys", requireAdminSession, listUserApiKeysHandler);
router.post(
  "/users/:id/api-keys",
  requireAdminSession,
  validate(apiKeyCreateSchema),
  generateApiKeyHandler
);
router.post(
  "/users/:id/send-docs",
  requireAdminSession,
  validate(emailDocsSchema),
  sendDocsToUserHandler
);

export default router;

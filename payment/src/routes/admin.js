import express from "express";
import {
  adminLoginHandler,
  approveUserHandler,
  listTransactions,
  listUsers,
  manageTags,
  rejectUserHandler
} from "../controllers/adminController.js";
import { requireAdminSession } from "../middlewares/session.js";
import { validate } from "../middlewares/validate.js";
import {
  adminLoginSchema,
  adminUserStatusSchema,
  adminUsersQuerySchema
} from "../schemas/authSchemas.js";

const router = express.Router();

router.post("/login", validate(adminLoginSchema), adminLoginHandler);

router.get("/transactions", requireAdminSession, listTransactions);
router.get("/users", requireAdminSession, validate(adminUsersQuerySchema, "query"), listUsers);
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
router.get("/tags", requireAdminSession, manageTags);

export default router;

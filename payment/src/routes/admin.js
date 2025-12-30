import express from 'express';
import { listTransactions, listUsers, manageTags } from '../controllers/adminController.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = express.Router();

router.get('/transactions', requirePermission('admin:view_transactions'), listTransactions);
router.get('/users', requirePermission('admin:view_users'), listUsers);
router.get('/tags', requirePermission('admin:manage_tags'), manageTags);

export default router;
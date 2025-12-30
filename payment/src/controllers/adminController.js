import { db } from '../models/db.js';

function getAllTransactions() {
  return db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
}

function getAllUsers() {
  // This is a placeholder. In a real application, you would not want to select the password hash.
  return db.prepare('SELECT id, name, email, status FROM users ORDER BY created_at DESC').all();
}

function getAllTags() {
  return db.prepare('SELECT * FROM pay_tags').all();
}

function getPermissionsForTag(tagId) {
  return db.prepare('SELECT p.name FROM permissions p JOIN pay_tag_permissions ptp ON p.id = ptp.permission_id WHERE ptp.tag_id = ?').all(tagId);
}

export function listTransactions(req, res) {
  const transactions = getAllTransactions();
  res.json({ ok: true, transactions });
}

export function listUsers(req, res) {
  const users = getAllUsers();
  res.json({ ok: true, users });
}

export function manageTags(req, res) {
  const tags = getAllTags();
  const tagsWithPermissions = tags.map(tag => {
    return {
      ...tag,
      permissions: getPermissionsForTag(tag.id)
    }
  });
  res.json({ ok: true, tags: tagsWithPermissions });
}
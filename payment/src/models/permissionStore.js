import { db } from './db.js';

const getPermissionsByTagStmt = db.prepare(`
  SELECT p.name
  FROM permissions p
  JOIN pay_tag_permissions ptp ON p.id = ptp.permission_id
  JOIN pay_tags pt ON pt.id = ptp.tag_id
  WHERE pt.tag = ?
`);

export function getPermissionsByTag(tag) {
  const rows = getPermissionsByTagStmt.all(tag);
  return rows.map(row => row.name);
}

const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const Database = require('better-sqlite3');

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required.');
  return url;
}

function isSqliteUrl(url) {
  return url.startsWith('file:') || url === ':memory:';
}

function resolveSqlitePath(url) {
  if (url === ':memory:') return ':memory:';
  return path.resolve(process.cwd(), url.replace(/^file:/, ''));
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [rawKey, ...rest] = arg.slice(2).split('=');
    const key = rawKey.trim();
    const value = rest.join('=').trim();
    parsed[key] = value;
  }
  return parsed;
}

function resolveRequestedRole(role, existingAdmins, existingRole) {
  if (role) {
    if (!['superadmin', 'staff'].includes(role)) {
      throw new Error('role must be either superadmin or staff.');
    }
    return role;
  }
  if (existingRole) {
    return existingRole;
  }
  return existingAdmins === 0 ? 'superadmin' : 'staff';
}

async function upsertAdminInPostgres({ email, name, password, role }) {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const existingAdmins = Number(
      (
        await client.query(`SELECT COUNT(*)::int AS count FROM "AdminAccount"`)
      ).rows[0]?.count ?? 0,
    );
    const hash = await bcrypt.hash(password, 10);
    const existing = (
      await client.query(`SELECT id, role FROM "AdminAccount" WHERE email = $1 LIMIT 1`, [email])
    ).rows[0];
    const requestedRole = resolveRequestedRole(role, existingAdmins, existing?.role);

    if (existing) {
      await client.query(
        `
          UPDATE "AdminAccount"
          SET
            name = $1,
            "hashedPassword" = $2,
            role = $3,
            status = 'active',
            "updatedAt" = NOW()
          WHERE id = $4
        `,
        [name, hash, requestedRole, existing.id],
      );

      return {
        mode: 'updated',
        email,
        role: requestedRole,
      };
    }

    await client.query(
      `
        INSERT INTO "AdminAccount" (
          "id",
          "name",
          "email",
          "hashedPassword",
          "role",
          "status",
          "lastLoginAt",
          "twoFactorEnabled",
          "twoFactorSecret",
          "recoveryCodesHash",
          "createdAt",
          "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, 'active', NULL, FALSE, NULL, NULL, NOW(), NOW()
        )
      `,
      [crypto.randomUUID(), name, email, hash, requestedRole],
    );

    return {
      mode: 'created',
      email,
      role: requestedRole,
    };
  } finally {
    await client.end();
  }
}

async function upsertAdminInSqlite({ email, name, password, role }) {
  const db = new Database(resolveSqlitePath(getDatabaseUrl()));
  try {
    const existingAdmins = Number(
      db.prepare(`SELECT COUNT(*) AS count FROM "AdminAccount"`).get()?.count ?? 0,
    );
    const hash = await bcrypt.hash(password, 10);
    const existing = db.prepare(`SELECT id, role FROM "AdminAccount" WHERE email = ? LIMIT 1`).get(email);
    const requestedRole = resolveRequestedRole(role, existingAdmins, existing?.role);

    if (existing) {
      db.prepare(`
        UPDATE "AdminAccount"
        SET
          name = ?,
          hashedPassword = ?,
          role = ?,
          status = 'active',
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, hash, requestedRole, existing.id);

      return {
        mode: 'updated',
        email,
        role: requestedRole,
      };
    }

    db.prepare(`
      INSERT INTO "AdminAccount" (
        id,
        name,
        email,
        hashedPassword,
        role,
        status,
        lastLoginAt,
        twoFactorEnabled,
        twoFactorSecret,
        recoveryCodesHash,
        createdAt,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, 'active', NULL, 0, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(crypto.randomUUID(), name, email, hash, requestedRole);

    return {
      mode: 'created',
      email,
      role: requestedRole,
    };
  } finally {
    db.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const password = args.password;
  const name = args.name || 'Admin';
  const role = args.role || '';

  if (!email || !password) {
    throw new Error('Usage: pnpm --dir apps/web admin:create --email=admin@example.com --password=StrongPass123! [--name=Admin] [--role=superadmin]');
  }

  const url = getDatabaseUrl();
  const result = isSqliteUrl(url)
    ? await upsertAdminInSqlite({ email, name, password, role })
    : await upsertAdminInPostgres({ email, name, password, role });

  console.log('[admin:create] done');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('[admin:create] failed');
  console.error(error);
  process.exit(1);
});

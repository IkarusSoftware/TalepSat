const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

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

function mapAdminStatus(status) {
  return status === 'active' ? 'active' : 'disabled';
}

function deriveMarketplaceRole(listingCount, offerCount) {
  if (listingCount > 0 && offerCount > 0) return 'both';
  if (offerCount > 0) return 'seller';
  return 'buyer';
}

async function syncLegacyAdminsPostgres(client) {
  const legacyAdmins = (
    await client.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u."hashedPassword",
        u.status,
        u."createdAt",
        (SELECT COUNT(*)::int FROM "Listing" l WHERE l."buyerId" = u.id) AS "listingCount",
        (SELECT COUNT(*)::int FROM "Offer" o WHERE o."sellerId" = u.id) AS "offerCount"
      FROM "User" u
      WHERE u.role = 'admin'
      ORDER BY u."createdAt" ASC
    `)
  ).rows;

  let hasSuperadmin = (
    await client.query(`SELECT 1 FROM "AdminAccount" WHERE role = 'superadmin' LIMIT 1`)
  ).rowCount > 0;

  let createdAdmins = 0;
  let promotedSuperadmins = 0;
  let normalizedUsers = 0;
  let skippedWithoutPassword = 0;

  for (const user of legacyAdmins) {
    const existing = (
      await client.query(
        `SELECT id, role FROM "AdminAccount" WHERE email = $1 LIMIT 1`,
        [user.email],
      )
    ).rows[0];

    if (!user.hashedPassword) {
      skippedWithoutPassword += 1;
    } else if (!existing) {
      const adminRole = hasSuperadmin ? 'staff' : 'superadmin';
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
            $1, $2, $3, $4, $5, $6, NULL, FALSE, NULL, NULL, NOW(), NOW()
          )
        `,
        [
          crypto.randomUUID(),
          user.name,
          user.email,
          user.hashedPassword,
          adminRole,
          mapAdminStatus(user.status),
        ],
      );
      createdAdmins += 1;
      hasSuperadmin = hasSuperadmin || adminRole === 'superadmin';
    } else if (!hasSuperadmin) {
      await client.query(
        `UPDATE "AdminAccount" SET role = 'superadmin', "updatedAt" = NOW() WHERE id = $1`,
        [existing.id],
      );
      promotedSuperadmins += 1;
      hasSuperadmin = true;
    }

    const marketplaceRole = deriveMarketplaceRole(user.listingCount, user.offerCount);
    const result = await client.query(
      `
        UPDATE "User"
        SET
          role = $1,
          verified = TRUE,
          "updatedAt" = NOW()
        WHERE id = $2 AND role = 'admin'
      `,
      [marketplaceRole, user.id],
    );
    normalizedUsers += result.rowCount || 0;
  }

  const counts = await client.query(`
    SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN role = 'superadmin' THEN 1 ELSE 0 END)::int AS superadmins,
      SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END)::int AS staff
    FROM "AdminAccount"
  `);

  return {
    createdAdmins,
    promotedSuperadmins,
    normalizedUsers,
    skippedWithoutPassword,
    adminAccounts: counts.rows[0] ?? { total: 0, superadmins: 0, staff: 0 },
  };
}

function syncLegacyAdminsSqlite(db) {
  const legacyAdmins = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.hashedPassword,
      u.status,
      u.createdAt,
      (SELECT COUNT(*) FROM "Listing" l WHERE l.buyerId = u.id) AS listingCount,
      (SELECT COUNT(*) FROM "Offer" o WHERE o.sellerId = u.id) AS offerCount
    FROM "User" u
    WHERE u.role = 'admin'
    ORDER BY u.createdAt ASC
  `).all();

  let hasSuperadmin = Boolean(
    db.prepare(`SELECT id FROM "AdminAccount" WHERE role = 'superadmin' LIMIT 1`).get(),
  );

  let createdAdmins = 0;
  let promotedSuperadmins = 0;
  let normalizedUsers = 0;
  let skippedWithoutPassword = 0;

  const findExisting = db.prepare(`SELECT id, role FROM "AdminAccount" WHERE email = ? LIMIT 1`);
  const insertAdmin = db.prepare(`
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
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  const promoteAdmin = db.prepare(`
    UPDATE "AdminAccount"
    SET role = 'superadmin', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const normalizeUser = db.prepare(`
    UPDATE "User"
    SET role = ?, verified = 1, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND role = 'admin'
  `);

  const transaction = db.transaction(() => {
    for (const user of legacyAdmins) {
      const existing = findExisting.get(user.email);

      if (!user.hashedPassword) {
        skippedWithoutPassword += 1;
      } else if (!existing) {
        const adminRole = hasSuperadmin ? 'staff' : 'superadmin';
        insertAdmin.run(
          crypto.randomUUID(),
          user.name,
          user.email,
          user.hashedPassword,
          adminRole,
          mapAdminStatus(user.status),
        );
        createdAdmins += 1;
        hasSuperadmin = hasSuperadmin || adminRole === 'superadmin';
      } else if (!hasSuperadmin) {
        promoteAdmin.run(existing.id);
        promotedSuperadmins += 1;
        hasSuperadmin = true;
      }

      const marketplaceRole = deriveMarketplaceRole(user.listingCount, user.offerCount);
      const result = normalizeUser.run(marketplaceRole, user.id);
      normalizedUsers += result.changes || 0;
    }
  });

  transaction();

  const adminAccounts =
    db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN role = 'superadmin' THEN 1 ELSE 0 END) AS superadmins,
        SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff
      FROM "AdminAccount"
    `).get() ?? { total: 0, superadmins: 0, staff: 0 };

  return {
    createdAdmins,
    promotedSuperadmins,
    normalizedUsers,
    skippedWithoutPassword,
    adminAccounts,
  };
}

async function syncLegacyAdmins() {
  const url = getDatabaseUrl();

  if (isSqliteUrl(url)) {
    const db = new Database(resolveSqlitePath(url));
    try {
      return syncLegacyAdminsSqlite(db);
    } finally {
      db.close();
    }
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('BEGIN');
    const result = await syncLegacyAdminsPostgres(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const result = await syncLegacyAdmins();
  console.log('[admin-sync] done');
  console.log(JSON.stringify(result, null, 2));
}

module.exports = {
  deriveMarketplaceRole,
  syncLegacyAdmins,
  syncLegacyAdminsPostgres,
  syncLegacyAdminsSqlite,
};

if (require.main === module) {
  main().catch((error) => {
    console.error('[admin-sync] failed');
    console.error(error);
    process.exit(1);
  });
}

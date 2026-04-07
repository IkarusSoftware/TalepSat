#!/usr/bin/env node
require('dotenv/config');

const Database = require('better-sqlite3');
const { Client } = require('pg');

function cleanBaseUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

function getBaseUrl() {
  const baseUrl = cleanBaseUrl(process.env.MEDIA_PUBLIC_BASE_URL)
    || cleanBaseUrl(process.env.NEXTAUTH_URL)
    || cleanBaseUrl(process.env.APP_URL)
    || cleanBaseUrl(process.env.EXPO_PUBLIC_API_URL);

  if (!baseUrl) {
    throw new Error('MEDIA_PUBLIC_BASE_URL veya NEXTAUTH_URL tanimli olmadan medya normalizasyonu calistirilamaz.');
  }

  return baseUrl;
}

function normalizeUrl(raw, baseUrl) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/uploads/')) return `${baseUrl}${trimmed}`;
  return null;
}

function normalizeJsonArray(raw, baseUrl) {
  if (!raw) return { changed: false, value: raw };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { changed: false, value: raw };
  }
  if (!Array.isArray(parsed)) return { changed: false, value: raw };

  const normalized = parsed.map((item) => normalizeUrl(item, baseUrl) || item);
  const changed = JSON.stringify(parsed) !== JSON.stringify(normalized);
  return { changed, value: JSON.stringify(normalized) };
}

function normalizeJsonAttachments(raw, baseUrl) {
  if (!raw) return { changed: false, value: raw };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { changed: false, value: raw };
  }
  if (!Array.isArray(parsed)) return { changed: false, value: raw };

  const normalized = parsed.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const nextUrl = normalizeUrl(item.url, baseUrl);
    if (!nextUrl) return item;
    return { ...item, url: nextUrl };
  });
  const changed = JSON.stringify(parsed) !== JSON.stringify(normalized);
  return { changed, value: JSON.stringify(normalized) };
}

async function runSqlite(databaseUrl, baseUrl) {
  const filePath = databaseUrl.replace(/^file:/, '');
  const db = new Database(filePath);
  let listingUpdates = 0;
  let messageUpdates = 0;
  let userUpdates = 0;

  const updateListing = db.prepare('UPDATE Listing SET images = ? WHERE id = ?');
  const updateMessage = db.prepare('UPDATE Message SET attachments = ? WHERE id = ?');
  const updateUser = db.prepare('UPDATE User SET image = ? WHERE id = ?');

  const transaction = db.transaction(() => {
    const listings = db.prepare("SELECT id, images FROM Listing WHERE images IS NOT NULL AND images != ''").all();
    for (const row of listings) {
      const normalized = normalizeJsonArray(row.images, baseUrl);
      if (normalized.changed) {
        updateListing.run(normalized.value, row.id);
        listingUpdates += 1;
      }
    }

    const messages = db.prepare("SELECT id, attachments FROM Message WHERE attachments IS NOT NULL AND attachments != ''").all();
    for (const row of messages) {
      const normalized = normalizeJsonAttachments(row.attachments, baseUrl);
      if (normalized.changed) {
        updateMessage.run(normalized.value, row.id);
        messageUpdates += 1;
      }
    }

    const users = db.prepare("SELECT id, image FROM User WHERE image IS NOT NULL AND image != ''").all();
    for (const row of users) {
      const normalizedImage = normalizeUrl(row.image, baseUrl);
      if (normalizedImage && normalizedImage !== row.image) {
        updateUser.run(normalizedImage, row.id);
        userUpdates += 1;
      }
    }
  });

  transaction();
  db.close();

  return { listingUpdates, messageUpdates, userUpdates };
}

async function runPostgres(databaseUrl, baseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  let listingUpdates = 0;
  let messageUpdates = 0;
  let userUpdates = 0;

  try {
    await client.query('BEGIN');

    const listings = await client.query("SELECT id, images FROM \"Listing\" WHERE images IS NOT NULL AND images != ''");
    for (const row of listings.rows) {
      const normalized = normalizeJsonArray(row.images, baseUrl);
      if (normalized.changed) {
        await client.query('UPDATE "Listing" SET images = $1 WHERE id = $2', [normalized.value, row.id]);
        listingUpdates += 1;
      }
    }

    const messages = await client.query("SELECT id, attachments FROM \"Message\" WHERE attachments IS NOT NULL AND attachments != ''");
    for (const row of messages.rows) {
      const normalized = normalizeJsonAttachments(row.attachments, baseUrl);
      if (normalized.changed) {
        await client.query('UPDATE "Message" SET attachments = $1 WHERE id = $2', [normalized.value, row.id]);
        messageUpdates += 1;
      }
    }

    const users = await client.query("SELECT id, image FROM \"User\" WHERE image IS NOT NULL AND image != ''");
    for (const row of users.rows) {
      const normalizedImage = normalizeUrl(row.image, baseUrl);
      if (normalizedImage && normalizedImage !== row.image) {
        await client.query('UPDATE "User" SET image = $1 WHERE id = $2', [normalizedImage, row.id]);
        userUpdates += 1;
      }
    }

    await client.query('COMMIT');
    return { listingUpdates, messageUpdates, userUpdates };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const baseUrl = getBaseUrl();

  const result = databaseUrl.startsWith('file:') || databaseUrl === ':memory:'
    ? await runSqlite(databaseUrl, baseUrl)
    : await runPostgres(databaseUrl, baseUrl);

  console.log(JSON.stringify({
    baseUrl,
    ...result,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

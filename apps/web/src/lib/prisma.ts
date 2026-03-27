import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db';

  if (url.startsWith('file:')) {
    // Local dev — SQLite: adapter takes { url } config, NOT a Database instance
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }

  // Production — PostgreSQL
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

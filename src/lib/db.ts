// This file is deprecated. SQLite has been replaced with PostgreSQL via Prisma.
// Do not use this file or `getDb()`. Use `prisma` from `@/lib/prisma` instead.

export function getDb() {
  throw new Error("SQLite is deprecated. Please use Prisma client from '@/lib/prisma.ts'.");
}

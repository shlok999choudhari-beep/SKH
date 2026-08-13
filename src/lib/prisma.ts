import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "postgresql://postgres.jfkfvpnsddcbyxvpbywn:Shlok788767@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

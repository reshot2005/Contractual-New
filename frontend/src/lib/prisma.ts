import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function withPoolParams(url?: string) {
  if (!url) return url
  if (!url.startsWith("postgres")) return url
  const hasConnectionLimit = /(^|[?&])connection_limit=/.test(url)
  const hasPoolTimeout = /(^|[?&])pool_timeout=/.test(url)
  const joiner = url.includes("?") ? "&" : "?"
  let next = url
  if (!hasConnectionLimit) next += `${next === url ? joiner : "&"}connection_limit=40`
  if (!hasPoolTimeout) next += `${next.includes("?") ? "&" : "?"}pool_timeout=30`
  return next
}

const dbUrl = withPoolParams(process.env.DATABASE_URL)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : {}),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

import { type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { parsePagination } from "@/lib/pagination"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  const { id: userId } = await ctx.params

  const { skip, page, limit } = parsePagination(req.nextUrl.searchParams)
  const cacheVersionKey = `cache:freelancer:reviews:${userId}:v`
  const cacheVersion = (await redisGetJson<number>(cacheVersionKey)) ?? 1
  const cacheKey = `freelancer:reviews:${userId}:p${page}:l${limit}:v${cacheVersion}`
  const cached = await redisGetJson<{ rows: any[]; meta: { total: number; page: number; limit: number } }>(cacheKey)
  if (cached) {
    return jsonOk(cached.rows, cached.meta)
  }

  const where = { revieweeId: userId }

  const [total, rows] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
        contract: { select: { id: true, gig: { select: { title: true } } } },
      },
    }),
  ])

  const meta = { total, page, limit }
  await redisSetJson(cacheKey, { rows, meta }, 10 * 60)
  return jsonOk(rows, meta)
}

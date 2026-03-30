import { type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { parsePagination } from "@/lib/pagination"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)

  const { skip, page, limit } = parsePagination(req.nextUrl.searchParams)
  const uid = session.user.id
  const cacheVersionKey = `cache:contracts:user:${uid}:v`
  const cacheVersion = (await redisGetJson<number>(cacheVersionKey)) ?? 1
  const cacheKey = `contracts:list:${uid}:p${page}:l${limit}:v${cacheVersion}`
  const cached = await redisGetJson<{ rows: any[]; meta: { total: number; page: number; limit: number } }>(cacheKey)
  if (cached) return jsonOk(cached.rows, cached.meta)

  const where = {
    OR: [{ freelancerId: uid }, { businessId: uid }],
  }

  const [total, rows] = await prisma.$transaction([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        gig: { select: { id: true, title: true, category: true } },
        freelancer: { select: { id: true, name: true, image: true } },
        business: { select: { id: true, name: true, image: true, companyName: true } },
        conversation: {
          select: {
            id: true,
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    }),
  ])

  const meta = { total, page, limit }
  await redisSetJson(cacheKey, { rows, meta }, 30)
  return jsonOk(rows, meta)
}

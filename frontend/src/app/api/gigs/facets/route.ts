import { GigStatus, Prisma } from "@prisma/client"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { jsonOk, zodErrorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
})

type FacetCount = { name: string; count: number }

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = querySchema.safeParse(raw)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const searchText = parsed.data.search ?? parsed.data.q
  const cacheVersion = (await redisGetJson<number>("gigs:cache-version")) ?? 1
  const cacheKey = `v${cacheVersion}:gigs:facets:${searchText ?? "all"}`
  const cached = await redisGetJson<{
    categories: FacetCount[]
    experienceLevels: FacetCount[]
    urgentCount: number
  }>(cacheKey)
  if (cached) return jsonOk(cached)

  const now = new Date()

  const where: Prisma.GigWhereInput = {
    status: GigStatus.OPEN,
    AND: [{ OR: [{ deadline: null }, { deadline: { gte: now } }] }] as Prisma.GigWhereInput[],
  }

  if (searchText) {
    ;(where.AND as Prisma.GigWhereInput[]).push({
      OR: [
        { title: { contains: searchText, mode: "insensitive" } },
        { description: { contains: searchText, mode: "insensitive" } },
      ],
    })
  }

  const [categories, levels, urgentCount] = await prisma.$transaction([
    (prisma.gig.groupBy as any)({
      by: ["category"],
      where,
      _count: { _all: true },
    }),
    (prisma.gig.groupBy as any)({
      by: ["experienceLevel"],
      where,
      _count: { _all: true },
    }),
    prisma.gig.count({
      where: { ...where, isUrgent: true },
    }),
  ])

  const categoryCounts: FacetCount[] = categories
    .map((c: any) => ({ name: c.category, count: c._count?._all ?? 0 }))
    .filter((c: any) => c.name)
    .sort((a: any, b: any) => b.count - a.count)

  const levelCounts: FacetCount[] = levels
    .map((l: any) => ({ name: l.experienceLevel, count: l._count?._all ?? 0 }))
    .filter((l: any) => l.name)
    .sort((a: any, b: any) => b.count - a.count)

  const payload = {
    categories: categoryCounts,
    experienceLevels: levelCounts,
    urgentCount,
  }
  await redisSetJson(cacheKey, payload, 60)
  return jsonOk(payload)
}

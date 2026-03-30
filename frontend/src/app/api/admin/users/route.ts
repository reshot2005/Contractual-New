import { Role } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { type NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { parsePagination } from "@/lib/pagination"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

const querySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  suspended: z.enum(["true", "false"]).optional(),
  approvalStatus: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.ADMIN) return jsonErr("Forbidden", 403)

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()))
  if (!parsed.success) return zodErrorResponse(parsed.error)
  const { page, limit, role, suspended, approvalStatus } = parsed.data
  const skip = (page - 1) * limit

  const where: Prisma.UserWhereInput = {}
  if (role) where.role = role
  if (suspended === "true") where.isSuspended = true
  if (suspended === "false") where.isSuspended = false
  if (approvalStatus) where.approvalStatus = approvalStatus as any

  const shouldCacheFreelancers = role === Role.FREELANCER
  const cacheVersion = shouldCacheFreelancers
    ? (await redisGetJson<number>("cache:freelancers:list:v")) ?? 1
    : 1
  const cacheKey = shouldCacheFreelancers
    ? `freelancers:list:p${page}:l${limit}:s${suspended ?? "all"}:a${approvalStatus ?? "all"}:v${cacheVersion}`
    : null

  if (cacheKey) {
    const cached = await redisGetJson<{ rows: any[]; total: number }>(cacheKey)
    if (cached) return jsonOk(cached.rows, { total: cached.total, page, limit })
  }

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        isSuspended: true,
        isVerified: true,
        approvalStatus: true,
        companyName: true,
        createdAt: true,
      },
    }),
  ])

  if (cacheKey) {
    await redisSetJson(cacheKey, { rows, total }, 5 * 60)
  }

  return jsonOk(rows, { total, page, limit })
}

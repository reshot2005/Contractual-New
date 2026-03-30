import { ContractStatus, Role } from "@prisma/client"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.ADMIN) return jsonErr("Forbidden", 403)

  const cacheKey = "admin:analytics:summary:v1"
  const cached = await redisGetJson<{
    users: number
    gigs: number
    contracts: number
    revenue: number
    flaggedGigs: number
    openDisputes: number
  }>(cacheKey)
  if (cached) return jsonOk(cached)

  const [
    users,
    gigs,
    contracts,
    revenue,
    flaggedGigs,
    openDisputes,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.gig.count(),
    prisma.contract.count(),
    prisma.contract.aggregate({
      where: { status: ContractStatus.COMPLETED },
      _sum: { agreedPrice: true },
    }),
    prisma.gig.count({ where: { status: "FLAGGED" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
  ])

  const payload = {
    users,
    gigs,
    contracts,
    revenue: revenue._sum.agreedPrice ?? 0,
    flaggedGigs,
    openDisputes,
  }
  await redisSetJson(cacheKey, payload, 30)
  return jsonOk(payload)
}

import { ApplicationStatus, ContractStatus, Role } from "@prisma/client"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { computeProfileCompleteness } from "@/lib/profile-completeness"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

const ACTIVE_CONTRACT_STATUSES: ContractStatus[] = [
  ContractStatus.IN_PROGRESS,
  ContractStatus.SUBMITTED,
  ContractStatus.UNDER_REVIEW,
  ContractStatus.REVISION_REQUESTED,
]

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.FREELANCER) return jsonErr("Forbidden", 403)

  const userId = session.user.id
  const cacheVersionKey = `cache:freelancer:stats:${userId}:v`
  const cacheVersion = (await redisGetJson<number>(cacheVersionKey)) ?? 1
  const cacheKey = `freelancer:stats:${userId}:v${cacheVersion}`
  const cached = await redisGetJson<any>(cacheKey)
  if (cached) return jsonOk(cached)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: { select: { id: true } },
      portfolio: { select: { id: true } },
    },
  })
  if (!user) return jsonErr("Not found", 404)

  const [activeContracts, openProposals, completedContracts, reviewStats, earningsTotal] = await Promise.all([
    prisma.contract.count({
      where: {
        freelancerId: userId,
        status: { in: ACTIVE_CONTRACT_STATUSES },
      },
    }),
    prisma.application.count({
      where: { freelancerId: userId, status: ApplicationStatus.PENDING },
    }),
    prisma.contract.count({
      where: { freelancerId: userId, status: ContractStatus.COMPLETED },
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
    }),
    prisma.contract.aggregate({
      where: { freelancerId: userId, status: ContractStatus.COMPLETED },
      _sum: { agreedPrice: true },
    }),
  ])

  const profileCompleteness = computeProfileCompleteness(user)
  const avgRating = reviewStats._avg.rating

  const response = {
    activeContracts,
    openProposals,
    profileViews: user.profileViews,
    profileCompleteness,
    completedContracts,
    avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
    totalEarnings: earningsTotal._sum.agreedPrice ?? 0,
  }
  await redisSetJson(cacheKey, response, 5 * 60)
  return jsonOk(response)
}

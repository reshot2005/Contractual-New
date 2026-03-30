import { ApprovalStatus, ContractStatus, GigStatus, Role } from "@prisma/client"
import { startOfDay } from "date-fns"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { requireWorkspaceAdmin } from "@/lib/workspace-admin/require-admin-api"
import { formatCurrency } from "@/lib/currency"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

export async function GET() {
  const admin = await requireWorkspaceAdmin()
  if (!admin.ok) return jsonErr(admin.error, 401)

  const cacheKey = "workspace-admin:stats:v1"
  const cached = await redisGetJson<any>(cacheKey)
  if (cached) return jsonOk(cached)

  const now = new Date()
  const dayStart = startOfDay(now)

  const [
    totalUsers,
    usersToday,
    totalBusiness,
    pendingBusiness,
    totalFreelancer,
    activeGigs,
    totalContracts,
    completedContracts,
    revenueAgg,
    revenueMonth,
    pendingList,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.user.count({ where: { role: Role.BUSINESS } }),
    prisma.user.count({
      where: { role: Role.BUSINESS, approvalStatus: ApprovalStatus.PENDING },
    }),
    prisma.user.count({ where: { role: Role.FREELANCER } }),
    prisma.gig.count({ where: { status: GigStatus.OPEN } }),
    prisma.contract.count(),
    prisma.contract.count({ where: { status: ContractStatus.COMPLETED } }),
    prisma.contract.aggregate({
      where: { status: ContractStatus.COMPLETED },
      _sum: { platformFee: true, agreedPrice: true },
    }),
    prisma.contract.aggregate({
      where: {
        status: ContractStatus.COMPLETED,
        completedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _sum: { platformFee: true },
    }),
    prisma.user.findMany({
      where: { role: Role.BUSINESS, approvalStatus: ApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        createdAt: true,
        image: true,
      },
    }),
  ])

  const totalRevenue = Math.round(revenueAgg._sum.platformFee ?? 0)
  const monthRev = Math.round(revenueMonth._sum.platformFee ?? 0)

  const payload = {
    kpis: {
      totalUsers,
      usersToday,
      totalBusiness,
      pendingBusiness,
      totalFreelancer,
      activeGigs,
      totalContracts,
      completedContracts,
      totalRevenue,
      totalRevenueFormatted: formatCurrency(totalRevenue),
      monthRevenueFormatted: formatCurrency(monthRev),
    },
    pendingBusinesses: pendingList,
  }

  await redisSetJson(cacheKey, payload, 30)
  return jsonOk(payload)
}

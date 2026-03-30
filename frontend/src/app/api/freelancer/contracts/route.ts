import { ContractStatus, Role } from "@prisma/client"
import { type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { parsePagination } from "@/lib/pagination"
import { contractProgressPercent, contractStatusLabel } from "@/lib/contract-progress"
import { prisma } from "@/lib/prisma"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.FREELANCER) return jsonErr("Forbidden", 403)

  const { skip, page, limit } = parsePagination(req.nextUrl.searchParams)
  const tab = req.nextUrl.searchParams.get("tab") ?? "active"
  const cacheVersionKey = `cache:contracts:user:${session.user.id}:v`
  const cacheVersion = (await redisGetJson<number>(cacheVersionKey)) ?? 1
  const cacheKey = `contracts:freelancer:${session.user.id}:tab${tab}:p${page}:l${limit}:v${cacheVersion}`
  const cached = await redisGetJson<{ rows: any[]; meta: { total: number; page: number; limit: number } }>(cacheKey)
  if (cached) return jsonOk(cached.rows, cached.meta)

  const uid = session.user.id
  let whereStatus: ContractStatus[] | undefined
  if (tab === "active") {
    whereStatus = [
      ContractStatus.PENDING,
      ContractStatus.IN_PROGRESS,
      ContractStatus.SUBMITTED,
      ContractStatus.UNDER_REVIEW,
      ContractStatus.REVISION_REQUESTED,
    ]
  } else if (tab === "completed") {
    whereStatus = [ContractStatus.COMPLETED]
  } else if (tab === "cancelled") {
    whereStatus = [ContractStatus.CANCELLED]
  }

  const where = {
    freelancerId: uid,
    ...(whereStatus ? { status: { in: whereStatus } } : {}),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        gig: {
          include: {
            business: { select: { id: true, name: true, companyName: true, image: true } },
          },
        },
        submissions: { orderBy: { createdAt: "desc" }, take: 3 },
        _count: { select: { submissions: true } },
      },
    }),
  ])

  const data = rows.map((c) => ({
    id: c.id,
    contractNumber: c.contractNumber,
    status: c.status,
    statusLabel: contractStatusLabel(c.status),
    agreedPrice: c.agreedPrice,
    currency: c.currency,
    deadline: c.deadline,
    startedAt: c.startedAt,
    gig: {
      id: c.gig.id,
      title: c.gig.title,
      business: c.gig.business,
    },
    progress: contractProgressPercent(c.status, c._count.submissions),
    submissionCount: c._count.submissions,
    milestones: c.submissions.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
    })),
  }))

  const meta = { total, page, limit }
  await redisSetJson(cacheKey, { rows: data, meta }, 30)
  return jsonOk(data, meta)
}

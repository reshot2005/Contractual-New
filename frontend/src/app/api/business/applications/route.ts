import { Role } from "@prisma/client"
import { auth } from "@/lib/auth"
import { assertApprovedBusiness } from "@/lib/approval-guards"
import type { BusinessApplicationRow } from "@/lib/business-application-types"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.BUSINESS) return jsonErr("Forbidden", 403)

  const ap = await assertApprovedBusiness(session.user.id)
  if (!ap.ok) return ap.res

  const applications = await prisma.application.findMany({
    where: { gig: { businessId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      gig: {
        select: {
          id: true,
          title: true,
          budgetType: true,
          budgetAmount: true,
          minBudget: true,
          maxBudget: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          location: true,
          isVerified: true,
          skills: { select: { name: true }, take: 8 },
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
  })

  const rows: BusinessApplicationRow[] = applications.map((a) => {
    const rev = a.freelancer.reviewsReceived
    const reviewCount = rev.length
    const reviewAvg =
      reviewCount > 0 ? rev.reduce((s, r) => s + r.rating, 0) / reviewCount : null
    return {
      id: a.id,
      status: a.status,
      proposal: a.proposal,
      proposedPrice: a.proposedPrice,
      deliveryDays: a.deliveryDays,
      createdAt: a.createdAt.toISOString(),
      gig: a.gig,
      freelancer: {
        id: a.freelancer.id,
        name: a.freelancer.name,
        image: a.freelancer.image,
        headline: a.freelancer.headline,
        location: a.freelancer.location,
        isVerified: a.freelancer.isVerified,
        skills: a.freelancer.skills,
        reviewAvg,
        reviewCount,
      },
    }
  })

  return jsonOk(rows)
}

import { ContractStatus, NotificationType } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { getContractForUser } from "@/lib/contract-access"
import { createAndEmitNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)

  const { id: contractId } = await ctx.params
  const access = await getContractForUser(contractId, session.user.id, session.user.role ?? "FREELANCER")
  if (!access) return jsonErr("Not found", 404)

  if (access.status !== ContractStatus.COMPLETED) {
    return jsonErr("Contract must be completed to leave a review", 400)
  }

  const revieweeId =
    access.freelancerId === session.user.id ? access.businessId : access.freelancerId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const existing = await prisma.review.findUnique({
    where: {
      reviewerId_contractId: {
        reviewerId: session.user.id,
        contractId,
      },
    },
  })
  if (existing) return jsonErr("Already reviewed", 409)

  const review = await prisma.review.create({
    data: {
      contractId,
      reviewerId: session.user.id,
      revieweeId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  })

  await createAndEmitNotification({
    userId: revieweeId,
    type: NotificationType.REVIEW_RECEIVED,
    title: "New review",
    message: "You received a new review on a completed contract.",
    link: `/freelancer/profile`,
  })

  await Promise.all([
    redisBumpVersion(`cache:freelancer:reviews:${revieweeId}:v`),
    redisBumpVersion(`cache:freelancer:stats:${revieweeId}:v`),
    redisBumpVersion(`cache:contracts:user:${access.freelancerId}:v`),
    redisBumpVersion(`cache:contracts:user:${access.businessId}:v`),
  ])

  return jsonOk(review, undefined, 201)
}

import { Role, ApplicationStatus } from "@prisma/client"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"
import { assertApprovedBusiness } from "@/lib/approval-guards"

export async function PATCH(req: Request, ctx: { params: Promise<{ applicationId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== Role.BUSINESS) {
      return jsonErr("Unauthorized", 401)
    }

    // BUG-018 Fix: Must be approved to accept/reject
    try {
      await assertApprovedBusiness(session.user.id)
    } catch (e: any) {
      return jsonErr(e.message || "Business profile not approved", 403)
    }

    const { status } = await req.json()
    const { applicationId } = await ctx.params

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { gig: true },
    })

    if (!application || application.gig.businessId !== session.user.id) {
      return jsonErr("Application not found", 404)
    }

    if (!Object.values(ApplicationStatus).includes(status)) {
      return jsonErr("Invalid status", 400)
    }

    // BUG-006 Fix: Transactional Update
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { status },
      })

      if (status === "ACCEPTED" && application.status !== "ACCEPTED") {
        let contract = await tx.contract.findUnique({ where: { applicationId } })
        if (!contract) {
          contract = await tx.contract.create({
            data: {
              agreedPrice: application.proposedPrice ?? application.gig.budgetAmount,
              applicationId: application.id,
              gigId: application.gigId,
              freelancerId: application.freelancerId,
              businessId: application.gig.businessId,
              status: "IN_PROGRESS",
              startedAt: new Date(),
            }
          })
        }

        // Ensure accepted applications always have a conversation thread.
        await tx.conversation.upsert({
          where: { contractId: contract.id },
          update: {},
          create: {
            contractId: contract.id,
            freelancerId: application.freelancerId,
            businessId: application.gig.businessId,
          },
        })
      }
      return updated
    })

    await redisBumpVersion(`cache:proposals:freelancer:${application.freelancerId}:v`)
    if (status === "ACCEPTED") {
      await Promise.all([
        redisBumpVersion(`cache:contracts:user:${application.freelancerId}:v`),
        redisBumpVersion(`cache:contracts:user:${application.gig.businessId}:v`),
      ])
    }

    return jsonOk(result)
  } catch (error: any) {
    console.error("[applicationId/PATCH] Error:", error)
    return jsonErr("Internal server error", 500)
  }
}

import { ContractStatus, NotificationType, Role } from "@prisma/client"
import { auth } from "@/lib/auth"
import { assertApprovedBusiness } from "@/lib/approval-guards"
import { jsonErr, jsonOk } from "@/lib/api-response"
import { getContractForUser } from "@/lib/contract-access"
import { createAndEmitNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"
import { SOCKET_EVENTS } from "@/lib/realtime/socket-events"
import { emitToContractRoom, emitToUsers } from "@/lib/socket-emitter"

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.BUSINESS && session.user.role !== Role.ADMIN) {
    return jsonErr("Forbidden", 403)
  }
  if (session.user.role === Role.BUSINESS) {
    const ap = await assertApprovedBusiness(session.user.id)
    if (!ap.ok) return ap.res
  }

  const { id: contractId } = await ctx.params
  const access = await getContractForUser(contractId, session.user.id, session.user.role ?? "FREELANCER")
  if (!access || access.businessId !== session.user.id) return jsonErr("Forbidden", 403)

  if (access.status !== ContractStatus.UNDER_REVIEW) {
    return jsonErr("Contract must be under review before it can be marked complete", 400)
  }

  const feePct = Number(process.env.PLATFORM_FEE_PERCENT ?? 10) / 100
  const platformFee = Math.round(access.agreedPrice * feePct * 100) / 100

  const contract = await prisma.$transaction(async (tx) => {
    const c = await tx.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.COMPLETED,
        completedAt: new Date(),
        platformFee,
      },
    })
    await tx.activityLog.create({
      data: {
        contractId,
        action: "CONTRACT_COMPLETED",
        description: "Contract marked complete by business",
        userId: session.user.id,
      },
    })
    return c
  })

  await createAndEmitNotification({
    userId: access.freelancerId,
    type: NotificationType.CONTRACT_COMPLETED,
    title: "Contract completed",
    message: "The contract has been marked complete.",
    link: `/contracts/${contractId}`,
  })
  await createAndEmitNotification({
    userId: access.businessId,
    type: NotificationType.CONTRACT_COMPLETED,
    title: "Contract completed",
    message: "The contract has been marked complete.",
    link: `/contracts/${contractId}`,
  })

  emitToUsers(
    [access.freelancerId, access.businessId],
    SOCKET_EVENTS.CONTRACT_COMPLETED,
    { contractId, status: contract.status }
  )
  emitToContractRoom(contractId, SOCKET_EVENTS.CONTRACT_COMPLETED, { contractId })
  await Promise.all([
    redisBumpVersion(`cache:contracts:user:${access.freelancerId}:v`),
    redisBumpVersion(`cache:contracts:user:${access.businessId}:v`),
    redisBumpVersion(`cache:freelancer:stats:${access.freelancerId}:v`),
  ])

  return jsonOk(contract)
}

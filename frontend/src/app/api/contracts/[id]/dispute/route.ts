import { ContractStatus, DisputeStatus, NotificationType, Role } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { getContractForUser } from "@/lib/contract-access"
import { createAndEmitNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"
import { SOCKET_EVENTS } from "@/lib/realtime/socket-events"
import { emitToUser } from "@/lib/socket-emitter"

const schema = z.object({
  reason: z.string().min(10),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)

  const { id: contractId } = await ctx.params
  const access = await getContractForUser(contractId, session.user.id, session.user.role ?? "FREELANCER")
  if (!access) return jsonErr("Not found", 404)

  if (
    access.status === ContractStatus.COMPLETED ||
    access.status === ContractStatus.CANCELLED
  ) {
    return jsonErr("Cannot dispute this contract", 400)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const dispute = await prisma.$transaction(async (tx) => {
    const d = await tx.dispute.create({
      data: {
        contractId,
        reason: parsed.data.reason,
        raisedById: session.user.id,
        status: DisputeStatus.OPEN,
      },
    })
    await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.DISPUTED },
    })
    return d
  })

  const otherId =
    access.freelancerId === session.user.id ? access.businessId : access.freelancerId

  await createAndEmitNotification({
    userId: otherId,
    type: NotificationType.DISPUTE_OPENED,
    title: "Dispute opened",
    message: "A dispute was raised on your contract.",
    link: `/contracts/${contractId}`,
  })

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true },
  })
  for (const a of admins) {
    await createAndEmitNotification({
      userId: a.id,
      type: NotificationType.DISPUTE_OPENED,
      title: "New dispute",
      message: `Dispute on contract ${access.contractNumber}`,
      link: `/admin/disputes`,
    })
    emitToUser(a.id, SOCKET_EVENTS.NOTIFICATION_NEW, { disputeId: dispute.id })
  }

  await Promise.all([
    redisBumpVersion(`cache:contracts:user:${access.freelancerId}:v`),
    redisBumpVersion(`cache:contracts:user:${access.businessId}:v`),
  ])

  return jsonOk(dispute, undefined, 201)
}

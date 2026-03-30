import {
  ApplicationStatus,
  ContractStatus,
  GigStatus,
  NotificationType,
  Role,
} from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { createAndEmitNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"
import { SOCKET_EVENTS } from "@/lib/realtime/socket-events"
import { emitToContractRoom, emitToUsers, emitToUser } from "@/lib/socket-emitter"

const patchSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)

  const { id } = await ctx.params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)
  const { status } = parsed.data

  if (session.user.role === Role.FREELANCER) {
    if (status !== ApplicationStatus.WITHDRAWN) return jsonErr("Forbidden", 403)
    const application = await prisma.application.findUnique({ where: { id } })
    if (!application) return jsonErr("Not found", 404)
    if (application.freelancerId !== session.user.id) return jsonErr("Forbidden", 403)
    if (application.status !== ApplicationStatus.PENDING) {
      return jsonErr("Cannot withdraw", 400)
    }
    const updated = await prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
    })
    await redisBumpVersion(`cache:proposals:freelancer:${session.user.id}:v`)
    return jsonOk(updated)
  }

  if (session.user.role !== Role.BUSINESS && session.user.role !== Role.ADMIN) {
    return jsonErr("Forbidden", 403)
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: { gig: true },
  })
  if (!application) return jsonErr("Not found", 404)
  if (application.gig.businessId !== session.user.id && session.user.role !== Role.ADMIN) {
    return jsonErr("Forbidden", 403)
  }
  if (application.status !== ApplicationStatus.PENDING) {
    return jsonErr("Application is no longer pending", 400)
  }

  if (status === ApplicationStatus.WITHDRAWN) {
    return jsonErr("Invalid status", 400)
  }

  if (status === ApplicationStatus.REJECTED) {
    const updated = await prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.REJECTED },
      include: { freelancer: true, gig: true },
    })

    await createAndEmitNotification({
      userId: application.freelancerId,
      type: NotificationType.APPLICATION_REJECTED,
      title: "Application not selected",
      message: `Your proposal for ${application.gig.title} was not selected.`,
      link: `/freelancer/proposals`,
    })

    emitToUser(application.freelancerId, SOCKET_EVENTS.APPLICATION_REJECTED, { applicationId: id })
    await redisBumpVersion(`cache:proposals:freelancer:${application.freelancerId}:v`)
    return jsonOk(updated)
  }

  if (status === ApplicationStatus.ACCEPTED) {
    const result = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: { status: ApplicationStatus.ACCEPTED },
        include: { gig: true, freelancer: true },
      })

      const agreed =
        app.proposedPrice ?? app.gig.budgetAmount

      const contract = await tx.contract.create({
        data: {
          gigId: app.gigId,
          applicationId: app.id,
          freelancerId: app.freelancerId,
          businessId: app.gig.businessId,
          agreedPrice: agreed,
          currency: app.gig.currency,
          deadline: app.gig.deadline,
          status: ContractStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
        include: {
          gig: { select: { title: true } },
        },
      })

      await tx.activityLog.create({
        data: {
          contractId: contract.id,
          action: "CONTRACT_CREATED",
          description: `Contract created from accepted application`,
          userId: session.user.id,
        },
      })

      // Auto-create conversation for real-time chat
      await tx.conversation.create({
        data: {
          contractId: contract.id,
          freelancerId: app.freelancerId,
          businessId: app.gig.businessId,
        },
      })

      await tx.gig.update({
        where: { id: app.gigId },
        data: { status: GigStatus.FILLED },
      })

      return { app, contract }
    })

    await createAndEmitNotification({
      userId: result.app.freelancerId,
      type: NotificationType.APPLICATION_ACCEPTED,
      title: "Proposal accepted",
      message: `Your proposal for ${result.app.gig.title} was accepted. A contract is ready.`,
      link: `/contracts/${result.contract.id}`,
    })

    await createAndEmitNotification({
      userId: result.app.gig.businessId,
      type: NotificationType.CONTRACT_CREATED,
      title: "Contract started",
      message: `Contract for ${result.app.gig.title} is now in progress.`,
      link: `/contracts/${result.contract.id}`,
    })

    emitToUser(result.app.freelancerId, SOCKET_EVENTS.APPLICATION_ACCEPTED, {
      applicationId: id,
      contractId: result.contract.id,
    })
    emitToUser(result.app.freelancerId, SOCKET_EVENTS.DASHBOARD_UPDATE, {
      type: "PROPOSAL_ACCEPTED",
      contractId: result.contract.id,
    })
    emitToUsers(
      [result.app.freelancerId, result.app.gig.businessId],
      SOCKET_EVENTS.CONTRACT_NEW,
      { contract: result.contract }
    )
    emitToContractRoom(result.contract.id, SOCKET_EVENTS.CONTRACT_STATUS, {
      contractId: result.contract.id,
      status: result.contract.status,
    })
    await Promise.all([
      redisBumpVersion(`cache:proposals:freelancer:${result.app.freelancerId}:v`),
      redisBumpVersion(`cache:contracts:user:${result.app.freelancerId}:v`),
      redisBumpVersion(`cache:contracts:user:${result.app.gig.businessId}:v`),
    ])

    return jsonOk({ application: result.app, contract: result.contract })
  }

  return jsonErr("Unsupported status", 400)
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.FREELANCER) return jsonErr("Forbidden", 403)
  const { id } = await ctx.params

  const application = await prisma.application.findUnique({ where: { id } })
  if (!application) return jsonErr("Not found", 404)
  if (application.freelancerId !== session.user.id) return jsonErr("Forbidden", 403)
  if (application.status !== ApplicationStatus.PENDING) {
    return jsonErr("Cannot withdraw", 400)
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status: ApplicationStatus.WITHDRAWN },
  })
  await redisBumpVersion(`cache:proposals:freelancer:${session.user.id}:v`)
  return jsonOk(updated)
}

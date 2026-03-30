import {
  ContractStatus,
  NotificationType,
  Role,
  SubmissionStatus,
} from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { getContractForUser } from "@/lib/contract-access"
import { createAndEmitNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"
import { SOCKET_EVENTS } from "@/lib/realtime/socket-events"
import { emitToContractRoom, emitToUsers } from "@/lib/socket-emitter"

const createSchema = z.object({
  notes: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),
})

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  const { id: contractId } = await ctx.params

  const access = await getContractForUser(contractId, session.user.id, session.user.role ?? "FREELANCER")
  if (!access) return jsonErr("Not found", 404)

  const rows = await prisma.submission.findMany({
    where: { contractId },
    orderBy: { createdAt: "desc" },
    include: { attachments: true },
  })
  return jsonOk(rows)
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.FREELANCER) return jsonErr("Forbidden", 403)

  const { id: contractId } = await ctx.params
  const access = await getContractForUser(contractId, session.user.id, session.user.role ?? "FREELANCER")
  if (!access || access.freelancerId !== session.user.id) return jsonErr("Forbidden", 403)

  if (
    access.status !== ContractStatus.IN_PROGRESS &&
    access.status !== ContractStatus.REVISION_REQUESTED
  ) {
    return jsonErr("Cannot submit in current status", 400)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const result = await prisma.$transaction(async (tx) => {
    const sub = await tx.submission.create({
      data: {
        contractId,
        notes: parsed.data.notes,
        status: SubmissionStatus.PENDING,
        attachments: parsed.data.attachments?.length
          ? {
              create: parsed.data.attachments.map((a) => ({
                name: a.name,
                url: a.url,
                size: a.size,
                type: a.type,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    })

    const contract = await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.SUBMITTED },
    })

    await tx.activityLog.create({
      data: {
        contractId,
        action: "SUBMISSION_CREATED",
        description: "Work submitted for review",
        userId: session.user.id,
      },
    })

    return { sub, contract }
  })

  await createAndEmitNotification({
    userId: access.businessId,
    type: NotificationType.SUBMISSION_RECEIVED,
    title: "New submission",
    message: `A new submission was sent for contract ${access.contractNumber}.`,
    link: `/contracts/${contractId}`,
  })

  emitToContractRoom(contractId, SOCKET_EVENTS.SUBMISSION_NEW, { submission: result.sub })
  emitToUsers(
    [access.freelancerId, access.businessId],
    SOCKET_EVENTS.CONTRACT_STATUS,
    { contractId, status: result.contract.status }
  )
  await Promise.all([
    redisBumpVersion(`cache:contracts:user:${access.freelancerId}:v`),
    redisBumpVersion(`cache:contracts:user:${access.businessId}:v`),
    redisBumpVersion(`cache:freelancer:stats:${access.freelancerId}:v`),
  ])

  return jsonOk(result.sub, undefined, 201)
}

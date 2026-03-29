import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jsonErr, jsonOk } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonErr("Unauthorized", 401)

    const userId = session.user.id

    // Backfill missing conversation rows for accepted/active legacy contracts.
    const missingConversationContracts = await prisma.contract.findMany({
      where: {
        OR: [{ freelancerId: userId }, { businessId: userId }],
        conversation: null,
      },
      select: {
        id: true,
        freelancerId: true,
        businessId: true,
      },
      take: 200,
    })

    if (missingConversationContracts.length > 0) {
      await prisma.conversation.createMany({
        data: missingConversationContracts.map((c) => ({
          contractId: c.id,
          freelancerId: c.freelancerId,
          businessId: c.businessId,
        })),
        skipDuplicates: true,
      })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ freelancerId: userId }, { businessId: userId }],
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        contract: {
          select: {
            id: true,
            status: true,
            gig: { select: { id: true, title: true } },
          },
        },
        freelancer: {
          select: { id: true, name: true, image: true },
        },
        business: {
          select: { id: true, name: true, image: true, companyName: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            type: true,
            senderId: true,
            createdAt: true,
            readBy: true,
          },
        },
      },
    })

    // Compute unread counts with raw SQL
    const convIds = conversations.map((c: any) => c.id)
    let unreadMap = new Map<string, number>()

    if (convIds.length > 0) {
      try {
        const unreadCounts = await prisma.$queryRaw<{ conversationId: string; count: bigint }[]>`
          SELECT "conversationId", COUNT(*) as count
          FROM "Message"
          WHERE "senderId" != ${userId}
            AND NOT (${userId} = ANY("readBy"))
            AND "conversationId" = ANY(${convIds}::text[])
          GROUP BY "conversationId"
        `
        for (const row of unreadCounts) {
          unreadMap.set(row.conversationId, Number(row.count))
        }
      } catch {
        // Fallback: no unread counts
      }
    }

    const result = conversations.map((conv: any) => {
      const peer =
        userId === conv.freelancerId
          ? {
              id: conv.business.id,
              name: conv.business.companyName || conv.business.name,
              image: conv.business.image,
            }
          : {
              id: conv.freelancer.id,
              name: conv.freelancer.name,
              image: conv.freelancer.image,
            }

      const lastMsg = conv.messages[0] || null

      return {
        id: conv.id,
        contractId: conv.contractId,
        gigId: conv.contract.gig.id,
        gigTitle: conv.contract.gig.title,
        contractStatus: conv.contract.status,
        peer,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              type: lastMsg.type,
              senderId: lastMsg.senderId,
              createdAt: lastMsg.createdAt,
            }
          : null,
        lastMessageAt: conv.lastMessageAt,
        unread: unreadMap.get(conv.id) || 0,
      }
    })

    return jsonOk(result)
  } catch (e: any) {
    console.error("[GET /api/messages/conversations]", e)
    return jsonErr(e.message || "Internal error", 500)
  }
}

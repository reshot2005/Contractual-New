import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion } from "@/lib/redis-cache"

export async function PATCH(req: Request, context: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: contractId, subId: submissionId } = await context.params
    const { action, revisionNote } = await req.json()

    const contract = await prisma.contract.findUnique({ where: { id: contractId } })
    if (!contract || contract.businessId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.submission.update({ where: { id: submissionId }, data: { status: "ACCEPTED" } }),
        prisma.contract.update({ 
           where: { id: contractId }, 
           data: { status: "COMPLETED", completedAt: new Date() } 
        })
      ])
      await Promise.all([
        redisBumpVersion(`cache:contracts:user:${contract.freelancerId}:v`),
        redisBumpVersion(`cache:contracts:user:${contract.businessId}:v`),
        redisBumpVersion(`cache:freelancer:stats:${contract.freelancerId}:v`),
      ])
      return NextResponse.json({ success: true, status: "COMPLETED" })
    } else if (action === "REJECT") {
       await prisma.$transaction([
        prisma.submission.update({ where: { id: submissionId }, data: { status: "REVISION_REQUESTED", revisionNote } }),
        prisma.contract.update({ 
           where: { id: contractId }, 
           data: { status: "REVISION_REQUESTED", revisionCount: { increment: 1 } } 
        })
      ])
      await Promise.all([
        redisBumpVersion(`cache:contracts:user:${contract.freelancerId}:v`),
        redisBumpVersion(`cache:contracts:user:${contract.businessId}:v`),
      ])
      return NextResponse.json({ success: true, status: "REVISION_REQUESTED" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

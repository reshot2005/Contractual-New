import { ApplicationStatus, GigStatus, Role } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { assertGigReadable } from "@/lib/contract-access"
import { prisma } from "@/lib/prisma"
import { redisDel, redisGetJson, redisSetJson } from "@/lib/redis-cache"

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().optional(),
  bannerImage: z.string().url().nullable().optional(),
  budgetType: z.enum(["FIXED", "HOURLY"]).optional(),
  budgetAmount: z.number().positive().optional(),
  minBudget: z.number().nonnegative().optional(),
  maxBudget: z.number().positive().optional(),
  deadline: z.string().nullable().optional(), // Flexible date string
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]).optional(),
  status: z.nativeEnum(GigStatus).optional(),
  requiredSkills: z.array(z.string()).max(40).optional(),
  duration: z.string().max(120).optional(),
  isUrgent: z.boolean().optional(),
  specialRequirements: z.string().max(8000).optional(),
  deliverables: z.array(z.string()).max(50).optional(),
})

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await ctx.params
  const isPublicViewer = !session?.user?.id

  if (isPublicViewer) {
    const cached = await redisGetJson<any>(`gig:detail:${id}`)
    if (cached) return jsonOk(cached)
  }

  const gig = await assertGigReadable(
    id,
    session?.user?.id ?? "anonymous",
    session?.user?.role ?? "FREELANCER"
  )

  if (!gig) return jsonErr("Not found or unauthorized", 404)

  // Re-fetch with needed includes if security check passed
  const fullGig = await prisma.gig.findUnique({
    where: { id },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          image: true,
          isVerified: true,
          companyName: true,
          companyDesc: true,
          industry: true,
          phone: true,
        },
      },
      requiredSkills: true,
      attachments: true,
      _count: { select: { applications: true } },
    },
  })

  if (!fullGig) return jsonErr("Not found", 404)

  // Increment view count (Side effect)
  await prisma.gig.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null)

  let viewerApplication: { id: string; status: ApplicationStatus } | null = null
  if (session?.user?.id && session.user.role === Role.FREELANCER) {
    const app = await prisma.application.findUnique({
      where: {
        freelancerId_gigId: { freelancerId: session.user.id, gigId: id },
      },
      select: { id: true, status: true },
    })
    viewerApplication = app
  }

  const responsePayload = { ...fullGig, viewerApplication }
  if (isPublicViewer) {
    await redisSetJson(`gig:detail:${id}`, responsePayload, 120)
  }
  return jsonOk(responsePayload)
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  const { id } = await ctx.params

  const gig = await prisma.gig.findUnique({ where: { id } })
  if (!gig) return jsonErr("Not found", 404)
  if (gig.businessId !== session.user.id && session.user.role !== Role.ADMIN) {
    return jsonErr("Forbidden", 403)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const u = parsed.data
  
  // Handle skills update
  let requiredSkillsUpdate: any = undefined
  if (u.requiredSkills) {
    requiredSkillsUpdate = {
      deleteMany: {},
      create: u.requiredSkills.map(name => ({ name }))
    }
  }

  const updated = await prisma.gig.update({
    where: { id },
    data: {
      title: u.title,
      description: u.description,
      category: u.category,
      bannerImage: u.bannerImage,
      budgetType: u.budgetType,
      budgetAmount: u.maxBudget ?? u.budgetAmount,
      minBudget: u.minBudget,
      maxBudget: u.maxBudget,
      deadline: u.deadline === undefined ? undefined : u.deadline ? new Date(u.deadline) : null,
      experienceLevel: u.experienceLevel,
      status: u.status,
      duration: u.duration,
      isUrgent: u.isUrgent,
      specialRequirements: u.specialRequirements,
      deliverables: u.deliverables,
      requiredSkills: requiredSkillsUpdate,
    },
    include: {
      business: { select: { id: true, name: true, image: true, companyName: true } },
      requiredSkills: true,
      _count: { select: { applications: true } },
    },
  })
  await Promise.all([
    redisSetJson("gigs:cache-version", Date.now(), 86400),
    redisDel(`gig:detail:${id}`),
  ])
  return jsonOk(updated)
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  const { id } = await ctx.params

  const gig = await prisma.gig.findUnique({ where: { id } })
  if (!gig) return jsonErr("Not found", 404)
  if (gig.businessId !== session.user.id && session.user.role !== Role.ADMIN) {
    return jsonErr("Forbidden", 403)
  }

  await prisma.gig.delete({ where: { id } })
  await Promise.all([
    redisSetJson("gigs:cache-version", Date.now(), 86400),
    redisDel(`gig:detail:${id}`),
  ])
  return jsonOk({ id, deleted: true })
}

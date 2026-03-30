import { GigStatus, Prisma, Role } from "@prisma/client"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { assertApprovedBusiness } from "@/lib/approval-guards"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { getCached, setCached } from "@/lib/cache"
import { redisGetJson, redisSetJson } from "@/lib/redis-cache"

/** ISO or any string Date.parse accepts (Zod .datetime() is strict and can reject valid browser ISO). */
const deadlineField = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid deadline")

const gigDraftSchema = z.object({
  isDraft: z.literal(true),
  title: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  category: z.string().max(120).optional(),
  bannerImage: z.string().url().optional().nullable(),
  budgetType: z.enum(["FIXED", "HOURLY", "MILESTONE"]).optional(),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  currency: z.string().default("INR"),
  deadline: z.union([deadlineField, z.literal(""), z.null()]).optional(),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]).optional(),
  requiredSkills: z.array(z.string()).max(40).optional(),
  duration: z.string().max(120).optional(),
  isUrgent: z.boolean().optional(),
  specialRequirements: z.string().max(8000).optional(),
  deliverables: z.array(z.string()).max(50).optional(),
})

const gigPublishSchema = z
  .object({
    title: z.string().min(1).max(80),
    description: z.string().min(20).max(2000),
    category: z.string().min(1),
    bannerImage: z.string().url().optional().nullable(),
    budgetType: z.enum(["FIXED", "HOURLY", "MILESTONE"]),
    minBudget: z.coerce.number().nonnegative(),
    maxBudget: z.coerce.number().positive(),
    currency: z.string().default("INR"),
    deadline: deadlineField,
    experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]),
    requiredSkills: z.array(z.string()).min(1).max(40),
    duration: z.string().min(1),
    isUrgent: z.boolean().optional(),
    specialRequirements: z.string().max(8000).optional(),
    deliverables: z.array(z.string()).max(50).optional(),
  })
  .refine((d) => d.maxBudget >= d.minBudget, {
    message: "Max budget must be greater than or equal to min budget",
    path: ["maxBudget"],
  })

const listQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  minBudget: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
  deadline: z.enum(["within1", "within3", "within7", "within14", "within30"]).optional(),
  experienceLevel: z.string().optional(), // comma-separated allowed
  urgent: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  skills: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["latest", "budget_high", "budget_low", "deadline"]).default("latest"),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = listQuerySchema.safeParse(raw)
  if (!parsed.success) return zodErrorResponse(parsed.error)
  const f = parsed.data
  const skip = (f.page - 1) * f.limit
  const { page, limit } = f
  const searchText = f.search ?? f.q

  // Simple key for common public views
  const cacheVersion = (await redisGetJson<number>("gigs:cache-version")) ?? 1
  const cacheKey = session?.user?.id 
    ? null 
    : `v${cacheVersion}:gigs:p${page}:l${limit}:s${f.sort}:c${f.category ?? "all"}:ex${f.experienceLevel ?? "all"}`

  if (cacheKey && !searchText && !f.skills && !f.minBudget && !f.maxBudget && !f.deadline) {
    const redisCached = await redisGetJson<{ total: number; rows: any[] }>(cacheKey)
    if (redisCached) return jsonOk(redisCached.rows, { total: redisCached.total, page, limit })
    const cached = getCached<{ total: number, rows: any[] }>(cacheKey)
    if (cached) return jsonOk(cached.rows, { total: cached.total, page, limit })
  }

  const now = new Date()
  const where: Prisma.GigWhereInput = {
    status: GigStatus.OPEN,
    AND: [{ OR: [{ deadline: null }, { deadline: { gte: now } }] }] as Prisma.GigWhereInput[],
  }

  if (searchText) {
    ;(where.AND as any[]).push({
      OR: [
        { title: { contains: searchText, mode: "insensitive" } },
        { description: { contains: searchText, mode: "insensitive" } },
      ],
    })
  }
  if (f.category) {
    const cats = f.category
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    if (cats.length === 1) where.category = cats[0]
    if (cats.length > 1) where.category = { in: cats }
  }
  if (f.minBudget != null || f.maxBudget != null) {
    where.budgetAmount = {}
    if (f.minBudget != null) where.budgetAmount.gte = f.minBudget
    if (f.maxBudget != null) where.budgetAmount.lte = f.maxBudget
  }
  if (f.experienceLevel) {
    const allowed = new Set(["BEGINNER", "INTERMEDIATE", "EXPERT"])
    const levels = f.experienceLevel
      .split(",")
      .map((x) => x.trim().toUpperCase())
      .filter((x) => allowed.has(x))
    if (levels.length === 1) where.experienceLevel = levels[0] as any
    if (levels.length > 1) where.experienceLevel = { in: levels as any }
  }
  if (f.urgent === true) where.isUrgent = true

  if (f.deadline) {
    const days =
      f.deadline === "within1"
        ? 1
        : f.deadline === "within3"
          ? 3
          : f.deadline === "within7"
            ? 7
            : f.deadline === "within14"
              ? 14
              : 30
    const until = new Date(now.getTime() + days * 86400000)
    ;(where.AND as any[]).push({ deadline: { lte: until, gte: now } })
  }

  if (f.skills) {
    const names = f.skills.split(",").map((s) => s.trim()).filter(Boolean)
    if (names.length) {
      where.requiredSkills = { some: { name: { in: names } } }
    }
  }

  let orderBy: Prisma.GigOrderByWithRelationInput = { createdAt: "desc" }
  if (f.sort === "budget_high") orderBy = { budgetAmount: "desc" }
  if (f.sort === "budget_low") orderBy = { budgetAmount: "asc" }
  if (f.sort === "deadline") orderBy = { deadline: "asc" }

  const [total, rows] = await prisma.$transaction([
    prisma.gig.count({ where }),
    prisma.gig.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            companyName: true,
          },
        },
        requiredSkills: true,
        _count: { select: { applications: true } },
      },
    }),
  ])

  let payload: unknown[] = rows
  if (session?.user?.id && session.user.role === Role.FREELANCER) {
    const ids = rows.map((r) => r.id)
    if (ids.length) {
      const apps = await prisma.application.findMany({
        where: { freelancerId: session.user.id, gigId: { in: ids } },
        include: { contract: { select: { id: true, status: true } } },
      })
      const byGig = new Map(apps.map((a) => [a.gigId, a]))
      payload = rows.map((g) => ({
        ...g,
        userApplication: byGig.get(g.id) ?? null,
      }))
    }
  }

  if (cacheKey && !session?.user?.id) {
    setCached(cacheKey, { total, rows }, 60)
    await redisSetJson(cacheKey, { total, rows }, 60)
  }

  return jsonOk(payload, { total, page, limit })
}

function buildGigCreateData(
  d: z.infer<typeof gigPublishSchema> | z.infer<typeof gigDraftSchema>,
  businessId: string,
  status: GigStatus
) {
  const isDraft = status === GigStatus.DRAFT
  const draft = isDraft ? (d as z.infer<typeof gigDraftSchema>) : null
  const pub = !isDraft ? (d as z.infer<typeof gigPublishSchema>) : null

  const title = (isDraft ? draft?.title?.trim() : pub?.title.trim()) || "Untitled gig"
  const description = isDraft
    ? draft!.description?.trim() || "Draft — add details before publishing."
    : pub!.description.trim()
  const category = (draft?.category || pub?.category || "Development").trim()
  const budgetType = draft?.budgetType || pub?.budgetType || "FIXED"
  const minB = draft?.minBudget ?? pub?.minBudget ?? 0
  const maxB = draft?.maxBudget ?? pub?.maxBudget ?? Math.max(minB, 1000)
  const experienceLevel = draft?.experienceLevel || pub?.experienceLevel || "INTERMEDIATE"
  const skills = draft?.requiredSkills ?? pub?.requiredSkills ?? []
  const deadlineStr = draft?.deadline ?? pub?.deadline
  const deliverables = draft?.deliverables ?? pub?.deliverables

  const skillCreates = skills
    .map((name) => ({ name: name.trim() }))
    .filter((s) => s.name.length > 0)

  const data: Prisma.GigCreateInput = {
    title,
    description,
    category,
    budgetType,
    minBudget: minB,
    maxBudget: maxB,
    budgetAmount: maxB,
    currency: draft?.currency || pub?.currency || "INR",
    deadline: deadlineStr ? new Date(deadlineStr) : null,
    duration: draft?.duration ?? pub?.duration ?? null,
    experienceLevel,
    isUrgent: draft?.isUrgent ?? pub?.isUrgent ?? false,
    bannerImage: draft?.bannerImage ?? pub?.bannerImage ?? null,
    specialRequirements: draft?.specialRequirements ?? pub?.specialRequirements ?? null,
    ...(deliverables?.length
      ? { deliverables: deliverables as Prisma.InputJsonValue }
      : {}),
    business: { connect: { id: businessId } },
    status,
    requiredSkills:
      skillCreates.length > 0 ? { create: skillCreates } : undefined,
  }

  return data
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  if (session.user.role !== Role.BUSINESS) return jsonErr("Forbidden", 403)
  const ap = await assertApprovedBusiness(session.user.id)
  if (!ap.ok) return ap.res

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }

  const raw = body as { isDraft?: boolean }
  const isDraft = raw?.isDraft === true

  try {
    if (isDraft) {
      const parsed = gigDraftSchema.safeParse(body)
      if (!parsed.success) return zodErrorResponse(parsed.error)
      const data = buildGigCreateData(parsed.data, session.user.id, GigStatus.DRAFT)
      const gig = await prisma.gig.create({
        data,
        include: {
          business: { select: { id: true, name: true, image: true, companyName: true } },
          requiredSkills: true,
          _count: { select: { applications: true } },
        },
      })
      await redisSetJson("gigs:cache-version", Date.now(), 86400)
      return jsonOk(gig, undefined, 201)
    }

    const parsed = gigPublishSchema.safeParse(body)
    if (!parsed.success) return zodErrorResponse(parsed.error)
    const data = buildGigCreateData(parsed.data, session.user.id, GigStatus.OPEN)
    const gig = await prisma.gig.create({
      data,
      include: {
        business: { select: { id: true, name: true, image: true, companyName: true } },
        requiredSkills: true,
        _count: { select: { applications: true } },
      },
    })
    await redisSetJson("gigs:cache-version", Date.now(), 86400)

    return jsonOk(gig, undefined, 201)
  } catch (e) {
    console.error("[POST /api/gigs]", e)
    const msg =
      e instanceof Error ? e.message : "Failed to create gig. Check database schema is in sync."
    return jsonErr(msg, 500)
  }
}

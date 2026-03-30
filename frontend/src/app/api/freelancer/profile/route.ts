import { Role } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion, redisGetJson, redisSetJson } from "@/lib/redis-cache"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  headline: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  hourlyRate: z.number().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  image: z.string().url().optional().nullable(),
  availability: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  behanceUrl: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pinCode: z.string().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  isAvailable: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonErr("Unauthorized", 401)
    if (session.user.role !== Role.FREELANCER) return jsonErr("Forbidden", 403)

    const cacheVersionKey = `cache:freelancer:profile:${session.user.id}:v`
    const cacheVersion = (await redisGetJson<number>(cacheVersionKey)) ?? 1
    const cacheKey = `freelancer:profile:${session.user.id}:v${cacheVersion}`
    const cached = await redisGetJson<any>(cacheKey)
    if (cached) return jsonOk(cached)

    // Parallel queries — all fire at the same time
    const [user, completed, active, ratings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          skills: true,
          portfolio: true,
          education: true,
          experience: true,
          certifications: true,
          languages: true,
          reviewsReceived: {
            take: 20,
            orderBy: { createdAt: "desc" },
            include: { reviewer: { select: { id: true, name: true, image: true } } },
          },
          _count: {
            select: {
              contractsAsFreelancer: true,
              applications: true,
            },
          },
        },
      }),
      prisma.contract.count({
        where: { freelancerId: session.user.id, status: "COMPLETED" },
      }),
      prisma.contract.count({
        where: { freelancerId: session.user.id, status: "IN_PROGRESS" },
      }),
      prisma.review.aggregate({
        where: { revieweeId: session.user.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ])

    if (!user) return jsonErr("Not found", 404)

    const { passwordHash: _p, ...safe } = user

    const response = {
      ...safe,
      completedContracts: completed,
      activeContracts: active,
      avgRating: ratings._avg.rating,
      reviewCount: ratings._count._all,
    }
    await redisSetJson(cacheKey, response, 5 * 60)

    return jsonOk(response)
  } catch (e: any) {
    console.error("[GET /api/freelancer/profile]", e)
    return jsonErr(e.message || "Internal error", 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return jsonErr("Unauthorized", 401)
    if (session.user.role !== Role.FREELANCER) return jsonErr("Forbidden", 403)

    let body: any
    try {
      body = await req.json()
    } catch {
      return jsonErr("Invalid JSON", 400)
    }
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return zodErrorResponse(parsed.error)

    const d = parsed.data
    const updateData: any = { ...d }
    
    // Clean empty strings to null
    for (const k in updateData) {
      if (updateData[k] === "") updateData[k] = null
    }

    // Handle dateOfBirth specifically
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth)
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      include: { 
        skills: true, 
        portfolio: true, 
        education: true, 
        experience: true,
        languages: true,
        certifications: true,
      },
    })
    await redisBumpVersion(`cache:freelancer:profile:${session.user.id}:v`)
    await redisBumpVersion(`cache:freelancer:stats:${session.user.id}:v`)
    await redisBumpVersion("cache:freelancers:list:v")

    const { passwordHash: _pw, ...safe } = user
    return jsonOk(safe)
  } catch (e: any) {
    console.error("[PATCH /api/freelancer/profile]", e)
    return jsonErr(e.message || "Internal error", 500)
  }
}

import { Role } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { redisBumpVersion, redisGetJson, redisSetJson } from "@/lib/redis-cache"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  image: z.string().url().optional(),
  hourlyRate: z.number().optional(),
  availability: z.string().optional(),
  companyName: z.string().optional(),
  companyDesc: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
})

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  const { id } = await ctx.params

  const cacheVersionKey = `cache:user:profile:${id}:v`
  const cacheVersion = (await redisGetJson<number>(cacheVersionKey)) ?? 1
  const cacheKey = `user:profile:${id}:v${cacheVersion}`
  const cached = await redisGetJson<any>(cacheKey)
  if (cached) return jsonOk(cached)

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      skills: true,
      portfolio: true,
      education: true,
      certifications: true,
      languages: true,
    },
  })
  if (!user) return jsonErr("Not found", 404)

  const { passwordHash: _, ...safe } = user
  await redisSetJson(cacheKey, safe as any, 5 * 60)
  return jsonOk(safe)
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return jsonErr("Unauthorized", 401)
  const { id } = await ctx.params
  if (id !== session.user.id && session.user.role !== Role.ADMIN) {
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

  const d = parsed.data
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...d,
      website: d.website === "" ? null : d.website,
    },
    include: {
      skills: true,
      portfolio: true,
    },
  })
  await redisBumpVersion(`cache:user:profile:${id}:v`)
  await redisBumpVersion(`cache:freelancer:profile:${id}:v`)
  await redisBumpVersion(`cache:freelancer:stats:${id}:v`)
  await redisBumpVersion("cache:freelancers:list:v")
  const { passwordHash: _, ...safe } = user
  return jsonOk(safe)
}

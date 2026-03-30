import bcrypt from "bcryptjs"
import { ApprovalStatus, Role } from "@prisma/client"
import { z } from "zod"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { logPlatformActivity } from "@/lib/platform-activity"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

const onboardingSchema = z.object({
  companyDesc: z.string().max(2000).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  companySize: z.string().max(50).optional().nullable(),
  website: z.string().max(200).optional().nullable().or(z.literal("")),
  location: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  gender: z.string().optional().nullable(),
  image: z.string().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().optional().nullable().or(z.literal("")),
  githubUrl: z.string().optional().nullable().or(z.literal("")),
  websiteUrl: z.string().optional().nullable().or(z.literal("")),
  skills: z.array(z.object({ name: z.string(), level: z.string().optional().nullable() })).max(50).optional().nullable(),
  languages: z.array(z.object({ name: z.string(), proficiency: z.string().optional().nullable() })).max(20).optional().nullable(),
  portfolio: z.array(z.object({ title: z.string(), imageUrl: z.string().optional().nullable().or(z.literal("")) })).max(12).optional().nullable(),
})

const schema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  name: z.string().min(1).max(100),
  role: z.enum(["FREELANCER", "BUSINESS"]),
  companyName: z.string().max(200).optional(),
  onboardingData: onboardingSchema.optional(),
})

export async function POST(req: Request) {
  // BUG-010 Fix: Registration Rate Limit
  const ip = await getClientIp()
  const rl = rateLimit(`register:${ip}`, 100, 60 * 60 * 1000) // Temporarily 100 per hour for testing
  if (!rl.success) {
    return jsonErr("Too many registration attempts. Please try again later.", 429)
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      console.error("Zod Error:", parsed.error.format())
      // Save it to a file for me to read
      await prisma.platformActivityLog.create({
        data: {
          type: "DEBUG_REG_FAIL",
          message: JSON.stringify({ body, error: parsed.error.format() })
        }
      }).catch(() => {})
      return zodErrorResponse(parsed.error)
    }
    const { email, password, name, role, companyName, onboardingData } = parsed.data
    
    const isBusiness = role === "BUSINESS"

    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
      },
    })
    if (existing) {
      // Idempotent business registration:
      // if an unapproved business retries registration, keep/restore PENDING instead of failing silently.
      if (isBusiness && existing.role === Role.BUSINESS) {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            companyName: companyName ?? undefined,
            companyDesc: onboardingData?.companyDesc ?? undefined,
            industry: onboardingData?.industry ?? undefined,
            companySize: onboardingData?.companySize ?? undefined,
            website: onboardingData?.website ?? undefined,
            location: onboardingData?.location ?? undefined,
            phone: onboardingData?.phone ?? undefined,
            approvalStatus: ApprovalStatus.PENDING,
            rejectionReason: null,
            adminNotes: null,
            approvedAt: null,
            approvedBy: null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            approvalStatus: true,
          },
        })

        await logPlatformActivity({
          type: "BUSINESS_REGISTRATION_RESUBMITTED",
          userId: updated.id,
          message: `Business registration resubmitted: ${updated.name} <${updated.email}>`,
        })

        return jsonOk({
          ...updated,
          pendingApproval: true,
          existingAccount: true,
        })
      }

      // Keep a generic response for other duplicate-email cases.
      return jsonErr("If this email is available, an account will be created. Please check your inbox.", 409)
    }
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Base user data
    const userData: any = {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: isBusiness ? Role.BUSINESS : Role.FREELANCER,
      companyName: isBusiness ? companyName : undefined,
      approvalStatus: isBusiness ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED,
    }

    if (onboardingData) {
      if (isBusiness) {
        userData.companyDesc = onboardingData.companyDesc
        userData.industry = onboardingData.industry
        userData.companySize = onboardingData.companySize
        userData.website = onboardingData.website
        userData.location = onboardingData.location
        userData.phone = onboardingData.phone
      } else {
        userData.headline = onboardingData.headline
        userData.bio = onboardingData.summary || onboardingData.bio
        userData.location = onboardingData.location || (onboardingData.city ? `${onboardingData.city}, ${onboardingData.state}` : undefined)
        userData.city = onboardingData.city
        userData.state = onboardingData.state
        userData.hourlyRate = onboardingData.hourlyRate
        userData.phone = onboardingData.phone
        userData.gender = onboardingData.gender
        userData.image = onboardingData.image
        userData.linkedinUrl = onboardingData.linkedinUrl
        userData.githubUrl = onboardingData.githubUrl
        userData.websiteUrl = onboardingData.websiteUrl
        
        if (onboardingData.skills) {
          userData.skills = {
            create: onboardingData.skills.map(s => ({ name: s.name, level: s.level }))
          }
        }
        if (onboardingData.languages) {
          userData.languages = {
            create: onboardingData.languages.map(l => ({ name: l.name, proficiency: l.proficiency ?? "Beginner" }))
          }
        }
        if (onboardingData.portfolio) {
          userData.portfolio = {
            create: onboardingData.portfolio.map(p => ({ title: p.title, imageUrl: p.imageUrl }))
          }
        }
      }
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        approvalStatus: true,
      },
    })

    // Log Activity
    await logPlatformActivity({
      type: isBusiness ? "BUSINESS_REGISTERED" : "USER_REGISTERED",
      userId: user.id,
      message: isBusiness
        ? `New business registration: ${user.name} <${user.email}>`
        : `New freelancer: ${user.name} <${user.email}>`,
    })

    return jsonOk({
      ...user,
      pendingApproval: isBusiness,
    })
  } catch (e: any) {
    console.error("Register Error:", e)
    return jsonErr("Internal server error", 500)
  }
}

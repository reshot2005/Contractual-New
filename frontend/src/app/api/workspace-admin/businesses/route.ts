import { ApprovalStatus, Role } from "@prisma/client"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { requireWorkspaceAdmin } from "@/lib/workspace-admin/require-admin-api"

const qSchema = z.object({
  status: z
    .string()
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined))
    .refine((value) => !value || Object.values(ApprovalStatus).includes(value as ApprovalStatus), {
      message: "Invalid status",
    })
    .transform((value) => value as ApprovalStatus | undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export async function GET(req: NextRequest) {
  const admin = await requireWorkspaceAdmin()
  if (!admin.ok) return jsonErr(admin.error, 401)

  const raw = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = qSchema.safeParse(raw)
  if (!parsed.success) return zodErrorResponse(parsed.error)
  const { page, limit, status } = parsed.data
  const skip = (page - 1) * limit

  const where = {
    role: Role.BUSINESS as const,
    ...(status ? { approvalStatus: status } : {}),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        image: true,
        approvalStatus: true,
        createdAt: true,
        rejectionReason: true,
        _count: {
          select: {
            gigs: true,
            contractsAsBusiness: true,
          },
        },
      },
    }),
  ])

  return jsonOk(rows, { total, page, limit })
}

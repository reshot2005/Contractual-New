import { z } from "zod"
import bcrypt from "bcryptjs"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { verifyPasswordResetToken } from "@/lib/password-reset-token"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

const requestSchema = z
  .object({
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    resetToken: z.string().min(1, "resetToken is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must include at least one letter")
      .regex(/\d/, "Password must include at least one number"),
    confirmPassword: z.string(),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }
  })

const GENERIC_TOKEN_ERROR = "Unable to reset password. Please verify your code again."

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return zodErrorResponse(parsed.error)
    }

    const { email, resetToken, newPassword } = parsed.data

    const rl = rateLimit(`reset-password:${email}`, 5, 15 * 60 * 1000)
    if (!rl.success) {
      return jsonErr("Too many attempts. Please try again later.", 429)
    }

    const tokenPayload = await verifyPasswordResetToken(resetToken)
    if (!tokenPayload || tokenPayload.email !== email) {
      return jsonErr(GENERIC_TOKEN_ERROR, 400)
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    const updated = await prisma.$transaction(async (tx) => {
      const verifiedOtp = await tx.passwordResetOtp.findFirst({
        where: {
          id: tokenPayload.otpId,
          email,
          used: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      if (!verifiedOtp) {
        return null
      }

      const user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (!user) {
        return null
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
        },
      })

      await tx.passwordResetOtp.updateMany({
        where: {
          email,
          used: false,
        },
        data: {
          used: true,
        },
      })

      await tx.passwordResetOtp.update({
        where: { id: verifiedOtp.id },
        data: {
          expiresAt: new Date(),
        },
      })

      return true
    })

    if (!updated) {
      return jsonErr(GENERIC_TOKEN_ERROR, 400)
    }

    return jsonOk({
      success: true,
      message: "Password reset successful.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return jsonErr("Internal server error", 500)
  }
}

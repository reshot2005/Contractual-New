import { z } from "zod"
import bcrypt from "bcryptjs"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { signPasswordResetToken } from "@/lib/password-reset-token"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

const requestSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
})

const GENERIC_OTP_ERROR = "Invalid or expired verification code."

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return zodErrorResponse(parsed.error)
    }

    const { email, otp } = parsed.data
    const rl = rateLimit(`verify-otp:${email}`, 5, 15 * 60 * 1000)
    if (!rl.success) {
      return jsonErr("Too many attempts. Please try again later.", 429)
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!record) {
      return jsonErr(GENERIC_OTP_ERROR, 400)
    }

    const isValid = await bcrypt.compare(otp, record.otpHash)
    if (!isValid) {
      return jsonErr(GENERIC_OTP_ERROR, 400)
    }

    const consumed = await prisma.$transaction(async (tx) => {
      return tx.passwordResetOtp.updateMany({
        where: {
          id: record.id,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: { used: true },
      })
    })

    if (consumed.count === 0) {
      return jsonErr(GENERIC_OTP_ERROR, 400)
    }

    const resetToken = await signPasswordResetToken(email, record.id)
    return jsonOk({
      verified: true,
      resetToken,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return jsonErr("Internal server error", 500)
  }
}

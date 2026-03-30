import { randomInt } from "crypto"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { sendPasswordResetOtpMail } from "@/lib/mail"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

const requestSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
})

const GENERIC_MESSAGE = "If an account exists for this email, a verification code has been sent."

function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return zodErrorResponse(parsed.error)
    }

    const { email } = parsed.data
    const rl = rateLimit(`forgot-password:${email}`, 3, 15 * 60 * 1000)
    if (!rl.success) {
      return jsonErr("Too many requests. Please wait before trying again.", 429)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) {
      return jsonOk({ message: GENERIC_MESSAGE })
    }

    const otp = generateOtp()
    const otpHash = await bcrypt.hash(otp, 12)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetOtp.deleteMany({
        where: {
          email,
          used: false,
        },
      })

      await tx.passwordResetOtp.create({
        data: {
          email,
          otpHash,
          expiresAt,
          used: false,
        },
      })
    })

    try {
      await sendPasswordResetOtpMail({
        to: email,
        otp,
      })
    } catch (error) {
      console.error("Failed to send password reset OTP email:", error)
    }

    return jsonOk({ message: GENERIC_MESSAGE })
  } catch (error) {
    console.error("Forgot password error:", error)
    return jsonErr("Internal server error", 500)
  }
}

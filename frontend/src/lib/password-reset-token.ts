import { SignJWT, jwtVerify } from "jose"

type PasswordResetTokenPayload = {
  email: string
  otpId: string
  purpose: "password-reset"
}

function getSigningSecret() {
  const secretValue = process.env.NEXTAUTH_SECRET
  if (!secretValue) {
    throw new Error("Missing NEXTAUTH_SECRET for password reset token signing.")
  }
  return new TextEncoder().encode(secretValue)
}

export async function signPasswordResetToken(email: string, otpId: string) {
  const secret = getSigningSecret()
  return new SignJWT({
    email,
    otpId,
    purpose: "password-reset",
  } satisfies PasswordResetTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret)
}

export async function verifyPasswordResetToken(token: string): Promise<PasswordResetTokenPayload | null> {
  try {
    const secret = getSigningSecret()
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    })

    if (payload.purpose !== "password-reset") return null
    if (typeof payload.email !== "string" || typeof payload.otpId !== "string") return null

    return {
      email: payload.email.toLowerCase(),
      otpId: payload.otpId,
      purpose: "password-reset",
    }
  } catch {
    return null
  }
}

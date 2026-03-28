import bcrypt from "bcryptjs"
import { type NextRequest } from "next/server"
import { z } from "zod"
import { jsonErr, jsonOk, zodErrorResponse } from "@/lib/api-response"
import { ADMIN_SESSION_COOKIE, signAdminToken } from "@/lib/workspace-admin/jwt"
import {
  getAdminLoginState,
  getClientIp,
  recordAdminLoginFailure,
  resetAdminLoginAttempts,
} from "@/lib/workspace-admin/rate-limit"
import { prisma } from "@/lib/prisma"
import { getAdminCreds } from "@/lib/workspace-admin/config"

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return zodErrorResponse(parsed.error)

  const { email, password } = parsed.data
  const normalized = email.toLowerCase().trim()

  const state = getAdminLoginState(ip)
  if (state.blocked) {
    return jsonErr("Too many attempts. Try again later.", 429)
  }

  const { email: adminEmailRaw, hash } = getAdminCreds()
  const adminEmail = adminEmailRaw?.toLowerCase().trim()

  console.log("[workspace-admin/login] Using creds from:", adminEmail ? "config/env" : "missing")

  if (!adminEmail || !hash) {
    console.error("[workspace-admin/login] ADMIN_EMAIL or ADMIN_PASSWORD_HASH missing")
    return jsonErr("Admin login not configured", 503)
  }

  if (state.showCaptcha && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY) {
    const token = parsed.data.captchaToken
    if (!token) {
      return jsonErr("Captcha required", 400)
    }
    const secret = process.env.HCAPTCHA_SECRET_KEY
    if (secret) {
      const verify = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }).then((r) => r.json() as Promise<{ success?: boolean }>)
      if (!verify.success) {
        recordAdminLoginFailure(ip)
        return jsonErr("Invalid credentials", 401)
      }
    }
  }

  const ua = req.headers.get("user-agent") ?? ""
  const validEmail = normalized === adminEmail
  const validPass = await bcrypt.compare(password, hash)

  if (!validEmail || !validPass) {
    recordAdminLoginFailure(ip)
    console.warn("[workspace-admin/login] failed attempt", { ip, email: normalized, ua })
    await prisma.platformActivityLog.create({
      data: {
        type: "ADMIN_LOGIN_FAILED",
        message: `Failed admin login attempt for ${normalized}`,
        metadata: { ip, userAgent: ua },
      },
    })
    return jsonErr("Invalid credentials", 401)
  }

  const jwt = await signAdminToken(adminEmail)
  resetAdminLoginAttempts(ip)

  const res = jsonOk({ success: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 28800,
  })
  return res
}

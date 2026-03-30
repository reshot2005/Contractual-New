import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { ADMIN_SESSION_COOKIE } from "@/lib/workspace-admin/jwt"

function homeForRole(role: string | undefined) {
  if (role === "ADMIN") return "/admin/dashboard"
  if (role === "BUSINESS") return "/business/dashboard"
  return "/freelancer/dashboard"
}

async function workspaceAdminMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith("/workspace-admin")) return null

  if (pathname === "/workspace-admin") {
    return NextResponse.next()
  }

  const secret = process.env.ADMIN_SECRET_KEY
  if (!secret) {
    return NextResponse.redirect(new URL("/workspace-admin", req.url))
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.redirect(new URL("/workspace-admin", req.url))
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL("/workspace-admin", req.url))
    res.cookies.delete(ADMIN_SESSION_COOKIE)
    return res
  }
}

export default auth(async (req) => {
  const wa = await workspaceAdminMiddleware(req)
  if (wa) return wa

  const { pathname } = req.nextUrl
  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) return
  if (pathname.startsWith("/_next") || pathname.includes(".")) return
  if (pathname.startsWith("/api/workspace-admin")) return

  const isPublicProfile = pathname.startsWith("/freelancer/") && 
    !["dashboard", "settings", "profile", "messages", "contracts", "earnings", "proposals", "notifications", "active-contracts", "browse-gigs", "my-proposals"].some(p => pathname.startsWith(`/freelancer/${p}`))

  const isFreelancerRoute = pathname.startsWith("/freelancer")
  const isBusinessRoute = pathname.startsWith("/business")
  const isAdminRoute = pathname.startsWith("/admin")
  const isContractRoute = pathname.startsWith("/contracts")

  const isProtected = (isFreelancerRoute && !isPublicProfile) || isBusinessRoute || isAdminRoute || isContractRoute

  if (!req.auth && isProtected) {
    const signIn = new URL("/auth/signin", req.nextUrl.origin)
    signIn.searchParams.set("callbackUrl", pathname)
    return Response.redirect(signIn)
  }

  const role = req.auth?.user?.role as string | undefined
  if (!role) return

  if (isAdminRoute && role !== "ADMIN") {
    return Response.redirect(new URL(homeForRole(role), req.nextUrl.origin))
  }
  if (isBusinessRoute && role !== "BUSINESS") {
    return Response.redirect(new URL(homeForRole(role), req.nextUrl.origin))
  }
  if (isFreelancerRoute && !isPublicProfile && role !== "FREELANCER") {
    return Response.redirect(new URL(homeForRole(role), req.nextUrl.origin))
  }
})

export const config = {
  matcher: [
    "/workspace-admin/:path*",
    "/freelancer/:path*",
    "/business/:path*",
    "/admin/:path*",
    "/contracts/:path*",
  ],
}

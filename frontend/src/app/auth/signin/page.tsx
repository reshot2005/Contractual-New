"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Eye, EyeOff, Shield, Users, TrendingUp, Building2, UserCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

function SignInPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [accountType, setAccountType] = useState<"business" | "freelancer">("business")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const r = searchParams.get("role")
    if (r === "freelancer" || r === "business") setAccountType(r)
  }, [searchParams])

  const urlError = searchParams.get("error")
  const rejectReason = searchParams.get("reason")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const callbackUrl = searchParams.get("callbackUrl") ?? undefined
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        toast.error("Invalid email or password")
        return
      }
      const me = await fetch("/api/me").then((r) => r.json())
      const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : me.home
      router.push(target ?? "/freelancer/dashboard")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-white">
      {/* Left panel - Branding/Visual (40%) */}
      <div className="hidden lg:flex lg:w-[40%] relative bg-gradient-to-br from-[#0f172a] via-[#0f3460] to-[#1e4e5e] p-12 flex-col justify-between overflow-hidden text-white">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} 
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,var(--primary),transparent_40%)] opacity-20" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Shield className="w-8 h-8 text-white" />
          <span className="text-2xl font-bold font-josefin tracking-tight">Contractual</span>
        </Link>

        {/* Center quote/branding */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="max-w-[320px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-6 transform rotate-6">
              <TrendingUp className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-3xl font-black font-josefin leading-tight mb-4">Focus on your work, we handle the rest.</h2>
            <p className="text-white/60 font-medium">Join 50k+ professionals who trust Contractual for their high-stakes projects.</p>
          </div>
        </div>

        {/* Professional Card (Bottom Left) */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <h3 className="text-2xl font-black font-josefin mb-3">The platform for serious professionals.</h3>
          <p className="text-white/70 font-medium">Secure contracts, verified payments, and elite gigs from top businesses globally.</p>
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="flex -space-x-3">
              {[
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
                "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop&q=80",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80"
              ].map((url, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] overflow-hidden relative">
                  <Image src={url} alt="Expert" fill className="object-cover" />
                </div>
              ))}
            </div>
            <span className="text-sm font-bold text-white/80 tracking-wide uppercase italic">Trusted by experts</span>
          </div>
        </div>
      </div>

      {/* Right panel - Form (60%) */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">Contractual</span>
          </Link>

          <h1 className="text-2xl md:text-[28px] font-bold text-[var(--text-primary)] mb-2">
            Welcome back
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Sign in to your Contractual account
          </p>

          {urlError === "rejected" && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              Your account was not approved.
              {rejectReason ? ` Reason: ${decodeURIComponent(rejectReason)}` : ""}
            </div>
          )}
          {urlError === "suspended" && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              Your account has been suspended. Contact support.
            </div>
          )}

          <div className="mb-8 grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-alt)] p-1">
            <button
              type="button"
              onClick={() => setAccountType("business")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                accountType === "business"
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Building2 className="h-4 w-4" />
              Business
            </button>
            <button
              type="button"
              onClick={() => setAccountType("freelancer")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                accountType === "freelancer"
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <UserCircle className="h-4 w-4" />
              Freelancer
            </button>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] transition-all duration-300 flex items-center justify-center gap-2",
                isLoading 
                  ? "opacity-80 cursor-not-allowed" 
                  : "hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--shadow-teal)]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            {"Don't have an account? "}
            <Link
              href={accountType === "business" ? "/auth/register?role=business" : "/auth/register?role=freelancer"}
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium"
            >
              Join Free &rarr;
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white text-[var(--text-secondary)]">
          Loading…
        </main>
      }
    >
      <SignInPageInner />
    </Suspense>
  )
}

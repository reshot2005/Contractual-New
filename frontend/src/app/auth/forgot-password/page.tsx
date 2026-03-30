"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

type ForgotPasswordResponse = {
  data?: { message?: string }
  error?: string
}

type VerifyOtpResponse = {
  data?: { verified?: boolean; resetToken?: string }
  error?: string
}

type ResetPasswordResponse = {
  data?: { success?: boolean; message?: string }
  error?: string
}

function getPasswordStrength(password: string) {
  const hasMinLength = password.length >= 8
  const hasLetters = /[A-Za-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const score = [hasMinLength, hasLetters, hasNumbers].filter(Boolean).length

  if (score <= 1) return { label: "Weak", color: "bg-red-500", value: 33 }
  if (score === 2) return { label: "Medium", color: "bg-yellow-500", value: 66 }
  return { label: "Strong", color: "bg-green-500", value: 100 }
}

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailSuccess, setEmailSuccess] = useState("")
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [otpError, setOtpError] = useState("")
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [resetToken, setResetToken] = useState("")

  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS)
  const [isResending, setIsResending] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [redirectSeconds, setRedirectSeconds] = useState(3)

  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const otpValue = otpValues.join("")
  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])

  useEffect(() => {
    if (!emailSubmitted || otpVerified) return
    if (resendSeconds <= 0) return
    const timer = setTimeout(() => setResendSeconds((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [emailSubmitted, otpVerified, resendSeconds])

  useEffect(() => {
    if (!otpVerified || !resetSuccess) return
    if (redirectSeconds <= 0) {
      router.push("/auth/signin")
      return
    }
    const timer = setTimeout(() => setRedirectSeconds((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpVerified, resetSuccess, redirectSeconds, router])

  useEffect(() => {
    if (!emailSubmitted || otpVerified || otpValue.length !== OTP_LENGTH || otpValues.some((digit) => digit === "")) {
      return
    }
    void verifyOtp(otpValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue, otpValues, emailSubmitted, otpVerified])

  async function sendForgotPasswordRequest(targetEmail: string) {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: targetEmail }),
    })

    const json = (await res.json()) as ForgotPasswordResponse
    if (!res.ok) {
      throw new Error(json.error || "Unable to send verification code.")
    }
    return json.data?.message || "If an account exists for this email, a verification code has been sent."
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEmailError("")
    setEmailSuccess("")
    setOtpError("")
    setResetError("")
    setOtpVerified(false)
    setResetToken("")
    setOtpValues(Array(OTP_LENGTH).fill(""))

    const normalizedEmail = email.toLowerCase().trim()
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.")
      return
    }

    try {
      setIsEmailLoading(true)
      const message = await sendForgotPasswordRequest(normalizedEmail)
      setEmail(normalizedEmail)
      setEmailSubmitted(true)
      setEmailSuccess(message)
      setResendSeconds(RESEND_SECONDS)
      setTimeout(() => otpRefs.current[0]?.focus(), 0)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Unable to send verification code.")
    } finally {
      setIsEmailLoading(false)
    }
  }

  async function handleResendCode() {
    if (resendSeconds > 0 || isResending) return
    try {
      setIsResending(true)
      setOtpError("")
      const message = await sendForgotPasswordRequest(email)
      setEmailSuccess(message)
      setOtpValues(Array(OTP_LENGTH).fill(""))
      setResendSeconds(RESEND_SECONDS)
      setTimeout(() => otpRefs.current[0]?.focus(), 0)
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Unable to resend code.")
    } finally {
      setIsResending(false)
    }
  }

  async function verifyOtp(otp: string) {
    if (isOtpLoading || otpVerified) return
    try {
      setIsOtpLoading(true)
      setOtpError("")
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      })
      const json = (await res.json()) as VerifyOtpResponse
      if (!res.ok || !json.data?.verified || !json.data.resetToken) {
        throw new Error(json.error || "Invalid or expired verification code.")
      }
      setOtpVerified(true)
      setResetToken(json.data.resetToken)
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Invalid or expired verification code.")
      setOtpValues(Array(OTP_LENGTH).fill(""))
      setTimeout(() => otpRefs.current[0]?.focus(), 0)
    } finally {
      setIsOtpLoading(false)
    }
  }

  function updateOtpValue(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1)
    const next = [...otpValues]
    next[index] = digit
    setOtpValues(next)
    setOtpError("")

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH)
      .fill("")
      .map((_, idx) => pasted[idx] ?? "")
    setOtpValues(next)
    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    otpRefs.current[nextFocusIndex]?.focus()
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResetError("")

    if (!resetToken) {
      setResetError("Verify the OTP code first.")
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.")
      return
    }

    try {
      setIsResetLoading(true)
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      })
      const json = (await res.json()) as ResetPasswordResponse
      if (!res.ok || !json.data?.success) {
        throw new Error(json.error || "Unable to reset password.")
      }
      setResetSuccess("Password updated successfully. Redirecting to sign in...")
      setRedirectSeconds(3)
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Unable to reset password.")
    } finally {
      setIsResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] p-4 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-blue-500 blur-[100px]" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-purple-500 blur-[100px]" />
      </div>

      <Card className="relative w-full max-w-md border-white/10 bg-white/5 shadow-2xl backdrop-blur-3xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Mail className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tighter text-white">Reset Access</CardTitle>
            <CardDescription className="text-sm font-medium text-white/50">
              Verify your email to recover your account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-white/40">Email Address</label>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              type="email"
              autoComplete="email"
              className="h-12 rounded-xl border-white/10 bg-white/10 text-sm font-medium text-white placeholder:text-white/20 focus:border-blue-500/50"
            />
            <Button
              type="submit"
              disabled={isEmailLoading}
              className="h-12 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-500"
            >
              {isEmailLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </Button>
            {emailError ? <p className="text-sm text-red-300">{emailError}</p> : null}
            {emailSuccess ? <p className="text-sm text-emerald-300">{emailSuccess}</p> : null}
          </form>

          <div
            className={`space-y-3 overflow-hidden border-t border-white/10 pt-4 transition-all duration-300 ${
              emailSubmitted ? "max-h-[320px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Enter 6-digit code</p>
            <div className="flex items-center justify-between gap-2">
              {otpValues.map((digit, index) => (
                <Input
                  key={`otp-${index}`}
                  ref={(el) => {
                    otpRefs.current[index] = el
                  }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateOtpValue(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={handleOtpPaste}
                  className="h-12 w-12 rounded-xl border-white/10 bg-white/10 text-center text-lg font-bold text-white tracking-widest"
                />
              ))}
            </div>
            {isOtpLoading ? (
              <p className="text-sm text-blue-300">Verifying code...</p>
            ) : otpVerified ? (
              <p className="text-sm text-emerald-300">Code verified. Set your new password.</p>
            ) : null}
            {otpError ? <p className="text-sm text-red-300">{otpError}</p> : null}
            <Button
              type="button"
              variant="ghost"
              disabled={resendSeconds > 0 || isResending}
              onClick={handleResendCode}
              className="h-10 px-0 text-sm font-semibold text-white/80 hover:bg-transparent hover:text-white"
            >
              {isResending
                ? "Resending..."
                : resendSeconds > 0
                  ? `Resend code in ${resendSeconds}s`
                  : "Resend code"}
            </Button>
          </div>

          <div
            className={`space-y-3 overflow-hidden border-t border-white/10 pt-4 transition-all duration-300 ${
              otpVerified ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <form onSubmit={handleResetPassword} className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-white/40">Create new password</p>
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                className="h-12 rounded-xl border-white/10 bg-white/10 text-sm font-medium text-white placeholder:text-white/20"
              />
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div
                    className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.value}%` }}
                  />
                </div>
                <p className="text-xs text-white/60">Password strength: {passwordStrength.label}</p>
              </div>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="h-12 rounded-xl border-white/10 bg-white/10 text-sm font-medium text-white placeholder:text-white/20"
              />
              <Button
                type="submit"
                disabled={isResetLoading || Boolean(resetSuccess)}
                className="h-12 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-500"
              >
                {isResetLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
              {resetError ? <p className="text-sm text-red-300">{resetError}</p> : null}
              {resetSuccess ? (
                <p className="text-sm text-emerald-300">
                  {resetSuccess} Redirecting in {redirectSeconds}s...
                </p>
              ) : null}
            </form>
          </div>

          <div className="flex flex-col items-center gap-4 border-t border-white/10 pt-4">
            <Link
              href="/auth/signin"
              className="flex items-center gap-2 text-xs font-bold text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Authorization
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

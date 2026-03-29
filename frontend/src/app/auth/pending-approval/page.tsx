"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Clock, Shield, Mail, CheckCircle2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

function PendingInner() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-teal-50/30 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Main Card */}
        <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xl shadow-gray-100/50">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-8 relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-amber-500" strokeWidth={1.5} />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-2 border-amber-200 animate-ping opacity-20" />
          </motion.div>

          <h1 className="font-josefin text-2xl font-black text-[#0f172a]">
            Application Under Review
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-500 max-w-sm mx-auto">
            Your business account is being reviewed by our admin team to ensure quality and trust on our platform.
          </p>

          {email && (
            <div className="mt-6 flex items-center gap-2 justify-center rounded-xl bg-gray-50 px-4 py-3 mx-auto max-w-xs">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-sm text-gray-600">{email}</span>
            </div>
          )}

          {/* Timeline */}
          <div className="mt-8 space-y-4 text-left max-w-xs mx-auto">
            <TimelineItem
              icon={<CheckCircle2 className="w-4 h-4 text-teal-500" />}
              title="Account Created"
              desc="Your details have been submitted"
              done
            />
            <TimelineItem
              icon={<Shield className="w-4 h-4 text-amber-500" />}
              title="Admin Review"
              desc="Usually within 24 hours"
              active
            />
            <TimelineItem
              icon={<ArrowRight className="w-4 h-4 text-gray-300" />}
              title="Get Started"
              desc="Post gigs and hire talent"
            />
          </div>

          {/* Info box */}
          <div className="mt-8 rounded-xl bg-teal-50 border border-teal-100 p-4 text-left">
            <p className="text-xs text-teal-900 font-medium leading-relaxed">
              <strong>What happens next?</strong> Our team will verify your company details. Once approved,
              you&apos;ll receive an email notification and can immediately start posting gigs and hiring freelancers.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-12 rounded-xl bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform gap-2"
            >
              Back to Home
            </Link>
            <Link
              href="/auth/signin?role=business"
              className="text-sm font-semibold text-teal-600 hover:underline"
            >
              Already approved? Sign in →
            </Link>
          </div>
        </div>

        {/* Bottom badge */}
        <p className="text-center mt-6 text-xs text-gray-400">
          Need help? Contact{" "}
          <a href="mailto:support@contractual.com" className="text-teal-600 hover:underline font-medium">
            support@contractual.com
          </a>
        </p>
      </motion.div>
    </main>
  )
}

function TimelineItem({
  icon,
  title,
  desc,
  done,
  active,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  done?: boolean
  active?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-teal-50" : active ? "bg-amber-50 ring-4 ring-amber-50" : "bg-gray-50"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className={`text-sm font-bold ${done ? "text-teal-700" : active ? "text-amber-700" : "text-gray-400"}`}>
          {title}
        </p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  )
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PendingInner />
    </Suspense>
  )
}

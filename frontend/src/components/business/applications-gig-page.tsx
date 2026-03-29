"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { ApplicationStatus } from "@prisma/client"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  MapPin,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
  UserCheck,
  X,
  Loader2,
  User,
  Briefcase
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatCurrency, formatGigBudgetRange } from "@/lib/currency"

const TEXT = "#0f172a"
const MUTED = "#64748b"
const BORDER = "#e2e8f0"
const TEAL = "#6d9c9f"

async function fetchGigApplications(gigId: string) {
  const res = await fetch(`/api/business/gigs/${gigId}/applications`)
  const j = await res.json()
  if (!res.ok) throw new Error(j.error ?? "Failed to load")
  return j.data || []
}

async function updateAppStatus({ id, status }: { id: string; status: string }) {
  const res = await fetch(`/api/business/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  })
  const j = await res.json()
  if (!res.ok) throw new Error(j.error ?? "Failed to update")
  return j.data
}

interface ApplicationsGigPageProps {
  gigId: string
  gigTitle?: string
}

export function ApplicationsGigPage({ gigId, gigTitle }: ApplicationsGigPageProps) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ["businessApplications", gigId],
    queryFn: () => fetchGigApplications(gigId),
    refetchInterval: 15_000,
  })

  const subtitle = gigTitle ?? "Review applications for your gig"
  const [activeFilter, setActiveFilter] = useState<"ALL" | ApplicationStatus>("ALL")
  const [search, setSearch] = useState("")

  const rows = useMemo(() => Array.isArray(q.data?.rows) ? q.data.rows : [], [q.data])
  const gig = q.data?.gig

  const counts = useMemo(() => {
    return {
      ALL: rows.length,
      PENDING: rows.filter((r: any) => r.status === "PENDING").length,
      ACCEPTED: rows.filter((r: any) => r.status === "ACCEPTED").length,
      REJECTED: rows.filter((r: any) => r.status === "REJECTED").length,
    }
  }, [rows])

  const filtered = useMemo(() => {
    let list = rows
    if (activeFilter !== "ALL") {
      list = list.filter((a: any) => a.status === activeFilter)
    }
    const sq = search.trim().toLowerCase()
    if (sq) {
      list = list.filter(
        (a: any) =>
          a.freelancer.name.toLowerCase().includes(sq) ||
          a.freelancer.skills.some((s: string) => s.toLowerCase().includes(sq)) ||
          (a.freelancer.headline || "").toLowerCase().includes(sq)
      )
    }
    return list
  }, [rows, activeFilter, search])

  const mutStatus = useMutation({
    mutationFn: updateAppStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businessApplications", gigId] })
    }
  })

  const statusCards: { key: "ALL" | ApplicationStatus; label: string; count: number; accent: string }[] = [
    { key: "ALL", label: "Total Applicants", count: counts.ALL, accent: TEAL },
    { key: "PENDING", label: "Pending", count: counts.PENDING, accent: "#3b82f6" },
    { key: "ACCEPTED", label: "Accepted (Hired)", count: counts.ACCEPTED, accent: "#22c55e" },
    { key: "REJECTED", label: "Declined", count: counts.REJECTED, accent: "#f43f5e" },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/business/applications"
                className="inline-flex items-center gap-1.5 text-[15px] font-semibold hover:opacity-80"
                style={{ color: TEAL }}
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                Back
              </Link>
            </div>
            <h1
              className="mt-3 text-2xl font-bold leading-tight"
              style={{ color: TEXT, fontSize: "24px", fontWeight: 700 }}
            >
              Applications
            </h1>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/business/post-gig"
              className="inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              Post New Gig
            </Link>
          </div>
        </div>

        {/* Analytics line */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statusCards.map((sc) => {
            const active = activeFilter === sc.key
            return (
              <button
                key={sc.key}
                type="button"
                onClick={() => setActiveFilter(sc.key)}
                className={cn(
                  "relative cursor-pointer rounded-xl border border-l-4 bg-white p-5 text-left transition-all duration-200",
                  active ? "shadow-[0_4px_16px_rgba(109,156,159,0.2)]" : "hover:shadow-[0_4px_16px_rgba(109,156,159,0.15)]"
                )}
                style={{
                  borderColor: active ? TEAL : BORDER,
                  borderLeftColor: sc.accent,
                  background: active ? "#f0f9f9" : "#ffffff",
                }}
              >
                <p className="font-mono text-[32px] font-extrabold leading-none" style={{ color: TEXT }}>
                  {sc.count}
                </p>
                <p className="mt-1 text-[13px] font-medium" style={{ color: MUTED }}>
                  {sc.label}
                </p>
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-white p-4 lg:flex-row lg:items-center lg:justify-between border-[var(--border,#e2e8f0)]">
          <div className="relative w-full lg:max-w-xs">
             <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
             <input
                type="search"
                placeholder="Search applicants by name or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[42px] w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition-[box-shadow,border-color] focus:border-[#6d9c9f] focus:ring-1 focus:ring-[#6d9c9f]"
              />
          </div>
        </div>

        {/* Cards */}
        {q.isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-10 w-10 animate-spin text-[#6d9c9f]" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-white py-16 text-center border-gray-200">
            <User className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-800">No applicants match your criteria.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((a: any) => (
                <ApplicantCard
                  key={a.id}
                  application={a}
                  gig={gig}
                  isUpdating={mutStatus.isPending && mutStatus.variables?.id === a.id}
                  onAccept={() => mutStatus.mutate({ id: a.id, status: "ACCEPTED" })}
                  onReject={() => mutStatus.mutate({ id: a.id, status: "REJECTED" })}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicantCard({
  application: a,
  gig,
  isUpdating,
  onAccept,
  onReject,
}: {
  application: any
  gig?: any
  isUpdating: boolean
  onAccept: () => void
  onReject: () => void
}) {
  const f = a.freelancer
  const initials = f.name.split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
  
  const rate = formatGigBudgetRange({
    budgetAmount: gig?.budgetAmount,
    minBudget: gig?.minBudget,
    maxBudget: gig?.maxBudget,
    budgetType: gig?.budgetType,
  })
  const duration = a.deliveryDays != null ? `${a.deliveryDays} days` : "—"

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group rounded-2xl border bg-white p-6 transition-all hover:border-[#6d9c9f] hover:shadow-lg border-gray-200"
    >
      <div className="flex flex-col xl:flex-row xl:gap-8">
        <div className="flex-1">
          {/* Header Row */}
          <div className="flex gap-4 items-start">
            {f.image ? (
              <Image src={f.image} width={56} height={56} alt={f.name} className="shrink-0 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] shadow-sm">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/freelancer/${f.id}`} className="text-xl font-bold text-gray-900 hover:text-[#6d9c9f] transition-colors">{f.name}</Link>
                {f.isVerified && <CheckCircle2 className="h-4 w-4 text-[#6d9c9f]" />}
                <span className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  a.status === "PENDING" ? "bg-blue-100 text-blue-700" :
                  a.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                  a.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                )}>
                  {a.status === "ACCEPTED" ? "Hired" : a.status === "REJECTED" ? "Declined" : "Pending"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 font-medium">{f.headline || "Freelancer"}</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {f.reviewAvg != null && f.reviewAvg > 0 && (
                  <span className="flex items-center gap-1.5 font-bold text-amber-500">
                    <Star className="h-4 w-4 fill-current" /> {f.reviewAvg.toFixed(1)} <span className="text-gray-400 font-normal">({f.reviewCount})</span>
                  </span>
                )}
                {f.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {f.location}</span>
                )}
                {f.earnings > 0 && (
                  <span className="flex items-center gap-1.5 text-green-600 font-medium"><TrendingUp className="h-3.5 w-3.5" /> {formatCurrency(f.earnings)} earned</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 border-l-4 border-gray-100 pl-4 py-1">
             <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-2">
                <MessageSquare className="h-4 w-4" /> Cover Letter / Proposal
             </div>
             <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{a.proposal}</p>
          </div>

          {f.skills && f.skills.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {f.skills.slice(0, 8).map((s: string) => (
                <span key={s} className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="mt-6 flex flex-col gap-5 xl:mt-0 xl:w-64 xl:shrink-0 xl:border-l xl:border-gray-100 xl:pl-6">
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gig Budget Range</p>
            <p className="text-2xl font-black text-[#6d9c9f] mt-1">{rate}</p>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500 pb-2 border-b border-gray-200">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Duration:</span>
              <span className="font-semibold text-gray-800">{duration}</span>
            </div>
            <div className="mt-2 text-xs text-gray-400 flex justify-between">
              <span>Applied:</span>
              <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/freelancer/${f.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-[#6d9c9f] hover:text-[#6d9c9f]"
            >
              <Eye className="h-4 w-4" />
              Preview Profile
            </Link>
            <Link
              href={`/business/messages?freelancerId=${encodeURIComponent(f.id)}${gig?.id ? `&gigId=${encodeURIComponent(gig.id)}` : ""}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6d9c9f] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#5a8a8d]"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
          </div>

          {a.status === "PENDING" && (
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button
                disabled={isUpdating}
                onClick={onAccept}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#16a34a] disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Accept & Hire
              </button>
              <button
                disabled={isUpdating}
                onClick={onReject}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          )}

          {a.status === "ACCEPTED" && (
             <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center text-sm font-bold text-green-700 mt-auto">
               You hired this candidate.
             </div>
          )}

          {a.status === "REJECTED" && (
             <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center text-sm font-bold text-red-700 mt-auto">
               Application declined.
             </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}

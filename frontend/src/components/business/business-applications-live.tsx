"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ApplicationStatus } from "@prisma/client"
import { motion } from "framer-motion"
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Star,
  User,
} from "lucide-react"
import type { BusinessApplicationRow } from "@/lib/business-application-types"
import { qk } from "@/lib/realtime/query-keys"
import { formatGigBudgetRange } from "@/lib/currency"

async function fetchApplications(): Promise<BusinessApplicationRow[]> {
  const res = await fetch("/api/business/applications")
  const j = (await res.json()) as { data?: BusinessApplicationRow[]; error?: string }
  if (!res.ok) throw new Error(j.error ?? "Failed to load applications")
  return j.data ?? []
}

const STATUS_UI: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "New", className: "bg-blue-100 text-blue-700" },
  ACCEPTED: { label: "Accepted", className: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Declined", className: "bg-gray-100 text-gray-600" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-slate-100 text-slate-600" },
}

export function BusinessApplicationsLive() {
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGig, setSelectedGig] = useState<string>("all")

  const q = useQuery({
    queryKey: qk.businessApplications(),
    queryFn: fetchApplications,
    refetchInterval: 15_000,
  })

  const rows = q.data ?? []

  const gigTitles = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rows) {
      m.set(r.gig.id, r.gig.title)
    }
    return Array.from(m.entries())
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false
      if (selectedGig !== "all" && a.gig.id !== selectedGig) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !a.freelancer.name.toLowerCase().includes(q) &&
          !a.gig.title.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, filter, selectedGig, searchQuery])

  const stats = useMemo(() => {
    const total = rows.length
    const pending = rows.filter((a) => a.status === "PENDING").length
    const accepted = rows.filter((a) => a.status === "ACCEPTED").length
    const rejected = rows.filter((a) => a.status === "REJECTED").length
    return { total, pending, accepted, rejected }
  }, [rows])

  if (q.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--primary,#6d9c9f)]" />
      </div>
    )
  }

  if (q.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
        {(q.error as Error).message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total applicants", value: stats.total, key: "all" as const },
          { label: "New", value: stats.pending, key: "PENDING" as const },
          { label: "Accepted", value: stats.accepted, key: "ACCEPTED" as const },
          { label: "Declined", value: stats.rejected, key: "REJECTED" as const },
        ].map((s, i) => (
          <motion.button
            key={s.label}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setFilter(s.key === "all" ? "all" : s.key)}
            className={`rounded-xl border p-4 text-left transition-all ${
              filter === s.key
                ? "border-[var(--primary,#6d9c9f)] bg-[var(--primary-light,#e8f4f5)] shadow-md"
                : "border-[var(--border,#e2e8f0)] bg-white hover:border-[var(--primary,#6d9c9f)]"
            }`}
          >
            <p className="text-2xl font-bold text-[var(--text-primary,#0f172a)]">{s.value}</p>
            <p className="text-sm text-[var(--text-secondary,#64748b)]">{s.label}</p>
          </motion.button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border,#e2e8f0)] bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <select
            value={selectedGig}
            onChange={(e) => setSelectedGig(e.target.value)}
            className="rounded-lg border border-[var(--border,#e2e8f0)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--primary-light,#e8f4f5)]"
          >
            <option value="all">All gigs</option>
            {gigTitles.map(([id, title]) => (
              <option key={id} value={id}>
                {title.length > 60 ? `${title.slice(0, 60)}…` : title}
              </option>
            ))}
          </select>
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary,#94a3b8)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or gig…"
              className="w-full rounded-lg border border-[var(--border,#e2e8f0)] py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary-light,#e8f4f5)]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((a, index) => {
          const f = a.freelancer
          const initials = f.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
          const su = STATUS_UI[a.status]
          const rate = formatGigBudgetRange({
            budgetAmount: a.gig.budgetAmount,
            minBudget: a.gig.minBudget,
            maxBudget: a.gig.maxBudget,
            budgetType: a.gig.budgetType,
          })
          const duration =
            a.deliveryDays != null ? `${a.deliveryDays} days` : "—"

          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="overflow-hidden rounded-xl border border-[var(--border,#e2e8f0)] bg-white transition-shadow hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                  <div className="flex gap-4">
                    {f.image ? (
                      <Image
                        src={f.image}
                        width={64}
                        height={64}
                        alt=""
                        className="shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] text-lg font-bold text-white">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/freelancer/${f.id}`}
                          className="text-lg font-semibold text-[var(--text-primary,#0f172a)] hover:text-[#6d9c9f]"
                        >
                          {f.name}
                        </Link>
                        {f.isVerified && <CheckCircle2 className="h-4 w-4 text-[#6d9c9f]" />}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${su.className}`}>
                          {su.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[var(--text-secondary,#64748b)]">
                        {f.headline ?? "Freelancer"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary,#64748b)]">
                        {f.reviewAvg != null && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-semibold">{f.reviewAvg.toFixed(1)}</span>
                            <span>({f.reviewCount})</span>
                          </span>
                        )}
                        {f.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {f.location}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.skills.slice(0, 5).map((s) => (
                          <span
                            key={s.name}
                            className="rounded-full bg-[var(--bg-alt,#f8fafc)] px-2 py-0.5 text-xs text-[var(--text-secondary,#64748b)]"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-secondary,#64748b)]">Gig budget range</p>
                      <p className="text-xl font-bold text-[#6d9c9f]">{rate}</p>
                      <p className="mt-1 flex items-center justify-end gap-1 text-xs text-[var(--text-secondary,#64748b)]">
                        <Clock className="h-3 w-3" />
                        {duration}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/business/applications/${a.gig.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border,#e2e8f0)] px-3 py-2 text-sm font-medium hover:border-[#6d9c9f]"
                      >
                        <Eye className="h-4 w-4" />
                        Gig applicants
                      </Link>
                      <Link
                        href={`/business/messages?freelancerId=${encodeURIComponent(
                          a.freelancer.id
                        )}&gigId=${encodeURIComponent(a.gig.id)}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#6d9c9f] px-3 py-2 text-sm font-medium text-white hover:bg-[#5a8a8d]"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border,#e2e8f0)] pt-4 text-sm">
                  <div className="flex items-start gap-2 text-[var(--text-secondary,#64748b)]">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Applied for:{" "}
                      <span className="font-medium text-[var(--text-primary,#0f172a)]">{a.gig.title}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary,#94a3b8)]">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </div>
                  <p className="line-clamp-3 rounded-lg bg-[var(--bg-alt,#f8fafc)] p-3 text-sm leading-relaxed text-[var(--text-secondary,#475569)]">
                    {a.proposal}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[var(--border,#e2e8f0)] bg-white py-16 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-[var(--text-secondary,#94a3b8)]" />
            <p className="font-medium text-[var(--text-primary,#0f172a)]">No applicants yet</p>
            <p className="mt-1 text-sm text-[var(--text-secondary,#64748b)]">
              When freelancers apply to your gigs, they appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

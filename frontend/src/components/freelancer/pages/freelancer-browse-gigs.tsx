"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { toast } from "sonner"
import type { Application, ApplicationStatus, GigSkill, User } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { qk } from "@/lib/realtime/query-keys"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type GigRow = {
  id: string
  title: string
  budgetAmount: number
  minBudget: number | null
  maxBudget: number | null
  currency: string
  deadline: Date | null
  business: Pick<User, "id" | "name" | "image" | "isVerified"> & {
    companyName: string | null
  }
  requiredSkills: GigSkill[]
  _count: { applications: number }
  userApplication:
    | (Pick<Application, "id" | "status"> & {
        contract: { id: string; status: string } | null
      })
    | null
}

type FilterId = "all" | "open" | "applied" | "closing"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "applied", label: "Applied" },
  { id: "closing", label: "Closing Soon" },
]

function daysUntil(d: Date | null) {
  if (!d) return 999
  const end = new Date(d).setHours(0, 0, 0, 0)
  const now = new Date().setHours(0, 0, 0, 0)
  return (end - now) / (1000 * 60 * 60 * 24)
}

function ApplicationRow({ status }: { status: ApplicationStatus }) {
  if (status === "PENDING") {
    return (
      <div className="flex items-center gap-2 rounded-[12px] border border-[#e2e8f0] bg-white px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" strokeWidth={2} />
        <span className="text-[15px] font-bold text-[#22c55e]">Applied: Pending</span>
      </div>
    )
  }
  if (status === "ACCEPTED") {
    return (
      <div className="flex items-center gap-2 rounded-[12px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" strokeWidth={2} />
        <span className="text-[15px] font-bold text-[#22c55e]">Applied: Accepted</span>
      </div>
    )
  }
  if (status === "WITHDRAWN") {
    return (
      <div className="flex items-center gap-2 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5">
        <span className="text-[15px] font-bold text-[#64748b]">Withdrawn</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5">
      <XCircle className="h-4 w-4 shrink-0 text-[#ef4444]" strokeWidth={2} />
      <span className="text-[15px] font-bold text-[#ef4444]">Applied: Rejected</span>
    </div>
  )
}

async function parseList(): Promise<{ rows: GigRow[]; total: number }> {
  const res = await fetch("/api/gigs?limit=60")
  const j = (await res.json()) as {
    data?: GigRow[]
    meta?: { total?: number }
    error?: string
  }
  if (!res.ok) throw new Error(j.error ?? "Failed to load gigs")
  return { rows: j.data ?? [], total: j.meta?.total ?? 0 }
}

export function FreelancerBrowseGigs() {
  const [filter, setFilter] = useState<FilterId>("all")
  const [applyGig, setApplyGig] = useState<GigRow | null>(null)
  const [bid, setBid] = useState("")
  const [cover, setCover] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const initialTotal = useRef<number | null>(null)
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: qk.gigs(),
    queryFn: parseList,
    refetchInterval: 30_000,
  })

  const metaTotal = q.data?.total ?? 0

  useEffect(() => {
    if (q.data && initialTotal.current === null) {
      initialTotal.current = q.data.total
    }
  }, [q.data])

  useEffect(() => {
    const t = setInterval(async () => {
      const data = await qc.fetchQuery({ queryKey: qk.gigs(), queryFn: parseList })
      if (initialTotal.current != null && data.total > initialTotal.current) {
        const n = data.total - initialTotal.current
        toast.message(`${n} new gig(s) posted — refresh to see`, { duration: 6000 })
        initialTotal.current = data.total
      }
    }, 60_000)
    return () => clearInterval(t)
  }, [qc])

  const visible = useMemo(() => {
    const rows = q.data?.rows ?? []
    return rows.filter((c) => {
      const hasApp = !!c.userApplication
      const closing = c.deadline != null && daysUntil(c.deadline) >= 0 && daysUntil(c.deadline) <= 30
      if (filter === "all") return true
      if (filter === "open") return !hasApp
      if (filter === "applied") return hasApp
      if (filter === "closing") return closing
      return true
    })
  }, [q.data?.rows, filter])

  const onApply = useCallback(async () => {
    if (!applyGig) return
    const bidNum = Number(bid)
    if (!bidNum || bidNum <= 0) {
      toast.error("Enter a valid bid amount")
      return
    }
    if (cover.trim().length < 100) {
      toast.error("Cover letter must be at least 100 characters")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigId: applyGig.id,
          proposedPrice: bidNum,
          proposal: cover.trim(),
        }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error ?? "Apply failed")
      toast.success("Proposal submitted")
      setApplyGig(null)
      setBid("")
      setCover("")
      await qc.invalidateQueries({ queryKey: qk.gigs() })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setSubmitting(false)
    }
  }, [applyGig, bid, cover, qc])

  return (
    <div className="-mx-4 min-h-[calc(100vh-76px)] bg-[#f0f2f8] px-4 py-6 md:-mx-8 md:px-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <header className="w-full">
          <h1
            className="text-2xl font-extrabold text-[#0f172a]"
            style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
          >
            Browse Gigs
          </h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            {q.isLoading ? "…" : `${metaTotal} opportunit${metaTotal === 1 ? "y" : "ies"} available`}
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[#5c6bc0] text-white"
                    : "border border-[#e2e8f0] bg-white text-[#94a3b8] hover:text-[#64748b]"
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <motion.div
          key={filter}
          className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {visible.map((card) => {
            const company = card.business.companyName || card.business.name
            const expiryLabel = card.deadline ? format(new Date(card.deadline), "d MMM yyyy") : "Flexible"
            const app = card.userApplication
            return (
              <motion.article
                key={card.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                className="flex h-full min-h-0 min-w-0 flex-col gap-4 rounded-[20px] bg-white p-5 shadow-[0_2px_20px_rgba(100,100,180,0.08)] transition-all duration-[250ms] ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(100,100,180,0.14)] sm:p-6"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <h2
                    className="min-w-0 flex-1 text-[20px] font-extrabold leading-snug text-[#0f172a] sm:text-[22px]"
                    style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
                  >
                    {card.title}
                  </h2>
                  <span className="shrink-0 rounded-full bg-[#e8eaf6] px-3 py-1.5 text-[12px] font-semibold text-[#5c6bc0] sm:px-4 sm:text-[13px]">
                    Open
                  </span>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" strokeWidth={2} />
                  <span className="text-[#94a3b8]">Posted by </span>
                  <span className="font-bold text-[#0f172a]">{company}</span>
                  {card.business.isVerified && (
                    <span className="text-[11px] font-semibold text-[#22c55e]">Verified</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-[14px] bg-[#f5f6fa] px-4 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Budget</p>
                    <p className="mt-1 font-mono text-[22px] font-extrabold text-[#22c55e]">
                      {card.minBudget && card.maxBudget && card.minBudget !== card.maxBudget 
                        ? `₹${card.minBudget.toLocaleString("en-IN")} - ₹${card.maxBudget.toLocaleString("en-IN")}`
                        : `₹${(card.minBudget || card.budgetAmount || 500).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Deadline</p>
                    <p className="mt-1 text-[17px] font-bold leading-tight text-[#0f172a] sm:text-[18px]">
                      {expiryLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {card.requiredSkills.map((s) => (
                    <span
                      key={s.id}
                      className="cursor-default rounded-full border-[1.5px] border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#5c6bc0] sm:px-[18px] sm:py-2 sm:text-sm"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

                {app && (
                  <div className="w-full min-w-0">
                    <ApplicationRow status={app.status} />
                  </div>
                )}

                <div className="mt-auto flex min-w-0 flex-col gap-3 border-t border-[#f1f5f9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={`/freelancer/browse-gigs/${card.id}`}
                    className="shrink-0 text-[15px] font-bold text-[#0f172a] transition-colors hover:text-[#5c6bc0]"
                  >
                    Details →
                  </Link>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                    {!app && (
                      <button
                        type="button"
                        onClick={() => {
                          setApplyGig(card)
                          setBid(String(Math.round(card.budgetAmount)))
                          setCover("")
                        }}
                        className="instant-apply-pulse inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#6c63ff] to-[#4f46e5] px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 ease-in-out hover:-translate-y-px hover:opacity-90 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                      >
                        Instant Apply
                      </button>
                    )}
                    {app?.status === "PENDING" && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                        Submission Verified
                      </button>
                    )}
                    {app?.status === "ACCEPTED" && app.contract && (
                      <Link
                        href={`/contracts/${app.contract.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] px-[22px] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
                      >
                        View Contract
                      </Link>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </motion.div>

          {q.isLoading && (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex h-96 flex-col gap-4 rounded-[20px] bg-white p-6 shadow-sm">
                  <div className="flex justify-between gap-4">
                    <Skeleton className="h-8 w-3/4 bg-[#f1f5f9]" />
                    <Skeleton className="h-6 w-16 rounded-full bg-[#f1f5f9]" />
                  </div>
                  <Skeleton className="h-4 w-1/2 bg-[#f1f5f9]" />
                  <div className="mt-4 space-y-3 rounded-[14px] bg-[#f5f6fa] p-4">
                    <Skeleton className="h-12 w-full bg-[#e2e8f0]" />
                    <Skeleton className="h-8 w-full bg-[#e2e8f0]" />
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full bg-[#f1f5f9]" />
                    <Skeleton className="h-8 w-20 rounded-full bg-[#f1f5f9]" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!q.isLoading && visible.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <p className="text-sm text-[#94a3b8]">No matches found for your criteria.</p>
            </div>
          )}
      </div>

      <Dialog open={!!applyGig} onOpenChange={(o) => !o && setApplyGig(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply — {applyGig?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#64748b]">Your bid (₹)</label>
              <Input
                type="number"
                value={bid}
                onChange={(e) => setBid(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748b]">Cover letter (min 100 chars)</label>
              <Textarea
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                className="mt-1 min-h-[140px]"
                placeholder="Why you&apos;re a great fit…"
              />
              <p className="mt-1 text-right text-xs text-[#94a3b8]">{cover.trim().length} / 100+</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApplyGig(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void onApply()}>
              {submitting ? "Submitting…" : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"

type Row = {
  id: string
  email: string
  name: string
  companyName: string | null
  approvalStatus: ApprovalStatus
  createdAt: string
  rejectionReason: string | null
  _count: { gigs: number; contractsAsBusiness: number }
}

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const
type Tab = (typeof TABS)[number]

function tabFromSearch(status: string | null): Tab {
  const normalized = (status ?? "").toUpperCase()
  if (normalized && TABS.includes(normalized as Tab) && normalized !== "ALL") return normalized as Tab
  return "ALL"
}

async function fetchRows(status: ApprovalStatus | null) {
  const u = new URL("/api/workspace-admin/businesses", window.location.origin)
  if (status) u.searchParams.set("status", status)
  u.searchParams.set("limit", "50")
  const res = await fetch(u.toString())
  const j = await res.json()
  if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed")
  return (j as { data: Row[] }).data ?? []
}

function BusinessesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = tabFromSearch(searchParams.get("status"))

  const q = useQuery({
    queryKey: ["workspace-admin-businesses", tab],
    queryFn: () => fetchRows(tab === "ALL" ? null : tab),
  })

  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState("")

  function setTab(t: Tab) {
    if (t === "ALL") router.replace("/workspace-admin/businesses")
    else router.replace(`/workspace-admin/businesses?status=${t}`)
  }

  async function approve(id: string) {
    const res = await fetch(`/api/workspace-admin/users/${id}/approve`, { method: "PATCH" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((j as { error?: string }).error ?? "Failed")
      return
    }
    toast.success("Approved")
    void q.refetch()
  }

  async function reject(id: string) {
    const res = await fetch(`/api/workspace-admin/users/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error((j as { error?: string }).error ?? "Failed")
      return
    }
    toast.success("Rejected")
    setRejectId(null)
    setReason("")
    void q.refetch()
  }

  const rows = q.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-white">Businesses</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              tab === t ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
            }`}
          >
            {t === "ALL" ? "All" : t}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#1e293b]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/[0.06] text-slate-400">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gigs</th>
              <th className="px-4 py-3">Contracts</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : q.isError ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-300">
                  {(q.error as Error).message || "Failed to load businesses"}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No businesses found for {tab.toLowerCase()} status.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.04] text-slate-200">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{r.companyName ?? r.name}</p>
                    <p className="text-xs text-slate-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
                      {r.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r._count.gigs}</td>
                  <td className="px-4 py-3">{r._count.contractsAsBusiness}</td>
                  <td className="px-4 py-3">
                    {r.approvalStatus === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void approve(r.id)}
                          className="rounded bg-emerald-600/30 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectId(r.id)}
                          className="rounded bg-red-600/30 px-2 py-1 text-[11px] font-semibold text-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1e293b] p-6">
            <h3 className="font-semibold text-white">Reject business</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#0f172a] p-3 text-sm text-white"
              rows={4}
              placeholder="Reason (required)"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim()}
                onClick={() => void reject(rejectId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkspaceAdminBusinessesPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <BusinessesInner />
    </Suspense>
  )
}

"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import {
  AlertTriangle,
  Banknote,
  Bell,
  CheckCircle,
  FileCheck,
  MessageCircle,
  Star,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { qk } from "@/lib/realtime/query-keys"
import { useSocket } from "@/hooks/useSocket"
import { SOCKET_EVENTS } from "@/lib/realtime/socket-events"

type UserType = "business" | "freelancer" | "admin"

type NotificationRow = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

type NotificationResponse = {
  data: NotificationRow[]
  meta?: { unread?: number }
  error?: string
}

const PROPOSAL_TYPES = new Set([
  "APPLICATION_RECEIVED",
  "APPLICATION_ACCEPTED",
  "APPLICATION_REJECTED",
])

const PAYMENT_TYPES = new Set(["PAYMENT_RELEASED"])

const CONTRACT_TYPES = new Set([
  "CONTRACT_CREATED",
  "CONTRACT_COMPLETED",
  "SUBMISSION_RECEIVED",
  "REVISION_REQUESTED",
  "DISPUTE_OPENED",
  "DISPUTE_RESOLVED",
])

function bucket(type: string) {
  if (PROPOSAL_TYPES.has(type)) return "proposals"
  if (PAYMENT_TYPES.has(type)) return "payments"
  if (CONTRACT_TYPES.has(type)) return "contracts"
  return "system"
}

function TypeIcon({ type }: { type: string }) {
  const wrap = "flex h-10 w-10 items-center justify-center rounded-full"
  if (PROPOSAL_TYPES.has(type)) {
    return (
      <div className={`${wrap} bg-[var(--primary-light)] text-[var(--primary-dark)]`}>
        <UserPlus className="h-5 w-5" />
      </div>
    )
  }

  if (PAYMENT_TYPES.has(type)) {
    return (
      <div className={`${wrap} bg-amber-100 text-amber-800`}>
        <Banknote className="h-5 w-5" />
      </div>
    )
  }

  if (type === "MESSAGE_RECEIVED") {
    return (
      <div className={`${wrap} bg-sky-100 text-sky-800`}>
        <MessageCircle className="h-5 w-5" />
      </div>
    )
  }

  if (type === "REVIEW_RECEIVED") {
    return (
      <div className={`${wrap} bg-amber-100 text-amber-700`}>
        <Star className="h-5 w-5" />
      </div>
    )
  }

  if (type === "DISPUTE_OPENED" || type === "DISPUTE_RESOLVED") {
    return (
      <div className={`${wrap} bg-red-100 text-red-700`}>
        <AlertTriangle className="h-5 w-5" />
      </div>
    )
  }

  if (CONTRACT_TYPES.has(type)) {
    return (
      <div className={`${wrap} bg-emerald-100 text-emerald-800`}>
        <FileCheck className="h-5 w-5" />
      </div>
    )
  }

  if (type === "GIG_FLAGGED" || type === "BUSINESS_APPROVED" || type === "BUSINESS_REJECTED") {
    return (
      <div className={`${wrap} bg-[var(--primary-light)] text-[var(--primary-dark)]`}>
        <CheckCircle className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className={`${wrap} bg-slate-100 text-slate-700`}>
      <Bell className="h-5 w-5" />
    </div>
  )
}

export function NotificationsPage({ userType }: { userType: UserType }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const q = useQuery({
    queryKey: qk.notifications(),
    queryFn: async (): Promise<NotificationResponse> => {
      const res = await fetch("/api/notifications?limit=100")
      const j = (await res.json()) as NotificationResponse
      if (!res.ok) throw new Error(j.error ?? "Failed to load notifications")
      return j
    },
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!socket) return
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    }

    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, refresh)
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, refresh)
    socket.on(SOCKET_EVENTS.APPLICATION_NEW, refresh)
    socket.on(SOCKET_EVENTS.APPLICATION_ACCEPTED, refresh)
    socket.on(SOCKET_EVENTS.APPLICATION_REJECTED, refresh)
    socket.on(SOCKET_EVENTS.CONTRACT_NEW, refresh)
    socket.on(SOCKET_EVENTS.CONTRACT_STATUS, refresh)
    socket.on(SOCKET_EVENTS.CONTRACT_COMPLETED, refresh)
    socket.on(SOCKET_EVENTS.SUBMISSION_NEW, refresh)
    socket.on(SOCKET_EVENTS.REVISION_REQUESTED, refresh)

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, refresh)
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, refresh)
      socket.off(SOCKET_EVENTS.APPLICATION_NEW, refresh)
      socket.off(SOCKET_EVENTS.APPLICATION_ACCEPTED, refresh)
      socket.off(SOCKET_EVENTS.APPLICATION_REJECTED, refresh)
      socket.off(SOCKET_EVENTS.CONTRACT_NEW, refresh)
      socket.off(SOCKET_EVENTS.CONTRACT_STATUS, refresh)
      socket.off(SOCKET_EVENTS.CONTRACT_COMPLETED, refresh)
      socket.off(SOCKET_EVENTS.SUBMISSION_NEW, refresh)
      socket.off(SOCKET_EVENTS.REVISION_REQUESTED, refresh)
    }
  }, [socket, queryClient])

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to mark all as read")
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: qk.notifications() })
      const prev = queryClient.getQueryData<NotificationResponse>(qk.notifications())
      queryClient.setQueryData<NotificationResponse>(qk.notifications(), (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((n) => ({ ...n, isRead: true })),
          meta: { ...old.meta, unread: 0 },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.notifications(), ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to mark notification as read")
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qk.notifications() })
      const prev = queryClient.getQueryData<NotificationResponse>(qk.notifications())
      queryClient.setQueryData<NotificationResponse>(qk.notifications(), (old) => {
        if (!old) return old
        const alreadyRead = old.data.find((n) => n.id === id)?.isRead
        const unread = old.meta?.unread ?? old.data.filter((n) => !n.isRead).length
        return {
          ...old,
          data: old.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          meta: { ...old.meta, unread: alreadyRead ? unread : Math.max(0, unread - 1) },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.notifications(), ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })

  const items = q.data?.data ?? []
  const unread = q.data?.meta?.unread ?? items.filter((n) => !n.isRead).length

  const counts = useMemo(() => {
    return {
      all: items.length,
      contracts: items.filter((n) => bucket(n.type) === "contracts").length,
      proposals: items.filter((n) => bucket(n.type) === "proposals").length,
      payments: items.filter((n) => bucket(n.type) === "payments").length,
      system: items.filter((n) => bucket(n.type) === "system").length,
    }
  }, [items])

  const filterTab = (tab: "all" | "contracts" | "proposals" | "payments" | "system") => {
    if (tab === "all") return items
    return items.filter((n) => bucket(n.type) === tab)
  }

  const openNotification = (n: NotificationRow) => {
    if (!n.isRead) markOneRead.mutate(n.id)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="page-section-enter flex flex-wrap items-center justify-between gap-3" style={{ ["--stagger-delay" as string]: "0s" }}>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
            {unread > 0 && (
              <span className="inline-flex rounded-md bg-[var(--primary)] px-2.5 py-1 text-sm font-semibold text-white">
                {unread} new
              </span>
            )}
          </div>
          <button type="button" onClick={() => markAllRead.mutate()} className="text-sm font-semibold text-[var(--primary-dark)] hover:underline">
            Mark all read
          </button>
        </div>

        <Tabs defaultValue="all" className="page-section-enter w-full" style={{ ["--stagger-delay" as string]: "0.05s" }}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-[var(--bg-alt)] p-1">
            <TabsTrigger value="all" className="rounded-lg">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="contracts" className="rounded-lg">Contracts ({counts.contracts})</TabsTrigger>
            <TabsTrigger value="proposals" className="rounded-lg">Proposals ({counts.proposals})</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-lg">Payments ({counts.payments})</TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg">System ({counts.system})</TabsTrigger>
          </TabsList>

          {(["all", "contracts", "proposals", "payments", "system"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
              {q.isLoading && (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]">
                  Loading notifications...
                </div>
              )}

              {q.isError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  {(q.error as Error).message}
                </div>
              )}

              {!q.isLoading && !q.isError && filterTab(tab).length === 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-secondary)]">
                  No notifications in this section yet.
                </div>
              )}

              {!q.isLoading && !q.isError && filterTab(tab).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={cn(
                    "group relative flex w-full gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm transition-all card-hover-lift",
                    !n.isRead && "border-l-[3px] border-l-[var(--primary)] bg-[var(--primary-light)]/40"
                  )}
                >
                  <TypeIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">{n.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{n.message}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />}
                    {!n.isRead && (
                      <span className="text-xs text-[var(--primary-dark)]">Unread</span>
                    )}
                  </div>
                </button>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <aside
        className="page-section-enter w-full shrink-0 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm lg:w-[280px]"
        style={{ ["--stagger-delay" as string]: "0.1s" }}
      >
        <h2 className="font-semibold text-[var(--text-primary)]">Notification settings</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Control how Contractual reaches you.</p>
        <div className="mt-6 space-y-5">
          {[
            { id: "email", label: "Email notifications", sub: "Digest + important alerts" },
            { id: "push", label: "Push notifications", sub: "Real-time on this device" },
            { id: "prop", label: "New proposals", sub: "When talent applies" },
            { id: "cont", label: "Contract updates", sub: "Signed, delivered, disputes" },
            { id: "pay", label: "Payment alerts", sub: "Escrow releases & payouts" },
            { id: "promo", label: "Promotional", sub: "Product news (rare)" },
          ].map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor={row.id} className="text-sm font-medium text-[var(--text-primary)]">
                  {row.label}
                </Label>
                <p className="text-[12px] leading-snug text-[var(--text-secondary)]">{row.sub}</p>
              </div>
              <Switch id={row.id} defaultChecked={row.id !== "promo"} />
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-6 w-full rounded-xl border-[var(--primary)] text-[var(--primary-dark)]" asChild>
          <Link href={userType === "business" ? "/business/settings" : "/freelancer/settings"}>Advanced preferences</Link>
        </Button>
      </aside>
    </div>
  )
}

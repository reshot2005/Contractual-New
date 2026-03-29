"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCheck,
  ChevronDown,
  ImageIcon,
  Info,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/useSocket"
import { SOCKET_EVENTS } from "@/lib/realtime/socket-events"

/* ─── Types ─── */

type Peer = { id: string; name: string; image: string | null }

type ConversationItem = {
  id: string
  contractId: string
  gigId: string
  gigTitle: string
  contractStatus: string
  peer: Peer
  lastMessage: {
    id: string
    content: string | null
    type: string
    senderId: string
    createdAt: string
  } | null
  lastMessageAt: string
  unread: number
}

type Msg = {
  id: string
  conversationId: string
  senderId: string
  content: string | null
  imageUrl: string | null
  imageName: string | null
  imageSize: number | null
  type: string
  readBy: string[]
  createdAt: string
  sender: { id: string; name: string; image: string | null }
  _status?: "sending" | "sent" | "error"
  _progress?: number
  _blobUrl?: string
}

/* ─── Helpers ─── */

function initials(name: string) {
  const p = name.trim().split(/\s+/)
  if (p.length >= 2) return (p[0]![0] + p[1]![0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatMsgDate(d: Date) {
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "MMM d, yyyy")
}

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts)
  const j = await res.json()
  if (!res.ok) throw new Error(j.error ?? res.statusText)
  return j.data
}

/* ─── Constants ─── */
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/image/upload`
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export function FreelancerMessages() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const qc = useQueryClient()
  const { socket, connected } = useSocket()
  const userId = session?.user?.id

  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showMobile, setShowMobile] = useState(false)
  const requestedConversationId = searchParams.get("conversationId")
  const requestedFreelancerId = searchParams.get("freelancerId")
  const requestedGigId = searchParams.get("gigId")

  /* ── Conversations List ── */
  const convQuery = useQuery<ConversationItem[]>({
    queryKey: ["conversations"],
    queryFn: () => api("/api/messages/conversations"),
    enabled: !!userId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  const conversations = useMemo(() => {
    const list = convQuery.data ?? []
    if (!searchTerm) return list
    const q = searchTerm.toLowerCase()
    return list.filter(
      (c) =>
        c.peer.name.toLowerCase().includes(q) ||
        c.gigTitle.toLowerCase().includes(q)
    )
  }, [convQuery.data, searchTerm])

  // Auto-select first conversation
  useEffect(() => {
    if (requestedConversationId) {
      const requested = conversations.find((c) => c.id === requestedConversationId)
      if (requested && activeId !== requested.id) {
        setActiveId(requested.id)
        return
      }
    }

    if (requestedFreelancerId) {
      const requested = conversations.find(
        (c) =>
          c.peer.id === requestedFreelancerId &&
          (!requestedGigId || c.gigId === requestedGigId)
      )
      if (requested && activeId !== requested.id) {
        setActiveId(requested.id)
        return
      }
    }

    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0]!.id)
    }
  }, [activeId, conversations, requestedConversationId, requestedFreelancerId, requestedGigId])

  const active = conversations.find((c) => c.id === activeId)

  /* ── Socket listeners for conversation list updates ── */
  useEffect(() => {
    if (!socket) return
    const onNewMessage = () => {
      qc.invalidateQueries({ queryKey: ["conversations"] })
    }
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNewMessage)
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNewMessage)
    }
  }, [socket, qc])

  const handleSelectConversation = (id: string) => {
    setActiveId(id)
    setShowMobile(true)
  }

  return (
    <div
      className="flex overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: "#e8ecf0", height: "calc(100vh - 76px)" }}
    >
      {/* LEFT PANEL — Conversation List */}
      <div
        className={cn(
          "flex w-full md:w-[300px] shrink-0 flex-col border-r border-[#f1f5f9]",
          showMobile && "hidden md:flex"
        )}
      >
        {/* Header */}
        <div className="border-b border-[#f1f5f9] px-4 py-3.5">
          <p className="text-[15px] font-bold text-[#0f172a]">Messages</p>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="search"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-[34px] w-full rounded-lg bg-[#f4f6f9] pl-8 pr-3 text-[12px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6d9c9f]/30"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {convQuery.isLoading && (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!convQuery.isLoading && conversations.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <MessageSquare className="h-8 w-8 text-[#cbd5e1]" />
              <p className="text-[13px] font-medium text-[#64748b]">
                No conversations yet
              </p>
              <p className="text-[12px] text-[#94a3b8] px-4 leading-relaxed">
                Conversations appear when a business accepts your proposal and
                starts a contract
              </p>
            </div>
          )}

          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectConversation(c.id)}
              className={cn(
                "flex w-full gap-2.5 border-b border-[#f8fafc] px-4 py-3 text-left transition-colors duration-150",
                activeId === c.id
                  ? "border-l-[3px] border-l-[#6d9c9f] bg-[#e8f4f5]"
                  : "hover:bg-[#f8fafc]",
                c.unread > 0 && activeId !== c.id && "bg-[#fafbff]"
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {c.peer.image ? (
                  <Image
                    src={c.peer.image}
                    width={40}
                    height={40}
                    alt=""
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] text-[13px] font-bold text-white">
                    {initials(c.peer.name)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate text-[13px] text-[#0f172a]",
                      c.unread > 0 ? "font-bold" : "font-semibold"
                    )}
                  >
                    {c.peer.name}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-[#94a3b8]">
                    {c.lastMessage
                      ? format(new Date(c.lastMessage.createdAt), "MMM d")
                      : "—"}
                  </span>
                </div>
                <p className="truncate text-[11px] text-[#6d9c9f] mt-0.5">
                  for {c.gigTitle}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p
                    className={cn(
                      "truncate text-[12px] flex-1",
                      c.unread > 0
                        ? "font-semibold text-[#374151]"
                        : "text-[#94a3b8]"
                    )}
                  >
                    {c.lastMessage
                      ? c.lastMessage.senderId === userId
                        ? `You: ${c.lastMessage.type === "IMAGE" ? "📎 Image" : (c.lastMessage.content || "")}`
                        : c.lastMessage.type === "IMAGE"
                          ? "📎 Image"
                          : c.lastMessage.content || ""
                      : c.gigTitle}
                  </p>
                  {c.unread > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#6d9c9f] px-1.5 text-[10px] font-bold text-white">
                      {c.unread > 99 ? "99+" : c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — Chat Area */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          !showMobile && "hidden md:flex"
        )}
      >
        {!activeId || !active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-[#94a3b8]" />
            </div>
            <p className="text-[15px] font-semibold text-[#0f172a]">
              Select a conversation
            </p>
            <p className="text-[13px] text-[#94a3b8] max-w-[280px]">
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        ) : (
          <ChatPane
            conversation={active}
            userId={userId!}
            socket={socket}
            connected={connected}
            onBack={() => setShowMobile(false)}
          />
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   CHAT PANE (right side)
   ═══════════════════════════════════════════════ */

function ChatPane({
  conversation,
  userId,
  socket,
  connected,
  onBack,
}: {
  conversation: ConversationItem
  userId: string
  socket: any
  connected: boolean
  onBack: () => void
}) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<Msg[]>([])
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [imagePreview, setImagePreview] = useState<{
    file: File
    blobUrl: string
  } | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [showNewMsg, setShowNewMsg] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isAtBottomRef = useRef(true)

  const convId = conversation.id

  /* ── Fetch Messages ── */
  const msgQuery = useQuery<{
    messages: Msg[]
    hasMore: boolean
    nextCursor: string | null
  }>({
    queryKey: ["chat-messages", convId],
    queryFn: () => api(`/api/messages/${convId}`),
    enabled: !!convId,
    staleTime: 30_000,
  })

  // Sync query data to local state
  useEffect(() => {
    if (msgQuery.data?.messages) {
      setMessages(msgQuery.data.messages)
    }
  }, [msgQuery.data])

  /* ── Socket: real-time messages ── */
  useEffect(() => {
    if (!socket) return

    const onNewMessage = (payload: { conversationId: string; message: Msg }) => {
      if (payload.conversationId !== convId) return
      if (payload.message.senderId === userId) return // Already added optimistically

      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev
        return [...prev, payload.message]
      })

      // Mark as read since we're viewing this conversation
      fetch(`/api/messages/${convId}`, { method: "GET" }).catch(() => {})

      if (!isAtBottomRef.current) {
        setShowNewMsg(true)
      } else {
        scrollToBottom()
      }
    }

    const onTypingStart = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === convId && payload.userId !== userId) {
        setIsOtherTyping(true)
      }
    }

    const onTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === convId && payload.userId !== userId) {
        setIsOtherTyping(false)
      }
    }

    socket.on("message:new", onNewMessage)
    socket.on("typing:start", onTypingStart)
    socket.on("typing:stop", onTypingStop)

    return () => {
      socket.off("message:new", onNewMessage)
      socket.off("typing:start", onTypingStart)
      socket.off("typing:stop", onTypingStop)
    }
  }, [socket, convId, userId])

  /* ── Scroll management ── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setShowNewMsg(false)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length > 0 && messages[messages.length - 1]?.id])

  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    isAtBottomRef.current = atBottom
    if (atBottom) setShowNewMsg(false)
  }

  /* ── Typing indicator ── */
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      fetch(`/api/messages/${convId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      }).catch(() => {})
    },
    [convId]
  )

  const handleDraftChange = (val: string) => {
    setDraft(val)
    emitTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => emitTyping(false), 2000)
  }

  // Auto-clear typing indicator
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isOtherTyping) {
      timer = setTimeout(() => setIsOtherTyping(false), 4000)
    }
    return () => clearTimeout(timer)
  }, [isOtherTyping])

  /* ── Send message ── */
  const sendMessage = useCallback(async () => {
    const text = draft.trim()
    const hasImage = imagePreview !== null
    if (!text && !hasImage) return

    const tempId = `temp-${Date.now()}`

    // 1. Optimistic text message
    if (text) {
      const optimistic: Msg = {
        id: tempId,
        conversationId: convId,
        senderId: userId,
        content: text,
        imageUrl: null,
        imageName: null,
        imageSize: null,
        type: "TEXT",
        readBy: [userId],
        createdAt: new Date().toISOString(),
        sender: {
          id: userId,
          name: "You",
          image: null,
        },
        _status: "sending",
      }

      setMessages((prev) => [...prev, optimistic])
      setDraft("")
      emitTyping(false)

      try {
        const real = await api<Msg>(`/api/messages/${convId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, type: "TEXT" }),
        })
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...real, _status: "sent" as const } : m))
        )
        qc.invalidateQueries({ queryKey: ["conversations"] })
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, _status: "error" as const } : m))
        )
        setDraft(text)
        toast.error("Failed to send message")
      }
    }

    // 2. Image upload + send
    if (hasImage && imagePreview) {
      const imgTempId = `temp-img-${Date.now()}`
      const file = imagePreview.file
      const blobUrl = imagePreview.blobUrl

      const imgOptimistic: Msg = {
        id: imgTempId,
        conversationId: convId,
        senderId: userId,
        content: null,
        imageUrl: null,
        imageName: file.name,
        imageSize: file.size,
        type: "IMAGE",
        readBy: [userId],
        createdAt: new Date().toISOString(),
        sender: { id: userId, name: "You", image: null },
        _status: "sending",
        _progress: 0,
        _blobUrl: blobUrl,
      }

      setMessages((prev) => [...prev, imgOptimistic])
      setImagePreview(null)

      try {
        // Upload to Cloudinary
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", CLOUDINARY_PRESET)

        const cloudUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === imgTempId ? { ...m, _progress: pct } : m
                )
              )
            }
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText)
              resolve(data.secure_url)
            } else {
              reject(new Error("Upload failed"))
            }
          }
          xhr.onerror = () => reject(new Error("Upload error"))
          xhr.open("POST", CLOUDINARY_URL)
          xhr.send(formData)
        })

        // Save to DB
        const real = await api<Msg>(`/api/messages/${convId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: cloudUrl,
            imageName: file.name,
            imageSize: file.size,
            type: "IMAGE",
          }),
        })

        setMessages((prev) =>
          prev.map((m) =>
            m.id === imgTempId
              ? { ...real, _status: "sent" as const, _blobUrl: undefined }
              : m
          )
        )
        URL.revokeObjectURL(blobUrl)
        qc.invalidateQueries({ queryKey: ["conversations"] })
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === imgTempId ? { ...m, _status: "error" as const } : m
          )
        )
        toast.error("Failed to upload image")
      }
    }
  }, [draft, imagePreview, convId, userId, emitTyping, qc])

  /* ── File Selection ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2097152) {
      toast.error("Image must be under 2MB")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }
    setImagePreview({ file, blobUrl: URL.createObjectURL(file) })
    e.target.value = ""
  }

  /* ── Group messages by date for separators ── */
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; msgs: Msg[] }[] = []
    for (const m of messages) {
      const d = new Date(m.createdAt)
      const last = groups[groups.length - 1]
      if (last && isSameDay(last.date, d)) {
        last.msgs.push(m)
      } else {
        groups.push({ date: d, msgs: [m] })
      }
    }
    return groups
  }, [messages])

  return (
    <>
      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-3 border-b border-[#f1f5f9] px-5 h-14 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f4f6f9]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {conversation.peer.image ? (
          <Image
            src={conversation.peer.image}
            width={36}
            height={36}
            alt=""
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] text-xs font-bold text-white">
            {initials(conversation.peer.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-[#0f172a] truncate">
            {conversation.peer.name}
          </p>
          <p className="flex items-center gap-1.5 text-[12px]">
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                connected ? "bg-[#22c55e] animate-pulse" : "bg-gray-300"
              )}
            />
            <span className={connected ? "text-[#22c55e]" : "text-[#94a3b8]"}>
              {connected ? "Online" : "Offline"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1 ml-3">
          <div className="flex items-center gap-1.5 bg-[#e8f4f5] text-[#2d7a7e] border border-[#b0d4d6] rounded-md px-2.5 py-1">
            <Briefcase className="h-[11px] w-[11px]" />
            <span className="text-[11px] font-semibold truncate max-w-[150px]">
              {conversation.gigTitle}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f4f6f9] ml-1"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* ── MESSAGES AREA ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-4 bg-[#f8fafc] relative"
      >
        {msgQuery.isLoading && (
          <div className="space-y-4">
            {/* Skeleton bubbles */}
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="h-12 w-48 rounded-2xl rounded-bl-sm bg-gray-200 animate-pulse" />
            </div>
            <div className="flex items-end gap-2 flex-row-reverse">
              <div className="h-10 w-40 rounded-2xl rounded-br-sm bg-teal-100 animate-pulse" />
            </div>
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="h-16 w-56 rounded-2xl rounded-bl-sm bg-gray-200 animate-pulse" />
            </div>
          </div>
        )}

        {!msgQuery.isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-[#6d9c9f]" />
            </div>
            <p className="text-[13px] font-medium text-[#64748b]">
              Start the conversation
            </p>
            <p className="text-[12px] text-[#94a3b8]">
              Say hello or discuss your project details
            </p>
          </div>
        )}

        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            {/* Date separator */}
            <div className="flex justify-center my-3">
              <span className="bg-[#e8ecf0] text-[#64748b] rounded-full px-3 py-1 text-[11px] font-medium">
                {formatMsgDate(group.date)}
              </span>
            </div>

            {group.msgs.map((m, mi) => {
              const mine = m.senderId === userId
              const isSystem = m.type === "CONTRACT_UPDATE" || m.type === "SYSTEM"
              const showAvatar =
                !mine &&
                (mi === 0 || group.msgs[mi - 1]?.senderId !== m.senderId)

              if (isSystem) {
                return (
                  <div key={m.id} className="flex justify-center my-3">
                    <div className="bg-[#f1f5f9] text-[#64748b] rounded-lg px-4 py-2 text-[12px] flex items-center gap-2">
                      <Info size={12} />
                      {m.content}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-end gap-2 mb-1",
                    mine && "flex-row-reverse"
                  )}
                >
                  {/* Avatar */}
                  {!mine && (
                    <div className="w-7 shrink-0">
                      {showAvatar ? (
                        m.sender.image ? (
                          <Image
                            src={m.sender.image}
                            width={28}
                            height={28}
                            alt=""
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] text-[10px] font-bold text-white">
                            {initials(m.sender.name)}
                          </div>
                        )
                      ) : (
                        <div className="w-7" />
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn("max-w-[65%]", mine && "ml-auto")}>
                    {/* Image */}
                    {(m.type === "IMAGE" || m.imageUrl || m._blobUrl) && (
                      <div
                        className={cn(
                          "relative rounded-2xl overflow-hidden border shadow-sm mb-1 cursor-pointer",
                          mine
                            ? "rounded-br-sm border-teal-200"
                            : "rounded-bl-sm border-[#e8ecf0]"
                        )}
                        onClick={() =>
                          setLightboxUrl(m.imageUrl || m._blobUrl || null)
                        }
                      >
                        <Image
                          src={m._blobUrl || m.imageUrl || ""}
                          width={240}
                          height={200}
                          alt={m.imageName || "Image"}
                          className="object-cover"
                          loading="lazy"
                        />
                        {m._status === "sending" && m._progress !== undefined && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                            <div
                              className="h-full bg-teal-400 transition-all duration-300"
                              style={{ width: `${m._progress}%` }}
                            />
                          </div>
                        )}
                        {m.imageName && (
                          <p className="text-[11px] text-[#94a3b8] px-2 py-1 bg-white/80">
                            {m.imageName}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Text */}
                    {m.content && (
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm",
                          mine
                            ? "rounded-br-sm bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] text-white"
                            : "rounded-bl-sm bg-white border border-[#e8ecf0] text-[#0f172a]",
                          m._status === "error" && "opacity-60"
                        )}
                      >
                        {m.content}
                      </div>
                    )}

                    {/* Time + Read Receipt */}
                    <p
                      className={cn(
                        "mt-0.5 text-[11px] text-[#94a3b8] flex items-center gap-1",
                        mine && "justify-end"
                      )}
                    >
                      {format(new Date(m.createdAt), "h:mm a")}
                      {mine && (
                        <span className="ml-0.5">
                          {m._status === "sending" ? (
                            <Check size={12} className="text-gray-400" />
                          ) : m._status === "error" ? (
                            <span className="text-red-500 text-[10px] font-medium ml-1">
                              Failed
                            </span>
                          ) : m.readBy && m.readBy.length > 1 ? (
                            <CheckCheck size={12} className="text-teal-500" />
                          ) : (
                            <CheckCheck size={12} className="text-gray-400" />
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isOtherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-end gap-2 mb-1"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {initials(conversation.peer.name)}
              </div>
              <div className="bg-white border border-[#e8ecf0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"
                  style={{
                    animation: "typing-dot 1.4s infinite",
                    animationDelay: "0ms",
                  }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"
                  style={{
                    animation: "typing-dot 1.4s infinite",
                    animationDelay: "150ms",
                  }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"
                  style={{
                    animation: "typing-dot 1.4s infinite",
                    animationDelay: "300ms",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />

        {/* Scroll to bottom pill */}
        <AnimatePresence>
          {showNewMsg && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="fixed bottom-24 right-8 z-10 flex items-center gap-1.5 bg-[#6d9c9f] text-white px-4 py-2 rounded-full shadow-lg text-[12px] font-semibold hover:-translate-y-0.5 transition-transform"
            >
              <ChevronDown size={14} />
              New message
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── INPUT AREA ── */}
      <div className="border-t border-[#f1f5f9] bg-white shrink-0">
        {/* Image Preview Strip */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pt-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 bg-[#f8fafc] rounded-xl px-3 py-2">
                <Image
                  src={imagePreview.blobUrl}
                  width={60}
                  height={60}
                  alt=""
                  className="rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#0f172a] truncate">
                    {imagePreview.file.name}
                  </p>
                  <p className="text-[11px] text-teal-600 font-medium">
                    Ready to send
                  </p>
                </div>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(imagePreview.blobUrl)
                    setImagePreview(null)
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200 text-[#64748b]"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 px-4 py-3">
          {/* Attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[#e8ecf0] bg-white text-[#64748b] hover:border-[#6d9c9f] hover:text-[#6d9c9f] transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Textarea */}
          <textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 min-h-[38px] max-h-[120px] rounded-[10px] bg-[#f4f6f9] px-3.5 py-2.5 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6d9c9f]/30 resize-none"
            style={{
              height: "38px",
              overflow: draft.length > 80 ? "auto" : "hidden",
            }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = "38px"
              t.style.height = Math.min(t.scrollHeight, 120) + "px"
            }}
          />

          {/* Send */}
          <button
            type="button"
            onClick={sendMessage}
            disabled={!draft.trim() && !imagePreview}
            className={cn(
              "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] transition-all",
              draft.trim() || imagePreview
                ? "bg-gradient-to-br from-[#6d9c9f] to-[#2d7a7e] text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-200/40"
                : "bg-[#e8ecf0] text-[#94a3b8] cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4 -rotate-45" />
          </button>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onKeyDown={(e) => {
              if (e.key === "Escape") setLightboxUrl(null)
            }}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxUrl}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for typing animation */}
      <style jsx global>{`
        @keyframes typing-dot {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </>
  )
}

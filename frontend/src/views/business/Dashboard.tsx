"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format, addDays } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"
import {
  Bell,
  Search,
  ChevronDown,
  FileText,
  Users,
  Briefcase,
  IndianRupee,
  TrendingUp,
  Plus,
  FolderOpen,
  CreditCard,
  Rocket,
  Upload,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  User,
  LogOut,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useCountUp } from "@/lib/hooks/use-count-up"
import { cn } from "@/lib/utils"
export type GigStatus = "Open" | "In Review" | "Urgent" | "Closed" | "Draft"

const CATEGORY_OPTIONS = [
  { id: "development", emoji: "💻", label: "Development" },
  { id: "design", emoji: "🎨", label: "Design" },
  { id: "marketing", emoji: "📈", label: "Marketing" },
]

const MOCK_SKILL_POOL = ["React", "TypeScript", "Node.js", "Figma", "Marketing"]
const MOCK_GIG_ROWS: any[] = []
const MOCK_ACTIVITIES: any[] = []
const MOCK_APPLICATIONS: any[] = []
const SPARKLINE_VIEWS: any[] = []
const RADIAL_APPLICATION_RATE: any[] = []
const TIMELINE_OPTIONS: any[] = []

const fadeUpContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
}

const gigFormSchema = z
  .object({
    title: z.string().min(10, "Title must be at least 10 characters").max(100),
    category: z.string().min(1, "Select a category"),
    description: z.string().min(50, "Description must be at least 50 characters").max(2000),
    budgetType: z.enum(["fixed", "hourly"]),
    fixedAmount: z.coerce.number().optional(),
    hourlyMin: z.coerce.number().optional(),
    hourlyMax: z.coerce.number().optional(),
    timeline: z.string().min(1, "Select a timeline"),
    deadline: z.date({ message: "Choose an application deadline" }),
    hireCount: z.coerce.number().min(1).max(99),
    priority: z.enum(["normal", "high", "urgent"]),
    skills: z.array(z.string()).min(1, "Add at least one skill"),
  })
  .superRefine((data, ctx) => {
    if (data.budgetType === "fixed") {
      const v = data.fixedAmount
      if (v == null || Number.isNaN(v) || v < 10) {
        ctx.addIssue({ code: "custom", message: "Budget must be at least ₹10", path: ["fixedAmount"] })
      }
    } else {
      const a = data.hourlyMin ?? 0
      const b = data.hourlyMax ?? 0
      if (a < 10) ctx.addIssue({ code: "custom", message: "Minimum rate at least ₹10/hr", path: ["hourlyMin"] })
      if (b < 10) ctx.addIssue({ code: "custom", message: "Maximum rate at least ₹10/hr", path: ["hourlyMax"] })
      if (b < a) ctx.addIssue({ code: "custom", message: "Max rate must be ≥ min", path: ["hourlyMax"] })
    }
  })

type GigFormValues = z.infer<typeof gigFormSchema>

const BUDGET_PRESETS = [100, 250, 500, 1000, 2500]

function KpiStatCard({
  label,
  value,
  prefix = "",
  icon: Icon,
  iconBg,
  numberClass,
  subtext,
  subIcon: SubI,
  subClass,
}: {
  label: string
  value: number
  prefix?: string
  icon: typeof FileText
  iconBg: string
  numberClass: string
  subtext: string
  subIcon: typeof TrendingUp
  subClass: string
}) {
  const n = useCountUp(value, 1500, 0, true)
  return (
    <motion.div
      variants={fadeUpItem}
      className="card-hover-lift rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
          <p className={cn("mt-2 font-mono text-4xl font-semibold tracking-tight", numberClass)}>
            {prefix}
            {n.toLocaleString()}
          </p>
          <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", subClass)}>
            <SubI className="h-3 w-3" />
            {subtext}
          </p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )
}

function statusPill(status: GigStatus) {
  const map: Record<GigStatus, string> = {
    Open: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    "In Review": "bg-amber-100 text-amber-900 border border-amber-200",
    Urgent: "badge-urgent-pulse bg-red-100 text-red-800 border border-red-200",
    Closed: "bg-neutral-100 text-neutral-600 border border-neutral-200",
    Draft: "border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-600",
  }
  const emoji: Record<GigStatus, string> = {
    Open: "🟢",
    "In Review": "🟡",
    Urgent: "🔴",
    Closed: "⚫",
    Draft: "📝",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", map[status])}>
      {emoji[status]} {status}
    </span>
  )
}

export function BusinessDashboardPage() {
  const [skillDraft, setSkillDraft] = useState("")
  const [skillOpen, setSkillOpen] = useState(false)
  const [presetFocus, setPresetFocus] = useState<number | "custom" | null>(500)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [tableLoading, setTableLoading] = useState(true)
  const [gigTab, setGigTab] = useState<"all" | "active" | "draft" | "closed" | "urgent">("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [attachments, setAttachments] = useState<{ name: string; size: string; progress: number }[]>([])

  useEffect(() => {
    const t = window.setTimeout(() => setTableLoading(false), 900)
    return () => clearTimeout(t)
  }, [])

  const form = useForm<GigFormValues>({
    resolver: zodResolver(gigFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      category: "",
      description: "",
      budgetType: "fixed",
      fixedAmount: 500,
      hourlyMin: 45,
      hourlyMax: 120,
      timeline: "2-4",
      deadline: addDays(new Date(), 14),
      hireCount: 1,
      priority: "normal",
      skills: ["React", "TypeScript"],
    },
  })

  const budgetType = form.watch("budgetType")
  const titleLen = form.watch("title")?.length ?? 0
  const descLen = form.watch("description")?.length ?? 0
  const skills = form.watch("skills")
  const hireCount = form.watch("hireCount")
  const hourlyMin = form.watch("hourlyMin")
  const hourlyMax = form.watch("hourlyMax")

  const skillSuggestions = useMemo(() => {
    const q = skillDraft.trim().toLowerCase()
    if (!q) return MOCK_SKILL_POOL.slice(0, 5)
    return MOCK_SKILL_POOL.filter((s) => s.toLowerCase().includes(q)).slice(0, 5)
  }, [skillDraft])

  const invalidBlockPublish = !form.formState.isValid

  const filteredGigs = useMemo(() => {
    return MOCK_GIG_ROWS.filter((g) => {
      if (gigTab === "all") return true
      if (gigTab === "active") return g.status === "Open" || g.status === "In Review"
      if (gigTab === "draft") return g.status === "Draft"
      if (gigTab === "closed") return g.status === "Closed"
      if (gigTab === "urgent") return g.status === "Urgent"
      return true
    })
  }, [gigTab])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filteredGigs.length) setSelected(new Set())
    else setSelected(new Set(filteredGigs.map((g) => g.id)))
  }

  const onPublish = (data: GigFormValues) => {
    toast.success("Gig published successfully", {
      description: "Your listing is live and queued for review.",
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      duration: 4000,
    })
    console.log("publish", data)
  }

  const onInvalid = () => {
    toast.error("Please fix the highlighted fields", {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    })
  }

  const addSkill = (s: string) => {
    const t = s.trim()
    if (!t || skills.includes(t)) return
    form.setValue("skills", [...skills, t], { shouldValidate: true })
    setSkillDraft("")
    setSkillOpen(false)
  }

  const insertDesc = (wrap: string) => {
    const cur = form.getValues("description")
    form.setValue("description", cur + (cur.endsWith("\n") ? "" : "\n") + wrap, { shouldValidate: true })
  }

  return (
    <TooltipProvider>
      <motion.div className="min-h-screen bg-[var(--bg-alt)] pb-12" initial="hidden" animate="show" variants={fadeUpContainer}>
        {/* Top bar */}
        <motion.div
          variants={fadeUpItem}
          className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-alt)]/95 px-4 py-4 backdrop-blur-md lg:px-8"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-[var(--text-primary)]">
                Welcome back, Alex 👋
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                <Input
                  placeholder="Search gigs, contracts..."
                  className="h-11 rounded-full border-transparent bg-white pl-10 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>
              <Button size="icon" variant="outline" className="relative h-11 w-11 rounded-full border-[var(--border)] bg-white" asChild>
                <Link href="/business/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white py-1 pl-1 pr-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-[var(--primary)] text-sm font-bold text-white">AJ</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href="/business/profile">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/browse">
                      <Sparkles className="mr-2 h-4 w-4" /> Switch to Freelancer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/business/billing">
                      <CreditCard className="mr-2 h-4 w-4" /> Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto max-w-[1400px] space-y-8 px-4 pt-8 lg:px-8">
          {/* Quick actions */}
          <motion.div variants={fadeUpItem} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between lg:gap-4">
            <Button
              asChild
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] px-6 text-base font-semibold text-white shadow-md btn-premium sm:min-w-[180px] sm:flex-1"
            >
              <Link href="/business/post-gig" className="inline-flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" /> Post New Gig
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 flex-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] font-semibold text-white btn-premium"
            >
              <Link href="/business/applications" className="inline-flex items-center justify-center gap-2">
                <Users className="h-4 w-4" /> View Applications
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-11 flex-1 rounded-xl border-2 border-[var(--primary)] bg-transparent font-semibold text-[var(--primary-dark)] hover:bg-[var(--primary-light)] btn-premium"
            >
              <Link href="/business/contracts" className="inline-flex items-center justify-center gap-2">
                <FolderOpen className="h-4 w-4" /> Manage Contracts
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="h-11 flex-1 rounded-xl font-semibold text-[var(--primary-dark)] hover:bg-[var(--primary-light)] btn-premium"
            >
              <Link href="/business/billing" className="inline-flex items-center justify-center gap-2">
                <CreditCard className="h-4 w-4" /> View Payments
              </Link>
            </Button>
          </motion.div>

          {/* KPI */}
          <motion.div variants={fadeUpContainer} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiStatCard
              label="Total Gigs Posted"
              value={24}
              icon={FileText}
              iconBg="bg-[var(--primary-light)] text-[var(--primary-dark)]"
              numberClass="text-[var(--primary-dark)]"
              subtext="+3 this week"
              subIcon={TrendingUp}
              subClass="text-emerald-600"
            />
            <KpiStatCard
              label="Total Applications"
              value={87}
              icon={Users}
              iconBg="bg-amber-100 text-amber-700"
              numberClass="text-amber-700"
              subtext="+12 today"
              subIcon={TrendingUp}
              subClass="text-emerald-600"
            />
            <KpiStatCard
              label="Active Contracts"
              value={6}
              icon={Briefcase}
              iconBg="bg-blue-50 text-blue-600"
              numberClass="text-[#3b82f6]"
              subtext="2 ending soon"
              subIcon={Clock}
              subClass="text-[var(--cta-amber-dark)]"
            />
            <KpiStatCard
              label="Total Spent"
              value={12840}
              prefix="$"
              icon={IndianRupee}
              iconBg="bg-emerald-50 text-emerald-600"
              numberClass="text-emerald-600"
              subtext="₹840 this month"
              subIcon={TrendingUp}
              subClass="text-emerald-600"
            />
          </motion.div>

          {/* Hero post gig form */}
          <motion.div
            variants={fadeUpItem}
            className="field-focus-ring rounded-2xl border-2 border-[var(--primary)] bg-white p-6 shadow-[0_8px_40px_var(--shadow-teal)] lg:p-8"
            id="post-gig-inline"
          >
            <div className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
                  <span>📋</span> Post a New Gig
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Fill in the details below</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" className="text-[var(--primary-dark)]" asChild>
                  <Link href="/business/post-gig">Advanced Options ⚙</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  type="button"
                  onClick={() => toast.message("Draft saved locally", { description: "Connect an API to persist drafts." })}
                >
                  Save Draft
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onPublish, onInvalid)} className="space-y-8">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* LEFT */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-[var(--text-primary)]">
                            What work do you need done?
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Build a React Dashboard for SaaS app"
                              className="h-12 rounded-xl text-base shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                              {...field}
                            />
                          </FormControl>
                          <div className="flex justify-end">
                            <span
                              className={cn(
                                "text-xs font-mono",
                                titleLen >= 10 ? "text-[var(--primary-dark)]" : "text-[var(--text-secondary)]"
                              )}
                            >
                              {titleLen}/100
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl text-base">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.emoji} {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="skills"
                      render={() => (
                        <FormItem>
                          <FormLabel className="font-bold">Required Skills</FormLabel>
                          <div className="relative">
                            <Input
                              placeholder="e.g. React, Figma, Node.js..."
                              value={skillDraft}
                              onChange={(e) => {
                                setSkillDraft(e.target.value)
                                setSkillOpen(true)
                              }}
                              onFocus={() => setSkillOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addSkill(skillDraft)
                                }
                              }}
                              className="h-11 rounded-xl"
                            />
                            {skillOpen && skillSuggestions.length > 0 && (
                              <div className="absolute z-10 mt-1 w-full rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg">
                                {skillSuggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-[var(--primary-light)]"
                                    onClick={() => addSkill(s)}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {skills.map((s) => (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-semibold text-[var(--primary-dark)]"
                              >
                                {s}
                                <button
                                  type="button"
                                  className="rounded-full p-0.5 hover:bg-white/60"
                                  onClick={() =>
                                    form.setValue(
                                      "skills",
                                      skills.filter((x) => x !== s),
                                      { shouldValidate: true }
                                    )
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Describe the work in detail</FormLabel>
                          <div className="overflow-hidden rounded-xl border border-[var(--border)] shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[var(--primary)]">
                            <div className="flex gap-1 border-b border-[var(--border)] bg-[var(--bg-alt)] px-2 py-1.5">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertDesc("**Bold** ")}>
                                <Bold className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertDesc("_italic_ ")}>
                                <Italic className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertDesc("• ")}>
                                <List className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertDesc("1. ")}>
                                <ListOrdered className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormControl>
                              <Textarea
                                placeholder="Include scope, deliverables, tech stack requirements..."
                                className="min-h-[140px] resize-y rounded-none border-0 focus-visible:ring-0"
                                {...field}
                              />
                            </FormControl>
                            <div className="flex justify-end border-t border-[var(--border)] px-3 py-1">
                              <span className="text-xs font-mono text-[var(--text-secondary)]">{descLen}/2000</span>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="budgetType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Budget Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid gap-3 sm:grid-cols-2"
                            >
                              <label
                                className={cn(
                                  "relative cursor-pointer rounded-2xl border-2 p-4 transition-all card-hover-lift",
                                  field.value === "fixed"
                                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                                    : "border-[var(--border)] bg-white"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="fixed" id="fixed" className="sr-only" />
                                  <span className="text-2xl">💰</span>
                                  <div>
                                    <p className="font-semibold">Fixed Price</p>
                                    <p className="text-xs text-[var(--text-secondary)]">One-time payment</p>
                                  </div>
                                </div>
                                {field.value === "fixed" && (
                                  <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-[var(--primary-dark)]" />
                                )}
                              </label>
                              <label
                                className={cn(
                                  "relative cursor-pointer rounded-2xl border-2 p-4 transition-all card-hover-lift",
                                  field.value === "hourly"
                                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                                    : "border-[var(--border)] bg-white"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="hourly" id="hourly" className="sr-only" />
                                  <span className="text-2xl">⏱</span>
                                  <div>
                                    <p className="font-semibold">Hourly Rate</p>
                                    <p className="text-xs text-[var(--text-secondary)]">Pay per hour</p>
                                  </div>
                                </div>
                                {field.value === "hourly" && (
                                  <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-[var(--primary-dark)]" />
                                )}
                              </label>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {budgetType === "fixed" ? (
                      <FormField
                        control={form.control}
                        name="fixedAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Budget Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[var(--text-secondary)]">$</span>
                                <Input
                                  type="number"
                                  className="h-12 rounded-xl pl-8 font-mono"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e)
                                    setPresetFocus("custom")
                                  }}
                                />
                              </div>
                            </FormControl>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {BUDGET_PRESETS.map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    form.setValue("fixedAmount", p, { shouldValidate: true })
                                    setPresetFocus(p)
                                  }}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-sm font-semibold transition-all",
                                    presetFocus === p
                                      ? "bg-[var(--primary)] text-white shadow-md"
                                      : "bg-[var(--bg-alt)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)]"
                                  )}
                                >
                                  ${p >= 1000 ? `${p / 1000}k` : p}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setPresetFocus("custom")}
                                className={cn(
                                  "rounded-full px-3 py-1.5 text-sm font-semibold",
                                  presetFocus === "custom"
                                    ? "bg-[var(--primary)] text-white"
                                    : "bg-[var(--bg-alt)] text-[var(--text-secondary)]"
                                )}
                              >
                                Custom
                              </button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-alt)]/50 p-4">
                        <Label className="font-bold">Hourly range ($/hr)</Label>
                        <Slider
                          value={[hourlyMin ?? 15, hourlyMax ?? 150]}
                          min={15}
                          max={250}
                          step={5}
                          onValueChange={(v) => {
                            form.setValue("hourlyMin", v[0], { shouldValidate: true })
                            form.setValue("hourlyMax", v[1], { shouldValidate: true })
                          }}
                          className="py-3"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="hourlyMin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">$/hr From</FormLabel>
                                <FormControl>
                                  <Input type="number" className="font-mono" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="hourlyMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">$/hr To</FormLabel>
                                <FormControl>
                                  <Input type="number" className="font-mono" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Project Timeline</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Timeline" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMELINE_OPTIONS.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Stop accepting applications after:</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className="h-12 w-full justify-start rounded-xl font-normal">
                                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hireCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Number of freelancers to hire</FormLabel>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 w-11 rounded-xl border-[var(--primary)] text-[var(--primary-dark)]"
                              onClick={() => form.setValue("hireCount", Math.max(1, hireCount - 1), { shouldValidate: true })}
                            >
                              −
                            </Button>
                            <Input
                              type="number"
                              className="h-11 w-16 rounded-xl text-center font-mono font-bold"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 w-11 rounded-xl border-[var(--primary)] text-[var(--primary-dark)]"
                              onClick={() => form.setValue("hireCount", hireCount + 1, { shouldValidate: true })}
                            >
                              +
                            </Button>
                          </div>
                          {hireCount > 1 && (
                            <p className="text-xs font-medium text-[var(--cta-amber-dark)]">Hiring multiple? Get volume discount 🎉</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Priority Level</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-3">
                              {[
                                { id: "normal", title: "🟢 Normal", desc: "Standard queue" },
                                { id: "high", title: "🟡 High Priority", desc: "Featured" },
                                { id: "urgent", title: "🔴 Urgent", desc: "+₹50 urgent fee", warn: true },
                              ].map((o) => (
                                <label
                                  key={o.id}
                                  className={cn(
                                    "cursor-pointer rounded-xl border-2 p-3 text-center transition-all",
                                    field.value === o.id && o.warn && "border-red-400 bg-red-50",
                                    field.value === o.id && !o.warn && "border-[var(--primary)] bg-[var(--primary-light)]",
                                    field.value !== o.id && "border-[var(--border)] hover:border-[var(--primary)]/40"
                                  )}
                                >
                                  <RadioGroupItem value={o.id} id={o.id} className="sr-only" />
                                  <p className="text-sm font-bold">{o.title}</p>
                                  <p className="text-[11px] text-[var(--text-secondary)]">{o.desc}</p>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <Label className="font-bold">Attachments</Label>
                      <label
                        className="mt-2 flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--primary)] transition-colors hover:border-[var(--primary-dark)] hover:bg-[var(--primary-light)]"
                      >
                        <Upload className="h-8 w-8 text-[var(--primary)]" />
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">Drop files or click to upload</p>
                        <p className="text-xs text-[var(--text-secondary)]">PDF, DOC, ZIP, PNG, JPG · Max 25MB</p>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? [])
                            setAttachments((a) => [
                              ...a,
                              ...files.map((f) => ({
                                name: f.name,
                                size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
                                progress: 100,
                              })),
                            ])
                          }}
                        />
                      </label>
                      <ul className="mt-2 space-y-2">
                        {attachments.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm">
                            <span className="flex-1 truncate font-medium">{f.name}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{f.size}</span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-alt)]">
                              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${f.progress}%` }} />
                            </div>
                            <button type="button" onClick={() => setAttachments((a) => a.filter((_, j) => j !== i))}>
                              <X className="h-4 w-4 text-[var(--text-secondary)]" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" className="font-semibold text-[var(--primary-dark)]" onClick={() => setPreviewOpen(true)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Gig
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="font-semibold"
                      onClick={() => toast.message("Draft saved", { description: "Stored in this session." })}
                    >
                      💾 Save as Draft
                    </Button>
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    <Button
                      type="submit"
                      disabled={invalidBlockPublish}
                      className={cn(
                        "h-[52px] w-[200px] rounded-xl bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] text-base font-bold text-white shadow-lg transition-all btn-premium",
                        !invalidBlockPublish && "animate-publish-cta-idle",
                        invalidBlockPublish && "opacity-50 grayscale"
                      )}
                    >
                      <Rocket className="mr-2 h-5 w-5" />
                      Publish Gig →
                    </Button>
                    <p className="text-center text-xs text-[var(--text-secondary)] lg:text-right">
                      🛡 Your gig will be reviewed within 2 hours
                    </p>
                  </div>
                </div>
              </form>
            </Form>
          </motion.div>

          <div className="grid gap-8 xl:grid-cols-3">
            {/* Table + applications + analytics */}
            <div className="space-y-8 xl:col-span-2">
              {/* My Gigs */}
              <motion.div variants={fadeUpItem} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">My Gigs</h3>
                  <Tabs value={gigTab} onValueChange={(v) => setGigTab(v as typeof gigTab)}>
                    <TabsList className="h-9 flex-wrap bg-[var(--bg-alt)]">
                      {(["all", "active", "draft", "closed", "urgent"] as const).map((t) => (
                        <TabsTrigger key={t} value={t} className="text-xs capitalize">
                          {t}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <AnimatePresence>
                  {selected.size > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--primary-light)]/40 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selected.size} gigs selected</span>
                      <Button size="sm" variant="outline">
                        Close All
                      </Button>
                      <Button size="sm" variant="destructive" className="bg-red-500 hover:bg-red-600">
                        Delete
                      </Button>
                      <Button size="sm" variant="secondary">
                        Export
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="overflow-x-auto">
                  {tableLoading ? (
                    <div className="space-y-2 p-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-12 w-full animate-shimmer rounded-lg" />
                      ))}
                    </div>
                  ) : filteredGigs.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                      <div className="text-5xl text-[var(--primary)]">📋</div>
                      <p className="mt-4 font-semibold text-[var(--text-primary)]">No gigs yet</p>
                      <Button asChild className="mt-4 rounded-xl bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] font-semibold text-white">
                        <Link href="/business/post-gig">Post Your First Gig →</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selected.size === filteredGigs.length}
                              onCheckedChange={toggleAll}
                              aria-label="Select all"
                            />
                          </TableHead>
                          <TableHead>Gig Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Applications</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGigs.map((row, idx) => (
                          <motion.tr
                            key={row.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-[var(--border)] transition-colors hover:bg-[var(--primary-light)]"
                          >
                            <TableCell>
                              <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{row.title}</span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-sm">
                                  {row.title}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="text-[13px] text-[var(--text-secondary)]">
                              {row.categoryEmoji} {row.categoryLabel}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono font-bold text-[var(--primary-dark)]">{row.budget}</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "font-mono",
                                  row.applications > 10 ? "bg-amber-100 text-amber-900 hover:bg-amber-100" : ""
                                )}
                              >
                                {row.applications}
                              </Badge>
                            </TableCell>
                            <TableCell>{statusPill(row.status)}</TableCell>
                            <TableCell
                              className={cn(
                                "text-sm",
                                row.daysLeft != null && row.daysLeft < 3 && "font-semibold text-red-600",
                                row.daysLeft != null && row.daysLeft >= 3 && row.daysLeft < 7 && "font-semibold text-amber-600"
                              )}
                            >
                              {row.deadline}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                      <Link href={`/gig/${row.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                      <Link href="/business/applications">
                                        <Users className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Applications</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Duplicate</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </motion.div>

              {/* Applications */}
              <motion.div variants={fadeUpItem}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Applications</h3>
                  <Link href="/business/applications" className="text-sm font-semibold text-[var(--primary-dark)] hover:underline">
                    View All →
                  </Link>
                </div>
                <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-4">
                  {MOCK_APPLICATIONS.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="w-[300px] shrink-0 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm card-hover-lift"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-[var(--primary)] font-bold text-white">{a.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[var(--text-primary)]">{a.freelancerName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-amber-600">⭐ {a.rating}</span>
                            {a.topRated && (
                              <Badge className="bg-[var(--primary-light)] text-[10px] text-[var(--primary-dark)] hover:bg-[var(--primary-light)]">
                                Top Rated
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-[13px] italic text-[var(--text-secondary)]">&ldquo;{a.tagline}&rdquo;</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {a.skills.map((s) => (
                          <span key={s} className="rounded-md bg-[var(--primary-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-dark)]">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 font-mono text-xl font-bold text-[var(--primary-dark)]">
                        ${a.bid.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--text-secondary)]">
                          {a.bidType === "Hourly" ? "/hr" : " Fixed"}
                        </span>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Clock className="h-3.5 w-3.5" /> {a.deliveryDays} days
                      </p>
                      <Badge variant="outline" className="mt-2 max-w-full truncate border-[var(--cta-amber)] text-amber-800">
                        {a.gigTitle}
                      </Badge>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-lg text-xs">
                          View Profile
                        </Button>
                        <Button size="sm" className="flex-1 rounded-lg bg-[var(--primary)] text-xs text-white">
                          Shortlist ★
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:bg-red-50">
                          Reject ✕
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Analytics mini */}
              <motion.div variants={fadeUpItem} className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm card-hover-lift">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Gig Views This Week</p>
                  <div className="my-3 h-12 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SPARKLINE_VIEWS} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="font-mono text-xl font-bold text-[var(--text-primary)]">1,284 views</p>
                  <p className="mt-1 text-xs font-medium text-emerald-600">+18% vs last week</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm card-hover-lift">
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">Application Rate</p>
                  <div className="relative mx-auto h-36 w-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={RADIAL_APPLICATION_RATE}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "var(--bg-alt)" }} isAnimationActive animationDuration={1000} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-bold text-[var(--primary-dark)]">34%</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-[var(--text-secondary)]">Of viewers apply</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm card-hover-lift">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Avg Response Time</p>
                    <Zap className="h-6 w-6 text-[var(--cta-amber)]" />
                  </div>
                  <p className="mt-4 font-mono text-4xl font-bold text-[var(--primary-dark)]">2.4hrs</p>
                  <p className="mt-2 text-sm text-emerald-600">You respond faster than 89% of businesses</p>
                </div>
              </motion.div>
            </div>

            {/* Activity */}
            <motion.aside variants={fadeUpItem} className="xl:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h3>
                <div className="relative mt-6 space-y-0 pl-2">
                  <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-[var(--primary)]/25" />
                  {MOCK_ACTIVITIES.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="relative flex gap-3 pb-6 pl-5"
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ring-white",
                          item.dot === "green" && "bg-emerald-500",
                          item.dot === "blue" && "bg-blue-500",
                          item.dot === "amber" && "bg-amber-500",
                          item.dot === "red" && "bg-red-500"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{item.message}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">{item.time}</span>
                          {item.action && (
                            <Link href={item.action.href} className="text-xs font-bold text-[var(--cta-amber-dark)] hover:underline">
                              {item.action.label}
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>

        {/* Preview dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-[480px] gap-0 overflow-hidden p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Gig preview</DialogTitle>
              <DialogDescription>How your gig appears to freelancers</DialogDescription>
            </DialogHeader>
            <div className="h-28 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]" />
            <div className="space-y-3 p-6">
              <Badge className="bg-white/20">{form.watch("category") || "Category"}</Badge>
              <h4 className="text-xl font-bold text-[var(--text-primary)]">{form.watch("title") || "Gig title"}</h4>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--bg-alt)] px-2 py-1 text-xs font-mono">
                  {budgetType === "fixed" ? `$${form.watch("fixedAmount") ?? 0}` : `$${hourlyMin}-${hourlyMax}/hr`}
                </span>
                <span className="rounded-full bg-[var(--bg-alt)] px-2 py-1 text-xs">Timeline set</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <span key={s} className="rounded-md bg-[var(--primary-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-dark)]">
                    {s}
                  </span>
                ))}
              </div>
              <Button className="w-full rounded-xl bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] font-semibold text-white">
                Apply Now
              </Button>
              <DialogFooter className="sm:justify-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-[var(--primary-dark)]"
                  onClick={() => {
                    setPreviewOpen(false)
                    form.handleSubmit(onPublish, onInvalid)()
                  }}
                >
                  Looks good? Publish it →
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, useReducedMotion } from "framer-motion"
import { Search, Briefcase, Users, TrendingUp, Star, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&h=900&fit=crop&q=80"

const FEATURE_STRIP = [
  {
    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=480&h=300&fit=crop&q=80",
    label: "Development",
  },
  {
    src: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=480&h=300&fit=crop&q=80",
    label: "Design",
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=480&h=300&fit=crop&q=80",
    label: "Teams",
  },
  {
    src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=480&h=300&fit=crop&q=80",
    label: "Strategy",
  },
] as const

const trendingTags = [
  "React Development",
  "Brand Identity",
  "API Integration",
  "Content Strategy",
]

const opportunities = [
  { title: "Marketing", price: "₹1,200" },
  { title: "Sales", price: "₹650" },
  { title: "Business Development", price: "₹400" },
]

function floatProps(delay = 0) {
  return {
    animate: { y: [0, -10, 0] },
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay,
    },
  }
}

export function HeroSection() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const authenticated = status === "authenticated"
  const [q, setQ] = useState("")
  const [mode, setMode] = useState<"talent" | "jobs">("talent")
  const reduceMotion = useReducedMotion()

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    const base = mode === "jobs" ? "/browse" : "/browse"
    if (query) router.push(`${base}?q=${encodeURIComponent(query)}`)
    else router.push(base)
  }

  const motionProps = reduceMotion
    ? {}
    : {
      animate: { y: [0, -10, 0] },
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
    }

  return (
    <section className="relative overflow-hidden bg-[var(--dark-surface)] pb-2 pt-[72px] lg:pb-4">
      <div className="container-page section-y !pt-8">
        {/* Promo strip — enterprise polish */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary-light)] px-4 py-3 text-sm text-[var(--text-primary)] md:px-5"
        >
          <p className="font-medium">
            <span className="text-[var(--primary-dark)]">Business Plus</span>
            <span className="mx-2 text-[var(--text-secondary)]">—</span>
            Hire verified talent with contracts, milestones, and escrow-ready workflows.
          </p>
          <Link
            href={authenticated ? (session?.user?.role === "business" ? "/business" : "/freelancer/dashboard") : "/auth/signin"}
            className="btn-amber-cta inline-flex shrink-0 items-center text-sm !py-2 !px-4"
          >
            {authenticated ? "Go to Dashboard" : "Get started"}
          </Link>
        </motion.div>

        {/* Hero — graded photography + glass search */}
        <div className="relative min-h-[min(56svh,480px)] overflow-hidden rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:min-h-[min(72svh,640px)]">
          <Image
            src={HERO_IMAGE}
            alt="Professional at work — collaborative freelance marketplace"
            fill
            priority
            className="object-cover object-[center_22%]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Cinematic color grade: teal → navy depth */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/92 via-[#2d7a7e]/45 to-[#0f3460]/70"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/88 via-transparent to-[#6d9c9f]/25 mix-blend-multiply"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_70%_20%,rgba(109,156,159,0.35),transparent_55%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 noise-overlay opacity-[0.04]" aria-hidden />

          <div className="relative z-10 flex min-h-[min(56svh,480px)] flex-col gap-8 p-6 md:p-10 lg:min-h-[min(72svh,640px)] lg:flex-row lg:items-stretch lg:justify-between lg:gap-10 lg:p-12">
            {/* Copy */}
            <div className="flex max-w-2xl flex-col justify-center space-y-6">
              <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 backdrop-blur-md">
                Trusted by teams in 8 states
              </div>
              <h1 className="font-display text-4xl leading-[1.08] text-white md:text-6xl lg:text-[4rem] tracking-tight">
                Connecting businesses to{" "}
                <span className="bg-gradient-to-r from-[#a8e0e3] via-white to-[#c8f0f0] bg-clip-text text-transparent italic font-light">
                  talent that delivers
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-white/80 md:text-xl font-medium">
                Post structured gigs, review vetted applicants, and run contracts with clarity —
                all on Contractual&apos;s premium marketplace experience.
              </p>
            </div>

            {/* Floating stats — desktop */}
            <div className="relative hidden w-full max-w-[340px] flex-shrink-0 lg:block">
              <motion.div
                className="absolute right-0 top-0 z-20 flex max-w-[220px] items-center gap-2 rounded-full border border-white/15 bg-white/95 px-3 py-2 shadow-xl"
                {...(reduceMotion ? {} : floatProps(0))}
              >
                <Users className="h-4 w-4 text-[var(--primary-dark)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  8000+ freelancers online
                </span>
              </motion.div>
              <motion.div
                className="absolute right-0 top-14 z-20 rounded-full bg-[var(--gradient-amber)] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/25"
                {...(reduceMotion ? {} : floatProps(0.4))}
              >
                +₹2,400 avg. contract
              </motion.div>
              <motion.div
                className="absolute bottom-24 left-0 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/95 px-4 py-3 shadow-xl"
                {...(reduceMotion ? {} : floatProps(0.8))}
              >
                <TrendingUp className="h-5 w-5 text-[var(--success)]" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    GMV this month
                  </p>
                  <p className="font-stat text-base font-bold text-[var(--text-primary)]">₹1.2M</p>
                </div>
              </motion.div>
              <motion.div
                className="absolute bottom-8 right-0 z-20 rounded-2xl border border-white/15 bg-white/95 px-4 py-3 shadow-xl"
                {...(reduceMotion ? {} : floatProps(1.2))}
              >
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  4.9 avg. satisfaction
                </p>
              </motion.div>

              <motion.div
                className="absolute left-0 top-[28%] z-10 w-full max-w-[300px] rounded-3xl border border-white/20 bg-white/95 p-5 shadow-2xl"
                {...(reduceMotion ? {} : motionProps)}
              >
                <Link href="/" className="flex shrink-0 items-center gap-2.5 group mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--gradient-primary)] shadow-[0_0_24px_var(--shadow-teal)] transition-transform group-hover:scale-105 group-hover:rotate-3">
                    <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-josefin">Contractual</span>
                </Link>
                <ul className="space-y-2.5">
                  {opportunities.map((row) => (
                    <li
                      key={row.title}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2.5"
                    >
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{row.title}</span>
                      <span className="font-stat text-xs font-bold text-[var(--primary-dark)]">
                        {row.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Glass search dock */}
          <div className="relative z-20 border-t border-white/10 bg-gradient-to-t from-[#1a1a2e]/90 to-[#1a1a2e]/40 p-4 backdrop-blur-xl md:p-6 lg:px-10 lg:pb-8">
            <div className="mx-auto max-w-[1100px]">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  I want to
                </span>
                <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("talent")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                      mode === "talent"
                        ? "bg-white text-[var(--text-primary)] shadow-md"
                        : "text-white/80 hover:text-white"
                    )}
                  >
                    Find talent
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("jobs")}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                      mode === "jobs"
                        ? "bg-white text-[var(--text-primary)] shadow-md"
                        : "text-white/80 hover:text-white"
                    )}
                  >
                    Browse jobs
                  </button>
                </div>
              </div>

              <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-2 shadow-inner">
                  <Search className="h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by role, skills, or keywords"
                    className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
                    aria-label="Search gigs and skills"
                  />
                </div>
                <button type="submit" className="btn-primary shrink-0 rounded-2xl !px-8 !py-3.5 text-base">
                  Search
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-5">
                <span className="text-xs font-medium uppercase tracking-wider text-white/45">
                  Trusted by teams at
                </span>
                <div className="flex flex-wrap items-center gap-6 opacity-90">
                  {["Microsoft", "Airbnb", "Glassdoor", "Bissell"].map((name) => (
                    <span
                      key={name}
                      className="font-stat text-sm font-semibold tracking-tight text-white/85"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-white/45">Trending:</span>
                {trendingTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/browse?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

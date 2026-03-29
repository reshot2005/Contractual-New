"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Grid3X3, List, ChevronDown, X } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FilterSidebar } from "@/components/gigs/filter-sidebar"
import { GigCard } from "@/components/gig-card"
import { cn } from "@/lib/utils"
import { getCategoryGigImage } from "@/lib/category-gig-image"

type ApiGig = {
  id: string
  title: string
  category: string
  budgetAmount: number
  minBudget: number | null
  maxBudget: number | null
  bannerImage?: string | null
  business: {
    name: string
    companyName: string | null
    image: string | null
  }
}

export default function BrowsePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("latest")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [gigs, setGigs] = useState<ApiGig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const sp = new URLSearchParams()
        sp.set("limit", "60")
        sp.set("sort", sortBy)
        for (const [k, v] of Object.entries(filters)) {
          if (v == null) continue
          const s = String(v)
          if (!s) continue
          sp.set(k, s)
        }
        const res = await fetch(`/api/gigs?${sp.toString()}`, { cache: "no-store" })
        const json = (await res.json()) as { data?: ApiGig[]; error?: string }
        if (!res.ok) throw new Error(json.error ?? "Failed to load gigs")
        if (!active) return
        setGigs(Array.isArray(json.data) ? json.data : [])
        setError(null)
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : "Failed to load gigs")
      } finally {
        if (active) setLoading(false)
      }
    }

    setLoading(true)
    void load()
    const interval = setInterval(() => {
      void load()
    }, 15000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [sortBy, filters])

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter))
    const key = filter.split(":")[0]?.trim()
    if (!key) return
    setFilters((prev) => {
      const next = { ...prev }
      delete (next as any)[key]
      return next
    })
  }

  return (
    <main className="min-h-screen bg-[var(--bg-alt)]">
      <Navbar />

      <div className="pt-24 lg:pt-28 pb-16">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
          <nav className="flex items-center gap-1 text-sm text-[var(--text-secondary)] mb-6">
            <Link href="/" className="hover:text-[var(--primary)]">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--text-primary)]">Browse Gigs</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6 xl:gap-8">
            <div className="hidden lg:block">
              <FilterSidebar
                onFilterChange={(f) => {
                  setFilters(f)
                  setActiveFilters(
                    Object.entries(f)
                      .filter(([, v]) => v != null && String(v))
                      .map(([k, v]) => `${k}: ${String(v)}`)
                  )
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </button>

            {showMobileFilters && (
              <div className="lg:hidden fixed inset-0 z-50">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/50 w-full h-full border-0 cursor-default"
                  aria-label="Close filters"
                  onClick={() => setShowMobileFilters(false)}
                />
                <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white overflow-y-auto shadow-xl">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Filters</h2>
                    <button type="button" onClick={() => setShowMobileFilters(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                <div className="p-4">
                    <FilterSidebar
                      onFilterChange={(f) => {
                        setFilters(f)
                        setActiveFilters(
                          Object.entries(f)
                            .filter(([, v]) => v != null && String(v))
                            .map(([k, v]) => `${k}: ${String(v)}`)
                        )
                        setShowMobileFilters(false)
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[var(--text-primary)]">
                    <span className="font-semibold font-mono">{gigs.length}</span> gigs found
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      >
                        <option value="latest">Latest</option>
                        <option value="latest">Newest</option>
                        <option value="budget_low">Price: Low to High</option>
                        <option value="budget_high">Price: High to Low</option>
                        <option value="deadline">Deadline</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-[var(--bg-alt)] rounded-lg">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={cn(
                          "p-2 rounded-md transition-colors",
                          viewMode === "grid"
                            ? "bg-white text-[var(--primary)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "p-2 rounded-md transition-colors",
                          viewMode === "list"
                            ? "bg-white text-[var(--primary)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                        aria-label="List view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {activeFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                    {activeFilters.map((filter) => (
                      <span
                        key={filter}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary-light)] text-[var(--primary-dark)] text-sm font-medium rounded-full"
                      >
                        {filter}
                        <button
                          type="button"
                          onClick={() => removeFilter(filter)}
                          className="hover:bg-[var(--primary)]/20 rounded-full p-0.5"
                          aria-label={`Remove ${filter}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilters([])
                        setFilters({})
                      }}
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "grid items-stretch gap-6",
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {loading && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`loading-${i}`} className="h-[392px] w-full rounded-[18px] border border-[var(--border)] bg-white animate-pulse" />
                    ))}
                  </>
                )}

                {!loading && !error && gigs.map((gig) => {
                  const cardImage = gig.bannerImage || getCategoryGigImage(gig.category)
                  return (
                    <GigCard
                      key={gig.id}
                      id={gig.id}
                      title={gig.title}
                      category={gig.category}
                      freelancer={{
                        name: gig.business.companyName || gig.business.name || "Business",
                        avatar: gig.business.image || "",
                        isPro: false,
                      }}
                      price={gig.budgetAmount}
                      minBudget={gig.minBudget ?? undefined}
                      maxBudget={gig.maxBudget ?? undefined}
                      image={cardImage}
                    />
                  )
                })}
              </div>

              {!loading && error && (
                <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!loading && !error && gigs.length === 0 && (
                <div className="mt-8 rounded-xl border border-[var(--border)] bg-white p-8 text-center text-[var(--text-secondary)]">
                  No live gigs available right now.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Menu, X, Zap, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

const navLinks = [
  { label: "Explore", href: "/auth/signin" },
  { label: "Opportunities / Jobs", href: "/auth/signin" },
  { label: "Community", href: "/community" },
  { label: "Hire Talent", href: "/auth/register" },
]

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

export function LandingNavbar() {
  const { data: session, status } = useSession()
  const authenticated = status === "authenticated"
  const [open, setOpen] = useState(false)

  return (
    <header
      data-mobile-nav="public"
      className={cn(
        "landing-navbar fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08]",
        "bg-[var(--dark-surface)]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--dark-surface)]/80"
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--gradient-primary)] shadow-[0_0_24px_var(--shadow-teal)] transition-transform hover:scale-[1.02]">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">Contractual</span>
        </Link>

        {/* Center nav — desktop */}
        <nav
          className="hidden items-center justify-center gap-8 lg:flex lg:flex-1"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="whitespace-nowrap text-[15px] font-medium text-white/65 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Pill search — reference alignment */}
          <div className="hidden md:flex items-center rounded-full border border-white/15 bg-white/90 px-3 py-2 shadow-inner">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
            <input
              type="search"
              placeholder="Search skill"
              className="ml-2 w-28 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none lg:w-32"
              aria-label="Search skills"
            />
          </div>





          {!authenticated ? (
            <>
              <Link
                href="/auth/signin"
                className="hidden text-[15px] font-semibold text-white/90 hover:text-white transition-colors sm:inline-flex mr-2"
              >
                Sign In
              </Link>

              <Link
                href="/auth/register"
                className="btn-amber-cta hidden !rounded-full !py-2.5 !px-5 sm:inline-flex"
              >
                Start Earning
              </Link>
            </>
          ) : (
            <Link
              href={session?.user?.role === "business" ? "/business" : "/freelancer/dashboard"}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold border border-white/20 hover:bg-white/20 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}

          <button
            type="button"
            className="mobile-nav-toggle rounded-lg p-2 text-white lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "mobile-nav-drawer border-t border-white/10 bg-[var(--dark-surface)] lg:hidden transition-all duration-300 overflow-hidden",
          open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-xl px-3 py-3 text-base font-medium text-white/80 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-6 px-3">
            {!authenticated ? (
              <>
                <Link 
                  href="/auth/signin" 
                  className="flex-1 py-3 text-center text-sm font-bold text-white border border-white/20 rounded-full hover:bg-white/5 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="btn-amber-cta flex-1 !block !rounded-full py-3 text-center text-sm font-bold"
                  onClick={() => setOpen(false)}
                >
                  Start Earning
                </Link>
              </>
            ) : (
              <Link
                href={session?.user?.role === "business" ? "/business" : "/freelancer/dashboard"}
                className="flex-1 py-3 text-center text-sm font-bold text-white bg-[var(--primary)] rounded-full"
                onClick={() => setOpen(false)}
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

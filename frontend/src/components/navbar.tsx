"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/92 backdrop-blur-xl border-b border-[var(--border)] shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
        <nav className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 lg:h-[72px] lg:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 justify-self-start">
            <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <span
              className={cn(
                "font-display truncate text-lg font-bold transition-colors duration-300 sm:text-xl",
                scrolled ? "text-[var(--text-primary)]" : "text-white"
              )}
            >
              Contractual
            </span>
          </Link>

          <div className="hidden min-w-0 justify-self-stretch px-2 lg:block xl:px-8">
            <div className={cn(
              "mx-auto flex w-full max-w-xl rounded-full border overflow-hidden transition-all duration-300",
              scrolled
                ? "bg-white border-[var(--border)]"
                : "bg-white/10 border-white/20 backdrop-blur-sm"
            )}>
              <input
                type="text"
                placeholder="Search for design, development, writing..."
                className={cn(
                  "min-w-0 flex-1 px-4 py-2.5 text-sm bg-transparent outline-none",
                  scrolled
                    ? "text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                    : "text-white placeholder:text-white/60"
                )}
              />
              <button
                type="button"
                className="shrink-0 px-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/business/post-gig"
              className={cn(
                "hidden whitespace-nowrap text-sm font-medium transition-opacity hover:opacity-80 md:block",
                scrolled ? "text-[var(--primary)]" : "text-white"
              )}
            >
              Post a Gig
            </Link>

            <Link href="/auth/signin" className={cn(
              "text-sm font-semibold transition-opacity hover:opacity-80",
              scrolled ? "text-[var(--text-primary)]" : "text-white"
            )}>
              Sign In
            </Link>

            <Link href="/auth/register">
              <button
                type="button"
                className="hidden sm:inline-flex px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 sm:px-5"
              >
                Join Free
              </button>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors -mr-1",
                scrolled ? "text-[var(--text-primary)]" : "text-white"
              )}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

      <div
        className={cn(
          "lg:hidden fixed inset-x-0 top-16 bg-white border-b border-[var(--border)] shadow-lg transition-all duration-300",
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <div className="p-4 space-y-4">
          <div className="flex rounded-xl border border-[var(--border)] overflow-hidden">
            <input
              type="text"
              placeholder="Search gigs..."
              className="flex-1 px-4 py-3 text-sm bg-transparent outline-none"
            />
            <button className="px-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
              <Search className="w-4 h-4" />
            </button>
          </div>

            <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
              <Link href="/auth/signin" className="flex-1 text-center text-sm font-bold text-[var(--text-primary)] py-3 border border-[var(--border)] rounded-lg">
                Sign In
              </Link>
              <Link href="/auth/register" className="flex-1">
                <button className="w-full px-5 py-3 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)]">
                  Join Free
                </button>
              </Link>
            </div>
        </div>
      </div>
    </header>
  )
}

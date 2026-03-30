"use client"
import Link from "next/link"
import { Building2, Briefcase } from "lucide-react"
import { useSession } from "next-auth/react"

export function DualCtaSection() {
  const { status } = useSession()
  const authenticated = status === "authenticated"
  return (
    <section className="w-full">
      <div className="grid md:grid-cols-2">
        {/* Business CTA */}
        <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] p-12 lg:p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {"I'm a Business"}
          </h3>
          <p className="text-white/80 max-w-[360px] mb-8">
            Post gigs, find skilled freelancers, manage contracts end-to-end.
          </p>
           <Link
            href={authenticated ? "/business" : "/auth/signin?next=/business"}
            className="px-8 py-3.5 rounded-lg text-base font-semibold bg-white text-[var(--primary-dark)] hover:bg-white/90 hover:scale-[1.02] transition-all duration-300"
          >
            Post Your First Gig &rarr;
          </Link>
        </div>

        {/* Freelancer CTA */}
        <div className="bg-[var(--dark-surface)] p-12 lg:p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <Briefcase className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {"I'm a Freelancer"}
          </h3>
          <p className="text-white/70 max-w-[360px] mb-8">
            Browse opportunities, submit proposals, build your reputation.
          </p>
          <Link
            href={authenticated ? "/browse" : "/auth/signin?next=/browse"}
            className="px-8 py-3.5 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
          >
            Browse Gigs &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}

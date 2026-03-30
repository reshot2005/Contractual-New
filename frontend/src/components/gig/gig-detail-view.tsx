"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  ChevronRight,
  MapPin,
  Clock,
  Eye,
  BadgeCheck,
  Star,
  Heart,
  Share2,
  MessageSquare,
  Shield,
  Zap,
  Check,
  X,
  ChevronDown,
  ThumbsUp,
  Play,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import type { MockGigDetail } from "@/lib/mock-data"

export function GigDetailView({ gig }: { gig: MockGigDetail & { id?: string } }) {
  const router = useRouter()
  const [activePackage, setActivePackage] = useState(0)
  const [showAllDescription, setShowAllDescription] = useState(false)
  const [showComparePackages, setShowComparePackages] = useState(false)
  const [activeThumb, setActiveThumb] = useState(0)
  const [liked, setLiked] = useState(false)

  const packages = gig.packages ?? []
  const selectedPackage = packages[activePackage] ?? packages[0]
  const gallery = gig.gallery ?? []
  const mainSrc = gallery[activeThumb] ?? gallery[0] ?? "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200"
  const isVideoThumb = activeThumb === Math.min(3, gallery.length - 1) && gallery.length > 0

  return (
    <main className="min-h-screen bg-[var(--bg-alt)]">
      <Navbar />

      <div className="pt-24 lg:pt-28 pb-16">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-[var(--text-secondary)] mb-6"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[var(--primary)]">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            <Link href="/browse" className="hover:text-[var(--primary)]">
              Browse
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            <Link
              href={`/browse?category=${encodeURIComponent(gig.categorySlug)}`}
              className="hover:text-[var(--primary)]"
            >
              {gig.category}
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            <span className="text-[var(--text-primary)] line-clamp-1">{gig.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 lg:max-w-[65%]">
              <h1 className="font-display text-2xl md:text-[32px] font-bold text-[var(--text-primary)] leading-tight mb-4">
                {gig.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-6">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {gig.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Posted {gig.postedAgo}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> {gig.views} views
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[var(--border)] mb-6">
                <Link
                  href={`/freelancer/${gig.freelancerId}`}
                  className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-[var(--primary-light)] shrink-0"
                >
                  {gig.freelancer.avatar ? (
                    <Image
                      src={gig.freelancer.avatar}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white font-semibold">
                      {gig.freelancer.name?.charAt(0) || "F"}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link
                      href={`/freelancer/${gig.freelancerId}`}
                      className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
                    >
                      {gig.freelancer.name}
                    </Link>
                    {gig.freelancerMeta.verified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <BadgeCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {gig.rating.toFixed(1)}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        ({gig.reviewCount} reviews)
                      </span>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Member since {gig.freelancerMeta.memberSince}
                    </span>
                  </div>
                </div>
                {gig.freelancerMeta.responseBadge && (
                  <span className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full whitespace-nowrap">
                    {gig.freelancerMeta.responseBadge}
                  </span>
                )}
              </div>

              <div className="mb-8">
                <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden mb-3 bg-[var(--dark-surface)]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mainSrc}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={mainSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 65vw"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                  {isVideoThumb && (
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                      aria-label="Play preview"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-8 h-8 text-[var(--primary)] ml-1" />
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
                  {gallery.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveThumb(idx)}
                      className={cn(
                        "relative shrink-0 w-20 h-[60px] rounded-lg overflow-hidden transition-all",
                        activeThumb === idx
                          ? "ring-2 ring-[var(--primary)] ring-offset-2"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      {idx === Math.min(3, gallery.length - 1) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  About This Gig
                </h2>
                <div
                  className={cn(
                    "prose prose-sm max-w-none text-[var(--text-primary)]",
                    !showAllDescription && "max-h-[200px] overflow-hidden relative"
                  )}
                >
                  <p>{gig.descriptionLead}</p>
                  <p className="mt-4">
                    <strong>What you will receive:</strong>
                  </p>
                  <ul className="mt-2 space-y-2">
                    {(gig.descriptionBullets ?? []).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p className="mt-4">{gig.descriptionRest}</p>
                  {!showAllDescription && (
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllDescription(!showAllDescription)}
                  className="mt-4 text-[var(--primary)] font-medium hover:text-[var(--primary-dark)]"
                >
                  {showAllDescription ? "Show Less" : "Show More"}
                </button>

                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Skills Required
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(gig.skills ?? []).map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-[var(--primary-light)] text-[var(--primary-dark)] text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  What We Are Looking For
                </h2>
                <ol className="space-y-4">
                  {(gig.requirements ?? []).map((req, idx) => (
                    <li key={req} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-white text-sm font-semibold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-[var(--text-primary)] pt-0.5">{req}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    About the Business
                  </h2>
                  <Link
                    href="/browse"
                    className="text-[var(--primary)] text-sm font-medium hover:text-[var(--primary-dark)]"
                  >
                    View more gigs &rarr;
                  </Link>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold font-display">
                    {gig.business.avatarLetter}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {gig.business.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">{gig.business.tagline}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(gig.business?.stats ?? []).map((stat) => (
                    <div key={stat.label} className="text-center p-3 bg-[var(--bg-alt)] rounded-lg">
                      <p className="text-lg font-bold font-mono text-[var(--primary)]">{stat.value}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                  Reviews from Previous Contracts
                </h2>

                <div className="flex flex-col sm:flex-row items-stretch gap-6 mb-8 pb-6 border-b border-[var(--border)]">
                  <div className="text-center sm:text-left">
                    <p className="text-5xl font-bold font-mono text-[var(--primary)]">
                      {gig.rating.toFixed(1)}
                    </p>
                    <div className="flex items-center gap-0.5 mt-2 justify-center sm:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {gig.reviewCount} reviews
                    </p>
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    {(gig.ratingBreakdown ?? []).map((row) => (
                      <div key={row.stars} className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-secondary)] w-8 shrink-0 font-mono">
                          {row.stars}★
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-full transition-all duration-700"
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                        <span className="text-sm text-[var(--text-secondary)] w-10 text-right font-mono">
                          {row.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {(gig.reviews ?? []).map((review, idx) => (
                    <div
                      key={`${review.name}-${idx}`}
                      className="pb-6 border-b border-[var(--border)] last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{review.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-0.5 ml-auto">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-gray-200 text-gray-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[var(--text-primary)] text-sm leading-relaxed">{review.text}</p>
                      <button
                        type="button"
                        className="flex items-center gap-1 mt-3 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)]"
                      >
                        <ThumbsUp className="w-4 h-4" /> Helpful?
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-6 text-[var(--primary)] font-medium hover:text-[var(--primary-dark)]"
                >
                  Show All {gig.reviewCount} Reviews
                </button>
              </div>
            </div>

            <div className="lg:w-[35%]">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl border-[1.5px] border-[var(--border)] shadow-[0_8px_40px_var(--shadow-teal)] overflow-hidden">
                  <div className="flex bg-[var(--primary-light)]">
                    {packages.map((pkg, idx) => (
                      <button
                        key={pkg.name}
                        type="button"
                        onClick={() => setActivePackage(idx)}
                        className={cn(
                          "flex-1 py-3 text-sm font-semibold transition-colors",
                          activePackage === idx
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--primary-dark)] hover:bg-[var(--primary)]/10"
                        )}
                      >
                        {pkg.name}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">                     {selectedPackage && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedPackage.name}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-baseline justify-between mb-4">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                              {selectedPackage.name} Package
                            </span>
                            <span className="text-3xl font-bold font-mono text-[var(--primary)]">
                              ₹{selectedPackage.price}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-6 text-sm text-[var(--text-secondary)]">
                            <Clock className="w-4 h-4" />
                            <span>{selectedPackage.deliveryDays} Days Delivery</span>
                          </div>

                          <ul className="space-y-3 mb-6">
                            {(selectedPackage.features ?? []).map((feature) => (
                              <li
                                key={feature.name}
                                className={cn(
                                  "flex items-center gap-2 text-sm",
                                  feature.included
                                    ? "text-[var(--text-primary)]"
                                    : "text-[var(--text-secondary)] line-through"
                                )}
                              >
                                {feature.included ? (
                                  <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />
                                ) : (
                                  <X className="w-4 h-4 text-gray-300 shrink-0" />
                                )}
                                {feature.name}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      </AnimatePresence>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/gig/${gig.id || ""}`)}`)}
                      className="w-full py-4 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-[var(--cta-amber)] to-[var(--cta-amber-dark)] hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 mb-3 btn-premium"
                    >
                      Apply for This Gig &rarr;
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/gig/${gig.id || ""}`)}`)}
                      className="w-full py-3 rounded-lg text-base font-semibold text-[var(--primary)] border-2 border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Message Business
                    </button>

                    <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-[var(--border)]">
                      <div className="flex flex-col items-center text-center">
                        <Shield className="w-5 h-5 text-[var(--primary)] mb-1" />
                        <span className="text-xs text-[var(--text-secondary)]">Protected</span>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <Zap className="w-5 h-5 text-[var(--primary)] mb-1" />
                        <span className="text-xs text-[var(--text-secondary)]">Fast</span>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <MessageSquare className="w-5 h-5 text-[var(--primary)] mb-1" />
                        <span className="text-xs text-[var(--text-secondary)]">Support</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setShowComparePackages(!showComparePackages)}
                      className="w-full px-6 py-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2"
                    >
                      Compare All Packages
                      <ChevronDown
                        className={cn("w-4 h-4 transition-transform", showComparePackages && "rotate-180")}
                      />
                    </button>

                    {showComparePackages && (
                      <div className="px-6 pb-6 overflow-x-auto">
                        <table className="w-full text-sm min-w-[280px]">
                          <thead>
                            <tr className="border-b border-[var(--border)]">
                              <th className="text-left py-2 font-medium text-[var(--text-secondary)]">
                                Feature
                              </th>
                              {packages.map((pkg) => (
                                <th
                                  key={pkg.name}
                                  className="text-center py-2 font-semibold text-[var(--primary)] font-mono"
                                >
                                  ₹{pkg.price}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {packages[0].features.map((feature, idx) => (
                              <tr key={feature.name} className="border-b border-[var(--border)]/50">
                                <td className="py-2 text-[var(--text-primary)]">{feature.name}</td>
                                {packages.map((pkg) => (
                                  <td key={pkg.name} className="text-center py-2">
                                    {pkg.features[idx]?.included ? (
                                      <Check className="w-4 h-4 text-[var(--primary)] mx-auto" />
                                    ) : (
                                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setLiked(!liked)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all",
                      liked
                        ? "bg-red-50 border-red-200 text-red-600"
                        : "bg-white border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                    {liked ? "Saved" : "Save Gig"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

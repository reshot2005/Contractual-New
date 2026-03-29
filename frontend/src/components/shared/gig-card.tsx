"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GigBadge } from "@/lib/mock-data"

export interface SharedGigCardProps {
  id: string
  title: string
  category: string
  freelancer: {
    name: string
    avatar: string
    isPro?: boolean
  }
  rating?: number
  reviewCount?: number
  price: number
  minBudget?: number
  maxBudget?: number
  image?: string
  badge?: GigBadge
  gradient?: string
}

const gradients = [
  "from-[#6d9c9f] to-[#2d7a7e]",
  "from-[#7eb8a0] to-[#4a9a7c]",
  "from-[#9db5b0] to-[#6d9c9f]",
  "from-[#88a9ab] to-[#5a8a8d]",
  "from-[#a3c4b8] to-[#7ba896]",
]

function gradientFromId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return gradients[hash % gradients.length]
}

export function GigCard({
  id,
  title,
  category,
  freelancer,
  rating,
  reviewCount,
  price,
  minBudget,
  maxBudget,
  image,
  badge,
  gradient,
}: SharedGigCardProps) {
  const [liked, setLiked] = useState(false)
  const randomGradient = gradient || gradientFromId(id)

  return (
    <Link
      href={`/gig/${id}`}
      className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_18px_38px_rgba(45,122,126,0.14)]"
    >
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", randomGradient)}>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "20px 20px",
              }}
            />
          </div>
        )}

        <span className="absolute left-4 top-4 z-[1] rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {category}
        </span>

        {badge && (
          <span
            className={cn(
              "absolute right-14 top-4 z-[1] rounded-full px-2.5 py-1 text-xs font-medium",
              badge === "top-rated"
                ? "bg-amber-500 text-white"
                : "bg-[var(--primary-light)] text-[var(--primary-dark)]"
            )}
          >
            {badge === "top-rated" ? "Top Rated" : "Fast Delivery"}
          </span>
        )}

        <motion.button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setLiked(!liked)
          }}
          whileTap={{ scale: 0.88 }}
          className="absolute right-4 top-4 z-[1] flex h-11 w-11 items-center justify-center rounded-full bg-white/92 shadow-[0_6px_18px_rgba(15,23,42,0.14)] transition-colors hover:bg-white"
          aria-label={liked ? "Remove from saved" : "Save gig"}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              liked ? "fill-red-500 text-red-500" : "text-gray-600"
            )}
          />
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--primary-light)]">
            {freelancer.avatar ? (
              <Image
                src={freelancer.avatar}
                alt=""
                fill
                className="object-cover"
                sizes="36px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] text-xs font-semibold text-white">
                {freelancer.name.charAt(0)}
              </div>
            )}
          </div>
          <span className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">
            {freelancer.name}
          </span>
          {freelancer.isPro && (
            <span className="rounded bg-[var(--primary-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary-dark)]">
              PRO
            </span>
          )}
        </div>

        <h3 className="mb-4 min-h-[54px] text-[18px] font-semibold leading-[1.35] text-[var(--text-primary)] line-clamp-2">
          {title}
        </h3>

        {typeof rating === "number" && typeof reviewCount === "number" && reviewCount > 0 ? (
          <div className="mb-4 flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              ({reviewCount} reviews)
            </span>
          </div>
        ) : (
          <div className="mb-4">
            <span className="rounded-full bg-[var(--bg-alt)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              New gig
            </span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--border)] pt-4">
          <div className="min-w-0">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              {minBudget ? "Budget Range" : "Starting at"}
            </span>
            {minBudget && maxBudget && minBudget !== maxBudget ? (
              <p className="mt-1 whitespace-nowrap text-[19px] font-bold font-mono leading-none text-[var(--primary)]">
                Rs.{minBudget.toLocaleString("en-IN")} - Rs.{maxBudget.toLocaleString("en-IN")}
              </p>
            ) : (
              <p className="mt-1 whitespace-nowrap text-[19px] font-bold font-mono leading-none text-[var(--primary)]">
                Rs.{(minBudget || price || 500).toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  )
}

export function GigCardSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[18px] border border-[var(--border)] bg-white">
      <div className="h-48 animate-shimmer" />
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full animate-shimmer" />
          <div className="h-4 w-24 rounded animate-shimmer" />
        </div>
        <div className="h-5 w-full rounded animate-shimmer" />
        <div className="h-5 w-4/5 rounded animate-shimmer" />
        <div className="h-4 w-20 rounded animate-shimmer" />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--border)] px-5 pb-5 pt-4">
        <div className="space-y-1">
          <div className="h-3 w-16 rounded animate-shimmer" />
          <div className="h-6 w-28 rounded animate-shimmer" />
        </div>
        <div className="h-11 w-11 rounded-xl animate-shimmer" />
      </div>
    </div>
  )
}

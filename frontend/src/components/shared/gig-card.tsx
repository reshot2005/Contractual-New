"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, Star, ShoppingCart } from "lucide-react"
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
  rating: number
  reviewCount: number
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
  const randomGradient =
    gradient || gradients[Number(id) % gradients.length]

  return (
    <Link
      href={`/gig/${id}`}
      className="group block w-full min-w-[280px] max-w-[320px] bg-white rounded-[14px] border border-[var(--border)] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_var(--shadow-teal)] hover:border-[var(--primary)] hover:-translate-y-1.5 transition-all duration-300"
    >
      <div className="relative h-40 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="320px"
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

        <span className="absolute top-3 left-3 z-[1] px-2.5 py-1 bg-[var(--primary)] text-white text-xs font-medium rounded-full">
          {category}
        </span>

        {badge && (
          <span
            className={cn(
              "absolute top-3 right-12 z-[1] px-2.5 py-1 text-xs font-medium rounded-full",
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
          className="absolute top-3 right-3 z-[1] w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
          aria-label={liked ? "Remove from saved" : "Save gig"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              liked ? "fill-red-500 text-red-500" : "text-gray-600"
            )}
          />
        </motion.button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-[var(--primary-light)] shrink-0">
            {freelancer.avatar ? (
              <Image
                src={freelancer.avatar}
                alt=""
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] flex items-center justify-center text-white text-xs font-semibold">
                {freelancer.name.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {freelancer.name}
          </span>
          {freelancer.isPro && (
            <span className="px-1.5 py-0.5 bg-[var(--primary-light)] text-[var(--primary-dark)] text-[10px] font-semibold rounded">
              PRO
            </span>
          )}
        </div>

        <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2 min-h-[40px]">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            ({reviewCount} reviews)
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
        <div>
          <span className="text-xs text-[var(--text-secondary)]">
            {minBudget ? "Budget Range" : "Starting at"}
          </span>
          {(minBudget && maxBudget && minBudget !== maxBudget) ? (
            <p className="text-base font-bold font-mono text-[var(--primary)] whitespace-nowrap">
              ₹{minBudget.toLocaleString("en-IN")} - ₹{maxBudget.toLocaleString("en-IN")}
            </p>
          ) : (
            <p className="text-lg font-bold font-mono text-[var(--primary)] whitespace-nowrap">
              ₹{(minBudget || price || 500).toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
          }}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all duration-200"
          aria-label="Add to cart"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </Link>
  )
}

export function GigCardSkeleton() {
  return (
    <div className="w-full min-w-[280px] max-w-[320px] bg-white rounded-[14px] border border-[var(--border)] overflow-hidden">
      <div className="h-40 animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full animate-shimmer" />
          <div className="h-4 w-24 rounded animate-shimmer" />
        </div>
        <div className="h-4 w-full rounded animate-shimmer" />
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="h-4 w-20 rounded animate-shimmer" />
      </div>
      <div className="px-4 pb-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-3 w-16 rounded animate-shimmer" />
          <div className="h-6 w-12 rounded animate-shimmer" />
        </div>
        <div className="w-9 h-9 rounded-lg animate-shimmer" />
      </div>
    </div>
  )
}

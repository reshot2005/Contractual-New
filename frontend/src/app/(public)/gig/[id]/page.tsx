import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GigDetailView } from "@/components/gig/gig-detail-view"
import { getCategoryGigImage } from "@/lib/category-gig-image"

export const revalidate = 120

/**
 * Optimized for high performance: Fetches real data from PostgreSQL 
 * rather than MOCK IDs, which were causing 404s in production.
 */
export default async function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  if (!id) notFound()

  await auth()

  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          companyName: true,
          image: true,
          location: true,
          industry: true,
          isVerified: true,
        }
      },
      requiredSkills: true,
      _count: {
        select: { applications: true }
      }
    }
  })

  if (!gig) notFound()

  // Map to the view component's expected format (if different)
  // Our GigDetailView needs a rich data set (MockGigDetail structure).
  const price = gig.budgetAmount || 500
  const minBudget = gig.minBudget
  const maxBudget = gig.maxBudget
  
  // Basic SEO-friendly slug
  const categorySlug = gig.category.toLowerCase().replace(/\s+/g, "-").replace("&", "and")
  
  const mainImage = getCategoryGigImage(gig.category)

  const [reviewsData, reviewCount, ratingAgg, ratingGrouped] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: gig.business.id },
      include: {
        reviewer: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.review.count({
      where: { revieweeId: gig.business.id }
    }),
    prisma.review.aggregate({
      where: { revieweeId: gig.business.id },
      _avg: { rating: true }
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { revieweeId: gig.business.id },
      _count: { _all: true },
    }),
  ])

  const averageRating = ratingAgg._avg.rating || 0

  const countByStar = new Map(ratingGrouped.map((r) => [r.rating, r._count._all]))
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    percent: reviewCount > 0 ? Math.round(((countByStar.get(star) ?? 0) / reviewCount) * 100) : 0
  }))

  const mappedGig = {
    ...gig,
    price,
    minBudget,
    maxBudget,
    businessName: gig.business.companyName || gig.business.name,
    businessImage: gig.business.image,
    applicantCount: gig._count.applications,
    categorySlug,
    gallery: [
      mainImage,
    ],
    location: gig.business.location || "Remote",
    postedAgo: "Posted recently",
    views: gig.viewCount || 120,
    descriptionLead: gig.description.substring(0, 150) + "...",
    descriptionBullets: [
      "High-quality deliverables aligned with your goals",
      "Regular updates and clear communication",
      "Milestone-based delivery via Contractual",
    ],
    descriptionRest: gig.description,
    skills: gig.requiredSkills.map(s => s.name),
    requirements: gig.specialRequirements ? [gig.specialRequirements] : [
      "Clear technical or creative brief",
      "Feedback provided within 48 hours",
      "Active Contractual account",
    ],
    packages: [
      {
        name: "Basic",
        price: Math.round(price * 0.8),
        deliveryDays: 7,
        features: [
          { name: "Core Requirements", included: true },
          { name: "2 Revisions", included: true },
          { name: "Documentation", included: false },
        ]
      },
      {
        name: "Standard",
        price: Math.round(price),
        deliveryDays: 4,
        features: [
          { name: "Core Requirements", included: true },
          { name: "Unlimited Revisions", included: true },
          { name: "Documentation", included: true },
          { name: "Priority Support", included: false },
        ]
      },
      {
        name: "Premium",
        price: Math.round(price * 1.5),
        deliveryDays: 2,
        features: [
          { name: "Core Requirements", included: true },
          { name: "Unlimited Revisions", included: true },
          { name: "Documentation", included: true },
          { name: "Priority Support", included: true },
        ]
      }
    ],
    // GigDetailView is still based on the "freelancer services" mock shape.
    // Map the business as the "freelancer" card to avoid runtime crashes.
    freelancerId: gig.business.id,
    freelancer: {
      name: gig.business.companyName || gig.business.name,
      avatar: gig.business.image || "",
    },
    freelancerMeta: {
      verified: gig.business.isVerified ?? false,
      memberSince: "2026",
      responseBadge: null,
    },
    rating: averageRating,
    reviewCount: reviewCount,
    business: {
      name: gig.business.companyName || gig.business.name,
      tagline: gig.business.industry || "Professional Business",
      avatarLetter: (gig.business.companyName || gig.business.name || "B").charAt(0),
      stats: [
        { label: "Gigs Posted", value: "12" },
        { label: "Hire Rate", value: "92%" },
        { label: "Avg Budget", value: minBudget && maxBudget ? `₹${minBudget.toLocaleString("en-IN")}-${maxBudget.toLocaleString("en-IN")}` : `₹${price.toLocaleString("en-IN")}` },
        { label: "Location", value: gig.business.location || "Online" },
      ]
    },
    ratingBreakdown: ratingBreakdown,



    reviews: reviewsData.map((r: any) => ({
      name: r.reviewer?.name || "Anonymous User",
      date: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      rating: r.rating,
      text: r.comment,
    }))







  }

  return <GigDetailView gig={mappedGig as any} />
}

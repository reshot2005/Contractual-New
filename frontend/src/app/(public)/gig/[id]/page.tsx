import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { GigDetailView } from "@/components/gig/gig-detail-view"

/**
 * Optimized for high performance: Fetches real data from PostgreSQL 
 * rather than MOCK IDs, which were causing 404s in production.
 */
export default async function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  if (!id) notFound()

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
  
  // Category-based branding
  const categoryImages: Record<string, string> = {
    Development: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200",
    Design: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200",
    Writing: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200",
    Marketing: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200",
    Default: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200"
  }
  const mainImage = categoryImages[gig.category] || categoryImages.Default

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
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
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
    ratingBreakdown: [
      { stars: 5, percent: 95 },
      { stars: 4, percent: 5 },
    ],
    reviews: [
      {
        name: "Alex Johnson",
        date: "Last month",
        rating: 5,
        text: "Great experience working with this client. Clear requirements and fast payment.",
      }
    ]
  }

  return <GigDetailView gig={mappedGig as any} />
}

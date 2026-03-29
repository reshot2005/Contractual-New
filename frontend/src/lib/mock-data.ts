/** Contractual — browse, gig detail, and profiles (mock / demo data). */

export const uPhoto = (photoId: string, w = 400, h = 300) => {
  if (photoId.startsWith("/")) return photoId
  return `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop&q=80`
}

/** Category hero images (spec). */
export const CATEGORY_PHOTOS: Record<string, string> = {
  Development: "1461749280684-dccba630e2f6",
  Design: "1558655146-9f40138edfeb",
  Writing: "1455390582262-044cdead277a",
  Marketing: "1460925895917-afdab827c52f",
  Video: "/images/video-production.png",
  "Social Media": "1611162617474-5b21e879e113",
  SEO: "1504868584819-f8e8b4b6d7e3",
  Consulting: "1552664730-d307ca884978",
  DevOps: "1518770660439-4636190af475",
  "Data & Analytics": "/images/data-analytics.png",
}

export const FREELANCER_AVATAR_IDS = [
  "1507003211169-0a1dd7228f2d",
  "1494790108377-be9c29b29330",
  "1500648767791-00dcc994a43e",
  "1472099645785-5658abf4ff4e",
  "1438761681033-6461ffad8d80",
  "1534528741775-53994a69daeb",
] as const

export function avatarUrl(index: number, size = 128) {
  const id = FREELANCER_AVATAR_IDS[index % FREELANCER_AVATAR_IDS.length]
  return uPhoto(id, size, size)
}

export type GigBadge = "top-rated" | "fast-delivery" | null

export interface GigPackageFeature {
  name: string
  included: boolean
}

export interface GigPackage {
  name: string
  price: number
  deliveryDays: number
  features: GigPackageFeature[]
}

export interface GigCardData {
  id: string
  title: string
  category: string
  freelancerId: string
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
  image: string
  badge: GigBadge
  gradient: string
}

export interface MockGigDetail extends GigCardData {
  categorySlug: string
  gallery: string[]
  location: string
  postedAgo: string
  views: number
  descriptionLead: string
  descriptionBullets: string[]
  descriptionRest: string
  skills: string[]
  requirements: string[]
  packages: GigPackage[]
  business: {
    name: string
    tagline: string
    avatarLetter: string
    stats: { label: string; value: string }[]
  }
  freelancerMeta: {
    verified: boolean
    memberSince: string
    responseBadge?: string
  }
  ratingBreakdown: { stars: number; percent: number }[]
  reviews: { name: string; date: string; rating: number; text: string }[]
}

const gradients = [
  "from-[#6d9c9f] to-[#2d7a7e]",
  "from-[#7eb8a0] to-[#4a9a7c]",
  "from-[#9db5b0] to-[#6d9c9f]",
  "from-[#88a9ab] to-[#5a8a8d]",
  "from-[#a3c4b8] to-[#7ba896]",
]

function categorySlug(cat: string) {
  return cat.toLowerCase().replace(/\s+/g, "-").replace("&", "and")
}

const GIG_SEEDS: Omit<GigCardData, "id" | "image" | "gradient">[] = [
  {
    title: "Web Dev Intern",
    category: "Development",
    freelancerId: "1",
    freelancer: { name: "TEST", avatar: avatarUrl(0), isPro: false },
    rating: 4.9,
    reviewCount: 3,
    price: 50000,
    minBudget: 8000,
    maxBudget: 50000,
    badge: null,
  },
  {
    title: "Web Developer",
    category: "Development",
    freelancerId: "2",
    freelancer: { name: "TEST", avatar: avatarUrl(1), isPro: false },
    rating: 5.0,
    reviewCount: 3,
    price: 50000,
    minBudget: 15000,
    maxBudget: 60000,
    badge: null,
  },
  {
    title: "Backend Developer",
    category: "Development",
    freelancerId: "3",
    freelancer: { name: "TEST", avatar: avatarUrl(2) },
    rating: 4.8,
    reviewCount: 3,
    price: 50000,
    minBudget: 25000,
    maxBudget: 80000,
    badge: null,
  },
  {
    title: "I will design a modern, professional logo for your brand",
    category: "Design",
    freelancerId: "1",
    freelancer: { name: "Sarah Chen", avatar: avatarUrl(0), isPro: true },
    rating: 4.9,
    reviewCount: 128,
    price: 15000,
    minBudget: 5000,
    maxBudget: 25000,
    badge: "top-rated",
  },
  {
    title: "I will build a responsive React website with modern UI",
    category: "Development",
    freelancerId: "2",
    freelancer: { name: "Alex Rivera", avatar: avatarUrl(1), isPro: true },
    rating: 5.0,
    reviewCount: 89,
    price: 45000,
    minBudget: 30000,
    maxBudget: 90000,
    badge: "top-rated",
  },
  {
    title: "I will write SEO-optimized blog posts and articles",
    category: "Writing",
    freelancerId: "3",
    freelancer: { name: "Emma Wilson", avatar: avatarUrl(2) },
    rating: 4.8,
    reviewCount: 234,
    price: 8000,
    minBudget: 5000,
    maxBudget: 12000,
    badge: "fast-delivery",
  },
  {
    title: "I will create a complete brand identity package",
    category: "Design",
    freelancerId: "4",
    freelancer: { name: "Michael Park", avatar: avatarUrl(3), isPro: true },
    rating: 4.9,
    reviewCount: 67,
    price: 35000,
    minBudget: 20000,
    maxBudget: 55000,
    badge: null,
  },
  {
    title: "I will develop a full-stack web application with Node.js",
    category: "Development",
    freelancerId: "5",
    freelancer: { name: "David Kim", avatar: avatarUrl(4) },
    rating: 4.7,
    reviewCount: 156,
    price: 80000,
    minBudget: 60000,
    maxBudget: 150000,
    badge: "top-rated",
  },
  {
    title: "I will create engaging social media content strategy",
    category: "Marketing",
    freelancerId: "6",
    freelancer: { name: "Lisa Johnson", avatar: avatarUrl(5), isPro: true },
    rating: 4.9,
    reviewCount: 112,
    price: 20000,
    minBudget: 12000,
    maxBudget: 35000,
    badge: "fast-delivery",
  },
  {
    title: "I will edit and color grade your videos professionally",
    category: "Video",
    freelancerId: "7",
    freelancer: { name: "Tom Anderson", avatar: avatarUrl(0) },
    rating: 4.8,
    reviewCount: 78,
    price: 30000,
    minBudget: 20000,
    maxBudget: 45000,
    badge: null,
  },
  {
    title: "I will optimize your website for search engines",
    category: "SEO",
    freelancerId: "8",
    freelancer: { name: "Nina Patel", avatar: avatarUrl(1), isPro: true },
    rating: 4.9,
    reviewCount: 201,
    price: 25000,
    minBudget: 15000,
    maxBudget: 40000,
    badge: "top-rated",
  },
  {
    title: "I will design a stunning mobile app UI/UX",
    category: "Design",
    freelancerId: "9",
    freelancer: { name: "James Lee", avatar: avatarUrl(2) },
    rating: 4.7,
    reviewCount: 92,
    price: 45000,
    minBudget: 35000,
    maxBudget: 75000,
    badge: null,
  },
  {
    title: "I will write compelling copy that converts",
    category: "Writing",
    freelancerId: "10",
    freelancer: { name: " Rachel Green", avatar: avatarUrl(3), isPro: true },
    rating: 5.0,
    reviewCount: 167,
    price: 12500,
    minBudget: 8000,
    maxBudget: 18000,
    badge: "top-rated",
  },
  {
    title: "I will create a data analytics dashboard",
    category: "Data & Analytics",
    freelancerId: "11",
    freelancer: { name: "Chris Wong", avatar: avatarUrl(4) },
    rating: 4.6,
    reviewCount: 45,
    price: 60000,
    minBudget: 40000,
    maxBudget: 90000,
    badge: null,
  },
  {
    title: "I will provide business consulting and strategy",
    category: "Consulting",
    freelancerId: "12",
    freelancer: { name: "Maria Santos", avatar: avatarUrl(5), isPro: true },
    rating: 4.9,
    reviewCount: 134,
    price: 17500,
    minBudget: 10000,
    maxBudget: 30000,
    badge: "fast-delivery",
  },
  {
    title: "I will migrate your infrastructure to AWS with zero downtime",
    category: "DevOps",
    freelancerId: "2",
    freelancer: { name: "Alex Rivera", avatar: avatarUrl(1), isPro: true },
    rating: 4.95,
    reviewCount: 56,
    price: 120000,
    minBudget: 90000,
    maxBudget: 200000,
    badge: "top-rated",
  },
]

function buildPackages(base: number): GigPackage[] {
  return [
    {
      name: "Basic",
      price: base,
      deliveryDays: 7,
      features: [
        { name: "Source files", included: true },
        { name: "2 revisions", included: true },
        { name: "Commercial license", included: true },
        { name: "Priority support", included: false },
        { name: "Expedited delivery", included: false },
      ],
    },
    {
      name: "Standard",
      price: Math.round(base * 2.2),
      deliveryDays: 5,
      features: [
        { name: "Source files", included: true },
        { name: "Unlimited revisions", included: true },
        { name: "Commercial license", included: true },
        { name: "Priority support", included: true },
        { name: "Expedited delivery", included: false },
      ],
    },
    {
      name: "Premium",
      price: Math.round(base * 4.2),
      deliveryDays: 3,
      features: [
        { name: "Source files", included: true },
        { name: "Unlimited revisions", included: true },
        { name: "Commercial license", included: true },
        { name: "Priority support", included: true },
        { name: "Expedited delivery", included: true },
      ],
    },
  ]
}

function toDetail(card: GigCardData, index: number): MockGigDetail {
  const catPhoto = CATEGORY_PHOTOS[card.category] ?? CATEGORY_PHOTOS.Development
  const mainImage = uPhoto(catPhoto, 1200, 800)
  const gallery = [
    mainImage,
    uPhoto("1467232008754-3770032500d8", 800, 600),
    uPhoto("1498050100223-1de20e4e7ff8", 800, 600),
    uPhoto("1516321318361-f28f0cc9e53e", 800, 600),
  ]

  return {
    ...card,
    categorySlug: categorySlug(card.category),
    gallery,
    location: "Remote",
    postedAgo: `${(index % 14) + 1} days ago`,
    views: 180 + index * 37,
    descriptionLead: `Looking for a ${card.category.toLowerCase()} partner who ships fast and communicates clearly? This gig covers discovery, execution, and handoff with structured milestones on Contractual.`,
    descriptionBullets: [
      "Kickoff call + written scope within 48 hours",
      "Weekly async updates with Loom or written notes",
      "Revisions aligned to your selected package",
    ],
    descriptionRest:
      "Work is tracked inside Contractual with escrow-friendly milestones. You own deliverables per package terms. I have completed similar projects for SaaS, e-commerce, and professional services teams.",
    skills: [
      card.category,
      "Communication",
      "Project Management",
      "Quality Assurance",
      "Documentation",
    ],
    requirements: [
      "Clear creative or technical brief",
      "Brand assets when applicable",
      "Point of contact for feedback within 48h",
      "Contractual account in good standing",
    ],
    packages: buildPackages(card.price),
    business: {
      name: "TechStart Inc.",
      tagline: "Technology Startup",
      avatarLetter: "T",
      stats: [
        { label: "Total Gigs Posted", value: "24" },
        { label: "Hire Rate", value: "87%" },
        { label: "Avg Budget", value: `₹${Math.round(card.price * 1.2)}` },
        { label: "On Contractual", value: "2 years" },
      ],
    },
    freelancerMeta: {
      verified: true,
      memberSince: "Jan 2024",
      responseBadge: "High Response Rate",
    },
    ratingBreakdown: [
      { stars: 5, percent: 82 },
      { stars: 4, percent: 12 },
      { stars: 3, percent: 4 },
      { stars: 2, percent: 1 },
      { stars: 1, percent: 1 },
    ],
    reviews: [
      {
        name: "John Smith",
        date: "2 weeks ago",
        rating: 5,
        text: "Exceptional work! Delivered beyond expectations with clear communication throughout.",
      },
      {
        name: "Emily Davis",
        date: "1 month ago",
        rating: 5,
        text: "Very professional and responsive. Would hire again for future projects.",
      },
      {
        name: "Michael Chen",
        date: "2 months ago",
        rating: 4,
        text: "Great collaboration and attention to detail. Minor timeline shift but outcome was strong.",
      },
    ],
  }
}

export const MOCK_GIGS: GigCardData[] = GIG_SEEDS.map((seed, i) => {
  const catPhoto = CATEGORY_PHOTOS[seed.category] ?? CATEGORY_PHOTOS.Development
  return {
    ...seed,
    id: String(i + 1),
    image: uPhoto(catPhoto, 560, 320),
    gradient: gradients[i % gradients.length],
  }
})

const DETAIL_MAP = new Map<string, MockGigDetail>(
  MOCK_GIGS.map((g, i) => [g.id, toDetail(g, i)])
)

export function getGigById(id: string): MockGigDetail | undefined {
  return DETAIL_MAP.get(id)
}

export function getAllGigIds(): string[] {
  return MOCK_GIGS.map((g) => g.id)
}

/** ——— Freelancer profiles ——— */

export interface MockFreelancer {
  id: string
  name: string
  headline: string
  avatar: string
  bannerImage: string
  level: string
  online: boolean
  rating: number
  reviewCount: number
  hourlyRate: number
  jobsCompleted: number
  responseHours: number
  skills: { name: string; level: string }[]
  bio: string
  portfolio: { id: string; title: string; image: string }[]
  experience: { title: string; company: string; period: string; description: string }[]
  certifications: { name: string; issuer: string; date: string }[]
  reviews: { name: string; company: string; date: string; rating: number; text: string }[]
}

const PORTFOLIO_IMG = [
  "1460925895917-afdab827c52f",
  "1498050100223-1de20e4e7ff8",
  "1516321318361-f28f0cc9e53e",
  "1461749280684-dccba630e2f6",
  "1551288049-bebda4e38f71",
  "1558655146-9f40138edfeb",
]

function makeFreelancer(i: number): MockFreelancer {
  const names = [
    "Sarah Chen",
    "Alex Rivera",
    "Emma Wilson",
    "Michael Park",
    "David Kim",
    "Lisa Johnson",
    "Tom Anderson",
    "Nina Patel",
    "James Lee",
    "Rachel Green",
    "Chris Wong",
    "Maria Santos",
    "Jordan Blake",
    "Priya Desai",
    "Sam Okonkwo",
  ]
  const name = names[i % names.length]
  return {
    id: String(i + 1),
    name,
    headline: "Senior product builder · shipping reliable web experiences",
    avatar: avatarUrl(i, 200),
    bannerImage: uPhoto("1552664730-d307ca884978", 1600, 480),
    level: i % 3 === 0 ? "Top Rated" : "Level 2",
    online: i % 2 === 0,
    rating: 4.6 + (i % 5) * 0.08,
    reviewCount: 40 + i * 11,
    hourlyRate: 65 + i * 7,
    jobsCompleted: 120 + i * 13,
    responseHours: 1 + (i % 4),
    skills: [
      { name: "React", level: "Expert" },
      { name: "TypeScript", level: "Expert" },
      { name: "Next.js", level: "Expert" },
      { name: "Node.js", level: "Advanced" },
      { name: "Figma", level: "Advanced" },
    ],
    bio: "I help teams launch polished products with pragmatic engineering, clear communication, and predictable delivery. Previously at high-growth startups; now focused on long-term client partnerships through Contractual.",
    portfolio: PORTFOLIO_IMG.map((pid, j) => ({
      id: `p-${i}-${j}`,
      title: ["SaaS dashboard", "Brand site", "Mobile UI", "API platform", "Analytics", "Design system"][j % 6],
      image: uPhoto(pid, 600, 400),
    })),
    experience: [
      {
        title: "Senior Frontend Developer",
        company: "TechCorp Inc.",
        period: "2022 - Present",
        description: "Led React apps serving 100K+ MAU with performance budgets and design systems.",
      },
      {
        title: "Full Stack Developer",
        company: "StartupLab",
        period: "2020 - 2022",
        description: "Shipped features across Node services and React clients for B2B SaaS.",
      },
    ],
    certifications: [
      { name: "AWS Solutions Architect", issuer: "Amazon", date: "2023" },
      { name: "React Developer", issuer: "Meta", date: "2022" },
    ],
    reviews: [
      {
        name: "John Smith",
        company: "TechStart Inc.",
        date: "2 weeks ago",
        rating: 5,
        text: "Exceptional developer! Delivered ahead of schedule with great communication.",
      },
      {
        name: "Emily Davis",
        company: "DesignLab",
        date: "1 month ago",
        rating: 5,
        text: "A pleasure to work with — detail-oriented and proactive.",
      },
    ],
  }
}

export const MOCK_FREELANCERS: MockFreelancer[] = Array.from({ length: 15 }, (_, i) =>
  makeFreelancer(i)
)

export function getFreelancerById(id: string): MockFreelancer | undefined {
  return MOCK_FREELANCERS.find((f) => f.id === id)
}

/** Admin / charts — placeholder series */
export const MOCK_MONTHLY_GMV = [
  { month: "Jan", value: 180000 },
  { month: "Feb", value: 210000 },
  { month: "Mar", value: 195000 },
  { month: "Apr", value: 240000 },
  { month: "May", value: 268000 },
  { month: "Jun", value: 284000 },
]

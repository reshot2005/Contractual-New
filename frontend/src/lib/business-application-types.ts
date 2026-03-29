import type { ApplicationStatus } from "@prisma/client"

export type BusinessApplicationRow = {
  id: string
  status: ApplicationStatus
  proposal: string
  proposedPrice: number | null
  deliveryDays: number | null
  createdAt: string
  gig: {
    id: string
    title: string
    budgetType: string
    budgetAmount: number
    minBudget: number | null
    maxBudget: number | null
  }
  freelancer: {
    id: string
    name: string
    image: string | null
    headline: string | null
    location: string | null
    isVerified: boolean
    skills: { name: string }[]
    reviewAvg: number | null
    reviewCount: number
  }
}

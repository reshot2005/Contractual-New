import { LandingNavbar } from "@/components/landing/landing-navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsCounter } from "@/components/stats-counter"
import { CategoriesSection } from "@/components/landing/categories-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { TrustedBySection } from "@/components/landing/trusted-by-section"
import { DualCtaSection } from "@/components/landing/dual-cta-section"

export const revalidate = 300

const stats = [
  { value: "8,000+", numericValue: 8000, label: "Businesses" },
  { value: "₹13000+", numericValue: 13000, prefix: "₹", label: "Contracts Closed" },
  { value: "3000+", numericValue: 3000, label: "Freelancers" },
  { value: "4.5", numericValue: 4.5, suffix: "★", label: "Avg Rating" },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <LandingNavbar />
      <HeroSection />
      <StatsCounter stats={stats} />
      <CategoriesSection />
      <HowItWorksSection />
      <TrustedBySection />
      <DualCtaSection />
      <Footer />
    </main>
  )
}

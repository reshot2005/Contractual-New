import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { FreelancerShell } from "@/components/freelancer/freelancer-shell"

export default async function FreelancerLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  
  // If no user is logged in, or the user is not a freelancer (e.g. a business user viewing a profile)
  // we do NOT want to wrap the content in the freelancer dashboard shell/sidebar.
  if (!user || user.role !== "FREELANCER") {
    return <div className="min-h-screen bg-gray-50 flex flex-col">{children}</div>
  }

  return (
    <FreelancerShell
      user={{
        id: user.id,
        name: user.name ?? "Freelancer",
        email: user.email ?? "",
        image: user.image ?? null,
      }}
    >
      {children}
    </FreelancerShell>
  )
}

import { DashboardLayout } from "@/components/dashboard/layout"
import { FreelancerDashboardPage } from "@/views/freelancer/Dashboard"

export default function FreelancerDashboardRoute() {
  return (
    <DashboardLayout userType="freelancer" userName="Jordan Lee">
      <FreelancerDashboardPage />
    </DashboardLayout>
  )
}


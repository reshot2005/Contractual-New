import { DashboardLayout } from "@/components/dashboard/layout"
import { BusinessDashboardPage } from "@/views/business/Dashboard"

export default function BusinessDashboardRoute() {
  return (
    <DashboardLayout userType="business" userName="Alex Johnson" hideHeader>
      <BusinessDashboardPage />
    </DashboardLayout>
  )
}


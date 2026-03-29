"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { FreelancerGigDetail } from "@/components/freelancer/pages/freelancer-gig-detail"

export default function FreelancerGigDetailPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params?.id === "string" ? params.id : ""
  if (!id) {
    return (
      <div className="rounded-[14px] border border-[#e8ecf0] bg-white p-8 text-center text-[#64748b]">
        <p>Invalid gig link.</p>
        <Link href="/freelancer/browse-gigs" className="mt-4 inline-block text-sm font-semibold text-[#6d9c9f]">
          ← Back to Browse
        </Link>
      </div>
    )
  }
  return <FreelancerGigDetail id={id} />
}

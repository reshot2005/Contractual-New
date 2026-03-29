"use client"
import { useParams } from "next/navigation"
import { ContractDetailPage } from "@/views/ContractDetail"

export default function ContractDetailRoute() {
  const { id } = useParams<{ id: string }>()
  return <ContractDetailPage contractId={id} />
}

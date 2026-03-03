"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ClientDetail } from "@/components/clients/client-detail"
import { useParams } from "next/navigation"

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string

  return (
    <AppLayout>
      <ClientDetail clientId={clientId} />
    </AppLayout>
  )
}

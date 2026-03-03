"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { PartnerDetail } from "@/components/partners/partner-detail"

export default function PartnerDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <PartnerDetail params={params} />
    </AppLayout>
  )
}

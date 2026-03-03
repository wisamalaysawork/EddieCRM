"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { DealDetail } from "@/components/deals/deal-detail"

export default function DealDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <DealDetail params={params} />
    </AppLayout>
  )
}

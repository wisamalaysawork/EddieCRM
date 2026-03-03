"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { SourceDetail } from "@/components/sources/source-detail"

export default function SourceDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AppLayout>
      <SourceDetail params={params} />
    </AppLayout>
  )
}

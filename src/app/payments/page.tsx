"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { PaymentsPage } from "@/components/payments/payments-page"

export default function PaymentsRoute() {
  return (
    <AppLayout>
      <PaymentsPage />
    </AppLayout>
  )
}

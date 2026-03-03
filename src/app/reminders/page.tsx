"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { RemindersPage } from "@/components/reminders/reminders-page"

export default function RemindersRoute() {
  return (
    <AppLayout>
      <RemindersPage />
    </AppLayout>
  )
}

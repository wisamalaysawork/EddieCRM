import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [deals, payments, recentDeals, totalClients, totalSources, totalPartners] = await Promise.all([
      db.deal.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          clientPaymentAmount: true,
          partnerCost: true,
          commissionType: true,
          commissionValue: true,
          clientId: true,
          sourceId: true,
          partnerId: true,
        },
      }),
      db.payment.findMany({
        include: {
          deal: { select: { id: true, name: true } },
          client: { select: { name: true } },
          source: { select: { name: true } },
          partner: { select: { name: true } },
        },
      }),
      db.deal.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { name: true } },
          source: { select: { name: true } },
          partner: { select: { name: true } },
        },
      }),
      db.client.count(),
      db.source.count(),
      db.partner.count(),
    ])

    const activeDeals = deals.filter((d) =>
      d.status === "IN_PROGRESS" || d.status === "NEW"
    ).length

    // Calculate totals by payment type
    const pendingClientPayments = payments
      .filter((p) => p.type === "CLIENT_PAYMENT" && p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingSourcePayments = payments
      .filter((p) => p.type === "SOURCE_COMMISSION" && p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingPartnerPayments = payments
      .filter((p) => p.type === "PARTNER_PAYMENT" && p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)

    // Calculate profit for all deals
    const totalProfit = deals.reduce((sum, deal) => {
      const commission = deal.commissionType === "PERCENTAGE"
        ? deal.clientPaymentAmount * (deal.commissionValue / 100)
        : deal.commissionValue
      return sum + (deal.clientPaymentAmount - deal.partnerCost - commission)
    }, 0)

    // Upcoming payments (next 30 days)
    const upcomingPayments = payments
      .filter((p) =>
        p.status === "PENDING" &&
        new Date(p.dueDate) <= thirtyDaysFromNow
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    // Overdue payments
    const overduePayments = payments.filter((p) =>
      p.status === "PENDING" && new Date(p.dueDate) < now
    )

    // Update overdue status in database (non-blocking for the rest of calculation, resolved before return)
    const updatePromise = overduePayments.length > 0
      ? db.payment.updateMany({
        where: {
          id: { in: overduePayments.map((p) => p.id) },
          status: "PENDING",
        },
        data: { status: "OVERDUE" },
      })
      : Promise.resolve();

    // Next 7 days urgent payments
    const urgentPayments = upcomingPayments.filter((p) =>
      new Date(p.dueDate) <= sevenDaysFromNow
    )

    if (overduePayments.length > 0) {
      await updatePromise
    }

    return NextResponse.json({
      activeDeals,
      totalProfit,
      pendingClientPayments,
      pendingSourcePayments,
      pendingPartnerPayments,
      upcomingPayments: upcomingPayments.slice(0, 10),
      urgentPayments,
      overduePayments,
      recentDeals,
      totalClients,
      totalSources,
      totalPartners,
    })
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

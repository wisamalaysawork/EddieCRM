import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/deals - List all deals
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const sourceId = searchParams.get("sourceId")
    const partnerId = searchParams.get("partnerId")
    const clientId = searchParams.get("clientId")

    // Build where clause
    let whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status
    }
    if (sourceId) {
      whereClause.sourceId = sourceId
    }
    if (partnerId) {
      whereClause.partnerId = partnerId
    }
    if (clientId) {
      whereClause.clientId = clientId
    }

    const deals = await db.deal.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, type: true },
        },
        source: {
          select: { id: true, name: true, type: true },
        },
        partner: {
          select: { id: true, name: true, type: true },
        },
        payments: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate profit and totals
    const dealsWithCalculations = deals.map((deal) => {
      // Calculate commission from actual payment records
      const sourceCommissionPayments = deal.payments.filter(p => p.type === "SOURCE_COMMISSION")
      const paidCommissions = sourceCommissionPayments
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingCommissions = sourceCommissionPayments
        .filter(p => p.status !== "PAID")
        .reduce((sum, p) => sum + p.amount, 0)
      const commissionAmount = paidCommissions + remainingCommissions

      // Calculate client payments
      const clientPayments = deal.payments.filter(p => p.type === "CLIENT_PAYMENT")
      const paidClientPayments = clientPayments
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingClientPayments = clientPayments
        .filter(p => p.status !== "PAID")
        .reduce((sum, p) => sum + p.amount, 0)

      // Calculate partner payments
      const partnerPayments = deal.payments.filter(p => p.type === "PARTNER_PAYMENT")
      const paidPartnerCost = partnerPayments
        .filter(p => p.status === "PAID")
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingPartnerCost = partnerPayments
        .filter(p => p.status !== "PAID")
        .reduce((sum, p) => sum + p.amount, 0)

      // Profit = client payment - partner cost - commission
      const profit = deal.clientPaymentAmount - deal.partnerCost - commissionAmount

      return {
        ...deal,
        commissionAmount,
        paidCommissions,
        remainingCommissions,
        paidClientPayments,
        remainingClientPayments,
        paidPartnerCost,
        remainingPartnerCost,
        profit,
        totalPaymentsDue: deal.payments
          .filter((p) => p.status === "PENDING")
          .reduce((sum, p) => sum + p.amount, 0),
      }
    })

    return NextResponse.json(dealsWithCalculations)
  } catch (error) {
    console.error("Error fetching deals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to create client payment records
async function createClientPayments(
  dealId: string,
  clientId: string,
  clientPaymentAmount: number,
  clientPaymentType: string,
  clientPaymentDueDate: Date | null,
  clientPaymentMonths: number | null,
  clientPaymentStartDate: Date | null
) {
  const payments = []

  if (clientPaymentType === "ONE_TIME") {
    payments.push({
      dealId,
      type: "CLIENT_PAYMENT" as const,
      amount: clientPaymentAmount,
      dueDate: clientPaymentDueDate || new Date(),
      clientId,
      status: "PENDING" as const,
    })
  } else if (clientPaymentType === "MONTHLY") {
    // clientPaymentAmount is the MONTHLY amount, NOT the total
    const months = clientPaymentMonths || 12
    const monthlyAmount = clientPaymentAmount // Use directly, don't divide
    const start = clientPaymentStartDate ? new Date(clientPaymentStartDate) : new Date()

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(start)
      dueDate.setMonth(dueDate.getMonth() + i)

      payments.push({
        dealId,
        type: "CLIENT_PAYMENT" as const,
        amount: monthlyAmount,
        dueDate,
        clientId,
        status: "PENDING" as const,
      })
    }
  }

  if (payments.length > 0) {
    await db.payment.createMany({ data: payments })
  }
}

// Helper function to create commission payment records
async function createCommissionPayments(
  dealId: string,
  sourceId: string,
  commissionType: string,
  commissionValue: number,
  clientPaymentAmount: number,
  commissionDueDate: Date | null,
  commissionMonths: number | null,
  commissionStartDate: Date | null
) {
  const payments = []

  let commissionAmount = commissionValue
  if (commissionType === "PERCENTAGE") {
    commissionAmount = clientPaymentAmount * (commissionValue / 100)
  }

  if (commissionType === "ONE_TIME" || commissionType === "PERCENTAGE") {
    payments.push({
      dealId,
      type: "SOURCE_COMMISSION" as const,
      amount: commissionAmount,
      dueDate: commissionDueDate || new Date(),
      sourceId,
      status: "PENDING" as const,
    })
  } else if (commissionType === "MONTHLY") {
    const months = commissionMonths || 12
    const start = commissionStartDate ? new Date(commissionStartDate) : new Date()

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(start)
      dueDate.setMonth(dueDate.getMonth() + i)

      payments.push({
        dealId,
        type: "SOURCE_COMMISSION" as const,
        amount: commissionValue, // Monthly amount
        dueDate,
        sourceId,
        status: "PENDING" as const,
      })
    }
  }

  if (payments.length > 0) {
    await db.payment.createMany({ data: payments })
  }
}

// Helper function to create partner payment records
async function createPartnerPayments(
  dealId: string,
  partnerId: string,
  partnerCost: number,
  partnerPaymentType: string,
  partnerPaymentDueDate: Date | null,
  partnerPaymentMonths: number | null,
  partnerPaymentStartDate: Date | null
) {
  const payments = []

  if (partnerPaymentType === "ONE_TIME") {
    payments.push({
      dealId,
      type: "PARTNER_PAYMENT" as const,
      amount: partnerCost,
      dueDate: partnerPaymentDueDate || new Date(),
      partnerId,
      status: "PENDING" as const,
    })
  } else if (partnerPaymentType === "MONTHLY") {
    // partnerCost is the MONTHLY amount, NOT the total
    const months = partnerPaymentMonths || 12
    const monthlyAmount = partnerCost // Use directly, don't divide
    const start = partnerPaymentStartDate ? new Date(partnerPaymentStartDate) : new Date()

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(start)
      dueDate.setMonth(dueDate.getMonth() + i)

      payments.push({
        dealId,
        type: "PARTNER_PAYMENT" as const,
        amount: monthlyAmount,
        dueDate,
        partnerId,
        status: "PENDING" as const,
      })
    }
  }

  if (payments.length > 0) {
    await db.payment.createMany({ data: payments })
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      clientId,
      sourceId,
      partnerId,
      notes,
      // Client Payment fields
      clientPaymentAmount,
      clientPaymentType,
      clientPaymentDueDate,
      clientPaymentMonths,
      clientPaymentStartDate,
      // Source Commission fields
      commissionType,
      commissionValue,
      commissionDueDate,
      commissionMonths,
      commissionStartDate,
      // Partner Payment fields
      partnerCost,
      partnerPaymentType,
      partnerPaymentDueDate,
      partnerPaymentMonths,
      partnerPaymentStartDate,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Parse client payment values
    const parsedClientPaymentAmount = parseFloat(clientPaymentAmount) || 0
    const parsedClientPaymentDueDate = clientPaymentDueDate ? new Date(clientPaymentDueDate) : null
    const parsedClientPaymentMonths = clientPaymentMonths ? parseInt(clientPaymentMonths) : null
    const parsedClientPaymentStartDate = clientPaymentStartDate ? new Date(clientPaymentStartDate) : null

    // Parse commission values
    const parsedCommissionValue = parseFloat(commissionValue) || 0
    const parsedCommissionDueDate = commissionDueDate ? new Date(commissionDueDate) : null
    const parsedCommissionMonths = commissionMonths ? parseInt(commissionMonths) : null
    const parsedCommissionStartDate = commissionStartDate ? new Date(commissionStartDate) : null

    // Parse partner payment values
    const parsedPartnerCost = parseFloat(partnerCost) || 0
    const parsedPartnerPaymentDueDate = partnerPaymentDueDate ? new Date(partnerPaymentDueDate) : null
    const parsedPartnerPaymentMonths = partnerPaymentMonths ? parseInt(partnerPaymentMonths) : null
    const parsedPartnerPaymentStartDate = partnerPaymentStartDate ? new Date(partnerPaymentStartDate) : null

    const deal = await db.deal.create({
      data: {
        name,
        clientId: clientId || null,
        sourceId: sourceId || null,
        partnerId: partnerId || null,
        // Client payment
        clientPaymentAmount: parsedClientPaymentAmount,
        clientPaymentType: clientPaymentType || "ONE_TIME",
        clientPaymentDueDate: parsedClientPaymentDueDate,
        clientPaymentMonths: parsedClientPaymentMonths,
        clientPaymentStartDate: parsedClientPaymentStartDate,
        // Source commission
        commissionType: commissionType || "ONE_TIME",
        commissionValue: parsedCommissionValue,
        commissionDueDate: parsedCommissionDueDate,
        commissionMonths: parsedCommissionMonths,
        commissionStartDate: parsedCommissionStartDate,
        // Partner payment
        partnerCost: parsedPartnerCost,
        partnerPaymentType: partnerPaymentType || "ONE_TIME",
        partnerPaymentDueDate: parsedPartnerPaymentDueDate,
        partnerPaymentMonths: parsedPartnerPaymentMonths,
        partnerPaymentStartDate: parsedPartnerPaymentStartDate,
        // Notes
        notes,
      },
      include: {
        client: true,
        source: true,
        partner: true,
      },
    })

    // Create client payment records if client is set
    if (clientId && parsedClientPaymentAmount > 0) {
      await createClientPayments(
        deal.id,
        clientId,
        parsedClientPaymentAmount,
        clientPaymentType || "ONE_TIME",
        parsedClientPaymentDueDate,
        parsedClientPaymentMonths,
        parsedClientPaymentStartDate
      )
    }

    // Create commission payment records if source and commission are set
    if (sourceId && parsedCommissionValue > 0) {
      await createCommissionPayments(
        deal.id,
        sourceId,
        commissionType || "ONE_TIME",
        parsedCommissionValue,
        parsedClientPaymentAmount,
        parsedCommissionDueDate,
        parsedCommissionMonths,
        parsedCommissionStartDate
      )
    }

    // Create partner payment records if partner is set
    if (partnerId && parsedPartnerCost > 0) {
      await createPartnerPayments(
        deal.id,
        partnerId,
        parsedPartnerCost,
        partnerPaymentType || "ONE_TIME",
        parsedPartnerPaymentDueDate,
        parsedPartnerPaymentMonths,
        parsedPartnerPaymentStartDate
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "DEAL",
        entityId: deal.id,
        newValue: JSON.stringify(deal),
      },
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error("Error creating deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

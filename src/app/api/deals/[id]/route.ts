import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type Params = Promise<{ id: string }>

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

  const commissionAmount = commissionType === "PERCENTAGE"
    ? clientPaymentAmount * (commissionValue / 100)
    : commissionValue

  if (commissionType === "ONE_TIME") {
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
        amount: commissionValue,
        dueDate,
        sourceId,
        status: "PENDING" as const,
      })
    }
  } else if (commissionType === "PERCENTAGE") {
    payments.push({
      dealId,
      type: "SOURCE_COMMISSION" as const,
      amount: commissionAmount,
      dueDate: commissionDueDate || new Date(),
      sourceId,
      status: "PENDING" as const,
    })
  }

  if (payments.length > 0) {
    await db.payment.createMany({ data: payments })
  }
}

// GET /api/deals/[id] - Get a single deal
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        client: true,
        source: true,
        partner: true,
        payments: {
          orderBy: { dueDate: "asc" },
        },
        reminders: true,
      },
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Calculate financials based on actual payments
    const sourceCommissionPayments = deal.payments.filter(p => p.type === "SOURCE_COMMISSION")
    const paidCommissions = sourceCommissionPayments
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)
    const remainingCommissions = sourceCommissionPayments
      .filter(p => p.status !== "PAID")
      .reduce((sum, p) => sum + p.amount, 0)

    const partnerPayments = deal.payments.filter(p => p.type === "PARTNER_PAYMENT")
    const paidPartnerCost = partnerPayments
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)
    const remainingPartnerCost = partnerPayments
      .filter(p => p.status !== "PAID")
      .reduce((sum, p) => sum + p.amount, 0)

    const clientPayments = deal.payments.filter(p => p.type === "CLIENT_PAYMENT")
    const paidClientPayments = clientPayments
      .filter(p => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)
    const remainingClientPayments = clientPayments
      .filter(p => p.status !== "PAID")
      .reduce((sum, p) => sum + p.amount, 0)

    const commissionAmount = paidCommissions + remainingCommissions
    const profit = deal.clientPaymentAmount - deal.partnerCost - commissionAmount

    return NextResponse.json({
      ...deal,
      commissionAmount,
      paidCommissions,
      remainingCommissions,
      paidPartnerCost,
      remainingPartnerCost,
      paidClientPayments,
      remainingClientPayments,
      profit,
    })
  } catch (error) {
    console.error("Error fetching deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/deals/[id] - Update a deal
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const body = await request.json()
    const {
      name,
      status,
      clientId,
      sourceId,
      partnerId,
      clientPaymentAmount,
      clientPaymentType,
      clientPaymentDueDate,
      clientPaymentMonths,
      clientPaymentStartDate,
      commissionType,
      commissionValue,
      commissionDueDate,
      commissionMonths,
      commissionStartDate,
      partnerCost,
      partnerPaymentType,
      partnerPaymentDueDate,
      partnerPaymentMonths,
      partnerPaymentStartDate,
      notes,
    } = body

    const existingDeal = await db.deal.findUnique({
      where: { id },
      include: { source: true, client: true }
    })
    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Check if commission-related fields are being updated
    const isCommissionUpdate =
      commissionType !== undefined ||
      commissionValue !== undefined ||
      commissionDueDate !== undefined ||
      commissionMonths !== undefined ||
      commissionStartDate !== undefined

    // Parse commission values
    const newCommissionType = commissionType || existingDeal.commissionType
    const newCommissionValue = commissionValue !== undefined ? parseFloat(commissionValue) : existingDeal.commissionValue
    const newCommissionDueDate = commissionDueDate ? new Date(commissionDueDate) : (commissionDueDate === null ? null : existingDeal.commissionDueDate)
    const newCommissionMonths = commissionMonths !== undefined ? parseInt(commissionMonths) : existingDeal.commissionMonths
    const newCommissionStartDate = commissionStartDate ? new Date(commissionStartDate) : (commissionStartDate === null ? null : existingDeal.commissionStartDate)
    const newClientPaymentAmount = clientPaymentAmount !== undefined ? parseFloat(clientPaymentAmount) : existingDeal.clientPaymentAmount

    const deal = await db.deal.update({
      where: { id },
      data: {
        name,
        status,
        clientId: clientId === "" ? null : clientId,
        sourceId: sourceId === "" ? null : sourceId,
        partnerId: partnerId === "" ? null : partnerId,
        clientPaymentAmount: newClientPaymentAmount,
        clientPaymentType,
        clientPaymentDueDate: clientPaymentDueDate ? new Date(clientPaymentDueDate) : undefined,
        clientPaymentMonths: clientPaymentMonths !== undefined ? parseInt(clientPaymentMonths) : undefined,
        clientPaymentStartDate: clientPaymentStartDate ? new Date(clientPaymentStartDate) : undefined,
        commissionType: newCommissionType,
        commissionValue: newCommissionValue,
        commissionDueDate: newCommissionDueDate,
        commissionMonths: newCommissionMonths,
        commissionStartDate: newCommissionStartDate,
        partnerCost: partnerCost !== undefined ? parseFloat(partnerCost) : undefined,
        partnerPaymentType,
        partnerPaymentDueDate: partnerPaymentDueDate ? new Date(partnerPaymentDueDate) : undefined,
        partnerPaymentMonths: partnerPaymentMonths !== undefined ? parseInt(partnerPaymentMonths) : undefined,
        partnerPaymentStartDate: partnerPaymentStartDate ? new Date(partnerPaymentStartDate) : undefined,
        notes,
      },
    })

    // If commission was updated, recreate pending commission payments
    if (isCommissionUpdate && newCommissionValue > 0 && (sourceId || existingDeal.sourceId)) {
      // Delete existing PENDING SOURCE_COMMISSION payments (keep PAID ones)
      await db.payment.deleteMany({
        where: {
          dealId: id,
          type: "SOURCE_COMMISSION",
          status: "PENDING",
        },
      })

      // Create new commission payments
      await createCommissionPayments(
        id,
        sourceId || existingDeal.sourceId!,
        newCommissionType,
        newCommissionValue,
        newClientPaymentAmount,
        newCommissionDueDate,
        newCommissionMonths,
        newCommissionStartDate
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "DEAL",
        entityId: deal.id,
        oldValue: JSON.stringify(existingDeal),
        newValue: JSON.stringify(deal),
      },
    })

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error updating deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    // Check if deal exists first
    const existingDeal = await db.deal.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Use transaction to delete everything atomically
    await db.$transaction([
      // Delete associated payments
      db.payment.deleteMany({ where: { dealId: id } }),
      // Delete payment reminders
      db.paymentReminder.deleteMany({ where: { dealId: id } }),
      // Delete the deal
      db.deal.delete({ where: { id } }),
    ])

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "DEAL",
        entityId: id,
        oldValue: JSON.stringify(existingDeal),
      },
    })

    return NextResponse.json({ message: "Deal deleted" })
  } catch (error) {
    console.error("Error deleting deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type Params = Promise<{ id: string }>

// GET /api/partners/[id] - Get a single partner
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const partner = await db.partner.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            payments: {
              where: { type: "PARTNER_PAYMENT" },
              orderBy: { dueDate: "asc" },
            },
          },
        },
        payments: {
          include: {
            deal: {
              select: { id: true, name: true, status: true },
            },
          },
          orderBy: { dueDate: "desc" },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Calculate totals
    const pendingPayments = partner.payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalEarned = partner.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      ...partner,
      pendingPayments,
      totalEarned,
    })
  } catch (error) {
    console.error("Error fetching partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/partners/[id] - Update a partner
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, contactPhone, contactEmail, contactAddress, notes, isActive } = body

    const existingPartner = await db.partner.findUnique({ where: { id } })
    if (!existingPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const partner = await db.partner.update({
      where: { id },
      data: {
        name,
        type,
        contactPhone,
        contactEmail,
        contactAddress,
        notes,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "PARTNER",
        entityId: partner.id,
        oldValue: JSON.stringify(existingPartner),
        newValue: JSON.stringify(partner),
      },
    })

    return NextResponse.json(partner)
  } catch (error) {
    console.error("Error updating partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/partners/[id] - Delete a partner
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const existingPartner = await db.partner.findUnique({
      where: { id },
    })

    if (!existingPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Handle dependencies: Set partnerId to null for associated deals and payments
    await db.deal.updateMany({
      where: { partnerId: id },
      data: { partnerId: null },
    })

    await db.payment.updateMany({
      where: { partnerId: id },
      data: { partnerId: null },
    })

    await db.partner.delete({
      where: { id },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "PARTNER",
        entityId: id,
        oldValue: JSON.stringify(existingPartner),
      },
    })

    return NextResponse.json({ message: "Partner deleted" })
  } catch (error) {
    console.error("Error deleting partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

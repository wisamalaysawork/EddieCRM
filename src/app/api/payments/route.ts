import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/payments - List all payments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const upcoming = searchParams.get("upcoming")

    // Build where clause
    let whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status
    }
    if (type) {
      whereClause.type = type
    }
    if (upcoming === "true") {
      whereClause.status = "PENDING"
    }

    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        deal: {
          select: { id: true, name: true, status: true },
        },
        client: {
          select: { id: true, name: true },
        },
        source: {
          select: { id: true, name: true },
        },
        partner: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dealId, type, amount, dueDate, notes, clientId, sourceId, partnerId } = body

    if (!dealId || !amount || !dueDate) {
      return NextResponse.json({ error: "Deal, amount, and due date are required" }, { status: 400 })
    }

    const payment = await db.payment.create({
      data: {
        dealId,
        type: type || "CLIENT_PAYMENT",
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes,
        clientId: clientId || null,
        sourceId: sourceId || null,
        partnerId: partnerId || null,
      },
      include: {
        deal: { select: { id: true, name: true } },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: payment.id,
        newValue: JSON.stringify(payment),
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

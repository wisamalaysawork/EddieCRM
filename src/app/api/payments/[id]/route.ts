import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type Params = Promise<{ id: string }>

// GET /api/payments/[id] - Get a single payment
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        deal: {
          select: { id: true, name: true, status: true },
        },
        source: {
          select: { id: true, name: true },
        },
        partner: {
          select: { id: true, name: true },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/payments/[id] - Update a payment (mark as paid, etc.)
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const body = await request.json()
    const { status, paidDate, notes } = body

    const existingPayment = await db.payment.findUnique({ where: { id } })
    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const payment = await db.payment.update({
      where: { id },
      data: {
        status,
        paidDate: status === "PAID" ? (paidDate ? new Date(paidDate) : new Date()) : null,
        notes,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: status === "PAID" ? "MARK_PAID" : "UPDATE",
        entityType: "PAYMENT",
        entityId: payment.id,
        oldValue: JSON.stringify(existingPayment),
        newValue: JSON.stringify(payment),
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/payments/[id] - Delete a payment
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const payment = await db.payment.delete({ where: { id } })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "PAYMENT",
        entityId: payment.id,
        oldValue: JSON.stringify(payment),
      },
    })

    return NextResponse.json({ message: "Payment deleted" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

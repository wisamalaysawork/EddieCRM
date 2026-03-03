import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type Params = Promise<{ id: string }>

// GET /api/sources/[id] - Get a single source
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const source = await db.source.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            partner: {
              select: { id: true, name: true },
            },
            payments: {
              where: { type: "SOURCE_COMMISSION" },
              orderBy: { dueDate: "asc" },
            },
          },
        },
        payments: {
          include: {
            deal: {
              select: { id: true, name: true },
            },
          },
          orderBy: { dueDate: "desc" },
        },
      },
    })

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    // Calculate totals
    const totalOwed = source.payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalPaid = source.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)
    const nextPaymentDue = source.payments.find((p) => p.status === "PENDING")?.dueDate || null

    return NextResponse.json({
      ...source,
      totalOwed,
      totalPaid,
      nextPaymentDue,
    })
  } catch (error) {
    console.error("Error fetching source:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/sources/[id] - Update a source
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, contactPhone, contactEmail, contactAddress, notes, isActive } = body

    const existingSource = await db.source.findUnique({ where: { id } })
    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    const source = await db.source.update({
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
        entityType: "SOURCE",
        entityId: source.id,
        oldValue: JSON.stringify(existingSource),
        newValue: JSON.stringify(source),
      },
    })

    return NextResponse.json(source)
  } catch (error) {
    console.error("Error updating source:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sources/[id] - Delete a source
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const existingSource = await db.source.findUnique({
      where: { id },
    })

    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 })
    }

    // Handle dependencies: Set sourceId to null for associated deals and payments
    // This allows deleting the source while keeping the history of associated records
    await db.deal.updateMany({
      where: { sourceId: id },
      data: { sourceId: null },
    })

    await db.payment.updateMany({
      where: { sourceId: id },
      data: { sourceId: null },
    })

    await db.source.delete({
      where: { id },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "SOURCE",
        entityId: id,
        oldValue: JSON.stringify(existingSource),
      },
    })

    return NextResponse.json({ message: "Source deleted" })
  } catch (error) {
    console.error("Error deleting source:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

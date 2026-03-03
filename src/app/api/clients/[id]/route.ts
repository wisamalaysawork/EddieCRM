import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type Params = Promise<{ id: string }>

// GET /api/clients/[id] - Get a single client
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const client = await db.client.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            source: { select: { id: true, name: true } },
            partner: { select: { id: true, name: true } },
            payments: {
              where: { type: "CLIENT_PAYMENT" },
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

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Calculate totals
    const pendingPayments = client.payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalPaid = client.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      ...client,
      pendingPayments,
      totalPaid,
    })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type, contactPhone, contactEmail, contactAddress, notes, isActive } = body

    const existingClient = await db.client.findUnique({ where: { id } })
    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const client = await db.client.update({
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
        entityType: "CLIENT",
        entityId: client.id,
        oldValue: JSON.stringify(existingClient),
        newValue: JSON.stringify(client),
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const existingClient = await db.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Handle dependencies: Set clientId to null for associated deals and payments
    await db.deal.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    })

    await db.payment.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    })

    await db.client.delete({
      where: { id },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "CLIENT",
        entityId: id,
        oldValue: JSON.stringify(existingClient),
      },
    })

    return NextResponse.json({ message: "Client deleted" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

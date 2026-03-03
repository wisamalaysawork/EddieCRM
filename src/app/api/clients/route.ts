import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/clients - List all clients
export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        deals: {
          select: {
            id: true,
            name: true,
            status: true,
            clientPaymentAmount: true,
          },
        },
        payments: {
          where: {
            type: "CLIENT_PAYMENT",
            status: "PENDING",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate derived fields
    const clientsWithTotals = clients.map((client) => {
      const pendingPayments = client.payments.reduce((sum, p) => sum + p.amount, 0)
      const totalPaid = client.deals
        .filter((d) => d.status === "PAID")
        .reduce((sum, d) => sum + d.clientPaymentAmount, 0)

      return {
        ...client,
        pendingPayments,
        totalPaid,
        dealCount: client.deals.length,
      }
    })

    return NextResponse.json(clientsWithTotals)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, contactPhone, contactEmail, contactAddress, notes } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const client = await db.client.create({
      data: {
        name,
        type: type || "INDIVIDUAL",
        contactPhone,
        contactEmail,
        contactAddress,
        notes,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "CLIENT",
        entityId: client.id,
        newValue: JSON.stringify(client),
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

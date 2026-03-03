import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Partners API - CRUD operations for partners
// GET /api/partners - List all partners
export async function GET() {
  try {
    const partners = await db.partner.findMany({
      include: {
        deals: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        payments: {
          where: {
            type: "PARTNER_PAYMENT",
            status: "PENDING",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate derived fields
    const partnersWithTotals = partners.map((partner) => {
      const pendingPayments = partner.payments.reduce((sum, p) => sum + p.amount, 0)
      const totalEarned = partner.deals
        .filter((d) => d.status === "PAID")
        .reduce((sum, d) => sum + d.partnerCost, 0)

      return {
        ...partner,
        pendingPayments,
        totalEarned,
        dealCount: partner.deals.length,
      }
    })

    return NextResponse.json(partnersWithTotals)
  } catch (error) {
    console.error("Error fetching partners:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/partners - Create a new partner
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, contactPhone, contactEmail, contactAddress, notes } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const partner = await db.partner.create({
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
        entityType: "PARTNER",
        entityId: partner.id,
        newValue: JSON.stringify(partner),
      },
    })

    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error("Error creating partner:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

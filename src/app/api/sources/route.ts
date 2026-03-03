import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/sources - List all sources
export async function GET() {
  try {
    const sources = await db.source.findMany({
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
            type: "SOURCE_COMMISSION",
            status: "PENDING",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate derived fields
    const sourcesWithTotals = sources.map((source) => {
      const totalOwed = source.payments.reduce((sum, p) => sum + p.amount, 0)
      const nextPaymentDue = source.payments.length > 0
        ? source.payments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0].dueDate
        : null

      return {
        ...source,
        totalOwed,
        nextPaymentDue,
        dealCount: source.deals.length,
      }
    })

    return NextResponse.json(sourcesWithTotals)
  } catch (error) {
    console.error("Error fetching sources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/sources - Create a new source
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, contactPhone, contactEmail, contactAddress, notes } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const source = await db.source.create({
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
        entityType: "SOURCE",
        entityId: source.id,
        newValue: JSON.stringify(source),
      },
    })

    return NextResponse.json(source, { status: 201 })
  } catch (error) {
    console.error("Error creating source:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

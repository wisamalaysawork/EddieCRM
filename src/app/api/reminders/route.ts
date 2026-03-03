import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/reminders - List all reminders
export async function GET() {
  try {
    const reminders = await db.paymentReminder.findMany({
      include: {
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error("Error fetching reminders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dealId, daysBefore, email } = body

    if (!dealId || !daysBefore || !email) {
      return NextResponse.json({ error: "Deal ID, days before, and email are required" }, { status: 400 })
    }

    const reminder = await db.paymentReminder.create({
      data: {
        dealId,
        daysBefore: parseInt(daysBefore),
        email,
        isActive: true,
      },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error("Error creating reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

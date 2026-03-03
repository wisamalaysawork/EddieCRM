import { NextResponse } from "next/server"
import { db } from "@/lib/db"

type Params = Promise<{ id: string }>

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    await db.paymentReminder.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Reminder deleted" })
  } catch (error) {
    console.error("Error deleting reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/reminders/[id] - Update a reminder
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params

    const body = await request.json()
    const { daysBefore, email, isActive } = body

    const reminder = await db.paymentReminder.update({
      where: { id },
      data: {
        daysBefore,
        email,
        isActive,
      },
    })

    return NextResponse.json(reminder)
  } catch (error) {
    console.error("Error updating reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

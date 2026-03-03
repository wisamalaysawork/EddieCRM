import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/users - List all team members
export async function GET() {
  try {
    const users = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "TEAM_MEMBER"] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { deals: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

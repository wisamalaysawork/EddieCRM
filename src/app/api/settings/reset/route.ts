import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
    try {
        // Delete all data in correct order to handle foreign keys
        await db.$transaction([
            db.paymentReminder.deleteMany({}),
            db.payment.deleteMany({}),
            db.deal.deleteMany({}),
            db.client.deleteMany({}),
            db.source.deleteMany({}),
            db.partner.deleteMany({}),
            db.auditLog.deleteMany({}),
        ])

        return NextResponse.json({ message: "System reset successful" })
    } catch (error) {
        console.error("Error resetting system:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

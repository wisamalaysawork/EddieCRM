import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import ZAI from "z-ai-web-dev-sdk"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const reminder = await db.paymentReminder.findUnique({
            where: { id },
            include: {
                deal: {
                    include: {
                        client: true,
                        source: true,
                        partner: true,
                        payments: {
                            where: {
                                status: { in: ["PENDING", "OVERDUE"] }
                            },
                            orderBy: {
                                dueDate: "asc"
                            },
                            take: 1
                        }
                    }
                },
            },
        })

        if (!reminder) {
            return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
        }

        const nextPayment = reminder.deal.payments[0]

        // Generate content using ZAI
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
            messages: [
                {
                    role: "assistant",
                    content: `You are a professional helper for Eddie CRM. Write a polite payment reminder email.
Format the response as JSON with "subject" and "body" fields.`
                },
                {
                    role: "user",
                    content: `Write a payment reminder email for:
- Deal: ${reminder.deal.name}
- Email Recipient: ${reminder.email}
${nextPayment ? `- Amount Due: $${nextPayment.amount.toLocaleString()}\n- Due Date: ${nextPayment.dueDate.toDateString()}` : "- Note: This is a general reminder to check upcoming payments for this deal."}

Keep it professional and helpful.`
                }
            ],
            thinking: { type: "disabled" }
        })

        const aiResponse = completion.choices[0]?.message?.content || ""
        let emailContent = { subject: `Payment Reminder: ${reminder.deal.name}`, body: aiResponse }

        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                emailContent = JSON.parse(jsonMatch[0])
            }
        } catch (e) {
            console.error("Failed to parse AI response as JSON, using raw text")
        }

        // SMTP Configuration
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })

        // Send via SMTP
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Eddie CRM" <notifications@yourdomain.com>',
                to: reminder.email,
                subject: emailContent.subject,
                text: emailContent.body,
                // html: emailContent.body.replace(/\n/g, '<br>'), // Optional: convert newlines to br for HTML
            })
        } catch (smtpError) {
            console.error("SMTP Error:", smtpError)
            return NextResponse.json({
                error: "Failed to send email. Ensure your SMTP settings in .env are correct.",
                details: smtpError instanceof Error ? smtpError.message : String(smtpError)
            }, { status: 500 })
        }

        // Update sentAt
        const updatedReminder = await db.paymentReminder.update({
            where: { id },
            data: {
                sentAt: new Date(),
            },
        })

        return NextResponse.json({
            message: "Email sent successfully via SMTP",
            reminder: updatedReminder
        })
    } catch (error) {
        console.error("Error sending reminder:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

import { NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

// POST /api/send-reminder - Generate and preview a payment reminder email
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentType, recipientName, amount, dueDate, dealName } = body

    // Generate email content using LLM
    const zai = await ZAI.create()
    
    const paymentTypeLabel = paymentType === "SOURCE_COMMISSION" ? "commission" : "partner payment"
    const direction = paymentType === "SOURCE_COMMISSION" ? "receive from" : "pay to"
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `You are a professional payment reminder email writer. Write clear, polite, and professional payment reminder emails. 
Keep emails concise and include:
- A clear subject line
- Professional greeting
- Payment details (amount, due date, deal/project name)
- A call to action
- Professional closing

Format the response as JSON with "subject" and "body" fields.`
        },
        {
          role: "user",
          content: `Write a payment reminder email for:
- Recipient: ${recipientName}
- Payment Type: ${paymentTypeLabel} payment
- Amount: $${amount.toLocaleString()}
- Due Date: ${dueDate}
- Deal/Project: ${dealName}

This is a reminder that we need to ${direction} ${recipientName}.`
        }
      ],
      thinking: { type: "disabled" }
    })

    const response = completion.choices[0]?.message?.content
    
    // Parse the JSON response
    let emailContent
    try {
      // Try to extract JSON from the response
      const jsonMatch = response?.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        emailContent = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch {
      // Fallback to a simple format
      emailContent = {
        subject: `Payment Reminder: ${dealName}`,
        body: response || "Unable to generate email content"
      }
    }

    return NextResponse.json({
      success: true,
      email: emailContent
    })
  } catch (error) {
    console.error("Error generating reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

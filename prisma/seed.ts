import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { id: "client1" },
    update: {},
    create: {
      id: "client1",
      name: "Acme Corporation",
      type: "COMPANY",
      contactEmail: "projects@acmecorp.com",
      contactPhone: "+1-555-0001",
    },
  })

  const client2 = await prisma.client.upsert({
    where: { id: "client2" },
    update: {},
    create: {
      id: "client2",
      name: "StartupXYZ",
      type: "COMPANY",
      contactEmail: "hello@startupxyz.io",
      contactPhone: "+1-555-0002",
    },
  })

  const client3 = await prisma.client.upsert({
    where: { id: "client3" },
    update: {},
    create: {
      id: "client3",
      name: "Jane Doe",
      type: "INDIVIDUAL",
      contactEmail: "jane.doe@email.com",
      contactPhone: "+1-555-0003",
    },
  })

  console.log("Created sample clients")

  // Create sample sources
  const source1 = await prisma.source.upsert({
    where: { id: "source1" },
    update: {},
    create: {
      id: "source1",
      name: "Tech Solutions Inc",
      type: "COMPANY",
      contactEmail: "contact@techsolutions.com",
      contactPhone: "+1-555-0100",
    },
  })

  const source2 = await prisma.source.upsert({
    where: { id: "source2" },
    update: {},
    create: {
      id: "source2",
      name: "John Smith",
      type: "INDIVIDUAL",
      contactEmail: "john.smith@email.com",
      contactPhone: "+1-555-0200",
    },
  })

  console.log("Created sample sources")

  // Create sample partners
  const partner1 = await prisma.partner.upsert({
    where: { id: "partner1" },
    update: {},
    create: {
      id: "partner1",
      name: "DevCorp Ltd",
      type: "COMPANY",
      contactEmail: "dev@devcorp.com",
      contactPhone: "+1-555-0300",
    },
  })

  const partner2 = await prisma.partner.upsert({
    where: { id: "partner2" },
    update: {},
    create: {
      id: "partner2",
      name: "Sarah Developer",
      type: "INDIVIDUAL",
      contactEmail: "sarah@developer.com",
      contactPhone: "+1-555-0400",
    },
  })

  console.log("Created sample partners")

  // Create sample deals matching the actual schema
  // Deal 1: E-commerce Platform - Monthly client payment, one-time commission, monthly partner
  const deal1 = await prisma.deal.upsert({
    where: { id: "deal1" },
    update: {},
    create: {
      id: "deal1",
      name: "E-commerce Platform Development",
      status: "IN_PROGRESS",
      // Client pays Eddie $50,000 over 3 months
      clientPaymentAmount: 50000,
      clientPaymentType: "MONTHLY",
      clientPaymentMonths: 3,
      clientPaymentStartDate: new Date("2025-02-01"),
      // Eddie pays Source $5,000 commission one-time
      commissionType: "ONE_TIME",
      commissionValue: 5000,
      commissionDueDate: new Date("2025-03-15"),
      // Eddie pays Partner $35,000 over 3 months
      partnerCost: 35000,
      partnerPaymentType: "MONTHLY",
      partnerPaymentMonths: 3,
      partnerPaymentStartDate: new Date("2025-02-01"),
      clientId: client1.id,
      sourceId: source1.id,
      partnerId: partner1.id,
    },
  })

  // Deal 2: Mobile App - One-time payments
  const deal2 = await prisma.deal.upsert({
    where: { id: "deal2" },
    update: {},
    create: {
      id: "deal2",
      name: "Mobile App MVP",
      status: "NEW",
      // Client pays Eddie $25,000 one-time
      clientPaymentAmount: 25000,
      clientPaymentType: "ONE_TIME",
      clientPaymentDueDate: new Date("2025-04-30"),
      // Eddie pays Source 10% commission ($2,500)
      commissionType: "PERCENTAGE",
      commissionValue: 10,
      commissionDueDate: new Date("2025-05-01"),
      // Eddie pays Partner $18,000 one-time
      partnerCost: 18000,
      partnerPaymentType: "ONE_TIME",
      partnerPaymentDueDate: new Date("2025-04-15"),
      clientId: client2.id,
      sourceId: source2.id,
      partnerId: partner2.id,
    },
  })

  // Deal 3: Monthly Maintenance - Monthly for 12 months
  const deal3 = await prisma.deal.upsert({
    where: { id: "deal3" },
    update: {},
    create: {
      id: "deal3",
      name: "Monthly Maintenance Contract",
      status: "IN_PROGRESS",
      // Client pays Eddie $60,000 over 12 months ($5,000/month)
      clientPaymentAmount: 60000,
      clientPaymentType: "MONTHLY",
      clientPaymentMonths: 12,
      clientPaymentStartDate: new Date("2025-01-01"),
      // Eddie pays Source $500/month for 12 months
      commissionType: "MONTHLY",
      commissionValue: 500,
      commissionMonths: 12,
      commissionStartDate: new Date("2025-01-01"),
      // Eddie pays Partner $36,000 over 12 months ($3,000/month)
      partnerCost: 36000,
      partnerPaymentType: "MONTHLY",
      partnerPaymentMonths: 12,
      partnerPaymentStartDate: new Date("2025-01-01"),
      clientId: client3.id,
      sourceId: source1.id,
      partnerId: partner1.id,
    },
  })

  // Deal 4: Website Redesign - One-time, delivered and paid
  const deal4 = await prisma.deal.upsert({
    where: { id: "deal4" },
    update: {},
    create: {
      id: "deal4",
      name: "Website Redesign",
      status: "DELIVERED",
      // Client pays Eddie $15,000 one-time
      clientPaymentAmount: 15000,
      clientPaymentType: "ONE_TIME",
      clientPaymentDueDate: new Date("2025-02-28"),
      // No source commission (direct client)
      commissionType: "ONE_TIME",
      commissionValue: 0,
      // Eddie pays Partner $10,000 one-time
      partnerCost: 10000,
      partnerPaymentType: "ONE_TIME",
      partnerPaymentDueDate: new Date("2025-02-28"),
      clientId: client1.id,
      sourceId: null,
      partnerId: partner2.id,
    },
  })

  console.log("Created sample deals")

  // Create sample payments
  const payments = [
    // Deal 1 - E-commerce Platform
    {
      id: "payment1",
      type: "CLIENT_PAYMENT" as const,
      amount: 16666.67, // 50000 / 3
      dueDate: new Date("2025-02-01"),
      status: "PAID" as const,
      paidDate: new Date("2025-02-01"),
      dealId: deal1.id,
      clientId: client1.id,
    },
    {
      id: "payment2",
      type: "CLIENT_PAYMENT" as const,
      amount: 16666.67,
      dueDate: new Date("2025-03-01"),
      status: "PENDING" as const,
      dealId: deal1.id,
      clientId: client1.id,
    },
    {
      id: "payment3",
      type: "CLIENT_PAYMENT" as const,
      amount: 16666.66,
      dueDate: new Date("2025-04-01"),
      status: "PENDING" as const,
      dealId: deal1.id,
      clientId: client1.id,
    },
    {
      id: "payment4",
      type: "SOURCE_COMMISSION" as const,
      amount: 5000,
      dueDate: new Date("2025-03-15"),
      status: "PENDING" as const,
      dealId: deal1.id,
      sourceId: source1.id,
    },
    {
      id: "payment5",
      type: "PARTNER_PAYMENT" as const,
      amount: 11666.67, // 35000 / 3
      dueDate: new Date("2025-02-01"),
      status: "PAID" as const,
      paidDate: new Date("2025-02-01"),
      dealId: deal1.id,
      partnerId: partner1.id,
    },
    {
      id: "payment6",
      type: "PARTNER_PAYMENT" as const,
      amount: 11666.67,
      dueDate: new Date("2025-03-01"),
      status: "PENDING" as const,
      dealId: deal1.id,
      partnerId: partner1.id,
    },
    // Deal 4 - Website Redesign (Delivered & Paid)
    {
      id: "payment7",
      type: "CLIENT_PAYMENT" as const,
      amount: 15000,
      dueDate: new Date("2025-02-28"),
      status: "PAID" as const,
      paidDate: new Date("2025-02-28"),
      dealId: deal4.id,
      clientId: client1.id,
    },
    {
      id: "payment8",
      type: "PARTNER_PAYMENT" as const,
      amount: 10000,
      dueDate: new Date("2025-02-28"),
      status: "PAID" as const,
      paidDate: new Date("2025-02-28"),
      dealId: deal4.id,
      partnerId: partner2.id,
    },
  ]

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: {},
      create: payment,
    })
  }

  console.log("Created sample payments")

  console.log("\n=== Seed completed successfully! ===")
  console.log("\nBusiness Flow:")
  console.log("  Client → Source → Eddie → Partner")
  console.log("\nPayment Types:")
  console.log("  CLIENT_PAYMENT: Client pays Eddie")
  console.log("  SOURCE_COMMISSION: Eddie pays Source")
  console.log("  PARTNER_PAYMENT: Eddie pays Partner")
  console.log("\nPayment Schedules:")
  console.log("  ONE_TIME: Single payment with due date")
  console.log("  MONTHLY: Multiple payments with first payment date + number of months")
  console.log("  PERCENTAGE: Commission based on client payment amount")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

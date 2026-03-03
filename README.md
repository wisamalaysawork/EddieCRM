# Eddie CRM

A modern CRM system for managing deal flows: **Client → Source → Eddie → Partner**

## Business Flow

```
Client (pays Eddie) → Source (gets commission) → Eddie → Partner (gets paid)
```

## Payment Types

| Type | Field Input | Result |
|------|-------------|--------|
| ONE_TIME | Total amount | 1 payment |
| MONTHLY | Monthly amount | N payments of same amount |
| PERCENTAGE | % of client total | 1 payment (commission only) |

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript 5**
- **Prisma ORM** with SQLite
- **shadcn/ui** components
- **TanStack Query**

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/clients` | GET, POST | List/Create clients |
| `/api/clients/[id]` | GET, PUT, DELETE | Client CRUD |
| `/api/sources` | GET, POST | List/Create sources |
| `/api/sources/[id]` | GET, PUT, DELETE | Source CRUD |
| `/api/partners` | GET, POST | List/Create partners |
| `/api/partners/[id]` | GET, PUT, DELETE | Partner CRUD |
| `/api/deals` | GET, POST | List/Create deals |
| `/api/deals/[id]` | GET, PUT, DELETE | Deal CRUD |
| `/api/payments` | GET | List payments |
| `/api/payments/[id]/pay` | PUT | Mark payment as paid |
| `/api/dashboard` | GET | Dashboard statistics |

## Quick Start

```bash
bun install
bun run db:push
bun run dev
```

## Database Enums

- **EntityType**: INDIVIDUAL, COMPANY
- **DealStatus**: NEW, IN_PROGRESS, DELIVERED, CLOSED, PAID
- **ClientPaymentType**: ONE_TIME, MONTHLY
- **CommissionType**: ONE_TIME, MONTHLY, PERCENTAGE
- **PartnerPaymentType**: ONE_TIME, MONTHLY
- **PaymentType**: CLIENT_PAYMENT, SOURCE_COMMISSION, PARTNER_PAYMENT
- **PaymentStatus**: PENDING, PAID, OVERDUE

---

Built with Next.js, Prisma, and shadcn/ui

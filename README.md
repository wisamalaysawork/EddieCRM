# Eddie CRM

A modern CRM system for managing deal flows: **Client → Source → Eddie → Partner**

## Business Flow

```
Client (pays Eddie) → Source (gets commission) → Eddie → Partner (gets paid)
```

## Features

- **Deal & Commission Management**: Track deals, calculate profit margins, and manage source commissions & partner costs.
- **Flexible Payment Structures**: Support for One-Time, Monthly, Percentage, and Multi-Payment (Milestone-based) agreements.
- **Financial Dashboard**: View open, overdue, and paid balances across clients, sources, and partners.
- **Dark & Light Mode**: Built-in theme toggling for user preference.
- **PostgreSQL Database**: Powered by Neon serverless Postgres for reliable and scalable data management.

## Payment Types

| Type | Field Input | Result |
|------|-------------|--------|
| ONE_TIME | Total amount | 1 payment |
| MONTHLY | Monthly amount | N payments of same amount |
| PERCENTAGE | % of client total | 1 payment (commission only) |
| MULTI_PAYMENT | Defined milestones (%) | Multiple payments broken down by custom milestones |

## Tech Stack

- **Next.js** with App Router
- **TypeScript**
- **Prisma ORM** with **PostgreSQL** (Neon)
- **shadcn/ui** components & **Tailwind CSS**
- **TanStack React Query**
- **next-themes** for Dark/Light mode support

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
| `/api/payments/[id]`| PUT | Update payment (e.g. mark as PAID) |
| `/api/dashboard` | GET | Dashboard statistics |

## Quick Start

```bash
# Install dependencies
npm install

# Setup your `.env` file with your PostgreSQL connection string
# DATABASE_URL="postgresql://user:password@host/db"

# Push the database schema
npx prisma db push

# Start the development server
npm run dev
```

## Database Enums

- **EntityType**: INDIVIDUAL, COMPANY
- **DealStatus**: NEW, IN_PROGRESS, DELIVERED, CLOSED, PAID
- **ClientPaymentType**: ONE_TIME, MONTHLY, MULTI_PAYMENT
- **CommissionType**: ONE_TIME, MONTHLY, PERCENTAGE, MULTI_PAYMENT
- **PartnerPaymentType**: ONE_TIME, MONTHLY, MULTI_PAYMENT
- **PaymentType**: CLIENT_PAYMENT, SOURCE_COMMISSION, PARTNER_PAYMENT
- **PaymentStatus**: PENDING, PAID, OVERDUE

---

Built with Next.js, Prisma, and shadcn/ui.

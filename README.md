# Expense Tracker

A full-stack personal finance tracker built with Next.js, Prisma and PostgreSQL.
Log income and expenses, categorise them, split by wallet and payment method,
then filter and search across the whole history.

**Live demo:** _add your deployed URL here_

---

## Features

**Transactions**
- Create, edit and delete income and expense entries
- User-chosen transaction date, separate from the created-at timestamp
- Optional free-text note on every entry
- Amounts are stored positive; an explicit `type` field carries the sign

**Organisation**
- Categories, seeded per user and split by income/expense so an expense
  can't be filed under "Salary"
- Wallets (cash, bank, card) to track where money actually lives
- Payment method per transaction (cash or online), independent of wallet

**Finding things**
- Server-side filtering by type, category, wallet and date range
- Full-text search across description, note and category name
- Pagination at 20 rows per page
- All filter state lives in the URL, so views survive a refresh, work with
  the browser back button, and can be bookmarked or shared

**Insight**
- Income, expense and net totals that reflect the active filter rather than
  all time
- Income vs expense over time
- Spending broken down by category
- Totals aggregated in the database with Prisma `groupBy`, not by loading
  rows into the application

**Accounts**
- Email and social sign-in via Clerk
- Every query is scoped to the signed-in user

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | Clerk |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Mutations | Next.js Server Actions |

No REST or GraphQL layer — mutations go through server actions, so there are
no hand-written API routes to keep in sync with the client.

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 15 or newer
- A free Clerk account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd expense-tracker-nextjs
npm install
```

### 2. Set up PostgreSQL

On macOS with Homebrew:

```bash
brew install postgresql@15
brew services start postgresql@15
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
createdb expense_tracker
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/expense_tracker"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Get the Clerk keys from your Clerk dashboard under **API Keys**, with Next.js
selected as the framework.

> Use `.env`, not `.env.local`. Next.js reads both, but the Prisma CLI only
> reads `.env` — putting `DATABASE_URL` solely in `.env.local` makes
> `prisma db push` fail with "Environment variable not found".

### 4. Create the database tables

```bash
npx prisma generate
npx prisma db push
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default categories and a
starter wallet are created automatically on your first sign-in.

---

## Database schema

```
User
 ├── clerkUserId (unique)  ← all relations reference this, not User.id
 ├── email, name, imageUrl
 ├── categories  → Category[]
 ├── wallets     → Wallet[]
 └── transactions → Transaction[]

Category
 ├── name, icon
 ├── type: "income" | "expense"
 └── unique per (userId, name, type)

Wallet
 ├── name
 ├── type: "cash" | "bank" | "card"
 └── balance

Transaction
 ├── text, amount (always positive), note
 ├── type: "income" | "expense"     ← carries the sign
 ├── paymentMethod: "cash" | "online"
 ├── date (user-chosen)
 ├── createdAt (audit timestamp)
 ├── categoryId → Category
 └── walletId   → Wallet
```

Indexed on `[userId, date]`, `[userId, type]` and `[userId, paymentMethod]`,
so filtering stays fast as the table grows.

---

## Project structure

```
app/
  actions/          server actions — all data mutations and queries
  page.tsx          dashboard
components/
  ui/               shadcn/ui primitives
  ...               feature components
lib/
  db.ts                     Prisma client singleton
  checkUser.ts              user sync + seeds default categories/wallets
  buildTransactionWhere.ts  shared query builder
  utils.ts                  formatting helpers
prisma/
  schema.prisma
```

---

## Design notes

A few decisions that aren't obvious from the code:

**Amounts are stored positive.** The original approach encoded expenses as
negative numbers, which forced users to type a minus sign and made
aggregation awkward. A separate `type` column carries the sign instead, so
"sum all expenses" is a filter rather than a conditional.

**User scoping has exactly one entry point.** Every transaction query builds
its `where` clause through `buildTransactionWhere(userId, filters)`. The
`userId` is applied inside that function and cannot be overridden by caller
filters. Both the list query and the summary query use it, which is also why
the displayed totals can never disagree with the visible rows.

**Updates and deletes use `updateMany` / `deleteMany`.** Prisma's `update` and
`delete` require a unique `where` clause, so `userId` can't be included as a
filter — meaning a crafted request could modify another user's row. The
`*Many` variants accept non-unique fields, so a row belonging to someone else
simply matches zero records.

**Category and wallet IDs submitted from the browser are verified** against
the signed-in user before being attached to a transaction.

**Number and date formatting is computed manually**, not with
`toLocaleString` or `Intl.NumberFormat`. Those resolve locales differently on
the server and in the browser, which causes React hydration mismatches —
Node renders `100,000` while an `en-IN` browser renders `1,00,000`.

**Wallet and payment method are separate fields** on purpose. A wallet is
*where the money lives*; a payment method is *how a particular transaction
moved*. You can pay online from an account you think of as cash.

---

## Roadmap

- [ ] Budgets — monthly limit per category with over-budget warnings
- [ ] Recurring transactions and subscriptions
- [ ] Shared wallets for families
- [ ] CSV / Google Sheets export
- [ ] Deployment to Vercel with a hosted Postgres instance

---

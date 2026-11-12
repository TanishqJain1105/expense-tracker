/**
 * One-time migration for rows created before the schema change.
 *
 * Before: a single `amount` column where a negative number meant an expense.
 * After:  `amount` is always positive and `type` ("income" | "expense")
 *         carries the sign.
 *
 * Run ONCE, after `npx prisma db push`:
 *     node scripts/migrate-existing.js
 *
 * Running it twice is harmless: rows already converted have a positive
 * amount and are skipped.
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const all = await db.transaction.findMany();
  console.log(`Found ${all.length} transaction(s).`);

  let converted = 0;

  for (const t of all) {
    if (t.amount < 0) {
      await db.transaction.update({
        where: { id: t.id },
        data: { amount: Math.abs(t.amount), type: 'expense' },
      });
      converted++;
    } else if (!t.type || t.type === 'expense') {
      // Positive amount that still says "expense" is the schema default,
      // not a real classification — treat it as income.
      await db.transaction.update({
        where: { id: t.id },
        data: { type: 'income' },
      });
      converted++;
    }
  }

  console.log(`Converted ${converted} row(s).`);

  // Backfill `date` from createdAt where it was never set explicitly.
  const undated = await db.transaction.findMany({ where: { date: null } });
  for (const t of undated) {
    await db.transaction.update({
      where: { id: t.id },
      data: { date: t.createdAt },
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

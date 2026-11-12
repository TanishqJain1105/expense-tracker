export type TransactionType = 'income' | 'expense';
/** How the money moved. A separate axis from TransactionType. */
export type PaymentMethod = 'cash' | 'online';
export type WalletType = 'cash' | 'bank' | 'card';

export interface Category {
  id: string;
  name: string;
  icon: string;
  /** "income" | "expense" — string, not the union, because Prisma stores it as String. */
  type: string;
  userId: string;
}

export interface Wallet {
  id: string;
  name: string;
  /** "cash" | "bank" | "card" */
  type: string;
  balance: number;
  userId: string;
}

export interface Transaction {
  id: string;
  text: string;
  /** Always positive. `type` carries the sign. */
  amount: number;
  note: string | null;
  /** "income" | "expense" */
  type: string;
  /** "cash" | "online" */
  paymentMethod: string;
  /** User-chosen date, distinct from createdAt. */
  date: Date;
  categoryId: string | null;
  walletId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  /** Present when the query includes the relation; null when unset. */
  category?: Category | null;
  wallet?: Wallet | null;
}

/** Income, expense and net for whatever filter is active. */
export interface Summary {
  income: number;
  expense: number;
  net: number;
  /** Totals by how the money moved. cash + online === income + expense. */
  cash: number;
  online: number;
}

/**
 * Filter state, parsed out of the URL search params by `parseFilters`.
 * Every field is optional so callers can pass `{}` for "no filter".
 * Note that `userId` is deliberately NOT part of this shape — scoping is
 * applied inside `buildTransactionWhere` and cannot be set by a caller.
 */
export interface TransactionFilters {
  type?: string;
  /** "cash" | "online" */
  paymentMethod?: string;
  categoryId?: string;
  walletId?: string;
  /** ISO date string, inclusive. */
  from?: string;
  /** ISO date string, inclusive of the whole end day. */
  to?: string;
  /** Free-text search over description, note and category name. */
  q?: string;
  page?: number;
}

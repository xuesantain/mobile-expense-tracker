import { Account, Category, Transaction } from "../types";

export function categorySpend(transactions: Transaction[], categories: Category[], month: string) {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense" || !transaction.date.startsWith(month)) {
      continue;
    }
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
  }

  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: names.get(categoryId) ?? "Uncategorized",
      amount: Math.round(amount * 100) / 100
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function accountFlow(transactions: Transaction[], accounts: Account[], month: string) {
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  const totals = new Map<string, { expense: number; income: number }>();

  for (const transaction of transactions) {
    if (!transaction.date.startsWith(month)) {
      continue;
    }
    const current = totals.get(transaction.accountId) ?? { expense: 0, income: 0 };
    current[transaction.type] += transaction.amount;
    totals.set(transaction.accountId, current);
  }

  return [...totals.entries()].map(([accountId, values]) => ({
    accountId,
    accountName: names.get(accountId) ?? "Unknown account",
    expense: Math.round(values.expense * 100) / 100,
    income: Math.round(values.income * 100) / 100
  }));
}

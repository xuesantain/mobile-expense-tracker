import { Budget, Transaction } from "../types";

export function calculateBudgetUsage(transactions: Transaction[], budgets: Budget[], month: string) {
  const monthExpenses = transactions
    .filter((item) => item.type === "expense" && item.date.startsWith(month))
    .reduce((total, item) => total + item.amount, 0);

  const monthBudget = budgets
    .filter((budget) => budget.month === month && budget.categoryId === null)
    .reduce((total, budget) => total + budget.amount, 0);

  return {
    monthExpenses: Math.round(monthExpenses * 100) / 100,
    monthBudget: Math.round(monthBudget * 100) / 100,
    remaining: monthBudget > 0 ? Math.round((monthBudget - monthExpenses) * 100) / 100 : null
  };
}

import { calculateBudgetUsage } from "../src/utils/budget";
import { Budget, Transaction } from "../src/types";

const transactions: Transaction[] = [
  {
    id: "1",
    amount: 30,
    type: "expense",
    categoryId: "cat-food",
    accountId: "acc-wechat",
    date: "2026-05-01",
    note: "",
    merchant: "Lunch",
    source: "manual",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z"
  },
  {
    id: "2",
    amount: 100,
    type: "income",
    categoryId: "cat-salary",
    accountId: "acc-card",
    date: "2026-05-02",
    note: "",
    merchant: "Salary",
    source: "manual",
    createdAt: "2026-05-02T00:00:00.000Z",
    updatedAt: "2026-05-02T00:00:00.000Z"
  }
];

const budgets: Budget[] = [{ id: "2026-05-all", month: "2026-05", categoryId: null, amount: 500 }];

describe("budget utilities", () => {
  it("calculates monthly budget usage from expense transactions only", () => {
    expect(calculateBudgetUsage(transactions, budgets, "2026-05")).toEqual({
      monthExpenses: 30,
      monthBudget: 500,
      remaining: 470
    });
  });
});

import { defaultAccounts, defaultCategories } from "../src/data/defaults";
import { Transaction } from "../src/types";
import { accountFlow, categorySpend } from "../src/utils/stats";

const transactions: Transaction[] = [
  {
    id: "1",
    amount: 42,
    type: "expense",
    categoryId: "cat-food",
    accountId: "acc-wechat",
    date: "2026-05-10",
    note: "",
    merchant: "Dinner",
    source: "manual",
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z"
  },
  {
    id: "2",
    amount: 12,
    type: "expense",
    categoryId: "cat-transport",
    accountId: "acc-wechat",
    date: "2026-05-11",
    note: "",
    merchant: "Metro",
    source: "manual",
    createdAt: "2026-05-11T00:00:00.000Z",
    updatedAt: "2026-05-11T00:00:00.000Z"
  }
];

describe("statistics utilities", () => {
  it("groups category spend for the selected month", () => {
    expect(categorySpend(transactions, defaultCategories, "2026-05")[0]).toMatchObject({
      categoryId: "cat-food",
      categoryName: "餐饮",
      amount: 42
    });
  });

  it("groups account flow for the selected month", () => {
    expect(accountFlow(transactions, defaultAccounts, "2026-05")[0]).toMatchObject({
      accountId: "acc-wechat",
      expense: 54,
      income: 0
    });
  });
});

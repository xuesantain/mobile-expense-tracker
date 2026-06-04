import { defaultAccounts, defaultCategories } from "../src/data/defaults";
import { Transaction } from "../src/types";
import { transactionsToCsv } from "../src/utils/csv";

const transactions: Transaction[] = [
  {
    id: "txn-1",
    amount: 18,
    type: "expense",
    categoryId: "cat-food",
    accountId: "acc-wechat",
    date: "2026-05-31",
    note: "午饭",
    merchant: "依八台自选煲仔饭",
    source: "manual",
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z"
  },
  {
    id: "txn-2",
    amount: 344,
    type: "income",
    categoryId: "cat-salary",
    accountId: "acc-card",
    date: "2026-05-30",
    note: "兼职,结算",
    merchant: "工资",
    source: "manual",
    createdAt: "2026-05-30T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z"
  }
];

describe("csv export utilities", () => {
  it("exports human-readable category and account names", () => {
    const csv = transactionsToCsv(transactions, defaultCategories, defaultAccounts);

    expect(csv).toContain("type_label");
    expect(csv).toContain("餐饮");
    expect(csv).toContain("微信支付");
    expect(csv).toContain("收入");
    expect(csv).toContain("工资");
  });

  it("quotes cells containing commas", () => {
    const csv = transactionsToCsv(transactions, defaultCategories, defaultAccounts);

    expect(csv).toContain("\"兼职,结算\"");
  });
});

import { Account, Category, Transaction } from "../types";

export function transactionsToCsv(transactions: Transaction[], categories: Category[], accounts: Account[]): string {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const header = ["date", "type", "type_label", "amount", "category", "account", "merchant", "note", "source", "category_id", "account_id"];
  const rows = transactions.map((item) =>
    [
      item.date,
      item.type,
      item.type === "income" ? "收入" : "支出",
      item.amount,
      categoryNames.get(item.categoryId) ?? "",
      accountNames.get(item.accountId) ?? "",
      item.merchant,
      item.note,
      item.source,
      item.categoryId,
      item.accountId
    ]
      .map(csvCell)
      .join(",")
  );
  return `\uFEFF${[header.join(","), ...rows].join("\n")}`;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

import * as SQLite from "expo-sqlite";
import {
  Account,
  AppSettings,
  Budget,
  Category,
  DashboardSummary,
  ManageableAccount,
  ManageableCategory,
  ReceiptScan,
  Transaction,
  TransactionFilters
} from "../types";
import { defaultAccounts, defaultCategories } from "./defaults";
import { currentMonth, monthRange } from "../utils/date";

export type ExpenseDatabase = SQLite.SQLiteDatabase;

export async function openExpenseDatabase(): Promise<ExpenseDatabase> {
  const db = await SQLite.openDatabaseAsync("expense-tracker.db");
  await migrate(db);
  await seedDefaults(db);
  return db;
}

export async function migrate(db: ExpenseDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      category_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      merchant TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL CHECK(source IN ('manual', 'ocr')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      month TEXT NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_month_category
      ON budgets(month, COALESCE(category_id, 'all'));
    CREATE TABLE IF NOT EXISTS receipt_scans (
      id TEXT PRIMARY KEY NOT NULL,
      image_uri TEXT,
      raw_text TEXT NOT NULL,
      parsed_amount REAL,
      parsed_date TEXT,
      parsed_merchant TEXT,
      parsed_category_id TEXT,
      transaction_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(parsed_category_id) REFERENCES categories(id),
      FOREIGN KEY(transaction_id) REFERENCES transactions(id)
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export async function seedDefaults(db: ExpenseDatabase): Promise<void> {
  for (const category of defaultCategories) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (id, name, type, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
      category.id,
      category.name,
      category.type,
      category.icon,
      category.sortOrder
    );
  }

  for (const account of defaultAccounts) {
    await db.runAsync(
      "INSERT OR IGNORE INTO accounts (id, name, icon, sort_order) VALUES (?, ?, ?, ?)",
      account.id,
      account.name,
      account.icon,
      account.sortOrder
    );
  }

  await localizeDefaultNames(db);
}

export async function listCategories(db: ExpenseDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<DbCategory>("SELECT * FROM categories ORDER BY type, sort_order, name");
  return rows.map(mapCategory);
}

export async function listAccounts(db: ExpenseDatabase): Promise<Account[]> {
  const rows = await db.getAllAsync<DbAccount>("SELECT * FROM accounts ORDER BY sort_order, name");
  return rows.map(mapAccount);
}

export async function saveCategory(db: ExpenseDatabase, input: ManageableCategory): Promise<Category> {
  const category: Category = {
    id: input.id ?? makeId("cat"),
    name: input.name.trim(),
    type: input.type,
    icon: input.icon.trim() || "pricetag",
    sortOrder: await nextSortOrder(db, "categories", input.type)
  };

  if (input.id) {
    await db.runAsync(
      "UPDATE categories SET name = ?, type = ?, icon = ? WHERE id = ?",
      category.name,
      category.type,
      category.icon,
      category.id
    );
    const saved = await getCategory(db, category.id);
    return saved ?? category;
  }

  await db.runAsync(
    "INSERT INTO categories (id, name, type, icon, sort_order) VALUES (?, ?, ?, ?, ?)",
    category.id,
    category.name,
    category.type,
    category.icon,
    category.sortOrder
  );
  return category;
}

export async function deleteCategory(db: ExpenseDatabase, id: string): Promise<boolean> {
  const usage = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?", id);
  if ((usage?.count ?? 0) > 0) {
    return false;
  }
  await db.runAsync("DELETE FROM budgets WHERE category_id = ?", id);
  await db.runAsync("DELETE FROM categories WHERE id = ?", id);
  return true;
}

export async function saveAccount(db: ExpenseDatabase, input: ManageableAccount): Promise<Account> {
  const account: Account = {
    id: input.id ?? makeId("acc"),
    name: input.name.trim(),
    icon: input.icon.trim() || "wallet",
    sortOrder: await nextSortOrder(db, "accounts")
  };

  if (input.id) {
    await db.runAsync("UPDATE accounts SET name = ?, icon = ? WHERE id = ?", account.name, account.icon, account.id);
    const saved = await getAccount(db, account.id);
    return saved ?? account;
  }

  await db.runAsync(
    "INSERT INTO accounts (id, name, icon, sort_order) VALUES (?, ?, ?, ?)",
    account.id,
    account.name,
    account.icon,
    account.sortOrder
  );
  return account;
}

export async function listBudgets(db: ExpenseDatabase, month = currentMonth()): Promise<Budget[]> {
  const rows = await db.getAllAsync<DbBudget>("SELECT * FROM budgets WHERE month = ? ORDER BY category_id", month);
  return rows.map(mapBudget);
}

export async function upsertBudget(db: ExpenseDatabase, budget: Omit<Budget, "id">): Promise<void> {
  const id = budget.categoryId ? `${budget.month}-${budget.categoryId}` : `${budget.month}-all`;
  await db.runAsync(
    `INSERT INTO budgets (id, month, category_id, amount)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET amount = excluded.amount`,
    id,
    budget.month,
    budget.categoryId,
    budget.amount
  );
}

export async function listTransactions(db: ExpenseDatabase, filters?: Partial<TransactionFilters> | string): Promise<Transaction[]> {
  const normalized = typeof filters === "string" ? { query: filters } : filters ?? {};
  const where: string[] = [];
  const params: Array<string | number> = [];
  const query = normalized.query?.trim() ?? "";

  if (query) {
    where.push("(note LIKE ? OR merchant LIKE ?)");
    const like = `%${query}%`;
    params.push(like, like);
  }
  if (normalized.type && normalized.type !== "all") {
    where.push("type = ?");
    params.push(normalized.type);
  }
  if (normalized.categoryId) {
    where.push("category_id = ?");
    params.push(normalized.categoryId);
  }
  if (normalized.accountId) {
    where.push("account_id = ?");
    params.push(normalized.accountId);
  }
  if (normalized.startDate) {
    where.push("date >= ?");
    params.push(normalized.startDate);
  }
  if (normalized.endDate) {
    where.push("date <= ?");
    params.push(normalized.endDate);
  }

  const sql = `SELECT * FROM transactions ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY date DESC, created_at DESC LIMIT 500`;
  const rows = await db.getAllAsync<DbTransaction>(sql, ...params);
  return rows.map(mapTransaction);
}

export async function addTransaction(
  db: ExpenseDatabase,
  input: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...input,
    id: makeId("txn"),
    amount: Math.round(input.amount * 100) / 100,
    createdAt: now,
    updatedAt: now
  };

  await db.runAsync(
    `INSERT INTO transactions
      (id, amount, type, category_id, account_id, date, note, merchant, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id,
    transaction.amount,
    transaction.type,
    transaction.categoryId,
    transaction.accountId,
    transaction.date,
    transaction.note,
    transaction.merchant,
    transaction.source,
    transaction.createdAt,
    transaction.updatedAt
  );

  return transaction;
}

export async function deleteTransaction(db: ExpenseDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM transactions WHERE id = ?", id);
}

export async function updateTransaction(
  db: ExpenseDatabase,
  id: string,
  input: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<void> {
  await db.runAsync(
    `UPDATE transactions
     SET amount = ?, type = ?, category_id = ?, account_id = ?, date = ?, note = ?, merchant = ?, source = ?, updated_at = ?
     WHERE id = ?`,
    Math.round(input.amount * 100) / 100,
    input.type,
    input.categoryId,
    input.accountId,
    input.date,
    input.note,
    input.merchant,
    input.source,
    new Date().toISOString(),
    id
  );
}

export async function saveReceiptScan(
  db: ExpenseDatabase,
  input: Omit<ReceiptScan, "id" | "createdAt">
): Promise<ReceiptScan> {
  const scan: ReceiptScan = {
    ...input,
    id: makeId("scan"),
    createdAt: new Date().toISOString()
  };

  await db.runAsync(
    `INSERT INTO receipt_scans
      (id, image_uri, raw_text, parsed_amount, parsed_date, parsed_merchant, parsed_category_id, transaction_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    scan.id,
    scan.imageUri,
    scan.rawText,
    scan.parsedAmount,
    scan.parsedDate,
    scan.parsedMerchant,
    scan.parsedCategoryId,
    scan.transactionId,
    scan.createdAt
  );

  return scan;
}

export async function linkReceiptScan(db: ExpenseDatabase, scanId: string, transactionId: string): Promise<void> {
  await db.runAsync("UPDATE receipt_scans SET transaction_id = ? WHERE id = ?", transactionId, scanId);
}

export async function getDashboardSummary(db: ExpenseDatabase, month = currentMonth()): Promise<DashboardSummary> {
  const { start, end } = monthRange(month);
  const totals = await db.getAllAsync<{ type: string; total: number }>(
    `SELECT type, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE date BETWEEN ? AND ?
     GROUP BY type`,
    start,
    end
  );
  const budget = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM budgets WHERE month = ? AND category_id IS NULL",
    month
  );
  const monthExpense = totals.find((row) => row.type === "expense")?.total ?? 0;
  const monthIncome = totals.find((row) => row.type === "income")?.total ?? 0;
  const monthBudget = budget?.total ?? 0;

  return {
    monthExpense,
    monthIncome,
    monthBudget,
    remainingBudget: monthBudget > 0 ? Math.round((monthBudget - monthExpense) * 100) / 100 : null
  };
}

export async function exportTransactionsCsv(db: ExpenseDatabase): Promise<string> {
  const transactionRows = await db.getAllAsync<DbTransaction>("SELECT * FROM transactions ORDER BY date DESC, created_at DESC");
  const transactions = transactionRows.map(mapTransaction);
  const header = ["date", "type", "amount", "category_id", "account_id", "merchant", "note", "source"];
  const csvRows = transactions.map((item) =>
    [item.date, item.type, item.amount, item.categoryId, item.accountId, item.merchant, item.note, item.source]
      .map(csvCell)
      .join(",")
  );
  return `\uFEFF${[header.join(","), ...csvRows].join("\n")}`;
}

export async function getAppSettings(db: ExpenseDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>("SELECT key, value FROM app_settings");
  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    qwenApiKey: values.get("qwenApiKey") ?? "",
    receiptImageProvider: normalizeReceiptImageProvider(values.get("receiptImageProvider"))
  };
}

export async function saveAppSettings(db: ExpenseDatabase, settings: AppSettings): Promise<void> {
  await setSetting(db, "qwenApiKey", settings.qwenApiKey.trim());
  await setSetting(db, "receiptImageProvider", settings.receiptImageProvider);
}

async function setSetting(db: ExpenseDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

function normalizeReceiptImageProvider(value: string | undefined): AppSettings["receiptImageProvider"] {
  return value === "qwen" ? "qwen" : "qwen";
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getCategory(db: ExpenseDatabase, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<DbCategory>("SELECT * FROM categories WHERE id = ?", id);
  return row ? mapCategory(row) : null;
}

async function getAccount(db: ExpenseDatabase, id: string): Promise<Account | null> {
  const row = await db.getFirstAsync<DbAccount>("SELECT * FROM accounts WHERE id = ?", id);
  return row ? mapAccount(row) : null;
}

async function nextSortOrder(db: ExpenseDatabase, table: "categories" | "accounts", type?: string): Promise<number> {
  const row =
    table === "categories" && type
      ? await db.getFirstAsync<{ next_order: number }>(
          "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM categories WHERE type = ?",
          type
        )
      : await db.getFirstAsync<{ next_order: number }>(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM ${table}`);
  return row?.next_order ?? 1;
}

async function localizeDefaultNames(db: ExpenseDatabase): Promise<void> {
  const oldCategoryNames: Record<string, string> = {
    "cat-food": "Food",
    "cat-transport": "Transport",
    "cat-shopping": "Shopping",
    "cat-home": "Home",
    "cat-health": "Health",
    "cat-fun": "Fun",
    "cat-other-expense": "Other expense",
    "cat-salary": "Salary",
    "cat-refund": "Refund",
    "cat-other-income": "Other income"
  };
  const oldAccountNames: Record<string, string> = {
    "acc-cash": "Cash",
    "acc-wechat": "WeChat Pay",
    "acc-alipay": "Alipay",
    "acc-card": "Bank card"
  };

  for (const category of defaultCategories) {
    await db.runAsync("UPDATE categories SET name = ? WHERE id = ? AND name = ?", category.name, category.id, oldCategoryNames[category.id] ?? "");
  }
  for (const account of defaultAccounts) {
    await db.runAsync("UPDATE accounts SET name = ? WHERE id = ? AND name = ?", account.name, account.id, oldAccountNames[account.id] ?? "");
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

type DbCategory = { id: string; name: string; type: "expense" | "income"; icon: string; sort_order: number };
type DbAccount = { id: string; name: string; icon: string; sort_order: number };
type DbBudget = { id: string; month: string; category_id: string | null; amount: number };
type DbTransaction = {
  id: string;
  amount: number;
  type: "expense" | "income";
  category_id: string;
  account_id: string;
  date: string;
  note: string;
  merchant: string;
  source: "manual" | "ocr";
  created_at: string;
  updated_at: string;
};

function mapCategory(row: DbCategory): Category {
  return { id: row.id, name: row.name, type: row.type, icon: row.icon, sortOrder: row.sort_order };
}

function mapAccount(row: DbAccount): Account {
  return { id: row.id, name: row.name, icon: row.icon, sortOrder: row.sort_order };
}

function mapBudget(row: DbBudget): Budget {
  return { id: row.id, month: row.month, categoryId: row.category_id, amount: row.amount };
}

function mapTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    categoryId: row.category_id,
    accountId: row.account_id,
    date: row.date,
    note: row.note,
    merchant: row.merchant,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

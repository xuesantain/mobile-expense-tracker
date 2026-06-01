export type TransactionType = "expense" | "income";

export type TransactionSource = "manual" | "ocr";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  sortOrder: number;
};

export type Account = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
  note: string;
  merchant: string;
  source: TransactionSource;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  month: string;
  categoryId: string | null;
  amount: number;
};

export type ReceiptScan = {
  id: string;
  imageUri: string | null;
  rawText: string;
  parsedAmount: number | null;
  parsedDate: string | null;
  parsedMerchant: string | null;
  parsedCategoryId: string | null;
  transactionId: string | null;
  createdAt: string;
};

export type ReceiptImportCandidate = {
  id: string;
  imageUri: string | null;
  rawText: string;
  amount: number | null;
  type: TransactionType;
  categoryId: string | null;
  accountId: string | null;
  date: string | null;
  time: string | null;
  merchant: string | null;
  note: string;
  confidence: number;
  duplicateOfTransactionId: string | null;
  duplicateReason: string | null;
  selected: boolean;
};

export type DraftTransaction = {
  amount: string;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string;
  note: string;
  merchant: string;
  source: TransactionSource;
};

export type TransactionFilters = {
  query: string;
  type: "all" | TransactionType;
  categoryId: string;
  accountId: string;
  startDate: string;
  endDate: string;
};

export type ReceiptImageProvider = "qwen";

export type AppSettings = {
  qwenApiKey: string;
  receiptImageProvider: ReceiptImageProvider;
};

export type ManageableCategory = Omit<Category, "id" | "sortOrder"> & {
  id?: string;
};

export type ManageableAccount = Omit<Account, "id" | "sortOrder"> & {
  id?: string;
};

export type DashboardSummary = {
  monthExpense: number;
  monthIncome: number;
  monthBudget: number;
  remainingBudget: number | null;
};

export type CategorySpend = {
  categoryId: string;
  categoryName: string;
  amount: number;
};

export type MonthlySpend = {
  month: string;
  expense: number;
  income: number;
};

export type AccountFlow = {
  accountId: string;
  accountName: string;
  expense: number;
  income: number;
};

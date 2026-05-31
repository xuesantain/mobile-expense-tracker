import { Account, Category, ReceiptImportCandidate, Transaction, TransactionType } from "../types";
import { parseReceiptText } from "./ocr";

export type StructuredReceiptItem = {
  amount: number | null;
  type?: TransactionType;
  merchant: string | null;
  date: string | null;
  time?: string | null;
  categoryName?: string | null;
  accountName?: string | null;
  note?: string | null;
  confidence?: number;
};

export function candidatesFromReceiptText({
  rawText,
  imageUri,
  categories,
  accounts,
  existingTransactions,
  structuredItems
}: {
  rawText: string;
  imageUri: string | null;
  categories: Category[];
  accounts: Account[];
  existingTransactions: Transaction[];
  structuredItems?: StructuredReceiptItem[];
}): ReceiptImportCandidate[] {
  const items = structuredItems?.length ? structuredItems : [fallbackStructuredItem(rawText, categories)];

  return items.map((item, index) => {
    const categoryId = resolveCategoryId(item, categories);
    const accountId = resolveAccountId(item, accounts);
    const candidate: ReceiptImportCandidate = {
      id: makeCandidateId(rawText, imageUri, index),
      imageUri,
      rawText,
      amount: normalizeAmount(item.amount),
      type: item.type ?? "expense",
      categoryId,
      accountId,
      date: item.date,
      time: item.time ?? null,
      merchant: item.merchant,
      note: item.note?.trim() || "截图识别",
      confidence: item.confidence ?? 0.65,
      duplicateOfTransactionId: null,
      duplicateReason: null,
      selected: true
    };
    const duplicate = findDuplicateTransaction(candidate, existingTransactions);
    return duplicate
      ? {
          ...candidate,
          duplicateOfTransactionId: duplicate.id,
          duplicateReason: "金额、日期和商户与已有账单接近",
          selected: false
        }
      : candidate;
  });
}

export function findDuplicateTransaction(candidate: ReceiptImportCandidate, transactions: Transaction[]): Transaction | null {
  if (!candidate.amount || !candidate.date) {
    return null;
  }

  return (
    transactions.find((transaction) => {
      if (transaction.type !== candidate.type || transaction.date !== candidate.date) {
        return false;
      }
      if (Math.abs(transaction.amount - candidate.amount!) > 0.01) {
        return false;
      }
      const left = normalizeText(transaction.merchant || transaction.note);
      const right = normalizeText(candidate.merchant || candidate.note);
      return Boolean(left && right && (left.includes(right) || right.includes(left) || similarity(left, right) >= 0.55));
    }) ?? null
  );
}

export function parseStructuredReceiptItemsFromJson(text: string): StructuredReceiptItem[] {
  const parsed = JSON.parse(extractJson(text)) as unknown;
  const records = Array.isArray(parsed) ? parsed : isRecordObject(parsed) && Array.isArray(parsed.records) ? parsed.records : [];

  return records
    .filter(isRecordObject)
    .map((item): StructuredReceiptItem => {
      const type: TransactionType = item.type === "income" ? "income" : "expense";
      return {
        amount: typeof item.amount === "number" ? item.amount : typeof item.amount === "string" ? Number(item.amount) : null,
        type,
        merchant: typeof item.merchant === "string" ? item.merchant : null,
        date: typeof item.date === "string" ? item.date : null,
        time: typeof item.time === "string" ? item.time : null,
        categoryName: typeof item.categoryName === "string" ? item.categoryName : null,
        accountName: typeof item.accountName === "string" ? item.accountName : null,
        note: typeof item.note === "string" ? item.note : null,
        confidence: typeof item.confidence === "number" ? item.confidence : undefined
      };
    })
    .filter((item) => item.amount !== null || item.merchant || item.date);
}

function fallbackStructuredItem(rawText: string, categories: Category[]): StructuredReceiptItem {
  const candidate = parseReceiptText(rawText, categories);
  return {
    amount: candidate.amount,
    type: "expense",
    merchant: candidate.merchant,
    date: candidate.date,
    categoryName: null,
    accountName: null,
    note: "截图识别",
    confidence: candidate.amount && candidate.date ? 0.7 : 0.45
  };
}

function resolveCategoryId(item: StructuredReceiptItem, categories: Category[]): string | null {
  if (item.categoryName) {
    const matched = categories.find((category) => category.name.includes(item.categoryName!) || item.categoryName!.includes(category.name));
    if (matched) {
      return matched.id;
    }
  }
  return fallbackStructuredItem([item.merchant, item.note, item.categoryName].filter(Boolean).join("\n"), categories).categoryName
    ? null
    : parseReceiptText([item.merchant, item.note, item.categoryName].filter(Boolean).join("\n"), categories).categoryId;
}

function resolveAccountId(item: StructuredReceiptItem, accounts: Account[]): string | null {
  if (item.accountName) {
    const matched = accounts.find((account) => account.name.includes(item.accountName!) || item.accountName!.includes(account.name));
    if (matched) {
      return matched.id;
    }
  }
  return accounts[0]?.id ?? null;
}

function normalizeAmount(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
}

function similarity(left: string, right: string): number {
  const leftSet = new Set([...left]);
  const rightSet = new Set([...right]);
  const intersection = [...leftSet].filter((char) => rightSet.has(char)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? intersection / union : 0;
}

function makeCandidateId(rawText: string, imageUri: string | null, index: number): string {
  return `candidate-${index}-${hash(`${imageUri ?? ""}:${rawText}`)}`;
}

function hash(value: string): string {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(result).toString(16);
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    return fenced[1].trim();
  }
  const start = Math.min(...["[", "{"].map((char) => text.indexOf(char)).filter((index) => index >= 0));
  if (!Number.isFinite(start)) {
    return text;
  }
  return text.slice(start);
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

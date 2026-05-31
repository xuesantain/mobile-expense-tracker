import { Category } from "../types";

export type OcrCandidate = {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  categoryId: string | null;
  rawText: string;
};

const categoryKeywords: Array<{ categoryId: string; keywords: string[] }> = [
  { categoryId: "cat-food", keywords: ["food", "meal", "lunch", "dinner", "coffee", "restaurant", "starbucks", "luckin", "mcdonald", "餐", "咖啡", "饭", "茶", "瑞幸"] },
  { categoryId: "cat-transport", keywords: ["bus", "metro", "subway", "taxi", "train", "flight", "didi", "uber", "公交", "地铁", "打车", "滴滴", "火车"] },
  { categoryId: "cat-shopping", keywords: ["shop", "mall", "market", "store", "supermarket", "amazon", "taobao", "jd", "购物", "超市", "淘宝", "京东", "商场"] },
  { categoryId: "cat-health", keywords: ["hospital", "clinic", "drug", "medicine", "pharmacy", "health", "医院", "药", "医疗", "诊所"] },
  { categoryId: "cat-fun", keywords: ["movie", "cinema", "game", "subscription", "entertainment", "电影", "游戏", "会员", "娱乐"] }
];

export function parseReceiptText(rawText: string, categories: Category[]): OcrCandidate {
  const text = rawText.trim();

  return {
    amount: extractAmount(text),
    date: extractDate(text),
    merchant: extractMerchant(text),
    categoryId: inferCategory(text, categories),
    rawText
  };
}

export function extractAmount(text: string): number | null {
  const preferred = text.match(/(?:paid|pay|payment|total|amount|actual|charged|spent|实付|应付|合计|总计|金额)[^\d]{0,12}(\d+(?:\.\d{1,2})?)/i);
  const matches = [...text.matchAll(/(?:CNY|RMB|USD|\$)?\s*(\d+(?:\.\d{1,2})?)/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (preferred) {
    return roundMoney(Number(preferred[1]));
  }

  if (!matches.length) {
    return null;
  }

  return roundMoney(Math.max(...matches));
}

export function extractDate(text: string): string | null {
  const full = text.match(/(20\d{2})[/. -](\d{1,2})[/. -](\d{1,2})/);
  if (full) {
    return `${full[1]}-${full[2].padStart(2, "0")}-${full[3].padStart(2, "0")}`;
  }

  const short = text.match(/\b(\d{1,2})[/. -](\d{1,2})\b/);
  if (short) {
    const year = new Date().getFullYear();
    return `${year}-${short[1].padStart(2, "0")}-${short[2].padStart(2, "0")}`;
  }

  return null;
}

export function extractMerchant(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const explicit = lines.find((line) => /merchant|store|shop|payee|商户|门店|店铺|收款方/i.test(line));
  if (explicit) {
    return explicit.replace(/^(merchant|store|shop|payee|商户|门店|店铺|收款方)[:：\s-]*/i, "").slice(0, 32);
  }

  const firstUseful = lines.find((line) => !/\d{4}[/. -]\d{1,2}/.test(line) && !/total|amount|paid|payment|实付|支付|付款|合计|总计/i.test(line));
  return firstUseful ? firstUseful.slice(0, 32) : null;
}

export function inferCategory(text: string, categories: Category[]): string | null {
  const lowered = text.toLowerCase();
  const matched = categoryKeywords.find((item) => item.keywords.some((keyword) => lowered.includes(keyword)));

  if (matched && categories.some((category) => category.id === matched.categoryId)) {
    return matched.categoryId;
  }

  return categories.find((category) => category.type === "expense" && category.id === "cat-other-expense")?.id ?? null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

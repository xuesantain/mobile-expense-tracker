import { Category, Account } from "../types";
import { parseStructuredReceiptItemsFromJson, StructuredReceiptItem } from "../utils/receiptImport";

const deepSeekApiUrl = "https://api.deepseek.com/chat/completions";

export async function structureReceiptTextWithDeepSeek({
  apiKey,
  rawText,
  categories,
  accounts
}: {
  apiKey: string;
  rawText: string;
  categories: Category[];
  accounts: Account[];
}): Promise<StructuredReceiptItem[]> {
  if (!apiKey.trim()) {
    return [];
  }

  const response = await fetch(deepSeekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是记账截图解析器。只返回 JSON，不要解释。把微信/支付宝/账单截图 OCR 文本解析为 records 数组。字段：amount(number|null), type('expense'|'income'), merchant(string|null), date('YYYY-MM-DD'|null), time('HH:mm'|null), categoryName(string|null), accountName(string|null), note(string|null), confidence(number 0-1)。如果文本里有多条交易，返回多条。"
        },
        {
          role: "user",
          content: JSON.stringify({
            rawText,
            allowedCategories: categories.map((item) => item.name),
            allowedAccounts: accounts.map((item) => item.name)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek 解析失败：${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  return parseStructuredReceiptItemsFromJson(content);
}

export async function testDeepSeekApiKey(apiKey: string): Promise<void> {
  const response = await fetch(deepSeekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "只回复 OK" }]
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek Key 测试失败：${response.status}`);
  }
}

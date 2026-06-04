import { defaultAccounts, defaultCategories } from "../src/data/defaults";
import { Transaction } from "../src/types";
import { candidatesFromReceiptText, parseStructuredReceiptItemsFromJson } from "../src/utils/receiptImport";

const existingTransactions: Transaction[] = [
  {
    id: "txn-existing",
    amount: 10.5,
    type: "expense",
    categoryId: "cat-food",
    accountId: "acc-wechat",
    date: "2026-05-31",
    note: "",
    merchant: "luckin coffee",
    source: "manual",
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z"
  }
];

describe("receipt import utilities", () => {
  it("parses structured JSON records from model output", () => {
    const items = parseStructuredReceiptItemsFromJson(
      JSON.stringify({
        records: [
          {
            amount: 115.7,
            type: "expense",
            merchant: "依八台自选煲仔饭",
            date: "2026-05-31",
            time: "18:34",
            categoryName: "餐饮",
            accountName: "微信支付",
            confidence: 0.92
          }
        ]
      })
    );

    expect(items[0]).toMatchObject({
      amount: 115.7,
      merchant: "依八台自选煲仔饭",
      date: "2026-05-31",
      categoryName: "餐饮"
    });
  });

  it("resolves structured category and account names", () => {
    const candidates = candidatesFromReceiptText({
      rawText: "依八台自选煲仔饭\n2026-05-31\n实付 115.70",
      imageUri: "file://receipt.jpg",
      categories: defaultCategories,
      accounts: defaultAccounts,
      existingTransactions: [],
      structuredItems: [
        {
          amount: 115.7,
          type: "expense",
          merchant: "依八台自选煲仔饭",
          date: "2026-05-31",
          categoryName: "餐饮",
          accountName: "微信支付"
        }
      ]
    });

    expect(candidates[0]).toMatchObject({
      categoryId: "cat-food",
      accountId: "acc-wechat",
      selected: true
    });
  });

  it("marks duplicate screenshot candidates as unselected", () => {
    const candidates = candidatesFromReceiptText({
      rawText: "luckin coffee\n2026-05-31\n实付 10.50",
      imageUri: "file://receipt.jpg",
      categories: defaultCategories,
      accounts: defaultAccounts,
      existingTransactions,
      structuredItems: [
        {
          amount: 10.5,
          type: "expense",
          merchant: "luckin coffee",
          date: "2026-05-31",
          categoryName: "餐饮",
          accountName: "微信支付"
        }
      ]
    });

    expect(candidates[0]).toMatchObject({
      duplicateOfTransactionId: "txn-existing",
      selected: false
    });
  });
});

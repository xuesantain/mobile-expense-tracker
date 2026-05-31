import { defaultCategories } from "../src/data/defaults";
import { extractAmount, extractDate, extractMerchant, parseReceiptText } from "../src/utils/ocr";

describe("OCR parsing", () => {
  it("extracts amount from payment-like text", () => {
    expect(extractAmount("Starbucks\nPaid 32.00\nDiscount 3.00")).toBe(32);
  });

  it("falls back to the largest positive amount", () => {
    expect(extractAmount("Unit 8.00\nQty 2\nSubtotal 16.00")).toBe(16);
  });

  it("extracts full and short dates", () => {
    expect(extractDate("Payment time 2026-05-30 12:20")).toBe("2026-05-30");
    expect(extractDate("5/3 lunch")).toMatch(/^\d{4}-05-03$/);
  });

  it("extracts merchant names", () => {
    expect(extractMerchant("Merchant: Family Mart\nPaid 18.90")).toBe("Family Mart");
  });

  it("infers a food category from receipt text", () => {
    const candidate = parseReceiptText("Luckin Coffee\nPaid 19.90", defaultCategories);
    expect(candidate.categoryId).toBe("cat-food");
    expect(candidate.amount).toBe(19.9);
  });

  it("parses common Chinese receipt text", () => {
    const candidate = parseReceiptText("商户：瑞幸咖啡\n付款时间 2026-05-30\n实付 32.00", defaultCategories);
    expect(candidate.categoryId).toBe("cat-food");
    expect(candidate.amount).toBe(32);
    expect(candidate.merchant).toBe("瑞幸咖啡");
  });

  it("keeps empty OCR text as nullable candidates", () => {
    const candidate = parseReceiptText("", defaultCategories);
    expect(candidate.amount).toBeNull();
    expect(candidate.date).toBeNull();
    expect(candidate.merchant).toBeNull();
    expect(candidate.categoryId).toBe("cat-other-expense");
  });
});

import { formatMoney, parseAmount } from "../src/utils/money";

describe("money utilities", () => {
  it("parses user-entered amounts", () => {
    expect(parseAmount("28.50")).toBe(28.5);
    expect(parseAmount("CNY 1,299.99")).toBe(1299.99);
    expect(parseAmount("abc")).toBe(0);
  });

  it("formats RMB values", () => {
    expect(formatMoney(12)).toBe("¥12.00");
    expect(formatMoney(12.3)).toBe("¥12.30");
  });
});

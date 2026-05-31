export function parseAmount(value: string): number {
  const normalized = value.replace(/[^\d.]/g, "");
  if (!normalized) {
    return 0;
  }
  const pieces = normalized.split(".");
  const merged = pieces.length > 2 ? `${pieces[0]}.${pieces.slice(1).join("")}` : normalized;
  return Math.round(Number(merged) * 100) / 100;
}

export function formatMoney(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function sum(values: number[]): number {
  return Math.round(values.reduce((total, item) => total + item, 0) * 100) / 100;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

export function shiftMonth(month: string, offset: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function monthRange(month: string): { start: string; end: string } {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = `${month}-01`;
  const endDate = new Date(year, monthIndex, 0);
  const day = String(endDate.getDate()).padStart(2, "0");
  return { start, end: `${month}-${day}` };
}

export function formatMonthLabel(month: string): string {
  return month;
}
